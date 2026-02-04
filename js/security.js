/**
 * Security Manager
 * Handles ephemeral security features like panic buttons, auto-clearing, and timers.
 */

export class SecurityManager {
    constructor(uiManager, historyManager) {
        this.ui = uiManager;
        this.history = historyManager;
        this.destructTimers = new Set();
        this.BURN_REGISTRY_KEY = 'obscura_burn_registry';

        this.bindPageEvents();
    }

    /**
     * Checks if a message signature has already been "burned" (viewed).
     * @param {string} signature - Unique hash/string of the ciphertext
     * @returns {boolean}
     */
    isBurned(signature) {
        const registry = JSON.parse(localStorage.getItem(this.BURN_REGISTRY_KEY) || '{}');
        return !!registry[signature];
    }

    /**
     * Marks a message signature as burned.
     * @param {string} signature 
     */
    markBurned(signature) {
        const registry = JSON.parse(localStorage.getItem(this.BURN_REGISTRY_KEY) || '{}');
        registry[signature] = Date.now(); // Store timestamp of burn
        localStorage.setItem(this.BURN_REGISTRY_KEY, JSON.stringify(registry));
    }

    /**
     * Bind global page events for security hygiene.
     */
    bindPageEvents() {
        // 1. Auto-clear on Tab Hide/Close
        // Browsers store form state in cache for "Restore tabs". 
        // We explicitly wipe this on visibility change to hidden or unload.
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                // Option: Clear immediately or just sensitive vars? 
                // Strictest: Clear all sensitive inputs when user tabs away.
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
            '#enc-result',
            '#dec-result'
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
     * The "Reset" function (formerly Panic).
     * Instantly resets app state, clears history, clears DOM.
     */
    triggerReset() {
        // 1. Clear LocalStorage History
        this.history.clear();

        // 2. Clear UI Inputs and Outputs
        this.clearSensitiveInputs();

        // 3. Clear any active destruct timers
        this.destructTimers.forEach(timer => clearTimeout(timer));
        this.destructTimers.clear();

        this.ui.showDialog('Application state has been reset.', 'System Reset');
    }

    /**
     * Starts a self-destruct timer for a specific message element.
     * @param {HTMLElement} element - The key/value display to wipe
     * @param {number} seconds - Time in seconds
     */
    scheduleSelfDestruct(element, seconds = 0) {
        if (!seconds || seconds <= 0) return;

        let remaining = seconds;

        // Clear any existing timer on this element if we were tracking it (though map is by ID, element reference tricky)
        // For simplicity, we just push new one.

        const intervalId = setInterval(() => {
            remaining--;

            // Visual Countdown for last 3 seconds
            // Find parent container to inject badge if needed
            const container = element.closest('.output-area');
            let badge = container ? container.querySelector('.destruct-badge') : null;

            if (remaining <= 3 && remaining > 0) {
                if (container && !badge) {
                    badge = document.createElement('span');
                    badge.className = 'destruct-badge';
                    badge.style.cssText = 'float: right; color: var(--warning); font-weight: bold; font-family: var(--font-mono); margin-left: 10px; animation: pulse 0.5s infinite alternate;';
                    // Insert after header text (h3) or inside header? 
                    const header = container.querySelector('h3');
                    if (header) header.appendChild(badge);
                }

                if (badge) {
                    badge.textContent = `💥 Self-destructing in ${remaining}...`;
                }
            }

            if (remaining <= 0) {
                clearInterval(intervalId);

                // Remove badge
                if (badge) badge.remove();

                element.textContent = '[MESSAGE SELF-DESTRUCTED]';
                element.className = 'muted'; // Apply muted class
                element.style.color = ''; // Reset inline color
                this.destructTimers.delete(intervalId);
            }
        }, 1000);

        this.destructTimers.add(intervalId);
    }
}
