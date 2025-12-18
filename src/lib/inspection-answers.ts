import type { SerializedInspectionAnswers, SerializedAnswerEntry, SerializedFileData } from './inspection-serialization-types';
import { compressImage, shouldCompress } from './imageCompression';

const encoder = new TextEncoder();

export type SerializableAnswerValue = Record<string, unknown> | string | number | boolean | null | undefined;

const FILE_NAME_FALLBACK = 'attachment';

export function serializeAnswers(answers: Record<string, any>): SerializedInspectionAnswers {
  const serialized: SerializedInspectionAnswers = {
    version: 1,
    updatedAt: Date.now(),
    answers: {},
  };

  Object.entries(answers || {}).forEach(([questionId, value]) => {
    if (value === undefined) {
      return;
    }

    if (Array.isArray(value) && value.length > 0 && value.every(isFileLike)) {
      serialized.answers[questionId] = {
        kind: 'media',
        files: value.map(toSerializedFileData),
      };
      return;
    }

    if (value && typeof value === 'object' && 'blob' in value && value.blob instanceof Blob) {
      serialized.answers[questionId] = {
        kind: 'audio',
        file: toSerializedFileData(value.blob),
        duration: typeof value.duration === 'number' ? value.duration : undefined,
      };
      return;
    }

    if (typeof value === 'string' && value.startsWith('data:')) {
      serialized.answers[questionId] = {
        kind: 'signature',
        dataUrl: value,
      };
      return;
    }

    serialized.answers[questionId] = {
      kind: 'value',
      value: value as SerializableAnswerValue,
    };
  });

  return serialized;
}

export function deserializeAnswers(serialized: SerializedInspectionAnswers | null | undefined): Record<string, any> {
  if (!serialized) {
    return {};
  }

  const answers: Record<string, any> = {};

  Object.entries(serialized.answers).forEach(([questionId, entry]) => {
    switch (entry.kind) {
      case 'media': {
        const files = entry.files.map(fromSerializedFileData);
        answers[questionId] = files;
        break;
      }
      case 'audio': {
        const file = fromSerializedFileData(entry.file);
        const url = typeof URL !== 'undefined' ? URL.createObjectURL(file) : undefined;
        answers[questionId] = {
          blob: file,
          url,
          duration: entry.duration,
        };
        break;
      }
      case 'signature': {
        answers[questionId] = entry.dataUrl;
        break;
      }
      case 'value':
      default:
        answers[questionId] = entry.value ?? null;
    }
  });

  return answers;
}

export interface BuildFormDataOptions {
  templateId: string;
  vehicleId?: string;
  metadata?: Record<string, any>;
  mode?: 'draft' | 'final';
}

export interface BuildFormDataResult {
  formData: FormData;
  totalBytes: number;
  attachmentCount: number;
}

