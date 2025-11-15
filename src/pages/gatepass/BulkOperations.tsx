import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { ActionGrid, StatsGrid } from '../../components/ui/ResponsiveGrid';
import { useToast } from '../../providers/ToastProvider';

// 🔄 Bulk Operations
// Handle bulk operations on gate passes
// Bulk creation, updates, status changes, and exports

interface BulkOperation {
  id: string;
  name: string;
  description: string;
  type: 'create' | 'update' | 'status_change' | 'export' | 'delete';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_items: number;
  processed_items: number;
  failed_items: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

interface BulkPassData {
  pass_number: string;
  type: 'visitor' | 'vehicle';
  visitor_name?: string;
  vehicle_registration?: string;
  purpose: string;
  valid_from: string;
  valid_to: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  notes?: string;
}

interface BulkTemplate {
  id: string;
  name: string;
  description: string;
  template_data: BulkPassData[];
  created_by: string;
  created_at: string;
  usage_count: number;
}

export const BulkOperations: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([]);
  const [bulkTemplates, setBulkTemplates] = useState<BulkTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BulkTemplate | null>(null);
  const [bulkData, setBulkData] = useState<BulkPassData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'update' | 'export' | 'templates'>('create');
  const [csvData, setCsvData] = useState<string>('');
  const [operationType, setOperationType] = useState<'create' | 'update' | 'status_change'>('create');

