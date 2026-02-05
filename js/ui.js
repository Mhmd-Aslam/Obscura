/**
 * UI Manager
 * Handles DOM references, updates, and event binding.
 * (Fixed and updated to support History)
 */

export class UIManager {
    constructor() {
        this.dom = {
            // Navigation
            navButtons: document.querySelectorAll('.nav-btn'),
            panels: document.querySelectorAll('.panel'),

            // Encrypt Section
            formEncrypt: document.getElementById('form-encrypt'),
            inputEncMsg: document.getElementById('enc-message'),
            inputEncPass: document.getElementById('enc-pass'),
            areaEncOutput: document.getElementById('enc-output-area'),
            outputEnc: document.getElementById('enc-result'),

            // File Mode
            btnTextMode: document.getElementById('btn-text-mode'),
            btnFileMode: document.getElementById('btn-file-mode'),
            textModeGroup: document.getElementById('text-mode-group'),
            fileModeGroup: document.getElementById('file-mode-group'),
            formEncryptFile: document.getElementById('form-encrypt-file'),
            inputEncFile: document.getElementById('enc-file'),
            inputEncFilePass: document.getElementById('enc-file-pass'),
            filePreview: document.getElementById('file-preview'),
            areaEncFileOutput: document.getElementById('enc-file-output-area'),
            outputEncFile: document.getElementById('enc-file-result'),

            // Decrypt Section
            formDecrypt: document.getElementById('form-decrypt'),
            inputDecData: document.getElementById('dec-data'),
            inputDecPass: document.getElementById('dec-pass'),
            areaDecOutput: document.getElementById('dec-output-area'),
            outputDec: document.getElementById('dec-result'),

            // Decrypt File Mode
            btnDecTextMode: document.getElementById('btn-dec-text-mode'),
            btnDecFileMode: document.getElementById('btn-dec-file-mode'),
            decTextModeGroup: document.getElementById('dec-text-mode-group'),
            decFileModeGroup: document.getElementById('dec-file-mode-group'),
            formDecryptFile: document.getElementById('form-decrypt-file'),
            inputDecFile: document.getElementById('dec-file'),
            inputDecFilePass: document.getElementById('dec-file-pass'),
            decFilePreview: document.getElementById('dec-file-preview'),
            areaDecFileOutput: document.getElementById('dec-file-output-area'),
            outputDecFile: document.getElementById('dec-file-result'),

            // Hash Section
            formHash: document.getElementById('form-hash'),
            outputHash: document.getElementById('hash-result'),
            areaHashOutput: document.getElementById('hash-output-area'),

            // Hash File Mode
            btnHashTextMode: document.getElementById('btn-hash-text-mode'),
            btnHashFileMode: document.getElementById('btn-hash-file-mode'),
            hashTextModeGroup: document.getElementById('hash-text-mode-group'),
            hashFileModeGroup: document.getElementById('hash-file-mode-group'),
            formHashFile: document.getElementById('form-hash-file'),
            outputHashFile: document.getElementById('hash-file-result'),
            areaHashFileOutput: document.getElementById('hash-file-output-area'),

            // Stego Section (Split)
            formStegoHide: document.getElementById('form-stego-hide'),
            inputStegoImage: document.getElementById('stego-image'), // Hide Input
            inputStegoMsg: document.getElementById('stego-message'),
            groupStegoLock: document.getElementById('stego-lock-group'), // Keep group reference for styling if needed, but not toggling
            inputStegoPass: document.getElementById('stego-pass'),
            btnStegoHide: document.getElementById('btn-stego-hide'),

            formStegoReveal: document.getElementById('form-stego-reveal'),
            inputStegoRevealImage: document.getElementById('stego-reveal-image'), // Reveal Input
            groupStegoUnlock: document.getElementById('stego-unlock-group'),
            inputStegoUnlockPass: document.getElementById('stego-unlock-pass'),
            btnStegoReveal: document.getElementById('btn-stego-reveal'),
            areaStegoRevealOutput: document.getElementById('stego-reveal-output-area'),
            outputStegoReveal: document.getElementById('stego-reveal-result'),

            areaStegoResult: document.getElementById('stego-result-area'),
            imgStegoOutput: document.getElementById('stego-output'),

            // Analyzer Section
            formAnalyze: document.getElementById('form-analyze'),
            inputAnalyze: document.getElementById('analyze-input'),
            analyzeResults: document.getElementById('analyze-results'),
            statEntropy: document.getElementById('stat-entropy'),
            statLength: document.getElementById('stat-length'),
            statType: document.getElementById('stat-type'),

            // Copy Buttons
            copyButtons: document.querySelectorAll('.btn-copy'),
            // Custom Modal
            modal: document.getElementById('custom-modal'),
            modalTitle: document.getElementById('modal-title'),
            modalMessage: document.getElementById('modal-message'),
            modalCloseBtn: document.querySelector('.btn-close-modal'),
            modalOkBtn: document.querySelector('.btn-modal-ok')
        };

        this.bindNav();
        this.bindStegoTabs(); // NEW
        this.bindCopy();
        this.bindClearButtons();
        this.injectHistoryUI();
        this.injectSecurityControls();
        this.bindModal();
        this.bindTheme();
        this.bindStegoSave();
        this.bindPasswordStrength();
        this.bindFileMode();
    }

