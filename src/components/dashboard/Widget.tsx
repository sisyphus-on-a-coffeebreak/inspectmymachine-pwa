/**
 * Widget Component
 * 
 * Wrapper component for dashboard widgets with drag handle and controls
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Settings, Eye, EyeOff } from 'lucide-react';
import type { WidgetConfig, WidgetProps } from '../../types/widgets';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { getWidgetDefinition } from '../../lib/widgetRegistry';

export interface WidgetComponentProps extends WidgetProps {
  isDragging?: boolean;
  isEditMode?: boolean;
  onToggleVisibility?: () => void;
  onEdit?: () => void;
}

export const Widget: React.FC<WidgetComponentProps> = ({
  config,
  data,
  onConfigChange,
  onRemove,
  isEditMode = false,
  onToggleVisibility,
  onEdit,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: config.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const widgetDef = getWidgetDefinition(config.type);
  const WidgetComponent = widgetDef?.component;

  if (!WidgetComponent) {
    return (
      <div style={{
        padding: spacing.lg,
        backgroundColor: colors.neutral[100],
        borderRadius: borderRadius.md,
        border: `1px solid ${colors.neutral[300]}`,
      }}>
        <p style={{ color: colors.neutral[600] }}>Widget type "{config.type}" not found</p>
      </div>
    );
  }

  if (!config.visible) {
    return null;
  }

  // Calculate grid column span based on size
  const getColumnSpan = (size: string) => {
    switch (size) {
      case 'small': return 1;
      case 'medium': return 2;
      case 'large': return 3;
      case 'full': return 4;
      default: return 2;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        gridColumn: `span ${getColumnSpan(config.size)}`,
        position: 'relative',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          boxShadow: isDragging 
            ? '0 8px 24px rgba(0,0,0,0.15)' 
            : '0 4px 12px rgba(0,0,0,0.08)',
          border: `1px solid ${colors.neutral[200]}`,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Widget Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.md,
            paddingBottom: spacing.sm,
            borderBottom: `1px solid ${colors.neutral[200]}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            {isEditMode && (
              <div
                {...attributes}
                {...listeners}
                style={{
                  cursor: 'grab',
                  color: colors.neutral[500],
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <GripVertical size={16} />
              </div>
            )}
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: colors.neutral[900],
              margin: 0,
            }}>
              {config.title}
            </h3>
          </div>

          {isEditMode && (
            <div style={{ display: 'flex', gap: spacing.xs, alignItems: 'center' }}>
              <button
                onClick={onToggleVisibility}
                style={{
                  padding: spacing.xs,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: colors.neutral[600],
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={config.visible ? 'Hide widget' : 'Show widget'}
              >
                {config.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              {onEdit && (
                <button
                  onClick={onEdit}
                  style={{
                    padding: spacing.xs,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: colors.neutral[600],
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label="Edit widget"
                >
                  <Settings size={16} />
                </button>
              )}
              {onRemove && (
                <button
                  onClick={onRemove}
                  style={{
                    padding: spacing.xs,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: colors.error[500],
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label="Remove widget"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Widget Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <WidgetComponent
            config={config}
            data={data}
            onConfigChange={onConfigChange}
            onRemove={onRemove}
          />
        </div>
      </div>
    </div>
  );
};

