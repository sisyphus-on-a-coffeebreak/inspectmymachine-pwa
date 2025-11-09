import test from 'node:test';
import assert from 'node:assert/strict';
import jsQR from 'jsqr';
import { generateQrCode, generateQrMatrix, matrixToImageData } from '../test-dist/qr-code.js';
import { generateQRCode as generateSimpleQr } from '../test-dist/pdf-generator-simple.js';

const SAMPLE_DATA = 'ACCESS-123456';

test('creates PNG data URLs by default', () => {
  const { dataUrl } = generateQrCode(SAMPLE_DATA);
  assert.ok(dataUrl.startsWith('data:image/png;base64,'));
});

test('creates SVG data URLs when requested', () => {
  const { dataUrl } = generateQrCode(SAMPLE_DATA, { type: 'svg' });
  assert.ok(dataUrl.startsWith('data:image/svg+xml;base64,'));
});

test('fails gracefully for payloads that exceed version capacity', () => {
  const oversized = 'X'.repeat(32);
  assert.throws(() => generateQrMatrix(oversized));
});

test('produces QR codes that jsQR can decode', async () => {
  const { matrix } = generateQrMatrix(SAMPLE_DATA);
  const image = matrixToImageData(matrix, 8, 4);
  const result = jsQR(image.data, image.width, image.height);
  assert.ok(result);
  assert.equal(result?.data, SAMPLE_DATA);

  const simpleDataUrl = await generateSimpleQr(SAMPLE_DATA);
  assert.ok(
    simpleDataUrl.startsWith('data:image/png;base64,') ||
    simpleDataUrl.startsWith('data:image/svg+xml;base64,')
  );
});
