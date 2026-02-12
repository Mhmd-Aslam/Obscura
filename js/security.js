/**
 * Security Manager
 * Handles ephemeral security features like auto-clearing and timers.
 */

export class SecurityManager {
    constructor(uiManager, historyManager) {
        this.ui = uiManager;
        this.history = historyManager;
        this.inactivityTimeout = 5 * 60 * 1000; // 5 minutes
        this.timer = null;

        this.bindPageEvents();
        this.startInactivityTimer();
    }

    bindPageEvents() {
        ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => this.resetInactivityTimer());
        });

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

    startInactivityTimer() {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            console.log('Inactivity timeout reached. Resetting...');
            this.triggerReset();
        }, this.inactivityTimeout);
    }

    resetInactivityTimer() {
        this.startInactivityTimer();
    }

    triggerReset() {
        if (this.timer) clearTimeout(this.timer);
        this.history.clear();
        this.clearSensitiveInputs();
        this.ui.renderHistory([]);
        this.ui.resetAll();
        // Redirect/Reload for a fresh state
        window.location.reload();
    }
}
