/**
 * Inspection Media Upload Manager
 * 
 * Handles background media uploads for inspection drafts.
 * Decouples draft saves from media uploads for better mobile performance.
 * 
 * Features:
 * - Parallel uploads (2-3 concurrent)
 * - Non-blocking (doesn't freeze UI)
 * - Automatic retry on failure
 * - Tracks uploaded keys in draft metadata
 * - HEIC to JPEG conversion
 */

import { uploadMediaFiles, type MediaUploadProgress, type MediaUploadResult } from './mediaUploadManager';
import { loadInspectionDraft } from './inspection-queue';
import type { SerializedInspectionAnswers } from './inspection-serialization-types';

export interface MediaUploadState {
  questionId: string;
  fileIndex: number;
  fileId: string;
  fileName: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  uploadedKey?: string;
  error?: string;
}

export interface InspectionMediaUploadOptions {
  templateId: string;
  vehicleId?: string;
  answers: Record<string, any>;
  onProgress?: (states: MediaUploadState[]) => void;
  onComplete?: (uploadedKeys: Record<string, string[]>) => void;
  onError?: (error: Error) => void;
}

/**
 * Extract all media files from answers and upload them in parallel
 * Updates draft metadata with uploaded keys
 */
export async function uploadInspectionMedia(
  options: InspectionMediaUploadOptions
): Promise<Record<string, string[]>> {
  const { templateId, vehicleId, answers, onProgress, onComplete, onError } = options;
  
  // Extract all media files from answers
  const mediaFiles: Array<{
    questionId: string;
    fileIndex: number;
    file: File;
    fileId: string;
  }> = [];
  
  Object.entries(answers).forEach(([questionId, value]) => {
    if (Array.isArray(value) && value.length > 0 && value.every(v => v instanceof File)) {
      value.forEach((file: File, index: number) => {
        const fileId = `q-${questionId}-${index}-${Date.now()}`;
        mediaFiles.push({ questionId, fileIndex: index, file, fileId });
      });
    }
  });
  
  if (mediaFiles.length === 0) {
    // No media to upload
    onComplete?.({});
    return {};
  }
  
  // Upload all files in parallel
  const uploadStates = new Map<string, MediaUploadState>();
  
  mediaFiles.forEach(({ questionId, fileIndex, file, fileId }) => {
    uploadStates.set(fileId, {
      questionId,
      fileIndex,
      fileId,
      fileName: file.name,
      status: 'pending',
      progress: 0,
    });
  });
  
  const updateProgress = () => {
    if (onProgress) {
      onProgress(Array.from(uploadStates.values()));
    }
  };
  
  // Group files by question for organized upload
  const filesByQuestion = new Map<string, File[]>();
  mediaFiles.forEach(({ questionId, file }) => {
    if (!filesByQuestion.has(questionId)) {
      filesByQuestion.set(questionId, []);
    }
    filesByQuestion.get(questionId)!.push(file);
  });
  
  // Upload files in parallel with progress tracking
  const uploadedKeys: Record<string, string[]> = {};
  
  // Process each question's files
  for (const [questionId, files] of filesByQuestion.entries()) {
    try {
      const result = await uploadMediaFiles({
        files,
        prefix: 'inspections/media',
        maxConcurrency: 3,
        onProgress: (progresses) => {
          // Map progress back to our state
          progresses.forEach((progress, index) => {
            const fileId = mediaFiles.find(
              mf => mf.questionId === questionId && mf.fileIndex === index
            )?.fileId;
            
            if (fileId && uploadStates.has(fileId)) {
              const state = uploadStates.get(fileId)!;
              state.status = progress.status === 'completed' ? 'completed' :
                            progress.status === 'failed' ? 'failed' : 'uploading';
              state.progress = progress.progress;
              state.uploadedKey = progress.uploadedKey;
              state.error = progress.error;
              uploadStates.set(fileId, state);
            }
          });
          updateProgress();
        },
        onFileComplete: (fileId, key) => {
          const mediaFile = mediaFiles.find(mf => mf.fileId === fileId);
          if (mediaFile) {
            if (!uploadedKeys[mediaFile.questionId]) {
              uploadedKeys[mediaFile.questionId] = [];
            }
            // Maintain order by fileIndex
            uploadedKeys[mediaFile.questionId][mediaFile.fileIndex] = key;
          }
        },
        onFileError: (fileId, error) => {
          const state = uploadStates.get(fileId);
          if (state) {
            state.status = 'failed';
            state.error = error.message;
            uploadStates.set(fileId, state);
            updateProgress();
          }
        },
      });
      
      // Update uploaded keys from result
      result.uploaded.forEach(({ fileId, key }) => {
        const mediaFile = mediaFiles.find(mf => mf.fileId === fileId);
        if (mediaFile) {
          if (!uploadedKeys[mediaFile.questionId]) {
            uploadedKeys[mediaFile.questionId] = [];
          }
          uploadedKeys[mediaFile.questionId][mediaFile.fileIndex] = key;
        }
      });
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  // Update draft metadata with uploaded keys
  try {
    const draft = await loadInspectionDraft(templateId, vehicleId);
    if (draft) {
      // Merge uploaded keys with existing ones
      const existingUploadedMedia = (draft.metadata?.uploadedMedia as Record<string, string[]> | undefined) || {};
      const mergedUploadedMedia: Record<string, string[]> = { ...existingUploadedMedia };
      
      // Merge new keys, preserving order
      Object.entries(uploadedKeys).forEach(([questionId, keys]) => {
        if (keys && keys.length > 0) {
          mergedUploadedMedia[questionId] = keys;
        }
      });
      
      draft.metadata = {
        ...draft.metadata,
        uploadedMedia: mergedUploadedMedia,
      };
      
      // Save updated draft with uploaded keys
      const { saveInspectionDraft } = await import('./inspection-queue');
      await saveInspectionDraft(templateId, vehicleId, draft.answers, draft.metadata);
    }
  } catch (error) {
    console.warn('Failed to update draft with uploaded keys:', error);
  }
  
  onComplete?.(uploadedKeys);
  return uploadedKeys;
}

/**
 * Start background media uploads for a draft inspection
 * Returns immediately, uploads continue in background
 */
export function startBackgroundMediaUpload(
  options: InspectionMediaUploadOptions
): Promise<Record<string, string[]>> {
  // Start uploads asynchronously (non-blocking)
  return Promise.resolve().then(() => uploadInspectionMedia(options));
}
