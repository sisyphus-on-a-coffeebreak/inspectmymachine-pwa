import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/ui/PageHeader';
import { NetworkError } from '../../components/ui/NetworkError';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../providers/ToastProvider';
import { addRecentlyViewed } from '../../lib/recentlyViewed';
import { RelatedItems } from '../../components/ui/RelatedItems';
import { AnomalyAlert } from '../../components/ui/AnomalyAlert';
import { PolicyLinks } from '../../components/ui/PolicyLinks';
import { ConflictResolutionModal } from '../../components/inspection/ConflictResolutionModal';
import { DraggableReportBuilder } from '../../components/inspection/DraggableReportBuilder';
import { RtoDetailsManager } from '../../components/inspection/RtoDetailsManager';
import { fetchInspectionTemplate } from '../../lib/inspection-templates';
import { useInspections } from '../../lib/queries';
import { useAuth } from '../../providers/useAuth';

interface InspectionDetails {
  id: string;
  template_id: string;
  vehicle_id?: string;
  inspector_id: string;
  reviewer_id?: string;
  status: string;
  overall_rating?: number;
  pass_fail?: string;
  has_critical_issues: boolean;
  duration_minutes?: number;
  started_at?: string;
  completed_at?: string;
  reviewed_at?: string;
  inspector_notes?: string;
  reviewer_notes?: string;
  created_at: string;
  updated_at: string;
  template?: {
    id: string;
    name: string;
    description: string;
    sections: Array<{
      id: string;
      name: string;
      questions: Array<{
        id: string;
        question_text: string;
        question_type: string;
        is_required: boolean;
        is_critical: boolean;
      }>;
    }>;
  };
  vehicle?: {
    id: string;
    registration_number: string;
    make: string;
    model: string;
    year: number;
  };
  inspector?: {
    id: string;
    name: string;
    email: string;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
  answers: Array<{
    id: string;
    question_id: string;
    answer_value: any;
    answer_files?: any[];
    answer_metadata?: any;
    is_critical_finding: boolean;
    question?: {
      id: string;
      question_text: string;
      question_type: string;
      is_critical: boolean;
    };
  }>;
  rto_details?: {
    id: string;
    rc_number?: string;
    rc_issue_date?: string;
    rc_expiry_date?: string;
    rc_owner_name?: string;
    rc_owner_address?: string;
    fitness_certificate_number?: string;
    fitness_issue_date?: string;
    fitness_expiry_date?: string;
    fitness_status?: string;
    permit_number?: string;
    permit_issue_date?: string;
    permit_expiry_date?: string;
    permit_type?: string;
    insurance_policy_number?: string;
    insurance_company?: string;
    insurance_issue_date?: string;
    insurance_expiry_date?: string;
    insurance_type?: string;
    tax_certificate_number?: string;
    tax_paid_date?: string;
    tax_valid_until?: string;
    puc_certificate_number?: string;
    puc_issue_date?: string;
    puc_expiry_date?: string;
    puc_status?: string;
    show_rc_details?: boolean;
    show_fitness?: boolean;
    show_permit?: boolean;
    show_insurance?: boolean;
    show_tax?: boolean;
    show_puc?: boolean;
    [key: string]: any;
  };
}

export const InspectionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect legacy route /inspections/:id to /app/inspections/:id
  useEffect(() => {
    if (location.pathname.startsWith('/inspections/') && !location.pathname.startsWith('/app/inspections/')) {
      navigate(`/app/inspections/${id}`, { replace: true });
    }
  }, [location.pathname, id, navigate]);
  const { showToast } = useToast();
  const { user } = useAuth();
  const [inspection, setInspection] = useState<InspectionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const [resolvingConflict, setResolvingConflict] = useState(false);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showRtoManager, setShowRtoManager] = useState(false);

  // Fetch related inspections for the same vehicle
  const { data: relatedInspectionsData } = useInspections(
    inspection?.vehicle_id ? { vehicle_id: inspection.vehicle_id, per_page: 5 } : undefined,
    { enabled: !!inspection?.vehicle_id }
  );
  
  const relatedInspections = relatedInspectionsData?.data?.filter(
    (insp: any) => insp.id !== id
  ) || [];

  const fetchInspectionDetails = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/v1/inspections/${id}`);
      // Ensure ID is always a string
      const inspectionData = {
        ...response.data,
        id: String(response.data?.id || id),
      };
      setInspection(inspectionData);
      
      // Check for template version conflict
      if (response.data?.template_id && response.data?.started_at) {
        try {
          const templateData = await fetchInspectionTemplate(response.data.template_id, { forceRefresh: true });
          const templateUpdatedAt = templateData.template.updated_at 
            ? new Date(templateData.template.updated_at) 
            : null;
          const startedAt = new Date(response.data.started_at);
          
          if (templateUpdatedAt && templateUpdatedAt > startedAt) {
            setCurrentTemplate(templateData.template);
            // Only show modal if inspection is still in progress
            if (response.data.status === 'draft' || response.data.status === 'in_progress') {
              setShowConflictModal(true);
            }
          }
        } catch (err) {
          // Silently fail - template fetch is not critical
          console.warn('Failed to fetch current template for conflict detection:', err);
        }
      }
      
      // Track in recently viewed
      if (response.data && id) {
        addRecentlyViewed({
          id: String(id),
          type: 'inspection',
          title: `Inspection #${id.substring(0, 8)}`,
          subtitle: response.data.template?.name || response.data.vehicle?.registration_number || 'Vehicle Inspection',
          path: `/app/inspections/${id}`,
        });
      }
    } catch (apiError) {
      // Backend not available - show error instead of mock data
      setError(apiError instanceof Error ? apiError : new Error('Failed to load inspection details'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInspectionDetails();
  }, [fetchInspectionDetails]);

  const generatePDF = async () => {
    if (!inspection) return;
    
    try {
      setGeneratingPDF(true);
      
      // Try to generate PDF from backend first
      try {
        // Note: apiClient doesn't support blob responseType directly, use axios for PDF downloads
        // For blob responses, we need to use axios directly with apiClient's CSRF handling
        const axios = (await import('axios')).default;
        const { apiClient: client } = await import('../../lib/apiClient');
        await (client as any).ensureCsrfToken?.();
        const csrfToken = (client as any).getCsrfToken?.();
        
        const response = await axios.get(`/v1/inspections/${id}/report`, {
          responseType: 'blob',
          withCredentials: true,
          headers: {
            ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
          },
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `VIR-${inspection.id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        // PDF generated successfully from backend
        return;
      } catch (apiError) {
        // Backend PDF generation not available, using client-side generation
      }
      
      // Fallback to client-side PDF generation
      await generateClientSidePDF();
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'error',
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const generateClientSidePDF = async () => {
    if (!inspection) return;

    // Method 1: Try using browser's native PDF generation
    try {
      await generateNativePDF();
    } catch (error) {
      // Native PDF generation failed, trying print method
      
      // Method 2: Try using browser's print to PDF functionality
      try {
        await generatePDFViaPrint();
      } catch (printError) {
        // Print method failed, using fallback HTML
        // Method 3: Fallback to downloadable HTML
        await generateDownloadableHTML();
      }
    }
  };

  const generateNativePDF = async () => {
    // Check if browser supports PDF generation
    if (!window.print) {
      throw new Error('Browser does not support PDF generation');
    }

    // Create a temporary element with the PDF content
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '210mm';
    tempDiv.style.height = '297mm';
    tempDiv.innerHTML = generatePDFHTML();
    document.body.appendChild(tempDiv);

    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      throw new Error('Could not open print window');
    }

    return new Promise<void>((resolve, reject) => {
      try {
        printWindow.document.write(generatePDFHTML());
        printWindow.document.close();

        printWindow.onload = () => {
          setTimeout(() => {
            try {
              printWindow.print();
              
              // Clean up
              setTimeout(() => {
                printWindow.close();
                document.body.removeChild(tempDiv);
                resolve();
              }, 2000);
            } catch (printError) {
              printWindow.close();
              document.body.removeChild(tempDiv);
              reject(printError);
            }
          }, 1000);
        };

        printWindow.onerror = () => {
          printWindow.close();
          document.body.removeChild(tempDiv);
          reject(new Error('Failed to load print window'));
        };
      } catch (error) {
        printWindow.close();
        document.body.removeChild(tempDiv);
        reject(error);
      }
    });
  };

  const generatePDFViaPrint = async () => {
    // Create a hidden iframe for PDF generation
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '210mm'; // A4 width
    iframe.style.height = '297mm'; // A4 height
    document.body.appendChild(iframe);

    return new Promise<void>((resolve, reject) => {
      iframe.onload = () => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!iframeDoc) {
            reject(new Error('Could not access iframe document'));
            return;
          }

          // Write HTML content to iframe
          iframeDoc.write(generatePDFHTML());
          iframeDoc.close();

          // Wait for content to load, then trigger print
          setTimeout(() => {
            try {
              iframe.contentWindow?.print();
              
              // Clean up after a delay
              setTimeout(() => {
                document.body.removeChild(iframe);
                resolve();
              }, 2000);
            } catch (printError) {
              document.body.removeChild(iframe);
              reject(printError);
            }
          }, 500);
        } catch (error) {
          document.body.removeChild(iframe);
          reject(error);
        }
      };

      iframe.onerror = () => {
        document.body.removeChild(iframe);
        reject(new Error('Failed to load iframe'));
      };

      // Set iframe source to trigger onload
      iframe.src = 'about:blank';
    });
  };

  const generateDownloadableHTML = async () => {
    // Generate HTML content for PDF
    const htmlContent = generatePDFHTML();
    
    // Create blob with proper MIME type
    const blob = new Blob([htmlContent], { 
      type: 'text/html;charset=utf-8' 
    });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `VIR-${inspection.id}.html`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    // Show instructions to user
    showToast({
      title: 'Download Complete',
      description: 'HTML file downloaded. You can open it in your browser and use "Print to PDF" to save as PDF.',
      variant: 'success',
      duration: 7000,
    });
  };

  const generatePDFHTML = () => {
    if (!inspection) return '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Vehicle Inspection Report - ${inspection.id}</title>
        <style>
          @media print {
            @page {
              margin: 0.5in;
              size: A4;
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0;
              font-size: 12px;
              line-height: 1.4;
            }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
          }
          
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
          }
          
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
          }
          .company-name { 
            font-size: 24px; 
            font-weight: bold; 
            color: #2563eb; 
            margin-bottom: 5px;
          }
          .report-title { 
            font-size: 18px; 
            margin: 10px 0; 
            color: #1f2937;
          }
          .report-id { 
            font-size: 14px; 
            color: #6b7280;
          }
          
          .inspection-info { 
            background: #f8fafc; 
            padding: 15px; 
            border-radius: 8px; 
            margin-bottom: 20px;
            border: 1px solid #e5e7eb;
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
          }
          .info-item { 
            display: flex; 
            justify-content: space-between; 
            padding: 5px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-item:last-child { 
            border-bottom: none; 
          }
          .info-label { 
            font-weight: bold; 
            color: #374151;
          }
          .info-value { 
            color: #1f2937;
          }
          
          .section { 
            margin: 25px 0; 
            page-break-inside: avoid;
          }
          .section-title { 
            font-size: 16px; 
            font-weight: bold; 
            color: #1f2937; 
            margin-bottom: 15px;
            padding: 10px;
            background: #f3f4f6;
            border-left: 4px solid #3b82f6;
          }
          
          .question { 
            margin: 12px 0; 
            padding: 12px; 
            background: #ffffff; 
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            page-break-inside: avoid;
          }
          .question-text { 
            font-weight: bold; 
            margin-bottom: 8px; 
            color: #1f2937;
            font-size: 13px;
          }
          .answer { 
            color: #374151; 
            padding: 8px;
            background: #f9fafb;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
          }
          .critical { 
            border-left: 4px solid #ef4444; 
            background: #fef2f2;
          }
          .critical-label {
            background: #ef4444;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            margin-left: 8px;
          }
          
          .status-pass { color: #059669; font-weight: bold; }
          .status-fail { color: #dc2626; font-weight: bold; }
          .status-conditional { color: #d97706; font-weight: bold; }
          
          .notes-section {
            margin-top: 30px;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #6b7280;
            font-size: 10px;
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
          }
          
          .critical-issues {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 10px;
            border-radius: 6px;
            margin: 15px 0;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">VOMS</div>
          <div class="report-title">Vehicle Inspection Report (VIR)</div>
          <div class="report-id">Report ID: ${inspection.id}</div>
        </div>

        <div class="inspection-info">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Vehicle:</span>
              <span class="info-value">${inspection.vehicle?.make || 'N/A'} ${inspection.vehicle?.model || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Registration:</span>
              <span class="info-value">${inspection.vehicle?.registration_number || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Inspector:</span>
              <span class="info-value">${inspection.inspector?.name || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date:</span>
              <span class="info-value">${new Date(inspection.completed_at || inspection.created_at).toLocaleDateString('en-IN')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Overall Rating:</span>
              <span class="info-value">${inspection.overall_rating || 'N/A'}/10</span>
            </div>
            <div class="info-item">
              <span class="info-label">Result:</span>
              <span class="info-value">
                <span class="status-${inspection.pass_fail || 'unknown'}">${inspection.pass_fail || 'N/A'}</span>
              </span>
            </div>
          </div>
          
          ${inspection.has_critical_issues ? 
            '<div class="critical-issues">⚠️ Critical Issues Found - Immediate Attention Required</div>' : 
            '<div style="color: #059669; font-weight: bold; margin-top: 10px;">✅ No Critical Issues Found</div>'
          }
        </div>

        ${inspection.template?.sections.map((section, sectionIndex) => `
          <div class="section ${sectionIndex > 0 ? 'page-break' : ''}">
            <div class="section-title">${section.name}</div>
            ${section.questions.map(question => {
              const answer = inspection.answers.find(a => a.question_id === question.id);
              const answerValue = answer ? 
                (typeof answer.answer_value === 'object' ? JSON.stringify(answer.answer_value) : String(answer.answer_value)) : 
                'No answer provided';
              
              return `
                <div class="question ${question.is_critical ? 'critical' : ''}">
                  <div class="question-text">
                    ${question.question_text}
                    ${question.is_critical ? '<span class="critical-label">CRITICAL</span>' : ''}
                  </div>
                  <div class="answer">
                    ${answerValue}
                    ${answer?.is_critical_finding ? '<br><strong style="color: #dc2626;">⚠️ Critical Finding</strong>' : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `).join('') || ''}

        ${inspection.inspector_notes ? `
          <div class="notes-section">
            <div class="section-title">Inspector Notes</div>
            <div style="padding: 10px; background: white; border-radius: 4px; border: 1px solid #e5e7eb;">
              ${inspection.inspector_notes}
            </div>
          </div>
        ` : ''}

        <div class="footer">
          <div>This report was generated on ${new Date().toLocaleString('en-IN')}</div>
          <div>VOMS - Vehicle Operations Management System</div>
          <div style="margin-top: 10px;">
            <strong>Disclaimer:</strong> This inspection report is based on the conditions observed at the time of inspection. 
            Vehicle conditions may change over time and regular maintenance is recommended.
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.status.normal;
      case 'pending': return colors.status.warning;
      case 'rejected': return colors.status.critical;
      case 'approved': return colors.status.normal;
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

  if (loading) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>🔍</div>
        <div style={{ color: colors.neutral[600] }}>Loading inspection details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.sm }}>
        <NetworkError
          error={error}
          onRetry={fetchInspectionDetails}
          onGoBack={() => navigate('/app/inspections')}
        />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.sm }}>
        <EmptyState
          icon="🔍"
          title="Inspection Not Found"
          description="The requested inspection could not be found."
          action={{
            label: "Back to Inspections",
            onClick: () => navigate('/app/inspections'),
            icon: "⬅️"
          }}
        />
      </div>
    );
  }

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
      <PageHeader
        title={`Inspection #${String(inspection.id || '').substring(0, 8)}`}
        subtitle={inspection.template?.name || 'Vehicle Inspection Report'}
        icon="🔍"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Inspections', path: '/app/inspections' },
          { label: 'Details' }
        ]}
        actions={
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button
              variant="secondary"
              onClick={() => navigate('/app/inspections')}
              icon="⬅️"
            >
              Back
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowReportBuilder(true)}
              icon="🎨"
            >
              Customize Report
            </Button>
            <Button
              variant="primary"
              onClick={generatePDF}
              disabled={generatingPDF}
              icon="📄"
            >
              {generatingPDF ? 'Generating...' : 'Download PDF'}
            </Button>
            {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'supervisor') && (
              <Button
                variant="secondary"
                onClick={() => setShowRtoManager(true)}
                icon="📋"
              >
                Add RTO Details
              </Button>
            )}
          </div>
        }
      />

      {/* Policy Links */}
      <PolicyLinks
        title="Inspection Standards & Compliance"
        links={[
          {
            label: 'Inspection Standards',
            url: '/policies/inspection-standards',
            external: false,
            icon: '📐'
          },
          {
            label: 'Critical Issue Definitions',
            url: '/policies/critical-issues',
            external: false,
            icon: '⚠️'
          },
          {
            label: 'Regulatory Compliance',
            url: '/policies/regulatory-compliance',
            external: false,
            icon: '⚖️'
          }
        ]}
        variant="compact"
      />

      {/* Anomaly Alerts */}
      {inspection && (() => {
        const now = new Date();
        const anomalies = [];

        // Check for inspection overdue > 30 days
        if (inspection.started_at && !inspection.completed_at) {
          const startedAt = new Date(inspection.started_at);
          const daysSinceStart = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceStart > 30) {
            anomalies.push({
              title: 'Inspection Overdue > 30 Days',
              description: `This inspection was started ${Math.floor(daysSinceStart)} days ago and is still incomplete. Please complete or cancel it.`,
              severity: 'error' as const,
            });
          }
        }

        // Check for critical issues found
        if (inspection.has_critical_issues) {
          const criticalCount = inspection.answers?.filter((a: any) => a.is_critical_finding).length || 0;
          anomalies.push({
            title: 'Critical Issues Found',
            description: `This inspection has ${criticalCount} critical finding${criticalCount > 1 ? 's' : ''}. Immediate action may be required.`,
            severity: 'critical' as const,
          });
        }

        // Check for template updated mid-inspection
        if (inspection.template && inspection.started_at && inspection.template.updated_at) {
          const startedAt = new Date(inspection.started_at);
          const templateUpdatedAt = new Date(inspection.template.updated_at);
          if (templateUpdatedAt > startedAt) {
            anomalies.push({
              title: 'Template Updated During Inspection',
              description: 'The inspection template was updated after this inspection was started. Some questions may have changed.',
              severity: 'warning' as const,
            });
          }
        }

        return anomalies.length > 0 ? (
          <div style={{ marginTop: spacing.lg }}>
            {anomalies.map((anomaly, index) => (
              <AnomalyAlert
                key={`anomaly-${anomaly.title || anomaly.id || index}`}
                title={anomaly.title}
                description={anomaly.description}
                severity={anomaly.severity}
                dismissible={false}
              />
            ))}
          </div>
        ) : null;
      })()}

      {/* Inspection Summary */}
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
          📊 Inspection Summary
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: spacing.lg }}>
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Vehicle Information
            </div>
            <div style={{ ...typography.body, color: colors.neutral[900] }}>
              {inspection.vehicle ? 
                `${inspection.vehicle.make} ${inspection.vehicle.model} (${inspection.vehicle.registration_number})` :
                'No vehicle information available'
              }
            </div>
          </div>
          
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Inspector
            </div>
            <div style={{ ...typography.body, color: colors.neutral[900] }}>
              {inspection.inspector?.name || 'Unknown Inspector'}
            </div>
          </div>
          
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Overall Rating
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '24px',
              color: colors.primary,
              fontWeight: 700
            }}>
              {inspection.overall_rating ? `${inspection.overall_rating}/10` : 'N/A'}
            </div>
          </div>
          
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Result
            </div>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <span style={{
                padding: '6px 16px',
                backgroundColor: getStatusColor(inspection.status),
                color: 'white',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 600,
                textTransform: 'capitalize'
              }}>
                {inspection.status}
              </span>
              {inspection.pass_fail && (
                <span style={{
                  padding: '6px 16px',
                  backgroundColor: getPassFailColor(inspection.pass_fail),
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}>
                  {inspection.pass_fail}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {inspection.has_critical_issues && (
          <div style={{
            marginTop: spacing.lg,
            padding: spacing.md,
            backgroundColor: colors.status.critical + '20',
            border: `1px solid ${colors.status.critical}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div style={{ ...typography.label, color: colors.status.critical }}>
              Critical Issues Found
            </div>
          </div>
        )}
      </div>

      {/* Inspection Details */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ 
          ...typography.subheader,
          marginBottom: spacing.lg,
          color: colors.neutral[900]
        }}>
          📋 Inspection Details
        </h3>
        
        {inspection.template?.sections.map(section => (
          <div key={section.id} style={{ marginBottom: spacing.xl }}>
            <h4 style={{ 
              ...typography.subheader,
              fontSize: '18px',
              color: colors.neutral[900],
              marginBottom: spacing.md,
              paddingBottom: spacing.sm,
              borderBottom: `2px solid ${colors.primary}`
            }}>
              {section.name}
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {section.questions.map(question => {
                const answer = inspection.answers.find(a => a.question_id === question.id);
                return (
                  <div key={question.id} style={{
                    padding: spacing.lg,
                    border: `1px solid ${question.is_critical ? colors.status.critical : colors.neutral[200]}`,
                    borderRadius: '12px',
                    backgroundColor: question.is_critical ? colors.status.critical + '10' : colors.neutral[50]
                  }}>
                    <div style={{ 
                      ...typography.subheader,
                      fontSize: '16px',
                      color: colors.neutral[900],
                      marginBottom: spacing.sm,
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm
                    }}>
                      {question.question_text}
                      {question.is_critical && (
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: colors.status.critical,
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: 600
                        }}>
                          CRITICAL
                        </span>
                      )}
                    </div>
                    
                    <div style={{ 
                      ...typography.body,
                      color: colors.neutral[700],
                      padding: spacing.sm,
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB'
                    }}>
                      {answer ? (
                        <div>
                          <div style={{ marginBottom: spacing.xs }}>
                            {typeof answer.answer_value === 'object' ? 
                              JSON.stringify(answer.answer_value) : 
                              String(answer.answer_value)
                            }
                          </div>
                          {answer.is_critical_finding && (
                            <div style={{
                              color: colors.status.critical,
                              fontWeight: 600,
                              fontSize: '14px'
                            }}>
                              ⚠️ Critical Finding
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ color: colors.neutral[500], fontStyle: 'italic' }}>
                          No answer provided
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )) || (
          <div style={{ textAlign: 'center', padding: spacing.xl }}>
            <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📋</div>
            <div style={{ ...typography.body, color: colors.neutral[600] }}>
              No inspection details available
            </div>
          </div>
        )}
        
        {inspection.inspector_notes && (
          <div style={{ marginTop: spacing.xl }}>
            <h4 style={{ 
              ...typography.subheader,
              fontSize: '18px',
              color: colors.neutral[900],
              marginBottom: spacing.md
            }}>
              📝 Inspector Notes
            </h4>
            <div style={{
              padding: spacing.lg,
              backgroundColor: colors.neutral[50],
              borderRadius: '12px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ ...typography.body, color: colors.neutral[700] }}>
                {inspection.inspector_notes}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Linked Gate Pass */}
      {inspection.linked_gate_pass && (
        <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
          <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>Auto-created Gate Pass</h3>
          <div style={{ ...typography.body, color: colors.neutral[600], marginBottom: spacing.md }}>
            A vehicle exit pass was automatically created for this inspection:
          </div>
          <div style={{
            padding: spacing.md,
            border: `1px solid ${colors.neutral[200]}`,
            borderRadius: borderRadius.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ ...typography.body, fontWeight: 600 }}>
                Gate Pass #{inspection.linked_gate_pass.pass_number}
              </div>
              <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                Purpose: {inspection.linked_gate_pass.purpose} • Status: {inspection.linked_gate_pass.status}
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate(`/app/gate-pass/${inspection.linked_gate_pass.id}`)}
              style={{ padding: `${spacing.xs}px ${spacing.sm}px` }}
            >
              View
            </Button>
          </div>
        </div>
      )}

      {/* Linked Components */}
      {inspection.linked_components && inspection.linked_components.length > 0 && (
        <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
          <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>Linked Components</h3>
          <div style={{ ...typography.body, color: colors.neutral[600], marginBottom: spacing.md }}>
            The following components were linked to this inspection based on inspection findings:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {inspection.linked_components.map((component: any) => {
              const typeLabels: Record<string, string> = {
                battery: 'Battery',
                tyre: 'Tyre',
                spare_part: 'Spare Part',
              };
              
              return (
                <div
                  key={`${component.component_type}-${component.component_id}`}
                  style={{
                    padding: spacing.md,
                    border: `1px solid ${colors.neutral[200]}`,
                    borderRadius: borderRadius.md,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ ...typography.body, fontWeight: 600 }}>{component.component_name}</div>
                    <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                      {typeLabels[component.component_type] || 'Component'}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/app/stockyard/components/${component.component_type}/${component.component_id}`)}
                    style={{ padding: `${spacing.xs}px ${spacing.sm}px` }}
                  >
                    View
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Related Items */}
      {inspection.vehicle_id && (
        <div style={{ marginTop: spacing.lg, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: spacing.lg }}>
          {/* Related Inspections Panel */}
          {relatedInspections.length > 0 && (
            <RelatedItems
              title="Related Inspections"
              items={relatedInspections.slice(0, 5).map((insp: any) => ({
                id: insp.id,
                title: `Inspection #${String(insp.id || '').substring(0, 8)}`,
                subtitle: `${insp.template?.name || 'Inspection'} - ${insp.status || 'Unknown'}`,
                path: `/app/inspections/${insp.id}`,
                icon: '🔍',
                type: insp.has_critical_issues ? 'Has Critical Issues' : undefined,
              }))}
              variant="compact"
              maxItems={5}
            />
          )}
          
          <RelatedItems
            title="Vehicle History"
            items={[
              {
                id: 'all-inspections',
                title: 'All Inspections',
                subtitle: `View all ${relatedInspectionsData?.total || 0} inspections for this vehicle`,
                path: `/app/inspections?vehicle=${inspection.vehicle_id}`,
                icon: '🔍',
              },
              {
                id: 'gate-passes',
                title: 'Gate Passes',
                subtitle: 'View gate passes for this vehicle',
                path: `/app/gate-pass?vehicle=${inspection.vehicle_id}`,
                icon: '🚪',
              },
            ]}
            variant="compact"
          />
        </div>
      )}

      {/* Template Conflict Resolution Modal */}
      {inspection && currentTemplate && inspection.template && (
        <ConflictResolutionModal
          isOpen={showConflictModal}
          onClose={() => setShowConflictModal(false)}
          oldTemplate={inspection.template}
          newTemplate={currentTemplate}
          inspectionAnswers={inspection.answers.reduce((acc: Record<string, any>, answer: any) => {
            acc[answer.question_id] = answer.answer_value;
            return acc;
          }, {})}
          onResolve={async (strategy) => {
            try {
              setResolvingConflict(true);
              
              // Update inspection template reference
              await apiClient.patch(`/v1/inspections/${id}`, {
                template_id: currentTemplate.id,
                template_version_resolution: strategy,
              });
              
              // Refresh inspection data
              await fetchInspectionDetails();
              
              setShowConflictModal(false);
              showToast({
                title: 'Conflict Resolved',
                description: `Template conflict resolved using ${strategy === 'keep_answers' ? 'Keep Answers' : strategy === 'use_new_template' ? 'New Template' : 'Smart Merge'} strategy.`,
                variant: 'success',
              });
            } catch (err) {
              showToast({
                title: 'Error',
                description: err instanceof Error ? err.message : 'Failed to resolve template conflict',
                variant: 'error',
              });
            } finally {
              setResolvingConflict(false);
            }
          }}
          resolving={resolvingConflict}
        />
      )}

      {/* Report Builder Modal */}
      {showReportBuilder && inspection && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, backgroundColor: 'white' }}>
          <DraggableReportBuilder
            inspection={inspection}
            onClose={() => {
              setShowReportBuilder(false);
              fetchInspectionDetails(); // Refresh to get updated layout
            }}
          />
        </div>
      )}

      {/* RTO Details Manager Modal */}
      {showRtoManager && (
        <RtoDetailsManager
          inspectionId={id || ''}
          isOpen={showRtoManager}
          onClose={() => setShowRtoManager(false)}
          onSave={() => {
            fetchInspectionDetails(); // Refresh to get updated RTO details
          }}
        />
      )}
    </div>
  );
};
