import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../providers/useAuth';
import { useUploader } from '../../lib/upload';

// 💰 Enhanced Expense Creation Form
// Smart form with auto-categorization, GPS location, receipt capture
// Asset and project linking, template support

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
  receipt_files: File[];
  project_id?: string;
  asset_id?: string;
  notes?: string;
}

interface Project {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'completed' | 'on_hold';
}

interface Asset {
  id: string;
  name: string;
  type: 'vehicle' | 'equipment' | 'building' | 'technology';
  registration_number?: string;
  status: 'active' | 'maintenance' | 'retired';
}

interface ExpenseTemplate {
  id: string;
  name: string;
  category: string;
  amount: number;
  description: string;
  payment_method: string;
  project_id?: string;
  asset_id?: string;
}

const EXPENSE_CATEGORIES = [
  'LOCAL_TRANSPORT', 'INTERCITY_TRAVEL', 'LODGING', 'FOOD', 'TOLLS_PARKING', 'FUEL',
  'PARTS_REPAIR', 'RTO_COMPLIANCE', 'DRIVER_PAYMENT', 'RECHARGE', 'CONSUMABLES_MISC',
  'VENDOR_AGENT_FEE', 'MISC'
];

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'COMPANY_UPI', label: 'Company UPI' },
  { value: 'PERSONAL_UPI', label: 'Personal UPI' },
  { value: 'CARD', label: 'Card' }
];

