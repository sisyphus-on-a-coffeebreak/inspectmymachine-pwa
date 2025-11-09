// QR code generation utilities implementing QR Code Model 2 with byte-mode encoding.
// The implementation currently targets version 1 (21x21) QR codes with
// error-correction level M, which supports up to 14 bytes of payload data.
// This is sufficient for access tokens and short identifiers used by the app.

const VERSION = 1;
const MODULE_COUNT = VERSION * 4 + 17; // 21 modules for version 1
const ERROR_CORRECTION_LEVEL_BITS = 0b00; // Level M
const ERROR_CORRECTION_CODEWORDS = 10; // Version 1-M
const DATA_CODEWORDS = 16; // Version 1-M
const FORMAT_INFO_MASK = 0x5412;
const FORMAT_INFO_GENERATOR = 0b10100110111;

const maskFunctions: Array<(row: number, col: number) => boolean> = [
  (row, col) => (row + col) % 2 === 0,
  (row) => row % 2 === 0,
  (_, col) => col % 3 === 0,
  (row, col) => (row + col) % 3 === 0,
  (row, col) => ((Math.floor(row / 2) + Math.floor(col / 3)) % 2) === 0,
  (row, col) => (((row * col) % 2) + ((row * col) % 3)) === 0,
  (row, col) => ((((row * col) % 2) + ((row * col) % 3)) % 2) === 0,
  (row, col) => ((((row + col) % 2) + ((row * col) % 3)) % 2) === 0
];

const formatPositionsPrimary: Array<[number, number]> = [
  [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
];

const formatPositionsSecondary: Array<[number, number]> = [
  [MODULE_COUNT - 1, 8], [MODULE_COUNT - 2, 8], [MODULE_COUNT - 3, 8],
  [MODULE_COUNT - 4, 8], [MODULE_COUNT - 5, 8], [MODULE_COUNT - 6, 8],
  [MODULE_COUNT - 7, 8],
  [8, MODULE_COUNT - 8], [8, MODULE_COUNT - 7], [8, MODULE_COUNT - 6],
  [8, MODULE_COUNT - 5], [8, MODULE_COUNT - 4], [8, MODULE_COUNT - 3],
  [8, MODULE_COUNT - 2], [8, MODULE_COUNT - 1]
];

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) {
    return 0;
  }
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function reedSolomonGenerator(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const term = [1, GF_EXP[i]];
    poly = polyMultiply(poly, term);
  }
  return poly;
}

function polyMultiply(p: number[], q: number[]): number[] {
  const result = new Array(p.length + q.length - 1).fill(0);
  for (let i = 0; i < p.length; i++) {
    for (let j = 0; j < q.length; j++) {
      result[i + j] ^= gfMul(p[i], q[j]);
    }
  }
  return result;
}

function reedSolomonComputeRemainder(data: number[], generator: number[]): number[] {
  const result = data.slice();
  for (let i = 0; i < data.length - generator.length + 1; i++) {
    const factor = result[i];
    if (factor !== 0) {
      for (let j = 1; j < generator.length; j++) {
        result[i + j] ^= gfMul(generator[j], factor);
      }
    }
  }
  return result.slice(result.length - (generator.length - 1));
}

function encodeDataBytes(data: Uint8Array): number[] {
  if (data.length > getMaxDataLength()) {
    throw new Error(`QR payload too large. Version ${VERSION} with level M supports up to ${getMaxDataLength()} bytes.`);
  }

  const bits: number[] = [];

  appendBits(bits, 0b0100, 4);
  appendBits(bits, data.length, 8);
  for (let i = 0; i < data.length; i++) {
    appendBits(bits, data[i], 8);
  }

  const totalDataBits = DATA_CODEWORDS * 8;
  const remainingBits = totalDataBits - bits.length;
  if (remainingBits > 0) {
    const terminatorLength = Math.min(4, remainingBits);
    appendBits(bits, 0, terminatorLength);
  }

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const dataBytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let value = 0;
    for (let j = 0; j < 8; j++) {
      value = (value << 1) | bits[i + j];
    }
    dataBytes.push(value);
  }

  const padBytes = [0xec, 0x11];
  let padIndex = 0;
  while (dataBytes.length < DATA_CODEWORDS) {
    dataBytes.push(padBytes[padIndex % 2]);
    padIndex++;
  }

  return dataBytes;
}

function getMaxDataLength(): number {
  return 14;
}

