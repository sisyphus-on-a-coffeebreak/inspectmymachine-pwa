import { generateQrCode, type QRRenderOptions } from './qr-code.js';

// Dynamic imports to handle dependencies
let html2canvas: any;
let jsPDF: any;

// Lazy load the dependencies
const loadDependencies = async () => {
  if (!html2canvas) {
    html2canvas = (await import('html2canvas')).default;
  }
  if (!jsPDF) {
    jsPDF = (await import('jspdf')).default;
  }
};

// PDF Generation Utility for VOMS Gate Passes
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
  companyName?: string;
  companyLogo?: string;
}

export const generatePDFPass = async (
  passData: PassData,
  elementId: string = 'pdf-pass-container'
): Promise<void> => {
  try {
    // Load dependencies
    await loadDependencies();

    // Get the pass element
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Pass element not found');
    }

    // Generate canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: 2, // High quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 400,
      height: 600
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [85, 128] // Credit card size
    });

    // Add image to PDF
    const imgWidth = 85;
    const imgHeight = 128;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `gate-pass-${passData.passNumber}-${timestamp}.pdf`;

    // Download PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF pass');
  }
};

export const generateQRCode = (data: string, options?: QRRenderOptions): string => {
  return generateQrCode(data, options).dataUrl;
};

export const generateAccessCode = (): string => {
  // Generate a 6-digit access code
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const formatPassNumber = (type: 'visitor' | 'vehicle', id: number): string => {
  const prefix = type === 'visitor' ? 'VP' : 'VM';
  return `${prefix}${id.toString().padStart(6, '0')}`;
};

// Share functionality
export const sharePass = async (passData: PassData): Promise<void> => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Gate Pass #${passData.passNumber}`,
        text: `${passData.passType === 'visitor' ? 'Visitor' : 'Vehicle'} gate pass for ${passData.purpose}`,
        url: window.location.origin
      });
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to copy to clipboard
      copyToClipboard(passData);
    }
  } else {
    // Fallback to copy to clipboard
    copyToClipboard(passData);
  }
};

const copyToClipboard = async (passData: PassData): Promise<void> => {
  const text = `Gate Pass #${passData.passNumber}
Type: ${passData.passType === 'visitor' ? 'Visitor' : 'Vehicle'}
Purpose: ${passData.purpose}
Access Code: ${passData.accessCode}
Entry Time: ${new Date(passData.entryTime).toLocaleString()}
${passData.expectedReturn ? `Expected Return: ${new Date(passData.expectedReturn).toLocaleString()}` : ''}`;

  try {
    await navigator.clipboard.writeText(text);
    alert('Pass details copied to clipboard!');
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    alert('Failed to copy to clipboard');
  }
};

// Print functionality
export const printPass = (elementId: string = 'pdf-pass-container'): void => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Pass element not found');
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Failed to open print window');
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Gate Pass</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          @media print {
            body { margin: 0; padding: 0; }
            @page { margin: 0; size: 85mm 128mm; }
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
        <script>
          window.onload = function() {
            window.print();
            window.close();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export default {
  generatePDFPass,
  generateQRCode,
  generateAccessCode,
  formatPassNumber,
  sharePass,
  printPass
};
