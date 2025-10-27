import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import QRScanner from '../../components/ui/QRScanner';
import ErrorBoundary from '../../components/ErrorBoundary';

// 🛡️ Pass Validation System
// For guards to validate and process gate pass entries/exits
// QR code scanning, manual validation, and status updates

interface PassValidationData {
  id: string;
  pass_number: string;
  type: 'visitor' | 'vehicle';
  status: 'pending' | 'active' | 'inside' | 'completed' | 'cancelled';
  visitor_name?: string;
  vehicle_registration?: string;
  purpose: string;
  valid_from: string;
  valid_to: string;
  entry_time?: string;
  exit_time?: string;
  access_code: string;
  qr_code: string;
  escort_required: boolean;
  escort_name?: string;
  notes?: string;
}

interface ValidationResult {
  success: boolean;
  message: string;
  pass_data?: PassValidationData;
  validation_type: 'entry' | 'exit' | 'invalid';
}

export const PassValidation: React.FC = () => {
  const navigate = useNavigate();
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [currentPass, setCurrentPass] = useState<PassValidationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationType, setValidationType] = useState<'entry' | 'exit'>('entry');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [manualPassNumber, setManualPassNumber] = useState('');
  const [validationNotes, setValidationNotes] = useState('');
  const [history, setHistory] = useState<Array<{ id: string; type: 'entry'|'exit'|'validate'; validated_by: string; ts: string; notes?: string }>>([]);

  const beep = useCallback((ok: boolean) => {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = ok ? 880 : 220;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      o.start();
      o.stop(ctx.currentTime + 0.21);
    } catch {}
  }, []);

  const vibrate = (ok: boolean) => {
    try { if (navigator.vibrate) navigator.vibrate(ok ? [50,50,50] : [200,100,200]); } catch {}
  };

  const validatePass = async (passIdentifier: string) => {
    try {
      setLoading(true);
      setValidationResult(null);

      const response = await axios.post('/api/gate-pass-validation/validate', {
        access_code: passIdentifier
      });

      const result: ValidationResult = response.data;
      setValidationResult(result);
      beep(result.success); vibrate(result.success);
      
      if (result.success && result.pass_data) {
        setCurrentPass(result.pass_data);
        try {
          const hist = await axios.get(`/api/gate-pass-validation/history/${result.pass_data.id}`);
          if (hist.data.success) {
            setHistory(hist.data.history || []);
          } else {
            setHistory([]);
          }
        } catch { setHistory([]); }
      }

    } catch (error) {
      console.error('Validation failed:', error);
      setValidationResult({
        success: false,
        message: 'Failed to validate pass. Please try again.',
        validation_type: 'invalid'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = (data: string) => {
    setShowQRScanner(false);
    validatePass(data);
  };

  const handleManualValidation = () => {
    if (!manualPassNumber.trim()) {
      alert('Please enter a pass number');
      return;
    }
    validatePass(manualPassNumber.trim());
  };

  const processEntry = async () => {
    if (!currentPass) return;

    try {
      setLoading(true);
      await axios.post('/api/gate-pass-validation/entry', {
        pass_id: currentPass.id,
        pass_type: currentPass.type === 'visitor' ? 'visitor' : 'vehicle_entry'
      });

      alert('Entry recorded successfully!');
      beep(true); vibrate(true);
      setCurrentPass(null);
      setValidationResult(null);
      setValidationNotes('');
    } catch (error) {
      console.error('Entry processing failed:', error);
      alert('Failed to record entry. Please try again.');
      beep(false); vibrate(false);
    } finally {
      setLoading(false);
    }
  };

  const processExit = async () => {
    if (!currentPass) return;

    try {
      setLoading(true);
      await axios.post('/api/gate-pass-validation/exit', {
        pass_id: currentPass.id,
        pass_type: currentPass.type === 'visitor' ? 'visitor' : 'vehicle_exit'
      });

      alert('Exit recorded successfully!');
      beep(true); vibrate(true);
      setCurrentPass(null);
      setValidationResult(null);
      setValidationNotes('');
    } catch (error) {
      console.error('Exit processing failed:', error);
      alert('Failed to record exit. Please try again.');
      beep(false); vibrate(false);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.status.warning;
      case 'active': return colors.status.normal;
      case 'inside': return colors.primary;
      case 'completed': return colors.neutral[500];
      case 'cancelled': return colors.status.critical;
      default: return colors.neutral[400];
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'active': return 'Active';
      case 'inside': return 'Inside';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: spacing.xl,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: colors.neutral[50],
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: spacing.xl,
        padding: spacing.lg,
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div>
          <h1 style={{ 
            ...typography.header,
            fontSize: '28px',
            color: colors.neutral[900],
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            🛡️ Pass Validation
          </h1>
          <p style={{ color: colors.neutral[600], marginTop: spacing.xs }}>
            Validate and process gate pass entries and exits
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <Button
            variant="secondary"
            onClick={() => navigate('/app/gate-pass')}
            icon="🚪"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Validation Type Selection */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.lg,
        marginBottom: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ 
          ...typography.subheader,
          marginBottom: spacing.lg,
          color: colors.neutral[900]
        }}>
          Select Validation Type
        </h3>
        
        <div style={{ display: 'flex', gap: spacing.lg }}>
          <Button
            variant={validationType === 'entry' ? 'primary' : 'secondary'}
            onClick={() => setValidationType('entry')}
            icon="🚪"
          >
            Entry Validation
          </Button>
          
          <Button
            variant={validationType === 'exit' ? 'primary' : 'secondary'}
            onClick={() => setValidationType('exit')}
            icon="🚪"
          >
            Exit Validation
          </Button>
        </div>
      </div>

      {/* QR Scanner Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.xl,
        marginBottom: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ 
          ...typography.subheader,
          marginBottom: spacing.lg,
          color: colors.neutral[900]
        }}>
          📱 QR Code Scanner
        </h3>
        
        <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            onClick={() => setShowQRScanner(true)}
            icon="📱"
            disabled={loading}
          >
            Scan QR Code
          </Button>
          
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
              Or Enter Pass Number Manually
            </label>
            <input
              type="text"
              value={manualPassNumber}
              onChange={(e) => setManualPassNumber(e.target.value)}
              placeholder="Enter pass number..."
              style={{
                width: '100%',
                padding: spacing.sm,
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <Button
            variant="secondary"
            onClick={handleManualValidation}
            icon="🔍"
            disabled={loading || !manualPassNumber.trim()}
          >
            Validate
          </Button>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <ErrorBoundary fallback={<div style={{ padding: spacing.lg, color: colors.critical }}>Scanner crashed. Close and try again.</div>}>
          <QRScanner
            onScan={handleQRScan}
            onError={(error) => {
              console.error('QR Scan error:', error);
              alert('Failed to scan QR code. Please try again.');
            }}
            onClose={() => setShowQRScanner(false)}
            autoStart
          />
        </ErrorBoundary>
      )}

      {/* Validation Result */}
      {validationResult && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: spacing.xl,
          marginBottom: spacing.xl,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: `2px solid ${validationResult.success ? colors.status.normal : colors.status.critical}`
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: spacing.sm,
            marginBottom: spacing.lg
          }}>
            <div style={{ fontSize: '2rem' }}>
              {validationResult.success ? '✅' : '❌'}
            </div>
            <div>
              <h3 style={{ 
                ...typography.subheader,
                margin: 0,
                color: validationResult.success ? colors.status.normal : colors.status.critical
              }}>
                {validationResult.success ? 'Validation Successful' : 'Validation Failed'}
              </h3>
              <p style={{ 
                ...typography.bodySmall,
                color: colors.neutral[600],
                margin: 0
              }}>
                {validationResult.message}
              </p>
            </div>
          </div>

          {validationResult.success && currentPass && (
            <div style={{
              padding: spacing.lg,
              backgroundColor: colors.neutral[50],
              borderRadius: '12px',
              marginBottom: spacing.lg
            }}>
              <h4 style={{ 
                ...typography.subheader,
                marginBottom: spacing.md,
                color: colors.neutral[900]
              }}>
                Pass Details
              </h4>
              
              <div style={{ display: 'grid', gap: spacing.sm }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.neutral[600] }}>Pass Number:</span>
                  <span style={{ fontWeight: 600 }}>{currentPass.pass_number}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.neutral[600] }}>Type:</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {currentPass.type} Pass
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.neutral[600] }}>Name:</span>
                  <span style={{ fontWeight: 600 }}>
                    {currentPass.visitor_name || currentPass.vehicle_registration || 'N/A'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.neutral[600] }}>Purpose:</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {currentPass.purpose}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.neutral[600] }}>Status:</span>
                  <span style={{ 
                    fontWeight: 600,
                    color: getStatusColor(currentPass.status)
                  }}>
                    {getStatusText(currentPass.status)}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.neutral[600] }}>Valid From:</span>
                  <span style={{ fontWeight: 600 }}>
                    {new Date(currentPass.valid_from).toLocaleString('en-IN')}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.neutral[600] }}>Valid To:</span>
                  <span style={{ fontWeight: 600 }}>
                    {new Date(currentPass.valid_to).toLocaleString('en-IN')}
                  </span>
                </div>
                
                {currentPass.access_code && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: colors.neutral[600] }}>Access Code:</span>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {currentPass.access_code}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {validationResult.success && currentPass && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.sm }}>
              {(() => {
                const entryAllowed = currentPass.status === 'active';
                const exitAllowed = currentPass.status === 'inside';
                if (validationType === 'entry') {
                  return (
                    <>
                      <Button variant="primary" onClick={processEntry} icon="🚪" disabled={loading || !entryAllowed}>
                        {loading ? 'Processing...' : 'Record Entry'}
                      </Button>
                      {!entryAllowed && (
                        <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                          Entry not allowed for current status ({getStatusText(currentPass.status)}).
                        </div>
                      )}
                    </>
                  );
                }
                return (
                  <>
                    <Button variant="primary" onClick={processExit} icon="🚪" disabled={loading || !exitAllowed}>
                      {loading ? 'Processing...' : 'Record Exit'}
                    </Button>
                    {!exitAllowed && (
                      <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                        Exit not allowed unless status is Inside.
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Audit Trail */}
          {validationResult?.success && currentPass && (
            <div style={{ marginTop: spacing.lg }}>
              <h4 style={{ ...typography.subheader, marginBottom: spacing.sm, color: colors.neutral[900] }}>
                Recent Validations
              </h4>
              {history.length === 0 ? (
                <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>No recent validations found.</div>
              ) : (
                <div style={{ display: 'grid', gap: spacing.xs }}>
                  {history.slice(0, 6).map((h) => (
                    <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: colors.neutral[700] }}>
                      <span style={{ textTransform: 'capitalize' }}>{h.type}</span>
                      <span>{new Date(h.ts).toLocaleString('en-IN')}</span>
                      <span>{h.validated_by}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Validation Notes */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.lg,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ 
          ...typography.subheader,
          marginBottom: spacing.lg,
          color: colors.neutral[900]
        }}>
          📝 Validation Notes
        </h3>
        
        <textarea
          value={validationNotes}
          onChange={(e) => setValidationNotes(e.target.value)}
          placeholder="Add any notes about the validation process..."
          style={{
            width: '100%',
            padding: spacing.sm,
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '14px',
            minHeight: '80px',
            resize: 'vertical'
          }}
        />
      </div>
    </div>
  );
};

