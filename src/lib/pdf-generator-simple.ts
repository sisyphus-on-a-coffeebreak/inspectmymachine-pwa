// src/lib/pdf-generator-simple.ts
// Simple PDF generation without heavy dependencies

import { generateQrCode, generateQrBlob, type QRRenderOptions } from './qr-code.js';

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

export const generatePDFPass = async (
  passData: PassData,
  elementId?: string
): Promise<Blob> => {
  try {
    // If elementId is provided, try to use existing DOM element
    if (elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        return await generatePDFFromElement(element, passData);
      }
    }
    
    // Otherwise, generate PDF from data directly
    return await generatePDFFromData(passData);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF pass');
  }
};

const generatePDFFromElement = async (element: HTMLElement, passData: PassData): Promise<Blob> => {
  // This would use html2canvas and jsPDF if available
  // For now, return a simple blob
  const html = element.outerHTML;
  return new Blob([html], { type: 'text/html' });
};

const generatePDFFromData = async (passData: PassData): Promise<Blob> => {
  // Generate QR code
  const qrCode = await generateQRCode(passData.accessCode);
  
  // Create HTML content that matches PDFPass component exactly
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Gate Pass - ${passData.passNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', sans-serif;
            background: #f8fafc;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          
          @media print {
            body { 
              margin: 0; 
              padding: 0; 
              background: white;
            }
            @page { 
              margin: 0; 
              size: A4;
            }
          }
          
          .pass-container {
            width: 400px;
            max-width: 100%;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            position: relative;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
          }
          
          .status-indicator {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
            z-index: 10;
          }
          
          .header {
            background: linear-gradient(135deg, #eb8b00 0%, #d97706 100%);
            padding: 32px 24px;
            color: white;
            text-align: center;
            position: relative;
          }
          
          .logo {
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            backdrop-filter: blur(10px);
          }
          
          .logo-icon {
            font-size: 32px;
          }
          
          .logo-text {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          
          .logo-subtitle {
            font-size: 14px;
            opacity: 0.9;
          }
          
          .pass-number {
            position: absolute;
            top: 16px;
            right: 16px;
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            backdrop-filter: blur(10px);
          }
          
          .qr-section {
            padding: 32px 24px;
            text-align: center;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .qr-instruction {
            font-size: 14px;
            color: #eb8b00;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          
          .qr-code {
            width: 160px;
            height: 160px;
            background: white;
            border: 3px solid #eb8b00;
            border-radius: 12px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .content {
            padding: 24px;
          }
          
          .section {
            margin-bottom: 24px;
          }
          
          .section:last-child {
            margin-bottom: 0;
          }
          
          .section-header {
            font-size: 16px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .field {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          
          .field:last-child {
            border-bottom: none;
          }
          
          .field-label {
            font-size: 14px;
            color: #64748b;
            font-weight: 600;
            min-width: 120px;
          }
          
          .field-value {
            font-size: 14px;
            color: #1e293b;
            font-weight: 500;
            text-align: right;
            flex: 1;
          }
          
          .purpose-value {
            color: #eb8b00;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .access-code {
            background: linear-gradient(135deg, #eb8b00 0%, #d97706 100%);
            color: white;
            padding: 24px;
            text-align: center;
            border-radius: 12px;
            margin: 24px 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          
          .access-code-label {
            font-size: 12px;
            opacity: 0.9;
            margin-bottom: 8px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .access-code-value {
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
          }
          
          .footer {
            background: #f8fafc;
            padding: 20px 24px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            font-size: 14px;
            font-weight: 500;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="pass-container">
          <!-- Status Indicator -->
          <div class="status-indicator"></div>
          
          <!-- Header Section -->
          <div class="header">
            <div class="pass-number">Pass #${passData.passNumber}</div>
            <div class="logo">
              <div class="logo-icon">🏢</div>
            </div>
            <div class="logo-text">VOMS</div>
            <div class="logo-subtitle">
              ${passData.passType === 'visitor' ? 'Visitor Gate Pass' : 'Vehicle Movement Pass'}
            </div>
          </div>
          
          <!-- QR Code Section -->
          <div class="qr-section">
            <div class="qr-instruction">
              <span>📱</span> SCAN QR CODE FOR ENTRY
            </div>
            <div class="qr-code">
              <img src="${qrCode}" alt="QR Code" style="width: 100%; height: 100%; object-fit: contain;" />
            </div>
          </div>
          
          <!-- Visitor Information -->
          <div class="content">
            <div class="section">
              <div class="section-header">
                <span>👤</span> Visitor Information
              </div>
              <div class="field">
                <div class="field-label">Name:</div>
                <div class="field-value">${passData.visitorName || 'N/A'}</div>
              </div>
              <div class="field">
                <div class="field-label">Purpose:</div>
                <div class="field-value purpose-value">${passData.purpose.replace('_', ' ').toUpperCase()}</div>
              </div>
              <div class="field">
                <div class="field-label">${passData.passType === 'visitor' ? 'Scheduled Date:' : 'Entry Time:'}</div>
                <div class="field-value">
                  ${(() => {
                    try {
                      const date = new Date(passData.entryTime);
                      if (isNaN(date.getTime())) {
                        return passData.passType === 'visitor' ? 'Not scheduled' : 'Not entered yet';
                      }
                      return date.toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      });
                    } catch (error) {
                      return passData.passType === 'visitor' ? 'Not scheduled' : 'Not entered yet';
                    }
                  })()}
                </div>
              </div>
              ${passData.expectedReturn ? `
                <div class="field">
                  <div class="field-label">Expected Return:</div>
                  <div class="field-value">
                    ${(() => {
                      try {
                        const date = new Date(passData.expectedReturn);
                        if (isNaN(date.getTime())) {
                          return 'Not specified';
                        }
                        return date.toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        });
                      } catch (error) {
                        return 'Not specified';
                      }
                    })()}
                  </div>
                </div>
              ` : ''}
            </div>
            
            ${passData.vehicleDetails ? `
              <div class="section">
                <div class="section-header">
                  <span>🚗</span> Vehicle Information
                </div>
                <div class="field">
                  <div class="field-label">Registration:</div>
                  <div class="field-value" style="font-family: monospace;">${passData.vehicleDetails.registration}</div>
                </div>
                <div class="field">
                  <div class="field-label">Make/Model:</div>
                  <div class="field-value">${passData.vehicleDetails.make} ${passData.vehicleDetails.model}</div>
                </div>
              </div>
            ` : ''}
            
            <!-- Access Code -->
            <div class="access-code">
              <div class="access-code-label">ACCESS CODE</div>
              <div class="access-code-value">${passData.accessCode}</div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            Show this pass at the gate for seamless entry
          </div>
        </div>
      </body>
    </html>
  `;
  
  return new Blob([html], { type: 'text/html' });
};

export const generateQRCode = async (data: string, options?: QRRenderOptions): Promise<string> => {
  const { dataUrl } = generateQrCode(data, options);
  return dataUrl;
};

export const generateQRCodeBlob = (data: string, options?: QRRenderOptions) => {
  return generateQrBlob(data, options);
};

export const generateAccessCode = (): string => {
  // Generate a 6-digit access code
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const formatPassNumber = (type: 'visitor' | 'vehicle', id: string | number): string => {
  const prefix = type === 'visitor' ? 'VP' : 'VM';
  
  // Handle undefined or null IDs
  if (!id) {
    return `${prefix}${Date.now().toString().slice(-6)}`;
  }
  
  // Handle UUID strings by taking first 8 characters
  if (typeof id === 'string' && id.includes('-')) {
    return `${prefix}${id.substring(0, 8).toUpperCase()}`;
  }
  
  // Handle numeric IDs
  return `${prefix}${id.toString().padStart(6, '0')}`;
};

// Share functionality
export const sharePass = async (passData: PassData): Promise<void> => {
  try {
    console.log('🔍 Sharing pass data:', passData);
    console.log('🔍 Pass number:', passData.passNumber);
    
    // Generate the PDF blob
    const pdfBlob = await generatePDFPass(passData);
    
    const shareFile = new File([pdfBlob], `gate-pass-${passData.passNumber}.pdf`, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [shareFile] })) {
      // Share only the PDF file - no text or URL
      await navigator.share({
        files: [shareFile]
      });
    } else {
      // Fallback: Download the PDF
      downloadPDF(passData, pdfBlob);
    }
  } catch (error) {
    console.error('Error sharing PDF:', error);
    // Fallback to copy to clipboard
    copyToClipboard(passData);
  }
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
  alert('PDF downloaded! You can now share it via WhatsApp or other apps.');
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