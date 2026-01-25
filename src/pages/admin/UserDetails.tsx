import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, type User } from '../../lib/users';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/ui/PageHeader';
import { NetworkError } from '../../components/ui/NetworkError';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../providers/ToastProvider';
import { ArrowLeft } from 'lucide-react';
import { addRecentlyViewed } from '../../lib/recentlyViewed';

/**
 * User Details Page
 * Deep linking support for individual users
 */
export const UserDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getUser(Number(id));
      setUser(userData);
      
      // Track in recently viewed
      if (userData && id) {
        addRecentlyViewed({
          id: String(id),
          type: 'user',
          title: userData.name || `User #${id.substring(0, 8)}`,
          subtitle: userData.employee_id || userData.email || 'User Details',
          path: `/app/admin/users/${id}`,
        });
      }
    } catch (err) {
      setError(err as Error);
      showToast({
        title: 'Error',
        description: 'Failed to load user details',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>👤</div>
        <div style={{ color: colors.neutral[600] }}>Loading user details...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.xl }}>
        <NetworkError
          error={error || new Error('User not found')}
          onRetry={fetchUserDetails}
          onGoBack={() => navigate('/app/admin/users')}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: spacing.xl, maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title={user.name || `User #${id?.substring(0, 8)}`}
        subtitle={user.employee_id || user.email || 'User Details'}
        icon="👤"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'User Management', path: '/app/admin/users' },
          { label: 'Details' }
        ]}
        actions={
          <Button
            variant="secondary"
            onClick={() => navigate('/app/admin/users')}
            icon={<ArrowLeft size={16} />}
          >
            Back
          </Button>
        }
      />

      <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
        <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>User Information</h3>
        <div style={{ display: 'grid', gap: spacing.md }}>
          {user.employee_id && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600] }}>Employee ID</div>
              <div style={{ ...typography.body }}>{user.employee_id}</div>
            </div>
          )}
          {user.name && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600] }}>Name</div>
              <div style={{ ...typography.body }}>{user.name}</div>
            </div>
          )}
          {user.email && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600] }}>Email</div>
              <div style={{ ...typography.body }}>{user.email}</div>
            </div>
          )}
          {user.role && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600] }}>Role</div>
              <div style={{ ...typography.body }}>{user.role}</div>
            </div>
          )}
          {user.is_active !== undefined && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600] }}>Status</div>
              <div style={{ ...typography.body }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: user.is_active ? colors.success[500] : colors.error[500],
                  color: 'white'
                }}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          )}
          {user.last_login_at && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600] }}>Last Login</div>
              <div style={{ ...typography.body }}>{new Date(user.last_login_at).toLocaleString()}</div>
            </div>
          )}
          {user.created_at && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600] }}>Created At</div>
              <div style={{ ...typography.body }}>{new Date(user.created_at).toLocaleString()}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

