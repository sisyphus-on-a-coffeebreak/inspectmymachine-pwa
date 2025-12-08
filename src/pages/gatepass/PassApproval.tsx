import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { PolicyLinks } from '../../components/ui/PolicyLinks';
import { useToast } from '../../providers/ToastProvider';
import { useConfirm } from '../../components/ui/Modal';
import { CommentThread, type Comment } from '../../components/ui/CommentThread';
import { useAuth } from '../../providers/useAuth';

// ✅ Pass Approval Workflow
// Multi-level approval system for gate passes
// Handles approval requests, reviews, and notifications

interface ApprovalRequest {
  id: string;
  pass_id: string;
  pass_number: string;
  pass_type: 'visitor' | 'vehicle';
  requester_name: string;
  requester_id: string;
  request_date: string;
  approval_level: number;
  current_approver: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  approval_notes?: string;
  rejection_reason?: string;
  escalation_reason?: string;
  created_at: string;
  updated_at: string;
}

interface ApprovalLevel {
  level: number;
  approver_role: string;
  approver_name: string;
  required: boolean;
  status: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  notes?: string;
}

interface PassDetails {
  id: string;
  pass_number: string;
  type: 'visitor' | 'vehicle';
  visitor_name?: string;
  vehicle_registration?: string;
  purpose: string;
  valid_from: string;
  valid_to: string;
  requester_name: string;
  request_notes?: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
}