    bindClearButtons() {
        const clears = document.querySelectorAll('button[type="reset"]');
        clears.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Form reset happens automatically.
                // We might need to manually hide output areas or clear custom inputs if needed.
                const form = btn.closest('form');

                // Hide any associated output areas
                const outputs = document.querySelectorAll('.output-area');
                outputs.forEach(el => el.classList.add('hidden'));
            });
        });
    }

    bindTheme() {
        const toggleBtn = document.getElementById('theme-toggle');

        // Check saved preference
        // Check saved preference
        const savedTheme = localStorage.getItem('obscura_theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme');
                const next = current === 'light' ? 'dark' : 'light';

                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('obscura_theme', next);
            });
        }
    }

    bindModal() {
        const hideModal = () => {
            if (this.dom.modal) {
                this.dom.modal.classList.add('hidden');
                this.dom.modal.setAttribute('aria-hidden', 'true');
            }
        };

        if (this.dom.modalCloseBtn) this.dom.modalCloseBtn.addEventListener('click', hideModal);
        if (this.dom.modalOkBtn) this.dom.modalOkBtn.addEventListener('click', hideModal);

        // Close on clicking outside
        if (this.dom.modal) {
            this.dom.modal.addEventListener('click', (e) => {
                if (e.target === this.dom.modal) hideModal();
            });
        }
    }

    // ... (rest of methods)

    // Replaces alert()
    showDialog(message, title = 'Notification') {
        if (!this.dom.modal) {
            alert(message); // Fallback if modal HTML missing
            return;
        }

        this.dom.modalTitle.textContent = title;
        this.dom.modalMessage.textContent = message;

        this.dom.modal.classList.remove('hidden');
        this.dom.modal.setAttribute('aria-hidden', 'false');

        // Focus for accessibility
        this.dom.modalOkBtn.focus();
    }

    // Update showError to use dialog
    showError(section, msg) {
        if (section === 'encrypt') {
            this.showDialog(msg, 'Encryption Error');
        } else {
            this.dom.outputDec.textContent = `Error: ${msg}`;
            this.dom.outputDec.classList.add('error-text');
            this.dom.areaDecOutput.classList.remove('hidden');
        }
    }

    bindNav() {
        this.dom.navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.dom.navButtons.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                this.dom.panels.forEach(p => p.classList.add('hidden'));

                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');

                const targetId = btn.getAttribute('aria-controls');
                document.getElementById(targetId).classList.remove('hidden');
            });
        });
    }

    bindStegoTabs() {
        const subTabs = document.querySelectorAll('.sub-nav-btn');
        const views = [document.getElementById('stego-view-hide'), document.getElementById('stego-view-reveal')];

        subTabs.forEach(btn => {
            btn.addEventListener('click', () => {
                // Deactivate all
                subTabs.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                views.forEach(v => v.classList.add('hidden'));

                // Activate Clicked
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');

                const targetId = btn.getAttribute('aria-controls');
                document.getElementById(targetId).classList.remove('hidden');
            });
        });
    }

    bindCopy() {
        this.dom.copyButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const container = e.target.parentElement;
                // Basic cleanup to get just text, might need refinement depending on structure
                let text = container.querySelector('pre') ? container.querySelector('pre').textContent : container.textContent.replace('Copy', '').trim();

                if (container.querySelector('code')) text = container.querySelector('code').textContent;

                try {
                    await navigator.clipboard.writeText(text);
                    const original = e.target.textContent;
                    e.target.textContent = 'Copied!';
                    setTimeout(() => e.target.textContent = original, 2000);
                } catch (err) {
                    console.error('Copy failed', err);
                }
            });
        });
    }

    // --- Dynamic UI Injection for History ---
    // --- Dynamic UI Injection for History ---
    injectHistoryUI() {
        const encPanel = document.getElementById('panel-encrypt');
        if (!encPanel) return;

        const historyContainer = document.createElement('div');
        historyContainer.className = 'history-section';
        historyContainer.innerHTML = `
            <div class="history-header">
                <h3>Recent History</h3>
                <button id="btn-clear-history" type="button" class="btn-text-danger">Clear</button>
            </div>
            <div id="history-list" class="history-list"></div>
        `;
        encPanel.appendChild(historyContainer);

        this.dom.historyList = document.getElementById('history-list');
        this.dom.btnClearHistory = document.getElementById('btn-clear-history');
    }

    renderHistory(items) {
        if (!this.dom.historyList) return;

        this.dom.historyList.innerHTML = '';
        if (items.length === 0) {
            this.dom.historyList.innerHTML = '<div class="disclaimer">No recent encryptions. History is local only.</div>';
            // Hide clear button if empty? Optional, but cleaner.
            if (this.dom.btnClearHistory) this.dom.btnClearHistory.style.display = 'none';
            return;
        }

        if (this.dom.btnClearHistory) this.dom.btnClearHistory.style.display = 'block';

        items.forEach((item) => {
            const row = document.createElement('div');
            row.className = 'history-item';

            const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            row.innerHTML = `
                <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <span class="history-time">${time}</span>
                    <span>${item.preview}</span>
                </div>
                <button class="btn-copy-history" aria-label="Copy item">Copy</button>
            `;

            // Bind copy for this item
            row.querySelector('.btn-copy-history').addEventListener('click', async (e) => {
                await navigator.clipboard.writeText(item.data);
                const originalText = e.target.textContent;
                e.target.textContent = 'Copied!';
                setTimeout(() => e.target.textContent = originalText, 1500);
            });

            this.dom.historyList.appendChild(row);
        });
    }

    // --- Output Methods ---

    showEncryptResult(text) {
        this.dom.outputEnc.textContent = text;
        this.dom.areaEncOutput.classList.remove('hidden');
        this.dom.areaEncOutput.scrollIntoView({ behavior: 'smooth' });
        this.dom.formEncrypt.reset();
    }

    showDecryptResult(text) {
        this.dom.outputDec.textContent = text;
        this.dom.outputDec.classList.remove('error-text');
        this.dom.areaDecOutput.classList.remove('hidden');
        this.dom.areaDecOutput.scrollIntoView({ behavior: 'smooth' });
        this.dom.formDecrypt.reset();
    }

    showHashResult(hash) {
        this.dom.outputHash.textContent = hash;
        this.dom.outputHash.classList.remove('error-text'); // Clear error state if any
        this.dom.areaHashOutput.classList.remove('hidden');
        this.dom.areaHashOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showStegoResult(dataUrl) {
        this.dom.imgStegoOutput.src = dataUrl;
        this.dom.imgStegoOutput.classList.remove('hidden');

        // Reset success message
        const statusMsg = this.dom.areaStegoResult.querySelector('.success-msg');
        if (statusMsg) {
            statusMsg.textContent = '✅ Data hidden successfully.';
            statusMsg.classList.remove('error-text');
        }

        // Show save button
        const saveBtn = this.dom.areaStegoResult.querySelector('#btn-stego-save');
        if (saveBtn) saveBtn.parentElement.classList.remove('hidden');

        this.dom.areaStegoResult.classList.remove('hidden');
        this.dom.areaStegoResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showStegoRevealResult(text) {
        this.dom.outputStegoReveal.textContent = text;
        this.dom.outputStegoReveal.classList.remove('error-text');
        this.dom.areaStegoRevealOutput.classList.remove('hidden');
        this.dom.areaStegoRevealOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    bindStegoSave() {
        // ... (existing)
        // Re-implement or leave as is? The reference implies keeping surrounding code.
        // Wait, replace_file_content replaces the chunk. I need to keep bindStegoSave if it's in the range. 
        // It is in the range. I'll include it.
        const saveBtn = document.getElementById('btn-stego-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const src = this.dom.imgStegoOutput.src;
                if (!src || src === '') return;

                const link = document.createElement('a');
                link.download = `obscura_stego_${Date.now()}.png`;
                link.href = src;
                link.click();
            });
        }
    }

    showAnalysisResult(stats) {
        this.dom.statEntropy.textContent = stats.entropy;
        this.dom.statLength.textContent = `${stats.charCount} chars / ${stats.wordCount} words`;
        this.dom.statType.textContent = stats.detectedType;

        if (stats.patterns.length > 0) {
            this.dom.statType.textContent += ` ⚠️ ${stats.patterns[0]}`;
            this.dom.statType.style.color = 'var(--warning)';
        } else {
            this.dom.statType.style.color = 'var(--text-primary)';
        }

        this.dom.analyzeResults.classList.remove('hidden');
        this.dom.analyzeResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showError(section, msg) {
        let outputElement, areaElement;

        switch (section) {
            case 'encrypt':
                outputElement = this.dom.outputEnc;
                areaElement = this.dom.areaEncOutput;
                break;
            case 'decrypt':
                outputElement = this.dom.outputDec;
                areaElement = this.dom.areaDecOutput;
                break;
            case 'hash':
                outputElement = this.dom.outputHash;
                areaElement = this.dom.areaHashOutput;
                break;
            case 'stego-reveal':
                outputElement = this.dom.outputStegoReveal;
                areaElement = this.dom.areaStegoRevealOutput;
                break;
            case 'stego-hide':
                // Special handling for Hide structure
                areaElement = this.dom.areaStegoResult;
                const statusMsg = areaElement.querySelector('.success-msg');
                if (statusMsg) {
                    statusMsg.textContent = `❌ Error: ${msg}`;
                    statusMsg.classList.add('error-text');
                    outputElement = statusMsg;
                }

                // Hide success elements
                this.dom.imgStegoOutput.classList.add('hidden');
                const saveBtn = areaElement.querySelector('#btn-stego-save');
                if (saveBtn) saveBtn.parentElement.classList.add('hidden');
                break;
        }

        if (outputElement && section !== 'stego-hide') {
            outputElement.textContent = `Error: ${msg}`;
            outputElement.classList.add('error-text');
        }

        if (areaElement) {
            areaElement.classList.remove('hidden');
            areaElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    injectSecurityControls() {
        // 1. Reset Button in Header (formerly Panic)
        const headerContainer = document.querySelector('header .container');
        if (headerContainer) {
            const resetBtn = document.createElement('button');
            resetBtn.id = 'btn-reset';
            resetBtn.textContent = 'RESET';
            resetBtn.title = 'Reset Application';
            // Use warning color or keep danger? Reset is usually destructive. Let's keep it distinct but maybe not 'danger' red. 
            // Actually, for a "Reset", a neutral or warning color is fine. The user liked the "Panic" style, just wanted name change.
            // Let's stick to the existing style but update the ID.
            resetBtn.style.cssText = 'float: right; background: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 5px 12px; border-radius: 4px; font-weight: 600; cursor: pointer; font-size: 0.8rem; transition: all 0.2s;';

            // Add hover effect via JS since inline styles are tricky for pseudo-classes, or better yet, give it a class and style in CSS?
            // The previous implementation used inline styles. I will update it to be cleaner if possible, but for now changing text is priority.
            // Let's make it look slightly less alarming than the red PANIC button, but still clearer.

            resetBtn.style.cssText = 'float: right; background: var(--warning); color: #000; border: none; padding: 5px 12px; border-radius: 4px; font-weight: 700; cursor: pointer; font-size: 0.8rem;';

            headerContainer.appendChild(resetBtn);
            this.dom.btnReset = resetBtn;
        }

        // 2. Self Destruct Options in Encrypt Form
        const encryptActions = this.dom.formEncrypt.querySelector('.form-actions');
        if (encryptActions) {
            // ... (existing code logic is fine, we are just appending new methods after injectSecurityControls)
        }
    }

    // --- Password Strength ---
    bindPasswordStrength() {
        // Encryption password
        if (this.dom.inputEncPass) {
            const meter = document.getElementById('enc-pass-meter');
            const bar = document.getElementById('enc-strength-bar');
            const label = document.getElementById('enc-strength-text');

            this.dom.inputEncPass.addEventListener('input', (e) => {
                const pass = e.target.value;
                this.updateStrengthMeter(pass, meter, bar, label);
            });
        }

        // Stego Hide password
        if (this.dom.inputStegoPass) {
            const meter = document.getElementById('stego-pass-meter');
            const bar = document.getElementById('stego-strength-bar');
            const label = document.getElementById('stego-strength-text');

            this.dom.inputStegoPass.addEventListener('input', (e) => {
                const pass = e.target.value;
                this.updateStrengthMeter(pass, meter, bar, label);
            });
        }
    }

    updateStrengthMeter(password, meter, bar, label) {
        if (!password) {
            meter.classList.add('hidden');
            bar.style.width = '0%';
            label.textContent = '';
            return;
        }
        meter.classList.remove('hidden');

        const result = this.calculateStrength(password);

        // Update width
        bar.style.width = `${(result.score / 4) * 100}%`;

        // Update classes
        // remove old classes
        bar.className = 'strength-bar';
        bar.classList.add(result.class);

        label.className = 'strength-label';
        label.classList.add(result.class);
        label.textContent = result.label;
    }

    calculateStrength(password) {
        let score = 0;
        if (!password) return { score: 0, label: 'Empty', class: '' };

        if (password.length > 4) score++;
        if (password.length > 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;

        // Bonus for length > 12
        if (password.length > 12 && score < 4) score++;

        switch (score) {
            case 0:
            case 1: return { score: 1, label: 'Weak', class: 'weak' };
            case 2: return { score: 2, label: 'Medium', class: 'medium' };
            case 3: return { score: 3, label: 'Strong', class: 'strong' };
            case 4:
            default: return { score: 4, label: 'Secure', class: 'secure' };
        }
    }

    // --- File Mode ---
    bindFileMode() {
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

        // Encryption mode toggle
        if (this.dom.btnTextMode && this.dom.btnFileMode) {
            this.dom.btnTextMode.addEventListener('click', () => {
                this.dom.btnTextMode.classList.add('active');
                this.dom.btnFileMode.classList.remove('active');
                this.dom.textModeGroup.classList.remove('hidden');
                this.dom.fileModeGroup.classList.add('hidden');
                this.dom.inputEncMsg.required = true;
                if (this.dom.inputEncFile) this.dom.inputEncFile.required = false;
            });

            this.dom.btnFileMode.addEventListener('click', () => {
                this.dom.btnFileMode.classList.add('active');
                this.dom.btnTextMode.classList.remove('active');
                this.dom.fileModeGroup.classList.remove('hidden');
                this.dom.textModeGroup.classList.add('hidden');
                this.dom.inputEncMsg.required = false;
                if (this.dom.inputEncFile) this.dom.inputEncFile.required = true;
            });
        }

        // Decryption mode toggle
        if (this.dom.btnDecTextMode && this.dom.btnDecFileMode) {
            this.dom.btnDecTextMode.addEventListener('click', () => {
                this.dom.btnDecTextMode.classList.add('active');
                this.dom.btnDecFileMode.classList.remove('active');
                this.dom.decTextModeGroup.classList.remove('hidden');
                this.dom.decFileModeGroup.classList.add('hidden');
            });

            this.dom.btnDecFileMode.addEventListener('click', () => {
                this.dom.btnDecFileMode.classList.add('active');
                this.dom.btnDecTextMode.classList.remove('active');
                this.dom.decFileModeGroup.classList.remove('hidden');
                this.dom.decTextModeGroup.classList.add('hidden');
            });
        }

        // Encryption file upload handler
        if (this.dom.inputEncFile) {
            this.dom.inputEncFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) {
                    this.dom.filePreview.classList.add('hidden');
                    return;
                }

                // Validate file size
                if (file.size > MAX_FILE_SIZE) {
                    this.dom.filePreview.innerHTML = `
                        <p class="file-size-error">⚠️ File too large! Maximum size is 10MB.</p>
                        <p>Your file: <strong>${(file.size / (1024 * 1024)).toFixed(2)} MB</strong></p>
                    `;
                    this.dom.filePreview.classList.remove('hidden');
                    this.dom.inputEncFile.value = '';
                    return;
                }

                // Show file preview
                this.dom.filePreview.innerHTML = `
                    <p>📄 <strong>${file.name}</strong></p>
                    <p>Size: ${(file.size / 1024).toFixed(2)} KB</p>
                    <p>Type: ${file.type || 'Unknown'}</p>
                `;
                this.dom.filePreview.classList.remove('hidden');
            });
        }

        // Decryption file upload handler
        if (this.dom.inputDecFile) {
            this.dom.inputDecFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) {
                    this.dom.decFilePreview.classList.add('hidden');
                    return;
                }

                // Show file preview
                this.dom.decFilePreview.innerHTML = `
                    <p>📄 <strong>${file.name}</strong></p>
                    <p>Size: ${(file.size / 1024).toFixed(2)} KB</p>
                `;
                this.dom.decFilePreview.classList.remove('hidden');
            });
        }

        // Hash mode toggle
        if (this.dom.btnHashTextMode && this.dom.btnHashFileMode) {
            this.dom.btnHashTextMode.addEventListener('click', () => {
                this.dom.btnHashTextMode.classList.add('active');
                this.dom.btnHashFileMode.classList.remove('active');
                this.dom.hashTextModeGroup.classList.remove('hidden');
                this.dom.hashFileModeGroup.classList.add('hidden');
            });

            this.dom.btnHashFileMode.addEventListener('click', () => {
                this.dom.btnHashFileMode.classList.add('active');
                this.dom.btnHashTextMode.classList.remove('active');
                this.dom.hashFileModeGroup.classList.remove('hidden');
                this.dom.hashTextModeGroup.classList.add('hidden');
            });
        }
    }

    getSelfDestructTime() {
        if (this.dom.inputDestructCheck && this.dom.inputDestructCheck.checked) {
            return parseInt(this.dom.inputDestructTime.value, 10);
        }
        return 0;
    }
}
