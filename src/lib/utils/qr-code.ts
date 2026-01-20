// QR Code Generator - Pure TypeScript implementation
// Generates QR codes without external dependencies

// QR Code constants
const MODE_BYTE = 0b0100;
const ERROR_CORRECTION_LEVEL = {
    L: 0, // ~7% recovery
    M: 1, // ~15% recovery
    Q: 2, // ~25% recovery
    H: 3, // ~30% recovery
};

// Version capacity table (bytes for mode 0100 / Byte mode)
const VERSION_CAPACITY: Record<number, Record<number, number>> = {
    1: { 0: 17, 1: 14, 2: 11, 3: 7 },
    2: { 0: 32, 1: 26, 2: 20, 3: 14 },
    3: { 0: 53, 1: 42, 2: 32, 3: 24 },
    4: { 0: 78, 1: 62, 2: 46, 3: 34 },
    5: { 0: 106, 1: 84, 2: 60, 3: 44 },
    6: { 0: 134, 1: 106, 2: 74, 3: 58 },
    7: { 0: 154, 1: 122, 2: 86, 3: 64 },
    8: { 0: 192, 1: 152, 2: 108, 3: 84 },
    9: { 0: 230, 1: 180, 2: 130, 3: 98 },
    10: { 0: 271, 1: 213, 2: 151, 3: 119 },
};

// Error correction codewords per block
const EC_CODEWORDS: Record<number, Record<number, number>> = {
    1: { 0: 7, 1: 10, 2: 13, 3: 17 },
    2: { 0: 10, 1: 16, 2: 22, 3: 28 },
    3: { 0: 15, 1: 26, 2: 36, 3: 44 },
    4: { 0: 20, 1: 36, 2: 52, 3: 64 },
    5: { 0: 26, 1: 48, 2: 72, 3: 88 },
    6: { 0: 36, 1: 64, 2: 96, 3: 112 },
    7: { 0: 40, 1: 72, 2: 108, 3: 130 },
    8: { 0: 48, 1: 88, 2: 132, 3: 156 },
    9: { 0: 60, 1: 110, 2: 160, 3: 192 },
    10: { 0: 72, 1: 130, 2: 192, 3: 224 },
};

// Number of data codewords
const DATA_CODEWORDS: Record<number, Record<number, number>> = {
    1: { 0: 19, 1: 16, 2: 13, 3: 9 },
    2: { 0: 34, 1: 28, 2: 22, 3: 16 },
    3: { 0: 55, 1: 44, 2: 34, 3: 26 },
    4: { 0: 80, 1: 64, 2: 48, 3: 36 },
    5: { 0: 108, 1: 86, 2: 62, 3: 46 },
    6: { 0: 136, 1: 108, 2: 76, 3: 60 },
    7: { 0: 156, 1: 124, 2: 88, 3: 66 },
    8: { 0: 194, 1: 154, 2: 110, 3: 86 },
    9: { 0: 232, 1: 182, 2: 132, 3: 100 },
    10: { 0: 274, 1: 216, 2: 154, 3: 122 },
};

// Galois Field for Reed-Solomon
const GF_EXP = new Array(512);
const GF_LOG = new Array(256);

// Initialize Galois Field tables
(function initGF() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
        GF_EXP[i] = x;
        GF_LOG[x] = i;
        x <<= 1;
        if (x & 0x100) {
            x ^= 0x11d; // Primitive polynomial
        }
    }
    for (let i = 255; i < 512; i++) {
        GF_EXP[i] = GF_EXP[i - 255];
    }
})();

