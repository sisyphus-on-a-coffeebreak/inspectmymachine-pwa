import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { colors, typography, spacing } from '../../lib/theme';
import { PageHeader } from '../../components/ui/PageHeader';
import { DynamicFormRenderer } from '../../components/inspection/DynamicFormRenderer';
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

const FALLBACK_TEMPLATE: InspectionTemplate = {
          id: 'mock-template-1',
          name: 'Commercial Vehicle Inspection',
          description: 'Comprehensive commercial vehicle inspection with 131+ questions',
          sections: [
            {
              id: 'section-1',
              name: 'Vehicle Identification & Basic Information',
              questions: [
                {
                  id: 'q1',
                  question_text: 'Vehicle Brand',
                  question_type: 'dropdown',
                  is_required: true,
                  is_critical: false,
                  options: [
                    { id: 'opt1', option_text: 'Tata', option_value: 'tata' },
                    { id: 'opt2', option_text: 'Ashok Leyland', option_value: 'ashok_leyland' },
                    { id: 'opt3', option_text: 'Mahindra', option_value: 'mahindra' },
                    { id: 'opt4', option_text: 'Eicher', option_value: 'eicher' },
                    { id: 'opt5', option_text: 'BharatBenz', option_value: 'bharatbenz' },
                    { id: 'opt6', option_text: 'Other', option_value: 'other' }
                  ]
                },
                {
                  id: 'q2',
                  question_text: 'Vehicle Model',
                  question_type: 'dropdown',
                  is_required: true,
                  is_critical: false,
                  options: [
                    { id: 'opt7', option_text: 'Ace', option_value: 'ace' },
                    { id: 'opt8', option_text: '407', option_value: '407' },
                    { id: 'opt9', option_text: '909', option_value: '909' },
                    { id: 'opt10', option_text: 'Other', option_value: 'other' }
                  ]
                },
                {
                  id: 'q3',
                  question_text: 'Vehicle Manufacturing Year',
                  question_type: 'year',
                  is_required: true,
                  is_critical: false,
                  validation_rules: { min: 1990, max: new Date().getFullYear() + 1 }
                },
                {
                  id: 'q4',
                  question_text: 'Chassis No',
                  question_type: 'text',
                  is_required: true,
                  is_critical: false,
                  validation_rules: { min_length: 5 }
                },
                {
                  id: 'q5',
                  question_text: 'Chassis No Clarity',
                  question_type: 'dropdown',
                  is_required: true,
                  is_critical: false,
                  options: [
                    { id: 'opt11', option_text: 'Clear', option_value: 'clear' },
                    { id: 'opt12', option_text: 'Partially Clear', option_value: 'partially_clear' },
                    { id: 'opt13', option_text: 'Unclear', option_value: 'unclear' }
                  ]
                },
                {
                  id: 'q7',
                  question_text: 'VIN Plate Picture',
                  question_type: 'camera',
                  is_required: true,
                  is_critical: false,
                  validation_rules: { max_files: 2, max_size: '5MB' }
                },
                {
                  id: 'q8',
                  question_text: 'Chassis No Picture',
                  question_type: 'camera',
                  is_required: true,
                  is_critical: false,
                  validation_rules: { max_files: 2, max_size: '5MB' }
                }
              ]
            },
            {
              id: 'section-2',
              name: 'Vehicle Specifications & Registration',
              questions: [
                {
                  id: 'q9',
                  question_text: 'Body Length (meters)',
                  question_type: 'number',
                  is_required: true,
                  is_critical: false,
                  validation_rules: { min: 1 }
                },
                {
                  id: 'q10',
                  question_text: 'Meter Reading in KM',
                  question_type: 'number',
                  is_required: true,
                  is_critical: false,
                  validation_rules: { min: 0, max: 9999999 }
                },
                {
                  id: 'q11',
                  question_text: 'No. of Hours Run',
                  question_type: 'number',
                  is_required: false,
                  is_critical: false,
                  validation_rules: { min: 0, max: 99999 }
                },
                {
                  id: 'q12',
                  question_text: 'HSRP Number Plate',
                  question_type: 'yesno',
                  is_required: true,
                  is_critical: false
                },
                {
                  id: 'q13',
                  question_text: 'HSRP Number Plate Picture',
                  question_type: 'camera',
                  is_required: true,
                  is_critical: false,
                  validation_rules: { max_files: 2, max_size: '5MB' }
                },
                {
                  id: 'q14',
                  question_text: 'Load Body Type',
                  question_type: 'dropdown',
                  is_required: true,
                  is_critical: false,
                  options: [
                    { id: 'opt14', option_text: 'Open', option_value: 'open' },
                    { id: 'opt15', option_text: 'Closed', option_value: 'closed' },
                    { id: 'opt16', option_text: 'Tanker', option_value: 'tanker' },
                    { id: 'opt17', option_text: 'Flatbed', option_value: 'flatbed' },
                    { id: 'opt18', option_text: 'Container', option_value: 'container' }
                  ]
                },
                {
                  id: 'q15',
                  question_text: 'Load Body Build',
                  question_type: 'dropdown',
                  is_required: true,
                  is_critical: false,
                  options: [
                    { id: 'opt19', option_text: 'Steel', option_value: 'steel' },
                    { id: 'opt20', option_text: 'Aluminum', option_value: 'aluminum' },
                    { id: 'opt21', option_text: 'Fiber', option_value: 'fiber' },
                    { id: 'opt22', option_text: 'Wood', option_value: 'wood' },
                    { id: 'opt23', option_text: 'Mixed', option_value: 'mixed' }
                  ]
                }
              ]
            },
            {
              id: 'section-3',
              name: 'Body & Exterior Condition',
              questions: [
                {
                  id: 'q16',
                  question_text: 'Tail Gate',
                  question_type: 'slider',
                  is_required: true,
                  is_critical: false,
                  validation_rules: { min: 1, max: 4 },
                  options: [
                    { id: 'opt24', option_text: 'Good', option_value: 'good' },
                    { id: 'opt25', option_text: 'Fair', option_value: 'fair' },
                    { id: 'opt26', option_text: 'Poor', option_value: 'poor' },
                    { id: 'opt27', option_text: 'Not Applicable', option_value: 'na' }
                  ]
                },
                {
                  id: 'q17',
                  question_text: 'Tail Gate Picture',
                  question_type: 'camera',
                  is_required: true,
                  is_critical: false,
                  validation_rules: { max_files: 2, max_size: '5MB' }
                },
                {
                  id: 'q18',
                  question_text: 'Body Condition',
                  question_type: 'slider',
                  is_required: true,
                  is_critical: true,
                  validation_rules: { min: 1, max: 4 },
                  options: [
                    { id: 'opt28', option_text: 'Excellent', option_value: 'excellent' },
                    { id: 'opt29', option_text: 'Good', option_value: 'good' },
                    { id: 'opt30', option_text: 'Fair', option_value: 'fair' },
                    { id: 'opt31', option_text: 'Poor', option_value: 'poor' }
                  ]
                },
                {
                  id: 'q19',
                  question_text: 'Body Pictures',
                  question_type: 'camera',
                  is_required: true,
                  is_critical: false,
                  validation_rules: { max_files: 4, max_size: '5MB' }
                }
              ]
            },
            {
              id: 'section-4',
              name: 'Engine & Mechanical Systems',
              questions: [
                {
                  id: 'q20',
                  question_text: 'Engine Oil Level',
                  question_type: 'yesno',
                  is_required: true,
                  is_critical: true
                },
                {
                  id: 'q21',
                  question_text: 'Engine Oil Quality',
                  question_type: 'dropdown',
                  is_required: true,
                  is_critical: true,
                  options: [
                    { id: 'opt32', option_text: 'Good', option_value: 'good' },
                    { id: 'opt33', option_text: 'Fair', option_value: 'fair' },
                    { id: 'opt34', option_text: 'Poor', option_value: 'poor' }
                  ]
                },
                {
                  id: 'q23',
                  question_text: 'Coolant Level',
                  question_type: 'yesno',
                  is_required: true,
                  is_critical: true
                },
                {
                  id: 'q24',
                  question_text: 'Coolant Quality',
                  question_type: 'dropdown',
                  is_required: true,
                  is_critical: true,
                  options: [
                    { id: 'opt35', option_text: 'Good', option_value: 'good' },
                    { id: 'opt36', option_text: 'Fair', option_value: 'fair' },
                    { id: 'opt37', option_text: 'Poor', option_value: 'poor' }
                  ]
                },
                {
                  id: 'q24',
                  question_text: 'Engine Condition',
                  question_type: 'slider',
                  is_required: true,
                  is_critical: true,
                  validation_rules: { min: 1, max: 4 },
                  options: [
                    { id: 'opt38', option_text: 'Excellent', option_value: 'excellent' },
                    { id: 'opt39', option_text: 'Good', option_value: 'good' },
                    { id: 'opt40', option_text: 'Fair', option_value: 'fair' },
                    { id: 'opt41', option_text: 'Poor', option_value: 'poor' }
                  ]
                },
                {
                  id: 'q25',
                  question_text: 'Engine Pictures',
                  question_type: 'camera',
                  is_required: true,
                  is_critical: false,
                  validation_rules: { max_files: 4, max_size: '5MB' }
                }
              ]
            },
            {
              id: 'section-5',
              name: 'Tyres & Wheels',
              questions: [
                {
                  id: 'q26',
                  question_text: 'Front Left Tyre Condition',
                  question_type: 'tyre_fields',
                  is_required: true,
                  is_critical: true
                },
                {
                  id: 'q27',
                  question_text: 'Front Right Tyre Condition',
                  question_type: 'tyre_fields',
                  is_required: true,
                  is_critical: true
                },
                {
                  id: 'q28',
                  question_text: 'Rear Left Tyre Condition',
                  question_type: 'tyre_fields',
                  is_required: true,
                  is_critical: true
                },
                {
                  id: 'q29',
                  question_text: 'Rear Right Tyre Condition',
                  question_type: 'tyre_fields',
                  is_required: true,
                  is_critical: true
                },
                {
                  id: 'q30',
                  question_text: 'Tyre Pictures',
                  question_type: 'camera',
                  is_required: true,
                  is_critical: false,
                  validation_rules: { max_files: 6, max_size: '5MB' }
                }
              ]
            },
            {
              id: 'section-6',
              name: 'Brakes & Safety Systems',
              questions: [
                {
                  id: 'q31',
                  question_text: 'Brake Fluid Level',
                  question_type: 'yesno',
                  is_required: true,
                  is_critical: true
                },
                {
                  id: 'q32',
                  question_text: 'Brake Pad Condition',
                  question_type: 'slider',
                  is_required: true,
                  is_critical: true,
                  validation_rules: { min: 1, max: 4 },
                  options: [
                    { id: 'opt42', option_text: 'Good', option_value: 'good' },
                    { id: 'opt43', option_text: 'Fair', option_value: 'fair' },
                    { id: 'opt44', option_text: 'Poor', option_value: 'poor' },
                    { id: 'opt45', option_text: 'Critical', option_value: 'critical' }
                  ]
                },
                {
                  id: 'q33',
                  question_text: 'Brake System Pictures',
                  question_type: 'camera',
                  is_required: true,
                  is_critical: false,
                  validation_rules: { max_files: 4, max_size: '5MB' }
                },
                {
                  id: 'q34',
                  question_text: 'Hand Brake Function',
                  question_type: 'yesno',
                  is_required: true,
                  is_critical: true
                },
                {
                  id: 'q35',
                  question_text: 'ABS System',
                  question_type: 'yesno',
                  is_required: false,
                  is_critical: false
                }
              ]
            },
            {
              id: 'section-7',
              name: 'Electrical Systems',
              questions: [
                {
                  id: 'q36',
                  question_text: 'Battery Condition',
                  question_type: 'slider',
                  is_required: true,
                  is_critical: false,
                  validation_rules: { min: 1, max: 4 },
                  options: [
                    { id: 'opt46', option_text: 'Good', option_value: 'good' },
                    { id: 'opt47', option_text: 'Fair', option_value: 'fair' },
                    { id: 'opt48', option_text: 'Poor', option_value: 'poor' },
                    { id: 'opt49', option_text: 'Dead', option_value: 'dead' }
                  ]
                },
                {
                  id: 'q37',
                  question_text: 'Headlights Function',
                  question_type: 'yesno',
                  is_required: true,
                  is_critical: true
                },
                {
                  id: 'q38',
                  question_text: 'Tail Lights Function',
                  question_type: 'yesno',
                  is_required: true,
                  is_critical: true
                },
                {
                  id: 'q39',
                  question_text: 'Indicator Lights Function',
                  question_type: 'yesno',
                  is_required: true,
                  is_critical: true
                },
                {
                  id: 'q40',
                  question_text: 'Horn Function',
                  question_type: 'yesno',
                  is_required: true,
                  is_critical: false
                },
                {
                  id: 'q41',
                  question_text: 'Electrical System Pictures',
                  question_type: 'camera',
                  is_required: true,
                  is_critical: false,
                  validation_rules: { max_files: 4, max_size: '5MB' }
                }
              ]
            },
            {
              id: 'section-8',
              name: 'Interior & Cabin',
              questions: [
                {
                  id: 'q42',
                  question_text: 'Driver Seat Condition',
                  question_type: 'slider',
                  is_required: true,
                  is_critical: false,
                  validation_rules: { min: 1, max: 4 },
                  options: [
                    { id: 'opt50', option_text: 'Good', option_value: 'good' },
                    { id: 'opt51', option_text: 'Fair', option_value: 'fair' },
                    { id: 'opt52', option_text: 'Poor', option_value: 'poor' },
                    { id: 'opt53', option_text: 'Damaged', option_value: 'damaged' }
                  ]
                },
                {
                  id: 'q43',
                  question_text: 'Dashboard Condition',
                  question_type: 'slider',
                  is_required: true,
                  is_critical: false,
                  validation_rules: { min: 1, max: 4 },
                  options: [
                    { id: 'opt54', option_text: 'Good', option_value: 'good' },
                    { id: 'opt55', option_text: 'Fair', option_value: 'fair' },
                    { id: 'opt56', option_text: 'Poor', option_value: 'poor' },
                    { id: 'opt57', option_text: 'Damaged', option_value: 'damaged' }
                  ]
                },
                {
                  id: 'q44',
                  question_text: 'Steering Wheel Condition',
                  question_type: 'slider',
                  is_required: true,
                  is_critical: true,
                  validation_rules: { min: 1, max: 4 },
                  options: [
                    { id: 'opt58', option_text: 'Good', option_value: 'good' },
                    { id: 'opt59', option_text: 'Fair', option_value: 'fair' },
                    { id: 'opt60', option_text: 'Poor', option_value: 'poor' },
                    { id: 'opt61', option_text: 'Loose', option_value: 'loose' }
                  ]
                },
                {
                  id: 'q45',
                  question_text: 'Interior Pictures',
                  question_type: 'camera',
                  is_required: true,
                  is_critical: false,
                  validation_rules: { max_files: 4, max_size: '5MB' }
                }
              ]
            },
            {
              id: 'section-9',
              name: 'Safety Equipment',
              questions: [
                {
                  id: 'q46',
                  question_text: 'Fire Extinguisher Present',
                  question_type: 'yesno',
                  is_required: true,
                  is_critical: true
                },
                {
                  id: 'q47',
                  question_text: 'Fire Extinguisher Expiry',
                  question_type: 'date',
                  is_required: true,
                  is_critical: true
                },
                {
                  id: 'q48',
                  question_text: 'First Aid Kit Present',
                  question_type: 'yesno',
                  is_required: true,
                  is_critical: true
                },
                {
                  id: 'q49',
                  question_text: 'Safety Equipment Pictures',
                  question_type: 'camera',
                  is_required: true,
                  is_critical: false,
                  validation_rules: { max_files: 4, max_size: '5MB' }
                }
              ]
            },
            {
              id: 'section-10',
              name: 'Final Assessment',
              questions: [
                {
                  id: 'q50',
                  question_text: 'Overall Vehicle Condition',
                  question_type: 'slider',
                  is_required: true,
                  is_critical: true,
                  validation_rules: { min: 1, max: 10 },
                  options: [
                    { id: 'opt62', option_text: '1 - Poor', option_value: '1' },
                    { id: 'opt63', option_text: '2', option_value: '2' },
                    { id: 'opt64', option_text: '3', option_value: '3' },
                    { id: 'opt65', option_text: '4', option_value: '4' },
                    { id: 'opt66', option_text: '5 - Average', option_value: '5' },
                    { id: 'opt67', option_text: '6', option_value: '6' },
                    { id: 'opt68', option_text: '7', option_value: '7' },
                    { id: 'opt69', option_text: '8', option_value: '8' },
                    { id: 'opt70', option_text: '9', option_value: '9' },
                    { id: 'opt71', option_text: '10 - Excellent', option_value: '10' }
                  ]
                },
                {
                  id: 'q51',
                  question_text: 'Pass/Fail Recommendation',
                  question_type: 'dropdown',
                  is_required: true,
                  is_critical: true,
                  options: [
                    { id: 'opt72', option_text: 'Pass', option_value: 'pass' },
                    { id: 'opt73', option_text: 'Conditional Pass', option_value: 'conditional' },
                    { id: 'opt74', option_text: 'Fail', option_value: 'fail' }
                  ]
                },
                {
                  id: 'q52',
                  question_text: 'Inspector Notes',
                  question_type: 'text',
                  is_required: false,
                  is_critical: false,
                  validation_rules: { max_length: 500 }
                },
                {
                  id: 'q53',
                  question_text: 'Inspector Signature',
                  question_type: 'signature',
                  is_required: true,
                  is_critical: true
                },
                {
                  id: 'q54',
                  question_text: 'Inspection Location',
                  question_type: 'geolocation',
                  is_required: true,
                  is_critical: false
                },
                {
                  id: 'q55',
                  question_text: 'Final Inspection Photos',
                  question_type: 'camera',
                  is_required: true,
                  is_critical: false,
                  validation_rules: { max_files: 6, max_size: '5MB' }
                }
              ]
            }
          ]
        };

