/**
 * Notification Preferences Page
 * 
 * User settings for notification preferences
 * - Per-type preferences
 * - Channel selection (push/email/in-app)
 * - Sound and vibration settings
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { colors, spacing, typography, cardStyles, borderRadius } from '@/lib/theme';
import { Bell, Mail, Smartphone, Volume2, Vibrate, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/providers/useAuth';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/providers/ToastProvider';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NotificationPreference {
  type: string;
  label: string;
  description: string;
  channels: {
    push: boolean;
    email: boolean;
    in_app: boolean;
  };
}

const notificationTypes: NotificationPreference[] = [
  {
    type: 'alert',
    label: 'Alerts',
    description: 'Critical alerts and urgent notifications',
    channels: { push: true, email: true, in_app: true },
  },
  {
    type: 'approval_request',
    label: 'Approval Requests',
    description: 'Requests for approval (expenses, gate passes, etc.)',
    channels: { push: true, email: false, in_app: true },
  },
  {
    type: 'reminder',
    label: 'Reminders',
    description: 'Scheduled reminders and follow-ups',
    channels: { push: false, email: true, in_app: true },
  },
  {
    type: 'escalation',
    label: 'Escalations',
    description: 'Escalated items requiring attention',
    channels: { push: true, email: true, in_app: true },
  },
  {
    type: 'info',
    label: 'Information',
    description: 'General information and updates',
    channels: { push: false, email: false, in_app: true },
  },
];

export const NotificationPreferences: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isSupported: pushSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();
  
  const [preferences, setPreferences] = useState<NotificationPreference[]>(notificationTypes);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const response = await apiClient.get(`/v1/users/${user.id}/notification-preferences`);
        const data = response.data;
        
        if (data.preferences) {
          setPreferences(data.preferences);
        }
        if (data.sound_enabled !== undefined) {
          setSoundEnabled(data.sound_enabled);
        }
        if (data.vibration_enabled !== undefined) {
          setVibrationEnabled(data.vibration_enabled);
        }
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
        // Use defaults if load fails
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const handleChannelToggle = (typeIndex: number, channel: 'push' | 'email' | 'in_app') => {
    const newPreferences = [...preferences];
    newPreferences[typeIndex].channels[channel] = !newPreferences[typeIndex].channels[channel];
    setPreferences(newPreferences);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await apiClient.put(`/v1/users/${user.id}/notification-preferences`, {
        preferences,
        sound_enabled: soundEnabled,
        vibration_enabled: vibrationEnabled,
      });

      showToast({
        title: 'Success',
        description: 'Notification preferences saved',
        variant: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to save notification preferences',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
      showToast({
        title: 'Success',
        description: 'Push notifications disabled',
        variant: 'success',
      });
    } else {
      await subscribe();
      showToast({
        title: 'Success',
        description: 'Push notifications enabled',
        variant: 'success',
      });
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: spacing.xl }}>
      <PageHeader
        title="Notification Preferences"
        subtitle="Manage how and when you receive notifications"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Notifications', path: '/app/notifications' },
          { label: 'Preferences' },
        ]}
      />

      {/* Push Notification Toggle */}
      {pushSupported && (
        <div style={{ ...cardStyles.base, marginBottom: spacing.lg }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <Smartphone size={24} color={colors.primary} />
              <div>
                <h3 style={{ ...typography.subheader, margin: 0 }}>Push Notifications</h3>
                <p style={{ ...typography.bodySmall, color: colors.neutral[600], margin: 0 }}>
                  Receive notifications even when the app is closed
                </p>
              </div>
            </div>
            <button
              onClick={handlePushToggle}
              style={{
                background: isSubscribed ? colors.success[500] : colors.neutral[300],
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: borderRadius.md,
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              {isSubscribed ? 'Enabled' : 'Enable'}
            </button>
          </div>
        </div>
      )}

      {/* Per-Type Preferences */}
      <div style={{ ...cardStyles.base, marginBottom: spacing.lg }}>
        <h3 style={{ ...typography.subheader, marginBottom: spacing.lg }}>Notification Types</h3>
        
        {preferences.map((pref, index) => (
          <div
            key={pref.type}
            style={{
              padding: spacing.md,
              borderBottom: index < preferences.length - 1 ? `1px solid ${colors.neutral[200]}` : 'none',
            }}
          >
            <div style={{ marginBottom: spacing.sm }}>
              <h4 style={{ ...typography.label, marginBottom: spacing.xs }}>{pref.label}</h4>
              <p style={{ ...typography.bodySmall, color: colors.neutral[600], margin: 0 }}>
                {pref.description}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: spacing.lg, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={pref.channels.push}
                  onChange={() => handleChannelToggle(index, 'push')}
                  disabled={!pushSupported || !isSubscribed}
                />
                <Smartphone size={16} color={colors.neutral[600]} />
                <span style={{ ...typography.bodySmall }}>Push</span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={pref.channels.email}
                  onChange={() => handleChannelToggle(index, 'email')}
                />
                <Mail size={16} color={colors.neutral[600]} />
                <span style={{ ...typography.bodySmall }}>Email</span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={pref.channels.in_app}
                  onChange={() => handleChannelToggle(index, 'in_app')}
                />
                <Bell size={16} color={colors.neutral[600]} />
                <span style={{ ...typography.bodySmall }}>In-App</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Sound and Vibration */}
      <div style={{ ...cardStyles.base, marginBottom: spacing.lg }}>
        <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>Sound & Vibration</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <Volume2 size={20} color={colors.neutral[600]} />
              <div>
                <div style={{ ...typography.label }}>Sound Effects</div>
                <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                  Play sound when notifications arrive
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
            />
          </label>
          
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <Vibrate size={20} color={colors.neutral[600]} />
              <div>
                <div style={{ ...typography.label }}>Vibration</div>
                <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                  Vibrate device when notifications arrive
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={vibrationEnabled}
              onChange={(e) => setVibrationEnabled(e.target.checked)}
            />
          </label>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
        <Button
          variant="secondary"
          onClick={() => navigate('/app/notifications')}
          icon={<ArrowLeft size={16} />}
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          loading={saving}
          icon={<Save size={16} />}
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );
};


