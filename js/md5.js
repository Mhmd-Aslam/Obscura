/**
 * MD5 (Message-Digest Algorithm) Implementation
 * - Pure JavaScript
 * - Inputs: String (UTF-8) or Uint8Array/ArrayBuffer (binary)
 * - Output: Hex String
 */
export function md5(input) {
    let k = [
        0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
        0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
        0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
        0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
        0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
        0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
        0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
        0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
        0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
        0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
        0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
        0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
        0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
        0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
        0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
        0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
    ];

    let r = [
        7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
        5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
        4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
        6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
    ];

    // Helper: String to UTF-8 Bytes
    function strToUtf8(str) {
        return new TextEncoder().encode(str);
    }

    // Main logic
    let bytes;
    if (typeof input === 'string') {
        bytes = strToUtf8(input);
    } else if (input instanceof Uint8Array) {
        bytes = input;
    } else if (input instanceof ArrayBuffer) {
        bytes = new Uint8Array(input);
    } else {
        throw new Error("MD5 Input must be String, Uint8Array or ArrayBuffer");
    }

    let msgLen = bytes.length;
    let bitLen = msgLen * 8;

    // Padding
    let paddingLen = (bitLen % 512 < 448) ? (448 - bitLen % 512) : (512 - bitLen % 512 + 448);
    let totalLen = (bitLen + paddingLen + 64) / 8;
    let buffer = new Uint8Array(totalLen);
    buffer.set(bytes);
    buffer[msgLen] = 0x80;

    // Add bit length at the end (64-bit little endian)
    let view = new DataView(buffer.buffer);
    view.setUint32(totalLen - 8, bitLen, true);
    // Note: high bits of length ignored for files < 512MB

    let h0 = 0x67452301;
    let h1 = 0xefcdab89;
    let h2 = 0x98badcfe;
    let h3 = 0x10325476;

    for (let offset = 0; offset < totalLen; offset += 64) {
        let w = new Uint32Array(16);
        for (let i = 0; i < 16; i++) {
            w[i] = view.getUint32(offset + i * 4, true);
        }

        let a = h0, b = h1, c = h2, d = h3;

        for (let i = 0; i < 64; i++) {
            let f, g;
            if (i < 16) {
                f = (b & c) | (~b & d);
                g = i;
            } else if (i < 32) {
                f = (d & b) | (~d & c);
                g = (5 * i + 1) % 16;
            } else if (i < 48) {
                f = b ^ c ^ d;
                g = (3 * i + 5) % 16;
            } else {
                f = c ^ (b | ~d);
                g = (7 * i) % 16;
            }

            let temp = d;
            d = c;
            c = b;
            let rotateVal = a + f + k[i] + w[g];
            b = (b + ((rotateVal << r[i]) | (rotateVal >>> (32 - r[i])))) | 0;
            a = temp;
        }

        h0 = (h0 + a) | 0;
        h1 = (h1 + b) | 0;
        h2 = (h2 + c) | 0;
        h3 = (h3 + d) | 0;
    }

    const toHex = (n) => {
        let s = "";
        for (let i = 0; i < 4; i++) {
            s += ((n >> (i * 8)) & 0xff).toString(16).padStart(2, "0");
        }
        return s;
    };

    return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3);
}
