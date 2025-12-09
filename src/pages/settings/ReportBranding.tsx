import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/button';
import { FormField, TextareaField } from '../../components/ui/FormField';
import { LogoUploader } from '../../components/settings/LogoUploader';
import { ColorPicker } from '../../components/settings/ColorPicker';
import { ReportPreview } from '../../components/settings/ReportPreview';
import { Modal } from '../../components/ui/Modal';
import { colors, spacing, typography, borderRadius, cardStyles } from '../../lib/theme';
import { Save, ArrowLeft, Eye } from 'lucide-react';
import { useToast } from '../../providers/ToastProvider';
import {
  getReportBranding,
  updateReportBranding,
  uploadLogo,
  deleteLogo,
  type ReportBranding,
  type ReportBrandingUpdate,
} from '../../lib/report-branding';

export const ReportBrandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  
  const [branding, setBranding] = useState<ReportBranding>({
    id: null,
    logoUrl: null,
    companyName: 'VOMS',
    tradingAs: null,
    addressLine1: null,
    addressLine2: null,
    phone: null,
    email: null,
    website: null,
    gstin: null,
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    showLogoInHeader: true,
    showAddressInHeader: true,
    showContactInFooter: true,
    addWatermarkToPhotos: false,
    includeQRCode: false,
    footerText: null,
    createdAt: null,
    updatedAt: null,
  });

  // Load branding settings
  useEffect(() => {
    const loadBranding = async () => {
      try {
        setLoading(true);
        const data = await getReportBranding();
        setBranding(data);
      } catch (error) {
        console.error('Failed to load branding:', error);
        showToast({
          title: 'Error',
          description: 'Failed to load branding settings',
          variant: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    loadBranding();
  }, [showToast]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const update: ReportBrandingUpdate = {
        companyName: branding.companyName,
        tradingAs: branding.tradingAs || undefined,
        addressLine1: branding.addressLine1 || undefined,
        addressLine2: branding.addressLine2 || undefined,
        phone: branding.phone || undefined,
        email: branding.email || undefined,
        website: branding.website || undefined,
        gstin: branding.gstin || undefined,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        showLogoInHeader: branding.showLogoInHeader,
        showAddressInHeader: branding.showAddressInHeader,
        showContactInFooter: branding.showContactInFooter,
        addWatermarkToPhotos: branding.addWatermarkToPhotos,
        includeQRCode: branding.includeQRCode,
        footerText: branding.footerText || undefined,
      };

      const updated = await updateReportBranding(update);
      setBranding(updated);
      
      showToast({
        title: 'Success',
        description: 'Branding settings saved successfully',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to save branding:', error);
      showToast({
        title: 'Error',
        description: 'Failed to save branding settings',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      const result = await uploadLogo(file);
      setBranding((prev) => ({ ...prev, logoUrl: result.logoUrl }));
      showToast({
        title: 'Success',
        description: 'Logo uploaded successfully',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to upload logo:', error);
      throw error; // Re-throw to let LogoUploader handle it
    }
  };

  const handleLogoRemove = async () => {
    try {
      await deleteLogo();
      setBranding((prev) => ({ ...prev, logoUrl: null }));
      showToast({
        title: 'Success',
        description: 'Logo removed successfully',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to remove logo:', error);
      throw error; // Re-throw to let LogoUploader handle it
    }
  };

  if (loading) {
    return (
      <div style={{ padding: spacing.xl }}>
        <p style={typography.body}>Loading branding settings...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: spacing.xl }}>
      <PageHeader
        title="Report Branding"
        subtitle="Customize how inspection reports appear"
        icon="🎨"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Settings', path: '/app/settings' },
          { label: 'Report Branding' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button
              variant="secondary"
              onClick={() => navigate(-1)}
              icon={<ArrowLeft size={18} />}
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={saving}
              icon={<Save size={18} />}
            >
              Save Changes
            </Button>
          </div>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: spacing.xl,
          marginTop: spacing.xl,
        }}
      >
        {/* Left Column: Form */}
        <div>
          {/* Logo Section */}
          <div style={{ ...cardStyles.card, marginBottom: spacing.xl }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.lg }}>Logo</h3>
            <LogoUploader
              currentLogoUrl={branding.logoUrl}
              onUpload={handleLogoUpload}
              onRemove={handleLogoRemove}
            />
          </div>

          {/* Company Details Section */}
          <div style={{ ...cardStyles.card, marginBottom: spacing.xl }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.lg }}>Company Details</h3>
            
            <FormField
              label="Company Name"
              value={branding.companyName}
              onChange={(value) => setBranding((prev) => ({ ...prev, companyName: value }))}
              required
            />
            
            <FormField
              label="Trading As"
              value={branding.tradingAs || ''}
              onChange={(value) => setBranding((prev) => ({ ...prev, tradingAs: value || null }))}
              placeholder="Optional trading name"
            />
            
            <FormField
              label="Address Line 1"
              value={branding.addressLine1 || ''}
              onChange={(value) => setBranding((prev) => ({ ...prev, addressLine1: value || null }))}
              placeholder="Street address"
            />
            
            <FormField
              label="Address Line 2"
              value={branding.addressLine2 || ''}
              onChange={(value) => setBranding((prev) => ({ ...prev, addressLine2: value || null }))}
              placeholder="City, State, PIN"
            />
            
            <FormField
              label="Phone"
              type="tel"
              value={branding.phone || ''}
              onChange={(value) => setBranding((prev) => ({ ...prev, phone: value || null }))}
              placeholder="+91-XXXXXXXXXX"
            />
            
            <FormField
              label="Email"
              type="email"
              value={branding.email || ''}
              onChange={(value) => setBranding((prev) => ({ ...prev, email: value || null }))}
              placeholder="contact@company.com"
            />
            
            <FormField
              label="Website"
              type="text"
              value={branding.website || ''}
              onChange={(value) => setBranding((prev) => ({ ...prev, website: value || null }))}
              placeholder="https://www.company.com"
            />
            
            <FormField
              label="GSTIN"
              value={branding.gstin || ''}
              onChange={(value) => setBranding((prev) => ({ ...prev, gstin: value || null }))}
              placeholder="Optional GST number"
            />
          </div>

          {/* Colors Section */}
          <div style={{ ...cardStyles.card, marginBottom: spacing.xl }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.lg }}>Colors</h3>
            
            <div style={{ marginBottom: spacing.lg }}>
              <ColorPicker
                label="Primary Color"
                value={branding.primaryColor}
                onChange={(color) => setBranding((prev) => ({ ...prev, primaryColor: color }))}
              />
            </div>
            
            <ColorPicker
              label="Secondary Color"
              value={branding.secondaryColor}
              onChange={(color) => setBranding((prev) => ({ ...prev, secondaryColor: color }))}
            />
          </div>

          {/* Report Options Section */}
          <div style={{ ...cardStyles.card, marginBottom: spacing.xl }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.lg }}>Report Options</h3>
            
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: spacing.md, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={branding.showLogoInHeader}
                onChange={(e) => setBranding((prev) => ({ ...prev, showLogoInHeader: e.target.checked }))}
                style={{ marginRight: spacing.sm, width: '18px', height: '18px' }}
              />
              <span style={typography.body}>Show logo in header</span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: spacing.md, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={branding.showAddressInHeader}
                onChange={(e) => setBranding((prev) => ({ ...prev, showAddressInHeader: e.target.checked }))}
                style={{ marginRight: spacing.sm, width: '18px', height: '18px' }}
              />
              <span style={typography.body}>Show address in header</span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: spacing.md, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={branding.showContactInFooter}
                onChange={(e) => setBranding((prev) => ({ ...prev, showContactInFooter: e.target.checked }))}
                style={{ marginRight: spacing.sm, width: '18px', height: '18px' }}
              />
              <span style={typography.body}>Show contact in footer</span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: spacing.md, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={branding.addWatermarkToPhotos}
                onChange={(e) => setBranding((prev) => ({ ...prev, addWatermarkToPhotos: e.target.checked }))}
                style={{ marginRight: spacing.sm, width: '18px', height: '18px' }}
              />
              <span style={typography.body}>Add watermark to photos</span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: spacing.md, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={branding.includeQRCode}
                onChange={(e) => setBranding((prev) => ({ ...prev, includeQRCode: e.target.checked }))}
                style={{ marginRight: spacing.sm, width: '18px', height: '18px' }}
              />
              <span style={typography.body}>Include QR code in footer</span>
            </label>
          </div>

          {/* Footer Text Section */}
          <div style={{ ...cardStyles.card }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.lg }}>Footer Text</h3>
            
            <TextareaField
              label="Custom Footer Text"
              value={branding.footerText || ''}
              onChange={(value) => setBranding((prev) => ({ ...prev, footerText: value || null }))}
              placeholder="Optional custom text to display in report footer"
              rows={4}
            />
          </div>
        </div>

        {/* Right Column: Preview */}
        <div style={{ position: 'sticky', top: spacing.xl }}>
          <div style={{ ...cardStyles.card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
              <h3 style={{ ...typography.subheader, margin: 0 }}>Live Preview</h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowFullPreview(true)}
                icon={<Eye size={16} />}
              >
                Full Size
              </Button>
            </div>
            
            <ReportPreview branding={branding} compact />
          </div>
        </div>
      </div>

      {/* Full Size Preview Modal */}
      {showFullPreview && (
        <Modal
          title="Report Preview"
          onClose={() => setShowFullPreview(false)}
          size="xl"
        >
          <ReportPreview branding={branding} />
        </Modal>
      )}
    </div>
  );
};


