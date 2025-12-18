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
 * Get current report branding settings
 */
export async function getReportBranding(): Promise<ReportBranding> {
  const response = await apiClient.get<{ success: boolean; data: ReportBranding }>(
    '/v1/settings/report-branding'
  );
  return response.data.data;
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
  return response.data.data;
}

/**
 * Delete logo
 */
export async function deleteLogo(): Promise<void> {
  await apiClient.delete('/v1/settings/report-branding/logo');
}




