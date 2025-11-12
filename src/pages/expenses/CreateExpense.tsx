import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { apiClient } from '../../lib/apiClient';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useUploader } from '../../lib/upload';
import { useToast } from '../../providers/ToastProvider';
import { useExpenseReferences } from '../../providers/ExpenseReferencesProvider';

// 💰 Enhanced Expense Creation Form
// Smart form with auto-categorization, GPS location, receipt capture
// Asset and project linking, template support

interface UploadedReceipt {
  key: string;
  name: string;
  size?: number;
}

interface ExpenseFormData {
  amount: string;
  category: string;
  description: string;
  payment_method: 'CASH' | 'COMPANY_UPI' | 'PERSONAL_UPI' | 'CARD';
  date: string;
  time: string;
  location: string;
  gps_lat?: number;
  gps_lng?: number;
  receipts: UploadedReceipt[];
  project_id?: string;
  asset_id?: string;
  template_id?: string;
  notes?: string;
}

const EXPENSE_CATEGORIES = [
  'LOCAL_TRANSPORT', 'INTERCITY_TRAVEL', 'LODGING', 'FOOD', 'TOLLS_PARKING', 'FUEL',
  'PARTS_REPAIR', 'RTO_COMPLIANCE', 'DRIVER_PAYMENT', 'RECHARGE', 'CONSUMABLES_MISC',
  'VENDOR_AGENT_FEE', 'MISC'
];

// Fleet-related categories that require asset_id (vehicle linkage)
const FLEET_RELATED_CATEGORIES = [
  'FUEL',
  'PARTS_REPAIR',
  'RTO_COMPLIANCE',
  'DRIVER_PAYMENT',
  'TOLLS_PARKING', // Vehicle tolls/parking
] as const;

const isFleetRelatedCategory = (category: string): boolean => {
  return FLEET_RELATED_CATEGORIES.includes(category as typeof FLEET_RELATED_CATEGORIES[number]);
};

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'COMPANY_UPI', label: 'Company UPI' },
  { value: 'PERSONAL_UPI', label: 'Personal UPI' },
  { value: 'CARD', label: 'Card' }
];