  const fetchBulkOperations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/gate-pass-bulk/operations');
      setBulkOperations(response.data);
    } catch (error) {
      // Mock data for development
      setBulkOperations([
        {
          id: '1',
          name: 'Bulk Pass Creation - January 2024',
          description: 'Created 50 visitor passes for January inspections',
          type: 'create',
          status: 'completed',
          total_items: 50,
          processed_items: 50,
          failed_items: 0,
          created_at: '2024-01-15T10:00:00Z',
          completed_at: '2024-01-15T10:05:00Z'
        },
        {
          id: '2',
          name: 'Status Update - Expired Passes',
          description: 'Updated status for expired passes',
          type: 'status_change',
          status: 'processing',
          total_items: 25,
          processed_items: 15,
          failed_items: 0,
          created_at: '2024-01-20T14:30:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBulkTemplates = useCallback(async () => {
    try {
      const response = await apiClient.get('/gate-pass-bulk/templates');
      setBulkTemplates(response.data);
    } catch (error) {
      // Mock data for development (fallback)
      setBulkTemplates([
        {
          id: '1',
          name: 'Monthly Inspection Passes',
          description: 'Template for monthly vehicle inspections',
          template_data: [
            {
              pass_number: 'VP001',
              type: 'visitor',
              visitor_name: 'John Smith',
              purpose: 'inspection',
              valid_from: '2024-01-21T09:00:00Z',
              valid_to: '2024-01-21T17:00:00Z',
              status: 'pending'
            }
          ],
          created_by: 'Admin User',
          created_at: '2024-01-10T10:00:00Z',
          usage_count: 5
        }
      ]);
    }
  }, []);

  useEffect(() => {
    fetchBulkOperations();
    fetchBulkTemplates();
  }, [fetchBulkOperations, fetchBulkTemplates]);

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      setCsvData(csv);
      parseCSVData(csv);
    };
    reader.readAsText(file);
  };

  const parseCSVData = (csv: string) => {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data: BulkPassData[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header.toLowerCase().replace(' ', '_')] = values[index];
        });

        data.push({
          pass_number: row.pass_number || `BULK${Date.now()}${i}`,
          type: row.type || 'visitor',
          visitor_name: row.visitor_name,
          vehicle_registration: row.vehicle_registration,
          purpose: row.purpose || 'inspection',
          valid_from: row.valid_from || new Date().toISOString(),
          valid_to: row.valid_to || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: row.status || 'pending',
          notes: row.notes
        });
      }
    }

    setBulkData(data);
  };

  const downloadTemplate = () => {
    const template = `pass_number,type,visitor_name,vehicle_registration,purpose,valid_from,valid_to,status,notes
VP001,visitor,John Smith,,inspection,2024-01-21T09:00:00Z,2024-01-21T17:00:00Z,pending,Monthly inspection
VM001,vehicle,,ABC-1234,rto_work,2024-01-21T10:00:00Z,2024-01-22T18:00:00Z,pending,RTO documentation`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gate-pass-bulk-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const executeBulkOperation = async () => {
    if (bulkData.length === 0) {
      showToast({
        title: 'Validation Error',
        description: 'No data to process',
        variant: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/gate-pass-bulk/execute', {
        operation_type: operationType,
        data: bulkData,
        template_id: selectedTemplate?.id
      });

      showToast({
        title: 'Success',
        description: `Bulk operation completed! Processed ${response.data.processed_count} items.`,
        variant: 'success',
        duration: 5000,
      });
      setBulkData([]);
      setCsvData('');
      fetchBulkOperations();
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Bulk operation failed. Please check your data and try again.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportPasses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/gate-pass-bulk/export', {
        params: {
          format: 'csv',
          date_range: 'month',
          status: 'all'
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `gate-passes-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Export failed. Please try again.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.status.warning;
      case 'processing': return colors.primary;
      case 'completed': return colors.status.success;
      case 'failed': return colors.status.error;
      default: return colors.neutral[400];
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'status_change': return '🔄';
      case 'export': return '📤';
      case 'delete': return '🗑️';
      default: return '📋';
    }
  };

  if (loading && bulkOperations.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
        <div style={{ color: '#6B7280' }}>Loading bulk operations...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1400px', 
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
            🔄 Bulk Operations
          </h1>
          <p style={{ color: colors.neutral[600], marginTop: spacing.xs }}>
            Handle bulk operations on gate passes
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

      {/* Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.lg,
        marginBottom: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
          {[
            { id: 'create', label: 'Bulk Create', icon: '➕' },
            { id: 'update', label: 'Bulk Update', icon: '✏️' },
            { id: 'export', label: 'Export Data', icon: '📤' },
            { id: 'templates', label: 'Templates', icon: '📋' }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'secondary'}
              onClick={() => setActiveTab(tab.id as any)}
              icon={tab.icon}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Bulk Create Tab */}
      {activeTab === 'create' && (
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
            📤 Bulk Create Passes
          </h3>
          
          <div style={{ display: 'grid', gap: spacing.lg }}>
            <div>
              <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <div style={{ marginTop: spacing.xs }}>
                <Button
                  variant="secondary"
                  onClick={downloadTemplate}
                  icon="📥"
                >
                  Download Template
                </Button>
              </div>
            </div>
            
            {bulkData.length > 0 && (
              <div>
                <h4 style={{ 
                  ...typography.subheader,
                  marginBottom: spacing.md,
                  color: colors.neutral[900]
                }}>
                  Preview Data ({bulkData.length} items)
                </h4>
                
                <div style={{ 
                  maxHeight: '300px', 
                  overflow: 'auto',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}>
                  <table style={{ width: '100%', fontSize: '14px' }}>
                    <thead style={{ backgroundColor: colors.neutral[50] }}>
                      <tr>
                        <th style={{ padding: spacing.sm, textAlign: 'left' }}>Pass Number</th>
                        <th style={{ padding: spacing.sm, textAlign: 'left' }}>Type</th>
                        <th style={{ padding: spacing.sm, textAlign: 'left' }}>Name</th>
                        <th style={{ padding: spacing.sm, textAlign: 'left' }}>Purpose</th>
                        <th style={{ padding: spacing.sm, textAlign: 'left' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkData.slice(0, 10).map((item, index) => (
                        <tr key={index}>
                          <td style={{ padding: spacing.sm }}>{item.pass_number}</td>
                          <td style={{ padding: spacing.sm, textTransform: 'capitalize' }}>{item.type}</td>
                          <td style={{ padding: spacing.sm }}>
                            {item.visitor_name || item.vehicle_registration || 'N/A'}
                          </td>
                          <td style={{ padding: spacing.sm, textTransform: 'capitalize' }}>{item.purpose}</td>
                          <td style={{ padding: spacing.sm, textTransform: 'capitalize' }}>{item.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bulkData.length > 10 && (
                    <div style={{ 
                      padding: spacing.sm, 
                      textAlign: 'center', 
                      color: colors.neutral[600],
                      backgroundColor: colors.neutral[50]
                    }}>
                      ... and {bulkData.length - 10} more items
                    </div>
                  )}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: spacing.sm, 
                  marginTop: spacing.lg,
                  justifyContent: 'flex-end'
                }}>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setBulkData([]);
                      setCsvData('');
                    }}
                  >
                    Clear Data
                  </Button>
                  <Button
                    variant="primary"
                    onClick={executeBulkOperation}
                    icon="🚀"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : `Create ${bulkData.length} Passes`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk Update Tab */}
      {activeTab === 'update' && (
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
            ✏️ Bulk Update Passes
          </h3>
          
          <div style={{ display: 'grid', gap: spacing.lg }}>
            <div>
              <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
                Operation Type
              </label>
              <select
                value={operationType}
                onChange={(e) => setOperationType(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="create">Create New Passes</option>
                <option value="update">Update Existing Passes</option>
                <option value="status_change">Change Status</option>
              </select>
            </div>
            
            <div>
              <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
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
            📤 Export Gate Passes
          </h3>
          
          <div style={{ display: 'grid', gap: spacing.lg }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.lg }}>
              <div>
                <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
                  Date Range
                </label>
                <select style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
              
              <div>
                <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
                  Status
                </label>
                <select style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
                  Format
                </label>
                <select style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}>
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
              <Button
                variant="primary"
                onClick={exportPasses}
                icon="📤"
                disabled={loading}
              >
                {loading ? 'Exporting...' : 'Export Data'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
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
            📋 Bulk Templates
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: spacing.lg }}>
            {bulkTemplates.map((template) => (
              <div
                key={template.id}
                style={{
                  padding: spacing.lg,
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  backgroundColor: '#F9FAFB',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setSelectedTemplate(template)}
              >
                <h4 style={{ 
                  ...typography.subheader,
                  marginBottom: spacing.sm,
                  color: colors.neutral[900]
                }}>
                  {template.name}
                </h4>
                <p style={{ 
                  ...typography.bodySmall,
                  color: colors.neutral[600],
                  marginBottom: spacing.sm
                }}>
                  {template.description}
                </p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: colors.neutral[500]
                }}>
                  <span>Items: {template.template_data.length}</span>
                  <span>Used: {template.usage_count} times</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Operations */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.xl,
        marginTop: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ 
          ...typography.subheader,
          marginBottom: spacing.lg,
          color: colors.neutral[900]
        }}>
          📊 Recent Operations
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {bulkOperations.map((operation) => (
            <div
              key={operation.id}
              style={{
                padding: spacing.lg,
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                backgroundColor: '#F9FAFB'
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
                    {getOperationIcon(operation.type)} {operation.name}
                  </h4>
                  <p style={{ 
                    ...typography.bodySmall,
                    color: colors.neutral[600]
                  }}>
                    {operation.description}
                  </p>
                </div>
                
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: getStatusColor(operation.status),
                  color: 'white',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}>
                  {operation.status}
                </span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '12px',
                color: colors.neutral[500]
              }}>
                <span>Total: {operation.total_items} | Processed: {operation.processed_items} | Failed: {operation.failed_items}</span>
                <span>Created: {new Date(operation.created_at).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

