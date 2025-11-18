/**
 * Template Picker Component
 * 
 * Allows users to browse, search, and select inspection templates before starting an inspection.
 * Supports offline caching and shows template metadata (question count, last updated, etc.)
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { Button } from '../ui/button';
import { PageHeader } from '../ui/PageHeader';
import { EmptyState } from '../ui/EmptyState';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { NetworkError } from '../ui/NetworkError';
import { useInspectionTemplates } from '../../lib/queries';
import { getCachedTemplate, getCachedTemplateList, cacheTemplateList } from '../../lib/inspection-templates';
import { Search, FileText, Clock, CheckCircle2, AlertCircle, Download, Filter } from 'lucide-react';
import type { InspectionTemplate } from '@/types/inspection';

interface TemplatePickerProps {
  vehicleId?: string;
  onSelectTemplate: (templateId: string) => void;
  onCancel?: () => void;
  showOfflineIndicator?: boolean;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({
  vehicleId,
  onSelectTemplate,
  onCancel,
  showOfflineIndicator = true,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [offlineTemplates, setOfflineTemplates] = useState<InspectionTemplate[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const { data: templates, isLoading, isError, error, refetch } = useInspectionTemplates({
    enabled: navigator.onLine,
  });

  // Cache template list when templates are loaded
  React.useEffect(() => {
    const cacheTemplates = async () => {
      if (templates && Array.isArray(templates) && templates.length > 0) {
        const metadata = templates.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          question_count: t.sections?.reduce((count: number, s: any) => count + (s.questions?.length || 0), 0) || 0,
          updated_at: t.updated_at,
        }));
        await cacheTemplateList(metadata);
      }
    };
    cacheTemplates();
  }, [templates]);

  // Load offline templates
  React.useEffect(() => {
    const loadOfflineTemplates = async () => {
      if (!navigator.onLine) {
        // Try to load from cache
        const { getCachedTemplateList, getCachedTemplateIds } = await import('../../lib/inspection-templates');
        const cachedList = await getCachedTemplateList();
        
        if (cachedList && cachedList.templates.length > 0) {
          // Try to load full templates from cache
          const templateIds = cachedList.templates.map(t => t.id);
          const cachedTemplates: InspectionTemplate[] = [];
          
          for (const templateId of templateIds) {
            const cached = await getCachedTemplate(templateId);
            if (cached) {
              cachedTemplates.push(cached.template);
            }
          }
          
          setOfflineTemplates(cachedTemplates);
        }
      }
    };
    loadOfflineTemplates();
  }, []);

  const availableTemplates = isOffline ? offlineTemplates : (templates || []);

  // Calculate question counts and categories
  const templatesWithMetadata = useMemo(() => {
    return availableTemplates.map((template: any) => {
      const questionCount = template.sections?.reduce(
        (count: number, section: any) => count + (section.questions?.length || 0),
        0
      ) || 0;

      return {
        ...template,
        questionCount,
        category: template.category || 'general',
        lastUsed: null, // TODO: Track last used per vehicle/segment
      };
    });
  }, [availableTemplates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let filtered = templatesWithMetadata;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name?.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.category?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Sort by relevance (suggested templates first, then by name)
    return filtered.sort((a, b) => {
      // TODO: Implement suggested templates based on vehicle/segment
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [templatesWithMetadata, searchQuery, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(templatesWithMetadata.map((t) => t.category || 'general'));
    return Array.from(cats).sort();
  }, [templatesWithMetadata]);

  const handleSelectTemplate = (templateId: string) => {
    onSelectTemplate(templateId);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Unknown';
    }
  };

  if (isLoading && !isOffline) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader
          title="Select Inspection Template"
          subtitle="Choose a template to start your inspection"
          icon={<FileText size={24} />}
        />
        <SkeletonLoader count={5} />
      </div>
    );
  }

  if (isError && !isOffline) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader
          title="Select Inspection Template"
          subtitle="Choose a template to start your inspection"
          icon={<FileText size={24} />}
        />
        <NetworkError error={error as Error} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div style={{ padding: spacing.xl, maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title="Select Inspection Template"
        subtitle="Choose a template to start your inspection"
        icon={<FileText size={24} />}
      />

      {isOffline && showOfflineIndicator && (
        <div
          style={{
            ...cardStyles.card,
            marginBottom: spacing.lg,
            backgroundColor: colors.warning[50],
            border: `1px solid ${colors.warning[300]}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <AlertCircle size={20} color={colors.warning[600]} />
          <span style={{ ...typography.bodySmall, color: colors.warning[700] }}>
            Offline mode: Showing cached templates only
          </span>
        </div>
      )}

      {/* Search and Filters */}
      <div
        style={{
          ...cardStyles.card,
          marginBottom: spacing.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search
            size={20}
            style={{
              position: 'absolute',
              left: spacing.md,
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.neutral[400],
            }}
          />
          <input
            type="text"
            placeholder="Search templates by name, description, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: `${spacing.md} ${spacing.md} ${spacing.md} ${spacing.xxl}`,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              ...typography.body,
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap', alignItems: 'center' }}>
            <Filter size={16} color={colors.neutral[600]} />
            <Button
              variant={selectedCategory === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="No templates found"
          description={
            searchQuery
              ? `No templates match "${searchQuery}". Try a different search term.`
              : 'No inspection templates available. Contact an administrator to create templates.'
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: spacing.lg,
          }}
        >
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              style={{
                ...cardStyles.card,
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: `2px solid ${colors.neutral[200]}`,
              }}
              onClick={() => handleSelectTemplate(template.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.neutral[200];
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: spacing.sm }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ ...typography.header, fontSize: '18px', marginBottom: spacing.xs }}>
                    {template.name || 'Unnamed Template'}
                  </h3>
                  {template.category && (
                    <span
                      style={{
                        ...typography.caption,
                        color: colors.primary,
                        backgroundColor: colors.primary + '15',
                        padding: `${spacing.xs} ${spacing.sm}`,
                        borderRadius: borderRadius.sm,
                        display: 'inline-block',
                        marginBottom: spacing.xs,
                      }}
                    >
                      {template.category}
                    </span>
                  )}
                </div>
                <FileText size={24} color={colors.primary} />
              </div>

              {template.description && (
                <p style={{ ...typography.bodySmall, color: colors.neutral[600], marginBottom: spacing.md }}>
                  {template.description}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs, marginBottom: spacing.md }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                  <CheckCircle2 size={16} color={colors.neutral[500]} />
                  <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                    {template.questionCount} questions
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                  <Clock size={16} color={colors.neutral[500]} />
                  <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                    Updated {formatDate(template.updated_at)}
                  </span>
                </div>
              </div>

              <Button variant="primary" style={{ width: '100%' }}>
                Use This Template
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {onCancel && (
        <div style={{ marginTop: spacing.xl, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

