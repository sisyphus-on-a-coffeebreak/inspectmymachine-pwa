/**
 * Export Utilities
 * 
 * Reusable functions for exporting data in multiple formats:
 * - CSV
 * - Excel (XLSX)
 * - JSON
 */

import { getApiUrl } from './apiConfig';

// Export format values as const - this provides runtime values
export const ExportFormatValues = ['csv', 'excel', 'json'] as const;

// Export type derived from the values
export type ExportFormat = typeof ExportFormatValues[number];

export interface ExportOptions {
  filename?: string;
  sheetName?: string; // For Excel
  headers?: string[]; // Custom headers (optional)
}

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: Record<string, any>[], headers?: string[]): string {
  if (data.length === 0) return '';

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = csvHeaders.map(header => {
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    const escaped = String(header).replace(/"/g, '""');
    return `"${escaped}"`;
  }).join(',');

  // Create CSV data rows
  const dataRows = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header] ?? '';
      // Convert to string and escape
      const stringValue = String(value).replace(/"/g, '""');
      // Wrap in quotes if contains comma, quote, or newline
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue}"`;
      }
      return stringValue;
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Export data to CSV format
 */
export function exportToCSV(
  data: Record<string, any>[],
  options: ExportOptions = {}
): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const csvContent = arrayToCSV(data, options.headers);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = options.filename || `export-${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadBlob(blob, filename);
}

/**
 * Export data to Excel (XLSX) format
 */
export async function exportToExcel(
  data: Record<string, any>[],
  options: ExportOptions = {}
): Promise<void> {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Dynamically import xlsx to reduce bundle size
  const XLSX = await import('xlsx');

  // Get headers from first object if not provided
  const headers = options.headers || Object.keys(data[0]);
  
  // Create worksheet data with headers
  const worksheetData = [
    headers,
    ...data.map(row => headers.map(header => row[header] ?? ''))
  ];

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Set column widths (auto-width based on content)
  const columnWidths = headers.map((_, colIndex) => {
    const maxLength = Math.max(
      headers[colIndex].length,
      ...data.map(row => {
        const value = String(row[headers[colIndex]] ?? '');
        return value.length;
      })
    );
    return { wch: Math.min(maxLength + 2, 50) }; // Max width 50
  });
  worksheet['!cols'] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1');

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { 
    type: 'array', 
    bookType: 'xlsx' 
  });
  
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const filename = options.filename || `export-${new Date().toISOString().split('T')[0]}.xlsx`;
  downloadBlob(blob, filename);
}

/**
 * Export data to JSON format
 */
export function exportToJSON(
  data: Record<string, any>[] | Record<string, any>,
  options: ExportOptions = {}
): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const filename = options.filename || `export-${new Date().toISOString().split('T')[0]}.json`;
  
  downloadBlob(blob, filename);
}

/**
 * Universal export function that handles all formats
 */
export async function exportData(
  data: Record<string, any>[] | Record<string, any>,
  format: ExportFormat,
  options: ExportOptions = {}
): Promise<void> {
  // Normalize data to array format
  const dataArray = Array.isArray(data) ? data : [data];

  switch (format) {
    case 'csv':
      exportToCSV(dataArray, options);
      break;
    case 'excel':
      await exportToExcel(dataArray, options);
      break;
    case 'json':
      exportToJSON(data, options); // Keep original format for JSON
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Export data from API endpoint
 * Useful when backend provides export functionality
 */
export async function exportFromAPI(
  endpoint: string,
  format: ExportFormat,
  params?: Record<string, any>,
  options: ExportOptions = {}
): Promise<void> {
  const axios = (await import('axios')).default;
  const { apiClient } = await import('./apiClient');
  
  // Ensure CSRF token
  await (apiClient as any).ensureCsrfToken?.();
  const csrfToken = (apiClient as any).getCsrfToken?.();

  try {
    const response = await axios.get(getApiUrl(endpoint), {
      params: {
        ...params,
        format: format === 'excel' ? 'xlsx' : format, // Backend might use 'xlsx' instead of 'excel'
      },
      responseType: 'blob',
      withCredentials: true,
      headers: {
        ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
      },
    });

    // Determine MIME type and file extension
    const mimeTypes: Record<ExportFormat, string> = {
      csv: 'text/csv',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      json: 'application/json',
    };

    const extensions: Record<ExportFormat, string> = {
      csv: 'csv',
      excel: 'xlsx',
      json: 'json',
    };

    const blob = new Blob([response.data], { type: mimeTypes[format] });
    const filename = options.filename || `export-${new Date().toISOString().split('T')[0]}.${extensions[format]}`;
    
    downloadBlob(blob, filename);
  } catch (error) {
    throw new Error(`Failed to export from API: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


