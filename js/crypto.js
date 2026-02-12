import { md5 } from './md5.js';

/**
 * Obscura Cryptography Module
 * Handles AES-GCM encryption/decryption and PBKDF2 key derivation.
 */
export class CryptoEngine {
    constructor() {
        this.config = {
            algoName: 'AES-GCM',
            length: 256,
            hash: 'SHA-256',
            iterations: 100000,
            saltLength: 16,
            ivLength: 12
        };
    }

    async deriveKey(password, salt) {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        return window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: this.config.iterations,
                hash: this.config.hash
            },
            keyMaterial,
            { name: this.config.algoName, length: this.config.length },
            false,
            ["encrypt", "decrypt"]
        );
    }

    async encrypt(plaintext, password) {
        try {
            const salt = window.crypto.getRandomValues(new Uint8Array(this.config.saltLength));
            const iv = window.crypto.getRandomValues(new Uint8Array(this.config.ivLength));
            const key = await this.deriveKey(password, salt);

            const enc = new TextEncoder();
            const encryptedBuffer = await window.crypto.subtle.encrypt(
                { name: this.config.algoName, iv: iv },
                key,
                enc.encode(plaintext)
            );

            return `${this.bufferToBase64(salt)}:${this.bufferToBase64(iv)}:${this.bufferToBase64(encryptedBuffer)}`;
        } catch (err) {
            throw new Error(`Encryption failed: ${err.message}`);
        }
    }

    async decrypt(packedString, password) {
        try {
            const parts = packedString.trim().split(':');
            if (parts.length !== 3) {
                throw new Error("Invalid format. Expected 'salt:iv:ciphertext'.");
            }

            const [saltB64, ivB64, cipherB64] = parts;
            const salt = this.base64ToBuffer(saltB64);
            const iv = this.base64ToBuffer(ivB64);
            const data = this.base64ToBuffer(cipherB64);

            const key = await this.deriveKey(password, salt);

            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: this.config.algoName, iv: iv },
                key,
                data
            );

            const dec = new TextDecoder();
            return dec.decode(decryptedBuffer);
        } catch (err) {
            throw new Error("Decryption failed. Incorrect password or corrupted data.");
        }
    }

    async encryptFile(fileBuffer, password, metadata) {
        try {
            const salt = window.crypto.getRandomValues(new Uint8Array(this.config.saltLength));
            const iv = window.crypto.getRandomValues(new Uint8Array(this.config.ivLength));
            const key = await this.deriveKey(password, salt);

            const metaEnc = new TextEncoder();
            const encryptedMeta = await window.crypto.subtle.encrypt(
                { name: this.config.algoName, iv: iv },
                key,
                metaEnc.encode(JSON.stringify(metadata))
            );

            const encryptedData = await window.crypto.subtle.encrypt(
                { name: this.config.algoName, iv: iv },
                key,
                fileBuffer
            );

            const packed = `${this.bufferToBase64(salt)}:${this.bufferToBase64(iv)}:${this.bufferToBase64(encryptedMeta)}:${this.bufferToBase64(encryptedData)}`;
            return new Blob([packed], { type: 'application/octet-stream' });
        } catch (err) {
            throw new Error(`File encryption failed: ${err.message}`);
        }
    }

    async decryptFile(obsBlob, password) {
        try {
            const text = await obsBlob.text();
            const parts = text.split(':');
            if (parts.length !== 4) throw new Error("Invalid .obs file format");

            const [saltB64, ivB64, metaB64, dataB64] = parts;
            const salt = this.base64ToBuffer(saltB64);
            const iv = this.base64ToBuffer(ivB64);
            const encryptedMeta = this.base64ToBuffer(metaB64);
            const encryptedData = this.base64ToBuffer(dataB64);

            const key = await this.deriveKey(password, salt);

            const metaBuffer = await window.crypto.subtle.decrypt(
                { name: this.config.algoName, iv: iv },
                key,
                encryptedMeta
            );
            const metadata = JSON.parse(new TextDecoder().decode(metaBuffer));

            const dataBuffer = await window.crypto.subtle.decrypt(
                { name: this.config.algoName, iv: iv },
                key,
                encryptedData
            );

            return {
                blob: new Blob([dataBuffer], { type: metadata.type || 'application/octet-stream' }),
                filename: metadata.filename
            };
        } catch (err) {
            throw new Error("File decryption failed. Incorrect password or corrupted file.");
        }
    }

    async hash(input, algo = 'SHA-256') {
        let data;
        if (input instanceof File || input instanceof Blob || input instanceof ArrayBuffer) {
            data = (input instanceof ArrayBuffer) ? input : await input.arrayBuffer();
        } else {
            data = new TextEncoder().encode(input);
        }

        if (algo === 'MD5') return md5(data);

        const hashBuffer = await window.crypto.subtle.digest(algo, data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    bufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    base64ToBuffer(base64) {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes;
    }
}
