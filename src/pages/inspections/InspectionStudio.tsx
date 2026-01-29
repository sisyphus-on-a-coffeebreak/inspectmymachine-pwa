import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspectionTemplates } from '../../lib/queries';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../providers/ToastProvider';
import { useConfirm } from '../../components/ui/Modal';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/ui/PageHeader';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { Plus, Trash2, Edit2, Copy } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { fetchInspectionTemplate } from '../../lib/inspection-templates';
import { TemplateList } from '../../components/inspection/TemplateList';
import { TemplateEditor, type InspectionTemplate as TemplateEditorTemplate, type InspectionSection } from '../../components/inspection/TemplateEditor';
import { CardGrid } from '../../components/ui/ResponsiveGrid';
import { logger } from '../../lib/logger';

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
      logger.debug('Fetched template', template, 'InspectionStudio');
      logger.debug('Template sections', template.sections, 'InspectionStudio');

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

      logger.debug('Duplicated template', duplicatedTemplate, 'InspectionStudio');
      logger.debug('Duplicated sections', duplicatedTemplate.sections, 'InspectionStudio');

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
      logger.error('Failed to duplicate template', error, 'InspectionStudio');
      
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
      logger.error('Failed to delete template', error, 'InspectionStudio');
      
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
      logger.debug(`Section ${i + 1}`, {
        name: section.name,
        nameType: typeof section.name,
        nameLength: section.name?.length,
        hasQuestions: !!section.questions?.length,
        questionCount: section.questions?.length || 0
      }, 'InspectionStudio');
      
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
      logger.error('Failed to publish template', error, 'InspectionStudio');
      
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
        <CardGrid gap="md">
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
        </CardGrid>
      </div>

      {/* Template List */}
      {!showCreateForm && (
        <TemplateList
          templates={templates}
          loading={loading}
          publishing={publishing}
          onEdit={async (template) => {
            try {
              const result = await fetchInspectionTemplate(template.id!, { forceRefresh: true });
              const fullTemplate = result.template;
              
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
              setExpandedSections(new Set(mappedTemplate.sections.map((_, idx) => idx)));
            } catch (error) {
              logger.error('Failed to load template for editing', error, 'InspectionStudio');
              showToast({
                title: 'Error',
                description: 'Failed to load template for editing. Please try again.',
                variant: 'error',
              });
            }
          }}
          onDuplicate={duplicateTemplate}
          onDelete={deleteTemplate}
          onCreateNew={() => {
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
        />
      )}

      {/* Create/Edit Template Form */}
      {showCreateForm && (
        <TemplateEditor
          template={currentTemplate}
          editingTemplate={editingTemplate}
          expandedSections={expandedSections}
          questionTypes={QUESTION_TYPES}
          onTemplateChange={setCurrentTemplate}
          onToggleSection={toggleSection}
          onAddSection={addSection}
          onUpdateSection={updateSection}
          onDeleteSection={deleteSection}
          onAddQuestion={addQuestion}
          onUpdateQuestion={updateQuestion}
          onDeleteQuestion={deleteQuestion}
          onAddQuestionOption={addQuestionOption}
          onUpdateQuestionOption={updateQuestionOption}
          onDeleteQuestionOption={deleteQuestionOption}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingTemplate(null);
          }}
          onSave={publishTemplate}
          publishing={publishing}
          loading={loading}
        />
      )}
    </div>
    </>
  );
};

