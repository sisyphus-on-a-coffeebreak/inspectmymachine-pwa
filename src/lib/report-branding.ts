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
 * Check if a URL is an external storage URL that might have CORS issues
 */
function isExternalStorageUrl(url: string): boolean {
  return url.includes('r2.cloudflarestorage.com') || 
         url.includes('s3.amazonaws.com') ||
         url.includes('amazonaws.com') ||
         url.includes('cloudflarestorage.com');
}

/**
 * Get a safe logo URL that avoids CORS issues
 * For external storage URLs, returns the URL as-is
 * The browser will attempt to load it, and onError handlers will catch CORS failures gracefully
 * 
 * Note: To fully fix CORS issues, the backend should either:
 * 1. Implement a proxy endpoint at /v1/settings/report-branding/logo-proxy
 * 2. Configure CORS headers on the R2 bucket to allow requests from the frontend domain
 */

/**
 * Get a safe logo URL
 * Returns the URL as-is - the browser will handle loading it
 * For external storage URLs with CORS issues, the component's onError handler will catch failures
 */
export async function getSafeLogoUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  
  // Return URL as-is - no transformation needed
  // Components will handle CORS errors via onError handlers
  return url;
}

/**
 * Clear logo cache (no-op since we're not caching anymore)
 * Kept for API compatibility
 */
export function clearLogoCache(): void {
  // No cache to clear
}

/**
 * Get current report branding settings
 */
export async function getReportBranding(): Promise<ReportBranding> {
  const response = await apiClient.get<{ success: boolean; data: ReportBranding }>(
    '/v1/settings/report-branding'
  );
  const data = response.data.data;
  // Note: logoUrl conversion to blob URL should be done in components using useLogoUrl hook
  // to avoid blocking the API call
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
  // Clear cache when logo is updated
  clearLogoCache();
  // Note: logoUrl conversion to blob URL should be done in components using useLogoUrl hook
  return data;
}

/**
 * Delete logo
 */
export async function deleteLogo(): Promise<void> {
  await apiClient.delete('/v1/settings/report-branding/logo');
}









