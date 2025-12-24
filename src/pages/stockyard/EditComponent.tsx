import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { colors, spacing, typography, cardStyles, borderRadius } from '@/lib/theme';
import { Battery, Package, Wrench, ArrowLeft } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { useComponent, useUpdateComponent } from '@/lib/queries';
import { apiClient } from '@/lib/apiClient';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { NetworkError } from '@/components/ui/NetworkError';

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

export const EditComponent: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const updateMutation = useUpdateComponent();
  
  const { data: component, isLoading, isError, error } = useComponent(type || '', id || '');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    // Common fields
    brand: '',
    model: '',
    purchase_date: '',
    warranty_expires_at: '',
    purchase_cost: '',
    current_vehicle_id: '',
    status: 'active',
    notes: '',
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
    if (component) {
      setFormData({
        brand: component.brand || '',
        model: component.model || '',
        purchase_date: component.purchase_date ? component.purchase_date.split('T')[0] : '',
        warranty_expires_at: component.warranty_expires_at ? component.warranty_expires_at.split('T')[0] : '',
        purchase_cost: component.purchase_cost?.toString() || '',
        current_vehicle_id: component.current_vehicle_id || '',
        status: component.status || 'active',
        notes: component.notes || '',
        serial_number: component.serial_number || '',
        capacity: component.capacity || '',
        voltage: component.voltage || '',
        size: component.size || '',
        tread_depth_mm: component.tread_depth_mm?.toString() || '',
        position: component.position || '',
        part_number: component.part_number || '',
        name: component.name || '',
        category: component.category || 'engine',
      });
    }
  }, [component]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!type || !id) return;

    const errors: Record<string, string> = {};

    // Common validation
    if (!formData.brand.trim()) errors.brand = 'Brand is required';
    if (!formData.model.trim()) errors.model = 'Model is required';
    if (!formData.purchase_date) errors.purchase_date = 'Purchase date is required';
    if (!formData.purchase_cost || Number(formData.purchase_cost) <= 0) {
      errors.purchase_cost = 'Valid purchase cost is required';
    }

    // Type-specific validation
    if (type === 'battery') {
      if (!formData.serial_number.trim()) errors.serial_number = 'Serial number is required';
      if (!formData.capacity.trim()) errors.capacity = 'Capacity is required';
      if (!formData.voltage.trim()) errors.voltage = 'Voltage is required';
    } else if (type === 'tyre') {
      if (!formData.serial_number.trim()) errors.serial_number = 'Serial number is required';
      if (!formData.size.trim()) errors.size = 'Size is required';
    } else if (type === 'spare_part') {
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
      const submitData: any = {
        brand: formData.brand,
        model: formData.model,
        purchase_date: formData.purchase_date,
        warranty_expires_at: formData.warranty_expires_at || null,
        purchase_cost: Number(formData.purchase_cost),
        current_vehicle_id: formData.current_vehicle_id || null,
        status: type === 'spare_part' ? (formData.status === 'active' ? 'in_stock' : formData.status) : formData.status,
        notes: formData.notes || null,
      };

      if (type === 'battery') {
        submitData.serial_number = formData.serial_number;
        submitData.capacity = formData.capacity;
        submitData.voltage = formData.voltage;
      } else if (type === 'tyre') {
        submitData.serial_number = formData.serial_number;
        submitData.size = formData.size;
        submitData.tread_depth_mm = formData.tread_depth_mm ? Number(formData.tread_depth_mm) : null;
        submitData.position = formData.position || null;
      } else if (type === 'spare_part') {
        submitData.part_number = formData.part_number;
        submitData.name = formData.name;
        submitData.category = formData.category;
      }

      await updateMutation.mutateAsync({ type, id, data: submitData });
      
      showToast({
        title: 'Success',
        description: 'Component updated successfully',
        variant: 'success',
      });
      
      navigate(`/app/stockyard/components/${type}/${id}`);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update component';
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader
          title="Edit Component"
          breadcrumbs={[
            { label: 'Dashboard', path: '/app/dashboard' },
            { label: 'Stockyard', path: '/app/stockyard' },
            { label: 'Component Ledger', path: '/app/stockyard/components' },
            { label: 'Edit' },
          ]}
        />
        <SkeletonLoader />
      </div>
    );
  }

  if (isError || !component) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader
          title="Edit Component"
          breadcrumbs={[
            { label: 'Dashboard', path: '/app/dashboard' },
            { label: 'Stockyard', path: '/app/stockyard' },
            { label: 'Component Ledger', path: '/app/stockyard/components' },
            { label: 'Edit' },
          ]}
        />
        <NetworkError error={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const componentType = type as 'battery' | 'tyre' | 'spare_part';
  const TypeIcon = COMPONENT_TYPES.find(t => t.value === componentType)?.icon || Battery;

  return (
    <div style={{ padding: spacing.xl, maxWidth: '900px', margin: '0 auto' }}>
      <PageHeader
        title={`Edit ${COMPONENT_TYPES.find(t => t.value === componentType)?.label || 'Component'}`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/app/dashboard' },
          { label: 'Stockyard', path: '/app/stockyard' },
          { label: 'Component Ledger', path: '/app/stockyard/components' },
          { label: componentType === 'spare_part' ? component.name : `${component.brand} ${component.model}`, path: `/app/stockyard/components/${type}/${id}` },
          { label: 'Edit' },
        ]}
        actions={
          <Button
            onClick={() => navigate(`/app/stockyard/components/${type}/${id}`)}
            variant="secondary"
            icon={<ArrowLeft size={18} />}
          >
            Back
          </Button>
        }
      />

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ ...cardStyles.card, marginTop: spacing.lg }}>
        <div style={{ display: 'grid', gap: spacing.lg }}>
          {/* Common Fields */}
          <CardGrid gap="md">
            <div>
              <Label>
                {componentType === 'spare_part' ? 'Part Number' : 'Serial Number'} *
              </Label>
              <Input
                value={componentType === 'spare_part' ? formData.part_number : formData.serial_number}
                onChange={(e) => setFormData({
                  ...formData,
                  [componentType === 'spare_part' ? 'part_number' : 'serial_number']: e.target.value
                })}
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
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
            <CardGrid gap="md">
              <div>
                <Label>Capacity *</Label>
                <Input
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, voltage: e.target.value })}
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
            <CardGrid gap="md">
              <div>
                <Label>Size *</Label>
                <Input
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
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
                  value={formData.tread_depth_mm}
                  onChange={(e) => setFormData({ ...formData, tread_depth_mm: e.target.value })}
                  placeholder="e.g., 8"
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
          <CardGrid gap="md">
            <div>
              <Label>Purchase Date *</Label>
              <Input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                style={{
                  borderColor: validationErrors.purchase_date ? colors.error[500] : undefined
                }}
              />
              {validationErrors.purchase_date && (
                <div style={{ ...typography.caption, color: colors.error[500], marginTop: spacing.xs }}>
                  {validationErrors.purchase_date}
                </div>
              )}
            </div>
            <div>
              <Label>Warranty Expires</Label>
              <Input
                type="date"
                value={formData.warranty_expires_at}
                onChange={(e) => setFormData({ ...formData, warranty_expires_at: e.target.value })}
              />
            </div>
            <div>
              <Label>Purchase Cost (₹) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.purchase_cost}
                onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
                placeholder="0.00"
                style={{
                  borderColor: validationErrors.purchase_cost ? colors.error[500] : undefined
                }}
              />
              {validationErrors.purchase_cost && (
                <div style={{ ...typography.caption, color: colors.error[500], marginTop: spacing.xs }}>
                  {validationErrors.purchase_cost}
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Assignment */}
          <div>
            <Label>Current Vehicle (Optional)</Label>
            <select
              value={formData.current_vehicle_id}
              onChange={(e) => setFormData({ ...formData, current_vehicle_id: e.target.value })}
              style={{
                width: '100%',
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.neutral[300]}`,
                fontSize: typography.body.fontSize,
                fontFamily: typography.body.fontFamily,
              }}
            >
              <option value="">No vehicle assigned</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.registration_number} {vehicle.make && vehicle.model ? `(${vehicle.make} ${vehicle.model})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
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
              {componentType === 'spare_part' ? (
                <>
                  <option value="in_stock">In Stock</option>
                  <option value="installed">Installed</option>
                  <option value="retired">Retired</option>
                </>
              ) : (
                <>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                  {componentType === 'tyre' && <option value="needs_replacement">Needs Replacement</option>}
                </>
              )}
            </select>
          </div>

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
                fontSize: typography.body.fontSize,
                fontFamily: typography.body.fontFamily,
                resize: 'vertical',
              }}
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end', marginTop: spacing.md }}>
            <Button
              type="button"
              onClick={() => navigate(`/app/stockyard/components/${type}/${id}`)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading || updateMutation.isPending}
              icon={<TypeIcon size={18} />}
            >
              Update Component
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

