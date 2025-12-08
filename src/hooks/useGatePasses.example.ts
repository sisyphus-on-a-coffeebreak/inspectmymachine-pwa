/**
 * Usage Examples for Gate Pass Hooks
 * 
 * This file demonstrates how to use the new unified gate pass hooks.
 * Copy these patterns into your components.
 */

import {
  useGatePasses,
  useGatePassStats,
  useGatePass,
  useCreateGatePass,
  useUpdateGatePass,
  useCancelGatePass,
  useValidatePass,
  useRecordEntry,
  useRecordExit,
  useGuardLogs,
} from './useGatePasses';
import type {
  CreateVisitorPassData,
  CreateVehiclePassData,
  GatePassFilters,
} from '@/pages/gatepass/gatePassTypes';

// ============================================================================
// Example 1: List Gate Passes
// ============================================================================

export function ExampleListPasses() {
  const filters: GatePassFilters = {
    status: 'active',
    type: 'visitor',
    per_page: 20,
    page: 1,
  };

  const { data, isLoading, error, refetch } = useGatePasses(filters);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.data.map((pass) => (
        <div key={pass.id}>{pass.pass_number}</div>
      ))}
    </div>
  );
}

// ============================================================================
// Example 2: Get Statistics
// ============================================================================

export function ExampleStats() {
  const { data: stats, isLoading } = useGatePassStats('yard-uuid');

  if (isLoading) return <div>Loading stats...</div>;

  return (
    <div>
      <p>Visitors Inside: {stats?.visitors_inside}</p>
      <p>Vehicles Out: {stats?.vehicles_out}</p>
      <p>Expected Today: {stats?.expected_today}</p>
    </div>
  );
}

// ============================================================================
// Example 3: Get Single Pass
// ============================================================================

export function ExampleSinglePass({ passId }: { passId: string }) {
  const { data: pass, isLoading } = useGatePass(passId);

  if (isLoading) return <div>Loading pass...</div>;
  if (!pass) return <div>Pass not found</div>;

  return <div>{pass.pass_number} - {pass.status}</div>;
}

// ============================================================================
// Example 4: Create Visitor Pass
// ============================================================================

export function ExampleCreateVisitorPass() {
  const createPass = useCreateGatePass();

  const handleCreate = () => {
    const data: CreateVisitorPassData = {
      pass_type: 'visitor',
      visitor_name: 'John Doe',
      visitor_phone: '9876543210',
      referred_by: 'Sales Team',
      vehicles_to_view: ['vehicle-uuid-1'],
      purpose: 'inspection',
      valid_from: '2024-12-06 10:00:00',
      valid_to: '2024-12-06 12:00:00',
    };

    createPass.mutate(data, {
      onSuccess: (pass) => {
        console.log('Created:', pass.pass_number);
        // Navigate to pass details
      },
    });
  };

  return (
    <button onClick={handleCreate} disabled={createPass.isPending}>
      {createPass.isPending ? 'Creating...' : 'Create Pass'}
    </button>
  );
}

// ============================================================================
// Example 5: Create Vehicle Pass
// ============================================================================

export function ExampleCreateVehiclePass() {
  const createPass = useCreateGatePass();

  const handleCreate = () => {
    const data: CreateVehiclePassData = {
      pass_type: 'vehicle_outbound',
      vehicle_id: 'vehicle-uuid',
      purpose: 'rto_work',
      valid_from: '2024-12-06 09:00:00',
      valid_to: '2024-12-06 17:00:00',
      driver_name: 'Jane Smith',
      driver_contact: '9876543210',
      expected_return_date: '2024-12-06',
      expected_return_time: '16:00',
    };

    createPass.mutate(data);
  };

  return <button onClick={handleCreate}>Create Vehicle Pass</button>;
}

// ============================================================================
// Example 6: Update Pass
// ============================================================================

