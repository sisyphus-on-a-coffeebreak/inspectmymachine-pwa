import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/button';

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
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [passDetails, setPassDetails] = useState<PassDetails | null>(null);
  const [approvalLevels, setApprovalLevels] = useState<ApprovalLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchApprovalRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/gate-pass-approval/pending', {
        params: { status: filter }
      });
      setApprovalRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch approval requests:', error);
      // Mock data for development
      setApprovalRequests([
        {
          id: '1',
          pass_id: 'pass-123',
          pass_number: 'VP123456',
          pass_type: 'visitor',
          requester_name: 'John Smith',
          requester_id: 'user-1',
          request_date: '2024-01-20T10:00:00Z',
          approval_level: 1,
          current_approver: 'Manager',
          status: 'pending',
          created_at: '2024-01-20T10:00:00Z',
          updated_at: '2024-01-20T10:00:00Z'
        },
        {
          id: '2',
          pass_id: 'pass-124',
          pass_number: 'VM123457',
          pass_type: 'vehicle',
          requester_name: 'Sarah Johnson',
          requester_id: 'user-2',
          request_date: '2024-01-20T11:30:00Z',
          approval_level: 2,
          current_approver: 'Supervisor',
          status: 'pending',
          created_at: '2024-01-20T11:30:00Z',
          updated_at: '2024-01-20T11:30:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchPassDetails = async (passId: string) => {
    try {
      const response = await axios.get(`/api/gate-pass-approval/pass-details/${passId}`);
      setPassDetails(response.data);
    } catch (error) {
      console.error('Failed to fetch pass details:', error);
      // Mock data for development
      setPassDetails({
        id: passId,
        pass_number: 'VP123456',
        type: 'visitor',
        visitor_name: 'John Smith',
        purpose: 'inspection',
        valid_from: '2024-01-21T09:00:00Z',
        valid_to: '2024-01-21T17:00:00Z',
        requester_name: 'John Smith',
        request_notes: 'Client inspection for vehicle purchase',
        urgency: 'medium'
      });
    }
  };

  const fetchApprovalLevels = async () => {
    try {
      const response = await axios.get(`/api/gate-pass-approval/history`);
      setApprovalLevels(response.data);
    } catch (error) {
      console.error('Failed to fetch approval levels:', error);
      // Mock data for development
      setApprovalLevels([
        {
          level: 1,
          approver_role: 'Manager',
          approver_name: 'Manager Name',
          required: true,
          status: 'pending'
        },
        {
          level: 2,
          approver_role: 'Supervisor',
          approver_name: 'Supervisor Name',
          required: false,
          status: 'pending'
        }
      ]);
    }
  };

  useEffect(() => {
    fetchApprovalRequests();
  }, [fetchApprovalRequests]);

  const handleRequestClick = async (request: ApprovalRequest) => {
    setSelectedRequest(request);
    await fetchPassDetails(request.pass_id);
    await fetchApprovalLevels();
  };

  const approveRequest = async () => {
    if (!selectedRequest) return;

    try {
      setLoading(true);
      await axios.post(`/api/gate-pass-approval/approve/${selectedRequest.id}`, {
        notes: approvalNotes
      });

      alert('Request approved successfully!');
      setSelectedRequest(null);
      setApprovalNotes('');
      fetchApprovalRequests();
    } catch (error) {
      console.error('Failed to approve request:', error);
      alert('Failed to approve request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const rejectRequest = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`/api/gate-pass-approval/reject/${selectedRequest.id}`, {
        reason: rejectionReason
      });

      alert('Request rejected successfully!');
      setSelectedRequest(null);
      setRejectionReason('');
      fetchApprovalRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
      alert('Failed to reject request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const escalateRequest = async () => {
    if (!selectedRequest) return;

    try {
      setLoading(true);
      await axios.post(`/api/gate-pass-approval/escalate/${selectedRequest.id}`, {
        reason: approvalNotes
      });

      alert('Request escalated successfully!');
      setSelectedRequest(null);
      setApprovalNotes('');
      fetchApprovalRequests();
    } catch (error) {
      console.error('Failed to escalate request:', error);
      alert('Failed to escalate request. Please try again.');
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
            onClick={() => navigate('/app/gate-pass')}
            icon="🚪"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

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
                onClick={() => handleRequestClick(request)}
                style={{
                  padding: spacing.lg,
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  backgroundColor: selectedRequest?.id === request.id ? colors.primary + '10' : '#F9FAFB',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
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
  );
};

