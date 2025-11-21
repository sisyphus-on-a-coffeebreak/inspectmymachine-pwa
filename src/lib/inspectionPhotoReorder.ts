/**
 * Utility functions for reordering inspection answer photos
 * 
 * This works with photos stored in the inspection_answers.answer_files JSON field.
 * For file-based storage (S3 keys), photos need to be synced to answer_files first.
 */

import { apiClient } from './apiClient';

export interface PhotoReorderRequest {
  inspectionId: string;
  answerId: string;
  photoKeys: string[];
}

/**
 * Reorder photos in an inspection answer
 * 
 * @param inspectionId - The inspection ID
 * @param answerId - The inspection answer ID
 * @param photoKeys - Array of photo keys in the new desired order
 * @returns Promise with the updated answer
 */
export async function reorderInspectionPhotos(
  inspectionId: string,
  answerId: string,
  photoKeys: string[]
): Promise<any> {
  const response = await apiClient.patch(
    `/v1/inspections/${inspectionId}/answers/${answerId}/reorder-photos`,
    {
      photo_keys: photoKeys,
    }
  );
  
  return response.data;
}

/**
 * Helper to convert photo array to keys array
 * Photos should have a 'key' property that matches the database structure
 */
export function extractPhotoKeys(photos: Array<{ key?: string; id?: string }>): string[] {
  return photos.map(photo => photo.key || photo.id || '').filter(Boolean);
}

