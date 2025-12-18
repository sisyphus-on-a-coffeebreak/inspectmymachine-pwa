/**
 * Inspection Drafts Management
 * 
 * Handles fetching and managing inspection drafts from both:
 * - Backend (database drafts)
 * - Frontend (IndexedDB local drafts)
 * 
 * Provides unified draft discovery and resume functionality.
 */

import { apiClient } from './apiClient';
import { listAllDrafts, loadInspectionDraft, type InspectionDraftRecord } from './inspection-queue';
import { fetchInspectionTemplate } from './inspection-templates';
import { deserializeAnswers } from './inspection-answers';

export interface DraftMetadata {
  id?: string; // Backend inspection ID (if exists)
  templateId: string;
  vehicleId?: string;
  templateName: string;
  vehicle?: {
    id: string;
    registration_number: string;
    make?: string;
    model?: string;
  };
  progress: {
    answered: number;
    total: number;
    percent: number;
  };
  pendingUploads: number;
  updatedAt: number;
  source: 'backend' | 'local';
  localDraftKey?: string; // For local drafts
}

/**
 * Fetch drafts from backend API
 */
export async function fetchBackendDrafts(options?: {
  templateId?: string;
  vehicleId?: string;
}): Promise<DraftMetadata[]> {
  try {
    const params: Record<string, string> = {};
    if (options?.templateId) {
      params.template_id = options.templateId;
    }
    if (options?.vehicleId) {
      params.vehicle_id = options.vehicleId;
    }

    const response = await apiClient.get('/v1/inspections/drafts', { params });
    const backendDrafts = response.data?.data || [];

    return backendDrafts.map((draft: any): DraftMetadata => ({
      id: draft.id,
      templateId: draft.template_id,
      vehicleId: draft.vehicle_id,
      templateName: draft.template_name,
      vehicle: draft.vehicle,
      progress: draft.progress,
      pendingUploads: draft.pending_uploads || 0,
      updatedAt: new Date(draft.updated_at).getTime(),
      source: 'backend',
    }));
  } catch (error) {
    console.warn('Failed to fetch backend drafts:', error);
    return [];
  }
}

/**
 * Fetch local drafts from IndexedDB
 */
export async function fetchLocalDrafts(options?: {
  templateId?: string;
  vehicleId?: string;
}): Promise<DraftMetadata[]> {
  try {
    const allDrafts = await listAllDrafts();
    
    // Filter by template/vehicle if provided
    let filteredDrafts = allDrafts;
    if (options?.templateId) {
      filteredDrafts = filteredDrafts.filter(d => d.templateId === options.templateId);
    }
    if (options?.vehicleId !== undefined) {
      filteredDrafts = filteredDrafts.filter(d => d.vehicleId === options.vehicleId);
    }

    // Convert to DraftMetadata with progress calculation
    const draftsWithMetadata: DraftMetadata[] = [];

    for (const draft of filteredDrafts) {
      try {
        // Fetch template to calculate progress
        const templateResult = await fetchInspectionTemplate(draft.templateId, { forceRefresh: false });
        const template = templateResult.template;

        if (!template) continue;

        // Calculate progress
        const totalQuestions = template.sections.reduce(
          (sum, section) => sum + section.questions.length,
          0
        );

        const answers = deserializeAnswers(draft.answers);
        const answeredQuestions = Object.keys(answers).filter(
          (questionId) => {
            const value = answers[questionId];
            return value !== null && value !== undefined && value !== '';
          }
        ).length;

        // Count pending uploads (media files not yet uploaded)
        let pendingUploads = 0;
        Object.entries(answers).forEach(([questionId, value]) => {
          if (Array.isArray(value) && value.length > 0 && value.every(v => v instanceof File)) {
            // Check if files are uploaded (have keys in metadata)
            const uploadedKeys = draft.metadata?.uploadedMedia?.[questionId] || [];
            const fileCount = value.length;
            const uploadedCount = uploadedKeys.filter(k => k).length;
            pendingUploads += fileCount - uploadedCount;
          }
        });

        // Get template name
        const templateName = template.name || 'Unknown Template';

        // Get vehicle info if available (would need to fetch separately)
        const vehicle = draft.vehicleId ? undefined : undefined; // TODO: Fetch vehicle if needed

        draftsWithMetadata.push({
          templateId: draft.templateId,
          vehicleId: draft.vehicleId,
          templateName,
          vehicle,
          progress: {
            answered: answeredQuestions,
            total: totalQuestions,
            percent: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
          },
          pendingUploads,
          updatedAt: draft.updatedAt,
          source: 'local',
          localDraftKey: `${draft.templateId}:${draft.vehicleId ?? 'default'}`,
        });
      } catch (error) {
        console.warn('Failed to process local draft:', error);
        // Skip this draft
      }
    }

    return draftsWithMetadata;
  } catch (error) {
    console.warn('Failed to fetch local drafts:', error);
    return [];
  }
}

/**
 * Fetch all drafts (backend + local) for a template/vehicle
 */
export async function fetchAllDrafts(options?: {
  templateId?: string;
  vehicleId?: string;
}): Promise<DraftMetadata[]> {
  const [backendDrafts, localDrafts] = await Promise.all([
    fetchBackendDrafts(options),
    fetchLocalDrafts(options),
  ]);

  // Merge and deduplicate (prefer backend drafts if both exist)
  const draftMap = new Map<string, DraftMetadata>();

  // Add local drafts first
  localDrafts.forEach(draft => {
    const key = `${draft.templateId}:${draft.vehicleId ?? 'default'}`;
    draftMap.set(key, draft);
  });

  // Override with backend drafts (they take precedence)
  backendDrafts.forEach(draft => {
    const key = `${draft.templateId}:${draft.vehicleId ?? 'default'}`;
    draftMap.set(key, draft);
  });

  // Sort by updatedAt (most recent first)
  return Array.from(draftMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Resume a draft by loading its data
 */
export async function resumeDraft(draft: DraftMetadata): Promise<{
  answers: Record<string, any>;
  draftRecord?: InspectionDraftRecord;
}> {
  if (draft.source === 'backend' && draft.id) {
    // Load from backend
    try {
      const response = await apiClient.get(`/v1/inspections/${draft.id}`);
      const inspection = response.data;

      // Convert inspection answers to our format
      const answers: Record<string, any> = {};
      if (inspection.answers && Array.isArray(inspection.answers)) {
        inspection.answers.forEach((answer: any) => {
          if (answer.question_id) {
            // Parse answer value
            let value = answer.answer_value;
            try {
              if (typeof value === 'string') {
                value = JSON.parse(value);
              }
            } catch {
              // Keep as string
            }

            // Handle media files
            if (answer.answer_files && Array.isArray(answer.answer_files)) {
              value = answer.answer_files.map((file: any) => file.path || file.name);
            }

            answers[answer.question_id] = value;
          }
        });
      }

      return { answers };
    } catch (error) {
      console.error('Failed to load backend draft:', error);
      throw error;
    }
  } else {
    // Load from local IndexedDB
    const draftRecord = await loadInspectionDraft(draft.templateId, draft.vehicleId);
    if (!draftRecord) {
      throw new Error('Draft not found');
    }

    const answers = deserializeAnswers(draftRecord.answers);
    return { answers, draftRecord };
  }
}
