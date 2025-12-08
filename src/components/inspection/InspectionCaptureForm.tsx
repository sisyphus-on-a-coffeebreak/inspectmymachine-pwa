import React from 'react';
import { DynamicFormRenderer } from './DynamicFormRenderer';
import type { InspectionTemplate } from '@/types/inspection';
import type { SubmissionProgress } from '@/lib/inspection-submit';

interface InspectionCaptureFormProps {
  template: InspectionTemplate;
  initialAnswers: Record<string, any>;
  onSubmit: (answers: Record<string, any>) => Promise<void>;
  onSaveDraft: (answers: Record<string, any>) => Promise<void>;
  isSubmitting: boolean;
}

export const InspectionCaptureForm: React.FC<InspectionCaptureFormProps> = ({
  template,
  initialAnswers,
  onSubmit,
  onSaveDraft,
  isSubmitting,
}) => {
  return (
    <DynamicFormRenderer
      template={template}
      initialAnswers={initialAnswers}
      onSubmit={onSubmit}
      onSaveDraft={onSaveDraft}
      readOnly={false}
      submitting={isSubmitting}
    />
  );
};