export const InspectionCapture: React.FC = () => {
  const navigate = useNavigate();
  const { templateId, vehicleId } = useParams<{ templateId: string; vehicleId?: string }>();

  const [template, setTemplate] = useState<InspectionTemplate | null>(null);
  const [templateSource, setTemplateSource] = useState<'network' | 'cache' | 'mock' | null>(null);
  const [templateCachedAt, setTemplateCachedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<SubmissionProgress | null>(null);
  const [queuedCount, setQueuedCount] = useState(0);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [initialAnswers, setInitialAnswers] = useState<Record<string, any>>({});
  const [submissionBanner, setSubmissionBanner] = useState<string | null>(null);
  const [templateWarning, setTemplateWarning] = useState<string | null>(null);

  const effectiveTemplateId = templateId ?? FALLBACK_TEMPLATE.id;

  const loadTemplate = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      if (!templateId) {
        setTemplate(FALLBACK_TEMPLATE);
        setTemplateSource('mock');
        setTemplateCachedAt(Date.now());
        setTemplateWarning('Using offline demo template. Connect to fetch live templates.');
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
      // Failed to fetch inspection template, using fallback
      if (!templateId) {
        setTemplate(FALLBACK_TEMPLATE);
        setTemplateSource('mock');
        setTemplateCachedAt(Date.now());
        setTemplateWarning('Using offline demo template. Connect to fetch live templates.');
      } else {
        setTemplate(null);
        setTemplateSource(null);
        setTemplateCachedAt(null);
        setError(err as Error);
      }
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const record = await loadInspectionDraft(effectiveTemplateId, vehicleId);
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
  }, [effectiveTemplateId, vehicleId, template?.id]);

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
    } catch (err) {
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

  const handleSaveDraft = useCallback(async (answers: Record<string, any>) => {
    const serialized = serializeAnswers(answers);
    await saveInspectionDraft(effectiveTemplateId, vehicleId, serialized);
    setDraftSavedAt(Date.now());

    const online = typeof navigator === 'undefined' || navigator.onLine;

    if (!online) {
      await queueInspectionSubmission({
        templateId: effectiveTemplateId,
        vehicleId,
        answers: serialized,
        metadata: { template_name: template?.name },
        mode: 'draft',
        queueId: `draft:${effectiveTemplateId}:${vehicleId ?? 'default'}`,
      });
      setSubmissionBanner('Draft saved offline. We will sync it automatically when you reconnect.');
    } else {
      setSubmissionBanner('Draft saved.');
    }
  }, [effectiveTemplateId, vehicleId, template?.name]);

  const handleSubmit = useCallback(async (answers: Record<string, any>) => {
    const serialized = serializeAnswers(answers);
    setIsSubmitting(true);
    setProgress(null);
    setSubmissionBanner(null);

    try {
      const result = await submitInspection({
        templateId: effectiveTemplateId,
        vehicleId,
        serializedAnswers: serialized,
        metadata: { template_name: template?.name },
        mode: 'final',
        onProgress: setProgress,
      });

      if (result.status === 'submitted') {
        await clearInspectionDraft(effectiveTemplateId, vehicleId);
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
        await saveInspectionDraft(effectiveTemplateId, vehicleId, serialized);
        setSubmissionBanner('Inspection queued offline. It will sync once connectivity returns.');
      }
    } catch (err) {
      // Failed to submit inspection - error is handled by inspection-submit.ts
      setSubmissionBanner('Submission failed. Please retry once connectivity stabilises.');
    } finally {
      setIsSubmitting(false);
    }
  }, [effectiveTemplateId, vehicleId, template?.name, navigate]);

  const handleRetryFetch = useCallback(() => {
    loadTemplate(true);
  }, [loadTemplate]);

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
          error={error}
          onRetry={handleRetryFetch}
          onGoBack={() => navigate('/app/inspections')}
        />
      </div>
    );
  }

  if (!template) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>❌</div>
        <div style={{ color: colors.neutral[600] }}>Template not found</div>
        <button
          onClick={() => navigate('/app/inspections')}
          style={{
            marginTop: spacing.md,
            padding: spacing.sm,
            backgroundColor: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Back to Inspections
        </button>
      </div>
    );
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
            onClick={() => navigate('/app/inspections')}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {template.description && (
            <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
              {template.description}
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.md }}>
            {templateSource && (
              <span style={{ ...typography.bodySmall, color: colors.neutral[500] }}>
                Source: {templateSource === 'mock' ? 'offline demo' : templateSource}
                {templateCachedAt && templateSource === 'cache' && ` · cached ${new Date(templateCachedAt).toLocaleString()}`}
              </span>
            )}
            {queuedCount > 0 && (
              <span style={{ ...typography.bodySmall, color: colors.status.warning }}>
                {queuedCount} inspection{queuedCount === 1 ? '' : 's'} waiting to sync
              </span>
            )}
            {draftSavedAt && (
              <span style={{ ...typography.bodySmall, color: colors.neutral[500] }}>
                Draft saved {new Date(draftSavedAt).toLocaleTimeString()}
              </span>
            )}
            {progress && progress.phase === 'uploading' && (
              <span style={{ ...typography.bodySmall, color: colors.primary }}>
                Uploading… {progress.percent ? `${progress.percent}%` : ''}
              </span>
            )}
          </div>

          {templateWarning && (
            <div style={{
              backgroundColor: colors.status.warning + '20',
              border: `1px solid ${colors.status.warning}`,
              borderRadius: '8px',
              padding: spacing.sm,
              color: colors.status.warning,
              ...typography.bodySmall,
            }}>
              ⚠️ {templateWarning}
            </div>
          )}

          {submissionBanner && (
            <div style={{
              backgroundColor: colors.neutral[100],
              borderRadius: '8px',
              padding: spacing.sm,
              color: colors.neutral[700],
              ...typography.bodySmall,
            }}>
              {submissionBanner}
            </div>
          )}
        </div>

      <DynamicFormRenderer
        template={template}
        initialAnswers={initialAnswers}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        readOnly={false}
        submitting={isSubmitting}
      />
    </div>
  );
};
