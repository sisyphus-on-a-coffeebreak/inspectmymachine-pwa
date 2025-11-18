import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspectionTemplates } from '../../lib/queries';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../providers/ToastProvider';
import { useConfirm } from '../../components/ui/Modal';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/ui/PageHeader';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { Plus, Trash2, Edit2, Eye, Copy, Save, X, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { fetchInspectionTemplate } from '../../lib/inspection-templates';

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
  const { confirm, ConfirmComponent } = useConfirm();
  const queryClient = useQueryClient();
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
  const [publishing, setPublishing] = useState(false);

  // Use React Query for templates
  const { data: templates = [], isLoading: loading, error: queryError, refetch } = useInspectionTemplates();
  
  // Handle errors with useEffect to avoid calling showToast during render
  React.useEffect(() => {
    if (queryError) {
      showToast({
        title: 'Error',
        description: 'Failed to load inspection templates',
        variant: 'error',
      });
    }
  }, [queryError, showToast]);

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
      name: '',
      description: '',
      order_index: currentTemplate.sections.length,
      is_required: false,
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
      question_text: '',
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
      option_text: '',
      option_value: '',
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

  const duplicateTemplate = async (templateId: string) => {
    try {
      setPublishing(true);
      
      // Fetch the full template with all sections and questions
      const result = await fetchInspectionTemplate(templateId, { forceRefresh: true });
      const template = result.template;

      // Debug: Log the template structure
      console.log('Fetched template:', template);
      console.log('Template sections:', template.sections);

      // Ensure we have sections - if not, try to get them from the API response structure
      let sections = template.sections || [];
      
      // If sections is empty or undefined, check if data is nested differently
      if (!sections || sections.length === 0) {
        // Try alternative paths
        const data = (template as any).data || template;
        sections = data.sections || [];
      }

      // Create a deep copy of the template with "Copy of" prefix
      // Map sections to match our InspectionSection interface
      const duplicatedTemplate: InspectionTemplate = {
        name: `Copy of ${template.name}`,
        description: template.description || '',
        category: (template.category as InspectionTemplate['category']) || 'custom',
        asset_class: template.asset_class,
        is_active: true,
        sections: sections.map((section: any, sectionIdx: number) => {
          // Map section to our interface structure
          const mappedSection: InspectionSection = {
            name: section.name || '',
            description: section.description || '',
            order_index: section.order_index ?? sectionIdx,
            is_required: section.is_required ?? false,
            questions: (section.questions || []).map((question: any, questionIdx: number) => {
              // Map question to our interface structure
              const mappedQuestion: InspectionQuestion = {
                question_text: question.question_text || '',
                question_type: (question.question_type as InspectionQuestion['question_type']) || 'text',
                is_required: question.is_required ?? false,
                is_critical: question.is_critical ?? false,
                order_index: question.order_index ?? questionIdx,
                help_text: question.help_text,
                validation_rules: question.validation_rules,
                conditional_logic: question.conditional_logic,
                options: (question.options || []).map((option: any, optionIdx: number) => ({
                  option_text: option.option_text || option.text || '',
                  option_value: option.option_value || option.value || '',
                  order_index: option.order_index ?? optionIdx,
                  is_default: option.is_default ?? false,
                })),
              };
              return mappedQuestion;
            }),
          };
          return mappedSection;
        }),
      };

      console.log('Duplicated template:', duplicatedTemplate);
      console.log('Duplicated sections:', duplicatedTemplate.sections);

      // Set the duplicated template as the current template and open the form
      setCurrentTemplate(duplicatedTemplate);
      setEditingTemplate(null); // This is a new template, not editing
      setShowCreateForm(true);
      
      // Expand all sections for better UX
      setExpandedSections(new Set(duplicatedTemplate.sections.map((_, idx) => idx)));

      showToast({
        title: 'Template Duplicated',
        description: 'Template copied successfully. You can now edit and save it.',
        variant: 'success',
      });

      // Scroll to the form
      setTimeout(() => {
        const formElement = document.querySelector('[data-template-form]');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (error: any) {
      console.error('Failed to duplicate template:', error);
      
      let errorMessage = 'Failed to duplicate template. Please try again.';
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setPublishing(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    const confirmed = await confirm({
      title: 'Delete Template',
      message: 'Are you sure you want to delete this template? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'critical',
    });

    if (!confirmed) return;

    try {
      setPublishing(true);
      await apiClient.delete(`/v1/inspection-templates/${templateId}`);
      
      showToast({
        title: 'Success',
        description: 'Template deleted successfully',
        variant: 'success',
      });

      // Invalidate and refetch templates
      queryClient.invalidateQueries({ queryKey: ['inspection-templates'] });
      refetch();
    } catch (error: any) {
      console.error('Failed to delete template:', error);
      
      let errorMessage = 'Failed to delete template. Please try again.';
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setPublishing(false);
    }
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

    for (let i = 0; i < currentTemplate.sections.length; i++) {
      const section = currentTemplate.sections[i];
      
      // Debug: Log section data
      console.log(`Section ${i + 1}:`, {
        name: section.name,
        nameType: typeof section.name,
        nameLength: section.name?.length,
        hasQuestions: !!section.questions?.length,
        questionCount: section.questions?.length || 0
      });
      
      // Check if section has a name - be more lenient with whitespace-only names
      const sectionName = (section.name || '').toString().trim();
      if (sectionName === '') {
        showToast({
          title: 'Validation Error',
          description: `Section ${i + 1} is missing a name. Please enter a section name.`,
          variant: 'error',
        });
        return;
      }
      
      // Check if section has questions
      if (!section.questions || section.questions.length === 0) {
        showToast({
          title: 'Validation Error',
          description: `Section "${sectionName}" must have at least one question`,
          variant: 'error',
        });
        return;
      }
      
      // Validate each question has required fields
      for (let j = 0; j < section.questions.length; j++) {
        const question = section.questions[j];
        const questionText = question.question_text?.trim() || '';
        if (questionText === '') {
          showToast({
            title: 'Validation Error',
            description: `Section "${sectionName}" has a question without text. Please fill in all question fields.`,
            variant: 'error',
          });
          return;
        }
      }
    }

    try {
      setPublishing(true);
      const payload = {
        name: currentTemplate.name,
        description: currentTemplate.description,
        category: currentTemplate.category,
        asset_class: currentTemplate.asset_class,
        sections: currentTemplate.sections.map((section, sectionIdx) => ({
          name: (section.name || '').trim(),
          description: (section.description || '').trim() || null,
          order_index: section.order_index ?? sectionIdx,
          is_required: section.is_required ?? false,
          questions: section.questions.map((question, questionIdx) => ({
            question_text: question.question_text || '',
            question_type: question.question_type || 'text',
            is_required: question.is_required ?? false,
            is_critical: question.is_critical ?? false,
            order_index: question.order_index ?? questionIdx,
            help_text: question.help_text || undefined,
            validation_rules: question.validation_rules || undefined,
            conditional_logic: question.conditional_logic || undefined,
            options: (question.options || []).map((option, optionIdx) => ({
              option_text: option.option_text || '',
              option_value: option.option_value || '',
              order_index: option.order_index ?? optionIdx,
              is_default: option.is_default ?? false,
            })),
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
      // Invalidate and refetch templates
      queryClient.invalidateQueries({ queryKey: ['inspection-templates'] });
      refetch();
    } catch (error: any) {
      console.error('Failed to publish template:', error);
      
      // Extract error message from API response
      let errorMessage = 'Failed to publish template. Please try again.';
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.errors) {
          // Laravel validation errors
          const errors = errorData.errors;
          const errorMessages = Object.entries(errors)
            .flatMap(([field, messages]: [string, any]) => 
              Array.isArray(messages) 
                ? messages.map((msg: string) => `${field}: ${msg}`)
                : [`${field}: ${messages}`]
            );
          errorMessage = errorMessages.length > 0 
            ? errorMessages[0] 
            : 'Validation failed. Please check your template data.';
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setPublishing(false);
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
    <>
      {ConfirmComponent}
      <div style={{ padding: spacing.xl, maxWidth: '1400px', margin: '0 auto' }}>
      <PageHeader
        title="Inspection Studio"
        subtitle="Author and manage inspection templates by asset class. Create preset bundles or build custom templates."
        icon="🎨"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Inspections', path: '/app/inspections' },
          { label: 'Studio' }
        ]}
      />

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
                      onClick={() => duplicateTemplate(template.id!)}
                      disabled={publishing}
                      title="Duplicate Template"
                      style={{
                        color: colors.primary,
                        borderColor: colors.primary,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.primary + '10';
                        e.currentTarget.style.borderColor = colors.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = colors.primary;
                      }}
                    >
                      <Copy size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          // Fetch the full template with all sections and questions
                          const result = await fetchInspectionTemplate(template.id!, { forceRefresh: true });
                          const fullTemplate = result.template;
                          
                          // Map the template to our interface structure
                          let sections = fullTemplate.sections || [];
                          if (!sections || sections.length === 0) {
                            const data = (fullTemplate as any).data || fullTemplate;
                            sections = data.sections || [];
                          }

                          const mappedTemplate: InspectionTemplate = {
                            id: fullTemplate.id,
                            name: fullTemplate.name || '',
                            description: fullTemplate.description || '',
                            category: (fullTemplate.category as InspectionTemplate['category']) || 'custom',
                            asset_class: fullTemplate.asset_class,
                            is_active: fullTemplate.is_active ?? true,
                            sections: sections.map((section: any, sectionIdx: number) => ({
                              name: section.name || '',
                              description: section.description || '',
                              order_index: section.order_index ?? sectionIdx,
                              is_required: section.is_required ?? false,
                              questions: (section.questions || []).map((question: any, questionIdx: number) => ({
                                question_text: question.question_text || '',
                                question_type: (question.question_type as InspectionQuestion['question_type']) || 'text',
                                is_required: question.is_required ?? false,
                                is_critical: question.is_critical ?? false,
                                order_index: question.order_index ?? questionIdx,
                                help_text: question.help_text,
                                validation_rules: question.validation_rules,
                                conditional_logic: question.conditional_logic,
                                options: (question.options || []).map((option: any, optionIdx: number) => ({
                                  option_text: option.option_text || option.text || '',
                                  option_value: option.option_value || option.value || '',
                                  order_index: option.order_index ?? optionIdx,
                                  is_default: option.is_default ?? false,
                                })),
                              })),
                            })),
                          };

                          setEditingTemplate(mappedTemplate);
                          setCurrentTemplate(mappedTemplate);
                          setShowCreateForm(true);
                          // Expand all sections when editing
                          setExpandedSections(new Set(mappedTemplate.sections.map((_, idx) => idx)));
                        } catch (error) {
                          console.error('Failed to load template for editing:', error);
                          showToast({
                            title: 'Error',
                            description: 'Failed to load template for editing. Please try again.',
                            variant: 'error',
                          });
                        }
                      }}
                      title="Edit Template"
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTemplate(template.id!)}
                      disabled={publishing}
                      title="Delete Template"
                      style={{
                        color: colors.error[600],
                        borderColor: colors.error[300],
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.error[50];
                        e.currentTarget.style.borderColor = colors.error[400];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = colors.error[300];
                      }}
                    >
                      <Trash2 size={16} />
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
        <div data-template-form style={{ backgroundColor: 'white', borderRadius: borderRadius.lg, padding: spacing.xl, border: `1px solid ${colors.neutral[200]}` }}>
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
                            if (e) {
                              e.stopPropagation();
                            }
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
                              value={section.name || ''}
                              onChange={(e) => updateSection(sectionIndex, { name: e.target.value })}
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
                              onChange={(e) => updateSection(sectionIndex, { description: e.target.value })}
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
                                onChange={(e) => updateSection(sectionIndex, { is_required: e.target.checked })}
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
                                      value={question.question_text || ''}
                                      onChange={(e) => updateQuestion(sectionIndex, questionIndex, { question_text: e.target.value })}
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
                                      <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, fontSize: '11px', cursor: 'pointer', userSelect: 'none' }}>
                                          <input
                                            type="checkbox"
                                            checked={question.is_required}
                                            onChange={(e) => updateQuestion(sectionIndex, questionIndex, { is_required: e.target.checked })}
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
                                            onChange={(e) => updateQuestion(sectionIndex, questionIndex, { is_critical: e.target.checked })}
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
                                            value={option.option_text || ''}
                                            onChange={(e) =>
                                              updateQuestionOption(sectionIndex, questionIndex, optionIndex, {
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
                                              updateQuestionOption(sectionIndex, questionIndex, optionIndex, {
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
            <Button onClick={publishTemplate} disabled={publishing || loading}>
              <Save size={16} style={{ marginRight: spacing.xs }} />
              {editingTemplate ? 'Update Template' : 'Publish Template'}
            </Button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

