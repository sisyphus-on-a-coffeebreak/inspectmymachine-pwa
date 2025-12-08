/**
 * Dashboard Widgets Container
 * 
 * Container for dashboard widgets with drag-and-drop support
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import type { WidgetConfig } from '../../types/widgets';
import { Widget } from './Widget';
import { colors, spacing } from '../../lib/theme';
import { Button } from '../ui/button';
import { Settings, Check, X } from 'lucide-react';

export interface DashboardWidgetsContainerProps {
  widgets: WidgetConfig[];
  data?: Record<string, any>;
  onWidgetsChange: (widgets: WidgetConfig[]) => void;
  onSave?: (widgets: WidgetConfig[]) => void;
  isEditMode?: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

export const DashboardWidgetsContainer: React.FC<DashboardWidgetsContainerProps> = ({
  widgets,
  data,
  onWidgetsChange,
  onSave,
  isEditMode: externalEditMode,
  onEditModeChange,
}) => {
  const [internalEditMode, setInternalEditMode] = useState(false);
  const [localWidgets, setLocalWidgets] = useState<WidgetConfig[]>(widgets);

  const isEditMode = externalEditMode !== undefined ? externalEditMode : internalEditMode;
  const setEditMode = onEditModeChange || setInternalEditMode;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setLocalWidgets(widgets);
  }, [widgets]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update order property
        const reordered = newItems.map((item, index) => ({
          ...item,
          order: index,
        }));

        onWidgetsChange(reordered);
        return reordered;
      });
    }
  };

  const handleToggleVisibility = (widgetId: string) => {
    setLocalWidgets((items) => {
      const updated = items.map((item) =>
        item.id === widgetId ? { ...item, visible: !item.visible } : item
      );
      onWidgetsChange(updated);
      return updated;
    });
  };

  const handleRemove = (widgetId: string) => {
    setLocalWidgets((items) => {
      const updated = items.filter((item) => item.id !== widgetId);
      onWidgetsChange(updated);
      return updated;
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave(localWidgets);
    }
    setEditMode(false);
  };

  const handleCancel = () => {
    setLocalWidgets(widgets); // Reset to original
    setEditMode(false);
  };

  // Sort widgets by order
  const sortedWidgets = useMemo(() => {
    return [...localWidgets].sort((a, b) => a.order - b.order);
  }, [localWidgets]);

  return (
    <div>
      {/* Edit Mode Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: spacing.md,
        gap: spacing.sm,
      }}>
        {!isEditMode ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditMode(true)}
            icon={<Settings size={16} />}
          >
            Customize Dashboard
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancel}
              icon={<X size={16} />}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              icon={<Check size={16} />}
            >
              Save Layout
            </Button>
          </>
        )}
      </div>

      {/* Widgets Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedWidgets.map((w) => w.id)}
          strategy={rectSortingStrategy}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: spacing.lg,
            }}
          >
            {sortedWidgets.map((widget) => (
              <Widget
                key={widget.id}
                config={widget}
                data={data}
                isEditMode={isEditMode}
                onToggleVisibility={() => handleToggleVisibility(widget.id)}
                onRemove={() => handleRemove(widget.id)}
                onConfigChange={(updatedConfig) => {
                  setLocalWidgets((items) => {
                    const updated = items.map((item) =>
                      item.id === updatedConfig.id ? updatedConfig : item
                    );
                    onWidgetsChange(updated);
                    return updated;
                  });
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sortedWidgets.length === 0 && (
        <div style={{
          padding: spacing.xl,
          textAlign: 'center',
          color: colors.neutral[600],
          backgroundColor: colors.neutral[50],
          borderRadius: '12px',
        }}>
          <p>No widgets configured. Click "Customize Dashboard" to add widgets.</p>
        </div>
      )}
    </div>
  );
};

