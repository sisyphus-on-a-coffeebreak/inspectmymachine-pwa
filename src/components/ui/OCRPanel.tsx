/**
 * OCR Extraction Panel Component
 * 
 * Displays OCR results and allows auto-filling expense form
 */

import React, { useState, useRef } from 'react';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { Button } from './button';
import { extractTextFromImage, extractTextWithProgress } from '../../lib/ocr';
import { Loader2, FileImage, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

// Define OCRResult type locally to avoid runtime import issues
export interface OCRResult {
  text: string;
  confidence: number;
  amount?: number;
  date?: string;
  merchant?: string;
  items?: string[];
}

export interface OCRPanelProps {
  imageFile?: File | string;
  onExtract?: (result: OCRResult) => void;
  onApply?: (data: Partial<OCRFormData>) => void;
  onClose?: () => void;
}

export interface OCRFormData {
  amount?: string;
  date?: string;
  description?: string;
  merchant?: string;
}

export const OCRPanel: React.FC<OCRPanelProps> = ({
  imageFile,
  onExtract,
  onApply,
  onClose,
}) => {
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExtract = async (file?: File | string) => {
    const targetFile = file || imageFile;
    if (!targetFile) return;

    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const result = await extractTextWithProgress(targetFile, (prog) => {
        setProgress(Math.round(prog * 100));
      });

      setOcrResult(result);
      onExtract?.(result);
    } catch (err: any) {
      setError(err.message || 'Failed to extract text from image');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleExtract(file);
    }
  };

  const handleApply = () => {
    if (!ocrResult) return;

    const formData: Partial<OCRFormData> = {};
    
    if (ocrResult.amount) {
      formData.amount = ocrResult.amount.toString();
    }
    
    if (ocrResult.date) {
      // Try to parse and format date
      try {
        const parsed = new Date(ocrResult.date);
        if (!isNaN(parsed.getTime())) {
          formData.date = parsed.toISOString().split('T')[0];
        } else {
          formData.date = ocrResult.date;
        }
      } catch {
        formData.date = ocrResult.date;
      }
    }

    if (ocrResult.merchant) {
      formData.description = ocrResult.merchant;
      formData.merchant = ocrResult.merchant;
    } else if (ocrResult.items && ocrResult.items.length > 0) {
      formData.description = ocrResult.items[0];
    }

    onApply?.(formData);
  };

  React.useEffect(() => {
    if (imageFile) {
      handleExtract();
    }
  }, [imageFile]);

  return (
    <div style={{
      backgroundColor: colors.neutral[50],
      border: `1px solid ${colors.neutral[200]}`,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <h4 style={{ ...typography.subheader, margin: 0, color: colors.neutral[900] }}>
          📄 OCR Receipt Extraction
        </h4>
        {onClose && (
          <Button
            variant="ghost"
            onClick={onClose}
            style={{ padding: spacing.xs }}
          >
            ✕
          </Button>
        )}
      </div>

      {!imageFile && (
        <div style={{ marginBottom: spacing.md }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            icon={<FileImage size={16} />}
            style={{ width: '100%' }}
          >
            Select Receipt Image
          </Button>
        </div>
      )}

      {loading && (
        <div style={{
          padding: spacing.xl,
          textAlign: 'center',
          backgroundColor: 'white',
          borderRadius: borderRadius.sm,
          border: `1px solid ${colors.neutral[200]}`,
        }}>
          <Loader2 size={32} color={colors.primary} style={{ animation: 'spin 1s linear infinite', marginBottom: spacing.sm }} />
          <div style={{ ...typography.body, color: colors.neutral[700], marginBottom: spacing.xs }}>
            Extracting text from receipt...
          </div>
          <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
            {progress}% complete
          </div>
        </div>
      )}

      {error && (
        <div style={{
          padding: spacing.md,
          backgroundColor: colors.status.error + '15',
          border: `1px solid ${colors.status.error}`,
          borderRadius: borderRadius.sm,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.md,
        }}>
          <XCircle size={20} color={colors.status.error} />
          <div style={{ ...typography.bodySmall, color: colors.status.error }}>
            {error}
          </div>
        </div>
      )}

      {ocrResult && !loading && (
        <div>
          {/* Confidence Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing.md,
            padding: spacing.sm,
            backgroundColor: ocrResult.confidence > 70 ? colors.status.normal + '15' : colors.status.warning + '15',
            border: `1px solid ${ocrResult.confidence > 70 ? colors.status.normal : colors.status.warning}`,
            borderRadius: borderRadius.sm,
          }}>
            {ocrResult.confidence > 70 ? (
              <CheckCircle2 size={20} color={colors.status.normal} />
            ) : (
              <AlertCircle size={20} color={colors.status.warning} />
            )}
            <div style={{ ...typography.bodySmall, flex: 1 }}>
              Confidence: {Math.round(ocrResult.confidence)}%
              {ocrResult.confidence < 70 && ' (Low - please verify extracted data)'}
            </div>
          </div>

          {/* Extracted Data */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: borderRadius.sm,
            padding: spacing.md,
            marginBottom: spacing.md,
            border: `1px solid ${colors.neutral[200]}`,
          }}>
            {ocrResult.amount && (
              <div style={{ marginBottom: spacing.sm }}>
                <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                  Amount
                </div>
                <div style={{ ...typography.subheader, color: colors.status.normal, fontWeight: 700 }}>
                  ₹{ocrResult.amount.toLocaleString('en-IN')}
                </div>
              </div>
            )}

            {ocrResult.date && (
              <div style={{ marginBottom: spacing.sm }}>
                <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                  Date
                </div>
                <div style={{ ...typography.body, color: colors.neutral[900] }}>
                  {ocrResult.date}
                </div>
              </div>
            )}

            {ocrResult.merchant && (
              <div style={{ marginBottom: spacing.sm }}>
                <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                  Merchant
                </div>
                <div style={{ ...typography.body, color: colors.neutral[900] }}>
                  {ocrResult.merchant}
                </div>
              </div>
            )}

            {ocrResult.items && ocrResult.items.length > 0 && (
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                  Items Found
                </div>
                <div style={{
                  maxHeight: '150px',
                  overflowY: 'auto',
                  padding: spacing.xs,
                  backgroundColor: colors.neutral[50],
                  borderRadius: borderRadius.xs,
                }}>
                  {ocrResult.items.map((item, idx) => (
                    <div key={idx} style={{ ...typography.bodySmall, color: colors.neutral[700], marginBottom: spacing.xs }}>
                      • {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Full Text Preview */}
          <details style={{ marginBottom: spacing.md }}>
            <summary style={{
              ...typography.label,
              color: colors.neutral[700],
              cursor: 'pointer',
              padding: spacing.sm,
              backgroundColor: 'white',
              borderRadius: borderRadius.sm,
              border: `1px solid ${colors.neutral[200]}`,
            }}>
              View Full Extracted Text
            </summary>
            <div style={{
              marginTop: spacing.sm,
              padding: spacing.md,
              backgroundColor: 'white',
              borderRadius: borderRadius.sm,
              border: `1px solid ${colors.neutral[200]}`,
              maxHeight: '200px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              ...typography.bodySmall,
              color: colors.neutral[700],
              fontFamily: 'monospace',
            }}>
              {ocrResult.text}
            </div>
          </details>

          {/* Action Buttons */}
          {onApply && (
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <Button
                variant="primary"
                onClick={handleApply}
                style={{ flex: 1 }}
                icon={<CheckCircle2 size={16} />}
              >
                Apply to Form
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleExtract()}
                icon="🔄"
              >
                Re-extract
              </Button>
            </div>
          )}
        </div>
      )}

      {!loading && !ocrResult && !error && imageFile && (
        <Button
          variant="primary"
          onClick={() => handleExtract()}
          style={{ width: '100%' }}
        >
          Extract Text from Receipt
        </Button>
      )}
    </div>
  );
};


