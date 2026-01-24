/**
 * Quick Validation - Single-Screen Guard Interface
 * 
 * Redesigned with persistent regions:
 * - Scanner (50% height, always active)
 * - Manual Input (inline, always visible)
 * - Result Card (shows after scan)
 * - Recent History (bottom, persistent)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useValidatePass } from '@/hooks/useGatePasses';
import { CompactQRScanner } from '@/components/ui/CompactQRScanner';
import { ManualEntryInput } from './components/ManualEntryInput';
import { ValidationResultCard } from './components/ValidationResultCard';
import { RecentScansList, type RecentScan } from './components/RecentScansList';
import { Button } from '@/components/ui/button';
import { useToast } from '@/providers/ToastProvider';
import { triggerFeedback, hapticFeedbackAction } from '@/lib/feedbackHelpers';
import { loadRecentScans, saveScanToHistory, clearScanHistory } from './utils/scanHistory';
import type { GatePass } from './gatePassTypes';
import { getPassDisplayName, isExpired } from './gatePassTypes';
import { colors, typography, spacing } from '@/lib/theme';

interface ValidationPageState {
  // Scanner
  cameraActive: boolean;
  cameraError: string | null;
  
  // Manual input
  manualInput: string;
  
  // Current result
  currentResult: {
    status: 'idle' | 'loading' | 'success' | 'error';
    pass: GatePass | null;
    suggestedAction: 'entry' | 'exit' | null;
    errorMessage: string | null;
  };
  
  // Action processing
  actionPending: boolean;
  
  // History
  recentScans: RecentScan[];
}

export const QuickValidation: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const validatePass = useValidatePass();
  
  const [state, setState] = useState<ValidationPageState>({
    cameraActive: true,
    cameraError: null,
    manualInput: '',
    currentResult: {
      status: 'idle',
      pass: null,
      suggestedAction: null,
      errorMessage: null,
    },
    actionPending: false,
    recentScans: [],
  });

  // Load history on mount
  useEffect(() => {
    const scans = loadRecentScans();
    setState(prev => ({ ...prev, recentScans: scans }));
  }, []);

  // Auto-detect suggested action based on pass status
  const detectSuggestedAction = useCallback((pass: GatePass): 'entry' | 'exit' | null => {
    if (isExpired(pass)) {
      return null;
    }
    
    if (pass.status === 'active' || pass.status === 'pending') {
      return 'entry';
    }
    
    if (pass.status === 'inside') {
      return 'exit';
    }
    
    return null;
  }, []);

  // Parse QR data (handles JSON, URLs, or plain text)
  const parseQRData = useCallback((data: string): string => {
    try {
      // Try parsing as JSON
      const parsed = JSON.parse(data);
      if (parsed.access_code) return parsed.access_code;
      if (parsed.id) return parsed.id;
    } catch {
      // Not JSON, continue
    }
    
    // If it's a URL, try to extract access_code from query params
    if (data.startsWith('http://') || data.startsWith('https://')) {
      try {
        const url = new URL(data);
        const accessCode = url.searchParams.get('access_code') || url.searchParams.get('token');
        if (accessCode) return accessCode;
      } catch {
        // Invalid URL, continue
      }
    }
    
    return data.trim();
  }, []);

  // Validate pass (scan or manual entry)
  const handleValidate = useCallback(async (identifier: string) => {
    const accessCode = parseQRData(identifier);
    
    // Set loading state
    setState(prev => ({
      ...prev,
      currentResult: {
        status: 'loading',
        pass: null,
        suggestedAction: null,
        errorMessage: null,
      },
    }));

    try {
      const result = await validatePass.mutateAsync({
        access_code: accessCode,
        action: 'validate_only',
      });

      if (result.valid && result.pass) {
        const pass = result.pass;
        const suggestedAction = detectSuggestedAction(pass);
        
        // Update result state
        setState(prev => ({
          ...prev,
          currentResult: {
            status: 'success',
            pass,
            suggestedAction,
            errorMessage: null,
          },
        }));

        // Add to history
        const scan: RecentScan = {
          passNumber: pass.pass_number,
          displayName: getPassDisplayName(pass),
          action: suggestedAction || 'validation',
          timestamp: Date.now(),
          success: true,
          passId: pass.id,
          accessCode: pass.access_code,
        };
        saveScanToHistory(scan);
        
        // Update recent scans in state
        setState(prev => ({
          ...prev,
          recentScans: [scan, ...prev.recentScans].slice(0, 10),
        }));

        triggerFeedback('success');
      } else {
        setState(prev => ({
          ...prev,
          currentResult: {
            status: 'error',
            pass: null,
            suggestedAction: null,
            errorMessage: result.message || 'Pass not found or expired',
          },
        }));

        // Add failed scan to history
        const scan: RecentScan = {
          passNumber: identifier.substring(0, 20), // Truncate if too long
          displayName: 'Invalid',
          action: 'validation',
          timestamp: Date.now(),
          success: false,
        };
        saveScanToHistory(scan);
        
        setState(prev => ({
          ...prev,
          recentScans: [scan, ...prev.recentScans].slice(0, 10),
        }));

        triggerFeedback('error');
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        currentResult: {
          status: 'error',
          pass: null,
          suggestedAction: null,
          errorMessage: error.message || 'Failed to validate pass. Please try again.',
        },
      }));

      triggerFeedback('error');
    }
  }, [parseQRData, validatePass, detectSuggestedAction]);

  // Handle QR scan
  const handleQRScan = useCallback((data: string) => {
    handleValidate(data);
  }, [handleValidate]);

  // Handle manual entry submit
  const handleManualSubmit = useCallback((code: string) => {
    if (!code.trim()) {
      showToast({
        title: 'Error',
        description: 'Please enter a pass number or access code',
        variant: 'error',
      });
      return;
    }
    handleValidate(code);
  }, [handleValidate, showToast]);

  // Handle action confirm (entry or exit)
  const handleActionConfirm = useCallback(async (action: 'entry' | 'exit') => {
    const { pass } = state.currentResult;
    if (!pass) return;

    setState(prev => ({ ...prev, actionPending: true }));

    try {
      const result = await validatePass.mutateAsync({
        access_code: pass.access_code,
        action,
      });

      if (result.valid && result.action_taken && result.pass) {
        // Update pass with new status
        const updatedPass = result.pass;
        const newSuggestedAction = detectSuggestedAction(updatedPass);
        
        setState(prev => ({
          ...prev,
          currentResult: {
            ...prev.currentResult,
            pass: updatedPass,
            suggestedAction: newSuggestedAction,
          },
          actionPending: false,
        }));

        // Update history
        const scan: RecentScan = {
          passNumber: updatedPass.pass_number,
          displayName: getPassDisplayName(updatedPass),
          action,
          timestamp: Date.now(),
          success: true,
          passId: updatedPass.id,
          accessCode: updatedPass.access_code,
        };
        saveScanToHistory(scan);
        
        setState(prev => ({
          ...prev,
          recentScans: [scan, ...prev.recentScans.filter(s => s.passNumber !== scan.passNumber)].slice(0, 10),
        }));

        hapticFeedbackAction();
        showToast({
          title: 'Success',
          description: action === 'entry' 
            ? 'Entry recorded successfully!' 
            : 'Exit recorded successfully!',
          variant: 'success',
          duration: 2000,
        });

        // Auto-clear after 2 seconds
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            currentResult: {
              status: 'idle',
              pass: null,
              suggestedAction: null,
              errorMessage: null,
            },
          }));
        }, 2000);
      } else {
        setState(prev => ({ ...prev, actionPending: false }));
        triggerFeedback('error');
        showToast({
          title: 'Error',
          description: result.message || 'Failed to record action',
          variant: 'error',
        });
      }
    } catch (error: any) {
      setState(prev => ({ ...prev, actionPending: false }));
      triggerFeedback('error');
      showToast({
        title: 'Error',
        description: error.message || 'Failed to record action. Please try again.',
        variant: 'error',
      });
    }
  }, [state.currentResult, validatePass, detectSuggestedAction, showToast]);

  // Handle re-validation from history
  const handleRevalidate = useCallback((scan: RecentScan) => {
    if (scan.accessCode) {
      handleValidate(scan.accessCode);
    } else if (scan.passNumber) {
      handleValidate(scan.passNumber);
    }
  }, [handleValidate]);

  // Handle clear result
  const handleClearResult = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentResult: {
        status: 'idle',
        pass: null,
        suggestedAction: null,
        errorMessage: null,
      },
    }));
  }, []);

  // Handle clear history
  const handleClearHistory = useCallback(() => {
    clearScanHistory();
    setState(prev => ({ ...prev, recentScans: [] }));
  }, []);

  // Handle camera error
  const handleCameraError = useCallback((error: string) => {
    setState(prev => ({ ...prev, cameraError: error }));
  }, []);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: colors.neutral[50],
      overflow: 'hidden',
    }}>
      {/* Header - Fixed */}
      <div style={{
        padding: spacing.md,
        backgroundColor: colors.neutral[800],
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${colors.neutral[700]}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <Button
            variant="ghost"
            onClick={() => navigate('/app/gate-pass')}
            icon={<ArrowLeft size={20} />}
            style={{ color: 'white' }}
          >
            Back
          </Button>
          <h1 style={{
            ...typography.header,
            fontSize: '20px',
            color: 'white',
            margin: 0,
          }}>
            🛡️ Gate Validation
          </h1>
        </div>
      </div>

      {/* Scanner Region - 50% height */}
      <div style={{ 
        height: '50vh',
        maxHeight: '400px',
        position: 'relative',
        flexShrink: 0,
      }}>
        <CompactQRScanner
          onScan={handleQRScan}
          onError={handleCameraError}
          height="100%"
        />
      </div>

      {/* Manual Input Region - Inline */}
      <div style={{
        padding: spacing.md,
        backgroundColor: 'white',
        borderBottom: `1px solid ${colors.neutral[200]}`,
        flexShrink: 0,
      }}>
        <ManualEntryInput
          onSubmit={handleManualSubmit}
          disabled={state.currentResult.status === 'loading'}
          loading={state.currentResult.status === 'loading'}
        />
      </div>

      {/* Result Region - Flexible */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: spacing.md,
        backgroundColor: colors.neutral[50],
      }}>
        <ValidationResultCard
          status={state.currentResult.status}
          pass={state.currentResult.pass}
          suggestedAction={state.currentResult.suggestedAction}
          errorMessage={state.currentResult.errorMessage}
          onActionConfirm={handleActionConfirm}
          actionPending={state.actionPending}
          onClear={handleClearResult}
        />
      </div>

      {/* Recent History Region - Fixed height */}
      <div style={{
        height: '150px',
        flexShrink: 0,
        overflowY: 'auto',
      }}>
        <RecentScansList
          scans={state.recentScans}
          onRevalidate={handleRevalidate}
          onClear={handleClearHistory}
        />
      </div>
    </div>
  );
};
