/**
 * Workflow Event Emitters
 * 
 * Emits workflow events when key actions occur in the application
 * These events will be processed by the backend workflow engine
 */

import type { WorkflowEvent, WorkflowEventType } from './types';
import { apiClient } from '../apiClient';

/**
 * Emit a workflow event to the backend
 */
async function emitEvent(event: WorkflowEvent): Promise<void> {
  try {
    // Send event to backend API
    // Backend will process the event and trigger workflow rules
    await apiClient.post('/v1/workflow/events', {
      type: event.type,
      timestamp: event.timestamp.toISOString(),
      user_id: event.userId,
      metadata: event.metadata,
    }, {
      suppressErrorLog: true, // Don't log if endpoint doesn't exist yet
      suppressPermissionError: true,
    });
  } catch (error) {
    // Silently fail if backend endpoint doesn't exist yet
    // This allows frontend to be developed before backend is ready
    console.debug('Workflow event emission failed (backend may not be ready):', event.type);
  }
}

/**
 * Emit vehicle entered event
 */
export async function emitVehicleEntered(
  vehicleId: string,
  yardId: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await emitEvent({
    type: 'vehicle.entered',
    timestamp: new Date(),
    userId,
    metadata: {
      vehicle_id: vehicleId,
      yard_id: yardId,
      ...metadata,
    },
  });
}

/**
 * Emit vehicle exited event
 */
export async function emitVehicleExited(
  vehicleId: string,
  yardId: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await emitEvent({
    type: 'vehicle.exited',
    timestamp: new Date(),
    userId,
    metadata: {
      vehicle_id: vehicleId,
      yard_id: yardId,
      ...metadata,
    },
  });
}

/**
 * Emit expense created event
 */
export async function emitExpenseCreated(
  expenseId: string,
  amount: number,
  category: string,
  employeeId: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await emitEvent({
    type: 'expense.created',
    timestamp: new Date(),
    userId,
    metadata: {
      expense_id: expenseId,
      amount,
      category,
      employee_id: employeeId,
      ...metadata,
    },
  });
}

/**
 * Emit expense approved event
 */
export async function emitExpenseApproved(
  expenseId: string,
  amount: number,
  employeeId: string,
  approvedBy: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await emitEvent({
    type: 'expense.approved',
    timestamp: new Date(),
    userId,
    metadata: {
      expense_id: expenseId,
      amount,
      employee_id: employeeId,
      approved_by: approvedBy,
      ...metadata,
    },
  });
}

/**
 * Emit expense rejected event
 */
export async function emitExpenseRejected(
  expenseId: string,
  employeeId: string,
  rejectedBy: string,
  reason?: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await emitEvent({
    type: 'expense.rejected',
    timestamp: new Date(),
    userId,
    metadata: {
      expense_id: expenseId,
      employee_id: employeeId,
      rejected_by: rejectedBy,
      reason,
      ...metadata,
    },
  });
}

/**
 * Emit inspection completed event
 */
export async function emitInspectionCompleted(
  inspectionId: string,
  vehicleId: string,
  templateId: string,
  inspectorId: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await emitEvent({
    type: 'inspection.completed',
    timestamp: new Date(),
    userId,
    metadata: {
      inspection_id: inspectionId,
      vehicle_id: vehicleId,
      template_id: templateId,
      inspector_id: inspectorId,
      ...metadata,
    },
  });
}

/**
 * Emit inspection draft saved event
 */
export async function emitInspectionDraftSaved(
  inspectionId: string,
  vehicleId: string,
  templateId: string,
  inspectorId: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await emitEvent({
    type: 'inspection.draft_saved',
    timestamp: new Date(),
    userId,
    metadata: {
      inspection_id: inspectionId,
      vehicle_id: vehicleId,
      template_id: templateId,
      inspector_id: inspectorId,
      ...metadata,
    },
  });
}

/**
 * Emit component installed event
 */
export async function emitComponentInstalled(
  componentId: string,
  vehicleId: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await emitEvent({
    type: 'component.installed',
    timestamp: new Date(),
    userId,
    metadata: {
      component_id: componentId,
      vehicle_id: vehicleId,
      ...metadata,
    },
  });
}

