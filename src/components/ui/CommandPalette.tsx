import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  ClipboardList, 
  FileText, 
  DollarSign, 
  Car, 
  User,
  Search,
  ArrowUp,
  ArrowDown,
  Loader2
} from 'lucide-react';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';
import { useCommandPalette, type SearchResult } from '../../hooks/useCommandPalette';
import { useGatePasses } from '../../lib/queries';
import { apiClient } from '../../lib/apiClient';

// Simple fuzzy search function
function fuzzyMatch(query: string, text: string): boolean {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  return textLower.includes(queryLower);
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Recent searches management
function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem('voms_recent_searches');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(query: string): void {
  if (!query.trim()) return;
  const recent = getRecentSearches();
  const updated = [query, ...recent.filter(s => s !== query)].slice(0, 5);
  localStorage.setItem('voms_recent_searches', JSON.stringify(updated));
}

export function CommandPalette() {
  const { isOpen, close, handleSelect } = useCommandPalette();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Search function
  useEffect(() => {
    if (!debouncedQuery.trim() || !isOpen) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    const search = async () => {
      try {
        const allResults: SearchResult[] = [];

        // Search Gate Passes
        try {
          const gatePassRes = await apiClient.get('/visitor-gate-passes', {
            params: { per_page: 10 },
            suppressErrorLog: true
          });
          const gatePasses = Array.isArray(gatePassRes.data) 
            ? gatePassRes.data 
            : (gatePassRes.data as any)?.data || [];
          
          gatePasses.forEach((pass: any) => {
            const title = pass.visitor_name || pass.name || `Pass ${pass.id}`;
            if (fuzzyMatch(debouncedQuery, title)) {
              allResults.push({
                id: `gate-pass-${pass.id}`,
                type: 'gate-pass',
                title,
                subtitle: `Visitor Pass #${pass.id}`,
                icon: ClipboardList,
                path: `/app/gate-pass/${pass.id}`
              });
            }
          });
        } catch (e) {
          // Silently fail
        }

        // Search Inspections
        try {
          const inspectionRes = await apiClient.get('/v1/inspections', {
            params: { per_page: 10 },
            suppressErrorLog: true
          });
          const inspections = Array.isArray(inspectionRes.data)
            ? inspectionRes.data
            : (inspectionRes.data as any)?.data || [];
          
          inspections.forEach((inspection: any) => {
            const title = inspection.vehicle?.registration_number || inspection.template?.name || `Inspection ${inspection.id}`;
            if (fuzzyMatch(debouncedQuery, title)) {
              allResults.push({
                id: `inspection-${inspection.id}`,
                type: 'inspection',
                title,
                subtitle: `Inspection #${inspection.id}`,
                icon: FileText,
                path: `/app/inspections/${inspection.id}`
              });
            }
          });
        } catch (e) {
          // Silently fail
        }

        // Search Expenses
        try {
          const expenseRes = await apiClient.get('/v1/expenses', {
            params: { per_page: 10 },
            suppressErrorLog: true
          });
          const expenses = Array.isArray(expenseRes.data)
            ? expenseRes.data
            : (expenseRes.data as any)?.items || [];
          
          expenses.forEach((expense: any) => {
            const title = expense.description || expense.category || `Expense ${expense.id}`;
            if (fuzzyMatch(debouncedQuery, title)) {
              allResults.push({
                id: `expense-${expense.id}`,
                type: 'expense',
                title,
                subtitle: `₹${expense.amount || 0}`,
                icon: DollarSign,
                path: `/app/expenses/${expense.id}`
              });
            }
          });
        } catch (e) {
          // Silently fail
        }

        // Search Vehicles
        try {
          const vehicleRes = await apiClient.get('/v1/vehicles', {
            params: { per_page: 10 },
            suppressErrorLog: true
          });
          const vehicles = Array.isArray(vehicleRes.data)
            ? vehicleRes.data
            : (vehicleRes.data as any)?.data || [];
          
          vehicles.forEach((vehicle: any) => {
            const title = vehicle.registration_number || vehicle.chassis_number || `Vehicle ${vehicle.id}`;
            if (fuzzyMatch(debouncedQuery, title)) {
              allResults.push({
                id: `vehicle-${vehicle.id}`,
                type: 'vehicle',
                title,
                subtitle: vehicle.model || 'Vehicle',
                icon: Car,
                path: `/app/vehicles/${vehicle.id}`
              });
            }
          });
        } catch (e) {
          // Silently fail
        }

        // Search Users
        try {
          const userRes = await apiClient.get('/v1/users', {
            params: { per_page: 10 },
            suppressErrorLog: true
          });
          const users = Array.isArray(userRes.data)
            ? userRes.data
            : (userRes.data as any)?.data || [];
          
          users.forEach((user: any) => {
            const title = user.name || user.email || `User ${user.id}`;
            if (fuzzyMatch(debouncedQuery, title)) {
              allResults.push({
                id: `user-${user.id}`,
                type: 'user',
                title,
                subtitle: user.email || user.role || 'User',
                icon: User,
                path: `/app/admin/users/${user.id}`
              });
            }
          });
        } catch (e) {
          // Silently fail
        }

        setResults(allResults.slice(0, 20)); // Limit to 20 results
        setIsSearching(false);
      } catch (error) {
        setIsSearching(false);
        setResults([]);
      }
    };

    search();
  }, [debouncedQuery, isOpen]);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        addRecentSearch(query);
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, query, handleSelect]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const recentSearches = getRecentSearches();
  const showRecentSearches = !query.trim() && recentSearches.length > 0;

  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          close();
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          backgroundColor: 'white',
          borderRadius: borderRadius.lg,
          boxShadow: shadows.xl,
          overflow: 'hidden',
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
            borderBottom: `1px solid ${colors.neutral[200]}`,
          }}
        >
          <Search style={{ width: '20px', height: '20px', color: colors.neutral[500], flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search gate passes, inspections, expenses..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              fontFamily: typography.body.fontFamily,
              color: colors.neutral[900],
            }}
          />
          {isSearching && (
            <Loader2 style={{ width: '20px', height: '20px', color: colors.neutral[500], animation: 'spin 1s linear infinite' }} />
          )}
        </div>

        {/* Results */}
        <div
          ref={resultsRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: '60vh',
          }}
        >
          {showRecentSearches ? (
            <div style={{ padding: spacing.md }}>
              <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.sm }}>
                Recent Searches
              </div>
              {recentSearches.map((search, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setQuery(search);
                    inputRef.current?.focus();
                  }}
                  style={{
                    padding: spacing.md,
                    cursor: 'pointer',
                    borderRadius: borderRadius.md,
                    marginBottom: spacing.xs,
                    backgroundColor: colors.neutral[50],
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.neutral[100];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.neutral[50];
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                    <Search style={{ width: '16px', height: '16px', color: colors.neutral[500] }} />
                    <span style={{ ...typography.body, color: colors.neutral[700] }}>{search}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div style={{ padding: spacing.sm }}>
              {results.map((result, index) => {
                const Icon = result.icon;
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={result.id}
                    onClick={() => {
                      addRecentSearch(query);
                      handleSelect(result);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.md,
                      cursor: 'pointer',
                      borderRadius: borderRadius.md,
                      marginBottom: spacing.xs,
                      backgroundColor: isSelected ? colors.primary + '15' : 'transparent',
                      border: isSelected ? `1px solid ${colors.primary}` : '1px solid transparent',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = colors.neutral[50];
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: borderRadius.md,
                        backgroundColor: colors.neutral[100],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon style={{ width: '20px', height: '20px', color: colors.primary }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ ...typography.body, fontWeight: 600, color: colors.neutral[900], marginBottom: spacing.xs }}>
                        {result.title}
                      </div>
                      <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                        {result.subtitle}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : query.trim() && !isSearching ? (
            <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.neutral[600] }}>
              <div style={{ ...typography.body }}>No results found</div>
              <div style={{ ...typography.bodySmall, marginTop: spacing.sm }}>
                Try a different search term
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: spacing.md,
            borderTop: `1px solid ${colors.neutral[200]}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            ...typography.bodySmall,
            color: colors.neutral[600],
          }}
        >
          <div style={{ display: 'flex', gap: spacing.md }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <ArrowUp style={{ width: '14px', height: '14px' }} />
              <ArrowDown style={{ width: '14px', height: '14px' }} />
              <span>Navigate</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <span>Enter</span>
              <span>Select</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            <span>Esc</span>
            <span>Close</span>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
}

