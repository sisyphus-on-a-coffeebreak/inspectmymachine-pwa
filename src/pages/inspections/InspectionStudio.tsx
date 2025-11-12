import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { useToast } from '../../providers/ToastProvider';
import { useConfirm } from '../../components/ui/Modal';
import { Button } from '../../components/ui/button';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { Plus, Trash2, Edit2, Eye, Copy, Save, X, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

/**
 * Inspection Studio - Admin Interface
 * 
 * Allows administrators to author inspection templates by asset class,
 * create preset bundles, and publish templates to /v1/inspection-templates.
 */

interface InspectionQuestion {
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

interface InspectionSection {
  id?: string;
  name: string;
  description?: string;
  order_index: number;
  is_required: boolean;
  questions: InspectionQuestion[];
}

interface InspectionTemplate {
  id?: string;
  name: string;
  description?: string;
  category: 'commercial_vehicle' | 'light_vehicle' | 'equipment' | 'safety' | 'custom';
  asset_class?: string;
  is_active: boolean;
  sections: InspectionSection[];
}

// Preset bundles for quick template creation
const PRESET_BUNDLES = {
  non_registered_assets: {
    name: 'Non-Registered Assets',
    description: 'Template for assets that don\'t require registration (equipment, machinery)',
    category: 'equipment' as const,
    sections: [
      {
        name: 'Asset Identification',
        description: 'Basic asset information',
        order_index: 0,
        is_required: true,
        questions: [
          {
            question_text: 'Asset Serial Number',
            question_type: 'text' as const,
            is_required: true,
            is_critical: true,
            order_index: 0,
          },
          {
            question_text: 'Asset Location',
            question_type: 'text' as const,
            is_required: true,
            is_critical: false,
            order_index: 1,
          },
          {
            question_text: 'Asset Condition',
            question_type: 'dropdown' as const,
            is_required: true,
            is_critical: true,
            order_index: 2,
            options: [
              { option_text: 'Excellent', option_value: 'excellent', order_index: 0 },
              { option_text: 'Good', option_value: 'good', order_index: 1 },
              { option_text: 'Fair', option_value: 'fair', order_index: 2 },
              { option_text: 'Poor', option_value: 'poor', order_index: 3 },
            ],
          },
        ],
      },
      {
        name: 'Visual Inspection',
        description: 'Visual condition assessment',
        order_index: 1,
        is_required: true,
        questions: [
          {
            question_text: 'Overall Condition Photos',
            question_type: 'camera' as const,
            is_required: true,
            is_critical: false,
            order_index: 0,
          },
          {
            question_text: 'Any Visible Damage?',
            question_type: 'yesno' as const,
            is_required: true,
            is_critical: true,
            order_index: 1,
          },
        ],
      },
    ],
  },
  chain_mounted_machinery: {
    name: 'Chain-Mounted Machinery',
    description: 'Template for chain-mounted equipment and attachments',
    category: 'equipment' as const,
    sections: [
      {
        name: 'Chain & Mounting',
        description: 'Chain and mounting hardware inspection',
        order_index: 0,
        is_required: true,
        questions: [
          {
            question_text: 'Chain Condition',
            question_type: 'dropdown' as const,
            is_required: true,
            is_critical: true,
            order_index: 0,
            options: [
              { option_text: 'Good', option_value: 'good', order_index: 0 },
              { option_text: 'Worn', option_value: 'worn', order_index: 1 },
              { option_text: 'Damaged', option_value: 'damaged', order_index: 2 },
            ],
          },
          {
            question_text: 'Mounting Hardware Photos',
            question_type: 'camera' as const,
            is_required: true,
            is_critical: false,
            order_index: 1,
          },
          {
            question_text: 'Chain Tension',
            question_type: 'dropdown' as const,
            is_required: true,
            is_critical: true,
            order_index: 2,
            options: [
              { option_text: 'Correct', option_value: 'correct', order_index: 0 },
              { option_text: 'Too Loose', option_value: 'loose', order_index: 1 },
              { option_text: 'Too Tight', option_value: 'tight', order_index: 2 },
            ],
          },
        ],
      },
    ],
  },
  attachments: {
    name: 'Attachments',
    description: 'Template for vehicle attachments and accessories',
    category: 'equipment' as const,
    sections: [
      {
        name: 'Attachment Details',
        description: 'Attachment identification and condition',
        order_index: 0,
        is_required: true,
        questions: [
          {
            question_text: 'Attachment Type',
            question_type: 'text' as const,
            is_required: true,
            is_critical: true,
            order_index: 0,
          },
          {
            question_text: 'Attachment Condition',
            question_type: 'dropdown' as const,
            is_required: true,
            is_critical: true,
            order_index: 1,
            options: [
              { option_text: 'Excellent', option_value: 'excellent', order_index: 0 },
              { option_text: 'Good', option_value: 'good', order_index: 1 },
              { option_text: 'Fair', option_value: 'fair', order_index: 2 },
              { option_text: 'Poor', option_value: 'poor', order_index: 3 },
            ],
          },
          {
            question_text: 'Photos',
            question_type: 'camera' as const,
            is_required: false,
            is_critical: false,
            order_index: 2,
          },
        ],
      },
    ],
  },
};

const QUESTION_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'yesno', label: 'Yes/No' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'slider', label: 'Slider' },
  { value: 'camera', label: 'Camera' },
  { value: 'audio', label: 'Audio' },
  { value: 'signature', label: 'Signature' },
  { value: 'geolocation', label: 'Geolocation' },
];

