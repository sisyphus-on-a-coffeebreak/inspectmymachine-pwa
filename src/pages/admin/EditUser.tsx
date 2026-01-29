/**
 * Edit User Page
 * 
 * Separate page for editing users
 * Better UX than modal, supports deep linking
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/providers/useAuth';
import { useUser, useUpdateUser } from '@/hooks/useUsers';
import { useEnhancedCapabilities } from '@/lib/permissions/queries';
import { UserForm } from '@/components/users/UserForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { NetworkError } from '@/components/ui/NetworkError';
import { useToast } from '@/providers/ToastProvider';
import { hasCapability, type UpdateUserPayload, isSuperAdmin } from '@/lib/users';
import type { EnhancedCapability } from '@/lib/permissions/types';
import { UserCog, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { spacing, responsiveSpacing } from '@/lib/theme';

export default function EditUser() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const updateMutation = useUpdateUser();

  const userId = id ? Number(id) : null;

  // Fetch user data
  const { data: user, isLoading, error } = useUser(userId, !!userId);

  // Fetch enhanced capabilities
  const { data: enhancedCapabilities = [] } = useEnhancedCapabilities(userId || 0, {
    enabled: !!userId,
  });

  // Check permission
  if (!hasCapability(currentUser, 'user_management', 'update')) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to edit users.</p>
        <Button onClick={() => navigate('/app/admin/users')}>Go Back</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: spacing.xl }}>
        <LoadingState variant="skeleton" message="Loading user..." />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ padding: spacing.xl }}>
        <NetworkError
          error={error || new Error('User not found')}
          onRetry={() => window.location.reload()}
          onGoBack={() => navigate('/app/admin/users')}
        />
      </div>
    );
  }

  const handleSubmit = async (data: UpdateUserPayload, enhancedCaps?: EnhancedCapability[]) => {
    try {
      // Validate: User must have at least one capability
      const hasBasicCapabilities =
        data.capabilities &&
        Object.values(data.capabilities).some(
          (moduleCaps) => Array.isArray(moduleCaps) && moduleCaps.length > 0
        );
      const hasEnhanced = enhancedCaps && enhancedCaps.length > 0;

      if (!hasBasicCapabilities && !hasEnhanced) {
        showToast({
          title: 'Validation Error',
          description:
            'User must have at least one capability assigned. Please set capabilities in the capability matrix.',
          variant: 'error',
        });
        return;
      }

      await updateMutation.mutateAsync({
        id: user.id,
        payload: data,
      });

      // Enhanced capabilities are handled separately via the enhanced capability hooks
      // The mutation hook will handle syncing them

      // Navigate to user details
      navigate(`/app/admin/users/${user.id}`);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const handleCancel = () => {
    navigate(`/app/admin/users/${user.id}`);
  };

  return (
    <div style={{ 
      padding: responsiveSpacing.padding.xl, // Responsive: clamp(32px, 6vw, 48px)
      maxWidth: '800px', // CSS handles responsive via PageContainer
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      <PageHeader
        title="Edit User"
        subtitle={`Editing ${user.name}`}
        icon={<UserCog size={28} />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'User Management', path: '/app/admin/users' },
          { label: user.name, path: `/app/admin/users/${user.id}` },
          { label: 'Edit' },
        ]}
        actions={
          <Button variant="secondary" onClick={handleCancel} icon={<ArrowLeft size={16} />}>
            Cancel
          </Button>
        }
      />

      <div style={{ marginTop: '2rem' }}>
        <UserForm
          mode="edit"
          initialData={{
            ...user,
            enhanced_capabilities: enhancedCapabilities,
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={updateMutation.isPending}
        />
      </div>
    </div>
  );
}