export const PassApproval: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirm, ConfirmComponent } = useConfirm();
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [passDetails, setPassDetails] = useState<PassDetails | null>(null);
  const [approvalLevels, setApprovalLevels] = useState<ApprovalLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; name: string; role?: string }>>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchApprovalRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/gate-pass-approval/pending', {
        params: { status: filter }
      });
      setApprovalRequests(response.data);
    } catch (error) {
      // Show empty state instead of mock data
      setApprovalRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchPassDetails = async (passId: string) => {
    try {
      const response = await apiClient.get(`/gate-pass-approval/pass-details/${passId}`);
      setPassDetails(response.data);
    } catch (error) {
      // Show empty state instead of mock data
      setPassDetails(null);
    }
  };

  const fetchApprovalLevels = async (passId?: string) => {
    try {
      const params = passId ? { pass_id: passId } : {};
      const response = await apiClient.get(`/gate-pass-approval/history`, { params });
      setApprovalLevels(response.data);
    } catch (error) {
      console.error('Error fetching approval levels:', error);
      // Show empty state instead of mock data
      setApprovalLevels([]);
        },
        {
          level: 2,
          approver_role: 'admin',
          approver_name: null,
          required: false,
          status: 'pending'
        }
      ]);
    }
  };

  const fetchComments = useCallback(async (requestId: string) => {
    try {
      const response = await apiClient.get(`/gate-pass-approval/comments/${requestId}`);
      setComments(response.data.comments || []);
    } catch (error) {
      // If endpoint doesn't exist yet, use empty array
      setComments([]);
    }
  }, []);

  const fetchAvailableUsers = useCallback(async () => {
    try {
      const response = await apiClient.get('/v1/users', { params: { limit: 100 } });
      const users = response.data.users || response.data || [];
      setAvailableUsers(users.map((u: any) => ({
        id: u.id,
        name: u.name || u.email || 'Unknown User',
        role: u.role,
      })));
    } catch (error) {
      // Fallback to current user only
      if (user) {
        setAvailableUsers([{
          id: user.id,
          name: user.name || user.email || 'You',
          role: user.role,
        }]);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchApprovalRequests();
  }, [fetchApprovalRequests]);

  useEffect(() => {
    fetchAvailableUsers();
  }, [fetchAvailableUsers]);

  const handleRequestClick = async (request: ApprovalRequest) => {
    // Prevent duplicate clicks on the same request or while loading
    if (selectedRequest?.id === request.id || loadingDetails) {
      return;
    }
    
    setLoadingDetails(true);
    
    // Set selected request immediately for UI feedback
    setSelectedRequest(request);
    
    // Reset related state
    setPassDetails(null);
    setApprovalLevels([]);
    setComments([]);
    
    // Fetch data in parallel for better performance
    try {
      await Promise.all([
        fetchPassDetails(request.pass_id),
        fetchApprovalLevels(request.pass_id),
        fetchComments(request.id),
      ]);
    } catch (error) {
      // Errors are handled in individual fetch functions with fallbacks
      console.error('Error loading request details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddComment = useCallback(async (content: string, mentions?: string[]) => {
    if (!selectedRequest) return;

    try {
      const response = await apiClient.post(`/gate-pass-approval/comments/${selectedRequest.id}`, {
        content,
        mentions,
      });

      const newComment: Comment = {
        id: response.data.comment?.id || Date.now().toString(),
        author_id: user?.id || '',
        author_name: user?.name || user?.email || 'You',
        author_role: user?.role,
        content,
        created_at: new Date().toISOString(),
        mentions,
      };

      setComments(prev => [...prev, newComment]);
      showToast({
        title: 'Success',
        description: 'Comment added successfully',
        variant: 'success',
      });
    } catch (error) {
      // Fallback: add comment locally if API doesn't exist
      const newComment: Comment = {
        id: Date.now().toString(),
        author_id: user?.id || '',
        author_name: user?.name || user?.email || 'You',
        author_role: user?.role,
        content,
        created_at: new Date().toISOString(),
        mentions,
      };
      setComments(prev => [...prev, newComment]);
      showToast({
        title: 'Comment Added',
        description: 'Comment saved locally (API endpoint may need to be created)',
        variant: 'success',
      });
    }
  }, [selectedRequest, user, showToast]);

  const approveRequest = async () => {
    if (!selectedRequest) return;

    try {
      setLoading(true);
      await apiClient.post(`/gate-pass-approval/approve/${selectedRequest.id}`, {
        notes: approvalNotes
      });

      showToast({
        title: 'Success',
        description: 'Request approved successfully!',
        variant: 'success',
      });
      setSelectedRequest(null);
      setApprovalNotes('');
      fetchApprovalRequests();
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to approve request. Please try again.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const rejectRequest = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      showToast({
        title: 'Validation Error',
        description: 'Please provide a rejection reason',
        variant: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      await apiClient.post(`/gate-pass-approval/reject/${selectedRequest.id}`, {
        reason: rejectionReason
      });

      showToast({
        title: 'Success',
        description: 'Request rejected successfully!',
        variant: 'success',
      });
      setSelectedRequest(null);
      setRejectionReason('');
      fetchApprovalRequests();
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to reject request. Please try again.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const escalateRequest = async () => {
    if (!selectedRequest) return;

    try {
      setLoading(true);
      await apiClient.post(`/gate-pass-approval/escalate/${selectedRequest.id}`, {
        reason: approvalNotes
      });

      showToast({
        title: 'Success',
        description: 'Request escalated successfully!',
        variant: 'success',
      });
      setSelectedRequest(null);
      setApprovalNotes('');
      fetchApprovalRequests();
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to escalate request. Please try again.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.status.warning;
      case 'approved': return colors.status.normal;
      case 'rejected': return colors.status.critical;
      case 'escalated': return colors.primary;
      default: return colors.neutral[400];
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return colors.status.normal;
      case 'medium': return colors.status.warning;
      case 'high': return colors.status.critical;
      case 'urgent': return colors.primary;
      default: return colors.neutral[400];
    }
  };

  if (loading && approvalRequests.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✅</div>
        <div style={{ color: '#6B7280' }}>Loading approval requests...</div>
      </div>
    );
  }

  return (
    <>
      {ConfirmComponent}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
      padding: spacing.xl,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: colors.neutral[50],
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: spacing.xl,
        padding: spacing.lg,
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div>
          <h1 style={{ 
            ...typography.header,
            fontSize: '28px',
            color: colors.neutral[900],
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            ✅ Pass Approval Workflow
          </h1>
          <p style={{ color: colors.neutral[600], marginTop: spacing.xs }}>
            Review and approve gate pass requests
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <Button
            variant="secondary"
            onClick={() => navigate('/dashboard')}
            icon="🚪"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Policy Links */}
      <PolicyLinks
        title="Approval Policy & Escalation Rules"
        links={[
          {
            label: 'Escalation Rules',
            url: '/policies/escalation-rules',
            external: false,
            icon: '⚡'
          },
          {
            label: 'Approval Workflow',
            url: '/policies/approval-workflow',
            external: false,
            icon: '🔄'
          },
          {
            label: 'Gate Pass Policy',
            url: '/policies/gate-pass-policy',
            external: false,
            icon: '📋'
          }
        ]}
        variant="compact"
      />

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.lg,
        marginBottom: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ ...typography.label, color: colors.neutral[600] }}>Filter by status:</span>
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'primary' : 'secondary'}
              onClick={() => setFilter(status as any)}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.xl }}>
        {/* Approval Requests List */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: spacing.xl,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ 
            ...typography.subheader,
            marginBottom: spacing.lg,
            color: colors.neutral[900]
          }}>
            📋 Approval Requests ({approvalRequests.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {approvalRequests.map((request) => (
              <div
                key={request.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRequestClick(request);
                }}
                style={{
                  padding: spacing.lg,
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  backgroundColor: selectedRequest?.id === request.id ? colors.primary + '10' : '#F9FAFB',
                  cursor: loadingDetails ? 'wait' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: loadingDetails && selectedRequest?.id !== request.id ? 0.6 : 1,
                  pointerEvents: loadingDetails ? 'auto' : 'auto', // Allow clicks but show loading state
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: spacing.sm
                }}>
                  <div>
                    <h4 style={{ 
                      ...typography.subheader,
                      marginBottom: spacing.xs,
                      color: colors.neutral[900]
                    }}>
                      {request.pass_number}
                    </h4>
                    <p style={{ 
                      ...typography.bodySmall,
                      color: colors.neutral[600],
                      marginBottom: spacing.xs
                    }}>
                      {request.pass_type === 'visitor' ? '👥' : '🚗'} {request.pass_type} pass
                    </p>
                    <p style={{ 
                      ...typography.bodySmall,
                      color: colors.neutral[600]
                    }}>
                      Requested by: {request.requester_name}
                    </p>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: spacing.xs
                  }}>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: getStatusColor(request.status),
                      color: 'white',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {request.status}
                    </span>
                    <span style={{ 
                      fontSize: '12px', 
                      color: colors.neutral[500]
                    }}>
                      Level {request.approval_level}
                    </span>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: colors.neutral[500]
                }}>
                  <span>Requested: {new Date(request.request_date).toLocaleDateString('en-IN')}</span>
                  <span>Approver: {request.current_approver}</span>
                </div>
              </div>
            ))}
          </div>
          
          {approvalRequests.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: colors.neutral[600]
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
              <div>No approval requests found</div>
            </div>
          )}
        </div>

        {/* Request Details & Actions */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: spacing.xl,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          {selectedRequest && passDetails ? (
            <>
              <h3 style={{ 
                ...typography.subheader,
                marginBottom: spacing.lg,
                color: colors.neutral[900]
              }}>
                📝 Request Details
              </h3>
              
              <div style={{ marginBottom: spacing.lg }}>
                <div style={{ 
                  display: 'grid', 
                  gap: spacing.sm,
                  marginBottom: spacing.lg
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: colors.neutral[600] }}>Pass Number:</span>
                    <span style={{ fontWeight: 600 }}>{passDetails.pass_number}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: colors.neutral[600] }}>Type:</span>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                      {passDetails.type} Pass
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: colors.neutral[600] }}>Name:</span>
                    <span style={{ fontWeight: 600 }}>
                      {passDetails.visitor_name || passDetails.vehicle_registration || 'N/A'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: colors.neutral[600] }}>Purpose:</span>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                      {passDetails.purpose}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: colors.neutral[600] }}>Valid From:</span>
                    <span style={{ fontWeight: 600 }}>
                      {new Date(passDetails.valid_from).toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: colors.neutral[600] }}>Valid To:</span>
                    <span style={{ fontWeight: 600 }}>
                      {new Date(passDetails.valid_to).toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: colors.neutral[600] }}>Urgency:</span>
                    <span style={{ 
                      fontWeight: 600,
                      color: getUrgencyColor(passDetails.urgency),
                      textTransform: 'capitalize'
                    }}>
                      {passDetails.urgency}
                    </span>
                  </div>
                </div>
                
                {passDetails.request_notes && (
                  <div style={{
                    padding: spacing.sm,
                    backgroundColor: colors.neutral[50],
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: colors.neutral[700]
                  }}>
                    <strong>Request Notes:</strong> {passDetails.request_notes}
                  </div>
                )}
              </div>

              {/* Approval Levels */}
              <div style={{ marginBottom: spacing.lg }}>
                <h4 style={{ 
                  ...typography.subheader,
                  marginBottom: spacing.md,
                  color: colors.neutral[900]
                }}>
                  🔄 Approval Levels
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                  {approvalLevels.map((level) => (
                    <div
                      key={level.level}
                      style={{
                        padding: spacing.sm,
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        backgroundColor: level.status === 'approved' ? colors.status.normal + '10' : 
                                       level.status === 'rejected' ? colors.status.critical + '10' : '#F9FAFB'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <span style={{ fontWeight: 600 }}>Level {level.level}</span>
                          <span style={{ color: colors.neutral[600], marginLeft: spacing.sm }}>
                            {level.approver_role} - {level.approver_name}
                          </span>
                        </div>
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: level.status === 'approved' ? colors.status.normal :
                                         level.status === 'rejected' ? colors.status.critical : colors.status.warning,
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}>
                          {level.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedRequest.status === 'pending' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                  <div>
                    <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
                      Approval Notes
                    </label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Add notes about your decision..."
                      style={{
                        width: '100%',
                        padding: spacing.sm,
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        minHeight: '60px',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: spacing.sm }}>
                    <Button
                      variant="primary"
                      onClick={approveRequest}
                      icon="✅"
                      disabled={loading}
                    >
                      Approve
                    </Button>
                    
                    <Button
                      variant="secondary"
                      onClick={escalateRequest}
                      icon="⬆️"
                      disabled={loading}
                    >
                      Escalate
                    </Button>
                  </div>
                  
                  <div>
                    <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
                      Rejection Reason
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide reason for rejection..."
                      style={{
                        width: '100%',
                        padding: spacing.sm,
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        minHeight: '60px',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  
                  <Button
                    variant="secondary"
                    onClick={rejectRequest}
                    icon="❌"
                    disabled={loading || !rejectionReason.trim()}
                  >
                    Reject Request
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: colors.neutral[600]
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</div>
              <div>Select a request to view details</div>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

