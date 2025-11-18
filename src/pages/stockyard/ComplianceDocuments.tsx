/**
 * Compliance & Documentation Locker
 * 
 * Document upload and management for back-office staff (gatekeepers do NOT upload)
 */

import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/EmptyState';
import { NetworkError } from '../../components/ui/NetworkError';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { colors, spacing, typography, cardStyles, borderRadius } from '../../lib/theme';
import { useStockyardDocuments, useComplianceTasks, useUploadStockyardDocument, useApproveDocument } from '../../lib/queries';
import { useToast } from '../../providers/ToastProvider';
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Plus,
  File,
} from 'lucide-react';
import type { StockyardDocument, DocumentType, ComplianceStatus } from '../../lib/stockyard';
import { useQueryClient } from '@tanstack/react-query';
import { getComplianceStatus, isDocumentTypeRequired, getDocumentTypeLabel } from '../../lib/stockyard-utils';

const documentTypeConfig: Record<DocumentType, { label: string; required: boolean }> = {
  rc_book: { label: 'RC Book', required: true },
  insurance: { label: 'Insurance', required: true },
  pollution_certificate: { label: 'Pollution Certificate', required: true },
  fitness_certificate: { label: 'Fitness Certificate', required: false },
  permit: { label: 'Permit', required: false },
  noc: { label: 'NOC', required: false },
  other: { label: 'Other', required: false },
};

const statusConfig: Record<ComplianceStatus, { color: string; bgColor: string; icon: React.ElementType }> = {
  complete: {
    color: colors.success[600],
    bgColor: colors.success[50],
    icon: CheckCircle2,
  },
  missing: {
    color: colors.error[600],
    bgColor: colors.error[50],
    icon: XCircle,
  },
  expired: {
    color: colors.error[600],
    bgColor: colors.error[50],
    icon: AlertCircle,
  },
  expiring_soon: {
    color: colors.warning[600],
    bgColor: colors.warning[50],
    icon: Clock,
  },
};