export function ExampleUpdatePass({ passId }: { passId: string }) {
  const updatePass = useUpdateGatePass();

  const handleUpdate = () => {
    updatePass.mutate({
      id: passId,
      data: {
        notes: 'Updated notes',
      },
    });
  };

  return <button onClick={handleUpdate}>Update</button>;
}

// ============================================================================
// Example 7: Cancel Pass
// ============================================================================

export function ExampleCancelPass({ passId }: { passId: string }) {
  const cancelPass = useCancelGatePass();

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this pass?')) {
      cancelPass.mutate(passId);
    }
  };

  return <button onClick={handleCancel}>Cancel Pass</button>;
}

// ============================================================================
// Example 8: Validate Pass
// ============================================================================

export function ExampleValidatePass() {
  const validate = useValidatePass();

  const handleValidate = (accessCode: string) => {
    validate.mutate({
      access_code: accessCode,
      action: 'entry', // or 'exit' or 'validate_only'
      notes: 'Scanned at gate',
    }, {
      onSuccess: (result) => {
        if (result.valid && result.pass) {
          console.log('Pass valid:', result.pass.pass_number);
          if (result.action_taken) {
            console.log('Action taken:', result.action_taken);
          }
        } else {
          console.log('Invalid pass:', result.message);
        }
      },
    });
  };

  return (
    <button onClick={() => handleValidate('ABC123')}>
      Validate
    </button>
  );
}

// ============================================================================
// Example 9: Record Entry
// ============================================================================

export function ExampleRecordEntry({ passId }: { passId: string }) {
  const recordEntry = useRecordEntry();

  const handleEntry = () => {
    recordEntry.mutate({
      id: passId,
      notes: 'Visitor entered at 10:00 AM',
    });
  };

  return <button onClick={handleEntry}>Record Entry</button>;
}

// ============================================================================
// Example 10: Record Exit
// ============================================================================

export function ExampleRecordExit({ passId }: { passId: string }) {
  const recordExit = useRecordExit();

  const handleExit = () => {
    recordExit.mutate({
      id: passId,
      notes: 'Visitor exited at 2:00 PM',
    });
  };

  return <button onClick={handleExit}>Record Exit</button>;
}

// ============================================================================
// Example 11: Guard Logs
// ============================================================================

export function ExampleGuardLogs() {
  const { data: logs, isLoading } = useGuardLogs({
    date: '2024-12-06',
    per_page: 50,
  });

  if (isLoading) return <div>Loading logs...</div>;

  return (
    <div>
      {logs?.data.map((log) => (
        <div key={log.id}>
          {log.action} - {log.created_at}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Example 12: Filtering with Multiple Statuses
// ============================================================================

export function ExampleMultipleFilters() {
  const { data } = useGatePasses({
    status: ['active', 'inside'], // Multiple statuses
    type: 'visitor',
    date_from: '2024-12-01',
    date_to: '2024-12-31',
    search: 'John',
    sort_by: 'created_at',
    sort_dir: 'desc',
    per_page: 50,
  });

  return <div>Found {data?.total} passes</div>;
}

// ============================================================================
// Example 13: Using Helper Functions
// ============================================================================

import {
  isVisitorPass,
  canEnter,
  canExit,
  getPassDisplayName,
  getStatusColor,
  getStatusLabel,
} from '@/pages/gatepass/gatePassTypes';

export function ExampleHelpers({ pass }: { pass: any }) {
  return (
    <div>
      <p>Is Visitor: {isVisitorPass(pass) ? 'Yes' : 'No'}</p>
      <p>Can Enter: {canEnter(pass) ? 'Yes' : 'No'}</p>
      <p>Can Exit: {canExit(pass) ? 'Yes' : 'No'}</p>
      <p>Display Name: {getPassDisplayName(pass)}</p>
      <p>Status: {getStatusLabel(pass.status)}</p>
      <p>Color: {getStatusColor(pass.status)}</p>
    </div>
  );
}