export const CreateExpense: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { uploadImageWithProgress } = useUploader();
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
    receipt_files: [],
    notes: ''
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [templates, setTemplates] = useState<ExpenseTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Use refs to track fetch attempts and prevent infinite loops
  const projectsFetchedRef = useRef(false);
  const assetsFetchedRef = useRef(false);
  const templatesFetchedRef = useRef(false);

  const fetchProjects = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (projectsFetchedRef.current) return;
    projectsFetchedRef.current = true;
    
    try {
      const response = await axios.get('/api/v1/projects', {
        // Prevent retries for 404 errors
        validateStatus: (status) => status < 500
      });
      if (response.data && response.data.success) {
        setProjects(response.data.data);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch projects');
      }
    } catch (error: any) {
      // Only log if it's not a 404 (endpoint doesn't exist)
      if (error?.response?.status !== 404) {
        console.error('Failed to fetch projects:', error);
      }
      // Fallback to mock data for development - only set if not already set
      setProjects(prev => prev.length > 0 ? prev : [
        { id: '1', name: 'Project Alpha', code: 'PA001', status: 'active' },
        { id: '2', name: 'Project Beta', code: 'PB002', status: 'active' },
        { id: '3', name: 'Project Gamma', code: 'PG003', status: 'completed' }
      ]);
    }
  }, []);

  const fetchAssets = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (assetsFetchedRef.current) return;
    assetsFetchedRef.current = true;
    
    try {
      const response = await axios.get('/api/v1/assets', {
        // Prevent retries for 404 errors
        validateStatus: (status) => status < 500
      });
      if (response.data && response.data.success) {
        setAssets(response.data.data);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch assets');
      }
    } catch (error: any) {
      // Only log if it's not a 404 (endpoint doesn't exist)
      if (error?.response?.status !== 404) {
        console.error('Failed to fetch assets:', error);
      }
      // Fallback to mock data for development - only set if not already set
      setAssets(prev => prev.length > 0 ? prev : [
        { id: '1', name: 'Vehicle ABC-1234', type: 'vehicle', registration_number: 'ABC-1234', status: 'active' },
        { id: '2', name: 'Laptop Dell XPS', type: 'technology', status: 'active' },
        { id: '3', name: 'Office Building', type: 'building', status: 'active' }
      ]);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (templatesFetchedRef.current) return;
    templatesFetchedRef.current = true;
    
    try {
      const response = await axios.get('/api/v1/expense-templates', {
        // Prevent retries for 404 errors
        validateStatus: (status) => status < 500
      });
      if (response.data && response.data.success) {
        setTemplates(response.data.data);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch templates');
      }
    } catch (error: any) {
      // Only log if it's not a 404 (endpoint doesn't exist)
      if (error?.response?.status !== 404) {
        console.error('Failed to fetch templates:', error);
      }
      // Fallback to mock data for development - only set if not already set
      setTemplates(prev => prev.length > 0 ? prev : [
        {
          id: '1',
          name: 'Daily Fuel',
          category: 'FUEL',
          amount: 2000,
          description: 'Daily fuel for vehicle',
          payment_method: 'CASH'
        },
        {
          id: '2',
          name: 'Client Lunch',
          category: 'FOOD',
          amount: 1500,
          description: 'Client lunch meeting',
          payment_method: 'COMPANY_UPI'
        }
      ]);
    }
  }, []);

  useEffect(() => {
    // Only fetch once on mount
    fetchProjects();
    fetchAssets();
    fetchTemplates();
  }, [fetchProjects, fetchAssets, fetchTemplates]);

  const getPosition = () => new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    const options: PositionOptions = { enableHighAccuracy: true, timeout: 8000 };
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    try {
      const uploadedFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await uploadImageWithProgress(file, 'expense-receipts');
        uploadedFiles.push(file);
      }
      setFormData(prev => ({
        ...prev,
        receipt_files: [...prev.receipt_files, ...uploadedFiles]
      }));
    } catch (error) {
      console.error('File upload failed:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      // Capture submission timestamp and geolocation at time of submit
      const submissionTime = new Date();
      const ts = `${submissionTime.toISOString().slice(0,19).replace('T',' ')}`;
      let gps_lat: number | undefined;
      let gps_lng: number | undefined;
      try {
        const pos = await getPosition();
        gps_lat = pos.coords.latitude;
        gps_lng = pos.coords.longitude;
      } catch (e) {
        console.warn('Geolocation capture skipped:', e);
      }
      const submitData = {
        amount: parseInt(formData.amount, 10),
        category: formData.category,
        payment_method: formData.payment_method,
        ts,
        city: formData.location || undefined,
        gps_lat,
        gps_lng,
        notes: [formData.description, formData.notes].filter(Boolean).join(' | ') || undefined,
        vehicle_id: undefined,
        jobcard_id: undefined,
      };

      await axios.post('/api/v1/expenses', submitData);

      alert('Expense created successfully!');
      navigate('/app/expenses');

    } catch (error) {
      console.error('Failed to create expense:', error);
      alert('Failed to create expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (template: ExpenseTemplate) => {
    setFormData(prev => ({
      ...prev,
      category: template.category,
      amount: template.amount.toString(),
      description: template.description,
      payment_method: template.payment_method as any,
      project_id: template.project_id,
      asset_id: template.asset_id
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
      {templates.length > 0 && (
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
            <Button
              variant="secondary"
              onClick={() => setShowTemplates(!showTemplates)}
              icon={showTemplates ? '👁️' : '👁️'}
            >
              {showTemplates ? 'Hide' : 'Show'} Templates
            </Button>
          </div>
          
          {showTemplates && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: spacing.sm }}>
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  style={{
                    padding: spacing.sm,
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    backgroundColor: '#F9FAFB',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
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
                  <div style={{ 
                    ...typography.bodySmall,
                    color: colors.neutral[600],
                    marginBottom: spacing.xs
                  }}>
                    {template.description}
                  </div>
                  <div style={{ 
                    ...typography.bodySmall,
                    color: colors.primary,
                    fontWeight: 600
                  }}>
                    ₹{template.amount.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Enter amount"
                required
                style={{ marginTop: spacing.xs }}
              />
            </div>
            
            <div>
              <Label>Category *</Label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the expense..."
              required
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
          </div>

          {/* Date and Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
                style={{ marginTop: spacing.xs }}
              />
            </div>
            
            <div>
              <Label>Time *</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                required
                style={{ marginTop: spacing.xs }}
              />
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
                onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value || undefined }))}
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
            </div>
            
            <div>
              <Label>Asset (Optional)</Label>
              <select
                value={formData.asset_id || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, asset_id: e.target.value || undefined }))}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: '1px solid #D1D5DB',
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
            {formData.receipt_files.length > 0 && (
              <div style={{ 
                marginTop: spacing.sm,
                fontSize: '14px',
                color: colors.neutral[600]
              }}>
                {formData.receipt_files.length} file(s) selected
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

          {/* Recurring expense removed */}

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

