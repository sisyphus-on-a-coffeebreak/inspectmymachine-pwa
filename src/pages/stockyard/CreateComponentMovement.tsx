import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../providers/ToastProvider';
import { Warehouse, ArrowLeft, Package, ArrowRight, ArrowDown, Search, User } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useComponents } from '../../lib/queries';
import { getUsers, type User as UserType } from '../../lib/users';

interface Component {
  id: string;
  type: 'battery' | 'tyre' | 'spare_part';
  serial_number?: string;
  part_number?: string;
  brand: string;
  model: string;
  status: string;
  current_vehicle_id?: string;
  current_vehicle?: {
    id: string;
    registration_number: string;
  };
}

interface Yard {
  id: string;
  name: string;
}

interface Employee {
  id: number;
  name: string;
  employee_id: string;
  email?: string;
}

type MovementType = 'ENTRY' | 'EXIT';

export const CreateComponentMovement: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [yards, setYards] = useState<Yard[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [formData, setFormData] = useState({
    movement_type: 'ENTRY' as MovementType,
    component_id: '',
    component_type: '' as 'battery' | 'tyre' | 'spare_part' | '',
    yard_id: '',
    reason: '',
    taken_by: '',
    notes: '',
  });

  // Fetch components for search
  const { data: componentsData } = useComponents({
    search: searchQuery || undefined,
    per_page: 20,
  });

  const components = componentsData?.data || [];

  useEffect(() => {
    // Fetch yards and employees
    const fetchData = async () => {
      try {
        const [yardsRes, usersData] = await Promise.all([
          apiClient.get('/v1/yards').catch(() => ({ data: [] })),
          getUsers().catch(() => []),
        ]);
        setYards(Array.isArray(yardsRes.data) ? yardsRes.data : yardsRes.data.data || []);
        // Filter only active employees
        const activeEmployees = usersData
          .filter((user: UserType) => user.is_active)
          .map((user: UserType) => ({
            id: user.id,
            name: user.name,
            employee_id: user.employee_id,
            email: user.email,
          }));
        setEmployees(activeEmployees);
      } catch (err) {
        // Error is already handled by apiClient
      }
    };
    fetchData();
  }, []);

  const handleComponentSelect = (component: Component) => {
    setSelectedComponent(component);
    setFormData({
      ...formData,
      component_id: component.id,
      component_type: component.type,
    });
    setSearchQuery(`${component.brand} ${component.model} ${component.serial_number || component.part_number || ''}`.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.component_id || !formData.component_type) {
      showToast({
        title: 'Validation Error',
        description: 'Please select a component',
        variant: 'error',
      });
      return;
    }

    if (!formData.yard_id) {
      showToast({
        title: 'Validation Error',
        description: 'Please select a stockyard',
        variant: 'error',
      });
      return;
    }

    if (!formData.reason) {
      showToast({
        title: 'Validation Error',
        description: 'Please provide a reason for the movement',
        variant: 'error',
      });
      return;
    }

    // Require "taken by" field for both ENTRY and EXIT
    if (!formData.taken_by) {
      showToast({
        title: 'Validation Error',
        description: `Please select who is ${formData.movement_type === 'EXIT' ? 'taking the component out' : 'receiving the component'}`,
        variant: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      
      // For now, we'll update the component status and create a note
      // In the future, this could create a ComponentMovement record
      const component = selectedComponent;
      if (!component) return;

      // Update component status based on movement type
      const newStatus = formData.movement_type === 'ENTRY' ? 'in_stock' : 'retired';
      
      // Build notes with taken by information
      const employeeName = employees.find(e => e.id.toString() === formData.taken_by)?.name || 'Unknown';
      const takenByInfo = formData.taken_by
        ? ` ${formData.movement_type === 'EXIT' ? 'Taken by' : 'Received by'}: ${employeeName}.`
        : '';
      
      // Update component
      await apiClient.patch(`/v1/components/${formData.component_type}/${formData.component_id}`, {
        status: newStatus,
        notes: `${formData.movement_type === 'ENTRY' ? 'Entered' : 'Exited'} stockyard: ${formData.reason}.${takenByInfo} ${formData.notes || ''}`.trim(),
      });

      showToast({
        title: 'Success',
        description: `Component ${formData.movement_type === 'ENTRY' ? 'entry' : 'exit'} recorded successfully`,
        variant: 'success',
      });
      
      navigate(`/app/stockyard/components/${formData.component_type}/${formData.component_id}`);
    } catch (err: any) {
      showToast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to record component movement',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredComponents = components.filter((comp: Component) => {
    if (!searchQuery) return false;
    const query = searchQuery.toLowerCase();
    return (
      comp.brand?.toLowerCase().includes(query) ||
      comp.model?.toLowerCase().includes(query) ||
      comp.serial_number?.toLowerCase().includes(query) ||
      comp.part_number?.toLowerCase().includes(query) ||
      comp.id.toLowerCase().includes(query)
    );
  });

  return (
    <div style={{ padding: spacing.xl, maxWidth: '800px', margin: '0 auto' }}>
      <PageHeader
        title="Record Component Movement"
        subtitle="Record entry or exit of components in the component ledger"
        icon={<Warehouse size={24} />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Stockyard', path: '/app/stockyard' },
          { label: 'Component Movement' }
        ]}
      />

      <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <div>
            <Label htmlFor="movement_type">Movement Type *</Label>
            <select
              id="movement_type"
              value={formData.movement_type}
              onChange={(e) => setFormData({ ...formData, movement_type: e.target.value as MovementType })}
              style={{
                width: '100%',
                padding: spacing.md,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '14px',
                marginTop: spacing.xs,
              }}
            >
              <option value="ENTRY">Entry (Component entering stockyard)</option>
              <option value="EXIT">Exit (Component leaving stockyard)</option>
            </select>
          </div>

          <div>
            <Label htmlFor="component_search">Search Component *</Label>
            <div style={{ position: 'relative', marginTop: spacing.xs }}>
              <Search 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: spacing.md, 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: colors.neutral[400],
                  pointerEvents: 'none'
                }} 
              />
              <Input
                id="component_search"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!e.target.value) {
                    setSelectedComponent(null);
                    setFormData({ ...formData, component_id: '', component_type: '' });
                  }
                }}
                placeholder="Search by brand, model, serial number, or part number..."
                style={{
                  paddingLeft: `${parseInt(spacing.xl) * 2}px`,
                }}
              />
            </div>
            
            {searchQuery && !selectedComponent && filteredComponents.length > 0 && (
              <div style={{
                marginTop: spacing.xs,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: '8px',
                maxHeight: '200px',
                overflowY: 'auto',
                background: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}>
                {filteredComponents.map((component: Component) => (
                  <div
                    key={component.id}
                    onClick={() => handleComponentSelect(component)}
                    style={{
                      padding: spacing.md,
                      cursor: 'pointer',
                      borderBottom: `1px solid ${colors.neutral[200]}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.neutral[50];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    <Package size={18} color={colors.primary} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>
                        {component.brand} {component.model}
                      </div>
                      <div style={{ fontSize: '12px', color: colors.neutral[600] }}>
                        {component.type} • {component.serial_number || component.part_number || 'No ID'}
                        {component.current_vehicle && ` • On: ${component.current_vehicle.registration_number}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedComponent && (
              <div style={{
                marginTop: spacing.md,
                padding: spacing.md,
                background: colors.primary + '10',
                border: `1px solid ${colors.primary}30`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
              }}>
                <Package size={20} color={colors.primary} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>
                    {selectedComponent.brand} {selectedComponent.model}
                  </div>
                  <div style={{ fontSize: '12px', color: colors.neutral[600] }}>
                    {selectedComponent.type} • {selectedComponent.serial_number || selectedComponent.part_number || 'No ID'}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSelectedComponent(null);
                    setFormData({ ...formData, component_id: '', component_type: '' });
                    setSearchQuery('');
                  }}
                  style={{ padding: `${spacing.xs} ${spacing.sm}` }}
                >
                  Change
                </Button>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="yard_id">Stockyard *</Label>
            <select
              id="yard_id"
              value={formData.yard_id}
              onChange={(e) => setFormData({ ...formData, yard_id: e.target.value })}
              required
              style={{
                width: '100%',
                padding: spacing.md,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '14px',
                marginTop: spacing.xs,
              }}
            >
              <option value="">Select a stockyard</option>
              {yards.map((yard) => (
                <option key={`yard-${yard.id}`} value={yard.id}>
                  {yard.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="reason">Reason *</Label>
            <select
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              style={{
                width: '100%',
                padding: spacing.md,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '14px',
                marginTop: spacing.xs,
              }}
            >
              <option value="">Select a reason</option>
              {formData.movement_type === 'ENTRY' ? (
                <>
                  <option value="Purchase">Purchase</option>
                  <option value="Transfer from another yard">Transfer from another yard</option>
                  <option value="Return from vehicle">Return from vehicle</option>
                  <option value="Repair completion">Repair completion</option>
                  <option value="Other">Other</option>
                </>
              ) : (
                <>
                  <option value="Sale">Sale</option>
                  <option value="Transfer to another yard">Transfer to another yard</option>
                  <option value="Scrapped">Scrapped</option>
                  <option value="Installed on vehicle">Installed on vehicle</option>
                  <option value="Other">Other</option>
                </>
              )}
            </select>
          </div>

          <div>
            <Label htmlFor="taken_by">
              {formData.movement_type === 'EXIT' ? 'Taken By' : 'Received By'} *
            </Label>
            <div style={{ position: 'relative', marginTop: spacing.xs }}>
              <User 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: spacing.md, 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: colors.neutral[400],
                  pointerEvents: 'none',
                  zIndex: 1
                }} 
              />
              <select
                id="taken_by"
                value={formData.taken_by}
                onChange={(e) => setFormData({ ...formData, taken_by: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: spacing.md,
                  paddingLeft: `${parseInt(spacing.xl) * 2}px`,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  appearance: 'none',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={`employee-${employee.id}`} value={employee.id.toString()}>
                    {employee.name} ({employee.employee_id})
                  </option>
                ))}
              </select>
            </div>
            <p style={{ 
              fontSize: '12px', 
              color: colors.neutral[600], 
              marginTop: spacing.xs,
              marginBottom: 0 
            }}>
              {formData.movement_type === 'EXIT' 
                ? 'Select the employee who is taking this component out'
                : 'Select the employee who is receiving this component'}
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              style={{
                width: '100%',
                padding: spacing.md,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '14px',
                marginTop: spacing.xs,
                fontFamily: 'inherit',
              }}
              placeholder="Add any additional notes or details about this movement..."
            />
          </div>

          <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/app/stockyard')}
            >
              <ArrowLeft size={16} style={{ marginRight: spacing.xs }} />
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {formData.movement_type === 'ENTRY' ? (
                <>
                  <ArrowDown size={16} style={{ marginRight: spacing.xs }} />
                  {loading ? 'Recording Entry...' : 'Record Entry'}
                </>
              ) : (
                <>
                  <ArrowRight size={16} style={{ marginRight: spacing.xs }} />
                  {loading ? 'Recording Exit...' : 'Record Exit'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

