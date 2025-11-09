import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PassData } from './pdf-types';

const html2canvasMock = vi.fn();
const addImageMock = vi.fn();
const outputMock = vi.fn();

const jsPDFConstructor = vi.fn().mockImplementation(function (this: any) {
  this.internal = {
    pageSize: {
      getWidth: () => 105,
      getHeight: () => 148
    }
  };
  this.addImage = addImageMock;
  this.output = outputMock;
});

vi.mock('html2canvas', () => ({ default: html2canvasMock }));
vi.mock('jspdf', () => ({ default: jsPDFConstructor, jsPDF: jsPDFConstructor }));

const basePassData: PassData = {
  passNumber: 'VP000001',
  passType: 'visitor',
  visitorName: 'Test Visitor',
  purpose: 'Testing',
  entryTime: new Date().toISOString(),
  accessCode: '123456'
};

const ensureDevicePixelRatio = () => {
  Object.defineProperty(window, 'devicePixelRatio', {
    configurable: true,
    value: 2
  });
};

describe('generatePDFPass', () => {
  beforeEach(() => {
    html2canvasMock.mockReset();
    addImageMock.mockReset();
    outputMock.mockReset();
    jsPDFConstructor.mockClear();
    document.body.innerHTML = '';
    ensureDevicePixelRatio();
    vi.resetModules();
  });

  it('produces a PDF blob when html2canvas succeeds', async () => {
    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'width', { configurable: true, value: 400 });
    Object.defineProperty(canvas, 'height', { configurable: true, value: 560 });
    canvas.toDataURL = vi.fn(() => `data:image/png;base64,${btoa('mock-image')}`);

    html2canvasMock.mockResolvedValue(canvas);
    outputMock.mockImplementation((type: string) => {
      if (type === 'blob') {
        return new Blob(['%PDF-FAKE'], { type: 'application/pdf' });
      }
      if (type === 'arraybuffer') {
        return new TextEncoder().encode('%PDF-FAKE').buffer;
      }
      throw new Error(`Unsupported output type: ${type}`);
    });

    document.body.innerHTML = '<div id="pdf-pass-container">PDF Content</div>';

    const { generatePDFPass } = await import('./pdf-generator');
    const blob = await generatePDFPass(basePassData);

    expect(html2canvasMock).toHaveBeenCalledOnce();
    expect(addImageMock).toHaveBeenCalledOnce();
    expect(blob).toBeInstanceOf(Blob);
    const text = await blob.text();
    expect(text.startsWith('%PDF-')).toBe(true);
  });

  it('falls back to the lightweight generator when no element is available', async () => {
    html2canvasMock.mockImplementation(() => {
      throw new Error('should not be called without element');
    });

    const { generatePDFPass } = await import('./pdf-generator');
    const blob = await generatePDFPass(basePassData, null);

    expect(blob).toBeInstanceOf(Blob);
    const buffer = await blob.arrayBuffer();
    const header = new TextDecoder('ascii').decode(buffer.slice(0, 5));
    expect(header).toBe('%PDF-');
  });
});
