// src/pages/InspectionsCompleted.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/layouts/AppShell";
import { useAuth } from "@/providers/useAuth";
import { colors, typography, spacing, borderRadius, shadows } from "@/lib/theme";
import { ChevronLeft, ChevronRight, Search, FileText, Calendar, User, Car, Star, AlertCircle } from "lucide-react";

type Row = {
  id: string;
  inspection_number?: string;
  status: string;
  created_at: string;
  vehicle_registration?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  inspector_name?: string;
  template_name?: string;
  overall_rating?: number;
  purchase_recommendation?: string;
};

type Meta = { current_page: number; last_page: number; total: number; per_page: number };
type Resp = { data: Row[]; meta?: Meta; current_page?: number; last_page?: number; total?: number };

export default function InspectionsCompleted() {
  const { fetchJson } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Meta | undefined>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(undefined);
      try {
        const json = await fetchJson<any>(`/v1/inspections?status=completed&per_page=20&page=${page}`);
        
        // Handle Laravel paginated response format: { success: true, data: { data: [...], meta: {...} } }
        const paginatedData = json.data || json;
        const data = paginatedData.data || paginatedData || [];
        const paginationMeta = paginatedData.meta || (paginatedData.current_page ? {
          current_page: paginatedData.current_page,
          last_page: paginatedData.last_page || 1,
          total: paginatedData.total || (Array.isArray(data) ? data.length : 0),
          per_page: paginatedData.per_page || 20
        } : undefined);
        
        // Transform inspection data to match Row type
        const transformedData = Array.isArray(data) ? data.map((item: any) => ({
          id: item.id,
          inspection_number: item.inspection_number || item.id,
          status: item.status,
          created_at: item.created_at,
          vehicle_registration: item.vehicle?.registration_number || item.vehicle_registration,
          vehicle_make: item.vehicle?.make || item.vehicle_make,
          vehicle_model: item.vehicle?.model || item.vehicle_model,
          inspector_name: item.inspector?.name || item.inspector_name,
          template_name: item.template_name,
          overall_rating: item.overall_rating || item.overall_vehicle_rating,
          purchase_recommendation: item.purchase_recommendation
        })) : [];
        
        setRows(transformedData);
        setMeta(paginationMeta);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e));
        setRows([]);
        setMeta(undefined);
      } finally {
        setLoading(false);
      }
    })();
  }, [page, fetchJson]);

  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter(r => 
      (r.vehicle_registration?.toLowerCase().includes(term)) ||
      (r.vehicle_make?.toLowerCase().includes(term)) ||
      (r.vehicle_model?.toLowerCase().includes(term)) ||
      (r.inspector_name?.toLowerCase().includes(term)) ||
      (r.id?.toLowerCase().includes(term))
    );
  }, [rows, searchTerm]);

  const canPrev = (meta?.current_page ?? page) > 1;
  const canNext = meta ? meta.current_page < meta.last_page : false;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.status.success;
      case 'approved': return colors.status.success;
      case 'rejected': return colors.status.critical;
      case 'in_progress': return colors.status.warning;
      default: return colors.neutral[500];
    }
  };

  const getRecommendationBadge = (recommendation?: string) => {
    if (!recommendation) return null;
    const colors_map: Record<string, string> = {
      'highly_recommended': colors.status.success,
      'recommended': colors.status.success,
      'conditional': colors.status.warning,
      'not_recommended': colors.status.critical,
    };
    const labels: Record<string, string> = {
      'highly_recommended': 'Highly Recommended',
      'recommended': 'Recommended',
      'conditional': 'Conditional',
      'not_recommended': 'Not Recommended',
    };
    const color = colors_map[recommendation] || colors.neutral[500];
    const label = labels[recommendation] || recommendation;
    
    return (
      <span style={{
        padding: `${parseInt(spacing.xs)}px ${parseInt(spacing.sm)}px`,
        borderRadius: borderRadius.sm,
        backgroundColor: `${color}15`,
        color: color,
        fontSize: '12px',
        fontWeight: 600,
        textTransform: 'capitalize' as const
      }}>
        {label}
      </span>
    );
  };

  return (
    <AppShell>
      <div style={{
        padding: spacing.xl,
        background: colors.background.neutral,
        minHeight: '100vh'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: spacing.xl,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap' as const,
          gap: spacing.md
        }}>
          <div>
            <h1 style={{
              ...typography.header,
              fontSize: '32px',
              marginBottom: spacing.xs,
              color: colors.neutral[900]
            }}>
              Completed Inspections
            </h1>
            <p style={{
              ...typography.bodySmall,
              color: colors.neutral[600]
            }}>
              {meta ? (
                <>Showing {((meta.current_page - 1) * meta.per_page) + 1} - {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} inspections</>
              ) : (
                <>Browse all completed vehicle inspections</>
              )}
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            gap: spacing.md,
            alignItems: 'center'
          }}>
            <button
              onClick={() => navigate('/app/inspections')}
              style={{
                padding: `${parseInt(spacing.sm)}px ${parseInt(spacing.md)}px`,
                borderRadius: borderRadius.md,
                border: `1.5px solid ${colors.neutral[300]}`,
                background: 'white',
                color: colors.neutral[700],
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.color = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.neutral[300];
                e.currentTarget.style.color = colors.neutral[700];
              }}
            >
              <ChevronLeft size={16} />
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{
          background: 'white',
          padding: spacing.lg,
          borderRadius: borderRadius.lg,
          boxShadow: shadows.md,
          marginBottom: spacing.lg,
          display: 'flex',
          gap: spacing.md,
          alignItems: 'center',
          flexWrap: 'wrap' as const
        }}>
          <div style={{
            position: 'relative',
            flex: '1 1 300px',
            minWidth: '250px'
          }}>
            <Search 
              size={18} 
              style={{
                position: 'absolute',
                left: `${parseInt(spacing.md)}px`,
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.neutral[400],
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              placeholder="Search by vehicle, inspector, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: `${parseInt(spacing.md)}px ${parseInt(spacing.md)}px ${parseInt(spacing.md)}px ${parseInt(spacing.xl) * 2}px`,
                border: `1.5px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                fontSize: '14px',
                color: colors.neutral[900],
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.boxShadow = `0 0 0 4px ${colors.primary}15`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.neutral[300];
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Error Message */}
        {err && (
          <div style={{
            background: `${colors.status.error}10`,
            border: `1px solid ${colors.status.error}30`,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.lg,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            color: colors.status.error
          }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>
              Error: {err}
            </span>
          </div>
        )}

        {/* Table Card */}
        <div style={{
          background: 'white',
          borderRadius: borderRadius.lg,
          boxShadow: shadows.md,
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse' as const
            }}>
              <thead>
                <tr style={{
                  background: colors.neutral[50],
                  borderBottom: `2px solid ${colors.neutral[200]}`
                }}>
                  {['Date', 'Vehicle', 'Registration', 'Inspector', 'Rating', 'Recommendation', 'Status'].map((header) => (
                    <th key={header} style={{
                      padding: `${parseInt(spacing.md)}px ${parseInt(spacing.lg)}px`,
                      textAlign: 'left' as const,
                      ...typography.label,
                      fontSize: '12px',
                      color: colors.neutral[600],
                      fontWeight: 600,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.05em'
                    }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && filteredRows.length === 0 && (
                  <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={`skeleton-${i}`}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={`skeleton-${i}-${j}`} style={{ padding: spacing.md }}>
                            <div style={{
                              height: '20px',
                              backgroundColor: colors.neutral[200],
                              borderRadius: '4px',
                              animation: 'pulse 1.5s ease-in-out infinite',
                              animationDelay: `${(i * 7 + j) * 0.1}s`,
                            }} />
                          </td>
                        ))}
                      </tr>
                    ))}
                    <style>{`
                      @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                      }
                    `}</style>
                  </>
                )}

                {!loading && filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{
                      padding: `${parseInt(spacing.xxl)}px`,
                      textAlign: 'center' as const,
                      color: colors.neutral[500]
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.md }}>
                        <FileText size={48} style={{ color: colors.neutral[300] }} />
                        <div>
                          <div style={{ ...typography.subheader, fontSize: '18px', marginBottom: spacing.xs }}>
                            No inspections found
                          </div>
                          <div style={{ ...typography.bodySmall }}>
                            {searchTerm ? 'Try adjusting your search terms' : 'No completed inspections available'}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {filteredRows.map((r) => {
                  const date = r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'N/A';
                  
                  return (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: `1px solid ${colors.neutral[200]}`,
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.neutral[50];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                      }}
                      onClick={() => navigate(`/app/inspections/${r.id}`)}
                    >
                      <td style={{
                        padding: `${parseInt(spacing.md)}px ${parseInt(spacing.lg)}px`,
                        ...typography.bodySmall,
                        color: colors.neutral[700],
                        whiteSpace: 'nowrap' as const
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                          <Calendar size={14} style={{ color: colors.neutral[400] }} />
                          {date}
                        </div>
                      </td>
                      <td style={{
                        padding: `${parseInt(spacing.md)}px ${parseInt(spacing.lg)}px`,
                        ...typography.body,
                        color: colors.neutral[900],
                        fontWeight: 500
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                          <Car size={16} style={{ color: colors.neutral[400] }} />
                          <span>{r.vehicle_make || 'N/A'} {r.vehicle_model || ''}</span>
                        </div>
                      </td>
                      <td style={{
                        padding: `${parseInt(spacing.md)}px ${parseInt(spacing.lg)}px`,
                        ...typography.body,
                        color: colors.neutral[700],
                        fontFamily: 'monospace',
                        fontWeight: 600
                      }}>
                        {r.vehicle_registration || 'N/A'}
                      </td>
                      <td style={{
                        padding: `${parseInt(spacing.md)}px ${parseInt(spacing.lg)}px`,
                        ...typography.bodySmall,
                        color: colors.neutral[700]
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                          <User size={14} style={{ color: colors.neutral[400] }} />
                          {r.inspector_name || 'N/A'}
                        </div>
                      </td>
                      <td style={{
                        padding: `${parseInt(spacing.md)}px ${parseInt(spacing.lg)}px`
                      }}>
                        {r.overall_rating ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                            <Star 
                              size={16} 
                              style={{ 
                                color: r.overall_rating >= 4 ? colors.status.success : r.overall_rating >= 3 ? colors.status.warning : colors.status.critical,
                                fill: r.overall_rating >= 4 ? colors.status.success : r.overall_rating >= 3 ? colors.status.warning : colors.status.critical
                              }} 
                            />
                            <span style={{
                              ...typography.body,
                              fontWeight: 600,
                              color: colors.neutral[900]
                            }}>
                              {r.overall_rating}/5
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: colors.neutral[400] }}>—</span>
                        )}
                      </td>
                      <td style={{
                        padding: `${parseInt(spacing.md)}px ${parseInt(spacing.lg)}px`
                      }}>
                        {getRecommendationBadge(r.purchase_recommendation)}
                      </td>
                      <td style={{
                        padding: `${parseInt(spacing.md)}px ${parseInt(spacing.lg)}px`
                      }}>
                        <span style={{
                          padding: `${parseInt(spacing.xs)}px ${parseInt(spacing.sm)}px`,
                          borderRadius: borderRadius.sm,
                          backgroundColor: `${getStatusColor(r.status)}15`,
                          color: getStatusColor(r.status),
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'capitalize' as const
                        }}>
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div style={{
            marginTop: spacing.lg,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap' as const,
            gap: spacing.md
          }}>
            <div style={{
              ...typography.bodySmall,
              color: colors.neutral[600]
            }}>
              Page {meta.current_page} of {meta.last_page}
            </div>
            
            <div style={{
              display: 'flex',
              gap: spacing.sm
            }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!canPrev || loading}
                style={{
                  padding: `${parseInt(spacing.sm)}px ${parseInt(spacing.md)}px`,
                  borderRadius: borderRadius.md,
                  border: `1.5px solid ${colors.neutral[300]}`,
                  background: (!canPrev || loading) ? colors.neutral[100] : 'white',
                  color: (!canPrev || loading) ? colors.neutral[400] : colors.neutral[700],
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: (!canPrev || loading) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  transition: 'all 0.2s ease',
                  opacity: (!canPrev || loading) ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (canPrev && !loading) {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.color = colors.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (canPrev && !loading) {
                    e.currentTarget.style.borderColor = colors.neutral[300];
                    e.currentTarget.style.color = colors.neutral[700];
                  }
                }}
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!canNext || loading}
                style={{
                  padding: `${parseInt(spacing.sm)}px ${parseInt(spacing.md)}px`,
                  borderRadius: borderRadius.md,
                  border: `1.5px solid ${colors.neutral[300]}`,
                  background: (!canNext || loading) ? colors.neutral[100] : 'white',
                  color: (!canNext || loading) ? colors.neutral[400] : colors.neutral[700],
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: (!canNext || loading) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  transition: 'all 0.2s ease',
                  opacity: (!canNext || loading) ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (canNext && !loading) {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.color = colors.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (canNext && !loading) {
                    e.currentTarget.style.borderColor = colors.neutral[300];
                    e.currentTarget.style.color = colors.neutral[700];
                  }
                }}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AppShell>
  );
}