export const ComplianceDocuments: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('rc_book');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const uploadDocumentMutation = useUploadStockyardDocument({
    onSuccess: () => {
      showToast({
        title: 'Success',
        description: 'Document uploaded successfully',
        variant: 'success',
      });
      setShowUploadModal(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: any) => {
      showToast({
        title: 'Error',
        description: error?.message || 'Failed to upload document',
        variant: 'error',
      });
    },
  });

  const approveDocumentMutation = useApproveDocument({
    onSuccess: () => {
      showToast({
        title: 'Success',
        description: 'Document approved',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      showToast({
        title: 'Error',
        description: error?.message || 'Failed to approve document',
        variant: 'error',
      });
    },
  });

  const { data: documents, isLoading, isError, error, refetch } = useStockyardDocuments(requestId || '');
  const { data: complianceTasks } = useComplianceTasks({ stockyard_request_id: requestId });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !requestId) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', selectedDocType);
    formData.append('notes', '');

    uploadDocumentMutation.mutate({ stockyardRequestId: requestId, formData });
  };

  const handleApprove = async (documentId: string) => {
    approveDocumentMutation.mutate(documentId);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader title="Compliance Documents" subtitle="Manage vehicle documents" icon={<FileText size={24} />} />
        <SkeletonLoader count={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader title="Compliance Documents" subtitle="Manage vehicle documents" icon={<FileText size={24} />} />
        <NetworkError error={error as Error} onRetry={() => refetch()} />
      </div>
    );
  }

  const documentsList = documents || [];
  const tasksList = complianceTasks || [];

  // Group documents by type
  const documentsByType = documentsList.reduce((acc, doc) => {
    if (!acc[doc.document_type]) {
      acc[doc.document_type] = [];
    }
    acc[doc.document_type].push(doc);
    return acc;
  }, {} as Record<DocumentType, StockyardDocument[]>);

  // Check compliance status
  const complianceStatus = getComplianceStatus(documentsList);

  return (
    <div style={{ padding: spacing.xl }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} style={{ marginRight: spacing.xs }} />
          Back
        </Button>
        <PageHeader
          title="Compliance Documents"
          subtitle={`Request ID: ${requestId?.substring(0, 8)}...`}
          icon={<FileText size={24} />}
        />
      </div>

      {/* Compliance Status Alert */}
      {(complianceStatus.missing.length > 0 || complianceStatus.expired.length > 0) && (
        <div
          style={{
            ...cardStyles.card,
            marginBottom: spacing.lg,
            backgroundColor: colors.error[50],
            border: `2px solid ${colors.error[300]}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <AlertCircle size={20} color={colors.error[600]} />
            <span style={{ ...typography.body, fontWeight: 600, color: colors.error[700] }}>
              Compliance Issues
            </span>
          </div>
          {complianceStatus.missing.length > 0 && (
            <div style={{ ...typography.bodySmall, color: colors.error[700], marginBottom: spacing.xs }}>
              Missing: {complianceStatus.missing.map((type) => getDocumentTypeLabel(type)).join(', ')}
            </div>
          )}
          {complianceStatus.expired.length > 0 && (
            <div style={{ ...typography.bodySmall, color: colors.error[700], marginBottom: spacing.xs }}>
              Expired: {complianceStatus.expired.map((type) => getDocumentTypeLabel(type)).join(', ')}
            </div>
          )}
          {complianceStatus.expiring.length > 0 && (
            <div style={{ ...typography.bodySmall, color: colors.warning[700] }}>
              Expiring Soon: {complianceStatus.expiring.map((type) => getDocumentTypeLabel(type)).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Upload Button */}
      <div style={{ marginBottom: spacing.lg }}>
        <Button variant="primary" onClick={() => setShowUploadModal(true)}>
          <Plus size={16} style={{ marginRight: spacing.xs }} />
          Upload Document
        </Button>
        <div style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.xs }}>
          Note: Only back-office staff can upload documents. Gatekeepers do not have upload permissions.
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowUploadModal(false)}
        >
          <div
            style={{
              ...cardStyles.card,
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ ...typography.header, marginBottom: spacing.md }}>Upload Document</div>
            <div style={{ marginBottom: spacing.md }}>
              <label style={{ ...typography.body, fontWeight: 600, display: 'block', marginBottom: spacing.xs }}>
                Document Type
              </label>
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value as DocumentType)}
                style={{
                  width: '100%',
                  padding: spacing.md,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                }}
              >
                {Object.entries(documentTypeConfig).map(([type, config]) => (
                  <option key={type} value={type}>
                    {config.label} {config.required && '(Required)'}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: spacing.md }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelect}
                disabled={uploadDocumentMutation.isPending}
                style={{ display: 'none' }}
                id="document-upload"
              />
              <label
                htmlFor="document-upload"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.sm,
                  padding: spacing.xl,
                  border: `2px dashed ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  cursor: uploadDocumentMutation.isPending ? 'not-allowed' : 'pointer',
                  backgroundColor: colors.neutral[50],
                  opacity: uploadDocumentMutation.isPending ? 0.6 : 1,
                }}
              >
                <Upload size={24} color={colors.primary} />
                <span style={{ ...typography.body, color: colors.primary }}>
                  {uploadDocumentMutation.isPending ? 'Uploading...' : 'Choose File'}
                </span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowUploadModal(false)} disabled={uploadDocumentMutation.isPending}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Tasks */}
      {tasksList.length > 0 && (
        <div style={{ ...cardStyles.card, marginBottom: spacing.lg }}>
          <div style={{ ...typography.header, fontSize: '18px', marginBottom: spacing.md }}>Compliance Tasks</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {tasksList.map((task) => (
              <div
                key={task.id}
                style={{
                  padding: spacing.md,
                  backgroundColor: colors.neutral[50],
                  borderRadius: borderRadius.md,
                  border: `1px solid ${colors.neutral[200]}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ ...typography.body, fontWeight: 600, marginBottom: spacing.xs }}>
                      {documentTypeConfig[task.document_type]?.label || task.document_type}
                    </div>
                    <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                      Status: {task.status} {task.due_date && `• Due: ${formatDate(task.due_date)}`}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 12px',
                      backgroundColor:
                        task.status === 'completed'
                          ? colors.success[50]
                          : task.status === 'overdue'
                          ? colors.error[50]
                          : colors.warning[50],
                      color:
                        task.status === 'completed'
                          ? colors.success[600]
                          : task.status === 'overdue'
                          ? colors.error[600]
                          : colors.warning[600],
                      borderRadius: borderRadius.md,
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {task.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents List */}
      <div style={{ ...cardStyles.card }}>
        <div style={{ ...typography.header, fontSize: '18px', marginBottom: spacing.md }}>Uploaded Documents</div>
        {documentsList.length === 0 ? (
          <EmptyState
            icon={<FileText size={48} />}
            title="No Documents"
            description="No documents have been uploaded yet"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {Object.entries(documentTypeConfig).map(([type, config]) => {
              const typeDocs = documentsByType[type as DocumentType] || [];
              if (typeDocs.length === 0 && !config.required) return null;

              return (
                <div key={type} style={{ marginBottom: spacing.lg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                    <File size={18} color={colors.primary} />
                    <span style={{ ...typography.body, fontWeight: 600 }}>
                      {config.label} {config.required && <span style={{ color: colors.error[600] }}>*</span>}
                    </span>
                  </div>
                  {typeDocs.length === 0 ? (
                    <div
                      style={{
                        padding: spacing.md,
                        backgroundColor: colors.error[50],
                        border: `1px solid ${colors.error[200]}`,
                        borderRadius: borderRadius.md,
                        ...typography.bodySmall,
                        color: colors.error[700],
                      }}
                    >
                      {config.required ? 'Required document missing' : 'No documents uploaded'}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                      {typeDocs.map((doc) => {
                        const status = statusConfig[doc.status];
                        const StatusIcon = status.icon;

                        return (
                          <div
                            key={doc.id}
                            style={{
                              ...cardStyles.card,
                              borderLeft: `4px solid ${status.color}`,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                                  <StatusIcon size={16} color={status.color} />
                                  <span style={{ ...typography.body, fontWeight: 600 }}>{doc.file_name}</span>
                                  <span
                                    style={{
                                      padding: '2px 8px',
                                      backgroundColor: status.bgColor,
                                      color: status.color,
                                      borderRadius: borderRadius.sm,
                                      fontSize: '10px',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {doc.status.toUpperCase()}
                                  </span>
                                </div>
                                <div style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.xs }}>
                                  {formatFileSize(doc.file_size)} • Uploaded {formatDate(doc.created_at)}
                                  {doc.uploader && ` by ${doc.uploader.name}`}
                                </div>
                                {doc.expires_at && (
                                  <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                                    Expires: {formatDate(doc.expires_at)}
                                  </div>
                                )}
                                {doc.notes && (
                                  <div
                                    style={{
                                      marginTop: spacing.xs,
                                      padding: spacing.xs,
                                      backgroundColor: colors.neutral[50],
                                      borderRadius: borderRadius.sm,
                                      ...typography.caption,
                                      color: colors.neutral[700],
                                    }}
                                  >
                                    {doc.notes}
                                  </div>
                                )}
                                {doc.approved_by && (
                                  <div style={{ ...typography.caption, color: colors.success[600], marginTop: spacing.xs }}>
                                    ✓ Approved by {doc.approver?.name} on {formatDate(doc.approved_at)}
                                  </div>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: spacing.sm, marginLeft: spacing.md }}>
                                <Button
                                  variant="secondary"
                                  size="small"
                                  onClick={() => window.open(doc.file_url, '_blank')}
                                >
                                  <Eye size={14} style={{ marginRight: spacing.xs }} />
                                  View
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="small"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = doc.file_url;
                                    link.download = doc.file_name;
                                    link.click();
                                  }}
                                >
                                  <Download size={14} style={{ marginRight: spacing.xs }} />
                                  Download
                                </Button>
                                {!doc.approved_by && (
                                  <Button
                                    variant="primary"
                                    size="small"
                                    onClick={() => handleApprove(doc.id)}
                                  >
                                    <CheckCircle2 size={14} style={{ marginRight: spacing.xs }} />
                                    Approve
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

