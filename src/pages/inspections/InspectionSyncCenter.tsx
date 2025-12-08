import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { useToast } from '../../providers/ToastProvider';
import { useConfirm } from '../../components/ui/Modal';
import { Button } from '../../components/ui/button';
import { StatusCard } from '../../components/ui/StatusCard';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Merge, 
  Trash2, 
  Eye,
  Download,
  Upload,
  Clock,
  FileText
} from 'lucide-react';
import { get, set, del, keys } from 'idb-keyval';
import { loadInspectionDraft, clearInspectionDraft } from '../../lib/inspection-queue';
import type { InspectionDraftRecord } from '../../lib/inspection-queue';
import { fetchInspectionTemplate } from '../../lib/inspection-templates';

/**
 * Inspection Sync Center
 * 
 * Lists queued drafts, highlights template-version conflicts, and enables
 * inspectors to merge/discard answers when new forms deploy mid-inspection.
 */

interface TemplateVersionInfo {
  id: string;
  version: number;
  name: string;
  updated_at: string;
}

interface DraftConflict {
  draft: InspectionDraftRecord;
  currentTemplate: TemplateVersionInfo | null;
  hasConflict: boolean;
  conflictDetails?: {
    templateVersion: number;
    draftTemplateVersion?: number;
    newSections: string[];
    removedSections: string[];
    modifiedQuestions: string[];
  };
}

interface QueuedDraft {
  key: string;
  draft: InspectionDraftRecord;
  templateInfo?: TemplateVersionInfo;
  conflict?: DraftConflict;
  lastSynced?: number;
}

