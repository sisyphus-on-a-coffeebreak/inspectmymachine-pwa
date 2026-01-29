import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PageHeader } from '../../components/ui/PageHeader';
import { CardGrid } from '../../components/ui/ResponsiveGrid';
import { useToast } from '../../providers/ToastProvider';
import { Warehouse, ArrowLeft, Package, ArrowRight, ArrowDown, Search, User, CheckCircle2, List, Grid, Battery, Circle, Wrench } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useComponents } from '../../lib/queries';
import { getUsers, type User as UserType } from '../../lib/users';
import { useMobileViewport, getResponsivePageContainerStyles } from '../../lib/mobileUtils';

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
type ViewMode = 'search' | 'browse';

export const CreateComponentMovement: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isMobile = useMobileViewport();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [yards, setYards] = useState<Yard[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [componentViewMode, setComponentViewMode] = useState<ViewMode>('search');
  const [formData, setFormData] = useState({
    movement_type: 'ENTRY' as MovementType,
    component_id: '',
    component_type: '' as 'battery' | 'tyre' | 'spare_part' | '',
    yard_id: '',
    reason: '',
    taken_by: '',
    notes: '',
  });

  const totalSteps = 4;

  // Fetch components for search
  const { data: componentsData } = useComponents({
    search: searchQuery || undefined,
    per_page: componentViewMode === 'browse' ? 50 : 20,
  });

  const components = componentsData?.data || [];

  // Fetch all components for browse view
  const { data: browseComponentsData } = useComponents({
    per_page: 50,
  }, { enabled: componentViewMode === 'browse' });

  const browseComponents = browseComponentsData?.data || [];

  useEffect(() => {
    // Fetch yards and employees
    const fetchData = async () => {
      try {
        const [yardsRes, usersData] = await Promise.all([
          apiClient.get('/v1/yards'),
          getUsers(),
        ]);
        setYards(Array.isArray(yardsRes.data) ? yardsRes.data : yardsRes.data.data || []);
        // Filter only active employees
        const activeEmployees = (usersData || [])
          .filter((user: UserType) => user.is_active)
          .map((user: UserType) => ({
            id: user.id,
            name: user.name,
            employee_id: user.employee_id,
            email: user.email,
          }));
        setEmployees(activeEmployees);
      } catch (err: any) {
        // Log error for debugging
        console.error('Failed to load yards/employees:', err);
        
        // Set empty arrays as fallback
        setYards([]);
        setEmployees([]);
        
        // Show warning toast to user
        showToast({
          title: 'Warning',
          description: 'Failed to load yards or employees. Some options may be unavailable. Please refresh the page.',
          variant: 'warning',
        });
      }
    };
    fetchData();
  }, [showToast]);

  const handleComponentSelect = (component: Component) => {
    setSelectedComponent(component);
    setFormData({
      ...formData,
      component_id: component.id,
      component_type: component.type,
    });
    setSearchQuery(`${component.brand} ${component.model} ${component.serial_number || component.part_number || ''}`.trim());
    // Auto-advance to next step after selection
    if (currentStep === 2) {
      setTimeout(() => setCurrentStep(3), 300);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.movement_type;
      case 2:
        return !!formData.component_id && !!formData.component_type;
      case 3:
        return !!formData.yard_id && !!formData.reason && !!formData.taken_by;
      case 4:
        return true; // Review step doesn't need validation
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      showToast({
        title: 'Validation Error',
        description: 'Please complete all required fields before proceeding',
        variant: 'error',
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      showToast({
        title: 'Validation Error',
        description: 'Please complete all required fields',
        variant: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      
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

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'battery': return Battery;
      case 'tyre': return Circle;
      case 'spare_part': return Wrench;
      default: return Package;
    }
  };

  const getComponentColor = (type: string) => {
    switch (type) {
      case 'battery': return colors.warning[500];
      case 'tyre': return colors.neutral[600];
      case 'spare_part': return colors.success[500];
      default: return colors.primary;
    }
  };

  const renderProgressIndicator = () => {
    return (
      <div style={{ marginBottom: spacing.xl }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          {[1, 2, 3, 4].map((step) => {
            const isActive = step === currentStep;
            const isCompleted = step < currentStep;
            return (
              <React.Fragment key={step}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted ? colors.success[500] : isActive ? colors.primary : colors.neutral[200],
                      color: isCompleted || isActive ? 'white' : colors.neutral[600],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '14px',
                      marginBottom: spacing.xs,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isCompleted ? <CheckCircle2 size={20} /> : step}
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: isActive ? colors.primary : colors.neutral[600],
                    fontWeight: isActive ? 600 : 400,
                    textAlign: 'center',
                  }}>
                    {step === 1 && 'Type'}
                    {step === 2 && 'Component'}
                    {step === 3 && 'Details'}
                    {step === 4 && 'Review'}
                  </span>
                </div>
                {step < totalSteps && (
                  <div
                    style={{
                      flex: 1,
                      height: '2px',
                      backgroundColor: step < currentStep ? colors.success[500] : colors.neutral[200],
                      margin: `0 ${spacing.sm} ${spacing.xl + 8}px ${spacing.sm}`,
                      transition: 'all 0.3s ease',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStep1 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      <div>
        <h3 style={{ ...typography.subheader, marginBottom: spacing.sm }}>Select Movement Type</h3>
        <p style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.md }}>
          Choose whether the component is entering or leaving the stockyard
        </p>
      </div>
      <CardGrid gap="md">
        <button
          type="button"
          onClick={() => setFormData({ ...formData, movement_type: 'ENTRY' })}
          style={{
            padding: spacing.xl,
            border: `2px solid ${formData.movement_type === 'ENTRY' ? colors.success[500] : colors.neutral[300]}`,
            borderRadius: borderRadius.lg,
            background: formData.movement_type === 'ENTRY' ? colors.success[500] + '10' : 'white',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: spacing.md,
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: formData.movement_type === 'ENTRY' ? colors.success[500] : colors.neutral[200],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ArrowDown size={32} color={formData.movement_type === 'ENTRY' ? 'white' : colors.neutral[600]} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ ...typography.body, fontWeight: 600, marginBottom: spacing.xs }}>
              Entry
            </div>
            <div style={{ ...typography.caption, color: colors.neutral[600] }}>
              Component entering stockyard
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, movement_type: 'EXIT' })}
          style={{
            padding: spacing.xl,
            border: `2px solid ${formData.movement_type === 'EXIT' ? colors.warning[500] : colors.neutral[300]}`,
            borderRadius: borderRadius.lg,
            background: formData.movement_type === 'EXIT' ? colors.warning[500] + '10' : 'white',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: spacing.md,
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: formData.movement_type === 'EXIT' ? colors.warning[500] : colors.neutral[200],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ArrowRight size={32} color={formData.movement_type === 'EXIT' ? 'white' : colors.neutral[600]} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ ...typography.body, fontWeight: 600, marginBottom: spacing.xs }}>
              Exit
            </div>
            <div style={{ ...typography.caption, color: colors.neutral[600] }}>
              Component leaving stockyard
            </div>
          </div>
        </button>
      </CardGrid>
    </div>
  );

  const renderStep2 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      <div>
        <h3 style={{ ...typography.subheader, marginBottom: spacing.sm }}>Select Component</h3>
        <p style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.md }}>
          Search or browse to find the component you want to record
        </p>
      </div>

      {/* View Mode Toggle */}
      <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.md }}>
        <Button
          type="button"
          variant={componentViewMode === 'search' ? 'primary' : 'secondary'}
          onClick={() => setComponentViewMode('search')}
          icon={<Search size={16} />}
        >
          Search
        </Button>
        <Button
          type="button"
          variant={componentViewMode === 'browse' ? 'primary' : 'secondary'}
          onClick={() => setComponentViewMode('browse')}
          icon={<List size={16} />}
        >
          Browse
        </Button>
      </div>

      {componentViewMode === 'search' ? (
        <>
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
          </div>
          
          {searchQuery && !selectedComponent && filteredComponents.length > 0 && (
            <div style={{
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              maxHeight: '300px',
              overflowY: 'auto',
              background: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              {filteredComponents.map((component: Component) => {
                const Icon = getComponentIcon(component.type);
                const iconColor = getComponentColor(component.type);
                return (
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
                    <Icon size={20} color={iconColor} />
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
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div style={{
          border: `1px solid ${colors.neutral[300]}`,
          borderRadius: borderRadius.md,
          maxHeight: '400px',
          overflowY: 'auto',
          background: 'white',
        }}>
          {browseComponents.length > 0 ? (
            <CardGrid gap="md" style={{ padding: spacing.md }}>
              {browseComponents.map((component: Component) => {
                const Icon = getComponentIcon(component.type);
                const iconColor = getComponentColor(component.type);
                const isSelected = selectedComponent?.id === component.id;
                return (
                  <div
                    key={component.id}
                    onClick={() => handleComponentSelect(component)}
                    style={{
                      padding: spacing.md,
                      cursor: 'pointer',
                      border: `2px solid ${isSelected ? colors.primary : colors.neutral[200]}`,
                      borderRadius: borderRadius.md,
                      background: isSelected ? colors.primary + '10' : 'white',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = colors.primary;
                        e.currentTarget.style.background = colors.neutral[50];
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = colors.neutral[200];
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                      <Icon size={24} color={iconColor} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>
                          {component.brand} {component.model}
                        </div>
                        <div style={{ fontSize: '12px', color: colors.neutral[600] }}>
                          {component.type}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: colors.neutral[500] }}>
                      {component.serial_number || component.part_number || 'No ID'}
                    </div>
                  </div>
                );
              })}
            </CardGrid>
          ) : (
            <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.neutral[600] }}>
              No components found
            </div>
          )}
        </div>
      )}

      {selectedComponent && (
        <div style={{
          padding: spacing.md,
          background: colors.primary + '10',
          border: `1px solid ${colors.primary}30`,
          borderRadius: borderRadius.md,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
        }}>
          {(() => {
            const Icon = getComponentIcon(selectedComponent.type);
            const iconColor = getComponentColor(selectedComponent.type);
            return <Icon size={20} color={iconColor} />;
          })()}
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
            size="sm"
          >
            Change
          </Button>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      <div>
        <h3 style={{ ...typography.subheader, marginBottom: spacing.sm }}>Movement Details</h3>
        <p style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.md }}>
          Provide details about this {formData.movement_type.toLowerCase()} movement
        </p>
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
            borderRadius: borderRadius.md,
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
            borderRadius: borderRadius.md,
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
              borderRadius: borderRadius.md,
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
            borderRadius: borderRadius.md,
            fontSize: '14px',
            marginTop: spacing.xs,
            fontFamily: 'inherit',
          }}
          placeholder="Add any additional notes or details about this movement..."
        />
      </div>
    </div>
  );

  const renderStep4 = () => {
    const selectedYard = yards.find(y => y.id === formData.yard_id);
    const selectedEmployee = employees.find(e => e.id.toString() === formData.taken_by);
    const Icon = selectedComponent ? getComponentIcon(selectedComponent.type) : Package;
    const iconColor = selectedComponent ? getComponentColor(selectedComponent.type) : colors.primary;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
        <div>
          <h3 style={{ ...typography.subheader, marginBottom: spacing.sm }}>Review & Submit</h3>
          <p style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.md }}>
            Please review all details before submitting
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {/* Movement Type */}
          <div style={{ ...cardStyles.card, padding: spacing.md }}>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Movement Type</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              {formData.movement_type === 'ENTRY' ? (
                <>
                  <ArrowDown size={20} color={colors.success[500]} />
                  <span style={{ ...typography.body, fontWeight: 600, color: colors.success[500] }}>Entry</span>
                </>
              ) : (
                <>
                  <ArrowRight size={20} color={colors.warning[500]} />
                  <span style={{ ...typography.body, fontWeight: 600, color: colors.warning[500] }}>Exit</span>
                </>
              )}
            </div>
          </div>

          {/* Component */}
          {selectedComponent && (
            <div style={{ ...cardStyles.card, padding: spacing.md }}>
              <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Component</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <Icon size={20} color={iconColor} />
                <div>
                  <div style={{ ...typography.body, fontWeight: 600 }}>
                    {selectedComponent.brand} {selectedComponent.model}
                  </div>
                  <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                    {selectedComponent.type} • {selectedComponent.serial_number || selectedComponent.part_number || 'No ID'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stockyard */}
          {selectedYard && (
            <div style={{ ...cardStyles.card, padding: spacing.md }}>
              <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Stockyard</div>
              <div style={{ ...typography.body }}>{selectedYard.name}</div>
            </div>
          )}

          {/* Reason */}
          {formData.reason && (
            <div style={{ ...cardStyles.card, padding: spacing.md }}>
              <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Reason</div>
              <div style={{ ...typography.body }}>{formData.reason}</div>
            </div>
          )}

          {/* Employee */}
          {selectedEmployee && (
            <div style={{ ...cardStyles.card, padding: spacing.md }}>
              <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                {formData.movement_type === 'EXIT' ? 'Taken By' : 'Received By'}
              </div>
              <div style={{ ...typography.body }}>{selectedEmployee.name} ({selectedEmployee.employee_id})</div>
            </div>
          )}

          {/* Notes */}
          {formData.notes && (
            <div style={{ ...cardStyles.card, padding: spacing.md }}>
              <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Additional Notes</div>
              <div style={{ ...typography.body, whiteSpace: 'pre-wrap' }}>{formData.notes}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      ...getResponsivePageContainerStyles({ desktopMaxWidth: '900px' }),
      padding: isMobile ? spacing.lg : spacing.xl,
    }}>
      <PageHeader
        title="Record Component Movement"
        subtitle="Step-by-step wizard to record component entry or exit"
        icon={<Warehouse size={24} />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Stockyard', path: '/app/stockyard' },
          { label: 'Component Movement' }
        ]}
      />

      {/* Progress Indicator */}
      {renderProgressIndicator()}

      <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'space-between', marginTop: spacing.xl, paddingTop: spacing.lg, borderTop: `1px solid ${colors.neutral[200]}` }}>
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="secondary"
                onClick={handlePrevious}
                icon={<ArrowLeft size={16} />}
              >
                Previous
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: spacing.md }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/app/stockyard')}
            >
              Cancel
            </Button>
            {currentStep < totalSteps ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                icon={<ArrowRight size={16} />}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                loading={loading}
                icon={formData.movement_type === 'ENTRY' ? <ArrowDown size={16} /> : <ArrowRight size={16} />}
              >
                {formData.movement_type === 'ENTRY' ? 'Record Entry' : 'Record Exit'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
