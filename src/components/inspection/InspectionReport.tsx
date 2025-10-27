import React, { useState, useEffect } from 'react';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../ui/button';

interface InspectionData {
  id: string;
  template: {
    name: string;
    description: string;
  };
  vehicle: {
    registration_number: string;
    make: string;
    model: string;
    year: number;
    chassis_number: string;
    engine_number: string;
  };
  inspector: {
    name: string;
    employee_id: string;
  };
  reviewer?: {
    name: string;
    employee_id: string;
  };
  status: string;
  overall_rating: number;
  pass_fail: string;
  has_critical_issues: boolean;
  started_at: string;
  completed_at: string;
  reviewed_at?: string;
  inspector_notes?: string;
  reviewer_notes?: string;
  answers: Array<{
    question: {
      id: string;
      question_text: string;
      question_type: string;
      is_critical: boolean;
    };
    answer_value: any;
    answer_files?: any[];
    answer_metadata?: any;
    is_critical_finding: boolean;
  }>;
}

interface InspectionReportProps {
  inspection: InspectionData;
  onGeneratePDF: () => void;
  onEmailReport: () => void;
  onShareReport: () => void;
}

export const InspectionReport: React.FC<InspectionReportProps> = ({
  inspection,
  onGeneratePDF,
  onEmailReport,
  onShareReport
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.status.normal;
      case 'approved': return colors.status.normal;
      case 'rejected': return colors.status.critical;
      case 'pending': return colors.status.warning;
      default: return colors.neutral[400];
    }
  };

  const getPassFailColor = (passFail: string) => {
    switch (passFail) {
      case 'pass': return colors.status.normal;
      case 'fail': return colors.status.critical;
      case 'conditional': return colors.status.warning;
      default: return colors.neutral[400];
    }
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      await onGeneratePDF();
    } finally {
      setIsGenerating(false);
    }
  };

  const criticalFindings = inspection.answers.filter(answer => 
    answer.is_critical_finding || answer.question.is_critical
  );

  const photoAnswers = inspection.answers.filter(answer => 
    answer.question.question_type === 'camera' && answer.answer_files?.length > 0
  );

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: spacing.xl,
      backgroundColor: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: spacing.xl,
        padding: spacing.xl,
        backgroundColor: colors.neutral[50],
        borderRadius: '12px',
        border: `2px solid ${colors.primary}`
      }}>
        <h1 style={{
          ...typography.header,
          fontSize: '28px',
          color: colors.primary,
          marginBottom: spacing.sm
        }}>
          🔍 Vehicle Inspection Report (VIR)
        </h1>
        <p style={{
          ...typography.body,
          color: colors.neutral[600]
        }}>
          {inspection.template.name} - {inspection.template.description}
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: spacing.lg,
          marginTop: spacing.md,
          flexWrap: 'wrap'
        }}>
          <span style={{
            ...typography.subheader,
            color: colors.neutral[700]
          }}>
            Report ID: VIR-{inspection.id.slice(-8).toUpperCase()}
          </span>
          <span style={{
            ...typography.subheader,
            color: colors.neutral[700]
          }}>
            Date: {formatDate(inspection.completed_at)}
          </span>
        </div>
      </div>

      {/* Vehicle Information */}
      <div style={{
        marginBottom: spacing.xl,
        padding: spacing.lg,
        backgroundColor: colors.neutral[50],
        borderRadius: '12px'
      }}>
        <h2 style={{
          ...typography.subheader,
          color: colors.neutral[900],
          marginBottom: spacing.md
        }}>
          🚗 Vehicle Information
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: spacing.md
        }}>
          <div>
            <label style={{ ...typography.label, color: colors.neutral[600] }}>Registration</label>
            <p style={{ ...typography.body, color: colors.neutral[900] }}>
              {inspection.vehicle.registration_number}
            </p>
          </div>
          <div>
            <label style={{ ...typography.label, color: colors.neutral[600] }}>Make & Model</label>
            <p style={{ ...typography.body, color: colors.neutral[900] }}>
              {inspection.vehicle.make} {inspection.vehicle.model}
            </p>
          </div>
          <div>
            <label style={{ ...typography.label, color: colors.neutral[600] }}>Year</label>
            <p style={{ ...typography.body, color: colors.neutral[900] }}>
              {inspection.vehicle.year}
            </p>
          </div>
          <div>
            <label style={{ ...typography.label, color: colors.neutral[600] }}>Chassis No</label>
            <p style={{ ...typography.body, color: colors.neutral[900] }}>
              {inspection.vehicle.chassis_number}
            </p>
          </div>
          <div>
            <label style={{ ...typography.label, color: colors.neutral[600] }}>Engine No</label>
            <p style={{ ...typography.body, color: colors.neutral[900] }}>
              {inspection.vehicle.engine_number}
            </p>
          </div>
        </div>
      </div>

      {/* Inspection Summary */}
      <div style={{
        marginBottom: spacing.xl,
        padding: spacing.lg,
        backgroundColor: colors.neutral[50],
        borderRadius: '12px'
      }}>
        <h2 style={{
          ...typography.subheader,
          color: colors.neutral[900],
          marginBottom: spacing.md
        }}>
          📊 Inspection Summary
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: spacing.md
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              ...typography.header,
              fontSize: '24px',
              color: colors.primary,
              marginBottom: spacing.xs
            }}>
              {inspection.overall_rating}/10
            </div>
            <div style={{ ...typography.label, color: colors.neutral[600] }}>
              Overall Rating
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              ...typography.header,
              fontSize: '24px',
              color: getPassFailColor(inspection.pass_fail),
              marginBottom: spacing.xs
            }}>
              {inspection.pass_fail.toUpperCase()}
            </div>
            <div style={{ ...typography.label, color: colors.neutral[600] }}>
              Result
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              ...typography.header,
              fontSize: '24px',
              color: inspection.has_critical_issues ? colors.status.critical : colors.status.normal,
              marginBottom: spacing.xs
            }}>
              {criticalFindings.length}
            </div>
            <div style={{ ...typography.label, color: colors.neutral[600] }}>
              Critical Issues
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              ...typography.header,
              fontSize: '24px',
              color: colors.neutral[700],
              marginBottom: spacing.xs
            }}>
              {photoAnswers.length}
            </div>
            <div style={{ ...typography.label, color: colors.neutral[600] }}>
              Photo Evidence
            </div>
          </div>
        </div>
      </div>

      {/* Critical Findings */}
      {criticalFindings.length > 0 && (
        <div style={{
          marginBottom: spacing.xl,
          padding: spacing.lg,
          backgroundColor: colors.status.critical + '10',
          borderRadius: '12px',
          border: `2px solid ${colors.status.critical}`
        }}>
          <h2 style={{
            ...typography.subheader,
            color: colors.status.critical,
            marginBottom: spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            ⚠️ Critical Findings
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {criticalFindings.map((finding, index) => (
              <div
                key={index}
                style={{
                  padding: spacing.md,
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: `1px solid ${colors.status.critical}`
                }}
              >
                <div style={{
                  ...typography.body,
                  color: colors.neutral[900],
                  marginBottom: spacing.xs
                }}>
                  <strong>{finding.question.question_text}</strong>
                </div>
                <div style={{
                  ...typography.bodySmall,
                  color: colors.neutral[700]
                }}>
                  Answer: {String(finding.answer_value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inspector Information */}
      <div style={{
        marginBottom: spacing.xl,
        padding: spacing.lg,
        backgroundColor: colors.neutral[50],
        borderRadius: '12px'
      }}>
        <h2 style={{
          ...typography.subheader,
          color: colors.neutral[900],
          marginBottom: spacing.md
        }}>
          👤 Inspector Information
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: spacing.md
        }}>
          <div>
            <label style={{ ...typography.label, color: colors.neutral[600] }}>Inspector</label>
            <p style={{ ...typography.body, color: colors.neutral[900] }}>
              {inspection.inspector.name} ({inspection.inspector.employee_id})
            </p>
          </div>
          <div>
            <label style={{ ...typography.label, color: colors.neutral[600] }}>Started</label>
            <p style={{ ...typography.body, color: colors.neutral[900] }}>
              {formatDate(inspection.started_at)}
            </p>
          </div>
          <div>
            <label style={{ ...typography.label, color: colors.neutral[600] }}>Completed</label>
            <p style={{ ...typography.body, color: colors.neutral[900] }}>
              {formatDate(inspection.completed_at)}
            </p>
          </div>
          {inspection.reviewer && (
            <div>
              <label style={{ ...typography.label, color: colors.neutral[600] }}>Reviewed By</label>
              <p style={{ ...typography.body, color: colors.neutral[900] }}>
                {inspection.reviewer.name} ({inspection.reviewer.employee_id})
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {(inspection.inspector_notes || inspection.reviewer_notes) && (
        <div style={{
          marginBottom: spacing.xl,
          padding: spacing.lg,
          backgroundColor: colors.neutral[50],
          borderRadius: '12px'
        }}>
          <h2 style={{
            ...typography.subheader,
            color: colors.neutral[900],
            marginBottom: spacing.md
          }}>
            📝 Notes & Comments
          </h2>
          {inspection.inspector_notes && (
            <div style={{ marginBottom: spacing.md }}>
              <label style={{ ...typography.label, color: colors.neutral[600] }}>
                Inspector Notes
              </label>
              <p style={{ ...typography.body, color: colors.neutral[900] }}>
                {inspection.inspector_notes}
              </p>
            </div>
          )}
          {inspection.reviewer_notes && (
            <div>
              <label style={{ ...typography.label, color: colors.neutral[600] }}>
                Reviewer Notes
              </label>
              <p style={{ ...typography.body, color: colors.neutral[900] }}>
                {inspection.reviewer_notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: spacing.md,
        justifyContent: 'center',
        flexWrap: 'wrap',
        padding: spacing.xl,
        backgroundColor: colors.neutral[50],
        borderRadius: '12px'
      }}>
        <Button
          variant="primary"
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          icon="📄"
        >
          {isGenerating ? 'Generating...' : 'Generate PDF'}
        </Button>
        
        <Button
          variant="secondary"
          onClick={onEmailReport}
          icon="📧"
        >
          Email Report
        </Button>
        
        <Button
          variant="secondary"
          onClick={onShareReport}
          icon="🔗"
        >
          Share Report
        </Button>
      </div>
    </div>
  );
};