export async function buildFormDataFromSerialized(
  serialized: SerializedInspectionAnswers,
  { templateId, vehicleId, metadata = {}, mode = 'final' }: BuildFormDataOptions,
): Promise<BuildFormDataResult> {
  const formData = new FormData();
  let totalBytes = 0;
  let attachmentCount = 0;

  const answerPayload: Array<{ question_id: string; kind: SerializedAnswerEntry['kind']; value: SerializableAnswerValue }>
    = [];

  // Check for pre-uploaded media keys in metadata
  const uploadedMedia = metadata.uploadedMedia as Record<string, string[]> | undefined;

  // Process all entries, compressing images as needed
  for (const [questionId, entry] of Object.entries(serialized.answers)) {
    switch (entry.kind) {
      case 'media': {
        const fileNames: string[] = [];
        
        // Check if we have pre-uploaded keys for this question
        const preUploadedKeys = uploadedMedia?.[questionId];
        
        // Process all files, checking for pre-uploaded keys
        const compressionPromises = entry.files.map(async (fileData, index) => {
          // If we have a pre-uploaded key for this index, use it (no compression/upload needed)
          if (preUploadedKeys && preUploadedKeys[index]) {
            return { file: null, index, uploadedKey: preUploadedKeys[index], fileName: preUploadedKeys[index] };
          }
          
          // File needs to be uploaded - compress if needed
          let file = fromSerializedFileData(fileData);
          // Compress if it's an image that should be compressed
          if (shouldCompress(file)) {
            file = await compressImage(file);
          }
          const inferredName = file.name || `${FILE_NAME_FALLBACK}-${questionId}-${index + 1}`;
          return { file, index, uploadedKey: null, fileName: inferredName };
        });
        
        const processedFiles = await Promise.all(compressionPromises);
        
        // Sort by original index to maintain order
        processedFiles.sort((a, b) => a.index - b.index);
        
        // Add files to FormData and build fileNames array in correct order
        processedFiles.forEach(({ file, index, uploadedKey, fileName }) => {
          if (uploadedKey) {
            // Use pre-uploaded key - no FormData append needed
            fileNames.push(uploadedKey);
          } else if (file) {
            // Upload file now - add to FormData
            formData.append(`media[${questionId}][]`, file, fileName);
            totalBytes += file.size;
            attachmentCount += 1;
            fileNames.push(fileName);
          }
        });

        answerPayload.push({
          question_id: questionId,
          kind: 'media',
          value: fileNames,
        });
        break;
      }
      case 'audio': {
        const audioFile = fromSerializedFileData(entry.file);
        const audioName = audioFile.name || `${questionId}.wav`;
        formData.append(`audio[${questionId}]`, audioFile, audioName);
        totalBytes += audioFile.size;
        attachmentCount += 1;
        answerPayload.push({
          question_id: questionId,
          kind: 'audio',
          value: {
            file: audioName,
            duration: entry.duration,
          },
        });
        break;
      }
      case 'signature': {
        const blob = dataUrlToBlob(entry.dataUrl);
        const fileName = `${questionId}-signature.png`;
        formData.append(`signatures[${questionId}]`, blob, fileName);
        totalBytes += blob.size;
        attachmentCount += 1;
        answerPayload.push({
          question_id: questionId,
          kind: 'signature',
          value: fileName,
        });
        break;
      }
      case 'value':
      default: {
        answerPayload.push({
          question_id: questionId,
          kind: 'value',
          value: entry.value ?? null,
        });
      }
    }
  }

  const payload = {
    template_id: templateId,
    vehicle_id: vehicleId ?? null,
    status: mode === 'final' ? 'completed' : 'draft',
    answers: answerPayload,
    meta: metadata,
  };

  const payloadJson = JSON.stringify(payload);
  formData.append('payload', payloadJson);
  totalBytes += encoder.encode(payloadJson).length;

  return {
    formData,
    totalBytes,
    attachmentCount,
  };
}

function isFileLike(value: unknown): value is File | Blob {
  return value instanceof File || value instanceof Blob;
}

function toSerializedFileData(file: File | Blob): SerializedFileData {
  const name = file instanceof File ? file.name : undefined;
  const lastModified = file instanceof File ? file.lastModified : Date.now();

  return {
    name: name || `${FILE_NAME_FALLBACK}-${Math.random().toString(36).slice(2)}`,
    type: file.type || 'application/octet-stream',
    size: file.size,
    lastModified,
    data: file,
  };
}

function fromSerializedFileData(data: SerializedFileData): File {
  return new File([data.data], data.name, {
    type: data.type,
    lastModified: data.lastModified,
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = /^data:(.*?);base64$/.exec(header || '');
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';

  if (typeof atob === 'function') {
    const binary = atob(base64 || '');
    const length = binary.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  }

  const globalBuffer = (globalThis as { Buffer?: { from(data: string, encoding: string): Uint8Array } }).Buffer;
  if (globalBuffer) {
    const buffer = globalBuffer.from(base64 || '', 'base64');
    return new Blob([buffer], { type: mime });
  }

  throw new Error('Base64 decoding not supported in this environment');
}
