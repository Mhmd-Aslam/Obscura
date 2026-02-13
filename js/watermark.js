/**
 * Watermarking Engine
 * Provides watermarking capabilities for images and PDFs.
 */

import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

export class WatermarkEngine {

    constructor(cryptoEngine) {
        this.crypto = cryptoEngine;
    }

    async addVisibleWatermark(imageFile, text, options = {}) {
        const defaults = {
            position: 'bottom-right',
            fontSize: 72,
            fontFamily: 'Arial',
            color: '#808080',
            opacity: 0.3,
            rotation: -45,
            padding: 20,
            style: 'normal'
        };

        const config = { ...defaults, ...options };

        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(imageFile);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');

                ctx.drawImage(img, 0, 0);
                ctx.globalAlpha = config.opacity;
                ctx.fillStyle = config.color;

                const fontStyle = config.style === 'bold' ? 'bold ' :
                    config.style === 'italic' ? 'italic ' : '';
                ctx.font = `${fontStyle}${config.fontSize}px ${config.fontFamily}`;

                const textMetrics = ctx.measureText(text);
                const textWidth = textMetrics.width;
                const textHeight = config.fontSize;

                let x, y;

                switch (config.position) {
                    case 'top-left':
                        x = config.padding;
                        y = config.padding + textHeight;
                        break;
                    case 'top-right':
                        x = canvas.width - textWidth - config.padding;
                        y = config.padding + textHeight;
                        break;
                    case 'bottom-left':
                        x = config.padding;
                        y = canvas.height - config.padding;
                        break;
                    case 'bottom-right':
                        x = canvas.width - textWidth - config.padding;
                        y = canvas.height - config.padding;
                        break;
                    case 'center':
                        x = (canvas.width - textWidth) / 2;
                        y = (canvas.height + textHeight) / 2;
                        break;
                    default:
                        x = canvas.width - textWidth - config.padding;
                        y = canvas.height - config.padding;
                }

                if (config.rotation !== 0) {
                    ctx.save();
                    const centerX = canvas.width / 2 - config.fontSize * 0.25;
                    const centerY = canvas.height / 2 - config.fontSize * 0.25;

                    ctx.translate(centerX, centerY);
                    ctx.rotate(config.rotation * Math.PI / 180);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, 0, 0);
                    ctx.restore();
                } else {
                    ctx.fillText(text, x, y);
                }

