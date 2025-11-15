import { useNavigate } from "react-router-dom";
import { colors, typography, spacing } from "../lib/theme";
import { Home, ArrowLeft, AlertCircle } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

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
        maxWidth: '500px',
        position: 'relative',
        zIndex: 1,
        textAlign: 'center'
      }}>
        {/* Error Icon */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '120px',
          height: '120px',
          background: `linear-gradient(135deg, ${colors.status.critical}20 0%, ${colors.status.critical}10 100%)`,
          borderRadius: '50%',
          marginBottom: spacing.xl,
          position: 'relative'
        }}>
          <AlertCircle style={{ width: '60px', height: '60px', color: colors.status.critical }} />
        </div>

        {/* Error Code */}
        <h1 style={{ 
          ...typography.header,
          fontSize: '72px',
          color: colors.neutral[900],
          margin: 0,
          marginBottom: spacing.sm,
          fontWeight: 700,
          letterSpacing: '-0.05em',
          lineHeight: 1
        }}>
          404
        </h1>

        {/* Error Message */}
        <h2 style={{ 
          ...typography.subheader,
          fontSize: '28px',
          color: colors.neutral[900],
          margin: 0,
          marginBottom: spacing.md,
          fontWeight: 600
        }}>
          Page not found
        </h2>

        <p style={{ 
          ...typography.body,
          color: colors.neutral[600],
          margin: 0,
          marginBottom: `${parseInt(spacing.xl) * 1.5}px`,
          fontSize: '16px',
          lineHeight: 1.6
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: spacing.md, 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              padding: `${spacing.md + 4}px ${spacing.xl}`,
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}80 100%)`,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.3)';
            }}
          >
            <Home style={{ width: '18px', height: '18px' }} />
            <span>Go to Dashboard</span>
          </button>

          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              padding: `${spacing.md + 4}px ${spacing.xl}`,
              background: 'white',
              color: colors.neutral[700],
              border: `1.5px solid ${colors.neutral[300]}`,
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.neutral[50];
              e.currentTarget.style.borderColor = colors.neutral[400];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = colors.neutral[300];
            }}
          >
            <ArrowLeft style={{ width: '18px', height: '18px' }} />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}

