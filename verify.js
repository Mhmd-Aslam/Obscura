// Self-contained verification for Obscura Crypto

// --- STUB MD5 to avoid imports ---
function md5(u8) {
    return "mock-md5-for-verification";
}

// --- CORE ENGINE ---
class CryptoEngine {
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
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        return crypto.subtle.deriveKey(
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
            const salt = crypto.getRandomValues(new Uint8Array(this.config.saltLength));
            const iv = crypto.getRandomValues(new Uint8Array(this.config.ivLength));
            const key = await this.deriveKey(password, salt);

            const enc = new TextEncoder();
            const encryptedBuffer = await crypto.subtle.encrypt(
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
            if (parts.length !== 3) throw new Error("Invalid format");
            const [saltB64, ivB64, cipherB64] = parts;
            const salt = this.base64ToBuffer(saltB64);
            const iv = this.base64ToBuffer(ivB64);
            const data = this.base64ToBuffer(cipherB64);
            const key = await this.deriveKey(password, salt);
            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: this.config.algoName, iv: iv },
                key,
                data
            );
            return new TextDecoder().decode(decryptedBuffer);
        } catch (err) {
            throw new Error("Decryption failed.");
        }
    }

    bufferToBase64(buffer) {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }

    base64ToBuffer(base64) {
        return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    }
}

// --- TESTS ---
async function run() {
    console.log("Starting Verification...");
    const engine = new CryptoEngine();
    const pass = "test-pass";
    const secret = "HELLO_WORLD";

    try {
        console.log("Testing text round-trip...");
        const packed = await engine.encrypt(secret, pass);
        const result = await engine.decrypt(packed, pass);

        if (result === secret) {
            console.log("✅ Success: Text decrypted correctly.");
        } else {
            console.log("❌ Failure: Mismatch.");
            process.exit(1);
        }

        console.log("Testing integrity with wrong password...");
        try {
            await engine.decrypt(packed, "wrong");
            console.log("❌ Failure: Should have failed.");
            process.exit(1);
        } catch (e) {
            console.log("✅ Success: Integrity check passed.");
        }

        console.log("\n--- VERIFIED: CORE ENGINE IS PERFECT ✅ ---");
    } catch (e) {
        console.error("FAILED with error:", e);
        process.exit(1);
    }
}

run();