export const InspectionSyncCenter: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [drafts, setDrafts] = useState<QueuedDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<QueuedDraft | null>(null);
  const [showConflictResolver, setShowConflictResolver] = useState(false);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const allKeys = await keys();
      const draftKeys = allKeys
        .filter((key): key is string => typeof key === 'string' && key.startsWith('inspection-draft:'))
        .sort();
      
      const draftList: QueuedDraft[] = [];
      
      for (const key of draftKeys) {
        try {
          const draft = await get<InspectionDraftRecord>(key);
          if (!draft) continue;
          
          // Skip and clean up mock templates
          if (draft.templateId && draft.templateId.toLowerCase().includes('mock')) {
            await del(key);
            continue;
          }
          
          if (draft && draft.templateId) {
            // Fetch current template version
            let templateInfo: TemplateVersionInfo | null = null;
            let conflict: DraftConflict | null = null;
            
            try {
              const templateResult = await fetchInspectionTemplate(draft.templateId, { forceRefresh: true });
              if (templateResult.template) {
                templateInfo = {
                  id: templateResult.template.id,
                  version: templateResult.template.version || 1,
                  name: templateResult.template.name,
                  updated_at: templateResult.template.updated_at || new Date().toISOString(),
                };
                
                // Check for version conflict
                const draftTemplateVersion = draft.metadata?.templateVersion || 1;
                if (templateInfo.version > draftTemplateVersion) {
                  conflict = await detectConflict(draft, templateResult.template);
                }
              }
            } catch (error) {
              // Failed to fetch template for draft
            }
            
            draftList.push({
              key,
              draft,
              templateInfo,
              conflict: conflict || undefined,
            });
          }
        } catch (error) {
          // Error loading draft
        }
      }
      
      // Sort by updatedAt (most recent first)
      draftList.sort((a, b) => (b.draft.updatedAt || 0) - (a.draft.updatedAt || 0));
      
      setDrafts(draftList);
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to load inspection drafts',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const detectConflict = async (
    draft: InspectionDraftRecord,
    currentTemplate: any
  ): Promise<DraftConflict> => {
    const draftTemplateVersion = draft.metadata?.templateVersion || 1;
    const currentVersion = currentTemplate.version || 1;
    
    if (currentVersion <= draftTemplateVersion) {
      return {
        draft,
        currentTemplate: {
          id: currentTemplate.id,
          version: currentVersion,
          name: currentTemplate.name,
          updated_at: currentTemplate.updated_at || new Date().toISOString(),
        },
        hasConflict: false,
      };
    }
    
    // Analyze differences
    const draftSections = Object.keys(draft.answers || {});
    const currentSections = (currentTemplate.sections || []).map((s: any) => s.id);
    const newSections = currentSections.filter((id: string) => !draftSections.includes(id));
    const removedSections = draftSections.filter((id: string) => !currentSections.includes(id));
    
    // Check for modified questions (simplified - would need more detailed comparison)
    const modifiedQuestions: string[] = [];
    
    return {
      draft,
      currentTemplate: {
        id: currentTemplate.id,
        version: currentVersion,
        name: currentTemplate.name,
        updated_at: currentTemplate.updated_at || new Date().toISOString(),
      },
      hasConflict: true,
      conflictDetails: {
        templateVersion: currentVersion,
        draftTemplateVersion,
        newSections,
        removedSections,
        modifiedQuestions,
      },
    };
  };

  const handleResolveConflict = async (draft: QueuedDraft, action: 'merge' | 'discard' | 'keep') => {
    if (!draft.conflict) return;
    
    try {
      setSyncing(draft.key);
      
      if (action === 'discard') {
        // Discard draft and clear
        await clearInspectionDraft(draft.draft.templateId, draft.draft.vehicleId);
        showToast({
          title: 'Draft Discarded',
          description: 'Draft has been discarded. You can start a new inspection with the updated template.',
          variant: 'success',
        });
        await loadDrafts();
      } else if (action === 'keep') {
        // Keep existing draft (mark as resolved)
        const updatedDraft: InspectionDraftRecord = {
          ...draft.draft,
          metadata: {
            ...draft.draft.metadata,
            templateVersion: draft.conflict.currentTemplate?.version || 1,
            conflictResolved: true,
          },
        };
        await set(draft.key, updatedDraft);
        showToast({
          title: 'Draft Updated',
          description: 'Draft has been marked as resolved. Continue with caution.',
          variant: 'warning',
        });
        await loadDrafts();
      } else if (action === 'merge') {
        // Navigate to inspection capture with merge mode
        const url = draft.draft.vehicleId
          ? `/app/inspections/${draft.draft.templateId}/${draft.draft.vehicleId}/capture?merge=true`
          : `/app/inspections/new?templateId=${draft.draft.templateId}&merge=true`;
        navigate(url);
      }
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to resolve conflict. Please try again.',
        variant: 'error',
      });
    } finally {
      setSyncing(null);
      setShowConflictResolver(false);
    }
  };

  const handleDeleteDraft = async (draft: QueuedDraft) => {
    const confirmed = await confirm({
      title: 'Delete Draft',
      message: 'Are you sure you want to delete this draft? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'critical',
    });
    
    if (confirmed) {
      try {
        await clearInspectionDraft(draft.draft.templateId, draft.draft.vehicleId);
        showToast({
          title: 'Draft Deleted',
          description: 'Draft has been deleted successfully.',
          variant: 'success',
        });
        await loadDrafts();
      } catch (error) {
        showToast({
          title: 'Error',
          description: 'Failed to delete draft. Please try again.',
          variant: 'error',
        });
      }
    }
  };

  const handleContinueDraft = (draft: QueuedDraft) => {
    const url = draft.draft.vehicleId
      ? `/app/inspections/${draft.draft.templateId}/${draft.draft.vehicleId}/capture`
      : `/app/inspections/new?templateId=${draft.draft.templateId}`;
    navigate(url);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getConflictSeverity = (conflict: DraftConflict): 'warning' | 'error' => {
    if (!conflict.hasConflict) return 'warning';
    const details = conflict.conflictDetails;
    if (!details) return 'warning';
    
    // High severity if sections were removed or many questions modified
    if (details.removedSections.length > 0 || details.modifiedQuestions.length > 5) {
      return 'error';
    }
    return 'warning';
  };

  return (
    <div style={{ padding: spacing.xl, maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: spacing.xl }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
          <h1 style={{ ...typography.h1 }}>Inspection Sync Center</h1>
          <Button variant="outline" onClick={loadDrafts} disabled={loading}>
            <RefreshCw size={16} style={{ marginRight: spacing.xs }} />
            Refresh
          </Button>
        </div>
        <p style={{ ...typography.body, color: colors.neutral[600] }}>
          Manage inspection drafts and resolve template version conflicts. When templates are updated,
          drafts may need to be merged or discarded.
        </p>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md, marginBottom: spacing.xl }}>
        <StatusCard
          title="Total Drafts"
          message={`${drafts.length} draft${drafts.length !== 1 ? 's' : ''} found`}
          variant="info"
        />
        <StatusCard
          title="Conflicts"
          message={`${drafts.filter(d => d.conflict?.hasConflict).length} template version conflict${drafts.filter(d => d.conflict?.hasConflict).length !== 1 ? 's' : ''}`}
          variant={drafts.filter(d => d.conflict?.hasConflict).length > 0 ? 'warning' : 'success'}
        />
        <StatusCard
          title="Ready to Submit"
          message={`${drafts.filter(d => !d.conflict?.hasConflict).length} draft${drafts.filter(d => !d.conflict?.hasConflict).length !== 1 ? 's' : ''} ready`}
          variant="success"
        />
      </div>

      {/* Drafts List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: spacing.xl }}>Loading drafts...</div>
      ) : drafts.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: spacing.xl,
          backgroundColor: 'white',
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.neutral[200]}`,
        }}>
          <FileText size={48} style={{ color: colors.neutral[400], marginBottom: spacing.md }} />
          <h3 style={{ ...typography.subheader, marginBottom: spacing.xs }}>No Drafts Found</h3>
          <p style={{ ...typography.body, color: colors.neutral[600] }}>
            You don't have any saved inspection drafts. Start a new inspection to create a draft.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: spacing.md }}>
          {drafts.map((draft) => (
            <div
              key={draft.key}
              style={{
                padding: spacing.lg,
                backgroundColor: 'white',
                borderRadius: borderRadius.lg,
                border: `1px solid ${draft.conflict?.hasConflict ? colors.warning : colors.neutral[200]}`,
                boxShadow: draft.conflict?.hasConflict ? `0 4px 12px ${colors.warning}20` : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                    <h3 style={{ ...typography.subheader }}>
                      {draft.templateInfo?.name || 'Unknown Template'}
                    </h3>
                    {draft.conflict?.hasConflict && (
                      <span style={{
                        padding: `${spacing.xs} ${spacing.sm}`,
                        backgroundColor: colors.warning,
                        color: 'white',
                        borderRadius: borderRadius.sm,
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.xs,
                      }}>
                        <AlertTriangle size={12} />
                        Version Conflict
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.sm }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, fontSize: '13px', color: colors.neutral[600] }}>
                      <Clock size={14} />
                      Last updated: {formatDate(draft.draft.updatedAt)}
                    </div>
                    {draft.templateInfo && (
                      <div style={{ fontSize: '13px', color: colors.neutral[600] }}>
                        Template v{draft.templateInfo.version}
                      </div>
                    )}
                    {draft.draft.vehicleId && (
                      <div style={{ fontSize: '13px', color: colors.neutral[600] }}>
                        Vehicle: {draft.draft.vehicleId.substring(0, 8)}...
                      </div>
                    )}
                  </div>

                  {/* Conflict Details */}
                  {draft.conflict?.hasConflict && draft.conflict.conflictDetails && (
                    <div style={{
                      padding: spacing.md,
                      backgroundColor: colors.warning + '10',
                      borderRadius: borderRadius.md,
                      marginBottom: spacing.md,
                      border: `1px solid ${colors.warning}40`,
                    }}>
                      <div style={{ ...typography.label, marginBottom: spacing.xs, color: colors.warning }}>
                        Template Updated After Draft Created
                      </div>
                      <div style={{ fontSize: '12px', color: colors.neutral[700] }}>
                        <div>Draft template version: {draft.conflict.conflictDetails.draftTemplateVersion}</div>
                        <div>Current template version: {draft.conflict.conflictDetails.templateVersion}</div>
                        {draft.conflict.conflictDetails.newSections.length > 0 && (
                          <div style={{ marginTop: spacing.xs }}>
                            New sections: {draft.conflict.conflictDetails.newSections.length}
                          </div>
                        )}
                        {draft.conflict.conflictDetails.removedSections.length > 0 && (
                          <div style={{ marginTop: spacing.xs, color: colors.error }}>
                            Removed sections: {draft.conflict.conflictDetails.removedSections.length}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: spacing.sm }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleContinueDraft(draft)}
                  >
                    <Eye size={14} style={{ marginRight: spacing.xs }} />
                    Continue
                  </Button>
                  {draft.conflict?.hasConflict && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDraft(draft);
                        setShowConflictResolver(true);
                      }}
                    >
                      <Merge size={14} style={{ marginRight: spacing.xs }} />
                      Resolve
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDraft(draft)}
                  >
                    <Trash2 size={14} style={{ color: colors.error[500] }} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conflict Resolver Modal */}
      {showConflictResolver && selectedDraft && selectedDraft.conflict && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: spacing.xl,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: borderRadius.lg,
            padding: spacing.xl,
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <h2 style={{ ...typography.h2, marginBottom: spacing.md }}>Resolve Template Conflict</h2>
            
            <div style={{ marginBottom: spacing.lg }}>
              <p style={{ ...typography.body, marginBottom: spacing.md }}>
                The template for this inspection has been updated. Choose how to proceed:
              </p>
              
              <div style={{ 
                padding: spacing.md, 
                backgroundColor: colors.neutral[50], 
                borderRadius: borderRadius.md,
                marginBottom: spacing.md,
              }}>
                <div style={{ ...typography.label, marginBottom: spacing.xs }}>Conflict Details</div>
                <div style={{ fontSize: '13px', color: colors.neutral[700] }}>
                  <div>Draft version: {selectedDraft.conflict.conflictDetails?.draftTemplateVersion}</div>
                  <div>Current version: {selectedDraft.conflict.conflictDetails?.templateVersion}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: spacing.md, marginBottom: spacing.lg }}>
              <Button
                onClick={() => handleResolveConflict(selectedDraft, 'merge')}
                disabled={syncing === selectedDraft.key}
                style={{ justifyContent: 'flex-start' }}
              >
                <Merge size={16} style={{ marginRight: spacing.sm }} />
                Merge with New Template
                <div style={{ fontSize: '12px', opacity: 0.8, marginLeft: 'auto' }}>
                  Keep your answers and add new questions
                </div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleResolveConflict(selectedDraft, 'keep')}
                disabled={syncing === selectedDraft.key}
                style={{ justifyContent: 'flex-start' }}
              >
                <CheckCircle size={16} style={{ marginRight: spacing.sm }} />
                Keep Existing Draft
                <div style={{ fontSize: '12px', opacity: 0.8, marginLeft: 'auto' }}>
                  Continue with old template (not recommended)
                </div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleResolveConflict(selectedDraft, 'discard')}
                disabled={syncing === selectedDraft.key}
                style={{ justifyContent: 'flex-start', borderColor: colors.error[500] }}
              >
                <XCircle size={16} style={{ marginRight: spacing.sm, color: colors.error[500] }} />
                Discard Draft
                <div style={{ fontSize: '12px', opacity: 0.8, marginLeft: 'auto' }}>
                  Delete and start fresh with new template
                </div>
              </Button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => {
                setShowConflictResolver(false);
                setSelectedDraft(null);
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

