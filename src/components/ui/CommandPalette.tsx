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
  Loader2,
  Plus,
  Settings,
  BarChart3,
  Calendar,
  Users,
  Package,
  Wrench,
  Shield,
  TrendingUp,
  Receipt,
  MapPin,
  CheckSquare,
  FileCheck,
  AlertCircle,
  Bell,
  Activity,
  Key
} from 'lucide-react';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';
import { useCommandPalette, type SearchResult } from '../../hooks/useCommandPalette';
import { useGatePasses } from '../../lib/queries';
import { apiClient } from '../../lib/apiClient';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { generateBreadcrumbs } from '../../lib/breadcrumbUtils';

// Enhanced fuzzy search function with improved scoring
function fuzzyMatch(query: string, text: string): { match: boolean; score: number } {
  const queryLower = query.toLowerCase().trim();
  const textLower = text.toLowerCase();
  
  if (!queryLower) return { match: true, score: 0 };
  
  // Exact match gets highest score
  if (textLower === queryLower) return { match: true, score: 100 };
  
  // Starts with query gets very high score
  if (textLower.startsWith(queryLower)) return { match: true, score: 90 };
  
  // Word boundary match (starts with word) gets high score
  const words = textLower.split(/\s+/);
  const wordMatch = words.some(word => word.startsWith(queryLower));
  if (wordMatch) return { match: true, score: 75 };
  
  // Contains query as substring gets medium-high score
  if (textLower.includes(queryLower)) return { match: true, score: 60 };
  
  // Fuzzy match: check if all characters in query appear in order
  let queryIndex = 0;
  let consecutiveMatches = 0;
  let maxConsecutive = 0;
  
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
      consecutiveMatches++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
    } else {
      consecutiveMatches = 0;
    }
  }
  
  if (queryIndex === queryLower.length) {
    // Score based on how many consecutive matches we found
    const baseScore = 30;
    const consecutiveBonus = Math.min(maxConsecutive * 5, 20);
    return { match: true, score: baseScore + consecutiveBonus };
  }
  
  // Check if query words appear in text (even if not in order)
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
  const matchedWords = queryWords.filter(qw => 
    words.some(w => w.includes(qw))
  );
  if (matchedWords.length === queryWords.length && matchedWords.length > 0) {
    return { match: true, score: 25 };
  }
  
  return { match: false, score: 0 };
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
  const containerRef = useRef<HTMLDivElement>(null);

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
          const gatePassRes = await apiClient.get('/v2/gate-passes', {
            params: { per_page: 10 },
            suppressErrorLog: true
          });
          
          // Extract visitor passes from unified response
          const allPasses = gatePassRes.data?.data || gatePassRes.data || [];
          const visitorPasses = allPasses.filter((p: any) => p.pass_type === 'visitor');
          
          visitorPasses.forEach((pass: any) => {
            const title = pass.visitor_name || pass.name || `Pass ${pass.id}`;
            const match = fuzzyMatch(debouncedQuery, title);
            if (match.match) {
              allResults.push({
                id: `gate-pass-${pass.id}`,
                type: 'gate-pass',
                title,
                subtitle: `Visitor Pass #${pass.id}`,
                icon: ClipboardList,
                path: `/app/gate-pass/${pass.id}`,
                score: match.score
              } as any);
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
            const match = fuzzyMatch(debouncedQuery, title);
            if (match.match) {
              allResults.push({
                id: `inspection-${inspection.id}`,
                type: 'inspection',
                title,
                subtitle: `Inspection #${inspection.id}`,
                icon: FileText,
                path: `/app/inspections/${inspection.id}`,
                score: match.score
              } as any);
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
            const match = fuzzyMatch(debouncedQuery, title);
            if (match.match) {
              allResults.push({
                id: `expense-${expense.id}`,
                type: 'expense',
                title,
                subtitle: `₹${expense.amount || 0}`,
                icon: DollarSign,
                path: `/app/expenses/${expense.id}`,
                score: match.score
              } as any);
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
            const match = fuzzyMatch(debouncedQuery, title);
            if (match.match) {
              allResults.push({
                id: `vehicle-${vehicle.id}`,
                type: 'vehicle',
                title,
                subtitle: vehicle.model || 'Vehicle',
                icon: Car,
                path: `/app/vehicles/${vehicle.id}`,
                score: match.score
              } as any);
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

        // Add comprehensive route-based search results with breadcrumb integration
        const allRoutes: Array<{ title: string; subtitle: string; icon: any; path: string; keywords: string[] }> = [
          // Main Dashboard
          { title: 'Dashboard', subtitle: 'Main dashboard', icon: BarChart3, path: '/dashboard', keywords: ['dashboard', 'home', 'main'] },
          
          // Gate Pass Routes
          { title: 'Gate Pass', subtitle: 'Gate pass management', icon: ClipboardList, path: '/app/gate-pass', keywords: ['gate pass', 'gatepass', 'visitor'] },
          { title: 'Create Gate Pass', subtitle: 'New gate pass', icon: Plus, path: '/app/gate-pass/create', keywords: ['create pass', 'new pass', 'gate pass', 'visitor', 'vehicle'] },
          { title: 'Guard Register', subtitle: 'Guard registration', icon: Shield, path: '/app/gate-pass/guard-register', keywords: ['guard', 'register', 'security'] },
          { title: 'Gate Pass Reports', subtitle: 'View gate pass reports', icon: FileText, path: '/app/gate-pass/reports', keywords: ['reports', 'gate pass reports'] },
          { title: 'Pass Templates', subtitle: 'Manage pass templates', icon: FileCheck, path: '/app/gate-pass/templates', keywords: ['templates', 'pass templates'] },
          { title: 'Visitor Management', subtitle: 'Manage visitors', icon: Users, path: '/app/gate-pass/visitors', keywords: ['visitors', 'visitor management'] },
          { title: 'Gate Pass Calendar', subtitle: 'View calendar', icon: Calendar, path: '/app/gate-pass/calendar', keywords: ['calendar', 'schedule'] },
          { title: 'Scan & Validate', subtitle: 'Quick validation for guards', icon: CheckSquare, path: '/app/gate-pass/scan', keywords: ['validation', 'validate', 'qr', 'scan', 'guard'] },
          { title: 'Pass Approval', subtitle: 'Approve passes', icon: Shield, path: '/app/gate-pass/approval', keywords: ['approval', 'approve'] },
          { title: 'Bulk Operations', subtitle: 'Bulk gate pass operations', icon: Package, path: '/app/gate-pass/bulk', keywords: ['bulk', 'bulk operations'] },
          
          // Inspection Routes
          { title: 'Inspections', subtitle: 'Vehicle inspections', icon: FileText, path: '/app/inspections', keywords: ['inspections', 'inspection'] },
          { title: 'Inspection Studio', subtitle: 'Create inspection templates', icon: Wrench, path: '/app/inspections/studio', keywords: ['studio', 'templates', 'inspection templates'] },
          { title: 'Sync Center', subtitle: 'Inspection sync center', icon: Activity, path: '/app/inspections/sync', keywords: ['sync', 'synchronize'] },
          { title: 'Completed Inspections', subtitle: 'View completed inspections', icon: CheckSquare, path: '/app/inspections/completed', keywords: ['completed', 'finished'] },
          { title: 'Inspection Reports', subtitle: 'View inspection reports', icon: FileText, path: '/app/inspections/reports', keywords: ['reports', 'inspection reports'] },
          { title: 'New Inspection', subtitle: 'Start new inspection', icon: Plus, path: '/app/inspections/new', keywords: ['new inspection', 'create inspection', 'start inspection'] },
          
          // Expense Routes
          { title: 'Expenses', subtitle: 'Expense management', icon: DollarSign, path: '/app/expenses', keywords: ['expenses', 'expense'] },
          { title: 'Create Expense', subtitle: 'New expense', icon: Plus, path: '/app/expenses/create', keywords: ['create expense', 'new expense'] },
          { title: 'Expense History', subtitle: 'View expense history', icon: Calendar, path: '/app/expenses/history', keywords: ['history', 'expense history'] },
          { title: 'Asset Management', subtitle: 'Manage assets', icon: Package, path: '/app/expenses/assets', keywords: ['assets', 'asset management'] },
          { title: 'Project Management', subtitle: 'Manage projects', icon: BarChart3, path: '/app/expenses/projects', keywords: ['projects', 'project management'] },
          { title: 'Cashflow Analysis', subtitle: 'Cashflow dashboard', icon: TrendingUp, path: '/app/expenses/cashflow', keywords: ['cashflow', 'cash flow', 'analysis'] },
          { title: 'Expense Approval', subtitle: 'Approve expenses', icon: Shield, path: '/app/expenses/approval', keywords: ['approval', 'expense approval'] },
          { title: 'Expense Reports', subtitle: 'View expense reports', icon: FileText, path: '/app/expenses/reports', keywords: ['reports', 'expense reports', 'analytics'] },
          { title: 'Accounts Dashboard', subtitle: 'Accounts overview', icon: BarChart3, path: '/app/expenses/accounts', keywords: ['accounts', 'accounting'] },
          { title: 'Receipts Gallery', subtitle: 'View receipts', icon: Receipt, path: '/app/expenses/receipts', keywords: ['receipts', 'receipt'] },
          
          // Stockyard Routes
          { title: 'Stockyard', subtitle: 'Stockyard management', icon: Package, path: '/app/stockyard', keywords: ['stockyard', 'yard'] },
          { title: 'Create Movement', subtitle: 'Create stockyard movement', icon: Plus, path: '/app/stockyard/create', keywords: ['create movement', 'new movement'] },
          { title: 'Scan Component', subtitle: 'Scan component', icon: Search, path: '/app/stockyard/scan', keywords: ['scan', 'component scan'] },
          { title: 'Component Ledger', subtitle: 'Component ledger', icon: FileText, path: '/app/stockyard/components', keywords: ['components', 'ledger', 'component ledger'] },
          { title: 'Create Component', subtitle: 'New component', icon: Plus, path: '/app/stockyard/components/create', keywords: ['create component', 'new component'] },
          { title: 'Transfer Approvals', subtitle: 'Component transfer approvals', icon: Shield, path: '/app/stockyard/components/transfers/approvals', keywords: ['transfers', 'transfer approvals'] },
          { title: 'Cost Analysis', subtitle: 'Component cost analysis', icon: TrendingUp, path: '/app/stockyard/components/cost-analysis', keywords: ['cost', 'cost analysis'] },
          { title: 'Component Health', subtitle: 'Component health dashboard', icon: Activity, path: '/app/stockyard/components/health', keywords: ['health', 'component health'] },
          { title: 'Buyer Readiness', subtitle: 'Buyer readiness board', icon: CheckSquare, path: '/app/stockyard/buyer-readiness', keywords: ['buyer', 'readiness'] },
          { title: 'Stockyard Alerts', subtitle: 'Stockyard alerts', icon: AlertCircle, path: '/app/stockyard/alerts', keywords: ['alerts', 'stockyard alerts'] },
          
          // User Management Routes
          { title: 'User Management', subtitle: 'Manage users', icon: Users, path: '/app/admin/users', keywords: ['users', 'user management', 'admin'] },
          { title: 'User Activity', subtitle: 'User activity logs', icon: Activity, path: '/app/admin/users/activity', keywords: ['activity', 'logs', 'user activity'] },
          { title: 'Capability Matrix', subtitle: 'User capabilities', icon: Key, path: '/app/admin/users/capability-matrix', keywords: ['capabilities', 'permissions', 'matrix'] },
          { title: 'Bulk User Operations', subtitle: 'Bulk user operations', icon: Package, path: '/app/admin/users/bulk-operations', keywords: ['bulk', 'bulk users'] },
          
          // Alerts & Notifications
          { title: 'Alerts', subtitle: 'System alerts', icon: AlertCircle, path: '/app/alerts', keywords: ['alerts', 'alert'] },
          { title: 'Notifications', subtitle: 'View notifications', icon: Bell, path: '/app/notifications', keywords: ['notifications', 'notification'] },
        ];
        
        // Generate route results with fuzzy matching and breadcrumb integration
        const routeResults: SearchResult[] = allRoutes
          .map(route => {
            // Search in title, subtitle, and keywords
            const titleMatch = fuzzyMatch(debouncedQuery, route.title);
            const subtitleMatch = fuzzyMatch(debouncedQuery, route.subtitle);
            const keywordMatches = route.keywords.map(kw => fuzzyMatch(debouncedQuery, kw));
            const bestKeywordMatch = keywordMatches.reduce((best, match) => 
              match.score > best.score ? match : best, { match: false, score: 0 }
            );
            
            // Use the best match score
            const bestScore = Math.max(
              titleMatch.score,
              subtitleMatch.score * 0.7, // Subtitle matches are weighted less
              bestKeywordMatch.score * 0.8 // Keyword matches are weighted less
            );
            
            // Generate breadcrumb path for subtitle
            const breadcrumbs = generateBreadcrumbs(route.path);
            const breadcrumbPath = breadcrumbs.length > 1 
              ? breadcrumbs.slice(1).map(b => b.label).join(' > ')
              : route.subtitle;
            
            return {
              id: `route-${route.path}`,
              type: 'route' as any,
              title: route.title,
              subtitle: breadcrumbPath,
              icon: route.icon,
              path: route.path,
              score: bestScore
            } as any;
          })
          .filter(r => r.score > 0);

        // Combine and sort by score
        const combined = [...allResults, ...routeResults];
        combined.sort((a, b) => ((b as any).score || 0) - ((a as any).score || 0));
        
        setResults(combined.slice(0, 20)); // Limit to 20 results
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
        ref={containerRef}
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

