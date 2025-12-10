import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { colors, spacing, typography, cardStyles, borderRadius } from '@/lib/theme';
import { Battery, Package, Wrench, ArrowLeft, ShoppingCart, Truck } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { useCreateComponent } from '@/lib/queries';
import { apiClient } from '@/lib/apiClient';
import { logger } from '@/lib/logger';
import { useSmartKeyboard } from '@/hooks/useSmartKeyboard';

interface Vehicle {
  id: string;
  registration_number: string;
  make?: string;
  model?: string;
}

const COMPONENT_TYPES = [
  { value: 'battery', label: 'Battery', icon: Battery },
  { value: 'tyre', label: 'Tyre', icon: Package },
  { value: 'spare_part', label: 'Spare Part', icon: Wrench },
];

const SPARE_PART_CATEGORIES = [
  'engine', 'electrical', 'body', 'suspension', 'brake', 'transmission', 'cooling', 'exhaust', 'other'
];

const TYRE_POSITIONS = [
  { value: 'front_left', label: 'Front Left' },
  { value: 'front_right', label: 'Front Right' },
  { value: 'rear_left', label: 'Rear Left' },
  { value: 'rear_right', label: 'Rear Right' },
  { value: 'spare', label: 'Spare' },
];

type ComponentSource = 'purchased' | 'vehicle_entry';

interface CreateComponentProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateComponent: React.FC<CreateComponentProps> = ({ onSuccess, onCancel }) => {
  // Enable smart keyboard handling for mobile
  useSmartKeyboard({ enabled: true, scrollOffset: 100 });
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const createMutation = useCreateComponent();
  
  // Get pre-filled values from URL params (for vehicle entry context)
  const vehicleIdFromUrl = searchParams.get('vehicle_id');
  const sourceFromUrl = searchParams.get('source') as ComponentSource | null;
  const stockyardRequestId = searchParams.get('stockyard_request_id');
  
