import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { colors, spacing } from '../../lib/theme';
import { PageHeader } from '../../components/ui/PageHeader';
import { LoadingError } from '../../components/ui/LoadingError';
import type { InspectionTemplate } from '@/types/inspection';
import { fetchInspectionTemplate } from '@/lib/inspection-templates';
import { serializeAnswers, deserializeAnswers } from '@/lib/inspection-answers';
import {
  saveInspectionDraft,
  loadInspectionDraft,
  clearInspectionDraft,
  queueInspectionSubmission,
  subscribeQueuedInspectionCount,
} from '@/lib/inspection-queue';
import {
  submitInspection,
  syncQueuedInspections,
  type SubmissionProgress,
} from '@/lib/inspection-submit';
import { InspectionCaptureStatusBar } from '../../components/inspection/InspectionCaptureStatusBar';
import { InspectionCaptureForm } from '../../components/inspection/InspectionCaptureForm';
import { logger } from '../../lib/logger';
import TemplateSelectionPage from './TemplateSelectionPage';

export const InspectionCapture: React.FC = () => {
  const navigate = useNavigate();
  const { templateId, vehicleId } = useParams<{ templateId: string; vehicleId?: string }>();

  const [template, setTemplate] = useState<InspectionTemplate | null>(null);
  const [templateSource, setTemplateSource] = useState<'network' | 'cache' | null>(null);
  const [templateCachedAt, setTemplateCachedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<SubmissionProgress | null>(null);
  const [queuedCount, setQueuedCount] = useState(0);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [initialAnswers, setInitialAnswers] = useState<Record<string, unknown>>({});
  const [submissionBanner, setSubmissionBanner] = useState<string | null>(null);
  const [templateWarning, setTemplateWarning] = useState<string | null>(null);

  const loadTemplate = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      if (!templateId) {
        // No template ID - redirect to template selection
        navigate('/app/inspections/new' + (vehicleId ? `?vehicleId=${vehicleId}` : ''), { replace: true });
        setLoading(false);
        return;
      }

      const result = await fetchInspectionTemplate(templateId, { forceRefresh });
      setTemplate(result.template);
      setTemplateSource(result.source);
      setTemplateCachedAt(result.cachedAt);

      if (result.source === 'cache' && result.error) {
        setTemplateWarning('Offline mode: showing cached template. Some updates may be missing.');
      } else {
        setTemplateWarning(null);
      }
    } catch (err) {
      // Failed to fetch inspection template
      setTemplate(null);
      setTemplateSource(null);
      setTemplateCachedAt(null);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [templateId, navigate, vehicleId]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!templateId) return;
      
      const record = await loadInspectionDraft(templateId, vehicleId);
      if (cancelled) return;

      if (record) {
        setInitialAnswers(deserializeAnswers(record.answers));
        setDraftSavedAt(record.updatedAt);
      } else {
        setInitialAnswers({});
        setDraftSavedAt(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [templateId, vehicleId, template?.id]);

  useEffect(() => {
    const unsubscribe = subscribeQueuedInspectionCount(setQueuedCount);
    return () => {
      unsubscribe?.();
    };
  }, []);

  const runQueueSync = useCallback(async () => {
    try {
      const result = await syncQueuedInspections({
        onItem: (event) => {
          if (event.phase === 'error') {
            setSubmissionBanner('Sync failed for some inspections. Will retry automatically.');
          }
        },
      });

      if (result.total > 0 && result.success > 0) {
        setSubmissionBanner('Offline inspections synced successfully.');
      }
    } catch {
      setSubmissionBanner('Unable to sync queued inspections right now. We will retry soon.');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      runQueueSync();
    };

    window.addEventListener('online', handleOnline);

    if (typeof navigator === 'undefined' || navigator.onLine) {
      runQueueSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [runQueueSync]);

  const handleSaveDraft = useCallback(async (answers: Record<string, unknown>) => {
    if (!templateId) return;
    
    const serialized = serializeAnswers(answers);
    await saveInspectionDraft(templateId, vehicleId, serialized);
    setDraftSavedAt(Date.now());

    const online = typeof navigator === 'undefined' || navigator.onLine;

    if (!online) {
      await queueInspectionSubmission({
        templateId,
        vehicleId,
        answers: serialized,
        metadata: { template_name: template?.name },
        mode: 'draft',
        queueId: `draft:${templateId}:${vehicleId ?? 'default'}`,
      });
      setSubmissionBanner('Draft saved offline. We will sync it automatically when you reconnect.');
    } else {
      setSubmissionBanner('Draft saved.');
    }
  }, [templateId, vehicleId, template?.name]);

  const handleSubmit = useCallback(async (answers: Record<string, unknown>) => {
    if (!templateId) return;
    
    const serialized = serializeAnswers(answers);
    setIsSubmitting(true);
    setProgress(null);
    setSubmissionBanner(null);

    try {
      const result = await submitInspection({
        templateId,
        vehicleId,
        serializedAnswers: serialized,
        metadata: { template_name: template?.name },
        mode: 'final',
        onProgress: setProgress,
      });

      if (result.status === 'submitted') {
        // Track recent template usage
        if (template?.name) {
          const { addRecentTemplate } = await import('../../lib/templateHistory');
          addRecentTemplate(templateId, template.name, vehicleId);
        }

        await clearInspectionDraft(templateId, vehicleId);
        setDraftSavedAt(null);
        setInitialAnswers({});
        setSubmissionBanner('Inspection submitted successfully.');

        const inspectionId = result.response?.id;
        if (inspectionId) {
          navigate(`/app/inspections/${inspectionId}`);
        } else {
          navigate('/app/inspections/completed');
        }
      } else {
        await saveInspectionDraft(templateId, vehicleId, serialized);
        setSubmissionBanner('Inspection queued offline. It will sync once connectivity returns.');
      }
    } catch (err: unknown) {
      logger.error('Inspection submission error', err, 'InspectionCapture');
      
      // Extract detailed error message
      let errorMessage = 'Submission failed. Please retry once connectivity stabilises.';
      
      if (err && typeof err === 'object' && 'response' in err) {
        const errorResponse = err as { response?: { data?: { message?: string; errors?: Record<string, unknown> } }; message?: string };
        if (errorResponse.response?.data) {
          const errorData = errorResponse.response.data;
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.errors) {
            // Laravel validation errors
            const errors = errorData.errors;
            const errorMessages = Object.entries(errors)
              .flatMap(([field, messages]) => 
                Array.isArray(messages) 
                  ? messages.map((msg: unknown) => `${field}: ${String(msg)}`)
                  : [`${field}: ${String(messages)}`]
              );
            errorMessage = errorMessages.length > 0 
              ? errorMessages.join('. ') 
              : 'Validation failed. Please check your inspection data.';
          }
        }
      } else if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        errorMessage = err.message;
      }
      
      setSubmissionBanner(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [templateId, vehicleId, template?.name, navigate]);

  const handleRetryFetch = useCallback(() => {
    loadTemplate(true);
  }, [loadTemplate]);

  // If no templateId, show template selection page
  if (!templateId) {
    return <TemplateSelectionPage />;
  }

  if (loading) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>🔍</div>
        <div style={{ color: colors.neutral[600] }}>Loading inspection form…</div>
      </div>
    );
  }

  if (error && !template) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.sm }}>
        <LoadingError
          resource="inspection template"
          error={error}
          onRetry={handleRetryFetch}
        />
        <div style={{ textAlign: 'center', marginTop: spacing.md }}>
          <button
            onClick={() => navigate('/app/inspections/new' + (vehicleId ? `?vehicleId=${vehicleId}` : ''))}
            style={{
              padding: spacing.sm,
              backgroundColor: colors.neutral[100],
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            ← Back to Template Selection
          </button>
        </div>
      </div>
    );
  }

  if (!template) {
    // Template not found - redirect to template selection
    navigate('/app/inspections/new' + (vehicleId ? `?vehicleId=${vehicleId}` : ''), { replace: true });
    return null;
  }

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: spacing.xl,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: colors.neutral[50],
      minHeight: '100vh',
    }}>
      <PageHeader
        title={template.name}
        subtitle={template.description || 'Complete vehicle inspection'}
        icon="🔍"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Inspections', path: '/app/inspections' },
          { label: 'Capture Inspection' }
        ]}
        actions={
          <button
            onClick={() => navigate('/app/inspections/new' + (vehicleId ? `?vehicleId=${vehicleId}` : ''))}
            style={{
              padding: spacing.sm,
              backgroundColor: colors.neutral[100],
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
        }
      />

      <InspectionCaptureStatusBar
        template={template}
        templateSource={templateSource}
        templateCachedAt={templateCachedAt}
        queuedCount={queuedCount}
        draftSavedAt={draftSavedAt}
        progress={progress}
        templateWarning={templateWarning}
        submissionBanner={submissionBanner}
      />

      <InspectionCaptureForm
        template={template}
        initialAnswers={initialAnswers}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default InspectionCapture;
