import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { ActionGrid, StatsGrid } from '../../components/ui/ResponsiveGrid';

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
  const [templates, setTemplates] = useState<PassTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    type: 'visitor' as 'visitor' | 'vehicle',
    purpose: '',
    expected_duration: '',
    notes: '',
    auto_assign_escort: false
  });

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/gate-pass-templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      // Mock data for development
      setTemplates([
        {
          id: '1',
          name: 'Vehicle Inspection - Standard',
          description: 'Standard vehicle inspection pass for clients',
          type: 'visitor',
          template_data: {
            purpose: 'inspection',
            expected_duration: '2 hours',
            notes: 'Standard inspection process'
          },
          usage_count: 45,
          created_by: 'Admin User',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          name: 'RTO Work - Vehicle Out',
          description: 'Vehicle going out for RTO work',
          type: 'vehicle',
          template_data: {
            purpose: 'rto_work',
            expected_duration: '1 day',
            notes: 'RTO documentation work'
          },
          usage_count: 23,
          created_by: 'Admin User',
          created_at: '2024-01-10T14:30:00Z',
          updated_at: '2024-01-10T14:30:00Z'
        },
        {
          id: '3',
          name: 'Service Visit - Quick',
          description: 'Quick service visit for vehicle maintenance',
          type: 'visitor',
          template_data: {
            purpose: 'service',
            expected_duration: '30 minutes',
            notes: 'Quick service check'
          },
          usage_count: 67,
          created_by: 'Admin User',
          created_at: '2024-01-05T09:15:00Z',
          updated_at: '2024-01-05T09:15:00Z'
        }
      ]);
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
      const response = await axios.post('/api/gate-pass-templates', {
        name: newTemplate.name,
        description: newTemplate.description,
        type: newTemplate.type,
        template_data: {
          purpose: newTemplate.purpose,
          expected_duration: newTemplate.expected_duration,
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
        expected_duration: '',
        notes: '',
        auto_assign_escort: false
      });
      alert('Template created successfully!');
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('Failed to create template. Please try again.');
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
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await axios.delete(`/api/gate-pass-templates/${templateId}`);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      alert('Template deleted successfully!');
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template. Please try again.');
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
            onClick={() => navigate('/app/gate-pass')}
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
                <input
                  type="text"
                  value={newTemplate.expected_duration}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, expected_duration: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="e.g., 2 hours, 1 day"
                />
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: spacing.lg }}>
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
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                <span style={{ color: colors.neutral[600], fontSize: '14px' }}>Duration:</span>
                <span style={{ fontWeight: 600 }}>
                  {template.template_data.expected_duration || 'Not specified'}
                </span>
              </div>
              
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
  );
};

