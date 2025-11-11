import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/useAuth";
import { colors, typography, spacing } from "../lib/theme";
import { Sparkles, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, LogIn } from "lucide-react";

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

  return (
    <div style={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.neutral[50]} 0%, ${colors.neutral[100]} 100%)`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '800px',
        height: '800px',
        background: `radial-gradient(circle, ${colors.primary}10 0%, transparent 70%)`,
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '-30%',
        width: '600px',
        height: '600px',
        background: `radial-gradient(circle, ${colors.primary}08 0%, transparent 70%)`,
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div style={{ 
        width: '100%',
        maxWidth: '480px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo/Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: `${parseInt(spacing.xl) * 1.5}px`
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '72px',
            height: '72px',
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}80 100%)`,
            borderRadius: '18px',
            marginBottom: spacing.lg,
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
            position: 'relative'
          }}>
            <Sparkles style={{ width: '36px', height: '36px', color: 'white' }} />
            <div style={{
              position: 'absolute',
              inset: '-2px',
              background: `linear-gradient(135deg, ${colors.primary}40 0%, ${colors.primary}20 100%)`,
              borderRadius: '18px',
              zIndex: -1,
              filter: 'blur(8px)'
            }} />
          </div>
          <h1 style={{ 
            ...typography.header,
            fontSize: '32px',
            color: colors.neutral[900],
            margin: 0,
            marginBottom: spacing.xs,
            fontWeight: 700,
            letterSpacing: '-0.02em'
          }}>
            VOMS
          </h1>
          <p style={{ 
            ...typography.body,
            color: colors.neutral[600],
            margin: 0,
            fontSize: '15px',
            fontWeight: 500
          }}>
            Vehicle Operations Management System
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: `${parseInt(spacing.xl) * 1.75}px`,
          boxShadow: '0 12px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
          border: `1px solid ${colors.neutral[200]}`,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Card decoration */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primary}80 100%)`
          }} />

          <div style={{ marginBottom: `${parseInt(spacing.xl) * 1.5}px` }}>
            <h2 style={{ 
              ...typography.subheader,
              fontSize: '26px',
              color: colors.neutral[900],
              margin: 0,
              marginBottom: spacing.xs,
              fontWeight: 700
            }}>
              Welcome back
            </h2>
            <p style={{ 
              ...typography.body,
              color: colors.neutral[600],
              margin: 0,
              fontSize: '15px'
            }}>
              Sign in to continue to your account
            </p>
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: `${parseInt(spacing.lg) + 4}px` }}>
            {/* Error Message */}
            {error && (
              <div style={{
                background: `${colors.status.critical}10`,
                border: `1px solid ${colors.status.critical}30`,
                borderRadius: '12px',
                padding: `${spacing.md} ${spacing.lg}`,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                animation: 'slideDown 0.3s ease'
              }}>
                <AlertCircle style={{ width: '20px', height: '20px', color: colors.status.critical, flexShrink: 0 }} />
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
                marginBottom: `${parseInt(spacing.sm) + 2}px`,
                fontSize: '14px',
                fontWeight: 600,
                textTransform: 'none',
                letterSpacing: '0'
              }}>
                Employee ID
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: `${parseInt(spacing.md) + 4}px`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  zIndex: 1
                }}>
                  <UserIcon style={{ width: '20px', height: '20px', color: colors.neutral[400] }} />
                </div>
                <input
                  id="employeeId"
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                  placeholder="Enter your employee ID"
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: `${parseInt(spacing.md) + 4}px ${parseInt(spacing.md) + 4}px ${parseInt(spacing.md) + 4}px ${parseInt(spacing.xl) * 2.75}px`,
                    border: `1.5px solid ${colors.neutral[300]}`,
                    borderRadius: '12px',
                    fontSize: '15px',
                    color: colors.neutral[900],
                    background: loading ? colors.neutral[50] : 'white',
                    cursor: loading ? 'not-allowed' : 'text',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontWeight: 500
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 4px ${colors.primary}15`;
                    e.currentTarget.style.background = 'white';
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
                marginBottom: `${parseInt(spacing.sm) + 2}px`,
                fontSize: '14px',
                fontWeight: 600,
                textTransform: 'none',
                letterSpacing: '0'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: `${parseInt(spacing.md) + 4}px`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  zIndex: 1
                }}>
                  <Lock style={{ width: '20px', height: '20px', color: colors.neutral[400] }} />
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
                    padding: `${parseInt(spacing.md) + 4}px ${parseInt(spacing.xl) * 2.75}px ${parseInt(spacing.md) + 4}px ${parseInt(spacing.xl) * 2.75}px`,
                    border: `1.5px solid ${colors.neutral[300]}`,
                    borderRadius: '12px',
                    fontSize: '15px',
                    color: colors.neutral[900],
                    background: loading ? colors.neutral[50] : 'white',
                    cursor: loading ? 'not-allowed' : 'text',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontWeight: 500
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 4px ${colors.primary}15`;
                    e.currentTarget.style.background = 'white';
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
                    right: `${parseInt(spacing.md) + 4}px`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: spacing.xs,
                    color: colors.neutral[400],
                    transition: 'color 0.2s ease',
                    zIndex: 1
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = colors.neutral[700];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = colors.neutral[400];
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff style={{ width: '20px', height: '20px' }} />
                  ) : (
                    <Eye style={{ width: '20px', height: '20px' }} />
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
                padding: `${parseInt(spacing.md) + 6}px ${spacing.lg}`,
                background: loading 
                  ? colors.neutral[400] 
                  : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}80 100%)`,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: loading 
                  ? 'none' 
                  : '0 4px 16px rgba(37, 99, 235, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                marginTop: spacing.md
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.3)';
                }
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    border: '2.5px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn style={{ width: '18px', height: '18px' }} />
                  <span>Sign in</span>
                </>
              )}
            </button>
          </form>
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
          © 2024 VOMS • All rights reserved
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
