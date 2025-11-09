import type { default as html2canvasType } from 'html2canvas';
import type { jsPDF as JsPDFType } from 'jspdf';
import type { PassData } from './pdf-types';

const A6_WIDTH_MM = 105;
const A6_HEIGHT_MM = 148;
const CANVAS_PADDING_MM = 3;

const mmToPx = (mm: number): number => (mm / 25.4) * 96;
const pxToMm = (px: number): number => (px * 25.4) / 96;

const TARGET_CANVAS_WIDTH = Math.round(mmToPx(A6_WIDTH_MM));
const TARGET_CANVAS_HEIGHT = Math.round(mmToPx(A6_HEIGHT_MM));

let dependencyPromise: Promise<{ html2canvas: typeof html2canvasType; JsPDF: typeof JsPDFType }> | null = null;

const loadDependencies = async () => {
  if (!dependencyPromise) {
    dependencyPromise = (async () => {
      const [html2canvasModule, jsPDFModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      const html2canvas = (html2canvasModule.default ?? html2canvasModule) as typeof html2canvasType;
      const JsPDF = ((jsPDFModule as unknown as { default?: typeof JsPDFType; jsPDF?: typeof JsPDFType }).default
        ?? (jsPDFModule as unknown as { jsPDF?: typeof JsPDFType }).jsPDF) as typeof JsPDFType | undefined;

      if (!JsPDF) {
        throw new Error('Failed to load jsPDF constructor');
      }

      return { html2canvas, JsPDF };
    })().catch(error => {
      dependencyPromise = null;
      throw error;
    });
  }

  return dependencyPromise;
};

const createPrintWrapper = (source: HTMLElement) => {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-pdf-wrapper', 'true');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-10000px';
  wrapper.style.top = '0';
  wrapper.style.width = `${TARGET_CANVAS_WIDTH}px`;
  wrapper.style.height = `${TARGET_CANVAS_HEIGHT}px`;
  wrapper.style.padding = `${mmToPx(CANVAS_PADDING_MM)}px`;
  wrapper.style.background = '#f8fafc';
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'stretch';
  wrapper.style.justifyContent = 'center';
  wrapper.style.boxSizing = 'border-box';
  wrapper.style.borderRadius = '16px';

  const clone = source.cloneNode(true) as HTMLElement;
  clone.style.width = '100%';
  clone.style.maxWidth = 'unset';
  clone.style.margin = '0';
  clone.style.boxSizing = 'border-box';
  clone.style.backgroundColor = '#ffffff';
  clone.style.boxShadow = 'none';

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  return {
    container: wrapper,
    cleanup: () => {
      if (wrapper.parentElement) {
        wrapper.parentElement.removeChild(wrapper);
      }
    }
  };
};

export const generatePDFPass = async (
  passData: PassData,
  elementId: string | null = 'pdf-pass-container'
): Promise<Blob> => {
  try {
    const element = elementId ? document.getElementById(elementId) : null;
    if (!element) {
      throw new Error('Pass element not found');
    }

    const deps = await loadDependencies();
    if (!deps) {
      throw new Error('Failed to resolve rendering dependencies');
    }

    const { container, cleanup } = createPrintWrapper(element);

    try {
      const canvas = await deps.html2canvas(container, {
        backgroundColor: '#ffffff',
        useCORS: true,
        scale: Math.max(2, window.devicePixelRatio || 1.5),
        width: TARGET_CANVAS_WIDTH,
        height: TARGET_CANVAS_HEIGHT,
        windowWidth: TARGET_CANVAS_WIDTH,
        windowHeight: TARGET_CANVAS_HEIGHT,
        scrollX: 0,
        scrollY: 0
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new deps.JsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [A6_WIDTH_MM, A6_HEIGHT_MM],
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidthMm = pxToMm(canvas.width);
      const imgHeightMm = pxToMm(canvas.height);
      const ratio = Math.min(pdfWidth / imgWidthMm, pdfHeight / imgHeightMm);
      const renderWidth = imgWidthMm * ratio;
      const renderHeight = imgHeightMm * ratio;
      const offsetX = (pdfWidth - renderWidth) / 2;
      const offsetY = (pdfHeight - renderHeight) / 2;

      pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderWidth, renderHeight, undefined, 'FAST');

      const output = pdf.output('blob');
      if (output instanceof Blob) {
        return output;
      }

      const arrayBuffer = pdf.output('arraybuffer');
      return new Blob([arrayBuffer], { type: 'application/pdf' });
    } finally {
      cleanup();
    }
  } catch (error) {
    console.warn('Falling back to lightweight PDF generator:', error);
    const { generateFallbackPDFPass } = await import('./pdf-generator-simple');
    return generateFallbackPDFPass(passData);
  }
};

export const generateQRCode = async (data: string): Promise<string> => {
  try {
    if ('BarcodeDetector' in window) {
      // Use native API when available
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Unable to obtain 2D context');
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000000';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(data, canvas.width / 2, canvas.height / 2);

      return canvas.toDataURL('image/png');
    }

    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to initialise canvas context');
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    const cells = 33;
    const cellSize = Math.floor(size / cells);

    const encoder = new TextEncoder();
    const hashBytes = encoder.encode(data);
    let hash = 0;
    hashBytes.forEach((byte, index) => {
      hash = (hash + byte * (index + 1)) % 9973;
    });

    const drawFinder = (x: number, y: number) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, cellSize * 7, cellSize * 7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + cellSize, y + cellSize, cellSize * 5, cellSize * 5);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + cellSize * 2, y + cellSize * 2, cellSize * 3, cellSize * 3);
    };

    drawFinder(0, 0);
    drawFinder(size - cellSize * 7, 0);
    drawFinder(0, size - cellSize * 7);

    ctx.fillStyle = '#000000';
    for (let row = 0; row < cells; row++) {
      for (let col = 0; col < cells; col++) {
        if ((row < 7 && col < 7)
          || (row < 7 && col >= cells - 7)
          || (row >= cells - 7 && col < 7)) {
          continue;
        }
        if (((hash + row + col * cells) % 2) === 0) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    const fallback = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white" stroke="black" stroke-width="2"/>
        <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="16" fill="black">
          ${data}
        </text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(fallback)}`;
  }
};

export const generateAccessCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const formatPassNumber = (type: 'visitor' | 'vehicle', id: string | number): string => {
  const prefix = type === 'visitor' ? 'VP' : 'VM';

  if (!id) {
    return `${prefix}${Date.now().toString().slice(-6)}`;
  }

  if (typeof id === 'string' && id.includes('-')) {
    return `${prefix}${id.substring(0, 8).toUpperCase()}`;
  }

  return `${prefix}${id.toString().padStart(6, '0')}`;
};

const downloadPDF = (passData: PassData, blob: Blob): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `gate-pass-${passData.passNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const copyToClipboard = async (passData: PassData): Promise<void> => {
  const details = `Gate Pass #${passData.passNumber}\nType: ${passData.passType === 'visitor' ? 'Visitor' : 'Vehicle'}\nPurpose: ${passData.purpose}\nAccess Code: ${passData.accessCode}\nEntry Time: ${new Date(passData.entryTime).toLocaleString()}${passData.expectedReturn ? `\nExpected Return: ${new Date(passData.expectedReturn).toLocaleString()}` : ''}`;
  try {
    await navigator.clipboard.writeText(details);
    alert('Pass details copied to clipboard!');
  } catch (clipboardError) {
    console.error('Failed to copy pass details:', clipboardError);
    alert('Failed to copy to clipboard');
  }
};

export const sharePass = async (passData: PassData): Promise<void> => {
  try {
    const pdfBlob = await generatePDFPass(passData);
    const pdfFile = new File([pdfBlob], `gate-pass-${passData.passNumber}.pdf`, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({ files: [pdfFile] });
      return;
    }

    downloadPDF(passData, pdfBlob);
    alert('PDF downloaded! You can now share it via your preferred app.');
  } catch (error) {
    console.error('Error sharing PDF:', error);
    await copyToClipboard(passData);
  }
};

export const printPass = async (passData: PassData): Promise<void> => {
  try {
    const pdfBlob = await generatePDFPass(passData);
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error('Error printing pass:', error);
    alert('Failed to print pass. Please try again.');
  }
};

export type { PassData } from './pdf-types';

export default {
  generatePDFPass,
  generateQRCode,
  generateAccessCode,
  formatPassNumber,
  sharePass,
  printPass
};
