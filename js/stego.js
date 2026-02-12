/**
 * Steganography Engine
 * Implements Least Significant Bit (LSB) steganography on images.
 */

export class StegoEngine {
    constructor(cryptoEngine) {
        this.crypto = cryptoEngine;
    }

    async encode(imageFile, message, password = null) {
        const imageData = await this.fileToImageData(imageFile);
        const data = imageData.data;

        let payloadContent = message;
        if (password) {
            if (!this.crypto) throw new Error("CryptoEngine not initialized in StegoEngine");
            payloadContent = await this.crypto.encrypt(message, password);
        }

        const binaryMessage = this.stringToBinary(payloadContent);
        const lengthHeader = binaryMessage.length.toString(2).padStart(32, '0');
        const fullPayload = lengthHeader + binaryMessage;

        const totalPixels = imageData.width * imageData.height;
        const availableBits = totalPixels * 3;

        if (fullPayload.length > availableBits) {
            throw new Error(`Message too long for this image. Needed: ${fullPayload.length} bits, Available: ${availableBits} bits.`);
        }

        let payloadIndex = 0;
        for (let i = 0; i < data.length; i += 4) {
            for (let j = 0; j < 3; j++) {
                if (payloadIndex < fullPayload.length) {
                    const currentByte = data[i + j];
                    const bit = parseInt(fullPayload[payloadIndex], 10);
                    data[i + j] = (currentByte & 0xFE) | bit;
                    payloadIndex++;
                } else {
                    break;
                }
            }
            if (payloadIndex >= fullPayload.length) break;
        }

        return this.imageDataToUrl(imageData);
    }

    async decode(imageFile, password = null) {
        const imageData = await this.fileToImageData(imageFile);
        const data = imageData.data;

        let binaryString = '';
        let lengthHeader = '';
        let messageLength = 0;
        let isReadingHeader = true;
        let extractedText = '';

        for (let i = 0; i < data.length; i += 4) {
            for (let j = 0; j < 3; j++) {
                const bit = data[i + j] & 1;

                if (isReadingHeader) {
                    lengthHeader += bit;
                    if (lengthHeader.length === 32) {
                        messageLength = parseInt(lengthHeader, 2);
                        isReadingHeader = false;
                        if (messageLength <= 0 || messageLength > (data.length * 3)) {
                            // Invalid header detection
                        }
                    }
                } else {
                    binaryString += bit;
                    if (binaryString.length === messageLength) {
                        extractedText = this.binaryToString(binaryString);

                        if (password) {
                            if (!this.crypto) throw new Error("CryptoEngine not initialized in StegoEngine");
                            return await this.crypto.decrypt(extractedText, password);
                        }
                        return extractedText;
                    }
                }
            }
            if (!isReadingHeader && binaryString.length >= messageLength) break;
        }

        return '';
    }

    fileToImageData(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    imageDataToUrl(imageData) {
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL();
    }

    stringToBinary(str) {
        let binary = '';
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            binary += code.toString(2).padStart(16, '0');
        }
        return binary;
    }

    binaryToString(binary) {
        let str = '';
        for (let i = 0; i < binary.length; i += 16) {
            const byte = binary.substr(i, 16);
            str += String.fromCharCode(parseInt(byte, 2));
        }
        return str;
    }
}
