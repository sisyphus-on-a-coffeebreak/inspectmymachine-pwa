import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { useIsMobile } from '../../hooks/useIsMobile';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { ActionGrid, StatsGrid } from '../../components/ui/ResponsiveGrid';
import { useToast } from '../../providers/ToastProvider';
import { useConfirm } from '../../components/ui/Modal';

// 📋 Pass Templates
// Manage saved templates for common gate passes
// Allows quick creation of frequently used passes

interface PassTemplate {
  id: string;
  name: string;
  description: string;
  type: 'visitor' | 'vehicle';
  template_data: {
    purpose?: string;
    expected_duration?: string;
    common_vehicles?: number[];
    notes?: string;
    auto_assign_escort?: boolean;
  };
  usage_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const PassTemplates: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm, ConfirmComponent } = useConfirm();
  const isMobile = useIsMobile();
  const [templates, setTemplates] = useState<PassTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    type: 'visitor' as 'visitor' | 'vehicle',
    purpose: '',
    expected_duration_hours: 2,
    expected_duration_minutes: 0,
    notes: '',
    auto_assign_escort: false
  });

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/v1/gate-pass-templates');
      setTemplates(response.data);
    } catch (error) {
      // Show empty state instead of mock data
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calculate total duration in minutes
      const totalMinutes = (newTemplate.expected_duration_hours * 60) + newTemplate.expected_duration_minutes;
      
      const response = await apiClient.post('/v1/gate-pass-templates', {
        name: newTemplate.name,
        description: newTemplate.description,
        type: newTemplate.type,
        template_data: {
          purpose: newTemplate.purpose,
          expected_duration_minutes: totalMinutes, // Store as minutes for easy calculation
          notes: newTemplate.notes,
          auto_assign_escort: newTemplate.auto_assign_escort
        }
      });
      
      setTemplates(prev => [...prev, response.data]);
      setShowCreateForm(false);
      setNewTemplate({
        name: '',
        description: '',
        type: 'visitor',
        purpose: '',
        expected_duration_hours: 2,
        expected_duration_minutes: 0,
        notes: '',
        auto_assign_escort: false
      });
      showToast({
        title: 'Success',
        description: 'Template created successfully!',
        variant: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to create template. Please try again.',
        variant: 'error',
      });
    }
  };

  const useTemplate = (template: PassTemplate) => {
    if (template.type === 'visitor') {
      navigate('/app/gate-pass/create-visitor', { 
        state: { template: template.template_data } 
      });
    } else {
      navigate('/app/gate-pass/create-vehicle', { 
        state: { template: template.template_data } 
      });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    const confirmed = await confirm({
      title: 'Delete Template',
      message: 'Are you sure you want to delete this template?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'critical',
    });
    
    if (!confirmed) return;
    
    try {
      await apiClient.delete(`/v1/gate-pass-templates/${templateId}`);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      showToast({
        title: 'Success',
        description: 'Template deleted successfully!',
        variant: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to delete template. Please try again.',
        variant: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
        <div style={{ color: '#6B7280' }}>Loading pass templates...</div>
      </div>
    );
  }

  return (
    <>
      {ConfirmComponent}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
      padding: spacing.xl,
      fontFamily: typography.body.fontFamily,
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
            📋 Pass Templates
          </h1>
          <p style={{ color: colors.neutral[600], marginTop: spacing.xs }}>
            Manage saved templates for common gate passes
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <Button
            variant="secondary"
            onClick={() => setShowCreateForm(true)}
            icon="➕"
          >
            Create Template
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard')}
            icon="🚪"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Create Template Form */}
      {showCreateForm && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: spacing.xl,
          marginBottom: spacing.xl,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ 
            ...typography.subheader,
            marginBottom: spacing.lg,
            color: colors.neutral[900]
          }}>
            Create New Template
          </h3>
          
          <form onSubmit={createTemplate} style={{ display: 'grid', gap: spacing.lg }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
              <div>
                <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
                  Template Name *
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="e.g., Vehicle Inspection - Standard"
                />
              </div>
              
              <div>
                <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
                  Template Type *
                </label>
                <select
                  value={newTemplate.type}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, type: e.target.value as any }))}
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="visitor">Visitor Pass</option>
                  <option value="vehicle">Vehicle Movement</option>
                </select>
              </div>
            </div>
            
            <div>
              <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
                Description
              </label>
              <textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minHeight: '80px'
                }}
                placeholder="Describe when to use this template..."
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
              <div>
                <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
                  Purpose
                </label>
                <select
                  value={newTemplate.purpose}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, purpose: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select purpose...</option>
                  <option value="inspection">Inspection</option>
                  <option value="service">Service</option>
                  <option value="delivery">Delivery</option>
                  <option value="meeting">Meeting</option>
                  <option value="rto_work">RTO Work</option>
                  <option value="test_drive">Test Drive</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
            <div>
              <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
                Expected Duration
              </label>
              <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={newTemplate.expected_duration_hours}
                    onChange={(e) => setNewTemplate(prev => ({ 
                      ...prev, 
                      expected_duration_hours: parseInt(e.target.value) || 0 
                    }))}
                    style={{
                      width: '100%',
                      padding: spacing.sm,
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    placeholder="Hours"
                  />
                  <span style={{ ...typography.bodySmall, color: colors.neutral[600], marginTop: spacing.xs, display: 'block' }}>
                    Hours
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={newTemplate.expected_duration_minutes}
                    onChange={(e) => setNewTemplate(prev => ({ 
                      ...prev, 
                      expected_duration_minutes: parseInt(e.target.value) || 0 
                    }))}
                    style={{
                      width: '100%',
                      padding: spacing.sm,
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    placeholder="Minutes"
                  />
                  <span style={{ ...typography.bodySmall, color: colors.neutral[600], marginTop: spacing.xs, display: 'block' }}>
                    Minutes
                  </span>
                </div>
              </div>
              <p style={{ ...typography.bodySmall, color: colors.neutral[500], marginTop: spacing.xs }}>
                Pass will automatically expire after this duration from entry time
              </p>
            </div>
            </div>
            
            <div>
              <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
                Notes
              </label>
              <textarea
                value={newTemplate.notes}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, notes: e.target.value }))}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minHeight: '60px'
                }}
                placeholder="Any special instructions or notes..."
              />
            </div>
            
            <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon="💾"
              >
                Create Template
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Templates Grid */}
      <div style={{
        display: 'grid',
        // INVARIANT 2: mobile-safe grid
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(min(350px, 100%), 1fr))',
        gap: spacing.lg,
        width: '100%',
        maxWidth: '100%'
      }}>
        {templates.map((template) => (
          <div
            key={template.id}
            style={{
              ...cardStyles.base,
              padding: spacing.xl,
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: spacing.md
            }}>
              <div>
                <h3 style={{ 
                  ...typography.subheader,
                  marginBottom: spacing.xs,
                  color: colors.neutral[900]
                }}>
                  {template.name}
                </h3>
                <p style={{ 
                  ...typography.bodySmall,
                  color: colors.neutral[600],
                  marginBottom: spacing.sm
                }}>
                  {template.description}
                </p>
              </div>
              
              <div style={{ 
                display: 'flex', 
                gap: spacing.xs,
                alignItems: 'center'
              }}>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: template.type === 'visitor' ? colors.status.normal : colors.status.warning,
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  {template.type === 'visitor' ? '👥 Visitor' : '🚗 Vehicle'}
                </span>
              </div>
            </div>
            
            <div style={{ marginBottom: spacing.md }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                <span style={{ color: colors.neutral[600], fontSize: '14px' }}>Purpose:</span>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                  {template.template_data.purpose || 'Not specified'}
                </span>
              </div>
              {template.template_data.expected_duration_minutes && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                  <span style={{ color: colors.neutral[600], fontSize: '14px' }}>Duration:</span>
                  <span style={{ fontWeight: 600 }}>
                    {(() => {
                      const minutes = template.template_data.expected_duration_minutes;
                      const hours = Math.floor(minutes / 60);
                      const mins = minutes % 60;
                      if (hours > 0 && mins > 0) {
                        return `${hours}h ${mins}m`;
                      } else if (hours > 0) {
                        return `${hours} hour${hours > 1 ? 's' : ''}`;
                      } else {
                        return `${mins} minute${mins > 1 ? 's' : ''}`;
                      }
                    })()}
                  </span>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                <span style={{ color: colors.neutral[600], fontSize: '14px' }}>Usage Count:</span>
                <span style={{ fontWeight: 600, color: colors.primary }}>
                  {template.usage_count} times
                </span>
              </div>
            </div>
            
            {template.template_data.notes && (
              <div style={{ 
                marginBottom: spacing.md,
                padding: spacing.sm,
                backgroundColor: colors.neutral[50],
                borderRadius: '8px',
                fontSize: '14px',
                color: colors.neutral[700]
              }}>
                <strong>Notes:</strong> {template.template_data.notes}
              </div>
            )}
            
            <div style={{ 
              display: 'flex', 
              gap: spacing.sm,
              justifyContent: 'space-between'
            }}>
              <Button
                variant="primary"
                onClick={() => useTemplate(template)}
                icon="🚀"
                style={{ flex: 1 }}
              >
                Use Template
              </Button>
              
              <Button
                variant="secondary"
                onClick={() => deleteTemplate(template.id)}
                icon="🗑️"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {templates.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: colors.neutral[900] }}>
            No templates found
          </div>
          <div style={{ color: colors.neutral[600], marginBottom: '1.5rem' }}>
            Create your first template to speed up pass creation
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreateForm(true)}
            icon="➕"
          >
            Create First Template
          </Button>
        </div>
      )}
      </div>
    </>
  );
};

