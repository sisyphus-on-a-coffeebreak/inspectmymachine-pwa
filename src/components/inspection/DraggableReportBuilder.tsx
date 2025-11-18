import React, { useState, useEffect, useCallback } from 'react';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { Button } from '../ui/button';
import { apiClient } from '../../lib/apiClient';
import { useToast } from '../../providers/ToastProvider';
import { GripVertical, Eye, EyeOff, Download, Save, Move, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ReportSection {
  id: string;
  type: string;
  label: string;
  order: number;
  visible: boolean;
}

interface DraggableReportBuilderProps {
  inspection: any;
  onClose?: () => void;
}

export const DraggableReportBuilder: React.FC<DraggableReportBuilderProps> = ({
  inspection,
  onClose,
}) => {
  const { showToast } = useToast();
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState('Vehicle Inspection Report');
  const [reportFooter, setReportFooter] = useState('');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [includePhotos, setIncludePhotos] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize sections
  useEffect(() => {
    const defaultSections: ReportSection[] = [
      { id: 'header', type: 'header', label: 'Report Header', order: 0, visible: true },
      { id: 'vehicle_info', type: 'vehicle_info', label: 'Vehicle Information', order: 1, visible: true },
      { id: 'rto_details', type: 'rto_details', label: 'RTO Details', order: 2, visible: true },
      { id: 'inspection_summary', type: 'inspection_summary', label: 'Inspection Summary', order: 3, visible: true },
      { id: 'critical_findings', type: 'critical_findings', label: 'Critical Findings', order: 4, visible: true },
      { id: 'answers', type: 'answers', label: 'Inspection Answers', order: 5, visible: true },
      { id: 'photos', type: 'photos', label: 'Photos', order: 6, visible: true },
      { id: 'signatures', type: 'signatures', label: 'Signatures', order: 7, visible: true },
      { id: 'footer', type: 'footer', label: 'Footer', order: 8, visible: true },
    ];
    setSections(defaultSections);
    
    // Load saved layout if exists
    loadSavedLayout();
  }, [inspection?.id]);

  const loadSavedLayout = async () => {
    if (!inspection?.id) return;
    
    try {
      const response = await apiClient.get(`/v1/inspections/${inspection.id}/report-layout`, {
        suppressErrorLog: true, // Suppress 404 errors as they're expected when no layout exists
      });
      if (response.data?.success && response.data.data) {
        const layout = response.data.data;
        setReportTitle(layout.report_title || 'Vehicle Inspection Report');
        setReportFooter(layout.report_footer || '');
        setIncludeLogo(layout.include_company_logo ?? true);
        setIncludeSignatures(layout.include_signatures ?? true);
        setIncludePhotos(layout.include_photos ?? true);
        
        if (layout.section_order && layout.visible_sections) {
          const savedSections = layout.section_order.map((sectionId: string, index: number) => {
            const defaultSection = sections.find(s => s.id === sectionId) || 
              { id: sectionId, type: sectionId, label: sectionId, order: index, visible: true };
            return {
              ...defaultSection,
              order: index,
              visible: layout.visible_sections[sectionId] ?? true,
            };
          });
          setSections(savedSections);
        }
      }
    } catch (error: any) {
      // Layout doesn't exist yet, use defaults - this is expected
      // Only log if it's not a 404 (which means no layout exists yet)
      if (error?.response?.status !== 404) {
        console.log('Error loading saved layout:', error);
      }
    }
  };

  const handleDragStart = (sectionId: string) => {
    setDraggedSection(sectionId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetSectionId: string) => {
    if (!draggedSection || draggedSection === targetSectionId) return;

    setSections(prev => {
      const newSections = [...prev];
      const draggedIndex = newSections.findIndex(s => s.id === draggedSection);
      const targetIndex = newSections.findIndex(s => s.id === targetSectionId);

      const [dragged] = newSections.splice(draggedIndex, 1);
      newSections.splice(targetIndex, 0, dragged);

      // Update order
      return newSections.map((s, index) => ({ ...s, order: index }));
    });

    setDraggedSection(null);
  };

  const toggleSectionVisibility = (sectionId: string) => {
    setSections(prev =>
      prev.map(s => s.id === sectionId ? { ...s, visible: !s.visible } : s)
    );
  };

  const saveLayout = async () => {
    if (!inspection?.id) return;

    setSaving(true);
    try {
      const layoutConfig = {
        sections: sections.map(s => ({ id: s.id, type: s.type, order: s.order })),
      };

      await apiClient.post(`/v1/inspections/${inspection.id}/report-layout`, {
        layout_config: layoutConfig,
        section_order: sections.map(s => s.id),
        visible_sections: sections.reduce((acc, s) => {
          acc[s.id] = s.visible;
          return acc;
        }, {} as Record<string, boolean>),
        report_title: reportTitle,
        report_footer: reportFooter,
        include_company_logo: includeLogo,
        include_signatures: includeSignatures,
        include_photos: includePhotos,
        is_default: true,
      });

      showToast({
        title: 'Success',
        description: 'Report layout saved successfully',
        variant: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save layout',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      const reportElement = document.getElementById('report-preview');
      if (!reportElement) {
        throw new Error('Report preview not found');
      }

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`VIR-${inspection.id.substring(0, 8)}.pdf`);

      showToast({
        title: 'Success',
        description: 'PDF generated successfully',
        variant: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate PDF',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderSection = (section: ReportSection) => {
    switch (section.type) {
      case 'header':
        return (
          <div style={{ textAlign: 'center', padding: spacing.lg, backgroundColor: colors.neutral[50] }}>
            <h1 style={{ ...typography.header, fontSize: '24px', color: colors.primary }}>
              {reportTitle}
            </h1>
            <p style={{ ...typography.body, color: colors.neutral[600] }}>
              Report ID: VIR-{inspection.id.substring(0, 8).toUpperCase()}
            </p>
            <p style={{ ...typography.body, color: colors.neutral[600] }}>
              Date: {new Date(inspection.completed_at || inspection.created_at).toLocaleDateString()}
            </p>
          </div>
        );

      case 'vehicle_info':
        return (
          <div style={{ padding: spacing.md, backgroundColor: 'white', border: `1px solid ${colors.neutral[200]}` }}>
            <h2 style={{ ...typography.subheader, marginBottom: spacing.md }}>Vehicle Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.sm }}>
              <div><strong>Registration:</strong> {inspection.vehicle?.registration_number}</div>
              <div><strong>Make/Model:</strong> {inspection.vehicle?.make} {inspection.vehicle?.model}</div>
              <div><strong>Year:</strong> {inspection.vehicle?.year}</div>
              <div><strong>Chassis:</strong> {inspection.vehicle?.chassis_number || 'N/A'}</div>
              <div><strong>Engine:</strong> {inspection.vehicle?.engine_number || 'N/A'}</div>
            </div>
          </div>
        );

      case 'rto_details':
        return (
          <div style={{ padding: spacing.md, backgroundColor: 'white', border: `1px solid ${colors.neutral[200]}` }}>
            <h2 style={{ ...typography.subheader, marginBottom: spacing.md }}>RTO Details</h2>
            {inspection.rto_details ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                {/* RC Details */}
                {inspection.rto_details.show_rc_details !== false && inspection.rto_details.rc_number && (
                  <div style={{ padding: spacing.sm, backgroundColor: colors.neutral[50], borderRadius: borderRadius.sm }}>
                    <div style={{ ...typography.label, marginBottom: spacing.xs, color: colors.primary }}>Registration Certificate (RC)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.sm }}>
                      {inspection.rto_details.rc_number && <div><strong>RC Number:</strong> {inspection.rto_details.rc_number}</div>}
                      {inspection.rto_details.rc_issue_date && <div><strong>Issue Date:</strong> {new Date(inspection.rto_details.rc_issue_date).toLocaleDateString()}</div>}
                      {inspection.rto_details.rc_expiry_date && <div><strong>Expiry Date:</strong> {new Date(inspection.rto_details.rc_expiry_date).toLocaleDateString()}</div>}
                      {inspection.rto_details.rc_owner_name && <div><strong>Owner:</strong> {inspection.rto_details.rc_owner_name}</div>}
                    </div>
                  </div>
                )}

                {/* Fitness Certificate */}
                {inspection.rto_details.show_fitness !== false && inspection.rto_details.fitness_certificate_number && (
                  <div style={{ padding: spacing.sm, backgroundColor: colors.neutral[50], borderRadius: borderRadius.sm }}>
                    <div style={{ ...typography.label, marginBottom: spacing.xs, color: colors.primary }}>Fitness Certificate</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.sm }}>
                      <div><strong>Certificate Number:</strong> {inspection.rto_details.fitness_certificate_number}</div>
                      {inspection.rto_details.fitness_issue_date && <div><strong>Issue Date:</strong> {new Date(inspection.rto_details.fitness_issue_date).toLocaleDateString()}</div>}
                      {inspection.rto_details.fitness_expiry_date && <div><strong>Expiry Date:</strong> {new Date(inspection.rto_details.fitness_expiry_date).toLocaleDateString()}</div>}
                      {inspection.rto_details.fitness_status && <div><strong>Status:</strong> {inspection.rto_details.fitness_status}</div>}
                    </div>
                  </div>
                )}

                {/* Permit */}
                {inspection.rto_details.show_permit !== false && inspection.rto_details.permit_number && (
                  <div style={{ padding: spacing.sm, backgroundColor: colors.neutral[50], borderRadius: borderRadius.sm }}>
                    <div style={{ ...typography.label, marginBottom: spacing.xs, color: colors.primary }}>Permit</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.sm }}>
                      <div><strong>Permit Number:</strong> {inspection.rto_details.permit_number}</div>
                      {inspection.rto_details.permit_type && <div><strong>Type:</strong> {inspection.rto_details.permit_type}</div>}
                      {inspection.rto_details.permit_issue_date && <div><strong>Issue Date:</strong> {new Date(inspection.rto_details.permit_issue_date).toLocaleDateString()}</div>}
                      {inspection.rto_details.permit_expiry_date && <div><strong>Expiry Date:</strong> {new Date(inspection.rto_details.permit_expiry_date).toLocaleDateString()}</div>}
                    </div>
                  </div>
                )}

                {/* Insurance */}
                {inspection.rto_details.show_insurance !== false && inspection.rto_details.insurance_policy_number && (
                  <div style={{ padding: spacing.sm, backgroundColor: colors.neutral[50], borderRadius: borderRadius.sm }}>
                    <div style={{ ...typography.label, marginBottom: spacing.xs, color: colors.primary }}>Insurance</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.sm }}>
                      <div><strong>Policy Number:</strong> {inspection.rto_details.insurance_policy_number}</div>
                      {inspection.rto_details.insurance_company && <div><strong>Company:</strong> {inspection.rto_details.insurance_company}</div>}
                      {inspection.rto_details.insurance_type && <div><strong>Type:</strong> {inspection.rto_details.insurance_type}</div>}
                      {inspection.rto_details.insurance_issue_date && <div><strong>Issue Date:</strong> {new Date(inspection.rto_details.insurance_issue_date).toLocaleDateString()}</div>}
                      {inspection.rto_details.insurance_expiry_date && <div><strong>Expiry Date:</strong> {new Date(inspection.rto_details.insurance_expiry_date).toLocaleDateString()}</div>}
                    </div>
                  </div>
                )}

                {/* Tax */}
                {inspection.rto_details.show_tax !== false && inspection.rto_details.tax_certificate_number && (
                  <div style={{ padding: spacing.sm, backgroundColor: colors.neutral[50], borderRadius: borderRadius.sm }}>
                    <div style={{ ...typography.label, marginBottom: spacing.xs, color: colors.primary }}>Tax Certificate</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.sm }}>
                      <div><strong>Certificate Number:</strong> {inspection.rto_details.tax_certificate_number}</div>
                      {inspection.rto_details.tax_paid_date && <div><strong>Paid Date:</strong> {new Date(inspection.rto_details.tax_paid_date).toLocaleDateString()}</div>}
                      {inspection.rto_details.tax_valid_until && <div><strong>Valid Until:</strong> {new Date(inspection.rto_details.tax_valid_until).toLocaleDateString()}</div>}
                    </div>
                  </div>
                )}

                {/* PUC */}
                {inspection.rto_details.show_puc !== false && inspection.rto_details.puc_certificate_number && (
                  <div style={{ padding: spacing.sm, backgroundColor: colors.neutral[50], borderRadius: borderRadius.sm }}>
                    <div style={{ ...typography.label, marginBottom: spacing.xs, color: colors.primary }}>Pollution Under Control (PUC)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.sm }}>
                      <div><strong>Certificate Number:</strong> {inspection.rto_details.puc_certificate_number}</div>
                      {inspection.rto_details.puc_issue_date && <div><strong>Issue Date:</strong> {new Date(inspection.rto_details.puc_issue_date).toLocaleDateString()}</div>}
                      {inspection.rto_details.puc_expiry_date && <div><strong>Expiry Date:</strong> {new Date(inspection.rto_details.puc_expiry_date).toLocaleDateString()}</div>}
                      {inspection.rto_details.puc_status && <div><strong>Status:</strong> {inspection.rto_details.puc_status}</div>}
                    </div>
                  </div>
                )}

                {/* Show message if all sections are hidden */}
                {inspection.rto_details.show_rc_details === false &&
                 inspection.rto_details.show_fitness === false &&
                 inspection.rto_details.show_permit === false &&
                 inspection.rto_details.show_insurance === false &&
                 inspection.rto_details.show_tax === false &&
                 inspection.rto_details.show_puc === false && (
                  <div style={{ color: colors.neutral[500], fontStyle: 'italic', textAlign: 'center', padding: spacing.md }}>
                    All RTO details have been hidden from the report
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: colors.neutral[500], fontStyle: 'italic' }}>
                RTO details not yet added by back office
              </div>
            )}
          </div>
        );

      case 'inspection_summary':
        return (
          <div style={{ padding: spacing.md, backgroundColor: 'white', border: `1px solid ${colors.neutral[200]}` }}>
            <h2 style={{ ...typography.subheader, marginBottom: spacing.md }}>Inspection Summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.sm }}>
              <div><strong>Status:</strong> {inspection.status}</div>
              <div><strong>Rating:</strong> {inspection.overall_rating || 'N/A'}/10</div>
              <div><strong>Pass/Fail:</strong> {inspection.pass_fail || 'N/A'}</div>
              <div><strong>Critical Issues:</strong> {inspection.has_critical_issues ? 'Yes' : 'No'}</div>
            </div>
          </div>
        );

      case 'critical_findings':
        if (!inspection.has_critical_issues) return null;
        const criticalAnswers = inspection.answers?.filter((a: any) => a.is_critical_finding) || [];
        return (
          <div style={{ padding: spacing.md, backgroundColor: colors.error[50], border: `2px solid ${colors.error[300]}` }}>
            <h2 style={{ ...typography.subheader, marginBottom: spacing.md, color: colors.error[700] }}>
              Critical Findings
            </h2>
            {criticalAnswers.map((answer: any, index: number) => (
              <div key={`critical-${answer.question_id || answer.id || index}`} style={{ marginBottom: spacing.sm }}>
                <strong>{answer.question?.question_text}:</strong> {String(answer.answer_value)}
              </div>
            ))}
          </div>
        );

      case 'answers':
        return (
          <div style={{ padding: spacing.md, backgroundColor: 'white', border: `1px solid ${colors.neutral[200]}` }}>
            <h2 style={{ ...typography.subheader, marginBottom: spacing.md }}>Inspection Answers</h2>
            {inspection.answers?.slice(0, 5).map((answer: any, index: number) => (
              <div key={`answer-${answer.question_id || answer.id || index}`} style={{ marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottom: `1px solid ${colors.neutral[200]}` }}>
                <div style={{ fontWeight: 600, marginBottom: spacing.xs }}>{answer.question?.question_text}</div>
                <div>{String(answer.answer_value)}</div>
              </div>
            ))}
            {inspection.answers?.length > 5 && (
              <div style={{ color: colors.neutral[600], fontStyle: 'italic' }}>
                ... and {inspection.answers.length - 5} more answers
              </div>
            )}
          </div>
        );

      case 'photos':
        if (!includePhotos) return null;
        const photoAnswers = inspection.answers?.filter((a: any) => a.answer_files?.length > 0) || [];
        if (photoAnswers.length === 0) return null;
        return (
          <div style={{ padding: spacing.md, backgroundColor: 'white', border: `1px solid ${colors.neutral[200]}` }}>
            <h2 style={{ ...typography.subheader, marginBottom: spacing.md }}>Photos</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.sm }}>
              {photoAnswers.slice(0, 6).map((answer: any, index: number) => (
                <img
                  key={`photo-${answer.question_id || answer.id || index}`}
                  src={answer.answer_files[0]}
                  alt={`Photo ${index + 1}`}
                  style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: borderRadius.sm }}
                />
              ))}
            </div>
          </div>
        );

      case 'signatures':
        if (!includeSignatures) return null;
        return (
          <div style={{ padding: spacing.md, backgroundColor: 'white', border: `1px solid ${colors.neutral[200]}` }}>
            <h2 style={{ ...typography.subheader, marginBottom: spacing.md }}>Signatures</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.md }}>
              <div>
                <div style={{ fontWeight: 600 }}>Inspector</div>
                <div style={{ color: colors.neutral[600] }}>{inspection.inspector?.name || 'N/A'}</div>
              </div>
              {inspection.reviewer && (
                <div>
                  <div style={{ fontWeight: 600 }}>Reviewer</div>
                  <div style={{ color: colors.neutral[600] }}>{inspection.reviewer.name}</div>
                </div>
              )}
            </div>
          </div>
        );

      case 'footer':
        return (
          <div style={{ padding: spacing.md, backgroundColor: colors.neutral[50], textAlign: 'center' }}>
            {reportFooter || (
              <>
                <div>This report was generated on {new Date().toLocaleString()}</div>
                <div>VOMS - Vehicle Operations Management System</div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.neutral[50] }}>
      {/* Sidebar - Section Controls */}
      <div style={{ width: '300px', backgroundColor: 'white', borderRight: `1px solid ${colors.neutral[200]}`, padding: spacing.md, overflowY: 'auto' }}>
        <div style={{ marginBottom: spacing.lg }}>
          <h2 style={{ ...typography.subheader, marginBottom: spacing.md }}>Report Builder</h2>
          
          <div style={{ marginBottom: spacing.md }}>
            <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Report Title</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.sm,
              }}
            />
          </div>

          <div style={{ marginBottom: spacing.md }}>
            <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Footer Text</label>
            <textarea
              value={reportFooter}
              onChange={(e) => setReportFooter(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.sm,
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginBottom: spacing.md }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeLogo}
                onChange={(e) => setIncludeLogo(e.target.checked)}
              />
              <span>Include Company Logo</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, cursor: 'pointer', marginTop: spacing.xs }}>
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={(e) => setIncludeSignatures(e.target.checked)}
              />
              <span>Include Signatures</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, cursor: 'pointer', marginTop: spacing.xs }}>
              <input
                type="checkbox"
                checked={includePhotos}
                onChange={(e) => setIncludePhotos(e.target.checked)}
              />
              <span>Include Photos</span>
            </label>
          </div>
        </div>

        <div style={{ marginBottom: spacing.lg }}>
          <h3 style={{ ...typography.label, marginBottom: spacing.sm }}>Sections</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {sortedSections.map((section) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => handleDragStart(section.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(section.id)}
                style={{
                  padding: spacing.sm,
                  backgroundColor: draggedSection === section.id ? colors.primary + '20' : colors.neutral[50],
                  border: `1px solid ${colors.neutral[200]}`,
                  borderRadius: borderRadius.sm,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  cursor: 'move',
                }}
              >
                <GripVertical size={16} color={colors.neutral[500]} />
                <span style={{ flex: 1, ...typography.body }}>{section.label}</span>
                <button
                  onClick={() => toggleSectionVisibility(section.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: spacing.xs,
                  }}
                >
                  {section.visible ? (
                    <Eye size={16} color={colors.success[600]} />
                  ) : (
                    <EyeOff size={16} color={colors.neutral[400]} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          <Button
            variant="primary"
            onClick={saveLayout}
            disabled={saving}
            icon={<Save size={16} />}
          >
            {saving ? 'Saving...' : 'Save Layout'}
          </Button>
          <Button
            variant="primary"
            onClick={generatePDF}
            disabled={loading}
            icon={<Download size={16} />}
          >
            {loading ? 'Generating...' : 'Download PDF'}
          </Button>
          {onClose && (
            <Button variant="secondary" onClick={onClose} icon={<X size={16} />}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Main Preview Area */}
      <div style={{ flex: 1, padding: spacing.lg, overflowY: 'auto' }}>
        <div
          id="report-preview"
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            backgroundColor: 'white',
            padding: spacing.xl,
            minHeight: '100%',
          }}
        >
          {sortedSections
            .filter(s => s.visible)
            .map((section) => (
              <div key={section.id} style={{ marginBottom: spacing.lg }}>
                {renderSection(section)}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