export const InspectionStudio: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InspectionTemplate | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<InspectionTemplate>({
    name: '',
    description: '',
    category: 'custom',
    is_active: true,
    sections: [],
  });
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<InspectionTemplate[]>('/v1/inspection-templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      showToast({
        title: 'Error',
        description: 'Failed to load inspection templates',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPresetBundle = (bundleKey: keyof typeof PRESET_BUNDLES) => {
    const bundle = PRESET_BUNDLES[bundleKey];
    setCurrentTemplate({
      name: bundle.name,
      description: bundle.description,
      category: bundle.category,
      is_active: true,
      sections: bundle.sections.map((s, idx) => ({
        ...s,
        order_index: idx,
        questions: s.questions.map((q, qIdx) => ({
          ...q,
          order_index: qIdx,
        })),
      })),
    });
    setShowCreateForm(true);
    setExpandedSections(new Set(bundle.sections.map((_, idx) => idx)));
  };

  const addSection = () => {
    const newSection: InspectionSection = {
      name: `Section ${currentTemplate.sections.length + 1}`,
      description: '',
      order_index: currentTemplate.sections.length,
      is_required: true,
      questions: [],
    };
    setCurrentTemplate({
      ...currentTemplate,
      sections: [...currentTemplate.sections, newSection],
    });
    setExpandedSections(new Set([...expandedSections, currentTemplate.sections.length]));
  };

  const updateSection = (index: number, updates: Partial<InspectionSection>) => {
    const updated = [...currentTemplate.sections];
    updated[index] = { ...updated[index], ...updates };
    setCurrentTemplate({ ...currentTemplate, sections: updated });
  };

  const deleteSection = async (index: number) => {
    const confirmed = await confirm({
      title: 'Delete Section',
      message: 'Are you sure you want to delete this section? All questions in this section will be removed.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'critical',
    });

    if (confirmed) {
      const updated = currentTemplate.sections.filter((_, i) => i !== index);
      // Reorder sections
      updated.forEach((s, i) => {
        s.order_index = i;
      });
      setCurrentTemplate({ ...currentTemplate, sections: updated });
    }
  };

  const addQuestion = (sectionIndex: number) => {
    const section = currentTemplate.sections[sectionIndex];
    const newQuestion: InspectionQuestion = {
      question_text: `Question ${section.questions.length + 1}`,
      question_type: 'text',
      is_required: false,
      is_critical: false,
      order_index: section.questions.length,
    };
    const updated = [...currentTemplate.sections];
    updated[sectionIndex] = {
      ...section,
      questions: [...section.questions, newQuestion],
    };
    setCurrentTemplate({ ...currentTemplate, sections: updated });
  };

  const updateQuestion = (sectionIndex: number, questionIndex: number, updates: Partial<InspectionQuestion>) => {
    const updated = [...currentTemplate.sections];
    const section = updated[sectionIndex];
    const question = section.questions[questionIndex];
    updated[sectionIndex] = {
      ...section,
      questions: section.questions.map((q, i) => (i === questionIndex ? { ...q, ...updates } : q)),
    };
    setCurrentTemplate({ ...currentTemplate, sections: updated });
  };

  const deleteQuestion = (sectionIndex: number, questionIndex: number) => {
    const updated = [...currentTemplate.sections];
    updated[sectionIndex] = {
      ...updated[sectionIndex],
      questions: updated[sectionIndex].questions.filter((_, i) => i !== questionIndex),
    };
    setCurrentTemplate({ ...currentTemplate, sections: updated });
  };

  const addQuestionOption = (sectionIndex: number, questionIndex: number) => {
    const section = currentTemplate.sections[sectionIndex];
    const question = section.questions[questionIndex];
    if (!question.options) {
      question.options = [];
    }
    const newOption = {
      option_text: `Option ${question.options.length + 1}`,
      option_value: `option_${question.options.length + 1}`,
      order_index: question.options.length,
      is_default: false,
    };
    updateQuestion(sectionIndex, questionIndex, {
      options: [...question.options, newOption],
    });
  };

  const updateQuestionOption = (
    sectionIndex: number,
    questionIndex: number,
    optionIndex: number,
    updates: Partial<InspectionQuestion['options']>[0]
  ) => {
    const question = currentTemplate.sections[sectionIndex].questions[questionIndex];
    if (!question.options) return;
    const updated = question.options.map((opt, i) => (i === optionIndex ? { ...opt, ...updates } : opt));
    updateQuestion(sectionIndex, questionIndex, { options: updated });
  };

  const deleteQuestionOption = (sectionIndex: number, questionIndex: number, optionIndex: number) => {
    const question = currentTemplate.sections[sectionIndex].questions[questionIndex];
    if (!question.options) return;
    const updated = question.options.filter((_, i) => i !== optionIndex);
    updateQuestion(sectionIndex, questionIndex, { options: updated });
  };

  const publishTemplate = async () => {
    if (!currentTemplate.name.trim()) {
      showToast({
        title: 'Validation Error',
        description: 'Template name is required',
        variant: 'error',
      });
      return;
    }

    if (currentTemplate.sections.length === 0) {
      showToast({
        title: 'Validation Error',
        description: 'Template must have at least one section',
        variant: 'error',
      });
      return;
    }

    for (const section of currentTemplate.sections) {
      if (section.questions.length === 0) {
        showToast({
          title: 'Validation Error',
          description: `Section "${section.name}" must have at least one question`,
          variant: 'error',
        });
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        name: currentTemplate.name,
        description: currentTemplate.description,
        category: currentTemplate.category,
        asset_class: currentTemplate.asset_class,
        sections: currentTemplate.sections.map((section) => ({
          name: section.name,
          description: section.description,
          order_index: section.order_index,
          is_required: section.is_required,
          questions: section.questions.map((question) => ({
            question_text: question.question_text,
            question_type: question.question_type,
            is_required: question.is_required,
            is_critical: question.is_critical,
            order_index: question.order_index,
            help_text: question.help_text,
            validation_rules: question.validation_rules,
            conditional_logic: question.conditional_logic,
            options: question.options,
          })),
        })),
      };

      if (editingTemplate?.id) {
        await apiClient.put(`/v1/inspection-templates/${editingTemplate.id}`, payload);
        showToast({
          title: 'Success',
          description: 'Template updated successfully',
          variant: 'success',
        });
      } else {
        await apiClient.post('/v1/inspection-templates', payload);
        showToast({
          title: 'Success',
          description: 'Template published successfully',
          variant: 'success',
        });
      }

      setShowCreateForm(false);
      setEditingTemplate(null);
      setCurrentTemplate({
        name: '',
        description: '',
        category: 'custom',
        is_active: true,
        sections: [],
      });
      fetchTemplates();
    } catch (error) {
      console.error('Failed to publish template:', error);
      showToast({
        title: 'Error',
        description: 'Failed to publish template. Please try again.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div style={{ padding: spacing.xl, maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: spacing.xl }}>
        <h1 style={{ ...typography.h1, marginBottom: spacing.sm }}>Inspection Studio</h1>
        <p style={{ ...typography.body, color: colors.neutral[600] }}>
          Author and manage inspection templates by asset class. Create preset bundles or build custom templates.
        </p>
      </div>

      {/* Preset Bundles */}
      <div style={{ marginBottom: spacing.xl }}>
        <h2 style={{ ...typography.h2, marginBottom: spacing.md }}>Preset Bundles</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: spacing.md }}>
          {Object.entries(PRESET_BUNDLES).map(([key, bundle]) => (
            <div
              key={key}
              style={{
                padding: spacing.lg,
                backgroundColor: 'white',
                borderRadius: borderRadius.lg,
                border: `1px solid ${colors.neutral[200]}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => loadPresetBundle(key as keyof typeof PRESET_BUNDLES)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.primary[500];
                e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary[100]}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.neutral[200];
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <h3 style={{ ...typography.subheader, marginBottom: spacing.xs }}>{bundle.name}</h3>
              <p style={{ ...typography.caption, color: colors.neutral[600] }}>{bundle.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Template List */}
      {!showCreateForm && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <h2 style={{ ...typography.h2 }}>Templates</h2>
            <Button
              onClick={() => {
                setShowCreateForm(true);
                setEditingTemplate(null);
                setCurrentTemplate({
                  name: '',
                  description: '',
                  category: 'custom',
                  is_active: true,
                  sections: [],
                });
              }}
            >
              <Plus size={16} style={{ marginRight: spacing.xs }} />
              Create Template
            </Button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: spacing.xl }}>Loading templates...</div>
          ) : templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.neutral[600] }}>
              No templates found. Create your first template to get started.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: spacing.md }}>
              {templates.map((template) => (
                <div
                  key={template.id}
                  style={{
                    padding: spacing.lg,
                    backgroundColor: 'white',
                    borderRadius: borderRadius.lg,
                    border: `1px solid ${colors.neutral[200]}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h3 style={{ ...typography.subheader, marginBottom: spacing.xs }}>{template.name}</h3>
                    <p style={{ ...typography.caption, color: colors.neutral[600] }}>{template.description}</p>
                    <div style={{ marginTop: spacing.xs, display: 'flex', gap: spacing.sm }}>
                      <span
                        style={{
                          padding: `${spacing.xs} ${spacing.sm}`,
                          backgroundColor: colors.neutral[100],
                          borderRadius: borderRadius.sm,
                          fontSize: '12px',
                          color: colors.neutral[700],
                        }}
                      >
                        {template.category}
                      </span>
                      <span
                        style={{
                          padding: `${spacing.xs} ${spacing.sm}`,
                          backgroundColor: template.is_active ? colors.success[100] : colors.neutral[100],
                          borderRadius: borderRadius.sm,
                          fontSize: '12px',
                          color: template.is_active ? colors.success[700] : colors.neutral[700],
                        }}
                      >
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: spacing.sm }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/app/inspections/${template.id}/capture`)}
                    >
                      Use Template
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTemplate(template);
                        setCurrentTemplate(template);
                        setShowCreateForm(true);
                      }}
                    >
                      <Edit2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Template Form */}
      {showCreateForm && (
        <div style={{ backgroundColor: 'white', borderRadius: borderRadius.lg, padding: spacing.xl, border: `1px solid ${colors.neutral[200]}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
            <h2 style={{ ...typography.h2 }}>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </h2>
            <Button variant="outline" onClick={() => {
              setShowCreateForm(false);
              setEditingTemplate(null);
            }}>
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
                value={currentTemplate.name}
                onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
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
                value={currentTemplate.description}
                onChange={(e) => setCurrentTemplate({ ...currentTemplate, description: e.target.value })}
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
                  value={currentTemplate.category}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, category: e.target.value as InspectionTemplate['category'] })}
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
                  value={currentTemplate.asset_class || ''}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, asset_class: e.target.value })}
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
              <Button variant="outline" size="sm" onClick={addSection}>
                <Plus size={16} style={{ marginRight: spacing.xs }} />
                Add Section
              </Button>
            </div>

            {currentTemplate.sections.length === 0 ? (
              <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.neutral[600] }}>
                No sections yet. Add your first section to start building the template.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: spacing.md }}>
                {currentTemplate.sections.map((section, sectionIndex) => (
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
                      onClick={() => toggleSection(sectionIndex)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                        <GripVertical size={16} style={{ color: colors.neutral[400] }} />
                        <div>
                          <div style={{ ...typography.subheader, fontSize: '14px' }}>{section.name}</div>
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
                            e.stopPropagation();
                            deleteSection(sectionIndex);
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
                              value={section.name}
                              onChange={(e) => updateSection(sectionIndex, { name: e.target.value })}
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
                              onChange={(e) => updateSection(sectionIndex, { description: e.target.value })}
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
                            <label style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, fontSize: '12px' }}>
                              <input
                                type="checkbox"
                                checked={section.is_required}
                                onChange={(e) => updateSection(sectionIndex, { is_required: e.target.checked })}
                              />
                              Required Section
                            </label>
                          </div>
                        </div>

                        {/* Questions */}
                        <div style={{ marginTop: spacing.md }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                            <h4 style={{ ...typography.label, fontSize: '13px' }}>Questions</h4>
                            <Button variant="outline" size="sm" onClick={() => addQuestion(sectionIndex)}>
                              <Plus size={14} style={{ marginRight: spacing.xs }} />
                              Add Question
                            </Button>
                          </div>

                          {section.questions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: spacing.md, color: colors.neutral[600], fontSize: '12px' }}>
                              No questions yet. Add your first question.
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gap: spacing.sm }}>
                              {section.questions.map((question, questionIndex) => (
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
                                      value={question.question_text}
                                      onChange={(e) => updateQuestion(sectionIndex, questionIndex, { question_text: e.target.value })}
                                      placeholder="Question text"
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
                                        onChange={(e) => updateQuestion(sectionIndex, questionIndex, { question_type: e.target.value as InspectionQuestion['question_type'] })}
                                        style={{
                                          padding: spacing.xs,
                                          border: `1px solid ${colors.neutral[300]}`,
                                          borderRadius: borderRadius.sm,
                                          fontSize: '12px',
                                        }}
                                      >
                                        {QUESTION_TYPES.map((type) => (
                                          <option key={type.value} value={type.value}>
                                            {type.label}
                                          </option>
                                        ))}
                                      </select>
                                      <div style={{ display: 'flex', gap: spacing.xs, alignItems: 'center' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, fontSize: '11px' }}>
                                          <input
                                            type="checkbox"
                                            checked={question.is_required}
                                            onChange={(e) => updateQuestion(sectionIndex, questionIndex, { is_required: e.target.checked })}
                                          />
                                          Required
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, fontSize: '11px' }}>
                                          <input
                                            type="checkbox"
                                            checked={question.is_critical}
                                            onChange={(e) => updateQuestion(sectionIndex, questionIndex, { is_critical: e.target.checked })}
                                          />
                                          Critical
                                        </label>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteQuestion(sectionIndex, questionIndex)}
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
                                          onClick={() => addQuestionOption(sectionIndex, questionIndex)}
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
                                            value={option.option_text}
                                            onChange={(e) =>
                                              updateQuestionOption(sectionIndex, questionIndex, optionIndex, {
                                                option_text: e.target.value,
                                              })
                                            }
                                            placeholder="Option text"
                                            style={{
                                              padding: spacing.xs,
                                              border: `1px solid ${colors.neutral[300]}`,
                                              borderRadius: borderRadius.sm,
                                              fontSize: '12px',
                                            }}
                                          />
                                          <input
                                            type="text"
                                            value={option.option_value}
                                            onChange={(e) =>
                                              updateQuestionOption(sectionIndex, questionIndex, optionIndex, {
                                                option_value: e.target.value,
                                              })
                                            }
                                            placeholder="Option value"
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
                                            onClick={() => deleteQuestionOption(sectionIndex, questionIndex, optionIndex)}
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
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing.md, paddingTop: spacing.lg, borderTop: `1px solid ${colors.neutral[200]}` }}>
            <Button variant="outline" onClick={() => {
              setShowCreateForm(false);
              setEditingTemplate(null);
            }}>
              Cancel
            </Button>
            <Button onClick={publishTemplate} disabled={loading}>
              <Save size={16} style={{ marginRight: spacing.xs }} />
              {editingTemplate ? 'Update Template' : 'Publish Template'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

