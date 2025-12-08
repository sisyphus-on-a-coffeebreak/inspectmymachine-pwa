import React from 'react';
import { Button } from '../ui/button';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { Plus, Trash2 } from 'lucide-react';

export interface InspectionQuestion {
  id?: string;
  question_text: string;
  question_type: 'text' | 'number' | 'date' | 'yesno' | 'dropdown' | 'slider' | 'camera' | 'audio' | 'signature' | 'multiselect' | 'geolocation';
  is_required: boolean;
  is_critical: boolean;
  order_index: number;
  help_text?: string;
  validation_rules?: Record<string, unknown>;
  conditional_logic?: Record<string, unknown>;
  options?: Array<{
    option_text: string;
    option_value: string;
    order_index: number;
    is_default?: boolean;
  }>;
}

interface QuestionBuilderProps {
  questions: InspectionQuestion[];
  questionTypes: Array<{ value: string; label: string }>;
  onAddQuestion: () => void;
  onUpdateQuestion: (index: number, updates: Partial<InspectionQuestion>) => void;
  onDeleteQuestion: (index: number) => void;
  onAddOption: (questionIndex: number) => void;
  onUpdateOption: (questionIndex: number, optionIndex: number, updates: Partial<InspectionQuestion['options']>[0]) => void;
  onDeleteOption: (questionIndex: number, optionIndex: number) => void;
}

export const QuestionBuilder: React.FC<QuestionBuilderProps> = ({
  questions,
  questionTypes,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
}) => {
  return (
    <div style={{ marginTop: spacing.md }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
        <h4 style={{ ...typography.label, fontSize: '13px' }}>Questions</h4>
        <Button variant="outline" size="sm" onClick={onAddQuestion}>
          <Plus size={14} style={{ marginRight: spacing.xs }} />
          Add Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: spacing.md, color: colors.neutral[600], fontSize: '12px' }}>
          No questions yet. Add your first question.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: spacing.sm }}>
          {questions.map((question, questionIndex) => (
            <div
              key={questionIndex}
              style={{
                padding: spacing.sm,
                backgroundColor: colors.neutral[50],
                borderRadius: borderRadius.sm,
                border: `1px solid ${colors.neutral[200]}`,
              }}
            >
              <div style={{ display: 'grid', gap: spacing.xs, marginBottom: spacing.xs }}>
                <input
                  type="text"
                  value={question.question_text || ''}
                  onChange={(e) => onUpdateQuestion(questionIndex, { question_text: e.target.value })}
                  placeholder="Enter question text"
                  style={{
                    width: '100%',
                    padding: spacing.xs,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.sm,
                    fontSize: '13px',
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: spacing.xs }}>
                  <select
                    value={question.question_type}
                    onChange={(e) => onUpdateQuestion(questionIndex, { question_type: e.target.value as InspectionQuestion['question_type'] })}
                    style={{
                      padding: spacing.xs,
                      border: `1px solid ${colors.neutral[300]}`,
                      borderRadius: borderRadius.sm,
                      fontSize: '12px',
                    }}
                  >
                    {questionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, fontSize: '11px', cursor: 'pointer', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={question.is_required}
                        onChange={(e) => onUpdateQuestion(questionIndex, { is_required: e.target.checked })}
                        style={{
                          width: '14px',
                          height: '14px',
                          cursor: 'pointer',
                          accentColor: colors.primary,
                          margin: 0,
                          flexShrink: 0,
                        }}
                      />
                      Required
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, fontSize: '11px', cursor: 'pointer', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={question.is_critical}
                        onChange={(e) => onUpdateQuestion(questionIndex, { is_critical: e.target.checked })}
                        style={{
                          width: '14px',
                          height: '14px',
                          cursor: 'pointer',
                          accentColor: colors.error[500],
                          margin: 0,
                          flexShrink: 0,
                        }}
                      />
                      Critical
                    </label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteQuestion(questionIndex)}
                  >
                    <Trash2 size={14} style={{ color: colors.error[500] }} />
                  </Button>
                </div>
              </div>

              {/* Question Options (for dropdown/multiselect) */}
              {(question.question_type === 'dropdown' || question.question_type === 'multiselect') && (
                <div style={{ marginTop: spacing.xs, paddingTop: spacing.xs, borderTop: `1px solid ${colors.neutral[200]}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                    <span style={{ fontSize: '11px', color: colors.neutral[600] }}>Options</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAddOption(questionIndex)}
                    >
                      <Plus size={12} />
                    </Button>
                  </div>
                  {question.options?.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr auto',
                        gap: spacing.xs,
                        marginBottom: spacing.xs,
                      }}
                    >
                      <input
                        type="text"
                        value={option.option_text || ''}
                        onChange={(e) =>
                          onUpdateOption(questionIndex, optionIndex, {
                            option_text: e.target.value,
                          })
                        }
                        placeholder="Enter option text"
                        style={{
                          padding: spacing.xs,
                          border: `1px solid ${colors.neutral[300]}`,
                          borderRadius: borderRadius.sm,
                          fontSize: '12px',
                        }}
                      />
                      <input
                        type="text"
                        value={option.option_value || ''}
                        onChange={(e) =>
                          onUpdateOption(questionIndex, optionIndex, {
                            option_value: e.target.value,
                          })
                        }
                        placeholder="Enter option value"
                        style={{
                          padding: spacing.xs,
                          border: `1px solid ${colors.neutral[300]}`,
                          borderRadius: borderRadius.sm,
                          fontSize: '12px',
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteOption(questionIndex, optionIndex)}
                      >
                        <Trash2 size={12} style={{ color: colors.error[500] }} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};



