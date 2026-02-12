import { CryptoEngine } from './js/crypto.js';

async function runTests() {
    console.log("--- Obscura Crypto Verification (Bun) ---");
    const engine = new CryptoEngine();
    const password = "secure-password-123";
    const text = "Hello World! This is a test of the Obscura encryption system.";

    try {
        // 1. Text Encryption
        console.log("Testing Text Encryption...");
        const encrypted = await engine.encrypt(text, password);
        console.log("   - Encrypted output received.");

        const decrypted = await engine.decrypt(encrypted, password);
        if (decrypted === text) {
            console.log("   ✅ SUCCESS: Decrypted text matches original.");
        } else {
            console.log("   ❌ FAILURE: Decrypted text mismatch!");
            process.exit(1);
        }

        // 2. Auth Failure
        console.log("\nTesting Integrity (Incorrect Password)...");
        try {
            await engine.decrypt(encrypted, "wrong-password");
            console.log("   ❌ FAILURE: Decryption should have failed!");
            process.exit(1);
        } catch (e) {
            console.log("   ✅ SUCCESS: Correctly failed with 'Decryption failed...' error.");
        }

        // 3. File Encryption Mock
        console.log("\nTesting File Encryption...");
        const fileName = "test.txt";
        const fileType = "text/plain";
        const fileContent = new TextEncoder().encode(text).buffer;
        const metadata = { filename: fileName, type: fileType, size: fileContent.byteLength };

        const blob = await engine.encryptFile(fileContent, password, metadata);
        // Bun Blob.text() works
        const result = await engine.decryptFile(blob, password);

        const decryptedContent = await result.blob.arrayBuffer();
        const decryptedText = new TextDecoder().decode(decryptedContent);

        if (decryptedText === text && result.filename === fileName) {
            console.log("   ✅ SUCCESS: File content and metadata preserved.");
        } else {
            console.log("   ❌ FAILURE: File decryption result mismatch!");
            process.exit(1);
        }

        console.log("\n--- CORE ENCRYPTION ENGINE: VERIFIED ✅ ---");
    } catch (err) {
        console.error("Unexpected Test Error:", err);
        process.exit(1);
    }
}

runTests();
