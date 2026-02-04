# Obscura 🔒
> **Secure Client-Side Encryption Suite**

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Status: Stable](https://img.shields.io/badge/Status-Stable-blue.svg)

**Obscura** is a zero-knowledge, frontend-only web application designed to demonstrate modern cryptographic principles using the native Web Cryptography API. It provides a suite of tools for securing communication, analyzing data entropy, and hiding information within media.

---

## 🛡️ Core Philosophy
**"What happens in your browser, stays in your browser."**
CipherBox operates entirely on the client side. No data, keys, or passwords are ever transmitted to a server. All processing is done using the browser's native `window.crypto` and Canvas APIs.

## 🚀 Features

### 1. Military-Grade Encryption
-   **Algorithm**: AES-GCM (Advanced Encryption Standard in Galois/Counter Mode).
-   **Key Derivation**: PBKDF2 with SHA-256 and 100,000 iterations.
-   **Security**: Uses cryptographically secure random values (CSPRNG) for Salt and IVs.

### 2. Steganography
-   **Technique**: Least Significant Bit (LSB) encoding.
-   **Function**: Hides confidential text messages inside PNG/JPEG images without noticeable visual distortion.
-   **Privacy**: Image processing is done entirely in memory using the HTML5 Canvas API.

### 3. Data Analysis
-   **Entropy Calculation**: Measures the randomness/strength of text based on Shannon Entropy.
-   **Pattern Detection**: Identifies weak passwords, repeated characters, and common keyboard patterns.

### 4. Operational Security (OpSec)
-   **Panic Button**: Instantly wipes all inputs, clears history, and resets the application state.
-   **Self-Destruct**: Optional timers (10s/30s/60s) to automatically clear decrypted messages from the view.
-   **Auto-Clear**: Detecting tab switching or window minimization automatically clears sensitive fields to prevent "shoulder surfing."

### 5. Local History
-   **Ephemeral Storage**: Stores the last 5 encrypted artifacts (ciphertext/IV/salt) in LocalStorage for convenience.
-   **Safety**: **Never** stores passwords or plaintext messages.

---

## 🛠️ Technology Stack
-   **Core**: HTML5, CSS3, Vanilla JavaScript (ES6+ Modules).
-   **Cryptography**: [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) (`SubtleCrypto`).
-   **Graphics**: HTML5 Canvas API (for Steganography).
-   **Styling**: Custom CSS Variables (Dark Mode native).

**No external libraries or frameworks were used.** This reduces the attack surface by eliminating supply chain vulnerabilities.

---

## 📦 Deployment Guide
CipherBox is designed to be hosted on any static file server.

### GitHub Pages (Recommended)
1.  Fork this repository.
2.  Go to **Settings** > **Pages**.
3.  Select the `main` branch as the source.
4.  Your site will be live at `https://<username>.github.io/CipherBox`.

### Local Execution
1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/CipherBox.git
    ```
2.  Open `index.html` in any modern browser.

---

## ⚠️ Security Disclaimer
This application is intended for **educational purposes** and personal use. While it uses industry-standard algorithms (AES-GCM, PBKDF2), the implementation has not been audited by a third-party security firm.
-   **Do not use for protecting state secrets or critical financial data.**
-   **If you lose your password, your data is gone forever.** There is no "forgot password" feature because there is no backend.

---

## 🎓 Educational Value
This project serves as a reference implementation for students learning about:
-   Symmetric Encryption flow (Key Derivation -> Encrypt -> Auth Tag).
-   The importance of Salts and Initialization Vectors (IVs).
-   Browser-based security models and Content Security Policy (CSP).
-   Steganographic algorithms.

---

*Designed & Developed by [Your Name] - Cybersecurity Student & Frontend Engineer*
