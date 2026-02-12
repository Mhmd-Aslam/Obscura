# Obscura 🔒
> **Privacy-First Security Suite - Client-Side Cryptography**

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Status: Production](https://img.shields.io/badge/Status-Production-blue.svg)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-brightgreen.svg)

**Obscura** is a zero-knowledge, browser-based security application that provides military-grade encryption, steganography, watermarking, and data analysis tools—all without sending any data to a server.

🌐 **Live Demo**: [https://obscura-sec.vercel.app](https://obscura-sec.vercel.app)

---

## 🛡️ Core Philosophy
**"What happens in your browser, stays in your browser."**

Obscura operates entirely on the client side. No data, keys, or passwords are ever transmitted to a server. All processing is done using the browser's native Web Crypto API and Canvas API.

## 🚀 Features

### 1. **AES-256 Encryption**
-   **Algorithm**: AES-GCM (Galois/Counter Mode) with 256-bit keys
-   **Key Derivation**: PBKDF2-SHA256 with 100,000 iterations
-   **Security**: CSPRNG-generated salts and initialization vectors
-   **File Support**: Encrypt/decrypt both text messages and files

### 2. **Steganography**
-   **LSB Encoding**: Hide secret messages inside PNG/JPEG images
-   **Visual Integrity**: No noticeable distortion to cover images
-   **Privacy**: All processing done in-memory via Canvas API

### 3. **PDF & Image Watermarking**
-   **Format Support**: Add watermarks to PDFs and images
-   **Customization**: Configurable text, opacity, position, and rotation
-   **Pattern Modes**: Single, tiled, and diagonal layouts

### 4. **Cryptographic Hashing**
-   **Algorithms**: SHA-1, SHA-256, SHA-384, SHA-512, MD5
-   **Hash Comparison**: Verify file integrity with built-in comparison tool
-   **File & Text Support**: Hash any content type

### 5. **Message Analyzer**
-   **Entropy Analysis**: Shannon entropy calculation for password strength
-   **Pattern Detection**: Identifies weak patterns and repeated characters
-   **Frequency Analysis**: Character distribution statistics

### 6. **Security Features**
-   **Password Strength Meters**: Real-time feedback on password quality
-   **Auto-Inactivity Reset**: Clears sensitive data after 5 minutes of inactivity
-   **History Management**: Stores last 5 operations (never passwords or plaintext)

### 7. **Progressive Web App (PWA)**
-   **Installable**: Add to home screen on mobile and desktop
-   **Offline Capable**: Full functionality without internet connection
-   **Mobile Optimized**: Touch-friendly UI with responsive design

---

## 🛠️ Technology Stack
-   **Core**: HTML5, CSS3, Vanilla JavaScript (ES6+ Modules)
-   **Cryptography**: [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
-   **Graphics**: HTML5 Canvas API
-   **PDF Processing**: [pdf-lib](https://pdf-lib.js.org/)
-   **Build Tool**: Vite
-   **Hosting**: Vercel with edge caching and security headers

**Zero dependencies for core crypto operations** - Reduces supply chain attack surface.

---

## 📦 Deployment

### Production (Vercel - Recommended)
1. Fork this repository
2. Import to [Vercel](https://vercel.com)
3. Deploy with one click (auto-detected Vite configuration)

### Local Development
```bash
# Clone the repository
git clone https://github.com/Mhmd-Aslam/Obscura.git
cd Obscura

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 🔒 Security Features

### **HTTP Security Headers**
-   Content Security Policy (CSP)
-   X-Frame-Options: DENY
-   X-Content-Type-Options: nosniff
-   Strict Referrer Policy

### **Privacy**
-   No analytics or tracking
-   No external API calls
-   All processing done locally
-   Service Worker uses network-first strategy

---

## ⚠️ Security Disclaimer
This application is intended for **educational purposes** and personal use. While it uses industry-standard algorithms (AES-GCM, PBKDF2), the implementation has not been audited by a third-party security firm.

-   **Do not use for protecting classified or critical data**
-   **If you lose your password, your data is unrecoverable**
-   **Always verify the source** before using any cryptographic tool

---

## 🎓 Educational Value
Obscura serves as a reference implementation for:
-   Symmetric encryption workflows (Key Derivation → Encrypt → Auth Tag)
-   The importance of salts and initialization vectors
-   Browser-based security models and CSP
-   LSB steganography algorithms
-   Shannon entropy and cryptanalysis

---

## 📱 Browser Compatibility
-   Chrome/Edge 60+
-   Firefox 57+
-   Safari 11+
-   Mobile browsers with Web Crypto API support

---

## 📄 License
MIT License - See [LICENSE](LICENSE) file for details

---

*A privacy-focused security suite for the modern web*