function appendBits(bits: number[], value: number, length: number): void {
  for (let i = length - 1; i >= 0; i--) {
    bits.push((value >> i) & 1);
  }
}

function interleaveCodewords(dataCodewords: number[], ecCodewords: number[]): number[] {
  return dataCodewords.concat(ecCodewords);
}

function createEmptyMatrix(): {
  modules: (boolean | null)[][];
  reserved: boolean[][];
  dataMask: boolean[][];
} {
  const modules: (boolean | null)[][] = Array.from({ length: MODULE_COUNT }, () => Array<boolean | null>(MODULE_COUNT).fill(null));
  const reserved: boolean[][] = Array.from({ length: MODULE_COUNT }, () => Array<boolean>(MODULE_COUNT).fill(false));
  const dataMask: boolean[][] = Array.from({ length: MODULE_COUNT }, () => Array<boolean>(MODULE_COUNT).fill(false));
  return { modules, reserved, dataMask };
}

function placeFinderPattern(modules: (boolean | null)[][], reserved: boolean[][], row: number, col: number): void {
  const pattern = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1]
  ];

  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      modules[row + r][col + c] = pattern[r][c] === 1;
      reserved[row + r][col + c] = true;
    }
  }

  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = row + r;
      const cc = col + c;
      if (rr < 0 || cc < 0 || rr >= MODULE_COUNT || cc >= MODULE_COUNT) {
        continue;
      }
      if (rr >= row && rr < row + 7 && cc >= col && cc < col + 7) {
        continue;
      }
      if (!reserved[rr][cc]) {
        modules[rr][cc] = false;
        reserved[rr][cc] = true;
      }
    }
  }
}

function placeTimingPatterns(modules: (boolean | null)[][], reserved: boolean[][]): void {
  for (let i = 0; i < MODULE_COUNT; i++) {
    if (!reserved[6][i]) {
      modules[6][i] = i % 2 === 0;
      reserved[6][i] = true;
    }
    if (!reserved[i][6]) {
      modules[i][6] = i % 2 === 0;
      reserved[i][6] = true;
    }
  }
}

function reserveFormatAreas(reserved: boolean[][]): void {
  [...formatPositionsPrimary, ...formatPositionsSecondary].forEach(([r, c]) => {
    reserved[r][c] = true;
  });
}

function placeDarkModule(modules: (boolean | null)[][], reserved: boolean[][]): void {
  const row = MODULE_COUNT - 8;
  const col = 8;
  modules[row][col] = true;
  reserved[row][col] = true;
}

function placeDataBits(
  modules: (boolean | null)[][],
  reserved: boolean[][],
  dataMask: boolean[][],
  dataBits: number[]
): void {
  let bitIndex = 0;
  let direction = -1;
  let row = MODULE_COUNT - 1;

  for (let col = MODULE_COUNT - 1; col > 0; col -= 2) {
    if (col === 6) {
      col--;
    }

    for (let i = 0; i < MODULE_COUNT; i++) {
      const r = row + direction * i;
      if (r < 0 || r >= MODULE_COUNT) {
        continue;
      }

      for (let j = 0; j < 2; j++) {
        const c = col - j;
        if (reserved[r][c]) {
          continue;
        }
        const bit = bitIndex < dataBits.length ? dataBits[bitIndex] : 0;
        modules[r][c] = bit === 1;
        dataMask[r][c] = true;
        bitIndex++;
      }
    }

    direction *= -1;
    row = direction === -1 ? MODULE_COUNT - 1 : 0;
  }
}

function createDataBits(codewords: number[]): number[] {
  const bits: number[] = [];
  for (const codeword of codewords) {
    for (let i = 7; i >= 0; i--) {
      bits.push((codeword >> i) & 1);
    }
  }
  return bits;
}

function applyMask(modules: (boolean | null)[][], dataMask: boolean[][], maskIndex: number): (boolean | null)[][] {
  const masked: (boolean | null)[][] = modules.map((row) => row.slice());
  const maskFn = maskFunctions[maskIndex];
  for (let r = 0; r < MODULE_COUNT; r++) {
    for (let c = 0; c < MODULE_COUNT; c++) {
      if (dataMask[r][c]) {
        masked[r][c] = Boolean(masked[r][c]) !== maskFn(r, c);
      }
    }
  }
  return masked;
}