function gfMul(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function gfPow(x: number, power: number): number {
    return GF_EXP[(GF_LOG[x] * power) % 255];
}

// Generate Reed-Solomon error correction codewords
function rsEncode(data: number[], nsym: number): number[] {
    const gen = rsGeneratorPoly(nsym);
    const res = new Array(data.length + nsym).fill(0);

    for (let i = 0; i < data.length; i++) {
        res[i] = data[i];
    }

    for (let i = 0; i < data.length; i++) {
        const coef = res[i];
        if (coef !== 0) {
            for (let j = 1; j < gen.length; j++) {
                res[i + j] ^= gfMul(gen[j], coef);
            }
        }
    }

    return res.slice(data.length);
}

function rsGeneratorPoly(nsym: number): number[] {
    let g = [1];
    for (let i = 0; i < nsym; i++) {
        const temp = new Array(g.length + 1).fill(0);
        for (let j = 0; j < g.length; j++) {
            temp[j] ^= g[j];
            temp[j + 1] ^= gfMul(g[j], gfPow(2, i));
        }
        g = temp;
    }
    return g;
}

// Determine minimum version for data
function getMinVersion(data: string, ecLevel: number): number {
    const byteLength = new TextEncoder().encode(data).length;
    for (let v = 1; v <= 10; v++) {
        if (VERSION_CAPACITY[v][ecLevel] >= byteLength) {
            return v;
        }
    }
    throw new Error('Data too long for QR code (max version 10)');
}

// Create data codewords
function createDataCodewords(data: string, version: number, ecLevel: number): number[] {
    const bytes = Array.from(new TextEncoder().encode(data));
    const totalCodewords = DATA_CODEWORDS[version][ecLevel];

    // Bit stream
    let bits = '';

    // Mode indicator (4 bits)
    bits += MODE_BYTE.toString(2).padStart(4, '0');

    // Character count indicator (8 bits for versions 1-9, 16 for 10+)
    const countBits = version <= 9 ? 8 : 16;
    bits += bytes.length.toString(2).padStart(countBits, '0');

    // Data
    for (const byte of bytes) {
        bits += byte.toString(2).padStart(8, '0');
    }

    // Terminator (up to 4 zeros)
    const remainingBits = totalCodewords * 8 - bits.length;
    bits += '0'.repeat(Math.min(4, remainingBits));

    // Pad to byte boundary
    if (bits.length % 8 !== 0) {
        bits += '0'.repeat(8 - (bits.length % 8));
    }

    // Convert to bytes
    const codewords: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
        codewords.push(parseInt(bits.slice(i, i + 8), 2));
    }

    // Pad with alternating bytes
    const padBytes = [0xec, 0x11];
    let padIndex = 0;
    while (codewords.length < totalCodewords) {
        codewords.push(padBytes[padIndex]);
        padIndex = (padIndex + 1) % 2;
    }

    return codewords;
}

// Create the QR matrix
function createMatrix(version: number): boolean[][] {
    const size = version * 4 + 17;
    return Array.from({ length: size }, () => Array(size).fill(false));
}

// Add finder patterns
function addFinderPatterns(matrix: boolean[][], reserved: boolean[][]): void {
    const size = matrix.length;
    const positions = [
        [0, 0],
        [size - 7, 0],
        [0, size - 7],
    ];

    for (const [row, col] of positions) {
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
                const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
                matrix[row + r][col + c] = isBorder || isInner;
                reserved[row + r][col + c] = true;
            }
        }
    }

    // Separators
    for (let i = 0; i < 8; i++) {
        // Top-left
        if (i < size) {
            reserved[7][i] = true;
            reserved[i][7] = true;
        }
        // Top-right
        if (size - 8 + i < size && size - 8 + i >= 0) {
            reserved[7][size - 8 + i] = true;
            reserved[i][size - 8] = true;
        }
        // Bottom-left
        if (size - 8 + i < size && size - 8 + i >= 0) {
            reserved[size - 8][i] = true;
            reserved[size - 8 + i][7] = true;
        }
    }
}

// Add timing patterns
function addTimingPatterns(matrix: boolean[][], reserved: boolean[][]): void {
    const size = matrix.length;
    for (let i = 8; i < size - 8; i++) {
        matrix[6][i] = i % 2 === 0;
        matrix[i][6] = i % 2 === 0;
        reserved[6][i] = true;
        reserved[i][6] = true;
    }
}

