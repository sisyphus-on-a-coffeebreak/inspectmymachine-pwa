import type { jsPDF as JsPDFConstructor } from 'jspdf';

export interface PassData {
  passNumber: string;
  passType: 'visitor' | 'vehicle';
  visitorName?: string;
  vehicleDetails?: {
    registration: string;
    make: string;
    model: string;
  };
  purpose: string;
  entryTime: string;
  expectedReturn?: string;
  accessCode: string;
  qrCode?: string;
  companyName?: string;
  companyLogo?: string;
}

const PASS_CARD_WIDTH_MM = 85;
const PASS_CARD_HEIGHT_MM = 128;

let html2canvasPromise: Promise<typeof import('html2canvas')['default']> | null = null;
let jsPdfConstructorPromise: Promise<JsPDFConstructor> | null = null;
let qrCodeModulePromise: Promise<typeof import('qrcode')> | null = null;

const loadHtml2Canvas = async () => {
  if (!html2canvasPromise) {
    html2canvasPromise = import('html2canvas').then((mod) => mod.default || mod);
  }
  return html2canvasPromise;
};

const loadJsPdf = async () => {
  if (!jsPdfConstructorPromise) {
    jsPdfConstructorPromise = import('jspdf').then((mod) => (mod.jsPDF || (mod.default as unknown as JsPDFConstructor)));
  }
  return jsPdfConstructorPromise;
};

const loadQrCodeModule = async () => {
  if (!qrCodeModulePromise) {
    qrCodeModulePromise = import('qrcode');
  }
  return qrCodeModulePromise;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDateTime = (value?: string) => {
  if (!value) {
    return '';
  }
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    console.warn('Unable to format date value for PDF pass', error);
    return value;
  }
};

const renderElementToPdf = async (element: HTMLElement): Promise<Blob> => {
  try {
    const [html2canvas, JsPDF] = await Promise.all([loadHtml2Canvas(), loadJsPdf()]);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new JsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [PASS_CARD_WIDTH_MM, PASS_CARD_HEIGHT_MM],
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);

    const blob = pdf.output('blob');
    if (blob instanceof Blob) {
      return blob;
    }

    return new Blob([blob], { type: 'application/pdf' });
  } catch (error) {
    console.error('Failed to generate PDF via html2canvas/jsPDF pipeline. Falling back to HTML blob.', error);
    return new Blob([element.outerHTML], { type: 'text/html' });
  }
};

const createPassMarkup = (passData: PassData & { qrCode: string }): string => {
  const {
    passNumber,
    passType,
    visitorName,
    vehicleDetails,
    purpose,
    entryTime,
    expectedReturn,
    accessCode,
    qrCode,
    companyName,
    companyLogo,
  } = passData;

  const vehicleBlock = vehicleDetails
    ? `
          <div class="info-row">
            <span class="label">Vehicle:</span>
            <span class="value">${escapeHtml(vehicleDetails.registration)} · ${escapeHtml(vehicleDetails.make)} ${escapeHtml(vehicleDetails.model)}</span>
          </div>
        `
    : '';

  const companyBlock = companyName
    ? `
          <div class="company">
            ${companyLogo ? `<img src="${companyLogo}" alt="${escapeHtml(companyName)} logo" />` : ''}
            <div class="company-text">
              <span class="company-name">${escapeHtml(companyName)}</span>
              <span class="company-tagline">Secure visitor management</span>
            </div>
          </div>
        `
    : '';

  return `
    <div class="pass-print" data-pass-card>
      <style>
        *, *::before, *::after { box-sizing: border-box; }
        .pass-print {
          width: 400px;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
        }
        .status-bar {
          height: 4px;
          background: linear-gradient(90deg, #0ea5e9 0%, #6366f1 100%);
        }
        .header {
          padding: 24px;
          background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%);
          color: #ffffff;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
        }
        .pass-number {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255,255,255,0.12);
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          letter-spacing: 0.08em;
        }
        .title {
          font-size: 22px;
          font-weight: 700;
          margin: 0;
        }
        .sub-title {
          font-size: 14px;
          opacity: 0.9;
        }
        .company {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .company img {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          object-fit: cover;
          border: 2px solid rgba(255,255,255,0.35);
        }
        .company-name {
          display: block;
          font-weight: 600;
          font-size: 16px;
        }
        .company-tagline {
          font-size: 12px;
          opacity: 0.7;
        }
        .qr-section {
          padding: 24px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          border-bottom: 1px solid #e2e8f0;
        }
        .qr-section img {
          width: 180px;
          height: 180px;
          border-radius: 12px;
          border: 3px solid #1d4ed8;
          padding: 12px;
          background: #ffffff;
          box-shadow: inset 0 0 0 4px rgba(29, 78, 216, 0.1);
        }
        .qr-instruction {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #1d4ed8;
        }
        .body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .info-row {
          display: flex;
          gap: 12px;
          font-size: 14px;
          color: #1e293b;
        }
        .info-row .label {
          width: 96px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.08em;
        }
        .info-row .value {
          flex: 1;
        }
        .footer {
          padding: 20px 24px 28px;
          background: linear-gradient(0deg, rgba(15,23,42,0.08), rgba(15,23,42,0));
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 12px;
          color: #475569;
        }
        .footer strong {
          color: #0f172a;
        }
      </style>
      <div class="status-bar"></div>
      <div class="header">
        <div class="pass-number">${escapeHtml(passNumber)}</div>
        <h1 class="title">${passType === 'visitor' ? 'Visitor' : 'Vehicle'} Gate Pass</h1>
        <span class="sub-title">Present this pass at security</span>
        ${companyBlock}
      </div>
      <div class="qr-section">
        <span class="qr-instruction">Scan for verification</span>
        <img src="${qrCode}" alt="QR code for gate access ${escapeHtml(accessCode)}" />
      </div>
      <div class="body">
        ${visitorName ? `
          <div class="info-row">
            <span class="label">Name</span>
            <span class="value">${escapeHtml(visitorName)}</span>
          </div>
        ` : ''}
        ${vehicleBlock}
        <div class="info-row">
          <span class="label">Purpose</span>
          <span class="value">${escapeHtml(purpose)}</span>
        </div>
        <div class="info-row">
          <span class="label">Entry</span>
          <span class="value">${escapeHtml(formatDateTime(entryTime) || '—')}</span>
        </div>
        <div class="info-row">
          <span class="label">Exit</span>
          <span class="value">${escapeHtml(formatDateTime(expectedReturn) || '—')}</span>
        </div>
      </div>
      <div class="footer">
        <span><strong>Access code:</strong> ${escapeHtml(accessCode)}</span>
        <span>Only valid for the scheduled visit. Contact reception for changes.</span>
      </div>
    </div>
  `;
};

