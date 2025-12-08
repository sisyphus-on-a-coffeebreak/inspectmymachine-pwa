import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { colors, spacing, borderRadius, shadows } from '../../lib/theme';
import { BottomSheet } from './BottomSheet';
import { FloatingActionButton } from './FloatingActionButton';
import { useAuth } from '../../providers/useAuth';
import { navigationByRole, getMoreItemsForRole, type NavItem } from '../../lib/navigationConfig';
import { useUnifiedApprovals } from '../../hooks/useUnifiedApprovals';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Get role-based navigation config
  const role = (user?.role || 'clerk') as keyof typeof navigationByRole;
  const config = navigationByRole[role] || navigationByRole.clerk;
  const moreItems = getMoreItemsForRole(role);

  // Get approval count for badge (only for roles that can approve)
  const canApprove = role === 'super_admin' || role === 'admin' || role === 'supervisor';
  const { counts } = useUnifiedApprovals({}, { enabled: canApprove });
  const approvalCount = canApprove ? (counts?.all || null) : null;

  // Detect keyboard open/close
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        setKeyboardOpen(viewportHeight < windowHeight * 0.75);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (path: string | null) => {
    if (!path) {
      setShowMoreSheet(true);
      return;
    }
    navigate(path);
    setShowMoreSheet(false);
  };

  const getBadgeCount = (item: NavItem): number | null => {
    // Special case for approvals - use the approval count
    if (item.id === 'approvals') {
      return approvalCount;
    }
    // If item has a badge function, call it
    if (item.badge) {
      return item.badge();
    }
    return null;
  };

  // Hide when keyboard is open
  if (keyboardOpen) {
    return null;
  }

  return (
    <>
      <nav
        className="bottom-nav-container dark:bg-zinc-900 dark:border-zinc-800"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '64px',
          backgroundColor: 'white',
          borderTop: `1px solid ${colors.neutral[200]}`,
          boxShadow: shadows.lg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 100,
          paddingBottom: 'env(safe-area-inset-bottom, 0)',
        }}
      >
        {config.items.map((item) => {
          const Icon = item.icon;
          const active = item.route ? isActive(item.route) : false;
          const badgeCount = getBadgeCount(item);

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.route)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                flex: 1,
                padding: spacing.sm,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: active ? colors.primary : colors.neutral[700],
                transition: 'transform 0.2s ease, color 0.2s',
                position: 'relative',
                transform: active ? 'scale(1.05)' : 'scale(1)',
              }}
              aria-label={item.label}
            >
              <Icon
                style={{
                  width: '20px',
                  height: '20px',
                  fill: active ? colors.primary : 'none',
                  strokeWidth: active ? 2.5 : 2,
                }}
              />
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: active ? 600 : 400,
                  color: active ? colors.primary : colors.neutral[700],
                }}
              >
                {item.label}
              </span>
              {badgeCount !== null && badgeCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '50%',
                    transform: 'translateX(12px)',
                    backgroundColor: colors.error[500],
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 600,
                  }}
                >
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </button>
          );
        })}

        {/* More Button - only show if there's a "more" item */}
        {config.items.some(item => item.route === null) && (
          <button
            onClick={() => setShowMoreSheet(true)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              flex: 1,
              padding: spacing.sm,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: showMoreSheet ? colors.primary : colors.neutral[700],
              transition: 'transform 0.2s ease, color 0.2s',
              transform: showMoreSheet ? 'scale(1.05)' : 'scale(1)',
            }}
            aria-label="More"
          >
            <MoreHorizontal
              style={{
                width: '20px',
                height: '20px',
                fill: showMoreSheet ? colors.primary : 'none',
                strokeWidth: showMoreSheet ? 2.5 : 2,
              }}
            />
            <span
              style={{
                fontSize: '12px',
                fontWeight: showMoreSheet ? 600 : 400,
                color: showMoreSheet ? colors.primary : colors.neutral[700],
              }}
            >
              More
            </span>
          </button>
        )}
      </nav>

      {/* More Sheet */}
      {showMoreSheet && (
        <BottomSheet
          title="More"
          onClose={() => setShowMoreSheet(false)}
          isOpen={showMoreSheet}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {moreItems.map((item) => {
              const Icon = item.icon;
              const active = item.route ? isActive(item.route) : false;
              const badgeCount = getBadgeCount(item);

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.route)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: spacing.md,
                    background: active ? colors.primary + '15' : 'transparent',
                    border: `1px solid ${active ? colors.primary : colors.neutral[200]}`,
                    borderRadius: borderRadius.md,
                    cursor: 'pointer',
                    color: active ? colors.primary : colors.neutral[700],
                    transition: 'all 0.2s',
                    textAlign: 'left',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = colors.neutral[50];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Icon
                    style={{
                      width: '20px',
                      height: '20px',
                      color: active ? colors.primary : colors.neutral[600],
                    }}
                  />
                  <span style={{ flex: 1, fontWeight: active ? 600 : 400 }}>
                    {item.label}
                  </span>
                  {badgeCount !== null && badgeCount > 0 && (
                    <span
                      style={{
                        backgroundColor: colors.error[500],
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 600,
                      }}
                    >
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </BottomSheet>
      )}

      {/* Floating Action Button */}
      {config.fab && (
        <FloatingActionButton
          icon={config.fab.icon}
          label={config.fab.label}
          actions={config.fab.actions}
        />
      )}
      
      <style>{`
        /* Hide on desktop using CSS */
        @media (min-width: 768px) {
          .bottom-nav-container {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}

