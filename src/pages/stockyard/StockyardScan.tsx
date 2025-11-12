import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../providers/ToastProvider';
import { QRScanner } from '../../components/ui/QRScanner';
import { scanStockyardRequest, getStockyardRequest, type ScanStockyardRequestPayload } from '../../lib/stockyard';
import { Search, ArrowLeft, Camera } from 'lucide-react';

export const StockyardScan: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [requestId, setRequestId] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'IN' | 'OUT'>('IN');
  const [gatekeeperName, setGatekeeperName] = useState('');
  const [odometerKm, setOdometerKm] = useState('');
  const [engineHours, setEngineHours] = useState('');

  const handleScan = async (scannedData: string) => {
    setRequestId(scannedData);
    setShowQRScanner(false);
  };

  const handleManualEntry = (code: string) => {
    setRequestId(code);
    setShowQRScanner(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestId.trim()) {
      showToast({
        title: 'Validation Error',
        description: 'Please enter or scan a request ID',
        variant: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      
      // First verify the request exists
      const request = await getStockyardRequest(requestId.trim());
      
      if (!request) {
        showToast({
          title: 'Error',
          description: 'Request not found',
          variant: 'error',
        });
        return;
      }

      if (request.status !== 'Approved') {
        showToast({
          title: 'Error',
          description: 'Request must be approved before scanning',
          variant: 'error',
        });
        return;
      }

      // Prepare scan payload
      const payload: ScanStockyardRequestPayload = {
        action,
        gatekeeper_name: gatekeeperName || undefined,
        odometer_km: odometerKm ? parseInt(odometerKm) : undefined,
        engine_hours: engineHours ? parseInt(engineHours) : undefined,
      };

      await scanStockyardRequest(requestId.trim(), payload);
      
      showToast({
        title: 'Success',
        description: `Vehicle ${action === 'IN' ? 'scanned in' : 'scanned out'} successfully`,
        variant: 'success',
      });
      
      navigate(`/app/stockyard/${requestId.trim()}`);
    } catch (err) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to scan request',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: spacing.xl, maxWidth: '800px', margin: '0 auto' }}>
      <PageHeader
        title="Scan Stockyard Request"
        subtitle="Scan QR code or enter request ID to process vehicle entry/exit"
        icon={<Search size={24} />}
      />

      <div style={{ marginBottom: spacing.md }}>
        <Button variant="secondary" onClick={() => navigate('/app/stockyard')}>
          <ArrowLeft size={16} style={{ marginRight: spacing.xs }} />
          Back to Dashboard
        </Button>
      </div>

      <div style={{ ...cardStyles.card }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <div>
            <Label htmlFor="action">Scan Action</Label>
            <select
              id="action"
              value={action}
              onChange={(e) => setAction(e.target.value as 'IN' | 'OUT')}
              style={{
                width: '100%',
                padding: spacing.md,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '14px',
                marginTop: spacing.xs,
              }}
            >
              <option value="IN">Scan In (Entry)</option>
              <option value="OUT">Scan Out (Exit)</option>
            </select>
          </div>

          <div>
            <Label htmlFor="request_id">Request ID *</Label>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <Input
                id="request_id"
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
                placeholder="Enter request ID or scan QR code"
                required
                style={{ flex: 1 }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowQRScanner(true)}
              >
                <Camera size={16} style={{ marginRight: spacing.xs }} />
                Scan QR
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="gatekeeper_name">Gatekeeper Name</Label>
            <Input
              id="gatekeeper_name"
              value={gatekeeperName}
              onChange={(e) => setGatekeeperName(e.target.value)}
              placeholder="Enter gatekeeper name"
            />
          </div>

          {action === 'IN' && (
            <>
              <div>
                <Label htmlFor="odometer_km">Odometer (km)</Label>
                <Input
                  id="odometer_km"
                  type="number"
                  value={odometerKm}
                  onChange={(e) => setOdometerKm(e.target.value)}
                  placeholder="Enter odometer reading"
                />
              </div>
              <div>
                <Label htmlFor="engine_hours">Engine Hours</Label>
                <Input
                  id="engine_hours"
                  type="number"
                  value={engineHours}
                  onChange={(e) => setEngineHours(e.target.value)}
                  placeholder="Enter engine hours"
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/app/stockyard')}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Processing...' : `Scan ${action === 'IN' ? 'In' : 'Out'}`}
            </Button>
          </div>
        </form>
      </div>

      {showQRScanner && (
        <QRScanner
          onScan={handleScan}
          onManualEntry={handleManualEntry}
          onClose={() => setShowQRScanner(false)}
          title="Scan Stockyard Request QR Code"
          hint="Point camera at QR code or enter request ID manually"
        />
      )}
    </div>
  );
};

