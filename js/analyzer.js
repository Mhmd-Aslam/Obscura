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
        // Hex: 0-9, a-f, even length
        if (/^[0-9a-fA-F]+$/.test(text) && text.length % 2 === 0) {
            return 'Hexadecimal (Potential)';
        }

        // Base64: A-Z, a-z, 0-9, +, /, maybe = padding
        // Regex is a bit loose to catch potential fragments
        if (/^[A-Za-z0-9+/]+={0,2}$/.test(text) && text.length % 4 === 0) {
            return 'Base64 (Potential)';
        }

        return 'Plaintext';
    }
}
