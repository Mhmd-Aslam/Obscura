/**
 * Security Manager
 * Handles ephemeral security features like panic buttons, auto-clearing, and timers.
 */

export class SecurityManager {
    constructor(uiManager, historyManager) {
        this.ui = uiManager;
        this.history = historyManager;

        this.bindPageEvents();
    }

    /**
     * Bind global page events for security hygiene.
     */
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

    /**
     * Wipes all password and message fields.
     */
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

        // Hide result containers
        document.querySelectorAll('.output-area').forEach(el => el.classList.add('hidden'));
    }

    /**
     * The "Reset" function.
     * Instantly resets app state, clears history, clears DOM.
     */
    triggerReset() {
        // 1. Clear LocalStorage History
        this.history.clear();

        // 2. Clear UI Inputs and Outputs
        this.clearSensitiveInputs();

        // 3. Force UI Review of history and reset overall state
        this.ui.renderHistory([]);
        this.ui.resetAll();

        this.ui.showDialog('Application state has been reset.', 'System Reset');
    }
}