  const [componentType, setComponentType] = useState<'battery' | 'tyre' | 'spare_part'>('battery');
  const [componentSource, setComponentSource] = useState<ComponentSource>(sourceFromUrl || 'purchased');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    // Common fields
    brand: '',
    model: '',
    purchase_date: new Date().toISOString().split('T')[0],
    warranty_expires_at: '',
    purchase_cost: '',
    current_vehicle_id: vehicleIdFromUrl || '',
    status: 'active',
    notes: stockyardRequestId ? `Component recorded during vehicle entry. Stockyard Request: ${stockyardRequestId}` : '',
    // Battery-specific
    serial_number: '',
    capacity: '',
    voltage: '',
    // Tyre-specific
    size: '',
    tread_depth_mm: '',
    position: '',
    // Spare part-specific
    part_number: '',
    name: '',
    category: 'engine',
  });

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await apiClient.get('/v1/vehicles');
        const vehicleData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.data || []);
        setVehicles(vehicleData);
      } catch (error) {
        // Error handled by apiClient
      }
    };
    fetchVehicles();
  }, []);

  // Update component source when URL param changes
  useEffect(() => {
    if (sourceFromUrl) {
      setComponentSource(sourceFromUrl);
    }
  }, [sourceFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: Record<string, string> = {};

    // Common validation
    if (!formData.brand.trim()) errors.brand = 'Brand is required';
    if (!formData.model.trim()) errors.model = 'Model is required';
    
    // Purchase date and cost are only required for purchased components
    if (componentSource === 'purchased') {
      if (!formData.purchase_date) errors.purchase_date = 'Purchase date is required';
      if (!formData.purchase_cost || Number(formData.purchase_cost) < 0) {
        errors.purchase_cost = 'Valid purchase cost is required';
      }
    } else {
      // For vehicle entry, vehicle is required
      if (!formData.current_vehicle_id) {
        errors.current_vehicle_id = 'Vehicle selection is required for components that came with vehicle entry';
      }
      // For vehicle entry, use entry date as purchase_date if not provided
      if (!formData.purchase_date) {
        formData.purchase_date = new Date().toISOString().split('T')[0];
      }
      // Set cost to 0 if not provided for vehicle entry components
      if (!formData.purchase_cost || formData.purchase_cost === '') {
        formData.purchase_cost = '0';
      }
    }

    // Type-specific validation
    if (componentType === 'battery') {
      if (!formData.serial_number.trim()) errors.serial_number = 'Serial number is required';
      if (!formData.capacity.trim()) errors.capacity = 'Capacity is required';
      if (!formData.voltage.trim()) errors.voltage = 'Voltage is required';
    } else if (componentType === 'tyre') {
      if (!formData.serial_number.trim()) errors.serial_number = 'Serial number is required';
      if (!formData.size.trim()) errors.size = 'Size is required';
    } else if (componentType === 'spare_part') {
      if (!formData.part_number.trim()) errors.part_number = 'Part number is required';
      if (!formData.name.trim()) errors.name = 'Name is required';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'error',
      });
      return;
    }

    setValidationErrors({});
    setLoading(true);

    try {
      // Ensure purchase_cost is always a valid number
      let purchaseCost = 0;
      if (componentSource === 'purchased') {
        purchaseCost = Number(formData.purchase_cost) || 0;
        if (purchaseCost <= 0) {
          setValidationErrors({ ...validationErrors, purchase_cost: 'Valid purchase cost is required' });
          showToast({
            title: 'Validation Error',
            description: 'Please enter a valid purchase cost',
            variant: 'error',
          });
          setLoading(false);
          return;
        }
      } else {
        // For vehicle entry, default to 0 if not provided
        purchaseCost = formData.purchase_cost && formData.purchase_cost !== '' 
          ? Number(formData.purchase_cost) || 0 
          : 0;
      }

      // Ensure current_vehicle_id is null if empty or "0", not the string "0"
      const vehicleId = formData.current_vehicle_id && formData.current_vehicle_id !== '' && formData.current_vehicle_id !== '0'
        ? formData.current_vehicle_id
        : null;

      const submitData: any = {
        type: componentType,
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        purchase_date: formData.purchase_date,
        warranty_expires_at: formData.warranty_expires_at || null,
        purchase_cost: purchaseCost,
        current_vehicle_id: vehicleId,
        status: componentType === 'spare_part' ? 'in_stock' : formData.status,
        notes: formData.notes || null,
      };

      if (componentType === 'battery') {
        submitData.serial_number = formData.serial_number;
        submitData.capacity = formData.capacity;
        submitData.voltage = formData.voltage;
      } else if (componentType === 'tyre') {
        submitData.serial_number = formData.serial_number;
        submitData.size = formData.size;
        submitData.tread_depth_mm = formData.tread_depth_mm ? Number(formData.tread_depth_mm) : null;
        submitData.position = formData.position || null;
      } else if (componentType === 'spare_part') {
        submitData.part_number = formData.part_number;
        submitData.name = formData.name;
        submitData.category = formData.category;
      }

      logger.debug('Submitting component data', submitData, 'CreateComponent');
      await createMutation.mutateAsync(submitData);
      
      showToast({
        title: 'Success',
        description: `${COMPONENT_TYPES.find(t => t.value === componentType)?.label} created successfully`,
        variant: 'success',
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/app/stockyard/components');
      }
    } catch (error: any) {
      logger.error('Component creation error', error, 'CreateComponent');
      let errorMessage = 'Failed to create component';
      
      if (error?.response) {
        // HTTP error response
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 405) {
          errorMessage = 'Method not allowed. Please check if the API endpoint is correctly configured.';
        } else if (status === 422 && data?.errors) {
          // Validation errors
          const validationErrors = Object.entries(data.errors)
            .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          errorMessage = `Validation failed: ${validationErrors}`;
        } else if (data?.message) {
          errorMessage = data.message;
        } else if (data?.error) {
          errorMessage = data.error;
        } else {
          errorMessage = `Server error (${status}): ${error.response.statusText || 'Unknown error'}`;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const TypeIcon = COMPONENT_TYPES.find(t => t.value === componentType)?.icon || Battery;

  return (
    <div style={{ padding: onCancel ? 0 : spacing.xl, maxWidth: '900px', margin: onCancel ? 0 : '0 auto' }}>
      {!onCancel && (
        <PageHeader
          title="Add Component"
          breadcrumbs={[
            { label: 'Dashboard', path: '/app/dashboard' },
            { label: 'Stockyard', path: '/app/stockyard' },
            { label: 'Component Ledger', path: '/app/stockyard/components' },
            { label: 'Add Component' },
          ]}
        />
      )}

      {/* Component Source Selector */}
      <div style={{ ...cardStyles.card, marginTop: spacing.lg, marginBottom: spacing.md }}>
        <Label style={{ marginBottom: spacing.md }}>Component Source *</Label>
        <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setComponentSource('purchased')}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: spacing.lg,
              border: `2px solid ${componentSource === 'purchased' ? colors.primary : colors.neutral[300]}`,
              borderRadius: borderRadius.lg,
              background: componentSource === 'purchased' ? colors.primary + '10' : 'white',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: spacing.sm,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (componentSource !== 'purchased') {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.background = colors.neutral[50];
              }
            }}
            onMouseLeave={(e) => {
              if (componentSource !== 'purchased') {
                e.currentTarget.style.borderColor = colors.neutral[300];
                e.currentTarget.style.background = 'white';
              }
            }}
          >
            <ShoppingCart size={32} color={componentSource === 'purchased' ? colors.primary : colors.neutral[600]} />
            <span style={{ ...typography.body, fontWeight: componentSource === 'purchased' ? 600 : 500 }}>
              Purchased
            </span>
            <span style={{ ...typography.caption, color: colors.neutral[600], fontSize: '12px' }}>
              Brand new component purchase
            </span>
          </button>
          <button
            type="button"
            onClick={() => setComponentSource('vehicle_entry')}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: spacing.lg,
              border: `2px solid ${componentSource === 'vehicle_entry' ? colors.success[500] : colors.neutral[300]}`,
              borderRadius: borderRadius.lg,
              background: componentSource === 'vehicle_entry' ? colors.success[500] + '10' : 'white',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: spacing.sm,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (componentSource !== 'vehicle_entry') {
                e.currentTarget.style.borderColor = colors.success[500];
                e.currentTarget.style.background = colors.neutral[50];
              }
            }}
            onMouseLeave={(e) => {
              if (componentSource !== 'vehicle_entry') {
                e.currentTarget.style.borderColor = colors.neutral[300];
                e.currentTarget.style.background = 'white';
              }
            }}
          >
            <Truck size={32} color={componentSource === 'vehicle_entry' ? colors.success[500] : colors.neutral[600]} />
            <span style={{ ...typography.body, fontWeight: componentSource === 'vehicle_entry' ? 600 : 500 }}>
              Vehicle Entry
            </span>
            <span style={{ ...typography.caption, color: colors.neutral[600], fontSize: '12px' }}>
              Component came with vehicle
            </span>
          </button>
        </div>
        {componentSource === 'vehicle_entry' && (
          <div style={{
            marginTop: spacing.md,
            padding: spacing.md,
            backgroundColor: colors.success[50],
            border: `1px solid ${colors.success[200]}`,
            borderRadius: borderRadius.md,
            ...typography.caption,
            color: colors.success[700]
          }}>
            💡 Components that came with the vehicle at yard entry. Purchase cost will be set to ₹0 unless specified.
          </div>
        )}
      </div>

      {/* Component Type Selector */}
      <div style={{ ...cardStyles.card, marginBottom: spacing.lg }}>
        <Label style={{ marginBottom: spacing.md }}>Component Type</Label>
        <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
          {COMPONENT_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = componentType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => setComponentType(type.value as any)}
                style={{
                  flex: 1,
                  minWidth: '150px',
                  padding: spacing.lg,
                  border: `2px solid ${isSelected ? colors.primary : colors.neutral[300]}`,
                  borderRadius: borderRadius.lg,
                  background: isSelected ? colors.primary + '10' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing.sm,
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
                    e.currentTarget.style.borderColor = colors.neutral[300];
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                <Icon size={32} color={isSelected ? colors.primary : colors.neutral[600]} />
                <span style={{ ...typography.body, fontWeight: isSelected ? 600 : 500 }}>
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ ...cardStyles.card }}>
        <div style={{ display: 'grid', gap: spacing.lg }}>
          {/* Common Fields */}
          <div 
            className="responsive-component-grid"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr', // Single column on mobile
              gap: spacing.md
            }}
          >
            <div>
              <Label>
                {componentType === 'spare_part' ? 'Part Number' : 'Serial Number'} *
              </Label>
              <Input
                value={componentType === 'spare_part' ? formData.part_number : formData.serial_number}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    [componentType === 'spare_part' ? 'part_number' : 'serial_number']: e.target.value
                  });
                  setValidationErrors({ ...validationErrors, [componentType === 'spare_part' ? 'part_number' : 'serial_number']: '' });
                }}
                placeholder={componentType === 'spare_part' ? 'Enter part number' : 'Enter serial number'}
                style={{
                  borderColor: validationErrors[componentType === 'spare_part' ? 'part_number' : 'serial_number'] ? colors.error[500] : undefined
                }}
              />
              {validationErrors[componentType === 'spare_part' ? 'part_number' : 'serial_number'] && (
                <div style={{ ...typography.caption, color: colors.error[500], marginTop: spacing.xs }}>
                  {validationErrors[componentType === 'spare_part' ? 'part_number' : 'serial_number']}
                </div>
              )}
            </div>

            {componentType === 'spare_part' && (
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setValidationErrors({ ...validationErrors, name: '' });
                  }}
                  placeholder="Enter part name"
                  style={{
                    borderColor: validationErrors.name ? colors.error[500] : undefined
                  }}
                />
                {validationErrors.name && (
                  <div style={{ ...typography.caption, color: colors.error[500], marginTop: spacing.xs }}>
                    {validationErrors.name}
                  </div>
                )}
              </div>
            )}

            <div>
              <Label>Brand *</Label>
              <Input
                value={formData.brand}
                onChange={(e) => {
                  setFormData({ ...formData, brand: e.target.value });
                  setValidationErrors({ ...validationErrors, brand: '' });
                }}
                placeholder="Enter brand"
                style={{
                  borderColor: validationErrors.brand ? colors.error[500] : undefined
                }}
              />
              {validationErrors.brand && (
                <div style={{ ...typography.caption, color: colors.error[500], marginTop: spacing.xs }}>
                  {validationErrors.brand}
                </div>
              )}
            </div>

            <div>
              <Label>Model *</Label>
              <Input
                value={formData.model}
                onChange={(e) => {
                  setFormData({ ...formData, model: e.target.value });
                  setValidationErrors({ ...validationErrors, model: '' });
                }}
                placeholder="Enter model"
                style={{
                  borderColor: validationErrors.model ? colors.error[500] : undefined
                }}
              />
              {validationErrors.model && (
                <div style={{ ...typography.caption, color: colors.error[500], marginTop: spacing.xs }}>
                  {validationErrors.model}
                </div>
              )}
            </div>
          </div>

          {/* Type-Specific Fields */}
          {componentType === 'battery' && (
            <div 
              className="responsive-component-grid"
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr', // Single column on mobile
                gap: spacing.md
              }}
            >
              <div>
                <Label>Capacity *</Label>
                <Input
                  value={formData.capacity}
                  onChange={(e) => {
                    setFormData({ ...formData, capacity: e.target.value });
                    setValidationErrors({ ...validationErrors, capacity: '' });
                  }}
                  placeholder="e.g., 100Ah"
                  style={{
                    borderColor: validationErrors.capacity ? colors.error[500] : undefined
                  }}
                />
                {validationErrors.capacity && (
                  <div style={{ ...typography.caption, color: colors.error[500], marginTop: spacing.xs }}>
                    {validationErrors.capacity}
                  </div>
                )}
              </div>
              <div>
                <Label>Voltage *</Label>
                <Input
                  value={formData.voltage}
                  onChange={(e) => {
                    setFormData({ ...formData, voltage: e.target.value });
                    setValidationErrors({ ...validationErrors, voltage: '' });
                  }}
                  placeholder="e.g., 12V"
                  style={{
                    borderColor: validationErrors.voltage ? colors.error[500] : undefined
                  }}
                />
                {validationErrors.voltage && (
                  <div style={{ ...typography.caption, color: colors.error[500], marginTop: spacing.xs }}>
                    {validationErrors.voltage}
                  </div>
                )}
              </div>
            </div>
          )}

          {componentType === 'tyre' && (
            <div 
              className="responsive-component-grid"
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr', // Single column on mobile
                gap: spacing.md
              }}
            >
              <div>
                <Label>Size *</Label>
                <Input
                  value={formData.size}
                  onChange={(e) => {
                    setFormData({ ...formData, size: e.target.value });
                    setValidationErrors({ ...validationErrors, size: '' });
                  }}
                  placeholder="e.g., 205/65R15"
                  style={{
                    borderColor: validationErrors.size ? colors.error[500] : undefined
                  }}
                />
                {validationErrors.size && (
                  <div style={{ ...typography.caption, color: colors.error[500], marginTop: spacing.xs }}>
                    {validationErrors.size}
                  </div>
                )}
              </div>
              <div>
                <Label>Position</Label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  style={{
                    width: '100%',
                    padding: `${spacing.sm}px ${spacing.md}px`,
                    borderRadius: borderRadius.md,
                    border: `1px solid ${colors.neutral[300]}`,
                    fontSize: typography.body.fontSize,
                    fontFamily: typography.body.fontFamily,
                  }}
                >
                  <option value="">Select position</option>
                  {TYRE_POSITIONS.map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Tread Depth (mm)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={formData.tread_depth_mm}
                  onChange={(e) => setFormData({ ...formData, tread_depth_mm: e.target.value })}
                  placeholder="e.g., 8"
                  style={{ fontSize: '16px' }} // 16px prevents iOS zoom
                />
              </div>
            </div>
          )}

          {componentType === 'spare_part' && (
            <div>
              <Label>Category *</Label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: '100%',
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  borderRadius: borderRadius.md,
                  border: `1px solid ${colors.neutral[300]}`,
                  fontSize: typography.body.fontSize,
                  fontFamily: typography.body.fontFamily,
                }}
              >
                {SPARE_PART_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Purchase & Warranty */}
          <div 
            className="responsive-component-grid"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr', // Single column on mobile
              gap: spacing.md
            }}
          >
            <div>
              <Label>
                {componentSource === 'purchased' ? 'Purchase Date *' : 'Entry Date / Purchase Date'}
              </Label>
              <Input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => {
                  setFormData({ ...formData, purchase_date: e.target.value });
                  setValidationErrors({ ...validationErrors, purchase_date: '' });
                }}
                style={{
                  fontSize: '16px', // 16px prevents iOS zoom
                  borderColor: validationErrors.purchase_date ? colors.error[500] : undefined
                }}
              />
              {validationErrors.purchase_date && (
                <div style={{ ...typography.caption, color: colors.error[500], marginTop: spacing.xs }}>
                  {validationErrors.purchase_date}
                </div>
              )}
              {componentSource === 'vehicle_entry' && (
                <div style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.xs }}>
                  Date when vehicle entered the yard
                </div>
              )}
            </div>
            <div>
              <Label>Warranty Expires</Label>
              <Input
                type="date"
                value={formData.warranty_expires_at}
                onChange={(e) => setFormData({ ...formData, warranty_expires_at: e.target.value })}
                style={{ fontSize: '16px' }} // 16px prevents iOS zoom
              />
            </div>
            <div>
              <Label>
                {componentSource === 'purchased' ? 'Purchase Cost (₹) *' : 'Purchase Cost (₹) (Optional)'}
              </Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                autoComplete="transaction-amount"
                value={formData.purchase_cost}
                onChange={(e) => {
                  setFormData({ ...formData, purchase_cost: e.target.value });
                  setValidationErrors({ ...validationErrors, purchase_cost: '' });
                }}
                placeholder={componentSource === 'vehicle_entry' ? '0.00 (default)' : '0.00'}
                style={{
                  fontSize: '16px', // 16px prevents iOS zoom
                  borderColor: validationErrors.purchase_cost ? colors.error[500] : undefined
                }}
              />
              {validationErrors.purchase_cost && (
                <div style={{ ...typography.caption, color: colors.error[500], marginTop: spacing.xs }}>
                  {validationErrors.purchase_cost}
                </div>
              )}
              {componentSource === 'vehicle_entry' && (
                <div style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.xs }}>
                  Defaults to ₹0 for components that came with vehicle
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Assignment */}
          <div>
            <Label>
              {componentSource === 'vehicle_entry' ? 'Vehicle *' : 'Current Vehicle (Optional)'}
            </Label>
            <select
              value={formData.current_vehicle_id}
              onChange={(e) => setFormData({ ...formData, current_vehicle_id: e.target.value })}
              required={componentSource === 'vehicle_entry'}
              style={{
                width: '100%',
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.neutral[300]}`,
                fontSize: typography.body.fontSize,
                fontFamily: typography.body.fontFamily,
              }}
            >
              <option value="">{componentSource === 'vehicle_entry' ? 'Select vehicle' : 'No vehicle assigned'}</option>
              {vehicles.map((vehicle, index) => (
                <option key={`vehicle-${vehicle.id}-${index}`} value={vehicle.id}>
                  {vehicle.registration_number} {vehicle.make && vehicle.model ? `(${vehicle.make} ${vehicle.model})` : ''}
                </option>
              ))}
            </select>
            {componentSource === 'vehicle_entry' && !formData.current_vehicle_id && (
              <div style={{ ...typography.caption, color: colors.warning[600], marginTop: spacing.xs }}>
                ⚠️ Vehicle selection is required for components that came with vehicle entry
              </div>
            )}
          </div>

          {/* Status */}
          {componentType !== 'spare_part' && (
            <div>
              <Label>Status</Label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{
                  width: '100%',
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  borderRadius: borderRadius.md,
                  border: `1px solid ${colors.neutral[300]}`,
                  fontSize: typography.body.fontSize,
                  fontFamily: typography.body.fontFamily,
                }}
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
                {componentType === 'tyre' && <option value="needs_replacement">Needs Replacement</option>}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={4}
              style={{
                width: '100%',
                padding: spacing.md,
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.neutral[300]}`,
                fontSize: '16px', // 16px prevents iOS zoom
                fontFamily: typography.body.fontFamily,
                resize: 'vertical',
              }}
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end', marginTop: spacing.md }}>
            <Button
              type="button"
              onClick={() => {
                if (onCancel) {
                  onCancel();
                } else {
                  navigate('/app/stockyard/components');
                }
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading || createMutation.isPending}
              icon={<TypeIcon size={18} />}
            >
              Create {COMPONENT_TYPES.find(t => t.value === componentType)?.label}
            </Button>
          </div>
        </div>
      </form>

      {/* Responsive grid styles */}
      <style>{`
        @media (min-width: 768px) {
          .responsive-component-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
};

