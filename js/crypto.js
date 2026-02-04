/**
 * Obscura Cryptography Module
 * 
 * Implements AES-GCM encryption with PBKDF2 key derivation.
 * - Uses native Web Crypto API (SubtleCrypto)
 * - Zero external dependencies
 * - Secure defaults (12-byte IV, 256-bit key, 100k iterations)
 */

export class CryptoEngine {
    constructor() {
        this.config = {
            algoName: 'AES-GCM',
            length: 256,
            hash: 'SHA-256',
            iterations: 100000, // OWASP recommended minimum for PBKDF2 defaults
            saltLength: 16,
            ivLength: 12        // Standard for GCM
        };
    }

    /**
     * Converts a raw password into a cryptographic key.
     * Use PBKDF2 to stretch the password and make brute-force harder.
     */
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

    /**
     * Encrypts plaintext and returns a packed format string.
     * Format: salt_b64:iv_b64:ciphertext_b64
     */
    async encrypt(plaintext, password) {
        try {
            // 1. Generate random artifacts
            const salt = window.crypto.getRandomValues(new Uint8Array(this.config.saltLength));
            const iv = window.crypto.getRandomValues(new Uint8Array(this.config.ivLength));

            // 2. Derive Key
            const key = await this.deriveKey(password, salt);

            // 3. Encrypt
            const enc = new TextEncoder();
            const encryptedBuffer = await window.crypto.subtle.encrypt(
                { name: this.config.algoName, iv: iv },
                key,
                enc.encode(plaintext)
            );

            // 4. Return as packed string
            const saltB64 = this.bufferToBase64(salt);
            const ivB64 = this.bufferToBase64(iv);
            const cipherB64 = this.bufferToBase64(encryptedBuffer);

            // Using ':' as a safe delimiter for Base64 strings
            return `${saltB64}:${ivB64}:${cipherB64}`;

        } catch (err) {
            throw new Error(`Encryption failed: ${err.message}`);
        }
    }

    /**
     * Decrypts a packed cipher string.
     * Expects format: salt:iv:ciphertext
     */
    async decrypt(packedString, password) {
        try {
            // 1. Unpack
            const parts = packedString.trim().split(':');
            if (parts.length !== 3) {
                throw new Error("Invalid format. Expected 'salt:iv:ciphertext'.");
            }

            const [saltB64, ivB64, cipherB64] = parts;

            const salt = this.base64ToBuffer(saltB64);
            const iv = this.base64ToBuffer(ivB64);
            const data = this.base64ToBuffer(cipherB64);

            // 2. Derive Key (must replicate generation)
            const key = await this.deriveKey(password, salt);

            // 3. Decrypt
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: this.config.algoName, iv: iv },
                key,
                data
            );

            // 4. Decode to string
            const dec = new TextDecoder();
            return dec.decode(decryptedBuffer);
        } catch (err) {
            console.error(err);
            // AES-GCM throws if authentication tag doesn't match
            throw new Error("Decryption failed. Incorrect password or corrupted data.");
        }
    }

    // --- Hashing ---

    async computeHash(message, algo = 'SHA-256') {
        const enc = new TextEncoder();
        const data = enc.encode(message);
        const hashBuffer = await window.crypto.subtle.digest(algo, data);

        // Convert buffer to Hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    // --- Helpers ---

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