export const CreateExpense: React.FC = () => {
  const navigate = useNavigate();
  const { uploadImageWithProgress } = useUploader();
  const { showToast } = useToast();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: '',
    category: 'LOCAL_TRANSPORT',
    description: '',
    payment_method: 'CASH',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    location: '',
    receipts: [],
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const {
    projects: projectsState,
    assets: assetsState,
    templates: templatesState,
    refreshProjects,
    refreshAssets,
    refreshTemplates,
  } = useExpenseReferences();

  const projects = projectsState.data;
  const assets = assetsState.data;
  const templates = templatesState.data;

  const clearFieldError = (field: string) => {
    setValidationErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const getFieldError = (field: string) => validationErrors[field];

  const getAnyFieldError = (...fields: string[]) => {
    for (const field of fields) {
      const error = getFieldError(field);
      if (error) return error;
    }
    return undefined;
  };

  const getErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const err = error as AxiosError<{ message?: string; detail?: string }>;
      return err.response?.data?.message || err.response?.data?.detail || err.message;
    }
    return error instanceof Error ? error.message : 'Something went wrong';
  };

  const getPosition = () => new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    const options: PositionOptions = { enableHighAccuracy: true, timeout: 8000 };
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    const newReceipts: UploadedReceipt[] = [];

    for (const file of Array.from(files)) {
      try {
        const result = await uploadImageWithProgress(file, 'expense-receipts');
        if (!result.key) {
          showToast({
            title: 'Upload failed',
            description: 'The server did not return a file reference.',
            variant: 'error',
          });
          continue;
        }
        newReceipts.push({ key: result.key, name: file.name || 'receipt', size: file.size });
      } catch (error) {
        console.error('File upload failed:', error);
        showToast({
          title: 'Upload failed',
          description: getErrorMessage(error),
          variant: 'error',
        });
      }
    }

    if (newReceipts.length > 0) {
      setFormData((prev) => ({
        ...prev,
        receipts: [...prev.receipts, ...newReceipts],
      }));
      clearFieldError('receipts');
      clearFieldError('receipt_keys');
      showToast({
        title: 'Receipts ready',
        description: `${newReceipts.length} receipt${newReceipts.length > 1 ? 's' : ''} uploaded successfully`,
        variant: 'success',
        duration: 3500,
      });
    }

    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!formData.amount) {
      errors.amount = 'Amount is required';
    } else if (!Number.isFinite(Number(formData.amount)) || Number(formData.amount) <= 0) {
      errors.amount = 'Enter a valid amount';
    }
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    if (!formData.date) {
      errors.date = 'Date is required';
    }
    if (!formData.time) {
      errors.time = 'Time is required';
    }

    // Enforce vehicle linkage for fleet-related categories
    if (isFleetRelatedCategory(formData.category) && !formData.asset_id) {
      errors.asset_id = `Vehicle linkage is required for ${getCategoryLabel(formData.category)} expenses. Please select a vehicle/asset.`;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast({
        title: 'Missing information',
        description: isFleetRelatedCategory(formData.category) && !formData.asset_id
          ? `Vehicle linkage is required for ${getCategoryLabel(formData.category)} expenses.`
          : 'Please review the highlighted fields before submitting.',
        variant: 'error',
      });
      return;
    }

    setValidationErrors({});
    setLoading(true);

    let gps_lat: number | undefined;
    let gps_lng: number | undefined;
    try {
      const pos = await getPosition();
      gps_lat = pos.coords.latitude;
      gps_lng = pos.coords.longitude;
    } catch (geoError) {
      console.warn('Geolocation capture skipped:', geoError);
    }

    const tsDate = new Date(`${formData.date}T${formData.time}:00`);
    const timestamp = Number.isNaN(tsDate.getTime()) ? new Date().toISOString() : tsDate.toISOString();

    const submitData = {
      amount: Number(formData.amount),
      category: formData.category,
      description: formData.description,
      payment_method: formData.payment_method,
      ts: timestamp,
      city: formData.location || undefined,
      gps_lat,
      gps_lng,
      notes: [formData.description, formData.notes].filter(Boolean).join(' | ') || undefined,
      project_id: formData.project_id || undefined,
      asset_id: formData.asset_id || undefined,
      template_id: formData.template_id || undefined,
      receipt_keys: formData.receipts.map((receipt) => receipt.key),
    };

    try {
      await apiClient.post('/v1/expenses', submitData);
      showToast({
        title: 'Expense submitted',
        description: 'Your expense has been sent for review.',
        variant: 'success',
      });
      navigate('/app/expenses');
    } catch (error) {
      console.error('Failed to create expense:', error);
      const serverErrors: Record<string, string> = {};
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as
          | { message?: string; detail?: string; errors?: Record<string, string[] | string> }
          | undefined;

        if (responseData?.errors) {
          Object.entries(responseData.errors).forEach(([field, value]) => {
            if (Array.isArray(value)) {
              serverErrors[field] = value.join(' ');
            } else if (value) {
              serverErrors[field] = String(value);
            }
          });
        }
        if (Object.keys(serverErrors).length > 0) {
          setValidationErrors(serverErrors);
        }
        showToast({
          title: 'Expense submission failed',
          description: responseData?.message || responseData?.detail || getErrorMessage(error),
          variant: 'error',
        });
      } else {
        showToast({
          title: 'Expense submission failed',
          description: getErrorMessage(error),
          variant: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const removeReceipt = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      receipts: prev.receipts.filter((receipt) => receipt.key !== key),
    }));
  };

  const applyTemplate = (template: typeof templates[number]) => {
    clearFieldError('template_id');
    clearFieldError('template');
    setFormData(prev => ({
      ...prev,
      category: template.category,
      amount: template.amount != null ? template.amount.toString() : prev.amount,
      description: template.description ?? prev.description,
      payment_method: (template.payment_method as any) ?? prev.payment_method,
      project_id: template.project_id,
      asset_id: template.asset_id,
      template_id: template.id,
    }));
    setShowTemplates(false);
  };

  const getCategoryLabel = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: spacing.xl,
      fontFamily: typography.body.fontFamily,
      backgroundColor: colors.neutral[50],
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: spacing.xl,
        padding: spacing.lg,
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div>
          <h1 style={{ 
            ...typography.header,
            fontSize: '28px',
            color: colors.neutral[900],
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            💰 Create Expense
          </h1>
          <p style={{ color: colors.neutral[600], marginTop: spacing.xs }}>
            Add a new expense with smart categorization and tracking
          </p>
        </div>
        
        <Button
          variant="secondary"
          onClick={() => navigate('/app/expenses')}
          icon="🚪"
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Templates Section */}
      {(templates.length > 0 || templatesState.status === 'loading' || !!templatesState.error) && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: spacing.lg,
          marginBottom: spacing.xl,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: spacing.md
          }}>
            <h3 style={{ 
              ...typography.subheader,
              margin: 0,
              color: colors.neutral[900]
            }}>
              📋 Quick Templates
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              {templatesState.status === 'loading' && (
                <span style={{ color: colors.neutral[600], fontSize: '14px' }}>Loading...</span>
              )}
              {templatesState.error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, color: colors.status.error, fontSize: '14px' }}>
                  <span>{templatesState.error}</span>
                  <button
                    type="button"
                    onClick={() => { void refreshTemplates(); }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: colors.primary,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}
              <Button
                variant="secondary"
                onClick={() => setShowTemplates(!showTemplates)}
                icon={showTemplates ? '👁️' : '👁️'}
              >
                {showTemplates ? 'Hide' : 'Show'} Templates
              </Button>
            </div>
          </div>

          {showTemplates && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: spacing.sm }}>
              {templates.length === 0 && !templatesState.error && (
                <div style={{
                  padding: spacing.md,
                  border: '1px dashed #D1D5DB',
                  borderRadius: '8px',
                  color: colors.neutral[600],
                  fontSize: '14px',
                }}>
                  No templates available yet.
                </div>
              )}

              {templates.map((template) => {
                const isSelected = formData.template_id === template.id;
                return (
                  <div
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    style={{
                      padding: spacing.sm,
                      border: isSelected ? `2px solid ${colors.primary}` : '1px solid #E5E7EB',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? '#EFF6FF' : '#F9FAFB',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{
                      ...typography.subheader,
                      fontSize: '14px',
                      marginBottom: spacing.xs,
                      color: colors.neutral[900]
                    }}>
                      {template.name}
                    </div>
                    {template.description && (
                      <div style={{
                        ...typography.bodySmall,
                        color: colors.neutral[600],
                        marginBottom: spacing.xs
                      }}>
                        {template.description}
                      </div>
                    )}
                    <div style={{
                      ...typography.bodySmall,
                      color: colors.primary,
                      fontWeight: 600
                    }}>
                      {template.amount != null ? `₹${template.amount.toLocaleString('en-IN')}` : 'Custom amount'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {getAnyFieldError('template_id', 'template') && (
            <div style={{ color: colors.status.error, fontSize: '12px', marginTop: spacing.xs }}>
              {getAnyFieldError('template_id', 'template')}
            </div>
          )}
        </div>
      )}

      {/* Expense Form */}
      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'grid', gap: spacing.lg }}>
          {/* Basic Information */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
            <div>
              <Label>Amount (₹) *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, amount: value }));
                  clearFieldError('amount');
                }}
                placeholder="Enter amount"
                style={{ marginTop: spacing.xs }}
              />
              {getFieldError('amount') && (
                <div style={{ color: colors.status.error, fontSize: '12px', marginTop: spacing.xs }}>
                  {getFieldError('amount')}
                </div>
              )}
            </div>

            <div>
              <Label>Category *</Label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const newCategory = e.target.value;
                  setFormData(prev => {
                    // Clear asset_id if switching from fleet-related to non-fleet category
                    const shouldClearAsset = isFleetRelatedCategory(prev.category) && !isFleetRelatedCategory(newCategory);
                    return { 
                      ...prev, 
                      category: newCategory,
                      asset_id: shouldClearAsset ? undefined : prev.asset_id,
                    };
                  });
                  clearFieldError('category');
                  clearFieldError('asset_id');
                }}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginTop: spacing.xs
                }}
              >
                {EXPENSE_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Description *</Label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                const value = e.target.value;
                setFormData(prev => ({ ...prev, description: value }));
                clearFieldError('description');
              }}
              placeholder="Describe the expense..."
              style={{
                width: '100%',
                padding: spacing.sm,
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                minHeight: '80px',
                resize: 'vertical',
                marginTop: spacing.xs
              }}
            />
            {getFieldError('description') && (
              <div style={{ color: colors.status.error, fontSize: '12px', marginTop: spacing.xs }}>
                {getFieldError('description')}
              </div>
            )}
          </div>

          {/* Date and Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, date: e.target.value }));
                  clearFieldError('date');
                }}
                style={{ marginTop: spacing.xs }}
              />
              {getFieldError('date') && (
                <div style={{ color: colors.status.error, fontSize: '12px', marginTop: spacing.xs }}>
                  {getFieldError('date')}
                </div>
              )}
            </div>

            <div>
              <Label>Time *</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, time: e.target.value }));
                  clearFieldError('time');
                }}
                style={{ marginTop: spacing.xs }}
              />
              {getFieldError('time') && (
                <div style={{ color: colors.status.error, fontSize: '12px', marginTop: spacing.xs }}>
                  {getFieldError('time')}
                </div>
              )}
            </div>
          </div>

          {/* Payment Method and Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
            <div>
              <Label>Payment Method *</Label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value as any }))}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginTop: spacing.xs
                }}
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Location</Label>
              <Input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter location (optional)"
                style={{ marginTop: spacing.xs }}
              />
            </div>
          </div>

          {/* Project and Asset Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
            <div>
              <Label>Project (Optional)</Label>
              <select
                value={formData.project_id || ''}
                onChange={(e) => {
                  const value = e.target.value || undefined;
                  setFormData(prev => ({ ...prev, project_id: value }));
                  clearFieldError('project_id');
                  clearFieldError('project');
                }}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginTop: spacing.xs
                }}
              >
                <option value="">Select Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({project.code})
                  </option>
                ))}
              </select>
              {projectsState.status === 'loading' && projects.length === 0 && (
                <div style={{ color: colors.neutral[600], fontSize: '12px', marginTop: spacing.xs }}>
                  Loading projects...
                </div>
              )}
              {projectsState.error && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  color: colors.status.error,
                  fontSize: '12px',
                  marginTop: spacing.xs,
                }}>
                  <span>{projectsState.error}</span>
                  <button
                    type="button"
                    onClick={() => { void refreshProjects(); }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: colors.primary,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}
              {getAnyFieldError('project_id', 'project') && (
                <div style={{ color: colors.status.error, fontSize: '12px', marginTop: spacing.xs }}>
                  {getAnyFieldError('project_id', 'project')}
                </div>
              )}
            </div>

            <div>
              <Label>
                Asset {isFleetRelatedCategory(formData.category) ? '*' : '(Optional)'}
                {isFleetRelatedCategory(formData.category) && (
                  <span style={{ color: colors.warning, fontSize: '12px', marginLeft: spacing.xs }}>
                    Required for {getCategoryLabel(formData.category)}
                  </span>
                )}
              </Label>
              <select
                value={formData.asset_id || ''}
                onChange={(e) => {
                  const value = e.target.value || undefined;
                  setFormData(prev => ({ ...prev, asset_id: value }));
                  clearFieldError('asset_id');
                  clearFieldError('asset');
                }}
                required={isFleetRelatedCategory(formData.category)}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${isFleetRelatedCategory(formData.category) && !formData.asset_id 
                    ? colors.error[500] 
                    : '#D1D5DB'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginTop: spacing.xs
                }}
              >
                <option value="">Select Asset</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} {asset.registration_number && `(${asset.registration_number})`}
                  </option>
                ))}
              </select>
              {assetsState.status === 'loading' && assets.length === 0 && (
                <div style={{ color: colors.neutral[600], fontSize: '12px', marginTop: spacing.xs }}>
                  Loading assets...
                </div>
              )}
              {assetsState.error && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  color: colors.status.error,
                  fontSize: '12px',
                  marginTop: spacing.xs,
                }}>
                  <span>{assetsState.error}</span>
                  <button
                    type="button"
                    onClick={() => { void refreshAssets(); }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: colors.primary,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}
              {getAnyFieldError('asset_id', 'asset') && (
                <div style={{ color: colors.status.error, fontSize: '12px', marginTop: spacing.xs }}>
                  {getAnyFieldError('asset_id', 'asset')}
                </div>
              )}
            </div>
          </div>

          {/* Receipt Upload */}
          <div>
            <Label>Receipt Photos</Label>
            <div style={{ marginTop: spacing.xs, display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
              <Button
                type="button"
                variant="secondary"
                icon="📷"
                onClick={() => cameraInputRef.current?.click()}
              >
                Take Photo
              </Button>
              <Button
                type="button"
                variant="secondary"
                icon="📁"
                onClick={() => galleryInputRef.current?.click()}
              >
                Upload from Gallery
              </Button>
            </div>

            {/* Hidden inputs for camera and gallery */}
            <input
              ref={cameraInputRef}
              type="file"
              multiple
              accept="image/*"
              capture="environment"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              style={{ display: 'none' }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              style={{ display: 'none' }}
            />

            {uploading && (
              <div style={{
                color: colors.primary,
                fontSize: '14px',
                marginTop: spacing.xs
              }}>
                Uploading files...
              </div>
            )}
            {formData.receipts.length > 0 && (
              <div style={{
                marginTop: spacing.sm,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.xs,
              }}>
                {formData.receipts.map((receipt) => (
                  <div
                    key={receipt.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: `${spacing.xs} ${spacing.sm}`,
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      backgroundColor: '#F9FAFB',
                      fontSize: '14px',
                      color: colors.neutral[700],
                    }}
                  >
                    <span>
                      {receipt.name}
                      {receipt.size != null && (
                        <span style={{ color: colors.neutral[500] }}>
                          {` • ${(receipt.size / 1024).toFixed(1)} KB`}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeReceipt(receipt.key)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: colors.status.error,
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            {getAnyFieldError('receipt_keys', 'receipts') && (
              <div style={{ color: colors.status.error, fontSize: '12px', marginTop: spacing.xs }}>
                {getAnyFieldError('receipt_keys', 'receipts')}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label>Additional Notes</Label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional information..."
              style={{
                width: '100%',
                padding: spacing.sm,
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                minHeight: '60px',
                resize: 'vertical',
                marginTop: spacing.xs
              }}
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/app/expenses')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon="💾"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Expense'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
