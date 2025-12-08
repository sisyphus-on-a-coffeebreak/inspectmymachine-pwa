import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { Plus, Copy, Edit2, Trash2, Eye } from 'lucide-react';
import type { InspectionTemplate } from '@/types/inspection';

interface TemplateListProps {
  templates: InspectionTemplate[];
  loading: boolean;
  publishing: boolean;
  onEdit: (template: InspectionTemplate) => void;
  onDuplicate: (templateId: string) => void;
  onDelete: (templateId: string) => void;
  onCreateNew: () => void;
}

export const TemplateList: React.FC<TemplateListProps> = ({
  templates,
  loading,
  publishing,
  onEdit,
  onDuplicate,
  onDelete,
  onCreateNew,
}) => {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <h2 style={{ ...typography.h2 }}>Templates</h2>
        <Button onClick={onCreateNew}>
          <Plus size={16} style={{ marginRight: spacing.xs }} />
          Create Template
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: spacing.xl }}>Loading templates...</div>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.neutral[600] }}>
          No templates found. Create your first template to get started.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: spacing.md }}>
          {templates.map((template) => (
            <div
              key={template.id}
              style={{
                padding: spacing.lg,
                backgroundColor: 'white',
                borderRadius: borderRadius.lg,
                border: `1px solid ${colors.neutral[200]}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ ...typography.subheader, marginBottom: spacing.xs }}>{template.name}</h3>
                <p style={{ ...typography.caption, color: colors.neutral[600] }}>{template.description}</p>
                <div style={{ marginTop: spacing.xs, display: 'flex', gap: spacing.sm }}>
                  <span
                    style={{
                      padding: `${spacing.xs} ${spacing.sm}`,
                      backgroundColor: colors.neutral[100],
                      borderRadius: borderRadius.sm,
                      fontSize: '12px',
                      color: colors.neutral[700],
                    }}
                  >
                    {template.category}
                  </span>
                  <span
                    style={{
                      padding: `${spacing.xs} ${spacing.sm}`,
                      backgroundColor: template.is_active ? colors.success[100] : colors.neutral[100],
                      borderRadius: borderRadius.sm,
                      fontSize: '12px',
                      color: template.is_active ? colors.success[700] : colors.neutral[700],
                    }}
                  >
                    {template.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: spacing.sm }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/app/inspections/${template.id}/capture`)}
                >
                  Use Template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDuplicate(template.id!)}
                  disabled={publishing}
                  title="Duplicate Template"
                  style={{
                    color: colors.primary,
                    borderColor: colors.primary,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary + '10';
                    e.currentTarget.style.borderColor = colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = colors.primary;
                  }}
                >
                  <Copy size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(template)}
                  title="Edit Template"
                >
                  <Edit2 size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(template.id!)}
                  disabled={publishing}
                  title="Delete Template"
                  style={{
                    color: colors.error[600],
                    borderColor: colors.error[300],
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.error[50];
                    e.currentTarget.style.borderColor = colors.error[400];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = colors.error[300];
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};



