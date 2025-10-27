import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/Button';
import { ActionGrid, StatsGrid } from '../../components/ui/ResponsiveGrid';

// 👥 Visitor Management
// Manage visitor database and history
// Track frequent visitors and their patterns

interface Visitor {
  id: string;
  name: string;
  phone: string;
  company?: string;
  total_visits: number;
  last_visit: string;
  first_visit: string;
  most_common_purpose: string;
  average_duration: string;
  status: 'active' | 'inactive' | 'blacklisted';
  notes?: string;
}

interface VisitorStats {
  total_visitors: number;
  active_visitors: number;
  frequent_visitors: number;
  new_visitors_this_month: number;
  top_companies: Array<{ company: string; count: number }>;
  visit_purposes: Array<{ purpose: string; count: number }>;
}

export const VisitorManagement: React.FC = () => {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'blacklisted'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'visits' | 'last_visit'>('last_visit');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchVisitors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/visitor-management/visitors', {
        params: {
          search: searchTerm,
          status: filterStatus,
          sort_by: sortBy,
          sort_order: sortOrder
        }
      });
      setVisitors(response.data);
    } catch (error) {
      console.error('Failed to fetch visitors:', error);
      // Mock data for development
      setVisitors([
        {
          id: '1',
          name: 'John Smith',
          phone: '9876543210',
          company: 'ABC Motors',
          total_visits: 15,
          last_visit: '2024-01-20T10:30:00Z',
          first_visit: '2023-06-15T09:00:00Z',
          most_common_purpose: 'inspection',
          average_duration: '2 hours',
          status: 'active',
          notes: 'Regular client, prefers morning visits'
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          phone: '9876543211',
          company: 'XYZ Auto',
          total_visits: 8,
          last_visit: '2024-01-18T14:15:00Z',
          first_visit: '2023-08-20T11:00:00Z',
          most_common_purpose: 'service',
          average_duration: '1.5 hours',
          status: 'active'
        },
        {
          id: '3',
          name: 'Mike Wilson',
          phone: '9876543212',
          company: 'DEF Cars',
          total_visits: 3,
          last_visit: '2024-01-10T16:00:00Z',
          first_visit: '2023-12-01T10:00:00Z',
          most_common_purpose: 'inspection',
          average_duration: '3 hours',
          status: 'inactive'
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterStatus, sortBy, sortOrder]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get('/api/visitor-management/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch visitor stats:', error);
      // Mock data for development
      setStats({
        total_visitors: 156,
        active_visitors: 89,
        frequent_visitors: 23,
        new_visitors_this_month: 12,
        top_companies: [
          { company: 'ABC Motors', count: 45 },
          { company: 'XYZ Auto', count: 32 },
          { company: 'DEF Cars', count: 28 }
        ],
        visit_purposes: [
          { purpose: 'inspection', count: 78 },
          { purpose: 'service', count: 45 },
          { purpose: 'meeting', count: 23 }
        ]
      });
    }
  }, []);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const updateVisitorStatus = async (visitorId: string, newStatus: string) => {
    try {
      await axios.put(`/api/visitor-management/visitors/${visitorId}`, {
        status: newStatus
      });
      setVisitors(prev => prev.map(v => 
        v.id === visitorId ? { ...v, status: newStatus as any } : v
      ));
      alert('Visitor status updated successfully!');
    } catch (error) {
      console.error('Failed to update visitor status:', error);
      alert('Failed to update visitor status. Please try again.');
    }
  };

  const addVisitorNote = async (visitorId: string, note: string) => {
    try {
      await axios.put(`/api/visitor-management/visitors/${visitorId}`, {
        notes: note
      });
      setVisitors(prev => prev.map(v => 
        v.id === visitorId ? { ...v, notes: note } : v
      ));
      alert('Note added successfully!');
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note. Please try again.');
    }
  };

  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visitor.phone.includes(searchTerm) ||
                         (visitor.company && visitor.company.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || visitor.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👥</div>
        <div style={{ color: '#6B7280' }}>Loading visitor management...</div>
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
            👥 Visitor Management
          </h1>
          <p style={{ color: colors.neutral[600], marginTop: spacing.xs }}>
            Manage visitor database and track visitor patterns
          </p>
        </div>
        
        <Button
          variant="primary"
          onClick={() => navigate('/app/gate-pass')}
          icon="🚪"
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <StatsGrid gap="lg" style={{ marginBottom: spacing.xl }}>
          <div style={{ 
            ...cardStyles.base,
            padding: spacing.xl,
            backgroundColor: 'white',
            border: `2px solid ${colors.primary}`,
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <div style={{ 
              ...typography.label,
              color: colors.neutral[600], 
              marginBottom: spacing.xs,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              <span className="status-dot status-dot-primary" />
              👥 Total Visitors
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.primary,
              fontWeight: 700
            }}>
              {stats.total_visitors}
            </div>
          </div>

          <div style={{ 
            ...cardStyles.base,
            padding: spacing.xl,
            backgroundColor: 'white',
            border: `2px solid ${colors.status.success}`,
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <div style={{ 
              ...typography.label,
              color: colors.neutral[600], 
              marginBottom: spacing.xs,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              <span className="status-dot status-dot-success" />
              ✅ Active Visitors
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.status.success,
              fontWeight: 700
            }}>
              {stats.active_visitors}
            </div>
          </div>

          <div style={{ 
            ...cardStyles.base,
            padding: spacing.xl,
            backgroundColor: 'white',
            border: `2px solid ${colors.status.warning}`,
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <div style={{ 
              ...typography.label,
              color: colors.neutral[600], 
              marginBottom: spacing.xs,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              <span className="status-dot status-dot-warning" />
              🔄 Frequent Visitors
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.status.warning,
              fontWeight: 700
            }}>
              {stats.frequent_visitors}
            </div>
          </div>

          <div style={{ 
            ...cardStyles.base,
            padding: spacing.xl,
            backgroundColor: 'white',
            border: `2px solid ${colors.status.normal}`,
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <div style={{ 
              ...typography.label,
              color: colors.neutral[600], 
              marginBottom: spacing.xs,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              <span className="status-dot status-dot-normal" />
              🆕 New This Month
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.status.normal,
              fontWeight: 700
            }}>
              {stats.new_visitors_this_month}
            </div>
          </div>
        </StatsGrid>
      )}

      {/* Filters and Search */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.lg,
        marginBottom: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
              Search Visitors
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone, or company..."
              style={{
                width: '100%',
                padding: spacing.sm,
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div>
            <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              style={{
                padding: spacing.sm,
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '14px'
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
          </div>
          
          <div>
            <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: spacing.sm,
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '14px'
              }}
            >
              <option value="last_visit">Last Visit</option>
              <option value="visits">Visit Count</option>
              <option value="name">Name</option>
            </select>
          </div>
          
          <div>
            <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              style={{
                padding: spacing.sm,
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '14px'
              }}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visitors List */}
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
          👥 Visitor Database ({filteredVisitors.length} visitors)
        </h3>
        
        <div style={{ display: 'grid', gap: spacing.lg }}>
          {filteredVisitors.map((visitor) => (
            <div
              key={visitor.id}
              style={{
                padding: spacing.lg,
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                backgroundColor: '#F9FAFB',
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
                  <h4 style={{ 
                    ...typography.subheader,
                    marginBottom: spacing.xs,
                    color: colors.neutral[900]
                  }}>
                    {visitor.name}
                  </h4>
                  <p style={{ 
                    ...typography.bodySmall,
                    color: colors.neutral[600],
                    marginBottom: spacing.xs
                  }}>
                    📞 {visitor.phone}
                  </p>
                  {visitor.company && (
                    <p style={{ 
                      ...typography.bodySmall,
                      color: colors.neutral[600],
                      marginBottom: spacing.sm
                    }}>
                      🏢 {visitor.company}
                    </p>
                  )}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: spacing.sm,
                  alignItems: 'center'
                }}>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: visitor.status === 'active' ? colors.status.success : 
                                   visitor.status === 'inactive' ? colors.status.warning : colors.status.error,
                    color: 'white',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}>
                    {visitor.status}
                  </span>
                </div>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: spacing.sm,
                marginBottom: spacing.md
              }}>
                <div>
                  <span style={{ color: colors.neutral[600], fontSize: '14px' }}>Total Visits:</span>
                  <span style={{ fontWeight: 600, marginLeft: spacing.xs }}>{visitor.total_visits}</span>
                </div>
                <div>
                  <span style={{ color: colors.neutral[600], fontSize: '14px' }}>Last Visit:</span>
                  <span style={{ fontWeight: 600, marginLeft: spacing.xs }}>
                    {new Date(visitor.last_visit).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div>
                  <span style={{ color: colors.neutral[600], fontSize: '14px' }}>Common Purpose:</span>
                  <span style={{ fontWeight: 600, marginLeft: spacing.xs, textTransform: 'capitalize' }}>
                    {visitor.most_common_purpose}
                  </span>
                </div>
                <div>
                  <span style={{ color: colors.neutral[600], fontSize: '14px' }}>Avg Duration:</span>
                  <span style={{ fontWeight: 600, marginLeft: spacing.xs }}>{visitor.average_duration}</span>
                </div>
              </div>
              
              {visitor.notes && (
                <div style={{ 
                  marginBottom: spacing.md,
                  padding: spacing.sm,
                  backgroundColor: colors.neutral[100],
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: colors.neutral[700]
                }}>
                  <strong>Notes:</strong> {visitor.notes}
                </div>
              )}
              
              <div style={{ 
                display: 'flex', 
                gap: spacing.sm,
                justifyContent: 'flex-end'
              }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const newStatus = prompt('Update status (active/inactive/blacklisted):', visitor.status);
                    if (newStatus && ['active', 'inactive', 'blacklisted'].includes(newStatus)) {
                      updateVisitorStatus(visitor.id, newStatus);
                    }
                  }}
                  icon="✏️"
                >
                  Update Status
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={() => {
                    const note = prompt('Add a note for this visitor:', visitor.notes || '');
                    if (note !== null) {
                      addVisitorNote(visitor.id, note);
                    }
                  }}
                  icon="📝"
                >
                  Add Note
                </Button>
                
                <Button
                  variant="primary"
                  onClick={() => {
                    // Navigate to create pass with pre-filled visitor data
                    navigate('/app/gate-pass/create-visitor', {
                      state: { 
                        visitor: {
                          name: visitor.name,
                          phone: visitor.phone,
                          company: visitor.company
                        }
                      }
                    });
                  }}
                  icon="🚀"
                >
                  Create Pass
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {filteredVisitors.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: colors.neutral[600]
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
              No visitors found
            </div>
            <div>
              Try adjusting your search or filter criteria
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



