import { apiClient } from './apiClient';
import { withBackoff } from './retry';
import {
  serializeAnswers,
  buildFormDataFromSerialized,
  type BuildFormDataOptions,
} from './inspection-answers';
import type { SerializedInspectionAnswers } from './inspection-serialization-types';
import {
  queueInspectionSubmission,
  listQueuedInspections,
  removeQueuedInspection,
  updateQueuedInspection,
  type InspectionSubmissionMode,
  notifyQueueChange,
} from './inspection-queue';
import { logger } from './logger';

export type SubmissionPhase = 'preparing' | 'uploading' | 'queued' | 'completed' | 'error';

export interface SubmissionProgress {
  phase: SubmissionPhase;
  mode: InspectionSubmissionMode;
  message?: string;
  percent?: number;
  loaded?: number;
  total?: number;
  queueId?: string;
  offline?: boolean;
  error?: unknown;
}

export interface SubmitInspectionOptions {
  templateId: string;
  vehicleId?: string;
  answers?: Record<string, any>;
  serializedAnswers?: SerializedInspectionAnswers;
  metadata?: Record<string, any>;
  mode?: InspectionSubmissionMode;
  onProgress?: (progress: SubmissionProgress) => void;
  signal?: AbortSignal;
}

export interface SubmitInspectionResult {
  status: 'submitted' | 'queued';
  mode: InspectionSubmissionMode;
  queueId?: string;
  response?: any;
}

export async function submitInspection({
  templateId,
  vehicleId,
  answers,
  serializedAnswers,
  metadata = {},
  mode = 'final',
  onProgress,
  signal,
}: SubmitInspectionOptions): Promise<SubmitInspectionResult> {
  const prepared = serializedAnswers ?? serializeAnswers(answers ?? {});

  const formDataOptions: BuildFormDataOptions = {
    templateId,
    vehicleId,
    metadata,
    mode,
  };

  const { formData, totalBytes } = buildFormDataFromSerialized(prepared, formDataOptions);

    const upload = async () => {
      onProgress?.({ phase: 'preparing', mode, message: 'Preparing inspection payload…' });

      // Debug: Log formData contents
      logger.debug('FormData contents', {
        hasPayload: formData.has('payload'),
        payloadValue: formData.get('payload'),
        allKeys: Array.from(formData.keys()),
      }, 'inspection-submit');

      // Note: apiClient.upload doesn't support onUploadProgress yet
      // For progress tracking, we use axios directly with CSRF handling
      const axios = (await import('axios')).default;
      const { apiClient: client } = await import('./apiClient');
      
      // Ensure CSRF token is initialized
      await (client as any).ensureCsrfToken?.();
      const csrfToken = (client as any).getCsrfToken?.();
      
      try {
        const response = await axios.post('/v1/inspections', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
          },
          withCredentials: true,
          signal,
          onUploadProgress: (event) => {
            const { loaded, total } = event;
            const size = typeof total === 'number' && total > 0 ? total : totalBytes || undefined;
            const percent = size ? Math.min(100, Math.round((loaded / size) * 100)) : undefined;
            onProgress?.({
              phase: 'uploading',
              mode,
              loaded,
              total: size,
              percent,
              message: 'Uploading inspection…',
            });
          },
        });

        onProgress?.({ phase: 'completed', mode, message: 'Inspection submitted successfully.' });

        return response.data;
      } catch (error: any) {
        // Log detailed error information
        logger.error('Upload error details', {
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          data: error?.response?.data,
          message: error?.message,
        });
        throw error;
      }
    };

  if (!isNavigatorOnline()) {
    const queueId = await queueInspectionSubmission({
      templateId,
      vehicleId,
      answers: prepared,
      metadata,
      mode,
    });
    onProgress?.({
      phase: 'queued',
      mode,
      queueId,
      offline: true,
      message: 'No connectivity. Inspection saved for background sync.',
    });
    return { status: 'queued', mode, queueId };
  }

  try {
    const response = await upload();
    return { status: 'submitted', mode, response };
  } catch (error: any) {
    if (isOfflineError(error)) {
      const queueId = await queueInspectionSubmission({
        templateId,
        vehicleId,
        answers: prepared,
        metadata,
        mode,
      });
      onProgress?.({
        phase: 'queued',
        mode,
        queueId,
        offline: true,
        message: 'Connection lost. Inspection stored for retry.',
        error,
      });
      return { status: 'queued', mode, queueId };
    }

    onProgress?.({ phase: 'error', mode, error });
    throw error;
  }
}

export interface SyncQueuedInspectionsOptions {
  onItem?: (event: SubmissionProgress & { id: string }) => void;
}

export async function syncQueuedInspections({ onItem }: SyncQueuedInspectionsOptions = {}) {
  const items = await listQueuedInspections();
  let success = 0;
  let failed = 0;

  for (const item of items) {
    onItem?.({ id: item.id, phase: 'preparing', mode: item.mode, message: 'Retrying inspection…' });

    const { formData, totalBytes } = buildFormDataFromSerialized(item.answers, {
      templateId: item.templateId,
      vehicleId: item.vehicleId,
      metadata: item.metadata,
      mode: item.mode,
    });

    try {
      await withBackoff(
        () =>
          axios.post('/v1/inspections', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (event) => {
              const total = typeof event.total === 'number' && event.total > 0 ? event.total : totalBytes || undefined;
              const percent = total ? Math.min(100, Math.round((event.loaded / total) * 100)) : undefined;
              onItem?.({
                id: item.id,
                phase: 'uploading',
                mode: item.mode,
                loaded: event.loaded,
                total,
                percent,
                message: 'Uploading inspection…',
              });
            },
          }),
        { tries: 2, baseMs: 600 },
      );

      await removeQueuedInspection(item.id);
      notifyQueueChange();
      onItem?.({ id: item.id, phase: 'completed', mode: item.mode, message: 'Inspection synced.' });
      success += 1;
    } catch (error) {
      failed += 1;
      await updateQueuedInspection(item.id, {
        attempts: item.attempts + 1,
        lastError: error instanceof Error ? error.message : String(error),
      });
      onItem?.({ id: item.id, phase: 'error', mode: item.mode, error });

      if (isOfflineError(error)) {
        break;
      }
    }
  }

  return { total: items.length, success, failed };
}

function isOfflineError(error: any): boolean {
  if (!error) return false;
  if (error.code === 'ERR_NETWORK') return true;
  if (error.message && /network|timeout/i.test(error.message)) return true;
  if (error.response && error.response.status >= 500) return false;
  return false;
}

function isNavigatorOnline(): boolean {
  try {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
  } catch {
    // ignore
  }
  return true;
}