const mountPassMarkup = (passData: PassData & { qrCode: string }): HTMLElement => {
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.pointerEvents = 'none';
  host.style.opacity = '0';
  host.style.left = '-9999px';
  host.style.top = '0';
  host.style.width = '420px';
  host.innerHTML = createPassMarkup(passData);
  document.body.appendChild(host);
  return host;
};

export const generatePDFPass = async (
  passData: PassData,
  elementId?: string
): Promise<Blob> => {
  const resolvedQrCode = passData.qrCode && passData.qrCode.trim().length > 0
    ? passData.qrCode
    : await generateQRCode(passData.accessCode);

  if (elementId) {
    const element = document.getElementById(elementId);
    if (element instanceof HTMLElement) {
      return renderElementToPdf(element);
    }
  }

  const host = mountPassMarkup({ ...passData, qrCode: resolvedQrCode });
  const target = host.querySelector('[data-pass-card]') as HTMLElement | null;

  try {
    return await renderElementToPdf(target || host);
  } finally {
    document.body.removeChild(host);
  }
};

export const generateQRCode = async (data: string): Promise<string> => {
  if (!data) {
    throw new Error('Cannot generate QR code for empty data');
  }

  try {
    const qrModule = await loadQrCodeModule();
    const toDataURL = qrModule.toDataURL || (qrModule.default && (qrModule.default as any).toDataURL);
    if (!toDataURL) {
      throw new Error('QR code library missing toDataURL export');
    }

    return await toDataURL(data, {
      margin: 1,
      width: 256,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (error) {
    console.error('Failed to generate QR code with library. Falling back to SVG placeholder.', error);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
        <rect width="256" height="256" fill="#ffffff" stroke="#0f172a" stroke-width="4" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="24" fill="#0f172a">${escapeHtml(data)}</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
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

const downloadPDF = (passData: PassData, pdfBlob: Blob): void => {
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `gate-pass-${passData.passNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const copyToClipboard = async (passData: PassData): Promise<void> => {
  const text = `Gate Pass #${passData.passNumber}` +
    `\nType: ${passData.passType === 'visitor' ? 'Visitor' : 'Vehicle'}` +
    `\nPurpose: ${passData.purpose}` +
    `\nAccess Code: ${passData.accessCode}` +
    `\nEntry Time: ${formatDateTime(passData.entryTime)}` +
    (passData.expectedReturn ? `\nExpected Return: ${formatDateTime(passData.expectedReturn)}` : '');

  try {
    await navigator.clipboard.writeText(text);
    alert('Pass details copied to clipboard!');
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    alert('Failed to copy to clipboard');
  }
};

export const sharePass = async (passData: PassData): Promise<void> => {
  try {
    const pdfBlob = await generatePDFPass(passData);

    if (navigator.share && navigator.canShare) {
      const file = new File([pdfBlob], `gate-pass-${passData.passNumber}.pdf`, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
    }

    downloadPDF(passData, pdfBlob);
  } catch (error) {
    console.error('Error sharing PDF:', error);
    await copyToClipboard(passData);
  }
};

export const printPass = async (passData: PassData): Promise<void> => {
  try {
    const pdfBlob = await generatePDFPass(passData);
    const url = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.focus();
        printWindow.print();
      });
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    console.error('Error printing pass:', error);
    alert('Failed to print pass. Please try again.');
  }
};

export default {
  generatePDFPass,
  generateQRCode,
  generateAccessCode,
  formatPassNumber,
  sharePass,
  printPass,
};
