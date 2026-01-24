/**
 * Custom hook for Gate Pass Details page
 * Manages QR code generation, downloads, and formatting
 */

import { useState, useEffect } from 'react';
import { generateQRCode, generatePDFPass } from '@/lib/pdf-generator-simple';
import { useToast } from '@/providers/ToastProvider';
import { isVisitorPass } from '../gatePassTypes';
import type { GatePass } from '../gatePassTypes';
import { PNG_CANVAS_WIDTH, PNG_CANVAS_HEIGHT, PNG_QR_SIZE, GATE_PASS_TYPE, GATE_PASS_STATUS } from '../constants';

export const useGatePassDetails = (pass: GatePass | undefined) => {
  const { showToast } = useToast();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Generate QR code
  useEffect(() => {
    if (!pass) return;

    const generateQR = async () => {
      try {
        setQrLoading(true);
        
        // Get QR payload from pass
        let qrPayload: string | null = null;
        
        // Parse QR payload
        if (typeof pass.qr_payload === 'string' && pass.qr_payload.trim() !== '') {
          qrPayload = pass.qr_payload;
        } else if (pass.qr_payload && typeof pass.qr_payload === 'object') {
          qrPayload = JSON.stringify(pass.qr_payload);
        } else if (pass.access_code) {
          // Fallback to access code if no QR payload
          qrPayload = pass.access_code;
        }

        if (qrPayload && qrPayload.trim() !== '') {
          try {
            const qrDataUrl = await generateQRCode(qrPayload);
            setQrCodeDataUrl(qrDataUrl);
          } catch (qrError) {
            throw qrError;
          }
        }
      } catch (error) {
        setQrCodeDataUrl(null);
      } finally {
        setQrLoading(false);
      }
    };

    generateQR();
  }, [pass]);

  // Format date/time helper
  const formatDateTime = (date: string | null): string => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return date;
    }
  };

  // Calculate time inside
  const getTimeInside = (): string | null => {
    if (!pass || pass.status !== GATE_PASS_STATUS.INSIDE || !pass.entry_time) {
      return null;
    }
    
    const entryTime = new Date(pass.entry_time);
    const now = new Date();
    const diffMs = now.getTime() - entryTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!pass) return;

    try {
      setIsDownloading(true);
      
      // Get QR code
      let qrCode: string;
      if (qrCodeDataUrl) {
        qrCode = qrCodeDataUrl;
      } else {
        // Generate QR code from payload
        let qrPayload: string;
        if (typeof pass.qr_payload === 'string' && pass.qr_payload.trim() !== '') {
          qrPayload = pass.qr_payload;
        } else if (pass.qr_payload && typeof pass.qr_payload === 'object') {
          qrPayload = JSON.stringify(pass.qr_payload);
        } else {
          qrPayload = pass.access_code;
        }
        qrCode = await generateQRCode(qrPayload);
      }

      // Determine pass type for PDF
      const passType: 'visitor' | 'vehicle' = isVisitorPass(pass) ? 'visitor' : 'vehicle';
      
      // Get company branding (logo and name)
      let companyName: string | undefined;
      let companyLogo: string | undefined;
      try {
        const { getReportBranding, getSafeLogoUrl } = await import('@/lib/report-branding');
        const branding = await getReportBranding();
        companyName = branding.companyName;
        // Fetch logo as safe URL (blob URL) to avoid CORS issues
        if (branding.logoUrl) {
          const safeUrl = await getSafeLogoUrl(branding.logoUrl);
          companyLogo = safeUrl || undefined;
        }
      } catch (error) {
        // If branding fetch fails, continue without logo
        console.warn('Failed to fetch company branding for gate pass:', error);
      }

      // Build pass data
      const passData = {
        passNumber: pass.pass_number,
        passType,
        visitorName: pass.visitor_name || undefined,
        vehicleDetails: pass.vehicle ? {
          registration: pass.vehicle.registration_number || '',
          make: pass.vehicle.make || '',
          model: pass.vehicle.model || '',
        } : undefined,
        purpose: pass.purpose.replace('_', ' '),
        entryTime: pass.entry_time || pass.valid_from || new Date().toISOString(),
        expectedReturn: pass.expected_return_date ? 
          `${pass.expected_return_date}${pass.expected_return_time ? ' ' + pass.expected_return_time : ''}` : 
          pass.valid_to || undefined,
        accessCode: pass.access_code,
        qrCode,
        companyName,
        companyLogo,
      };

      // Generate PDF
      const pdfBlob = await generatePDFPass(passData);
      
      // Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gate-pass-${pass.pass_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast({
        title: 'Success',
        description: 'Gate pass PDF downloaded successfully',
        variant: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download PDF. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle PNG download
  const handleDownloadPNG = async () => {
    if (!pass || !qrCodeDataUrl) {
      showToast({
        title: 'Error',
        description: 'QR code not available. Please wait for it to load.',
        variant: 'error',
      });
      return;
    }

    try {
      // Create a canvas with the QR code and pass details
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not create canvas context');
      }

      // Set canvas size (A4 ratio for printable format)
      canvas.width = PNG_CANVAS_WIDTH;
      canvas.height = PNG_CANVAS_HEIGHT;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Gate Pass', canvas.width / 2, 80);

      // Pass Number
      ctx.font = 'bold 36px Arial';
      ctx.fillText(pass.pass_number, canvas.width / 2, 140);

      // Load QR code image
      const qrImage = new Image();
      qrImage.src = qrCodeDataUrl;
      
      await new Promise((resolve, reject) => {
        qrImage.onload = resolve;
        qrImage.onerror = reject;
      });

      // Draw QR code (centered)
      const qrSize = PNG_QR_SIZE;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 200;
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      // Pass details
      let yPos = qrY + qrSize + 60;
      ctx.font = '24px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#475569';

      if (pass.pass_type === GATE_PASS_TYPE.VISITOR && pass.visitor_name) {
        ctx.fillText(`Visitor: ${pass.visitor_name}`, 100, yPos);
        yPos += 40;
      }

      if (pass.vehicle) {
        ctx.fillText(`Vehicle: ${pass.vehicle.registration_number}`, 100, yPos);
        yPos += 40;
      }

      ctx.fillText(`Purpose: ${pass.purpose.replace('_', ' ')}`, 100, yPos);
      yPos += 40;
      ctx.fillText(`Valid From: ${formatDateTime(pass.valid_from)}`, 100, yPos);
      yPos += 40;
      ctx.fillText(`Valid To: ${formatDateTime(pass.valid_to)}`, 100, yPos);
      yPos += 40;

      // Access Code
      ctx.font = 'bold 32px monospace';
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.fillText(`Access Code: ${pass.access_code}`, canvas.width / 2, yPos + 40);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create PNG blob');
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gate-pass-${pass.pass_number}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast({
          title: 'Success',
          description: 'Gate pass PNG downloaded successfully',
          variant: 'success',
        });
      }, 'image/png');
    } catch (error) {
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download PNG. Please try again.',
        variant: 'error',
      });
    }
  };

  return {
    qrCodeDataUrl,
    qrLoading,
    isDownloading,
    formatDateTime,
    getTimeInside,
    handleDownloadPDF,
    handleDownloadPNG,
  };
};

