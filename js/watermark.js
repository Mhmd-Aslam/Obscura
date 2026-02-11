/**
 * Watermarking Engine
 * Provides watermarking capabilities for images and PDFs
 * 
 * Features:
 * 1. Visible Text Watermarking - Add text overlay to images
 * 2. Invisible Digital Watermarking - Embed hidden ownership data in images
 * 3. Watermark Extraction - Retrieve invisible watermarks from images
 * 4. PDF Watermarking - Add text watermarks to PDF documents
 */

import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

export class WatermarkEngine {

    constructor(cryptoEngine) {
        this.crypto = cryptoEngine;
    }

    /**
     * Add visible text watermark to an image
     * @param {File} imageFile - Source image
     * @param {string} text - Watermark text
     * @param {Object} options - Customization options
     * @returns {Promise<string>} - Data URL of watermarked image
     */
    async addVisibleWatermark(imageFile, text, options = {}) {
        const defaults = {
            position: 'bottom-right', // top-left, top-right, bottom-left, bottom-right, center
            fontSize: 72,
            fontFamily: 'Arial',
            color: '#808080',
            opacity: 0.3,
            rotation: -45, // degrees, 0 for no rotation
            padding: 20,
            style: 'normal' // normal, bold, italic
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

                // Draw original image
                ctx.drawImage(img, 0, 0);

                // Configure watermark style
                ctx.globalAlpha = config.opacity;
                ctx.fillStyle = config.color;

                const fontStyle = config.style === 'bold' ? 'bold ' :
                    config.style === 'italic' ? 'italic ' : '';
                ctx.font = `${fontStyle}${config.fontSize}px ${config.fontFamily}`;

                // Calculate position
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

                // Apply rotation if specified
                if (config.rotation !== 0) {
                    ctx.save();

                    // User requested: "move up and left"
                    const centerX = canvas.width / 2 - config.fontSize * 0.25;
                    const centerY = canvas.height / 2 - config.fontSize * 0.25;

                    ctx.translate(centerX, centerY);
                    ctx.rotate(config.rotation * Math.PI / 180);

                    // Advanced centering
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    ctx.fillText(text, 0, 0);
                    ctx.restore();
                } else {
                    ctx.fillText(text, x, y);
                }

                URL.revokeObjectURL(url);
                resolve(canvas.toDataURL('image/png'));
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };

            img.src = url;
        });
    }

    /**
     * Add invisible digital watermark using LSB steganography
     * @param {File} imageFile - Source image
     * @param {string} watermarkData - Data to embed (e.g., owner name, timestamp, UUID)
     * @param {string} password - Optional password for encryption
     * @returns {Promise<string>} - Data URL of watermarked image
     */
    async addInvisibleWatermark(imageFile, watermarkData, password = null) {
        const imageData = await this.fileToImageData(imageFile);
        const data = imageData.data;

        // Create a watermark payload with metadata
        const payload = {
            watermark: watermarkData,
            timestamp: Date.now(),
            version: '1.0'
        };

        let payloadString = JSON.stringify(payload);

        // Encrypt if password provided
        if (password && this.crypto) {
            payloadString = await this.crypto.encrypt(payloadString, password);
        }

        // Add signature prefix to identify watermarked images
        const signature = 'OBSCURA_WM';
        const fullPayload = signature + '||' + payloadString;

        // Convert to binary
        const binaryPayload = this.stringToBinary(fullPayload);
        const lengthHeader = binaryPayload.length.toString(2).padStart(32, '0');
        const fullBinary = lengthHeader + binaryPayload;

        // Check capacity
        const totalPixels = imageData.width * imageData.height;
        const availableBits = totalPixels * 3;

        if (fullBinary.length > availableBits) {
            throw new Error(`Watermark data too large for this image. Needed: ${fullBinary.length} bits, Available: ${availableBits} bits.`);
        }

        // Embed using LSB
        let bitIndex = 0;
        for (let i = 0; i < data.length && bitIndex < fullBinary.length; i += 4) {
            for (let j = 0; j < 3 && bitIndex < fullBinary.length; j++) {
                const bit = parseInt(fullBinary[bitIndex], 10);
                data[i + j] = (data[i + j] & 0xFE) | bit;
                bitIndex++;
            }
        }

        return this.imageDataToUrl(imageData);
    }

    /**
     * Extract invisible watermark from image
     * @param {File} imageFile - Watermarked image
     * @param {string} password - Optional password for decryption
     * @returns {Promise<Object>} - Extracted watermark data
     */
    async extractInvisibleWatermark(imageFile, password = null) {
        const imageData = await this.fileToImageData(imageFile);
        const data = imageData.data;

        // Read length header (32 bits)
        let lengthBinary = '';
        let bitIndex = 0;

        for (let i = 0; i < data.length && lengthBinary.length < 32; i += 4) {
            for (let j = 0; j < 3 && lengthBinary.length < 32; j++) {
                lengthBinary += (data[i + j] & 1);
            }
        }

        const messageLength = parseInt(lengthBinary, 2);

        if (messageLength <= 0 || messageLength > (data.length * 3)) {
            throw new Error('No watermark found or corrupted data');
        }

        // Read payload
        let payloadBinary = '';
        bitIndex = 32;

        for (let i = Math.floor(bitIndex / 3) * 4; i < data.length && payloadBinary.length < messageLength; i += 4) {
            for (let j = bitIndex % 3; j < 3 && payloadBinary.length < messageLength; j++) {
                payloadBinary += (data[i + j] & 1);
                bitIndex++;
            }
        }

        // Convert binary to string
        const extractedString = this.binaryToString(payloadBinary);

        // Check for signature
        if (!extractedString.startsWith('OBSCURA_WM||')) {
            throw new Error('No valid Obscura watermark found');
        }

        // Remove signature
        let payloadString = extractedString.substring('OBSCURA_WM||'.length);

        // Detect if payload is likely encrypted (not a JSON string starting with '{')
        const looksEncrypted = !payloadString.trim().startsWith('{');

        // If it looks encrypted but no password provided
        if (looksEncrypted && !password) {
            throw new Error('This watermark is password protected. Please enter the password.');
        }

        // Decrypt if password provided
        if (password && this.crypto) {
            try {
                payloadString = await this.crypto.decrypt(payloadString, password);
            } catch (err) {
                throw new Error('Failed to decrypt watermark. Incorrect password?');
            }
        }

        // Parse payload
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
            // If it still looks encrypted after attempted decryption, it was definitely incorrect
            if (looksEncrypted) {
                throw new Error('Could not parse watermark. The password might be incorrect or the data is corrupted.');
            }

            // If not JSON, return raw string (backward compatibility)
            return {
                watermark: payloadString,
                timestamp: null,
                timestampReadable: 'Unknown',
                version: 'Legacy',
                isProtected: false
            };
        }
    }

    /**
     * Add patterned watermark (repeating text across image)
     * @param {File} imageFile - Source image
     * @param {string} text - Watermark text
     * @param {Object} options - Customization options
     * @returns {Promise<string>} - Data URL of watermarked image
     */
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

                // Draw original image
                ctx.drawImage(img, 0, 0);

                // Configure watermark style
                ctx.globalAlpha = config.opacity;
                ctx.fillStyle = config.color;

                const fontStyle = config.style === 'bold' ? 'bold ' :
                    config.style === 'italic' ? 'italic ' : '';
                ctx.font = `${fontStyle}${config.fontSize}px ${config.fontFamily}`;

                // Calculate diagonal pattern
                const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);

                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(config.rotation * Math.PI / 180);

                // Draw repeating pattern
                const textMetrics = ctx.measureText(text);
                const textWidth = textMetrics.width;

                for (let x = -diagonal; x < diagonal; x += config.spacing + textWidth) {
                    for (let y = -diagonal; y < diagonal; y += config.spacing) {
                        ctx.fillText(text, x, y);
                    }
                }

                ctx.restore();

                URL.revokeObjectURL(url);
                resolve(canvas.toDataURL('image/png'));
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };

            img.src = url;
        });
    }

    /**
     * Add text watermark to PDF document
     * @param {File} pdfFile - Source PDF file
     * @param {string} text - Watermark text
     * @param {Object} options - Customization options
     * @returns {Promise<Blob>} - Watermarked PDF as Blob
     */
    async addPDFWatermark(pdfFile, text, options = {}) {
        const defaults = {
            position: 'bottom-right', // top-left, top-right, bottom-left, bottom-right, center
            fontSize: 72,
            color: { r: 0.5, g: 0.5, b: 0.5 }, // RGB 0-1, default gray
            opacity: 0.5,
            rotation: 0, // degrees
            padding: 50
        };

        const config = { ...defaults, ...options };

        try {
            // Read PDF file
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            // Embed font
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

            // Get all pages
            const pages = pdfDoc.getPages();

            // Add watermark to each page
            for (const page of pages) {
                const { width, height } = page.getSize();
                const textWidth = font.widthOfTextAtSize(text, config.fontSize);
                const textHeight = config.fontSize;

                // Calculate position
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
                            // Accurately center rotated text in PDF
                            const radians = (config.rotation * Math.PI) / 180;
                            const cos = Math.cos(radians);
                            const sin = Math.sin(radians);

                            // User requested: "move up and left"
                            const base_x = width / 2 - config.fontSize * 0.25;
                            const base_y = height / 2 + config.fontSize * 0.25; // PDF Y is bottom-up

                            // Displacement from origin to center for rotated text
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

                // Draw watermark
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

            // Save PDF
            const pdfBytes = await pdfDoc.save();
            return new Blob([pdfBytes], { type: 'application/pdf' });

        } catch (err) {
            throw new Error(`PDF watermarking failed: ${err.message}`);
        }
    }

    /**
     * Add diagonal pattern watermark to PDF
     * @param {File} pdfFile - Source PDF file
     * @param {string} text - Watermark text
     * @param {Object} options - Customization options
     * @returns {Promise<Blob>} - Watermarked PDF as Blob
     */
    async addPDFPatternWatermark(pdfFile, text, options = {}) {
        const defaults = {
            fontSize: 72,
            color: { r: 0.5, g: 0.5, b: 0.5 }, // Medium gray
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

                // Calculate diagonal coverage
                const diagonal = Math.sqrt(width ** 2 + height ** 2);

                // Draw repeating pattern
                for (let x = -diagonal; x < diagonal; x += config.spacing + textWidth) {
                    for (let y = -diagonal; y < diagonal; y += config.spacing) {
                        // Transform coordinates for diagonal placement
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

    // --- Helper Functions ---

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

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };

            img.src = url;
        });
    }

    imageDataToUrl(imageData) {
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL('image/png');
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
