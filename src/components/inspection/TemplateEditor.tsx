import React from 'react';
import { Button } from '../ui/button';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { Plus, X, Save, GripVertical, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { QuestionBuilder, type InspectionQuestion } from './QuestionBuilder';

export interface InspectionSection {
  id?: string;
  name: string;
  description?: string;
  order_index: number;
  is_required: boolean;
  questions: InspectionQuestion[];
}

export interface InspectionTemplate {
  id?: string;
  name: string;
  description?: string;
  category: 'commercial_vehicle' | 'light_vehicle' | 'equipment' | 'safety' | 'custom';
  asset_class?: string;
  is_active: boolean;
  sections: InspectionSection[];
}

interface TemplateEditorProps {
  template: InspectionTemplate;
  editingTemplate: InspectionTemplate | null;
  expandedSections: Set<number>;
  questionTypes: Array<{ value: string; label: string }>;
  onTemplateChange: (template: InspectionTemplate) => void;
  onToggleSection: (index: number) => void;
  onAddSection: () => void;
  onUpdateSection: (index: number, updates: Partial<InspectionSection>) => void;
  onDeleteSection: (index: number) => void;
  onAddQuestion: (sectionIndex: number) => void;
  onUpdateQuestion: (sectionIndex: number, questionIndex: number, updates: Partial<InspectionQuestion>) => void;
  onDeleteQuestion: (sectionIndex: number, questionIndex: number) => void;
  onAddQuestionOption: (sectionIndex: number, questionIndex: number) => void;
  onUpdateQuestionOption: (
    sectionIndex: number,
    questionIndex: number,
    optionIndex: number,
    updates: Partial<InspectionQuestion['options']>[0]
  ) => void;
  onDeleteQuestionOption: (sectionIndex: number, questionIndex: number, optionIndex: number) => void;
  onCancel: () => void;
  onSave: () => void;
  publishing: boolean;
  loading: boolean;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  editingTemplate,
  expandedSections,
  questionTypes,
  onTemplateChange,
  onToggleSection,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddQuestionOption,
  onUpdateQuestionOption,
  onDeleteQuestionOption,
  onCancel,
  onSave,
  publishing,
  loading,
}) => {
  return (
    <div data-template-form style={{ backgroundColor: 'white', borderRadius: borderRadius.lg, padding: spacing.xl, border: `1px solid ${colors.neutral[200]}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
        <h2 style={{ ...typography.h2 }}>
          {editingTemplate ? 'Edit Template' : 'Create Template'}
        </h2>
        <Button variant="outline" onClick={onCancel}>
          <X size={16} />
        </Button>
      </div>

      {/* Template Basic Info */}
      <div style={{ marginBottom: spacing.xl, display: 'grid', gap: spacing.md }}>
        <div>
          <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
            Template Name *
          </label>
          <input
            type="text"
            value={template.name}
            onChange={(e) => onTemplateChange({ ...template, name: e.target.value })}
            style={{
              width: '100%',
              padding: spacing.sm,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '14px',
            }}
            placeholder="e.g., Commercial Vehicle Inspection"
          />
        </div>

        <div>
          <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
            Description
          </label>
          <textarea
            value={template.description}
            onChange={(e) => onTemplateChange({ ...template, description: e.target.value })}
            style={{
              width: '100%',
              padding: spacing.sm,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '14px',
              minHeight: '80px',
            }}
            placeholder="Template description..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
          <div>
            <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
              Category *
            </label>
            <select
              value={template.category}
              onChange={(e) => onTemplateChange({ ...template, category: e.target.value as InspectionTemplate['category'] })}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                fontSize: '14px',
              }}
            >
              <option value="commercial_vehicle">Commercial Vehicle</option>
              <option value="light_vehicle">Light Vehicle</option>
              <option value="equipment">Equipment</option>
              <option value="safety">Safety</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
              Asset Class (Optional)
            </label>
            <input
              type="text"
              value={template.asset_class || ''}
              onChange={(e) => onTemplateChange({ ...template, asset_class: e.target.value })}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                fontSize: '14px',
              }}
              placeholder="e.g., Excavator, Forklift"
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div style={{ marginBottom: spacing.xl }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <h3 style={{ ...typography.subheader }}>Sections</h3>
          <Button variant="outline" size="sm" onClick={onAddSection}>
            <Plus size={16} style={{ marginRight: spacing.xs }} />
            Add Section
          </Button>
        </div>

        {template.sections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.neutral[600] }}>
            No sections yet. Add your first section to start building the template.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: spacing.md }}>
            {template.sections.map((section, sectionIndex) => (
              <div
                key={sectionIndex}
                style={{
                  border: `1px solid ${colors.neutral[200]}`,
                  borderRadius: borderRadius.md,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: spacing.md,
                    backgroundColor: colors.neutral[50],
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => onToggleSection(sectionIndex)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                    <GripVertical size={16} style={{ color: colors.neutral[400] }} />
                    <div>
                      <div style={{ ...typography.subheader, fontSize: '14px' }}>{section.name || 'Untitled Section'}</div>
                      {section.description && (
                        <div style={{ ...typography.caption, color: colors.neutral[600] }}>{section.description}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: spacing.xs, alignItems: 'center' }}>
                    <span style={{ ...typography.caption, color: colors.neutral[600] }}>
                      {section.questions.length} question{section.questions.length !== 1 ? 's' : ''}
                    </span>
                    {expandedSections.has(sectionIndex) ? (
                      <ChevronUp size={16} style={{ color: colors.neutral[400] }} />
                    ) : (
                      <ChevronDown size={16} style={{ color: colors.neutral[400] }} />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        if (e) {
                          e.stopPropagation();
                        }
                        onDeleteSection(sectionIndex);
                      }}
                    >
                      <Trash2 size={16} style={{ color: colors.error[500] }} />
                    </Button>
                  </div>
                </div>

                {expandedSections.has(sectionIndex) && (
                  <div style={{ padding: spacing.md }}>
                    {/* Section Details */}
                    <div style={{ marginBottom: spacing.md, display: 'grid', gap: spacing.sm }}>
                      <div>
                        <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs, fontSize: '12px' }}>
                          Section Name *
                        </label>
                        <input
                          type="text"
                          value={section.name || ''}
                          onChange={(e) => onUpdateSection(sectionIndex, { name: e.target.value })}
                          placeholder="Enter section name"
                          style={{
                            width: '100%',
                            padding: spacing.xs,
                            border: `1px solid ${colors.neutral[300]}`,
                            borderRadius: borderRadius.sm,
                            fontSize: '13px',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs, fontSize: '12px' }}>
                          Description
                        </label>
                        <input
                          type="text"
                          value={section.description || ''}
                          onChange={(e) => onUpdateSection(sectionIndex, { description: e.target.value })}
                          placeholder="Enter section description (optional)"
                          style={{
                            width: '100%',
                            padding: spacing.xs,
                            border: `1px solid ${colors.neutral[300]}`,
                            borderRadius: borderRadius.sm,
                            fontSize: '13px',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, fontSize: '12px', cursor: 'pointer', userSelect: 'none' }}>
                          <input
                            type="checkbox"
                            checked={section.is_required}
                            onChange={(e) => onUpdateSection(sectionIndex, { is_required: e.target.checked })}
                            style={{
                              width: '16px',
                              height: '16px',
                              cursor: 'pointer',
                              accentColor: colors.primary,
                              margin: 0,
                              flexShrink: 0,
                            }}
                          />
                          Required Section
                        </label>
                      </div>
                    </div>

                    {/* Questions */}
                    <QuestionBuilder
                      questions={section.questions}
                      questionTypes={questionTypes}
                      onAddQuestion={() => onAddQuestion(sectionIndex)}
                      onUpdateQuestion={(questionIndex, updates) => onUpdateQuestion(sectionIndex, questionIndex, updates)}
                      onDeleteQuestion={(questionIndex) => onDeleteQuestion(sectionIndex, questionIndex)}
                      onAddOption={(questionIndex) => onAddQuestionOption(sectionIndex, questionIndex)}
                      onUpdateOption={(questionIndex, optionIndex, updates) => onUpdateQuestionOption(sectionIndex, questionIndex, optionIndex, updates)}
                      onDeleteOption={(questionIndex, optionIndex) => onDeleteQuestionOption(sectionIndex, questionIndex, optionIndex)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing.md, paddingTop: spacing.lg, borderTop: `1px solid ${colors.neutral[200]}` }}>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={publishing || loading}>
          <Save size={16} style={{ marginRight: spacing.xs }} />
          {editingTemplate ? 'Update Template' : 'Publish Template'}
        </Button>
      </div>
    </div>
  );
};



