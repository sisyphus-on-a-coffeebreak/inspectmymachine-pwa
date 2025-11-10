import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/useAuth";
import { colors, typography, spacing } from "../lib/theme";
import { Sparkles, Lock, User as UserIcon, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function Login() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(employeeId, password);
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof Error 
        ? err.message 
        : "Login failed. Please check your credentials and try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const testAccounts = [
    { id: "SUPER001", role: "Super Admin" },
    { id: "ADMIN001", role: "Admin" },
    { id: "INSP001", role: "Inspector" },
    { id: "GUARD001", role: "Guard" },
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.neutral[50]} 0%, ${colors.neutral[100]} 100%)`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl
    }}>
      <div style={{ 
        width: '100%',
        maxWidth: '440px'
      }}>
        {/* Logo/Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: spacing.xl * 2 
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}80 100%)`,
            borderRadius: '16px',
            marginBottom: spacing.lg,
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
          }}>
            <Sparkles style={{ width: '32px', height: '32px', color: 'white' }} />
          </div>
          <h1 style={{ 
            ...typography.header,
            fontSize: '28px',
            color: colors.neutral[900],
            margin: 0,
            marginBottom: spacing.xs,
            fontWeight: 700
          }}>
            VOMS
          </h1>
          <p style={{ 
            ...typography.body,
            color: colors.neutral[600],
            margin: 0,
            fontSize: '15px'
          }}>
            Vehicle Operations Management System
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: spacing.xl * 1.5,
          boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
          border: `1px solid ${colors.neutral[200]}`
        }}>
          <h2 style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            margin: 0,
            marginBottom: spacing.xl,
            fontWeight: 600
          }}>
            Sign in
          </h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
            {/* Error Message */}
            {error && (
              <div style={{
                background: `${colors.status.critical}15`,
                border: `1px solid ${colors.status.critical}`,
                borderRadius: '12px',
                padding: `${spacing.md} ${spacing.lg}`,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm
              }}>
                <AlertCircle style={{ width: '18px', height: '18px', color: colors.status.critical, flexShrink: 0 }} />
                <p style={{ 
                  ...typography.body,
                  color: colors.status.critical,
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 500
                }}>
                  {error}
                </p>
              </div>
            )}

            {/* Employee ID Input */}
            <div>
              <label htmlFor="employeeId" style={{
                ...typography.label,
                display: 'block',
                color: colors.neutral[700],
                marginBottom: spacing.sm,
                fontSize: '14px',
                fontWeight: 500
              }}>
                Employee ID
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: spacing.md,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none'
                }}>
                  <UserIcon style={{ width: '18px', height: '18px', color: colors.neutral[400] }} />
                </div>
                <input
                  id="employeeId"
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                  placeholder="e.g., ADMIN001"
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: `${spacing.md} ${spacing.md} ${spacing.md} ${spacing.xl * 2}`,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: '12px',
                    fontSize: '15px',
                    color: colors.neutral[900],
                    background: loading ? colors.neutral[50] : 'white',
                    cursor: loading ? 'not-allowed' : 'text',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.neutral[300];
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" style={{
                ...typography.label,
                display: 'block',
                color: colors.neutral[700],
                marginBottom: spacing.sm,
                fontSize: '14px',
                fontWeight: 500
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: spacing.md,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none'
                }}>
                  <Lock style={{ width: '18px', height: '18px', color: colors.neutral[400] }} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: `${spacing.md} ${spacing.xl * 2} ${spacing.md} ${spacing.xl * 2}`,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: '12px',
                    fontSize: '15px',
                    color: colors.neutral[900],
                    background: loading ? colors.neutral[50] : 'white',
                    cursor: loading ? 'not-allowed' : 'text',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.neutral[300];
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: spacing.md,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: spacing.xs,
                    color: colors.neutral[400],
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = colors.neutral[600];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = colors.neutral[400];
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff style={{ width: '18px', height: '18px' }} />
                  ) : (
                    <Eye style={{ width: '18px', height: '18px' }} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: `${spacing.md} ${spacing.lg}`,
                background: loading 
                  ? colors.neutral[400] 
                  : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}80 100%)`,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: loading 
                  ? 'none' 
                  : '0 4px 12px rgba(37, 99, 235, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                }
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Test Accounts */}
          <div style={{
            marginTop: spacing.xl * 1.5,
            paddingTop: spacing.xl,
            borderTop: `1px solid ${colors.neutral[200]}`
          }}>
            <p style={{
              ...typography.label,
              color: colors.neutral[500],
              margin: 0,
              marginBottom: spacing.md,
              fontSize: '12px',
              fontWeight: 500
            }}>
              Test Accounts
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
              {testAccounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => {
                    setEmployeeId(account.id);
                    setPassword("password");
                  }}
                  disabled={loading}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: `${spacing.sm} ${spacing.md}`,
                    background: colors.neutral[50],
                    border: `1px solid ${colors.neutral[200]}`,
                    borderRadius: '10px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: loading ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = colors.neutral[100];
                      e.currentTarget.style.borderColor = colors.neutral[300];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = colors.neutral[50];
                      e.currentTarget.style.borderColor = colors.neutral[200];
                    }
                  }}
                >
                  <span style={{
                    ...typography.body,
                    color: colors.neutral[900],
                    fontSize: '13px',
                    fontWeight: 600
                  }}>
                    {account.id}
                  </span>
                  <span style={{
                    ...typography.bodySmall,
                    color: colors.neutral[500],
                    fontSize: '12px'
                  }}>
                    {account.role}
                  </span>
                </button>
              ))}
            </div>
            <p style={{
              ...typography.bodySmall,
              color: colors.neutral[400],
              margin: 0,
              marginTop: spacing.md,
              textAlign: 'center',
              fontSize: '11px'
            }}>
              Password: <span style={{ fontFamily: 'monospace', color: colors.neutral[600] }}>password</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p style={{
          ...typography.bodySmall,
          color: colors.neutral[400],
          margin: 0,
          marginTop: spacing.xl,
          textAlign: 'center',
          fontSize: '12px'
        }}>
          © 2024 VOMS
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
