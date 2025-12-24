/**
 * Template Selection Page
 * 
 * Standalone page for selecting inspection templates.
 * Always shown as the first step when starting a new inspection.
 * 
 * Features:
 * - Recent templates section (top 3)
 * - All templates list with search
 * - Offline template caching support
 * - Template version checking
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { NetworkError } from '../../components/ui/NetworkError';
import { useInspectionTemplates } from '../../lib/queries';
import { getCachedTemplateList } from '../../lib/inspection-templates';
import { getRecentTemplates, addRecentTemplate } from '../../lib/templateHistory';
import { Search, FileText, Clock, AlertCircle, X } from 'lucide-react';
import type { InspectionTemplate } from '@/types/inspection';
import type { RecentTemplate } from '../../lib/templateHistory';
import { TemplateCard } from '../../components/inspection/TemplateCard';
import { CardGrid } from '../../components/ui/ResponsiveGrid';

interface TemplateWithMetadata extends InspectionTemplate {
  questionCount: number;
  lastUsed?: Date;
  category?: string;
}

export const TemplateSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get('vehicleId') || undefined;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineTemplates, setOfflineTemplates] = useState<InspectionTemplate[]>([]);

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Network status detection
  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch templates
  const { data: templates, isLoading, isError, error, refetch } = useInspectionTemplates({
    enabled: !isOffline,
  });

  // Load offline templates
  React.useEffect(() => {
    const loadOfflineTemplates = async () => {
      if (isOffline) {
        const cachedList = await getCachedTemplateList();
        if (cachedList?.templates && cachedList.templates.length > 0) {
          // Convert metadata to template-like objects for display
          const templateObjects: InspectionTemplate[] = cachedList.templates.map((meta) => ({
            id: meta.id,
            name: meta.name,
            description: meta.description,
            sections: [], // Not available in metadata
          }));
          setOfflineTemplates(templateObjects);
        }
      }
    };
    loadOfflineTemplates();
  }, [isOffline]);

  // Get recent templates
  const recentTemplates = useMemo(() => {
    return getRecentTemplates(vehicleId).slice(0, 3); // Top 3
  }, [vehicleId]);

  // Available templates (online or offline)
  const availableTemplates = isOffline ? offlineTemplates : (templates || []);

  // Calculate question counts and enrich with metadata
  const templatesWithMetadata = useMemo(() => {
    return availableTemplates.map((template: any): TemplateWithMetadata => {
      const questionCount = template.sections?.reduce(
        (count: number, section: any) => count + (section.questions?.length || 0),
        0
      ) || 0;

      // Find last used date from recent templates
      const recent = recentTemplates.find((r) => r.templateId === template.id);
      const lastUsed = recent ? new Date(recent.usedAt) : undefined;

      return {
        ...template,
        questionCount,
        lastUsed,
        category: template.category || 'general',
      };
    });
  }, [availableTemplates, recentTemplates]);

  // Filter templates by search query
  const filteredTemplates = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return templatesWithMetadata;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return templatesWithMetadata.filter(
      (t) =>
        t.name?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.category?.toLowerCase().includes(query)
    );
  }, [templatesWithMetadata, debouncedSearchQuery]);

  // Sort templates: recent first, then alphabetical
  const sortedTemplates = useMemo(() => {
    return [...filteredTemplates].sort((a, b) => {
      // Recent templates first
      const aRecent = recentTemplates.findIndex((r) => r.templateId === a.id);
      const bRecent = recentTemplates.findIndex((r) => r.templateId === b.id);

      if (aRecent !== -1 && bRecent === -1) return -1;
      if (aRecent === -1 && bRecent !== -1) return 1;
      if (aRecent !== -1 && bRecent !== -1) return aRecent - bRecent;

      // Then alphabetical
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [filteredTemplates, recentTemplates]);

  // Recent templates for display (only show if they exist in available templates)
  const recentTemplatesForDisplay = useMemo(() => {
    return recentTemplates
      .map((recent) => {
        const template = templatesWithMetadata.find((t) => t.id === recent.templateId);
        return template ? { ...recent, template } : null;
      })
      .filter((item): item is RecentTemplate & { template: TemplateWithMetadata } => item !== null);
  }, [recentTemplates, templatesWithMetadata]);

  const handleSelectTemplate = useCallback(
    async (templateId: string) => {
      const template = templatesWithMetadata.find((t) => t.id === templateId);
      if (template) {
        addRecentTemplate(templateId, template.name || 'Unnamed Template', vehicleId);
      }

      // Check for existing drafts before navigating
      try {
        const { fetchAllDrafts } = await import('../../lib/inspectionDrafts');
        const drafts = await fetchAllDrafts({ templateId, vehicleId });
        
        if (drafts.length > 0) {
          // Show draft selection modal
          const { DraftSelectionModal } = await import('../../components/inspection/DraftSelectionModal');
          // We'll handle this via state and render the modal
          // For now, navigate to capture which will handle draft selection
          // TODO: Show modal here
        }
      } catch (error) {
        console.warn('Failed to check for drafts:', error);
        // Continue with navigation even if draft check fails
      }

      // Navigate to capture form (it will handle draft selection)
      if (vehicleId) {
        navigate(`/app/inspections/${templateId}/${vehicleId}/capture`);
      } else {
        navigate(`/app/inspections/${templateId}/capture`);
      }
    },
    [navigate, vehicleId, templatesWithMetadata]
  );

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  if (isLoading && !isOffline) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader
          title="Start Inspection"
          subtitle="Select a template to begin"
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
          title="Start Inspection"
          subtitle="Select a template to begin"
          icon={<FileText size={24} />}
        />
        <NetworkError error={error as Error} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div style={{ padding: spacing.xl, maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title="Start Inspection"
        subtitle="Select a template to begin your inspection"
        icon={<FileText size={24} />}
        actions={
          <Button variant="ghost" onClick={() => navigate('/app/inspections')}>
            <X size={20} />
          </Button>
        }
      />

      {isOffline && (
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

      {/* Recent Templates Section */}
      {recentTemplatesForDisplay.length > 0 && !debouncedSearchQuery && (
        <div style={{ marginBottom: spacing.xl }}>
          <h3
            style={{
              ...typography.subheader,
              fontSize: '18px',
              marginBottom: spacing.md,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <Clock size={20} color={colors.primary} />
            Recent Templates
          </h3>
          <CardGrid gap="md">
            {recentTemplatesForDisplay.map(({ template, usedAt }) => (
              <TemplateCard
                key={template.id}
                template={template}
                variant="compact"
                lastUsed={new Date(usedAt)}
                onClick={() => handleSelectTemplate(template.id)}
              />
            ))}
          </CardGrid>
        </div>
      )}

      {/* Search Bar */}
      <div
        style={{
          ...cardStyles.card,
          marginBottom: spacing.lg,
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
            placeholder="Search templates..."
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
      </div>

      {/* All Templates Section */}
      <div style={{ marginBottom: spacing.md }}>
        <h3
          style={{
            ...typography.subheader,
            fontSize: '18px',
            marginBottom: spacing.md,
          }}
        >
          All Templates
        </h3>

        {sortedTemplates.length === 0 ? (
          <EmptyState
            icon={<FileText size={48} />}
            title="No templates found"
            description={
              debouncedSearchQuery
                ? `No templates match "${debouncedSearchQuery}". Try a different search term.`
                : 'No inspection templates available. Contact an administrator to create templates.'
            }
          />
        ) : (
          <CardGrid gap="lg">
            {sortedTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                variant="full"
                lastUsed={template.lastUsed}
                onClick={() => handleSelectTemplate(template.id)}
              />
            ))}
          </CardGrid>
        )}
      </div>
    </div>
  );
};

export default TemplateSelectionPage;




