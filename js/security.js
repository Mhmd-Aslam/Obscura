/**
 * Security Manager
 * Handles ephemeral security features like auto-clearing and timers.
 */

export class SecurityManager {
    constructor(uiManager, historyManager) {
        this.ui = uiManager;
        this.history = historyManager;
        this.bindPageEvents();
    }

    bindPageEvents() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.clearSensitiveInputs();
            }
        });

        window.addEventListener('beforeunload', () => {
            this.clearSensitiveInputs();
        });
    }

    clearSensitiveInputs() {
        const sensitiveSelectors = [
            'input[type="password"]',
            'textarea',
            '.code-display pre',
            '.plaintext-display p'
        ];

        sensitiveSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.value = '';
                } else {
                    el.textContent = '';
                }
            });
        });

        document.querySelectorAll('.output-area').forEach(el => el.classList.add('hidden'));
    }

    triggerReset() {
        this.history.clear();
        this.clearSensitiveInputs();
        this.ui.renderHistory([]);
        this.ui.resetAll();
        this.ui.showDialog('Application state has been reset.', 'System Reset');
    }
}