/**
 * Emit component removed event
 */
export async function emitComponentRemoved(
  componentId: string,
  vehicleId: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await emitEvent({
    type: 'component.removed',
    timestamp: new Date(),
    userId,
    metadata: {
      component_id: componentId,
      vehicle_id: vehicleId,
      ...metadata,
    },
  });
}

/**
 * Emit gate pass created event
 */
/**
 * Emit access pass created event (formerly gate pass)
 */
export async function emitAccessPassCreated(
  passId: string,
  passNumber: string,
  passType: string,
  yardId: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await emitEvent({
    type: 'access_pass.created', // New event type
    timestamp: new Date(),
    userId,
    metadata: {
      pass_id: passId,
      pass_number: passNumber,
      pass_type: passType,
      yard_id: yardId,
      ...metadata,
    },
  });
}

/**
 * @deprecated Use emitAccessPassCreated instead
 * Legacy function for backward compatibility
 */
export async function emitGatePassCreated(
  gatePassId: string,
  passType: string,
  vehicleId?: string,
  visitorId?: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  // Emit both old and new event types for backward compatibility
  await emitEvent({
    type: 'gate_pass.created', // Legacy event type
    timestamp: new Date(),
    userId,
    metadata: {
      gate_pass_id: gatePassId,
      pass_type: passType,
      vehicle_id: vehicleId,
      visitor_id: visitorId,
      ...metadata,
    },
  });
}

/**
 * Emit gate pass validated event
 */
export async function emitGatePassValidated(
  gatePassId: string,
  validatedBy: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await emitEvent({
    type: 'gate_pass.validated',
    timestamp: new Date(),
    userId,
    metadata: {
      gate_pass_id: gatePassId,
      validated_by: validatedBy,
      ...metadata,
    },
  });
}

/**
 * Emit gate pass expired event
 */
export async function emitGatePassExpired(
  gatePassId: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await emitEvent({
    type: 'gate_pass.expired',
    timestamp: new Date(),
    userId,
    metadata: {
      gate_pass_id: gatePassId,
      ...metadata,
    },
  });
}

/**
 * Emit stockyard request approved event
 */
export async function emitStockyardRequestApproved(
  requestId: string,
  approvedBy: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await emitEvent({
    type: 'stockyard_request.approved',
    timestamp: new Date(),
    userId,
    metadata: {
      request_id: requestId,
      approved_by: approvedBy,
      ...metadata,
    },
  });
}

/**
 * Emit advance issued event
 */
export async function emitAdvanceIssued(
  advanceId: string,
  employeeId: string,
  amount: number,
  issuedBy: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await emitEvent({
    type: 'advance.issued',
    timestamp: new Date(),
    userId,
    metadata: {
      advance_id: advanceId,
      employee_id: employeeId,
      amount,
      issued_by: issuedBy,
      ...metadata,
    },
  });
}

/**
 * Emit advance recorded event (by employee)
 */
export async function emitAdvanceRecorded(
  advanceId: string,
  employeeId: string,
  amount: number,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await emitEvent({
    type: 'advance.recorded',
    timestamp: new Date(),
    userId,
    metadata: {
      advance_id: advanceId,
      employee_id: employeeId,
      amount,
      ...metadata,
    },
  });
}

/**
 * Emit balance negative event
 */
export async function emitBalanceNegative(
  employeeId: string,
  balance: number,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await emitEvent({
    type: 'balance.negative',
    timestamp: new Date(),
    userId,
    metadata: {
      employee_id: employeeId,
      balance,
      ...metadata,
    },
  });
}

/**
 * Emit maintenance task created event
 */
export async function emitMaintenanceTaskCreated(
  taskId: string,
  vehicleId: string,
  inspectionId?: string,
  createdBy: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await emitEvent({
    type: 'maintenance_task.created',
    timestamp: new Date(),
    userId,
    metadata: {
      task_id: taskId,
      vehicle_id: vehicleId,
      inspection_id: inspectionId,
      created_by: createdBy,
      ...metadata,
    },
  });
}


