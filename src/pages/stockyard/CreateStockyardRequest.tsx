import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../providers/ToastProvider';
import { createStockyardRequest, type CreateStockyardRequestPayload, type StockyardRequestType } from '../../lib/stockyard';
import { Warehouse, ArrowLeft } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

interface Vehicle {
  id: string;
  registration_number: string;
  make?: string;
  model?: string;
}

interface Yard {
  id: string;
  name: string;
}

export const CreateStockyardRequest: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isMobile = useMobileViewport();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [yards, setYards] = useState<Yard[]>([]);
  const [formData, setFormData] = useState<CreateStockyardRequestPayload>({
    vehicle_id: '',
    yard_id: '',
    type: 'ENTRY',
    notes: '',
  });

  useEffect(() => {
    // Fetch vehicles and yards
    const fetchData = async () => {
      try {
        const [vehiclesRes, yardsRes] = await Promise.all([
          apiClient.get('/v1/vehicles'),
          apiClient.get('/v1/yards'),
        ]);
        setVehicles(Array.isArray(vehiclesRes.data) ? vehiclesRes.data : vehiclesRes.data.data || []);
        setYards(Array.isArray(yardsRes.data) ? yardsRes.data : yardsRes.data.data || []);
      } catch (err: any) {
        // Log error for debugging
        console.error('Failed to load vehicles/yards:', err);
        
        // Set empty arrays as fallback
        setVehicles([]);
        setYards([]);
        
        // Show warning toast to user
        showToast({
          title: 'Warning',
          description: 'Failed to load vehicles or yards. Some options may be unavailable. Please refresh the page.',
          variant: 'warning',
        });
      }
    };
    fetchData();
  }, [showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicle_id || !formData.yard_id) {
      showToast({
        title: 'Validation Error',
        description: 'Please select a vehicle and yard',
        variant: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      const request = await createStockyardRequest(formData);
      showToast({
        title: 'Success',
        description: 'Stockyard request created successfully',
        variant: 'success',
      });
      navigate(`/app/stockyard/${request.id}`);
    } catch (err) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create request',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      ...getResponsivePageContainerStyles({ desktopMaxWidth: '800px' }),
      padding: isMobile ? spacing.lg : spacing.xl,
    }}>
      <PageHeader
        title="Create Stockyard Request"
        subtitle="Request vehicle entry or exit from stockyard"
        icon={<Warehouse size={24} />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Stockyard', path: '/app/stockyard' },
          { label: 'Create Request' }
        ]}
      />

      <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <div>
            <Label htmlFor="type">Request Type</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as StockyardRequestType })}
              style={{
                width: '100%',
                padding: spacing.md,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '14px',
                marginTop: spacing.xs,
              }}
            >
              <option value="ENTRY">Entry</option>
              <option value="EXIT">Exit</option>
            </select>
          </div>

          <div>
            <Label htmlFor="vehicle_id">Vehicle *</Label>
            <select
              id="vehicle_id"
              value={formData.vehicle_id}
              onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
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
              <option value="">Select a vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={`vehicle-${vehicle.id}`} value={vehicle.id}>
                  {vehicle.registration_number} {vehicle.make && vehicle.model ? `(${vehicle.make} ${vehicle.model})` : ''}
                </option>
              ))}
            </select>
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
            <Label htmlFor="notes">Notes (Optional)</Label>
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
              placeholder="Add any additional notes or instructions..."
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
              {loading ? 'Creating...' : 'Create Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

