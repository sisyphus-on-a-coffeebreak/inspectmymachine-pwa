/**
 * Report Branding API Client
 * Handles all API calls for report branding settings
 */

import { apiClient } from './apiClient';

export interface ReportBranding {
  id: number | null;
  logoUrl: string | null;
  companyName: string;
  tradingAs: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  gstin: string | null;
  primaryColor: string;
  secondaryColor: string;
  showLogoInHeader: boolean;
  showAddressInHeader: boolean;
  showContactInFooter: boolean;
  addWatermarkToPhotos: boolean;
  includeQRCode: boolean;
  footerText: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ReportBrandingUpdate {
  companyName: string;
  tradingAs?: string;
  addressLine1?: string;
  addressLine2?: string;
  phone?: string;
  email?: string;
  website?: string;
  gstin?: string;
  primaryColor?: string;
  secondaryColor?: string;
  showLogoInHeader?: boolean;
  showAddressInHeader?: boolean;
  showContactInFooter?: boolean;
  addWatermarkToPhotos?: boolean;
  includeQRCode?: boolean;
  footerText?: string;
}

/**
 * Convert external storage URL to backend-proxied URL to avoid CORS issues
 */
function proxyLogoUrl(url: string | null): string | null {
  if (!url) return null;
  
  // If it's an external storage URL (R2, S3, etc.), it needs CORS
  // For now, return as-is and let backend handle CORS
  // TODO: Ask backend team to add CORS headers to R2 bucket
  return url;
}

/**
 * Get current report branding settings
 */
export async function getReportBranding(): Promise<ReportBranding> {
  const response = await apiClient.get<{ success: boolean; data: ReportBranding }>(
    '/v1/settings/report-branding'
  );
  const data = response.data.data;
  data.logoUrl = proxyLogoUrl(data.logoUrl);
  return data;
}

/**
 * Update report branding settings
 */
export async function updateReportBranding(
  branding: ReportBrandingUpdate
): Promise<ReportBranding> {
  const response = await apiClient.post<{ success: boolean; data: ReportBranding; message: string }>(
    '/v1/settings/report-branding',
    branding
  );
  return response.data.data;
}

/**
 * Upload logo
 */
export async function uploadLogo(file: File): Promise<{ logoUrl: string; logoPath: string }> {
  const formData = new FormData();
  formData.append('logo', file);
  
  const response = await apiClient.post<{ success: boolean; data: { logoUrl: string; logoPath: string }; message: string }>(
    '/v1/settings/report-branding/logo',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  const data = response.data.data;
  data.logoUrl = proxyLogoUrl(data.logoUrl) || data.logoUrl;
  return data;
}

/**
 * Delete logo
 */
export async function deleteLogo(): Promise<void> {
  await apiClient.delete('/v1/settings/report-branding/logo');
}









