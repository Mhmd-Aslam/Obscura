import { CryptoEngine } from './crypto.js';
import { StegoEngine } from './stego.js';
import { WatermarkEngine } from './watermark.js';
import { MessageAnalyzer } from './analyzer.js';
import { HistoryManager } from './history.js';
import { SecurityManager } from './security.js';
import { UIManager } from './ui.js';

class App {
    constructor() {
        this.crypto = new CryptoEngine();
        this.stego = new StegoEngine(this.crypto);
        this.watermark = new WatermarkEngine(this.crypto);
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

            // Check if in file mode
            const isFileMode = this.ui.dom.btnFileMode && this.ui.dom.btnFileMode.classList.contains('active');
            const pass = this.ui.dom.inputEncPass.value;

            if (!pass) return;

            try {
                if (isFileMode) {
                    // File encryption
                    const file = this.ui.dom.inputEncFile.files[0];
                    if (!file) {
                        throw new Error("Please select a file to encrypt");
                    }

                    const fileBuffer = await file.arrayBuffer();
                    const metadata = {
                        filename: file.name,
                        type: file.type,
                        size: file.size,
                        timestamp: Date.now()
                    };

                    const encryptedBlob = await this.crypto.encryptFile(fileBuffer, pass, metadata);

                    // Download as .obs file
                    const downloadName = file.name.replace(/\.[^/.]+$/, '') + '.obs';
                    this.downloadFile(encryptedBlob, downloadName);

                    // Show success
                    this.ui.showEncryptResult(`✅ File encrypted! Download started: ${downloadName}`);
                } else {
                    // Text encryption
                    const msg = this.ui.dom.inputEncMsg.value;

                    if (!msg) return;

                    const encrypted = await this.crypto.encrypt(msg, pass);
                    this.ui.showEncryptResult(encrypted);

                    // Add to history
                    this.history.add(encrypted);
                    this.ui.renderHistory(this.history.getAll());

                    // Reset form
                    this.ui.dom.formEncrypt.reset();
                }
            } catch (err) {
                console.error(err);
                this.ui.showError('encrypt', err.message);
            }
        });

        // ... (File Encryption Form Handler) ...
        // Skipping lines 80-114 as they don't have timers

        // Decrypt Action
        this.ui.dom.formDecrypt.addEventListener('submit', async (e) => {
            e.preventDefault();
            const cipher = this.ui.dom.inputDecData.value;
            const pass = this.ui.dom.inputDecPass.value;

            if (!cipher || !pass) return;

            try {
                const result = await this.crypto.decrypt(cipher, pass);

                let plaintext = result;

                // Crypto Engine might return object if metadata is present, but for now assuming it returns plaintext string or parses to one
                if (typeof result === 'object' && result.m) {
                    plaintext = result.m;
                }

                this.ui.showDecryptResult(plaintext);

                // Reset form
                this.ui.dom.formDecrypt.reset();

            } catch (err) {
                console.error(err);
                this.ui.showError('decrypt', err.message);
            }
        });

        // Decrypt File Action
        if (this.ui.dom.formDecryptFile) {
            this.ui.dom.formDecryptFile.addEventListener('submit', async (e) => {
                e.preventDefault();
                const file = this.ui.dom.inputDecFile.files[0];
                const pass = this.ui.dom.inputDecFilePass.value;

                if (!file || !pass) return;

                try {
                    const result = await this.crypto.decryptFile(file, pass);

                    // Download the decrypted file
                    this.downloadFile(result.blob, result.filename);

                    // Show success
                    this.ui.dom.outputDecFile.textContent = `✅ File decrypted! Download started: ${result.filename}`;
                    this.ui.dom.outputDecFile.classList.remove('error-text');
                    this.ui.dom.areaDecFileOutput.classList.remove('hidden');
                    this.ui.dom.areaDecFileOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                    // Reset form
                    this.ui.dom.formDecryptFile.reset();
                } catch (err) {
                    console.error(err);
                    this.ui.showError('decrypt', err.message);
                }
            });
        }

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
            this.ui.dom.btnReset.addEventListener('click', async () => {
                const confirmed = await this.ui.showConfirm('This will wipe your session history and all current inputs. Are you sure?', 'Reset Application');
                if (confirmed) {
                    this.security.triggerReset();
                }
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

                // Reset form
                this.ui.dom.formHash.reset();
            } catch (err) {
                console.error(err);
                this.ui.showError('hash', 'Hashing failed.');
            }
        });

        // File Hashing Action
        if (this.ui.dom.formHashFile) {
            this.ui.dom.formHashFile.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const file = formData.get('file');
                const algo = formData.get('algo-file');

                if (!file || file.size === 0) {
                    this.ui.showError('hash', 'Please select a file.');
                    return;
                }

                try {
                    const hash = await this.crypto.hash(file, algo);

                    // Show result in file output area
                    this.ui.dom.outputHashFile.textContent = hash;
                    this.ui.dom.outputHashFile.classList.remove('error-text');
                    this.ui.dom.areaHashFileOutput.classList.remove('hidden');
                    this.ui.dom.areaHashFileOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                    // Reset form
                    this.ui.dom.formHashFile.reset();
                } catch (err) {
                    console.error(err);
                    this.ui.showError('hash', 'File hashing failed.');
                }
            });
        }

        // Analyzer: Analyze Text
        this.ui.dom.formAnalyze.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const text = formData.get('data');

            if (!text) return;

            const stats = this.analyzer.analyze(text);
            this.ui.showAnalysisResult(stats);
        });

        // Watermarking: Apply Watermark
        const btnWatermarkApply = document.getElementById('btn-watermark-apply');
        if (btnWatermarkApply) {
            btnWatermarkApply.addEventListener('click', async () => {
                const watermarkImage = document.getElementById('watermark-image');
                const watermarkText = document.getElementById('watermark-text');
                const watermarkType = document.querySelector('input[name="watermark-type"]:checked');

                const file = watermarkImage?.files[0];
                const text = watermarkText?.value;
                const type = watermarkType?.value || 'visible';

                if (!file || !text) {
                    this.ui.showDialog('Please select a file and enter watermark text.', 'Input Missing');
                    return;
                }

                const isPDF = file.type === 'application/pdf';

                // Add loading state
                const btnApply = document.getElementById('btn-watermark-apply');
                const originalBtnText = btnApply?.innerText || 'Apply Watermark';

                if (btnApply) {
                    btnApply.disabled = true;
                    btnApply.innerText = '⌛ Processing...';
                }

                try {
                    // Size check (> 25MB)
                    if (file.size > 25 * 1024 * 1024) {
                        const proceed = await this.ui.showConfirm('This file is very large (>25MB). Processing may be slow or cause browser memory issues. Continue?', 'Large File Warning');
                        if (!proceed) {
                            if (btnApply) {
                                btnApply.disabled = false;
                                btnApply.innerText = originalBtnText;
                            }
                            return;
                        }
                    }

                    let result;

                    if (type === 'visible') {
                        // Get visible watermark options
                        const position = document.getElementById('watermark-position')?.value || 'diagonal';
                        const opacity = parseInt(document.getElementById('watermark-opacity')?.value || 30) / 100;
                        const colorInput = document.getElementById('watermark-color')?.value || '#808080';
                        const fontSize = parseInt(document.getElementById('watermark-size')?.value || 72);

                        if (isPDF) {
                            // Convert HEX to RGB (0-1) for pdf-lib
                            const r = parseInt(colorInput.slice(1, 3), 16) / 255;
                            const g = parseInt(colorInput.slice(3, 5), 16) / 255;
                            const b = parseInt(colorInput.slice(5, 7), 16) / 255;

                            const pdfOptions = {
                                position: position === 'diagonal' ? 'center' : position,
                                opacity,
                                color: { r, g, b },
                                fontSize,
                                rotation: position === 'diagonal' ? 45 : 0
                            };
                            const blob = await this.watermark.addPDFWatermark(file, text, pdfOptions);
                            result = URL.createObjectURL(blob);
                        } else {
                            const options = {
                                position,
                                opacity,
                                color: colorInput,
                                fontSize,
                                rotation: position === 'diagonal' ? -45 : 0
                            };
                            const blob = await this.watermark.addVisibleWatermark(file, text, options);
                            result = URL.createObjectURL(blob);
                        }
                    } else if (type === 'invisible') {
                        if (isPDF) {
                            throw new Error('Invisible watermarking is only supported for images.');
                        }
                        const password = document.getElementById('watermark-password')?.value || null;
                        const blob = await this.watermark.addInvisibleWatermark(file, text, password);
                        result = URL.createObjectURL(blob);
                    } else if (type === 'pattern') {
                        const opacity = parseInt(document.getElementById('watermark-opacity')?.value || 30) / 100;
                        const colorInput = document.getElementById('watermark-color')?.value || '#808080';
                        const fontSize = parseInt(document.getElementById('watermark-size')?.value || 72);
                        const orientation = document.getElementById('watermark-orientation')?.value || 'diagonal';

                        // Map orientation to rotation
                        let imgRotation = -45;
                        let pdfRotation = 45;

                        if (orientation === 'horizontal') {
                            imgRotation = 0;
                            pdfRotation = 0;
                        } else if (orientation === 'vertical') {
                            imgRotation = -90;
                            pdfRotation = 90;
                        }

                        if (isPDF) {
                            const r = parseInt(colorInput.slice(1, 3), 16) / 255;
                            const g = parseInt(colorInput.slice(3, 5), 16) / 255;
                            const b = parseInt(colorInput.slice(5, 7), 16) / 255;

                            const options = { opacity: opacity * 0.5, color: { r, g, b }, fontSize, rotation: pdfRotation, spacing: 200 };
                            const blob = await this.watermark.addPDFPatternWatermark(file, text, options);
                            result = URL.createObjectURL(blob);
                        } else {
                            const options = { opacity: opacity * 0.5, color: colorInput, fontSize, rotation: imgRotation, spacing: 200 };
                            const blob = await this.watermark.addPatternWatermark(file, text, options);
                            result = URL.createObjectURL(blob);
                        }
                    }

                    // Display result
                    const outputImg = document.getElementById('watermark-output');
                    const resultArea = document.getElementById('watermark-result-area');
                    const resultHeader = document.getElementById('watermark-result-header');
                    const btnSave = document.getElementById('btn-watermark-save');

                    if (resultArea && btnSave) {
                        if (isPDF) {
                            if (outputImg) outputImg.classList.add('hidden');
                            if (resultHeader) resultHeader.innerText = 'Watermarked PDF';
                            if (btnSave) btnSave.innerText = '⬇️ Download PDF';

                            // Store the URL on the button for saving
                            btnSave.dataset.url = result;
                            btnSave.dataset.type = 'pdf';
                        } else {
                            if (outputImg) {
                                outputImg.src = result;
                                outputImg.classList.remove('hidden');
                            }
                            if (resultHeader) resultHeader.innerText = 'Watermarked Image';
                            if (btnSave) btnSave.innerText = '⬇️ Download Image';

                            btnSave.dataset.url = result;
                            btnSave.dataset.type = 'image';
                        }
                        resultArea.classList.remove('hidden');
                        resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                } catch (err) {
                    console.error(err);
                    this.ui.showError('watermark', err.message);
                } finally {
                    btnApply.disabled = false;
                    btnApply.innerText = originalBtnText;
                }
            });
        }

        // Watermarking: Save/Download
        const btnWatermarkSave = document.getElementById('btn-watermark-save');
        if (btnWatermarkSave) {
            btnWatermarkSave.addEventListener('click', (e) => {
                const url = e.target.dataset.url;
                const type = e.target.dataset.type;

                if (url) {
                    const link = document.createElement('a');
                    link.download = type === 'pdf' ? 'watermarked_document.pdf' : 'watermarked_image.png';
                    link.href = url;
                    link.click();
                }
            });
        }

        // Watermarking: Extract Watermark
        const btnWatermarkExtract = document.getElementById('btn-watermark-extract');
        if (btnWatermarkExtract) {
            btnWatermarkExtract.addEventListener('click', async () => {
                const extractImage = document.getElementById('watermark-extract-image');
                const extractPassword = document.getElementById('watermark-extract-password');

                const file = extractImage?.files[0];
                const password = extractPassword?.value || null;

                if (!file) {
                    this.ui.showDialog('Please select a watermarked image.', 'Input Missing');
                    return;
                }

                try {
                    let result;
                    try {
                        result = await this.watermark.extractInvisibleWatermark(file, password);
                    } catch (err) {
                        // If it's a password protection error, show information dialogue
                        if (err.message.includes('password protected')) {
                            this.ui.showDialog('Watermark is protected. Please enter the password to extract.', '🔐 Password Required');
                            return;
                        } else {
                            // Re-throw other errors
                            throw err;
                        }
                    }

                    // Display extracted data
                    const watermarkEl = document.getElementById('extracted-watermark');
                    const timestampEl = document.getElementById('extracted-timestamp');
                    const versionEl = document.getElementById('extracted-version');
                    const outputArea = document.getElementById('watermark-extract-output-area');

                    if (watermarkEl && timestampEl && versionEl && outputArea) {
                        watermarkEl.textContent = result.watermark;
                        timestampEl.textContent = result.timestampReadable;
                        versionEl.textContent = result.version;

                        outputArea.classList.remove('hidden');
                        outputArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                } catch (err) {
                    console.error(err);
                    this.ui.showError('watermark', err.message);
                }
            });
        }

        // Watermarking: Toggle options based on type
        const watermarkTypeRadios = document.querySelectorAll('input[name="watermark-type"]');
        watermarkTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const visibleOptions = document.getElementById('visible-options');
                const invisibleOptions = document.getElementById('invisible-options');
                const orientationGroup = document.getElementById('orientation-group');
                const positionGroup = document.getElementById('watermark-position')?.closest('.form-group');

                if (e.target.value === 'visible') {
                    visibleOptions?.classList.remove('hidden');
                    invisibleOptions?.classList.add('hidden');
                    orientationGroup?.classList.add('hidden');
                    positionGroup?.classList.remove('hidden');
                } else if (e.target.value === 'pattern') {
                    visibleOptions?.classList.remove('hidden');
                    invisibleOptions?.classList.add('hidden');
                    orientationGroup?.classList.remove('hidden');
                    positionGroup?.classList.add('hidden');
                } else if (e.target.value === 'invisible') {
                    visibleOptions?.classList.add('hidden');
                    invisibleOptions?.classList.remove('hidden');
                }
            });
        });

        // Watermarking: Update slider values
        const opacitySlider = document.getElementById('watermark-opacity');
        const opacityValue = document.getElementById('opacity-value');
        if (opacitySlider && opacityValue) {
            opacitySlider.addEventListener('input', (e) => {
                opacityValue.textContent = `${e.target.value}%`;
            });
        }

        const sizeSlider = document.getElementById('watermark-size');
        const sizeValue = document.getElementById('size-value');
        if (sizeSlider && sizeValue) {
            sizeSlider.addEventListener('input', (e) => {
                sizeValue.textContent = `${e.target.value}px`;
            });
        }
    }

    /**
     * Helper to trigger file download
     */
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    console.log('Obscura v1 Loaded');
});