function calculatePenalty(modules: (boolean | null)[][]): number {
  let penalty = 0;

  for (let r = 0; r < MODULE_COUNT; r++) {
    penalty += evaluateRunPenalty(modules[r]);
  }

  for (let c = 0; c < MODULE_COUNT; c++) {
    const column: boolean[] = [];
    for (let r = 0; r < MODULE_COUNT; r++) {
      column.push(Boolean(modules[r][c]));
    }
    penalty += evaluateRunPenalty(column);
  }

  for (let r = 0; r < MODULE_COUNT - 1; r++) {
    for (let c = 0; c < MODULE_COUNT - 1; c++) {
      const dark = Boolean(modules[r][c]);
      if (
        Boolean(modules[r][c + 1]) === dark &&
        Boolean(modules[r + 1][c]) === dark &&
        Boolean(modules[r + 1][c + 1]) === dark
      ) {
        penalty += 3;
      }
    }
  }

  const pattern1 = [true, false, true, true, true, false, true, false, false, false, false];
  const pattern2 = [false, false, false, false, true, false, true, true, true, false, true];

  for (let r = 0; r < MODULE_COUNT; r++) {
    penalty += countPatternOccurrences(modules[r], pattern1) * 40;
    penalty += countPatternOccurrences(modules[r], pattern2) * 40;
  }

  for (let c = 0; c < MODULE_COUNT; c++) {
    const column: boolean[] = [];
    for (let r = 0; r < MODULE_COUNT; r++) {
      column.push(Boolean(modules[r][c]));
    }
    penalty += countPatternOccurrences(column, pattern1) * 40;
    penalty += countPatternOccurrences(column, pattern2) * 40;
  }

  let darkCount = 0;
  for (let r = 0; r < MODULE_COUNT; r++) {
    for (let c = 0; c < MODULE_COUNT; c++) {
      if (modules[r][c]) {
        darkCount++;
      }
    }
  }
  const totalModules = MODULE_COUNT * MODULE_COUNT;
  const percent = (darkCount / totalModules) * 100;
  const variance = Math.abs(percent - 50);
  penalty += Math.floor(variance / 5) * 10;

  return penalty;
}

function evaluateRunPenalty(line: (boolean | null)[]): number {
  let penalty = 0;
  let runColor = Boolean(line[0]);
  let runLength = 1;
  for (let i = 1; i < line.length; i++) {
    const value = Boolean(line[i]);
    if (value === runColor) {
      runLength++;
    } else {
      if (runLength >= 5) {
        penalty += 3 + (runLength - 5);
      }
      runColor = value;
      runLength = 1;
    }
  }
  if (runLength >= 5) {
    penalty += 3 + (runLength - 5);
  }
  return penalty;
}

function countPatternOccurrences(line: (boolean | null)[], pattern: boolean[]): number {
  let count = 0;
  for (let i = 0; i <= line.length - pattern.length; i++) {
    let match = true;
    for (let j = 0; j < pattern.length; j++) {
      if (Boolean(line[i + j]) !== pattern[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      count++;
    }
  }
  return count;
}

function chooseBestMask(modules: (boolean | null)[][], dataMask: boolean[][]): { maskIndex: number; masked: (boolean | null)[][] } {
  let bestMask = 0;
  let bestMasked = modules;
  let lowestPenalty = Infinity;
  for (let i = 0; i < maskFunctions.length; i++) {
    const masked = applyMask(modules, dataMask, i);
    const penalty = calculatePenalty(masked);
    if (penalty < lowestPenalty) {
      lowestPenalty = penalty;
      bestMask = i;
      bestMasked = masked;
    }
  }
  return { maskIndex: bestMask, masked: bestMasked };
}

function computeFormatBits(maskIndex: number): number {
  const data = (ERROR_CORRECTION_LEVEL_BITS << 3) | maskIndex;
  let format = data << 10;
  for (let i = 14; i >= 10; i--) {
    if ((format >> i) & 1) {
      format ^= FORMAT_INFO_GENERATOR << (i - 10);
    }
  }
  format = ((data << 10) | (format & 0x3ff)) ^ FORMAT_INFO_MASK;
  return format;
}

function placeFormatInformation(modules: (boolean | null)[][], formatBits: number): void {
  for (let i = 0; i < 15; i++) {
    const bit = (formatBits >> (14 - i)) & 1;
    const primary = formatPositionsPrimary[i];
    const secondary = formatPositionsSecondary[i];
    modules[primary[0]][primary[1]] = bit === 1;
    modules[secondary[0]][secondary[1]] = bit === 1;
  }
}

function utf8Encode(input: string): Uint8Array {
  return new TextEncoder().encode(input);
}

function matrixToSvgDataUrl(matrix: boolean[][], options?: QRRenderOptions): string {
  const margin = options?.margin ?? 4;
  const moduleCount = matrix.length;
  const size = moduleCount + margin * 2;
  const rects: string[] = [];
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c]) {
        rects.push(`<rect x="${c + margin}" y="${r + margin}" width="1" height="1" />`);
      }
    }
  }
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">` +
    `<rect width="100%" height="100%" fill="white"/>` +
    `<g fill="black">${rects.join('')}</g>` +
    `</svg>`;
  const base64 = base64Encode(new TextEncoder().encode(svg));
  return `data:image/svg+xml;base64,${base64}`;
}

