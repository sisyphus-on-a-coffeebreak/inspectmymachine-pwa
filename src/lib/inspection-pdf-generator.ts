/**
 * PDF Generation Utilities for Inspections
 * Extracted from InspectionDetails.tsx for better code organization
 */

interface InspectionForPDF {
  id: string;
  vehicle?: {
    make?: string;
    model?: string;
    registration_number?: string;
  };
  inspector?: {
    name?: string;
  };
  overall_rating?: number;
  pass_fail?: string;
  completed_at?: string;
  created_at: string;
  template?: {
    name?: string;
    sections?: Array<{
      id: string;
      name: string;
      questions: Array<{
        id: string;
        question_text: string;
        is_critical: boolean;
      }>;
    }>;
  };
  answers?: Array<{
    question_id: string;
    answer_value: any;
    is_critical_finding: boolean;
  }>;
  inspector_notes?: string;
  has_critical_issues?: boolean;
}

export function generateInspectionPDFHTML(
  inspection: InspectionForPDF,
  branding?: {
    logoUrl?: string | null;
    companyName?: string;
    tradingAs?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    primaryColor?: string;
    secondaryColor?: string;
    showLogoInHeader?: boolean;
    showAddressInHeader?: boolean;
    showContactInFooter?: boolean;
    footerText?: string | null;
    includeQRCode?: boolean;
  }
): string {
  const primaryColor = branding?.primaryColor || '#2563eb';
  const secondaryColor = branding?.secondaryColor || '#1e40af';
  const companyName = branding?.companyName || 'VOMS';
  const showLogo = branding?.showLogoInHeader !== false && branding?.logoUrl;
  const showAddress = branding?.showAddressInHeader !== false;
  const showContact = branding?.showContactInFooter !== false;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Vehicle Inspection Report - ${inspection.id}</title>
      <style>
        @media print {
          @page {
            margin: 0.5in;
            size: A4;
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            font-size: 12px;
            line-height: 1.4;
          }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
        }
        
        .header { 
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px; 
          border-bottom: 2px solid ${primaryColor};
          padding-bottom: 20px;
        }
        .header-left {
          flex: 0 0 auto;
        }
        .header-right {
          flex: 1;
          text-align: right;
          margin-left: 20px;
        }
        .logo-img {
          max-width: 150px;
          max-height: 50px;
          object-fit: contain;
        }
        .company-name { 
          font-size: 24px; 
          font-weight: bold; 
          color: ${primaryColor}; 
          margin-bottom: 5px;
        }
        .trading-as {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 5px;
        }
        .header-address {
          font-size: 11px;
          color: #6b7280;
          line-height: 1.4;
        }
        .report-title { 
          font-size: 18px; 
          margin: 10px 0; 
          color: #1f2937;
          text-align: center;
        }
        .report-id { 
          font-size: 14px; 
          color: #6b7280;
          text-align: center;
        }
        
        .inspection-info { 
          background: #f8fafc; 
          padding: 15px; 
          border-radius: 8px; 
          margin-bottom: 20px;
          border: 1px solid #e5e7eb;
        }
        .info-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 15px; 
        }
        .info-item { 
          display: flex; 
          justify-content: space-between; 
          padding: 5px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-item:last-child { 
          border-bottom: none; 
        }
        .info-label { 
          font-weight: bold; 
          color: #374151;
        }
        .info-value { 
          color: #1f2937;
        }
        
        .section { 
          margin: 25px 0; 
          page-break-inside: avoid;
        }
        .section-title { 
          font-size: 16px; 
          font-weight: bold; 
          color: #1f2937; 
          margin-bottom: 15px;
          padding: 10px;
          background: #f3f4f6;
          border-left: 4px solid ${secondaryColor};
        }
        
        .question { 
          margin: 12px 0; 
          padding: 12px; 
          background: #ffffff; 
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          page-break-inside: avoid;
        }
        .question-text { 
          font-weight: bold; 
          margin-bottom: 8px; 
          color: #1f2937;
          font-size: 13px;
        }
        .answer { 
          color: #374151; 
          padding: 8px;
          background: #f9fafb;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }
        .critical { 
          border-left: 4px solid #ef4444; 
          background: #fef2f2;
        }
        .critical-label {
          background: #ef4444;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          margin-left: 8px;
        }
        
        .status-pass { color: #059669; font-weight: bold; }
        .status-fail { color: #dc2626; font-weight: bold; }
        .status-conditional { color: #d97706; font-weight: bold; }
        
        .notes-section {
          margin-top: 30px;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #6b7280;
          font-size: 10px;
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
        }
        .footer-text {
          margin-bottom: 8px;
        }
        .footer-contact {
          margin-top: 8px;
        }
        .qr-code-placeholder {
          margin-top: 10px;
          padding: 10px;
          background: #f3f4f6;
          border-radius: 4px;
          display: inline-block;
        }
        
        .critical-issues {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 10px;
          border-radius: 6px;
          margin: 15px 0;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${showLogo ? `
          <div class="header-left">
            <img src="${branding.logoUrl}" alt="${companyName} Logo" class="logo-img" />
          </div>
        ` : ''}
        <div class="header-right">
          <div class="company-name">${companyName}</div>
          ${branding?.tradingAs ? `<div class="trading-as">${branding.tradingAs}</div>` : ''}
          ${showAddress && (branding?.addressLine1 || branding?.addressLine2) ? `
            <div class="header-address">
              ${branding.addressLine1 || ''}
              ${branding.addressLine1 && branding.addressLine2 ? '<br />' : ''}
              ${branding.addressLine2 || ''}
            </div>
          ` : ''}
        </div>
      </div>
      <div style="text-align: center; margin-bottom: 20px;">
        <div class="report-title">Vehicle Inspection Report (VIR)</div>
        <div class="report-id">Report ID: ${inspection.id}</div>
      </div>

      <div class="inspection-info">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Vehicle:</span>
            <span class="info-value">${inspection.vehicle?.make || 'N/A'} ${inspection.vehicle?.model || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Registration:</span>
            <span class="info-value">${inspection.vehicle?.registration_number || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Inspector:</span>
            <span class="info-value">${inspection.inspector?.name || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Date:</span>
            <span class="info-value">${new Date(inspection.completed_at || inspection.created_at).toLocaleDateString('en-IN')}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Overall Rating:</span>
            <span class="info-value">${inspection.overall_rating || 'N/A'}/10</span>
          </div>
          <div class="info-item">
            <span class="info-label">Result:</span>
            <span class="info-value">
              <span class="status-${inspection.pass_fail || 'unknown'}">${inspection.pass_fail || 'N/A'}</span>
            </span>
          </div>
        </div>
      </div>

      ${inspection.has_critical_issues ? `
        <div class="critical-issues">
          ⚠️ Critical Issues Found - Immediate attention required
        </div>
      ` : ''}

      ${inspection.template?.sections?.map(section => `
        <div class="section">
          <div class="section-title">${section.name}</div>
          ${section.questions?.map(question => {
            const answer = inspection.answers?.find(a => a.question_id === question.id);
            const isCritical = question.is_critical || answer?.is_critical_finding;
            return `
              <div class="question ${isCritical ? 'critical' : ''}">
                <div class="question-text">
                  ${question.question_text}
                  ${isCritical ? '<span class="critical-label">CRITICAL</span>' : ''}
                </div>
                <div class="answer">
                  ${answer ? (typeof answer.answer_value === 'object' ? JSON.stringify(answer.answer_value) : String(answer.answer_value)) : 'No answer provided'}
                </div>
              </div>
            `;
          }).join('') || ''}
        </div>
      `).join('') || ''}

      ${inspection.inspector_notes ? `
        <div class="notes-section">
          <strong>Inspector Notes:</strong>
          <p>${inspection.inspector_notes}</p>
        </div>
      ` : ''}

      <div class="footer">
        ${branding?.footerText ? `<div class="footer-text">${branding.footerText}</div>` : ''}
        ${showContact && (branding?.phone || branding?.email || branding?.website) ? `
          <div class="footer-contact">
            ${branding.phone ? `Phone: ${branding.phone}` : ''}
            ${branding.phone && branding.email ? ' | ' : ''}
            ${branding.email ? `Email: ${branding.email}` : ''}
            ${(branding.phone || branding.email) && branding.website ? ' | ' : ''}
            ${branding.website ? `Website: ${branding.website}` : ''}
          </div>
        ` : ''}
        <div style="margin-top: 8px;">
          Generated on ${new Date().toLocaleString('en-IN')} | ${companyName} Inspection System
        </div>
        ${branding?.includeQRCode ? `
          <div class="qr-code-placeholder">
            [QR Code: ${inspection.id}]
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
}

export async function generateInspectionPDF(inspection: InspectionForPDF, inspectionId: string): Promise<void> {
  // Fetch branding settings
  let branding: Awaited<ReturnType<typeof import('./report-branding').getReportBranding>> | undefined;
  try {
    const { getReportBranding } = await import('./report-branding');
    branding = await getReportBranding();
  } catch (error) {
    console.warn('Failed to load branding settings, using defaults:', error);
  }

  // Try backend PDF generation first
  try {
    const axios = (await import('axios')).default;
    const { apiClient: client } = await import('../lib/apiClient');
    await (client as any).ensureCsrfToken?.();
    const csrfToken = (client as any).getCsrfToken?.();
    
    const response = await axios.get(`/v1/inspections/${inspectionId}/report`, {
      responseType: 'blob',
      withCredentials: true,
      headers: {
        ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
      },
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `VIR-${inspection.id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return;
  } catch (apiError) {
    // Fallback to client-side generation
  }
  
  // Client-side fallback
  await generateClientSidePDF(inspection, inspectionId, branding);
}

async function generateClientSidePDF(
  inspection: InspectionForPDF,
  inspectionId: string,
  branding?: Awaited<ReturnType<typeof import('./report-branding').getReportBranding>>
): Promise<void> {
  try {
    await generateNativePDF(inspection, branding);
  } catch (error) {
    try {
      await generatePDFViaPrint(inspection, branding);
    } catch (printError) {
      await generateDownloadableHTML(inspection, inspectionId, branding);
    }
  }
}

async function generateNativePDF(
  inspection: InspectionForPDF,
  branding?: Awaited<ReturnType<typeof import('./report-branding').getReportBranding>>
): Promise<void> {
  if (!window.print) {
    throw new Error('Browser does not support PDF generation');
  }

  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.style.width = '210mm';
  tempDiv.style.height = '297mm';
  tempDiv.innerHTML = generateInspectionPDFHTML(inspection, branding);
  document.body.appendChild(tempDiv);

  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    throw new Error('Could not open print window');
  }

  return new Promise<void>((resolve, reject) => {
    try {
      printWindow.document.write(generateInspectionPDFHTML(inspection, branding));
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          try {
            printWindow.print();
            setTimeout(() => {
              printWindow.close();
              document.body.removeChild(tempDiv);
              resolve();
            }, 2000);
          } catch (printError) {
            printWindow.close();
            document.body.removeChild(tempDiv);
            reject(printError);
          }
        }, 1000);
      };

      printWindow.onerror = () => {
        printWindow.close();
        document.body.removeChild(tempDiv);
        reject(new Error('Failed to load print window'));
      };
    } catch (error) {
      printWindow.close();
      reject(error);
    }
  });
}

async function generatePDFViaPrint(
  inspection: InspectionForPDF,
  branding?: Awaited<ReturnType<typeof import('./report-branding').getReportBranding>>
): Promise<void> {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.top = '-9999px';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  document.body.appendChild(iframe);

  return new Promise<void>((resolve, reject) => {
    iframe.onload = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
          reject(new Error('Could not access iframe document'));
          return;
        }

        iframeDoc.write(generateInspectionPDFHTML(inspection, branding));
        iframeDoc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.print();
            setTimeout(() => {
              document.body.removeChild(iframe);
              resolve();
            }, 2000);
          } catch (printError) {
            document.body.removeChild(iframe);
            reject(printError);
          }
        }, 500);
      } catch (error) {
        document.body.removeChild(iframe);
        reject(error);
      }
    };

    iframe.onerror = () => {
      document.body.removeChild(iframe);
      reject(new Error('Failed to load iframe'));
    };

    iframe.src = 'about:blank';
  });
}

async function generateDownloadableHTML(
  inspection: InspectionForPDF,
  inspectionId: string,
  branding?: Awaited<ReturnType<typeof import('./report-branding').getReportBranding>>
): Promise<void> {
  const htmlContent = generateInspectionPDFHTML(inspection, branding);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `VIR-${inspection.id}.html`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}