// Add format information
function addFormatInfo(matrix: boolean[][], reserved: boolean[][], ecLevel: number, mask: number): void {
    const size = matrix.length;
    const formatBits = getFormatBits(ecLevel, mask);

    // Around top-left finder
    for (let i = 0; i < 6; i++) {
        matrix[8][i] = ((formatBits >> (14 - i)) & 1) === 1;
        reserved[8][i] = true;
    }
    matrix[8][7] = ((formatBits >> 8) & 1) === 1;
    matrix[8][8] = ((formatBits >> 7) & 1) === 1;
    matrix[7][8] = ((formatBits >> 6) & 1) === 1;
    reserved[8][7] = true;
    reserved[8][8] = true;
    reserved[7][8] = true;

    for (let i = 0; i < 6; i++) {
        matrix[5 - i][8] = ((formatBits >> (i)) & 1) === 1;
        reserved[5 - i][8] = true;
    }

    // Around top-right and bottom-left
    for (let i = 0; i < 8; i++) {
        matrix[8][size - 1 - i] = ((formatBits >> i) & 1) === 1;
        reserved[8][size - 1 - i] = true;
    }
    for (let i = 0; i < 7; i++) {
        matrix[size - 7 + i][8] = ((formatBits >> (14 - i)) & 1) === 1;
        reserved[size - 7 + i][8] = true;
    }

    // Dark module
    matrix[size - 8][8] = true;
    reserved[size - 8][8] = true;
}

function getFormatBits(ecLevel: number, mask: number): number {
    const data = (ecLevel << 3) | mask;
    let bits = data << 10;

    // BCH code
    const generator = 0x537;
    for (let i = 4; i >= 0; i--) {
        if ((bits >> (i + 10)) & 1) {
            bits ^= generator << i;
        }
    }
    bits = (data << 10) | bits;

    // XOR mask
    return bits ^ 0x5412;
}

// Place data in matrix
function placeData(matrix: boolean[][], reserved: boolean[][], codewords: number[]): void {
    const size = matrix.length;
    let bitIndex = 0;
    let up = true;

    for (let col = size - 1; col >= 0; col -= 2) {
        if (col === 6) col--; // Skip timing pattern

        for (let r = 0; r < size; r++) {
            const row = up ? size - 1 - r : r;

            for (let c = 0; c < 2; c++) {
                const currentCol = col - c;
                if (!reserved[row][currentCol]) {
                    const byteIndex = Math.floor(bitIndex / 8);
                    const bitPos = 7 - (bitIndex % 8);
                    if (byteIndex < codewords.length) {
                        matrix[row][currentCol] = ((codewords[byteIndex] >> bitPos) & 1) === 1;
                    }
                    bitIndex++;
                }
            }
        }
        up = !up;
    }
}

// Apply mask pattern
function applyMask(matrix: boolean[][], reserved: boolean[][], mask: number): void {
    const size = matrix.length;
    const maskFn = getMaskFunction(mask);

    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            if (!reserved[row][col] && maskFn(row, col)) {
                matrix[row][col] = !matrix[row][col];
            }
        }
    }
}