function crc32(buffer: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function adler32(buffer: Uint8Array): number {
  let a = 1;
  let b = 0;
  const MOD_ADLER = 65521;
  for (const byte of buffer) {
    a = (a + byte) % MOD_ADLER;
    b = (b + a) % MOD_ADLER;
  }
  return ((b << 16) | a) >>> 0;
}

function createStoredDeflate(data: Uint8Array): Uint8Array {
  const blocks: Uint8Array[] = [];
  let offset = 0;
  while (offset < data.length) {
    const chunkSize = Math.min(0xffff, data.length - offset);
    const block = new Uint8Array(5 + chunkSize);
    const isFinal = offset + chunkSize >= data.length ? 1 : 0;
    block[0] = isFinal; // BFINAL flag with stored block type
    block[1] = chunkSize & 0xff;
    block[2] = (chunkSize >> 8) & 0xff;
    const inverse = (~chunkSize) & 0xffff;
    block[3] = inverse & 0xff;
    block[4] = (inverse >> 8) & 0xff;
    block.set(data.slice(offset, offset + chunkSize), 5);
    blocks.push(block);
    offset += chunkSize;
  }

  const header = new Uint8Array([0x78, 0x01]);
  const totalLength = header.length + blocks.reduce((acc, block) => acc + block.length, 0) + 4;
  const output = new Uint8Array(totalLength);
  output.set(header, 0);
  let writeOffset = header.length;
  for (const block of blocks) {
    output.set(block, writeOffset);
    writeOffset += block.length;
  }
  const checksum = adler32(data);
  output[writeOffset++] = (checksum >> 24) & 0xff;
  output[writeOffset++] = (checksum >> 16) & 0xff;
  output[writeOffset++] = (checksum >> 8) & 0xff;
  output[writeOffset++] = checksum & 0xff;
  return output;
}

function matrixToPngDataUrl(matrix: boolean[][], options?: QRRenderOptions): string {
  const margin = options?.margin ?? 4;
  const moduleCount = matrix.length;
  const pixelScale = options?.scale ?? 8;
  const width = (moduleCount + margin * 2) * pixelScale;
  const height = width;

  const rowStride = width * 4;
  const raw = new Uint8Array((rowStride + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowIndex = y * (rowStride + 1);
    raw[rowIndex] = 0;
    const moduleY = Math.floor(y / pixelScale) - margin;
    for (let x = 0; x < width; x++) {
      const moduleX = Math.floor(x / pixelScale) - margin;
      const isDark = moduleX >= 0 && moduleX < moduleCount && moduleY >= 0 && moduleY < moduleCount
        ? matrix[moduleY][moduleX]
        : false;
      const offset = rowIndex + 1 + x * 4;
      const color = isDark ? 0 : 255;
      raw[offset] = color;
      raw[offset + 1] = color;
      raw[offset + 2] = color;
      raw[offset + 3] = 255;
    }
  }

  const header = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = new Uint8Array(13);
  writeUint32(ihdr, 0, width);
  writeUint32(ihdr, 4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idatData = createStoredDeflate(raw);

  const ihdrChunk = createPngChunk('IHDR', ihdr);
  const idatChunk = createPngChunk('IDAT', idatData);
  const iendChunk = createPngChunk('IEND', new Uint8Array(0));

  const totalLength = header.length + ihdrChunk.length + idatChunk.length + iendChunk.length;
  const png = new Uint8Array(totalLength);
  let pointer = 0;
  png.set(header, pointer); pointer += header.length;
  png.set(ihdrChunk, pointer); pointer += ihdrChunk.length;
  png.set(idatChunk, pointer); pointer += idatChunk.length;
  png.set(iendChunk, pointer);

  return `data:image/png;base64,${base64Encode(png)}`;
}

function createPngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const lengthBytes = new Uint8Array(4);
  writeUint32(lengthBytes, 0, data.length);
  const crcInput = new Uint8Array(typeBytes.length + data.length);
  crcInput.set(typeBytes, 0);
  crcInput.set(data, typeBytes.length);
  const crc = crc32(crcInput);
  const crcBytes = new Uint8Array(4);
  writeUint32(crcBytes, 0, crc);

  const chunk = new Uint8Array(4 + typeBytes.length + data.length + 4);
  let offset = 0;
  chunk.set(lengthBytes, offset); offset += 4;
  chunk.set(typeBytes, offset); offset += typeBytes.length;
  chunk.set(data, offset); offset += data.length;
  chunk.set(crcBytes, offset);
  return chunk;
}

function writeUint32(buffer: Uint8Array, offset: number, value: number): void {
  buffer[offset] = (value >>> 24) & 0xff;
  buffer[offset + 1] = (value >>> 16) & 0xff;
  buffer[offset + 2] = (value >>> 8) & 0xff;
  buffer[offset + 3] = value & 0xff;
}

function base64Encode(bytes: Uint8Array): string {
  const globalBuffer = typeof globalThis !== 'undefined' ? (globalThis as any).Buffer : undefined;
  if (globalBuffer) {
    return globalBuffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export interface QRRenderOptions {
  margin?: number;
  scale?: number;
  type?: 'png' | 'svg';
}

export interface QRCodeResult {
  dataUrl: string;
  matrix: boolean[][];
  maskPattern: number;
}

export function generateQrMatrix(data: string): { matrix: boolean[][]; maskPattern: number } {
  const encoded = utf8Encode(data);
  const dataCodewords = encodeDataBytes(encoded);
  const generator = reedSolomonGenerator(ERROR_CORRECTION_CODEWORDS);
  const ecCodewords = reedSolomonComputeRemainder([...dataCodewords, ...Array(ERROR_CORRECTION_CODEWORDS).fill(0)], generator);
  const codewords = interleaveCodewords(dataCodewords, ecCodewords);
  const dataBits = createDataBits(codewords);

  const { modules, reserved, dataMask } = createEmptyMatrix();
  placeFinderPattern(modules, reserved, 0, 0);
  placeFinderPattern(modules, reserved, 0, MODULE_COUNT - 7);
  placeFinderPattern(modules, reserved, MODULE_COUNT - 7, 0);
  placeTimingPatterns(modules, reserved);
  reserveFormatAreas(reserved);
  placeDarkModule(modules, reserved);
  placeDataBits(modules, reserved, dataMask, dataBits);

  const { maskIndex, masked } = chooseBestMask(modules, dataMask);
  const formatBits = computeFormatBits(maskIndex);
  placeFormatInformation(masked, formatBits);

  const matrix = masked.map((row) => row.map((value) => Boolean(value)));
  return { matrix, maskPattern: maskIndex };
}

export function generateQrCode(data: string, options?: QRRenderOptions): QRCodeResult {
  const { matrix, maskPattern } = generateQrMatrix(data);
  const type = options?.type ?? 'png';
  const dataUrl = type === 'svg'
    ? matrixToSvgDataUrl(matrix, options)
    : matrixToPngDataUrl(matrix, options);
  return { dataUrl, matrix, maskPattern };
}

export async function generateQrBlob(data: string, options?: QRRenderOptions): Promise<Blob> {
  const { dataUrl } = generateQrCode(data, options);
  if (typeof fetch !== 'function') {
    throw new Error('Blob conversion requires fetch support');
  }
  const response = await fetch(dataUrl);
  return await response.blob();
}

export function matrixToImageData(matrix: boolean[][], scale = 8, margin = 4): { data: Uint8ClampedArray; width: number; height: number } {
  const moduleCount = matrix.length;
  const width = (moduleCount + margin * 2) * scale;
  const height = width;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const moduleY = Math.floor(y / scale) - margin;
    for (let x = 0; x < width; x++) {
      const moduleX = Math.floor(x / scale) - margin;
      const isDark = moduleX >= 0 && moduleX < moduleCount && moduleY >= 0 && moduleY < moduleCount
        ? matrix[moduleY][moduleX]
        : false;
      const offset = (y * width + x) * 4;
      const color = isDark ? 0 : 255;
      data[offset] = color;
      data[offset + 1] = color;
      data[offset + 2] = color;
      data[offset + 3] = 255;
    }
  }
  return { data, width, height };
}
