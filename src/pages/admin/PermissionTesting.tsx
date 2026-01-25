/**
 * Permission Testing Interface
 * 
 * Provides a UI for testing permission checks with different contexts
 * to verify that granular permissions work as expected.
 */

import React, { useState } from 'react';
import { useAuth } from '@/providers/useAuth';
import { useToast } from '@/providers/ToastProvider';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { useTestPermissionCheck, useTestBulkPermissionCheck } from '@/lib/permissions/queries';
import { getUsers } from '@/lib/users';
import type { PermissionCheckContext } from '@/lib/permissions/types';
import { colors, typography, spacing, cardStyles, borderRadius } from '@/lib/theme';
import { Shield, CheckCircle2, XCircle, AlertCircle, Play, Loader } from 'lucide-react';

export default function PermissionTesting() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(currentUser?.id || null);
  const [module, setModule] = useState<string>('gate_pass');
  const [action, setAction] = useState<string>('read');
  const [users, setUsers] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [testResult, setTestResult] = useState<any>(null);
  const [context, setContext] = useState<Partial<PermissionCheckContext>>({});

  // Context fields
  const [recordJson, setRecordJson] = useState<string>('{}');
  const [field, setField] = useState<string>('');
  const [ipAddress, setIpAddress] = useState<string>('');
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop' | 'tablet' | ''>('');
  const [location, setLocation] = useState<'on_site' | 'remote' | 'any' | ''>('');
  const [mfaVerified, setMfaVerified] = useState<boolean>(false);
  const [reason, setReason] = useState<string>('');

  const testMutation = useTestPermissionCheck();

  React.useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data.map(u => ({ id: u.id, name: u.name, email: u.email })));
    } catch (err) {
      console.error('Failed to load users:', err);
      showToast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'error',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleTest = async () => {
    if (!selectedUserId) {
      showToast({
        title: 'Error',
        description: 'Please select a user',
        variant: 'error',
      });
      return;
    }

    try {
      // Parse record JSON
      let record = null;
      try {
        record = recordJson ? JSON.parse(recordJson) : null;
      } catch (e) {
        showToast({
          title: 'Error',
          description: 'Invalid JSON in record field',
          variant: 'error',
        });
        return;
      }

      // Build context
      const testContext: PermissionCheckContext = {
        ...(record && { record }),
        ...(field && { field }),
        ...(ipAddress && { ip_address: ipAddress }),
        ...(deviceType && { device_type: deviceType }),
        ...(location && { location }),
        mfa_verified: mfaVerified,
        ...(reason && { reason }),
        timestamp: new Date(),
      };

      const result = await testMutation.mutateAsync({
        userId: selectedUserId,
        module,
        action,
        context: testContext,
      });

      setTestResult(result);
    } catch (err) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to test permission',
        variant: 'error',
      });
    }
  };

  const modules = ['gate_pass', 'inspection', 'expense', 'user_management', 'reports'];
  const actions = ['create', 'read', 'update', 'delete', 'approve', 'validate', 'review', 'reassign', 'export'];

  return (
    <div style={{ padding: spacing.lg }}>
      <PageHeader
        title="Permission Testing"
        description="Test permission checks with different contexts"
        icon={<Shield size={24} />}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg, marginTop: spacing.lg }}>
        {/* Test Configuration */}
        <div style={{ ...cardStyles.card }}>
          <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>Test Configuration</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                User *
              </label>
              {loadingUsers ? (
                <div style={{ ...typography.body, color: colors.neutral[600] }}>Loading users...</div>
              ) : (
                <select
                  value={selectedUserId || ''}
                  onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)}
                  required
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.sm,
                    ...typography.body,
                  }}
                >
                  <option value="">Select a user...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
              <div>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                  Module *
                </label>
                <select
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.sm,
                    ...typography.body,
                  }}
                >
                  {modules.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                  Action *
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.sm,
                    ...typography.body,
                  }}
                >
                  {actions.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                Record (JSON)
              </label>
              <textarea
                value={recordJson}
                onChange={(e) => setRecordJson(e.target.value)}
                placeholder='{"id": 1, "amount": 5000, "status": "pending", "created_by": 123}'
                rows={6}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.sm,
                  ...typography.body,
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  resize: 'vertical',
                }}
              />
            </div>

            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                Field (for field-level checks)
              </label>
              <input
                type="text"
                value={field}
                onChange={(e) => setField(e.target.value)}
                placeholder="amount"
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.sm,
                  ...typography.body,
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
              <div>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                  IP Address
                </label>
                <input
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="192.168.1.1"
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.sm,
                    ...typography.body,
                  }}
                />
              </div>

              <div>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                  Device Type
                </label>
                <select
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.sm,
                    ...typography.body,
                  }}
                >
                  <option value="">Any</option>
                  <option value="mobile">Mobile</option>
                  <option value="desktop">Desktop</option>
                  <option value="tablet">Tablet</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.sm,
                  ...typography.body,
                }}
              >
                <option value="">Any</option>
                <option value="on_site">On Site</option>
                <option value="remote">Remote</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={mfaVerified}
                  onChange={(e) => setMfaVerified(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={typography.body}>MFA Verified</span>
              </label>
            </div>

            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                Reason/Justification
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for action"
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.sm,
                  ...typography.body,
                }}
              />
            </div>

            <Button
              onClick={handleTest}
              variant="primary"
              loading={testMutation.isPending}
              fullWidth
            >
              <Play size={16} style={{ marginRight: spacing.xs }} />
              Test Permission
            </Button>
          </div>
        </div>

        {/* Test Results */}
        <div style={{ ...cardStyles.card }}>
          <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>Test Results</h3>

          {testMutation.isPending ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
              <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : testResult ? (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                padding: spacing.md,
                backgroundColor: testResult.allowed ? colors.success[50] : colors.error[50],
                borderRadius: borderRadius.sm,
                marginBottom: spacing.md,
              }}>
                {testResult.allowed ? (
                  <CheckCircle2 size={24} color={colors.success[500]} />
                ) : (
                  <XCircle size={24} color={colors.error[500]} />
                )}
                <div>
                  <div style={{ ...typography.body, fontWeight: 600, color: testResult.allowed ? colors.success[700] : colors.error[700] }}>
                    {testResult.allowed ? 'Permission Granted' : 'Permission Denied'}
                  </div>
                  {testResult.reason && (
                    <div style={{ ...typography.caption, color: testResult.allowed ? colors.success[600] : colors.error[600] }}>
                      {testResult.reason}
                    </div>
                  )}
                </div>
              </div>

              {testResult.failed_conditions && testResult.failed_conditions.length > 0 && (
                <div style={{ marginBottom: spacing.md }}>
                  <div style={{ ...typography.label, marginBottom: spacing.xs }}>Failed Conditions:</div>
                  <ul style={{ ...typography.body, paddingLeft: spacing.lg, color: colors.error[700] }}>
                    {testResult.failed_conditions.map((condition: string, index: number) => (
                      <li key={index}>{condition}</li>
                    ))}
                  </ul>
                </div>
              )}

              {testResult.missing_permissions && testResult.missing_permissions.length > 0 && (
                <div style={{ marginBottom: spacing.md }}>
                  <div style={{ ...typography.label, marginBottom: spacing.xs }}>Missing Permissions:</div>
                  <ul style={{ ...typography.body, paddingLeft: spacing.lg, color: colors.error[700] }}>
                    {testResult.missing_permissions.map((perm: string, index: number) => (
                      <li key={index}>{perm}</li>
                    ))}
                  </ul>
                </div>
              )}

              {testResult.requires_approval && (
                <div style={{
                  padding: spacing.md,
                  backgroundColor: colors.warning[50],
                  borderRadius: borderRadius.sm,
                  marginBottom: spacing.md,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                    <AlertCircle size={20} color={colors.warning[600]} />
                    <div style={{ ...typography.label, color: colors.warning[700] }}>
                      Approval Required
                    </div>
                  </div>
                  {testResult.approval_from && testResult.approval_from.length > 0 && (
                    <div style={{ ...typography.caption, color: colors.warning[600] }}>
                      Approval from: {testResult.approval_from.join(', ')}
                    </div>
                  )}
                </div>
              )}

              {testResult.masked_fields && testResult.masked_fields.length > 0 && (
                <div style={{ marginBottom: spacing.md }}>
                  <div style={{ ...typography.label, marginBottom: spacing.xs }}>Masked Fields:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
                    {testResult.masked_fields.map((field: string, index: number) => (
                      <span
                        key={index}
                        style={{
                          ...typography.caption,
                          padding: `${spacing.xs} ${spacing.sm}`,
                          backgroundColor: colors.neutral[100],
                          borderRadius: borderRadius.sm,
                        }}
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{
                marginTop: spacing.md,
                padding: spacing.md,
                backgroundColor: colors.neutral[50],
                borderRadius: borderRadius.sm,
              }}>
                <div style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.xs }}>
                  Full Response:
                </div>
                <pre style={{
                  ...typography.body,
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  overflow: 'auto',
                  padding: spacing.sm,
                  backgroundColor: 'white',
                  borderRadius: borderRadius.sm,
                  border: `1px solid ${colors.neutral[200]}`,
                }}>
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: spacing.xl,
              color: colors.neutral[600],
              textAlign: 'center',
            }}>
              <Shield size={48} style={{ marginBottom: spacing.md, opacity: 0.5 }} />
              <div style={typography.body}>
                Configure the test parameters and click "Test Permission" to see results
              </div>
            </div>
          )}
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
}









