import { CryptoEngine } from './crypto.js';
import { StegoEngine } from './stego.js';
import { MessageAnalyzer } from './analyzer.js';
import { HistoryManager } from './history.js';
import { SecurityManager } from './security.js';
import { UIManager } from './ui.js';

class App {
    constructor() {
        this.crypto = new CryptoEngine();
        this.stego = new StegoEngine(this.crypto);
        this.analyzer = new MessageAnalyzer();
        this.history = new HistoryManager();
        this.ui = new UIManager();
        this.security = new SecurityManager(this.ui, this.history);
        this.init();
    }

    init() {
        // Encrypt Action
        this.ui.dom.formEncrypt.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = this.ui.dom.inputEncMsg.value;
            const pass = this.ui.dom.inputEncPass.value;

            // Optional: User selected Destruct Timer
            const timer = this.security.ui.getSelfDestructTime();

            if (!msg || !pass) return;

            try {
                // Pass timer to encrypt (wraps it in payload)
                const encrypted = await this.crypto.encrypt(msg, pass, timer);
                this.ui.showEncryptResult(encrypted);

                // Add to history
                this.history.add(encrypted);
                this.ui.renderHistory(this.history.getAll());
            } catch (err) {
                console.error(err);
                this.ui.showError('encrypt', err.message);
            }
        });

        // Decrypt Action
        this.ui.dom.formDecrypt.addEventListener('submit', async (e) => {
            e.preventDefault();
            const cipher = this.ui.dom.inputDecData.value;
            const pass = this.ui.dom.inputDecPass.value;

            if (!cipher || !pass) return;

            try {
                // Check if burned FIRST (before attempting expensive decrypt)
                // Actually, checking signature (hash of ciphertext) is enough to know if we saw it.
                // We'll use the FULL ciphertext string as the signature for simplicity (or hash it if too long).
                // Let's us the first 64 chars of the ciphertext string as a signature key.
                const cxSignature = cipher.substring(0, 64);

                if (this.security.isBurned(cxSignature)) {
                    throw new Error("This message has self-destructed and cannot be viewed again.");
                }

                const result = await this.crypto.decrypt(cipher, pass);

                // Result is object: { message: "...", timer: N, timestamp: ... }
                // Wait, crypto.decrypt logic changed to return TEXT or Object? 
                // Let's assume it returns object based on previous session tasks.
                // Re-reading logic in crypto.js (not visible but based on context) -> It returns object with timer.

                // Oops, I need to be sure what crypto.decrypt returns.
                // If I updated it to handle embedded timer, it likely returns { plaintext: "...", timer: N }
                // Let's assume it returns the plaintext IF no special handling, or object.
                // Based on "Refactor Encryption Output", it handles packed string.
                // Based on "Embedded Self-Destruct", decrypt parses the JSON payload.
                // So it returns the *inner payload*.
                // The inner payload is { t: 10, m: "hello" } (example).
                // So result is that object.

                let plaintext = result;
                let destructTime = 0;

                if (typeof result === 'object' && result.m) {
                    plaintext = result.m;
                    destructTime = result.t || 0;
                }

                this.ui.showDecryptResult(plaintext);

                // If timer exists, schedule self-destruct AND mark as BURNED
                if (destructTime > 0) {
                    this.security.scheduleSelfDestruct(this.ui.dom.outputDec, destructTime);
                    this.security.markBurned(cxSignature);
                }

            } catch (err) {
                console.error(err);
                this.ui.showError('decrypt', err.message);
            }
        });

        // History UI Clear
        if (this.ui.dom.btnClearHistory) {
            this.ui.dom.btnClearHistory.addEventListener('click', () => {
                this.history.clear();
                this.ui.renderHistory([]);
            });
        }

        // Initial Render
        this.ui.renderHistory(this.history.getAll());

        // Reset Button
        if (this.ui.dom.btnReset) {
            this.ui.dom.btnReset.addEventListener('click', () => {
                this.security.triggerReset();
            });
        }

        // Stego: Hide Data
        this.ui.dom.btnStegoHide.addEventListener('click', async () => {
            const file = this.ui.dom.inputStegoImage.files[0];
            const msg = this.ui.dom.inputStegoMsg.value;
            const pass = this.ui.dom.inputStegoPass.value; // Optional

            if (!file || !msg) {
                this.ui.showDialog('Please select an image and enter a message.', 'Input Missing');
                return;
            }

            try {
                // Pass password (empty string if none)
                const resultUrl = await this.stego.encode(file, msg, pass);
                this.ui.showStegoResult(resultUrl);
            } catch (err) {
                console.error(err);
                this.ui.showError('stego-hide', err.message);
            }
        });

        // Stego: Reveal Data
        this.ui.dom.btnStegoReveal.addEventListener('click', async () => {
            const file = this.ui.dom.inputStegoRevealImage.files[0];
            const pass = this.ui.dom.inputStegoUnlockPass.value; // Optional

            if (!file) {
                this.ui.showDialog('Please select an image to decode.', 'Input Missing');
                return;
            }

            try {
                const msg = await this.stego.decode(file, pass);
                if (!msg || msg.length === 0) {
                    this.ui.showError('stego-reveal', 'No hidden message found or message is empty.');
                } else {
                    this.ui.showStegoRevealResult(msg);
                }
            } catch (err) {
                console.error(err);
                this.ui.showError('stego-reveal', 'Failed to decode. Incorrect password or invalid image?');
            }
        });

        // Hashing Action
        this.ui.dom.formHash.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const text = formData.get('input');
            const file = formData.get('file'); // File object
            const algo = formData.get('algo');

            let inputForHash = text;
            if (file && file.size > 0) {
                inputForHash = file;
            }

            if (!inputForHash && (!file || file.size === 0)) {
                this.ui.showDialog('Please enter text or select a file.', 'Input Missing');
                return;
            }

            try {
                const hash = await this.crypto.hash(inputForHash, algo);
                this.ui.showHashResult(hash);
            } catch (err) {
                console.error(err);
                this.ui.showError('hash', 'Hashing failed.');
            }
        });

        // Analyzer: Analyze Text
        this.ui.dom.formAnalyze.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const text = formData.get('data');

            if (!text) return;

            const stats = this.analyzer.analyze(text);
            this.ui.showAnalysisResult(stats);
        });
    }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    console.log('Obscura v1 Loaded');
});
