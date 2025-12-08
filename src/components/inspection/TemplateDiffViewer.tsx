import React from 'react';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { Plus, Minus, Edit, AlertTriangle } from 'lucide-react';

interface Section {
  id: string;
  name: string;
  questions: Array<{
    id: string;
    question_text: string;
    question_type: string;
    is_required: boolean;
    is_critical: boolean;
  }>;
}

interface TemplateDiffViewerProps {
  oldTemplate: {
    id: string;
    name: string;
    version?: number;
    updated_at?: string;
    sections: Section[];
  };
  newTemplate: {
    id: string;
    name: string;
    version?: number;
    updated_at?: string;
    sections: Section[];
  };
  inspectionAnswers: Record<string, any>;
}

export const TemplateDiffViewer: React.FC<TemplateDiffViewerProps> = ({
  oldTemplate,
  newTemplate,
  inspectionAnswers,
}) => {
  // Analyze differences
  const oldSectionIds = new Set(oldTemplate.sections.map(s => s.id));
  const newSectionIds = new Set(newTemplate.sections.map(s => s.id));
  
  const addedSections = newTemplate.sections.filter(s => !oldSectionIds.has(s.id));
  const removedSections = oldTemplate.sections.filter(s => !newSectionIds.has(s.id));
  const modifiedSections: Array<{
    section: Section;
    oldSection: Section;
    addedQuestions: any[];
    removedQuestions: any[];
    modifiedQuestions: any[];
  }> = [];

  // Find modified sections
  oldTemplate.sections.forEach(oldSection => {
    const newSection = newTemplate.sections.find(s => s.id === oldSection.id);
    if (newSection && newSection.id === oldSection.id) {
      const oldQuestionIds = new Set(oldSection.questions.map(q => q.id));
      const newQuestionIds = new Set(newSection.questions.map(q => q.id));
      
      const addedQuestions = newSection.questions.filter(q => !oldQuestionIds.has(q.id));
      const removedQuestions = oldSection.questions.filter(q => !newQuestionIds.has(q.id));
      const modifiedQuestions = newSection.questions.filter(q => {
        const oldQ = oldSection.questions.find(oq => oq.id === q.id);
        return oldQ && (
          oldQ.question_text !== q.question_text ||
          oldQ.question_type !== q.question_type ||
          oldQ.is_required !== q.is_required ||
          oldQ.is_critical !== q.is_critical
        );
      });

      if (addedQuestions.length > 0 || removedQuestions.length > 0 || modifiedQuestions.length > 0) {
        modifiedSections.push({
          section: newSection,
          oldSection,
          addedQuestions,
          removedQuestions,
          modifiedQuestions,
        });
      }
    }
  });

  // Find questions with answers that might be affected
  const affectedAnswers = Object.keys(inspectionAnswers).filter(answerKey => {
    const questionId = answerKey.split('_')[0]; // Assuming format: questionId_field
    const oldQuestion = oldTemplate.sections
      .flatMap(s => s.questions)
      .find(q => q.id === questionId);
    const newQuestion = newTemplate.sections
      .flatMap(s => s.questions)
      .find(q => q.id === questionId);
    
    if (!oldQuestion || !newQuestion) return false;
    
    return (
      oldQuestion.question_text !== newQuestion.question_text ||
      oldQuestion.question_type !== newQuestion.question_type ||
      oldQuestion.is_required !== newQuestion.is_required ||
      oldQuestion.is_critical !== newQuestion.is_critical
    );
  });

  return (
    <div style={{ padding: spacing.md }}>
      <div style={{ ...typography.subheader, marginBottom: spacing.md }}>
        Template Changes Detected
      </div>
      
      <div style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.lg }}>
        Template "{oldTemplate.name}" was updated from version {oldTemplate.version || 'N/A'} to version {newTemplate.version || 'N/A'}.
        The following changes may affect your inspection answers:
      </div>

      {/* Added Sections */}
      {addedSections.length > 0 && (
        <div style={{ marginBottom: spacing.lg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <Plus size={16} color={colors.success[600]} />
            <div style={{ ...typography.label, color: colors.success[700] }}>
              New Sections ({addedSections.length})
            </div>
          </div>
          {addedSections.map(section => (
            <div
              key={section.id}
              style={{
                padding: spacing.sm,
                marginLeft: spacing.md,
                marginBottom: spacing.xs,
                backgroundColor: colors.success[50],
                border: `1px solid ${colors.success[200]}`,
                borderRadius: borderRadius.sm,
              }}
            >
              <div style={{ ...typography.body, fontWeight: 600 }}>{section.name}</div>
              <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                {section.questions.length} question{section.questions.length !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Removed Sections */}
      {removedSections.length > 0 && (
        <div style={{ marginBottom: spacing.lg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <Minus size={16} color={colors.error[600]} />
            <div style={{ ...typography.label, color: colors.error[700] }}>
              Removed Sections ({removedSections.length})
            </div>
          </div>
          {removedSections.map(section => (
            <div
              key={section.id}
              style={{
                padding: spacing.sm,
                marginLeft: spacing.md,
                marginBottom: spacing.xs,
                backgroundColor: colors.error[50],
                border: `1px solid ${colors.error[200]}`,
                borderRadius: borderRadius.sm,
              }}
            >
              <div style={{ ...typography.body, fontWeight: 600 }}>{section.name}</div>
              {inspectionAnswers[section.id] && (
                <div style={{ ...typography.caption, color: colors.error[600], marginTop: spacing.xs }}>
                  ⚠️ You have answers in this section
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modified Sections */}
      {modifiedSections.length > 0 && (
        <div style={{ marginBottom: spacing.lg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <Edit size={16} color={colors.warning[600]} />
            <div style={{ ...typography.label, color: colors.warning[700] }}>
              Modified Sections ({modifiedSections.length})
            </div>
          </div>
          {modifiedSections.map(({ section, addedQuestions, removedQuestions, modifiedQuestions }) => (
            <div
              key={section.id}
              style={{
                padding: spacing.md,
                marginLeft: spacing.md,
                marginBottom: spacing.sm,
                backgroundColor: colors.warning[50],
                border: `1px solid ${colors.warning[200]}`,
                borderRadius: borderRadius.md,
              }}
            >
              <div style={{ ...typography.body, fontWeight: 600, marginBottom: spacing.sm }}>
                {section.name}
              </div>
              
              {addedQuestions.length > 0 && (
                <div style={{ marginBottom: spacing.xs }}>
                  <div style={{ ...typography.caption, color: colors.success[700] }}>
                    + {addedQuestions.length} new question{addedQuestions.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
              
              {removedQuestions.length > 0 && (
                <div style={{ marginBottom: spacing.xs }}>
                  <div style={{ ...typography.caption, color: colors.error[700] }}>
                    - {removedQuestions.length} removed question{removedQuestions.length !== 1 ? 's' : ''}
                    {removedQuestions.some(q => inspectionAnswers[q.id]) && (
                      <span style={{ color: colors.error[600] }}> (you have answers)</span>
                    )}
                  </div>
                </div>
              )}
              
              {modifiedQuestions.length > 0 && (
                <div>
                  <div style={{ ...typography.caption, color: colors.warning[700], marginBottom: spacing.xs }}>
                    ~ {modifiedQuestions.length} modified question{modifiedQuestions.length !== 1 ? 's' : ''}
                  </div>
                  {modifiedQuestions.map(q => {
                    const hasAnswer = inspectionAnswers[q.id];
                    return (
                      <div
                        key={q.id}
                        style={{
                          padding: spacing.xs,
                          marginLeft: spacing.sm,
                          marginTop: spacing.xs,
                          backgroundColor: hasAnswer ? colors.warning[100] : 'transparent',
                          borderRadius: borderRadius.sm,
                        }}
                      >
                        <div style={{ ...typography.caption, fontWeight: hasAnswer ? 600 : 400 }}>
                          {q.question_text}
                          {hasAnswer && (
                            <span style={{ color: colors.warning[700], marginLeft: spacing.xs }}>
                              (has answer)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Affected Answers Warning */}
      {affectedAnswers.length > 0 && (
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.warning[50],
            border: `2px solid ${colors.warning[300]}`,
            borderRadius: borderRadius.md,
            display: 'flex',
            alignItems: 'start',
            gap: spacing.sm,
          }}
        >
          <AlertTriangle size={20} color={colors.warning[700]} />
          <div style={{ flex: 1 }}>
            <div style={{ ...typography.body, fontWeight: 600, marginBottom: spacing.xs }}>
              {affectedAnswers.length} Answer{affectedAnswers.length !== 1 ? 's' : ''} May Be Affected
            </div>
            <div style={{ ...typography.caption, color: colors.neutral[700] }}>
              Some of your answers are for questions that have been modified. Please review and update them if needed.
            </div>
          </div>
        </div>
      )}

      {addedSections.length === 0 && removedSections.length === 0 && modifiedSections.length === 0 && (
        <div style={{ padding: spacing.md, textAlign: 'center', color: colors.neutral[600] }}>
          No structural changes detected. Only metadata may have changed.
        </div>
      )}
    </div>
  );
};