function getMaskFunction(mask: number): (row: number, col: number) => boolean {
    switch (mask) {
        case 0: return (r, c) => (r + c) % 2 === 0;
        case 1: return (r) => r % 2 === 0;
        case 2: return (_, c) => c % 3 === 0;
        case 3: return (r, c) => (r + c) % 3 === 0;
        case 4: return (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
        case 5: return (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0;
        case 6: return (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
        case 7: return (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
        default: return () => false;
    }
}

// Calculate penalty score for mask selection
function calculatePenalty(matrix: boolean[][]): number {
    let penalty = 0;
    const size = matrix.length;

    // Rule 1: Consecutive modules in row/column
    for (let i = 0; i < size; i++) {
        let rowCount = 1, colCount = 1;
        for (let j = 1; j < size; j++) {
            if (matrix[i][j] === matrix[i][j - 1]) {
                rowCount++;
            } else {
                if (rowCount >= 5) penalty += rowCount - 2;
                rowCount = 1;
            }
            if (matrix[j][i] === matrix[j - 1][i]) {
                colCount++;
            } else {
                if (colCount >= 5) penalty += colCount - 2;
                colCount = 1;
            }
        }
        if (rowCount >= 5) penalty += rowCount - 2;
        if (colCount >= 5) penalty += colCount - 2;
    }

    // Rule 2: 2x2 blocks
    for (let i = 0; i < size - 1; i++) {
        for (let j = 0; j < size - 1; j++) {
            const val = matrix[i][j];
            if (val === matrix[i][j + 1] && val === matrix[i + 1][j] && val === matrix[i + 1][j + 1]) {
                penalty += 3;
            }
        }
    }

    // Rule 4: Proportion of dark modules
    let darkCount = 0;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (matrix[i][j]) darkCount++;
        }
    }
    const percent = (darkCount * 100) / (size * size);
    const lower = Math.floor(percent / 5) * 5;
    const upper = lower + 5;
    penalty += Math.min(Math.abs(lower - 50), Math.abs(upper - 50)) * 2;

    return penalty;
}

export interface QRCodeOptions {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    size?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
}

export interface QRCodeResult {
    matrix: boolean[][];
    size: number;
    version: number;
    svg: string;
    dataUrl: string;
}

/**
 * Generate a QR code from text data
 */
export function generateQRCode(data: string, options: QRCodeOptions = {}): QRCodeResult {
    const {
        errorCorrectionLevel = 'M',
        size = 256,
        margin = 4,
        darkColor = '#000000',
        lightColor = '#ffffff',
    } = options;

    const ecLevel = ERROR_CORRECTION_LEVEL[errorCorrectionLevel];
    const version = getMinVersion(data, ecLevel);

    // Create data codewords
    const dataCodewords = createDataCodewords(data, version, ecLevel);

    // Add error correction
    const ecCodewords = rsEncode(dataCodewords, EC_CODEWORDS[version][ecLevel]);
    const allCodewords = [...dataCodewords, ...ecCodewords];

    // Try all masks and pick best one
    let bestMatrix: boolean[][] | null = null;
    let bestPenalty = Infinity;
    let bestMask = 0;

    for (let mask = 0; mask < 8; mask++) {
        const matrix = createMatrix(version);
        const reserved = createMatrix(version);

        addFinderPatterns(matrix, reserved);
        addTimingPatterns(matrix, reserved);
        addFormatInfo(matrix, reserved, ecLevel, mask);
        placeData(matrix, reserved, allCodewords);
        applyMask(matrix, reserved, mask);

        const penalty = calculatePenalty(matrix);
        if (penalty < bestPenalty) {
            bestPenalty = penalty;
            bestMatrix = matrix;
            bestMask = mask;
        }
    }

    if (!bestMatrix) {
        throw new Error('Failed to generate QR code');
    }

    // Generate SVG
    const moduleCount = bestMatrix.length;
    const moduleSize = size / (moduleCount + margin * 2);

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
    svg += `<rect width="100%" height="100%" fill="${lightColor}"/>`;

    for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
            if (bestMatrix[row][col]) {
                const x = (col + margin) * moduleSize;
                const y = (row + margin) * moduleSize;
                svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${darkColor}"/>`;
            }
        }
    }

    svg += '</svg>';

    // Generate data URL
    const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

    return {
        matrix: bestMatrix,
        size: moduleCount,
        version,
        svg,
        dataUrl,
    };
}

/**
 * Generate a QR code as a PNG data URL (using canvas)
 */
export function generateQRCodePNG(data: string, options: QRCodeOptions = {}): string {
    const qr = generateQRCode(data, options);
    const { size = 256, margin = 4, darkColor = '#000000', lightColor = '#ffffff' } = options;

    // This would need canvas in browser environment
    // For server-side, return SVG data URL
    return qr.dataUrl;
}
