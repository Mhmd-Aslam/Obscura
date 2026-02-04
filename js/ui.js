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

            // Decrypt Section
            formDecrypt: document.getElementById('form-decrypt'),
            inputDecData: document.getElementById('dec-data'),
            inputDecPass: document.getElementById('dec-pass'),
            areaDecOutput: document.getElementById('dec-output-area'),
            outputDec: document.getElementById('dec-result'),

            // Hash Section
            formHash: document.getElementById('form-hash'),
            outputHash: document.getElementById('hash-result'),
            areaHashOutput: document.getElementById('hash-output-area'),

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
            const destructDiv = document.createElement('div');
            destructDiv.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 0.9rem; color: var(--text-secondary);';
            destructDiv.innerHTML = `
                <label style="margin:0; cursor:pointer;">
                    <input type="checkbox" id="chk-destruct"> Self-destruct view in
                </label>
                <select id="sel-destruct-time" style="width: auto; padding: 2px;">
                    <option value="10">10s</option>
                    <option value="30">30s</option>
                    <option value="60">60s</option>
                </select>
            `;
            encryptActions.insertAdjacentElement('beforebegin', destructDiv);

            this.dom.inputDestructCheck = document.getElementById('chk-destruct');
            this.dom.inputDestructTime = document.getElementById('sel-destruct-time');
        }
    }

    getSelfDestructTime() {
        if (this.dom.inputDestructCheck && this.dom.inputDestructCheck.checked) {
            return parseInt(this.dom.inputDestructTime.value, 10);
        }
        return 0;
    }
}
