import type { PassData } from './pdf-types';

const mmToPoints = (mm: number): number => (mm / 25.4) * 72;
const A6_WIDTH_MM = 105;
const A6_HEIGHT_MM = 148;
const PAGE_WIDTH = mmToPoints(A6_WIDTH_MM);
const PAGE_HEIGHT = mmToPoints(A6_HEIGHT_MM);

const escapePdfText = (value: string): string => value.replace(/[\\()]/g, match => `\\${match}`);

const buildContentStream = (passData: PassData): string => {
  const lines: string[] = [];

  lines.push(passData.companyName || 'VOMS Facilities');
  lines.push(passData.passType === 'visitor' ? 'Visitor Gate Pass' : 'Vehicle Movement Pass');
  lines.push(`Pass #${passData.passNumber}`);
  lines.push(`Purpose: ${passData.purpose}`);
  lines.push(`Entry: ${new Date(passData.entryTime).toLocaleString()}`);

  if (passData.expectedReturn) {
    lines.push(`Expected Return: ${new Date(passData.expectedReturn).toLocaleString()}`);
  }

  if (passData.visitorName) {
    lines.push(`Visitor: ${passData.visitorName}`);
  }

  if (passData.vehicleDetails) {
    const { registration, make, model } = passData.vehicleDetails;
    lines.push(`Vehicle: ${[make, model].filter(Boolean).join(' ')} (${registration || '—'})`);
  }

  lines.push(`Access Code: ${passData.accessCode}`);
  lines.push('Present this pass to security upon arrival.');

  const escapedLines = lines.map(escapePdfText);
  const initialY = PAGE_HEIGHT - mmToPoints(24);
  const leading = mmToPoints(6);

  let content = 'BT\n/F1 12 Tf\n';
  content += `${Math.round(mmToPoints(10) * 100) / 100} ${Math.round(initialY * 100) / 100} Td\n`;
  content += `(${escapedLines[0]}) Tj\n`;

  for (let i = 1; i < escapedLines.length; i++) {
    content += `0 -${Math.round(leading * 100) / 100} Td\n(${escapedLines[i]}) Tj\n`;
  }

  content += 'ET';
  return content;
};

const buildPdfBytes = (passData: PassData): Uint8Array => {
  const encoder = new TextEncoder();
  const contentStream = buildContentStream(passData);
  const contentBytes = encoder.encode(contentStream);

  const objects: string[] = [];
  const offsets: number[] = [];

  const pushObject = (body: string) => {
    offsets.push(0);
    objects.push(body);
  };

  pushObject('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  pushObject('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  pushObject(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(2)}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
  pushObject('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
  pushObject(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`);

  let pdfString = '%PDF-1.3\n';

  objects.forEach((object, index) => {
    const currentOffset = encoder.encode(pdfString).length;
    offsets[index] = currentOffset;
    pdfString += object;
  });

  const xrefOffset = encoder.encode(pdfString).length;
  pdfString += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach(offset => {
    pdfString += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  });
  pdfString += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return encoder.encode(pdfString);
};

export const generateFallbackPDFPass = async (passData: PassData): Promise<Blob> => {
  const bytes = buildPdfBytes(passData);
  return new Blob([bytes], { type: 'application/pdf' });
};
