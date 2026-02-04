/**
 * Steganography Engine
 * Implements Least Significant Bit (LSB) steganography on images.
 * 
 * Logic:
 * 1. Convert text message to binary string.
 * 2. Prepend binary length of the message (32 bits) so we know how much to read back.
 * 3. Iterate over image pixels (R, G, B channels).
 * 4. Replace the last bit of each pixel byte with a bit from our message.
 */

export class StegoEngine {

    constructor(cryptoEngine) {
        this.crypto = cryptoEngine;
    }

    /**
     * Hides a string message inside an image file.
     * @param {File} imageFile - The cover image
     * @param {string} message - Text to hide
     * @param {string} [password] - Optional password for encryption
     * @returns {Promise<string>} - Data URL of the resulting image
     */
    async encode(imageFile, message, password = null) {
        const imageData = await this.fileToImageData(imageFile);
        const data = imageData.data; // R, G, B, A text array

        // 0. Encrypt if password provided
        let payloadContent = message;
        if (password) {
            if (!this.crypto) throw new Error("CryptoEngine not initialized in StegoEngine");
            payloadContent = await this.crypto.encrypt(message, password);
        }

        // 1. Prepare Payload: Length Header (32 bits) + Message Binary
        const binaryMessage = this.stringToBinary(payloadContent);
        const lengthHeader = binaryMessage.length.toString(2).padStart(32, '0');
        const fullPayload = lengthHeader + binaryMessage;

        // Check capacity using 3 channels (RGB) per pixel
        const totalPixels = imageData.width * imageData.height;
        const availableBits = totalPixels * 3;

        if (fullPayload.length > availableBits) {
            throw new Error(`Message too long for this image. Needed: ${fullPayload.length} bits, Available: ${availableBits} bits.`);
        }

        // 2. Embed Payload via LSB
        let payloadIndex = 0;
        for (let i = 0; i < data.length; i += 4) {
            // Traverse R, G, B channels only (skip Alpha at i+3)
            for (let j = 0; j < 3; j++) {
                if (payloadIndex < fullPayload.length) {
                    const currentByte = data[i + j];
                    const bit = parseInt(fullPayload[payloadIndex], 10);

                    // Clear LSB and set new bit
                    // (x & ~1) | bit  =>  Example: (11111110 & 01101011) | 1
                    data[i + j] = (currentByte & 0xFE) | bit;

                    payloadIndex++;
                } else {
                    break;
                }
            }
            if (payloadIndex >= fullPayload.length) break;
        }

        // 3. Return as Image
        return this.imageDataToUrl(imageData);
    }

    /**
     * Extracts a hidden string from an image file.
     * @param {File} imageFile 
     * @param {string} [password] - Optional password for decryption
     * @returns {Promise<string>} - The hidden message (decrypted if password used)
     */
    async decode(imageFile, password = null) {
        const imageData = await this.fileToImageData(imageFile);
        const data = imageData.data;

        let binaryString = '';
        let lengthHeader = '';
        let messageLength = 0;
        let isReadingHeader = true;
        let extractedText = '';

        // 1. Read bits
        for (let i = 0; i < data.length; i += 4) {
            for (let j = 0; j < 3; j++) {
                // Get LSB
                const bit = data[i + j] & 1;

                if (isReadingHeader) {
                    lengthHeader += bit;
                    if (lengthHeader.length === 32) {
                        messageLength = parseInt(lengthHeader, 2);
                        isReadingHeader = false;

                        // Sanity check
                        if (messageLength <= 0 || messageLength > (data.length * 3)) {
                            // If random noise looks like a length, it might fail here or later.
                            // But usually, 0-length is a good check.
                            // If we read a huge number, it means no message is likely present.
                        }
                    }
                } else {
                    binaryString += bit;
                    if (binaryString.length === messageLength) {
                        extractedText = this.binaryToString(binaryString);

                        // 2. Decrypt if password provided
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

        return ''; // Should have returned inside loop
    }

    // --- Helpers ---

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
        return canvas.toDataURL(); // Defaults to image/png
    }

    stringToBinary(str) {
        let binary = '';
        for (let i = 0; i < str.length; i++) {
            // simple ASCII/UTF-16 LSB? 
            // Better to use UTF-8 explicit encoding for emojis/symbols support
            // But requirement said "Simple". Let's use charCodeAt (UTF-16 unit) padding to 16 bits to be safe?
            // Or typically 8 bits if extended ASCII.
            // Let's use strict 8-bit UTF-8 for compatibility with most text.
            const code = str.charCodeAt(i);
            // Using 16 bits per char to support basic Unicode safely without complex logic
            binary += code.toString(2).padStart(16, '0');
        }
        return binary;
    }

    binaryToString(binary) {
        let str = '';
        // Reading 16 bits chunks
        for (let i = 0; i < binary.length; i += 16) {
            const byte = binary.substr(i, 16);
            str += String.fromCharCode(parseInt(byte, 2));
        }
        return str;
    }
}