                URL.revokeObjectURL(url);
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/png');
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };

            img.src = url;
        });
    }

    async addInvisibleWatermark(imageFile, watermarkData, password = null) {
        const imageData = await this.fileToImageData(imageFile);
        const data = imageData.data;

        const payload = {
            watermark: watermarkData,
            timestamp: Date.now(),
            version: '1.0'
        };

        let payloadString = JSON.stringify(payload);

        if (password && this.crypto) {
            payloadString = await this.crypto.encrypt(payloadString, password);
        }

        const signature = 'OBSCURA_WM';
        const fullPayload = signature + '||' + payloadString;

        const binaryPayload = this.stringToBinary(fullPayload);
        const lengthHeader = binaryPayload.length.toString(2).padStart(32, '0');
        const fullBinary = lengthHeader + binaryPayload;

        const totalPixels = imageData.width * imageData.height;
        const availableBits = totalPixels * 3;

        if (fullBinary.length > availableBits) {
            throw new Error(`Watermark data too large for this image. Needed: ${fullBinary.length} bits, Available: ${availableBits} bits.`);
        }

        let bitIndex = 0;
        for (let i = 0; i < data.length && bitIndex < fullBinary.length; i += 4) {
            for (let j = 0; j < 3 && bitIndex < fullBinary.length; j++) {
                const bit = parseInt(fullBinary[bitIndex], 10);
                data[i + j] = (data[i + j] & 0xFE) | bit;
                bitIndex++;
            }
            // Critical fix: Force alpha to 255 to prevent data loss in transparent pixels
            data[i + 3] = 255;
        }

        return this.imageDataToBlobUrl(imageData);
    }

    async extractInvisibleWatermark(imageFile, password = null) {
        const imageData = await this.fileToImageData(imageFile);
        const data = imageData.data;

        let lengthBinary = '';
        for (let i = 0; i < data.length && lengthBinary.length < 32; i += 4) {
            for (let j = 0; j < 3 && lengthBinary.length < 32; j++) {
                lengthBinary += (data[i + j] & 1);
            }
        }

        const messageLength = parseInt(lengthBinary, 2);
        if (messageLength <= 0 || messageLength > (data.length * 3)) {
            throw new Error('No watermark found or corrupted data');
        }

        let payloadBinary = '';
        let bitIndex = 32;

        for (let i = Math.floor(bitIndex / 3) * 4; i < data.length && payloadBinary.length < messageLength; i += 4) {
            for (let j = bitIndex % 3; j < 3 && payloadBinary.length < messageLength; j++) {
                payloadBinary += (data[i + j] & 1);
                bitIndex++;
            }
        }

        const extractedString = this.binaryToString(payloadBinary);
        if (!extractedString.startsWith('OBSCURA_WM||')) {
            throw new Error('No valid Obscura watermark found');
        }

        let payloadString = extractedString.substring('OBSCURA_WM||'.length);
        const looksEncrypted = !payloadString.trim().startsWith('{');

        if (looksEncrypted && !password) {
            throw new Error('This watermark is password protected. Please enter the password.');
        }

        if (password && this.crypto) {
            try {
                payloadString = await this.crypto.decrypt(payloadString, password);
            } catch (err) {
                throw new Error('Failed to decrypt watermark. Incorrect password?');
            }
        }

        try {
            const payload = JSON.parse(payloadString);
            return {
                watermark: payload.watermark,
                timestamp: payload.timestamp,
                timestampReadable: new Date(payload.timestamp).toLocaleString(),
                version: payload.version,
                isProtected: looksEncrypted
            };
        } catch (err) {
            if (looksEncrypted) {
                throw new Error('Could not parse watermark. Password might be incorrect or data corrupted.');
            }

            return {
                watermark: payloadString,
                timestamp: null,
                timestampReadable: 'Unknown',
                version: 'Legacy',
                isProtected: false
            };
        }
    }

    async addPatternWatermark(imageFile, text, options = {}) {
        const defaults = {
            fontSize: 20,
            fontFamily: 'Arial',
            color: '#FFFFFF',
            opacity: 0.15,
            rotation: -45,
            spacing: 150,
            style: 'normal'
        };

        const config = { ...defaults, ...options };

        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(imageFile);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');

                ctx.drawImage(img, 0, 0);
                ctx.globalAlpha = config.opacity;
                ctx.fillStyle = config.color;

                const fontStyle = config.style === 'bold' ? 'bold ' :
                    config.style === 'italic' ? 'italic ' : '';
                ctx.font = `${fontStyle}${config.fontSize}px ${config.fontFamily}`;

                const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);

                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(config.rotation * Math.PI / 180);

                const textMetrics = ctx.measureText(text);
                const textWidth = textMetrics.width;

                for (let x = -diagonal; x < diagonal; x += config.spacing + textWidth) {
                    for (let y = -diagonal; y < diagonal; y += config.spacing) {
                        ctx.fillText(text, x, y);
                    }
                }

                ctx.restore();
                URL.revokeObjectURL(url);
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/png');
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };

            img.src = url;
        });
    }

    async addPDFWatermark(pdfFile, text, options = {}) {
        const defaults = {
            position: 'bottom-right',
            fontSize: 72,
            color: { r: 0.5, g: 0.5, b: 0.5 },
            opacity: 0.5,
            rotation: 0,
            padding: 50
        };

        const config = { ...defaults, ...options };

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const pages = pdfDoc.getPages();

            for (const page of pages) {
                const { width, height } = page.getSize();
                const textWidth = font.widthOfTextAtSize(text, config.fontSize);
                const textHeight = config.fontSize;

                let x, y;

                switch (config.position) {
                    case 'top-left':
                        x = config.padding;
                        y = height - config.padding - textHeight;
                        break;
                    case 'top-right':
                        x = width - textWidth - config.padding;
                        y = height - config.padding - textHeight;
                        break;
                    case 'bottom-left':
                        x = config.padding;
                        y = config.padding;
                        break;
                    case 'bottom-right':
                        x = width - textWidth - config.padding;
                        y = config.padding;
                        break;
                    case 'center':
                        if (config.rotation !== 0) {
                            const radians = (config.rotation * Math.PI) / 180;
                            const cos = Math.cos(radians);
                            const sin = Math.sin(radians);
                            const base_x = width / 2 - config.fontSize * 0.25;
                            const base_y = height / 2 + config.fontSize * 0.25;
                            x = base_x - (textWidth / 2 * cos - textHeight / 2 * sin);
                            y = base_y - (textWidth / 2 * sin + textHeight / 2 * cos);
                        } else {
                            x = (width - textWidth) / 2;
                            y = (height - textHeight) / 2;
                        }
                        break;
                    default:
                        x = width - textWidth - config.padding;
                        y = config.padding;
                }

                page.drawText(text, {
                    x: x,
                    y: y,
                    size: config.fontSize,
                    font: font,
                    color: rgb(config.color.r, config.color.g, config.color.b),
                    opacity: config.opacity,
                    rotate: degrees(config.rotation)
                });
            }

            const pdfBytes = await pdfDoc.save();
            return new Blob([pdfBytes], { type: 'application/pdf' });
        } catch (err) {
            throw new Error(`PDF watermarking failed: ${err.message}`);
        }
    }

    async addPDFPatternWatermark(pdfFile, text, options = {}) {
        const defaults = {
            fontSize: 72,
            color: { r: 0.5, g: 0.5, b: 0.5 },
            opacity: 0.2,
            rotation: -45,
            spacing: 200
        };

        const config = { ...defaults, ...options };

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const pages = pdfDoc.getPages();

            for (const page of pages) {
                const { width, height } = page.getSize();
                const textWidth = font.widthOfTextAtSize(text, config.fontSize);
                const diagonal = Math.sqrt(width ** 2 + height ** 2);

                for (let x = -diagonal; x < diagonal; x += config.spacing + textWidth) {
                    for (let y = -diagonal; y < diagonal; y += config.spacing) {
                        const centerX = width / 2;
                        const centerY = height / 2;
                        const radians = (config.rotation * Math.PI) / 180;
                        const cos = Math.cos(radians);
                        const sin = Math.sin(radians);

                        const rotatedX = x * cos - y * sin + centerX;
                        const rotatedY = x * sin + y * cos + centerY;

                        page.drawText(text, {
                            x: rotatedX,
                            y: rotatedY,
                            size: config.fontSize,
                            font: font,
                            color: rgb(config.color.r, config.color.g, config.color.b),
                            opacity: config.opacity,
                            rotate: degrees(config.rotation)
                        });
                    }
                }
            }

            const pdfBytes = await pdfDoc.save();
            return new Blob([pdfBytes], { type: 'application/pdf' });
        } catch (err) {
            throw new Error(`PDF pattern watermarking failed: ${err.message}`);
        }
    }

    async fileToImageData(file) {
        // Method 1: createImageBitmap (Modern, prevents color mutation)
        if (window.createImageBitmap) {
            try {
                const imgBitmap = await createImageBitmap(file, {
                    colorSpaceConversion: 'none',
                    resizeQuality: 'pixelated'
                });

                const canvas = document.createElement('canvas');
                canvas.width = imgBitmap.width;
                canvas.height = imgBitmap.height;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(imgBitmap, 0, 0);

                // Cleanup
                imgBitmap.close();

                return ctx.getImageData(0, 0, canvas.width, canvas.height);

            } catch (err) {
                console.warn('createImageBitmap failed, falling back to standard Image:', err);
            }
        }

        // Method 2: Standard Image (Fallback)
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };

            img.src = url;
        });
    }

    imageDataToBlobUrl(imageData) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            const ctx = canvas.getContext('2d');
            ctx.putImageData(imageData, 0, 0);
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/png');
        });
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
            if (byte.length === 16) {
                str += String.fromCharCode(parseInt(byte, 2));
            }
        }
        return str;
    }
}
