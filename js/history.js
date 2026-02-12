/**
 * History Manager
 * Handles local storage of encrypted message metadata.
 */

export class HistoryManager {
    constructor() {
        this.STORAGE_KEY = 'obscura_history_v1';
        this.MAX_ITEMS = 5;
    }

    add(cipherString) {
        const history = this.getAll();
        const parts = cipherString.split(':');
        const previewText = parts.length === 3 ? parts[2].substring(0, 8) : cipherString.substring(0, 8);

        const entry = {
            id: Date.now(),
            timestamp: Date.now(),
            preview: previewText,
            data: cipherString
        };

        history.unshift(entry);

        if (history.length > this.MAX_ITEMS) {
            history.length = this.MAX_ITEMS;
        }

        this.save(history);
        return history;
    }

    getAll() {
        try {
            const json = localStorage.getItem(this.STORAGE_KEY);
            return json ? JSON.parse(json) : [];
        } catch (e) {
            console.error('History load failed', e);
            return [];
        }
    }

    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
        return [];
    }

    save(items) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
            console.error('History save failed', e);
        }
    }
}
