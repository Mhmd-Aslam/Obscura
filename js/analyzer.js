/**
 * Message Analyzer Module
 * Provides statistical analysis of text data.
 */

export class MessageAnalyzer {
    analyze(text) {
        if (!text) {
            return {
                charCount: 0,
                wordCount: 0,
                entropy: 0,
                patterns: [],
                isWeak: false
            };
        }

        return {
            charCount: text.length,
            wordCount: this.countWords(text),
            entropy: this.calculateEntropy(text),
            patterns: this.detectPatterns(text),
            detectedType: this.guessType(text)
        };
    }

    countWords(text) {
        return text.trim().split(/\s+/).filter(w => w.length > 0).length;
    }

    calculateEntropy(text) {
        const frequencies = {};
        for (let char of text) {
            frequencies[char] = (frequencies[char] || 0) + 1;
        }

        let entropy = 0;
        const len = text.length;

        for (let char in frequencies) {
            const p = frequencies[char] / len;
            entropy -= p * Math.log2(p);
        }

        return entropy.toFixed(3);
    }

    detectPatterns(text) {
        const warnings = [];

        if (/(.)\1{4,}/.test(text)) {
            warnings.push("Long sequence of repeated characters detected.");
        }

        const uniqueChars = new Set(text).size;
        if (text.length > 8 && uniqueChars < 4) {
            warnings.push("Very low character variety.");
        }

        if ('0123456789'.includes(text) || '9876543210'.includes(text)) {
            warnings.push("Contains sequential numeric patterns.");
        }

        if ('qwertyuiop'.includes(text.toLowerCase()) || 'asdfghjkl'.includes(text.toLowerCase())) {
            warnings.push("Contains common keyboard patterns.");
        }

        return warnings;
    }

    guessType(text) {
        const cleanText = text.trim();

        if (cleanText.includes(':')) {
            const parts = cleanText.split(':');
            const isBase64Parts = parts.every(part => /^[A-Za-z0-9+/=]+$/.test(part));
            if (parts.length === 3 && isBase64Parts) {
                return 'Obscura Packet (Encrypted)';
            }
        }

        const hexClean = cleanText.replace(/\s+/g, '').toLowerCase().replace(/^0x/, '');
        if (/^[0-9a-f]+$/.test(hexClean) && hexClean.length > 4 && hexClean.length % 2 === 0) {
            return 'Hexadecimal';
        }

        const b64Clean = cleanText.replace(/\s+/g, '');
        if (b64Clean.length > 8 && /^[A-Za-z0-9+/]+={0,2}$/.test(b64Clean)) {
            if (cleanText.length % 4 === 0 || cleanText.includes('=')) {
                return 'Base64 (Potential)';
            }
        }

        const entropy = parseFloat(this.calculateEntropy(cleanText));
        if (entropy > 5.0) {
            return 'High Entropy (Random/Encrypted)';
        }

        return 'Plaintext';
    }
}
