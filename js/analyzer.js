/**
 * Message Analyzer Module
 * Provides statistical analysis of text data to determine complexity and randomness.
 */

export class MessageAnalyzer {

    /**
     * Main analysis function
     * @param {string} text 
     */
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

    /**
     * Shannon Entropy Calculation
     * H(X) = -sum(p(x) * log2(p(x)))
     * Higher entropy = more randomness (better for keys/passwords)
     */
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

    /**
     * Detects weak patterns like repeats or common sequences.
     */
    detectPatterns(text) {
        const warnings = [];

        // 1. Repeated Characters (e.g., 'aaaaa')
        if (/(.)\1{4,}/.test(text)) {
            warnings.push("Long sequence of repeated characters detected.");
        }

        // 2. Character Variety
        const uniqueChars = new Set(text).size;
        if (text.length > 8 && uniqueChars < 4) {
            warnings.push("Very low character variety.");
        }

        // 3. Sequential Numbers (Basic check)
        if ('0123456789'.includes(text) || '9876543210'.includes(text)) {
            warnings.push("Contains sequential numeric patterns.");
        }

        // 4. Common QWERTY patterns (Basic)
        if ('qwertyuiop'.includes(text.toLowerCase()) || 'asdfghjkl'.includes(text.toLowerCase())) {
            warnings.push("Contains common keyboard patterns.");
        }

        return warnings;
    }

    /**
     * Heuristic to guess if it's Hex, Base64, or Plaintext
     */
    guessType(text) {
        const cleanText = text.trim();

        // 1. Check for Obscura Packed Format (salt:iv:ciphertext)
        // Format: Base64 strings separated by ':'
        if (cleanText.includes(':')) {
            const parts = cleanText.split(':');
            const isBase64Parts = parts.every(part => /^[A-Za-z0-9+/=]+$/.test(part));
            if (parts.length === 3 && isBase64Parts) {
                return 'Obscura Packet (Encrypted)';
            }
        }

        // 2. Hexadecimal
        // Ignore whitespace and optional '0x' prefix
        const hexClean = cleanText.replace(/\s+/g, '').toLowerCase().replace(/^0x/, '');
        if (/^[0-9a-f]+$/.test(hexClean) && hexClean.length > 4 && hexClean.length % 2 === 0) {
            return 'Hexadecimal';
        }

        // 3. Base64
        // Relaxed check: Allow whitespace, don't enforce strict % 4 length for detection (just pattern)
        const b64Clean = cleanText.replace(/\s+/g, '');
        // Must be long enough to be meaningful and match char set
        if (b64Clean.length > 8 && /^[A-Za-z0-9+/]+={0,2}$/.test(b64Clean)) {
            // Distinguishing from heavy alphanumeric text is hard. 
            // Often Base64 has specific endings (=) or no spaces.
            // Let's rely on high entropy + charset if no spaces were present in original (or few).
            if (cleanText.length % 4 === 0 || cleanText.includes('=')) {
                return 'Base64 (Potential)';
            }
        }

        // 4. Entropy Fallback
        // Standard English text usually has entropy ~4.0 - 4.5 bits/char.
        // Compressed/Encrypted data is usually > 5.5 bits/char.
        // Base64 encoding actually reduces entropy per character relative to raw binary, 
        // but high randomness text will still be high.
        const entropy = parseFloat(this.calculateEntropy(cleanText));
        if (entropy > 5.0) {
            return 'High Entropy (Random/Encrypted)';
        }

        return 'Plaintext';
    }
}
