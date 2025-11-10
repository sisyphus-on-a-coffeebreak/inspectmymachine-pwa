import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/useAuth";
import { colors, typography, spacing } from "../lib/theme";
import { Sparkles, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, LogIn, CheckCircle } from "lucide-react";

export default function LoginElevated() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  // Mount animation
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(employeeId, password);
      setSuccess(true);
      // Delay navigation for success animation
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 800);
    } catch (err) {
      const message = err instanceof Error 
        ? err.message 
        : "Login failed. Please check your credentials and try again.";
      setError(message);
    } finally {
      if (!success) {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.neutral[50]} 0%, ${colors.neutral[100]} 50%, ${colors.neutral[50]} 100%)`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Enhanced animated background decorations */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '800px',
        height: '800px',
        background: `radial-gradient(circle, ${colors.primary}15 0%, transparent 70%)`,
        borderRadius: '50%',
        pointerEvents: 'none',
        animation: 'float 20s ease-in-out infinite',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 1s ease'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '-30%',
        width: '600px',
        height: '600px',
        background: `radial-gradient(circle, ${colors.primary}12 0%, transparent 70%)`,
        borderRadius: '50%',
        pointerEvents: 'none',
        animation: 'float 15s ease-in-out infinite reverse',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 1s ease 0.2s'
      }} />
      
      {/* Subtle grid pattern overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(${colors.neutral[200]}40 1px, transparent 1px),
                         linear-gradient(90deg, ${colors.neutral[200]}40 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        opacity: 0.3,
        pointerEvents: 'none'
      }} />

      <div style={{ 
        width: '100%',
        maxWidth: '480px',
        position: 'relative',
        zIndex: 1,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Enhanced Logo/Header with animation */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: spacing.xl * 1.5 
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}90 100%)`,
            borderRadius: '20px',
            marginBottom: spacing.lg,
            boxShadow: `0 12px 32px ${colors.primary}30, 0 0 0 8px ${colors.primary}08`,
            position: 'relative',
            transform: mounted ? 'scale(1) rotate(0deg)' : 'scale(0.8) rotate(-10deg)',
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s'
          }}>
            <Sparkles style={{ 
              width: '40px', 
              height: '40px', 
              color: 'white',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }} />
            {/* Animated glow */}
            <div style={{
              position: 'absolute',
              inset: '-3px',
              background: `linear-gradient(135deg, ${colors.primary}50 0%, ${colors.primary}30 100%)`,
              borderRadius: '22px',
              zIndex: -1,
              filter: 'blur(12px)',
              animation: 'pulse 3s ease-in-out infinite'
            }} />
          </div>
          <h1 style={{ 
            ...typography.header,
            fontSize: '36px',
            color: colors.neutral[900],
            margin: 0,
            marginBottom: spacing.xs,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            background: `linear-gradient(135deg, ${colors.neutral[900]} 0%, ${colors.neutral[700]} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            VOMS
          </h1>
          <p style={{ 
            ...typography.body,
            color: colors.neutral[600],
            margin: 0,
            fontSize: '15px',
            fontWeight: 500,
            letterSpacing: '0.01em'
          }}>
            Vehicle Operations Management System
          </p>
        </div>

        {/* Enhanced Login Card with glassmorphism */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '28px',
          padding: spacing.xl * 2,
          boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.5) inset',
          border: `1px solid rgba(255, 255, 255, 0.8)`,
          position: 'relative',
          overflow: 'hidden',
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s'
        }}>
          {/* Animated top accent with shimmer */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '5px',
            background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primary}60 50%, ${colors.primary} 100%)`,
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              animation: 'shimmer 3s infinite'
            }} />
          </div>

          {/* Success overlay */}
          {success && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.md,
              zIndex: 10,
              animation: 'fadeIn 0.3s ease',
              borderRadius: '28px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.status.success} 0%, ${colors.status.success}80 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 24px ${colors.status.success}40`,
                animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}>
                <CheckCircle style={{ width: '32px', height: '32px', color: 'white' }} />
              </div>
              <p style={{
                ...typography.subheader,
                color: colors.neutral[900],
                margin: 0,
                fontSize: '20px',
                fontWeight: 600
              }}>
                Welcome back!
              </p>
            </div>
          )}

          <div style={{ marginBottom: spacing.xl * 1.5 }}>
            <h2 style={{ 
              ...typography.subheader,
              fontSize: '28px',
              color: colors.neutral[900],
              margin: 0,
              marginBottom: spacing.xs,
              fontWeight: 700,
              letterSpacing: '-0.02em'
            }}>
              Welcome back
            </h2>
            <p style={{ 
              ...typography.body,
              color: colors.neutral[600],
              margin: 0,
              fontSize: '15px',
              fontWeight: 500
            }}>
              Sign in to continue to your account
            </p>
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg + 4 }}>
            {/* Enhanced Error Message with icon animation */}
            {error && (
              <div style={{
                background: `linear-gradient(135deg, ${colors.status.critical}08 0%, ${colors.status.critical}12 100%)`,
                border: `1.5px solid ${colors.status.critical}40`,
                borderRadius: '14px',
                padding: `${spacing.md + 2}px ${spacing.lg}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: spacing.sm + 2,
                animation: 'slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), shake 0.5s ease 0.4s',
                boxShadow: `0 4px 12px ${colors.status.critical}15`
              }}>
                <AlertCircle style={{ 
                  width: '22px', 
                  height: '22px', 
                  color: colors.status.critical, 
                  flexShrink: 0,
                  marginTop: '1px',
                  animation: 'iconPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s'
                }} />
                <p style={{ 
                  ...typography.body,
                  color: colors.status.critical,
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '1.5',
                  flex: 1
                }}>
                  {error}
                </p>
              </div>
            )}

            {/* Enhanced Employee ID Input with floating label effect */}
            <div style={{ position: 'relative' }}>
              <label htmlFor="employeeId" style={{
                ...typography.label,
                display: 'block',
                color: colors.neutral[700],
                marginBottom: spacing.sm + 2,
                fontSize: '14px',
                fontWeight: 600,
                textTransform: 'none',
                letterSpacing: '0',
                transition: 'color 0.2s ease'
              }}>
                Employee ID
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: spacing.md + 4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  zIndex: 1,
                  transition: 'all 0.3s ease'
                }}>
                  <UserIcon style={{ 
                    width: '20px', 
                    height: '20px', 
                    color: focusedField === 'employeeId' ? colors.primary : colors.neutral[400],
                    transition: 'all 0.3s ease'
                  }} />
                </div>
                <input
                  id="employeeId"
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                  onFocus={() => setFocusedField('employeeId')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your employee ID"
                  required
                  disabled={loading}
                  aria-label="Employee ID"
                  autoComplete="username"
                  style={{
                    width: '100%',
                    padding: `${spacing.md + 6}px ${spacing.md + 4}px ${spacing.md + 6}px ${spacing.xl * 2.75}px`,
                    border: `2px solid ${
                      focusedField === 'employeeId' 
                        ? colors.primary 
                        : colors.neutral[300]
                    }`,
                    borderRadius: '14px',
                    fontSize: '15px',
                    color: colors.neutral[900],
                    background: loading ? colors.neutral[50] : 'white',
                    cursor: loading ? 'not-allowed' : 'text',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontWeight: 500,
                    boxShadow: focusedField === 'employeeId' 
                      ? `0 0 0 4px ${colors.primary}12, 0 2px 8px ${colors.primary}10`
                      : '0 1px 3px rgba(0,0,0,0.05)',
                    transform: focusedField === 'employeeId' ? 'translateY(-1px)' : 'translateY(0)'
                  }}
                />
                {/* Input progress indicator */}
                {employeeId && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '2px',
                    width: '100%',
                    background: colors.neutral[200],
                    borderRadius: '0 0 12px 12px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min((employeeId.length / 8) * 100, 100)}%`,
                      background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primary}80 100%)`,
                      transition: 'width 0.3s ease',
                      animation: 'shimmer 2s infinite'
                    }} />
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Password Input */}
            <div style={{ position: 'relative' }}>
              <label htmlFor="password" style={{
                ...typography.label,
                display: 'block',
                color: colors.neutral[700],
                marginBottom: spacing.sm + 2,
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
                  left: spacing.md + 4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  zIndex: 1,
                  transition: 'all 0.3s ease'
                }}>
                  <Lock style={{ 
                    width: '20px', 
                    height: '20px', 
                    color: focusedField === 'password' ? colors.primary : colors.neutral[400],
                    transition: 'all 0.3s ease'
                  }} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  aria-label="Password"
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: `${spacing.md + 6}px ${spacing.xl * 2.75}px ${spacing.md + 6}px ${spacing.xl * 2.75}px`,
                    border: `2px solid ${
                      focusedField === 'password' 
                        ? colors.primary 
                        : colors.neutral[300]
                    }`,
                    borderRadius: '14px',
                    fontSize: '15px',
                    color: colors.neutral[900],
                    background: loading ? colors.neutral[50] : 'white',
                    cursor: loading ? 'not-allowed' : 'text',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontWeight: 500,
                    boxShadow: focusedField === 'password' 
                      ? `0 0 0 4px ${colors.primary}12, 0 2px 8px ${colors.primary}10`
                      : '0 1px 3px rgba(0,0,0,0.05)',
                    transform: focusedField === 'password' ? 'translateY(-1px)' : 'translateY(0)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: 'absolute',
                    right: spacing.md + 4,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: spacing.xs + 2,
                    borderRadius: '8px',
                    color: colors.neutral[400],
                    transition: 'all 0.2s ease',
                    zIndex: 1
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = colors.neutral[700];
                    e.currentTarget.style.background = colors.neutral[100];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = colors.neutral[400];
                    e.currentTarget.style.background = 'transparent';
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff style={{ width: '20px', height: '20px' }} />
                  ) : (
                    <Eye style={{ width: '20px', height: '20px' }} />
                  )}
                </button>
                {/* Password strength indicator */}
                {password && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '2px',
                    width: '100%',
                    background: colors.neutral[200],
                    borderRadius: '0 0 12px 12px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min((password.length / 12) * 100, 100)}%`,
                      background: `linear-gradient(90deg, 
                        ${password.length < 6 ? colors.status.critical : 
                          password.length < 10 ? colors.status.warning : 
                          colors.status.success} 0%, 
                        ${password.length < 6 ? colors.status.critical : 
                          password.length < 10 ? colors.status.warning : 
                          colors.status.success}80 100%)`,
                      transition: 'all 0.3s ease'
                    }} />
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Submit Button with advanced hover effects */}
            <button
              type="submit"
              disabled={loading || success}
              aria-label="Sign in"
              style={{
                width: '100%',
                padding: `${spacing.md + 8}px ${spacing.lg}`,
                background: loading || success
                  ? colors.neutral[400] 
                  : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}85 100%)`,
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: loading || success ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: loading || success
                  ? 'none' 
                  : `0 6px 20px ${colors.primary}35, 0 2px 8px ${colors.primary}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm + 2,
                marginTop: spacing.md,
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (!loading && !success) {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                  e.currentTarget.style.boxShadow = `0 8px 28px ${colors.primary}45, 0 4px 12px ${colors.primary}30`;
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && !success) {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = `0 6px 20px ${colors.primary}35, 0 2px 8px ${colors.primary}20`;
                }
              }}
            >
              {/* Button shimmer effect */}
              {!loading && !success && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation: 'shimmer 3s infinite'
                }} />
              )}
              
              {loading ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2.5px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                  <span>Signing in...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle style={{ width: '20px', height: '20px' }} />
                  <span>Success!</span>
                </>
              ) : (
                <>
                  <LogIn style={{ width: '20px', height: '20px' }} />
                  <span>Sign in</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Enhanced Footer */}
        <p style={{
          ...typography.bodySmall,
          color: colors.neutral[500],
          margin: 0,
          marginTop: spacing.xl,
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: 500,
          letterSpacing: '0.02em'
        }}>
          © 2024 VOMS • All rights reserved
        </p>
      </div>

      {/* Enhanced animations and keyframes */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        
        @keyframes iconPop {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}