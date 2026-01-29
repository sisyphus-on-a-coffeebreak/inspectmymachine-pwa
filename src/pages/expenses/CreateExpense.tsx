import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient, normalizeError } from '../../lib/apiClient';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageContainer } from '../../components/ui/PageContainer';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useUploader } from '../../lib/upload';
import { useToast } from '../../providers/ToastProvider';
import { getErrorToast } from '../../lib/errorHandling';
import { useExpenseReferences } from '../../providers/ExpenseReferencesProvider';
import { useFloatBalance, useExpenses, useAdvances } from '../../lib/queries';
import { queryKeys } from '../../lib/queries';
import { useQueryClient } from '@tanstack/react-query';
import { Tooltip } from '../../components/ui/Tooltip';
import { Modal } from '../../components/ui/Modal';
import { OCRPanel } from '../../components/ui/OCRPanel';
import { useSmartKeyboard } from '../../hooks/useSmartKeyboard';
import { CompactGrid, DenseGrid } from '../../components/ui/ResponsiveGrid';
import { emitExpenseCreated } from '../../lib/workflow/eventEmitters';
import { updateVehicleCostOnExpense } from '../../lib/services/VehicleCostService';
import { MultiAssetAllocation, type AllocationMethod, type AssetAllocation } from '../../components/expenses/MultiAssetAllocation';
import { useAuth } from '../../providers/useAuth';
import { hasCapability } from '../../lib/users';

// 💰 Enhanced Expense Creation Form
// Smart form with auto-categorization, GPS location, receipt capture
// Asset and project linking, template support

// Define OCRFormData locally to avoid runtime import issues
interface OCRFormData {
  amount?: string;
  date?: string;
  description?: string;
  merchant?: string;
}

interface UploadedReceipt {
  key: string;
  name: string;
  size?: number;
  preview?: string; // Base64 preview URL
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
  // Multi-asset allocation
  useMultiAsset?: boolean;
  assetAllocations?: AssetAllocation[];
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
  // Enable smart keyboard handling for mobile
  useSmartKeyboard({ enabled: true, scrollOffset: 100 });
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { uploadImageWithProgress } = useUploader();
  const { showToast } = useToast();
  const { user } = useAuth();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  // Check if this is a resubmit
  const resubmitData = (location.state as any)?.resubmitFrom;
  const isResubmitMode = (location.state as any)?.mode === 'resubmit';
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: resubmitData?.amount?.toString() || '',
    category: resubmitData?.category || 'LOCAL_TRANSPORT',
    description: resubmitData?.description || '',
    payment_method: resubmitData?.payment_method || 'CASH',
    date: resubmitData?.date ? new Date(resubmitData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    time: resubmitData?.time || new Date().toTimeString().split(' ')[0].substring(0, 5),
    location: resubmitData?.location || '',
    receipts: [],
    notes: resubmitData?.notes || '',
    useMultiAsset: false,
    assetAllocations: [],
  });
  
  const [allocationMethod, setAllocationMethod] = useState<AllocationMethod>('equal');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  
  // Pre-fill form if resubmitting
  useEffect(() => {
    if (isResubmitMode && resubmitData) {
      setFormData({
        amount: resubmitData.amount?.toString() || '',
        category: resubmitData.category || 'LOCAL_TRANSPORT',
        description: resubmitData.description || '',
        payment_method: resubmitData.payment_method || 'CASH',
        date: resubmitData.date ? new Date(resubmitData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        time: resubmitData.time || new Date().toTimeString().split(' ')[0].substring(0, 5),
        location: resubmitData.location || '',
        receipts: [],
        notes: resubmitData.notes || ''
      });
    }
  }, [isResubmitMode, resubmitData]);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Templates are always visible now - no need for show/hide state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateExpenses, setDuplicateExpenses] = useState<any[]>([]);
  const [showOCRPanel, setShowOCRPanel] = useState(false);
  const [ocrImageFile, setOcrImageFile] = useState<File | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [ocrFields, setOCRFields] = useState<string[]>([]);
  const [ocrProcessing, setOCRProcessing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [draftData, setDraftData] = useState<ExpenseFormData | null>(null);
  
  // Fetch float balance (for display purposes - expenses can be created even if balance is insufficient)
  const { data: floatData } = useFloatBalance();
  
  // Fetch expenses for duplicate detection
  const { data: expensesData } = useExpenses({ mine: true });
  
  // Fetch advances for suggested linking - handle gracefully if endpoint doesn't exist
  const { data: advancesData, error: advancesError } = useAdvances({ status: 'open' });
  const openAdvances = advancesData?.data || (Array.isArray(advancesData) ? advancesData : []);

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

  // Real-time validation function
  const validateField = (field: string, value: any): string | undefined => {
    switch (field) {
      case 'amount':
        if (!value || value.trim() === '') {
          return 'Amount is required';
        }
        const amount = Number(value);
        if (isNaN(amount) || amount <= 0) {
          return 'Amount must be a positive number';
        }
        if (amount > 100000) {
          return 'Amount cannot exceed ₹1,00,000';
        }
        return undefined;
      
      case 'category':
        if (!value || value.trim() === '') {
          return 'Category is required';
        }
        return undefined;
      
      case 'description':
        if (!value || value.trim() === '') {
          return 'Description is required';
        }
        if (value.trim().length < 3) {
          return 'Description must be at least 3 characters';
        }
        if (value.length > 500) {
          return 'Description is too long (max 500 characters)';
        }
        return undefined;
      
      case 'date':
        if (!value) {
          return 'Date is required';
        }
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        if (selectedDate > today) {
          return 'Date cannot be in the future';
        }
        return undefined;
      
      case 'time':
        if (!value) {
          return 'Time is required';
        }
        return undefined;
      
      case 'asset_id':
        if (isFleetRelatedCategory(formData.category) && !value) {
          return 'Asset is required for fleet-related expenses';
        }
        return undefined;
      
      default:
        return undefined;
    }
  };

  // Validate all fields
  const validateAllFields = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    const amountError = validateField('amount', formData.amount);
    if (amountError) errors.amount = amountError;
    
    const categoryError = validateField('category', formData.category);
    if (categoryError) errors.category = categoryError;
    
    const descriptionError = validateField('description', formData.description);
    if (descriptionError) errors.description = descriptionError;
    
    const dateError = validateField('date', formData.date);
    if (dateError) errors.date = dateError;
    
    const timeError = validateField('time', formData.time);
    if (timeError) errors.time = timeError;
    
    const assetError = validateField('asset_id', formData.asset_id);
    if (assetError) errors.asset_id = assetError;
    
    return errors;
  };

  // Check if form is valid
  const isFormValid = (): boolean => {
    const errors = validateAllFields();
    return Object.keys(errors).length === 0;
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

  const handleFileUpload = async (files: FileList, enableOCR = false) => {
    setUploading(true);
    const newReceipts: UploadedReceipt[] = [];
    const firstFile = Array.from(files)[0];

    // Generate previews for all files first
    const previewPromises = Array.from(files).map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
    });

    const previews = await Promise.all(previewPromises);

    for (let i = 0; i < Array.from(files).length; i++) {
      const file = Array.from(files)[i];
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
        newReceipts.push({ 
          key: result.key, 
          name: file.name || 'receipt', 
          size: file.size,
          preview: previews[i] // Add preview
        });
      } catch (error) {
        showToast(getErrorToast(error, 'upload receipt'));
      }
    }

    if (newReceipts.length > 0) {
      setFormData((prev) => ({
        ...prev,
        receipts: [...prev.receipts, ...newReceipts],
      }));
      clearFieldError('receipts');
      clearFieldError('receipt_keys');
      
      // Enable OCR for first receipt if requested
      if (enableOCR && firstFile) {
        setOcrImageFile(firstFile);
        setShowOCRPanel(true);
      }
      
      showToast({
        title: 'Receipts ready',
        description: `${newReceipts.length} receipt${newReceipts.length > 1 ? 's' : ''} uploaded successfully`,
        variant: 'success',
        duration: 3500,
      });
    }

    setUploading(false);
  };

  // Handle OCR extraction - streamlined (2 steps: extract + apply)
  const handleOCRExtract = async (file: File) => {
    try {
      setOCRProcessing(true);
      
      // Upload and extract in one step
      const formDataForOCR = new FormData();
      formDataForOCR.append('receipt', file);
      
      try {
        const response = await apiClient.post('/v1/receipts/ocr', formDataForOCR, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        const extracted = response.data;
        
        // Immediately apply to form with visual indication
        const fieldsToHighlight: string[] = [];
        
        if (extracted.amount) {
          setFormData(prev => ({ ...prev, amount: extracted.amount.toString() }));
          fieldsToHighlight.push('amount');
          // Validate amount
          const error = validateField('amount', extracted.amount.toString());
          if (error) {
            setValidationErrors(prev => ({ ...prev, amount: error }));
          } else {
            clearFieldError('amount');
          }
        }
        
        if (extracted.description) {
          setFormData(prev => ({ ...prev, description: extracted.description }));
          fieldsToHighlight.push('description');
          // Validate description
          const error = validateField('description', extracted.description);
          if (error) {
            setValidationErrors(prev => ({ ...prev, description: error }));
          } else {
            clearFieldError('description');
          }
        }
        
        if (extracted.date) {
          setFormData(prev => ({ ...prev, date: extracted.date }));
          fieldsToHighlight.push('date');
          // Validate date
          const error = validateField('date', extracted.date);
          if (error) {
            setValidationErrors(prev => ({ ...prev, date: error }));
          } else {
            clearFieldError('date');
          }
        }
        
        setOCRFields(fieldsToHighlight);
        
        // Upload receipt and add to form with preview
        const uploadResult = await uploadImageWithProgress(file, 'expense-receipts');
        if (uploadResult.key) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const preview = e.target?.result as string;
            setFormData(prev => ({
              ...prev,
              receipts: [...prev.receipts, {
                key: uploadResult.key!,
                name: file.name || 'receipt',
                size: file.size,
                preview: preview
              }]
            }));
          };
          reader.readAsDataURL(file);
        }
        
        // Show success toast
        showToast({
          title: 'Receipt data extracted!',
          description: 'Review and edit if needed.',
          variant: 'success',
          duration: 8000,
        });
      } catch (ocrError) {
        // If OCR endpoint doesn't exist or fails, just upload the receipt
        const uploadResult = await uploadImageWithProgress(file, 'expense-receipts');
        if (uploadResult.key) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const preview = e.target?.result as string;
            setFormData(prev => ({
              ...prev,
              receipts: [...prev.receipts, {
                key: uploadResult.key!,
                name: file.name || 'receipt',
                size: file.size,
                preview: preview
              }]
            }));
          };
          reader.readAsDataURL(file);
        }
        showToast({
          title: 'Receipt uploaded',
          description: 'OCR extraction unavailable. Please enter details manually.',
          variant: 'info',
        });
      }
      
    } catch (error) {
      showToast({
        title: 'Upload failed',
        description: 'Please try again or enter details manually.',
        variant: 'error',
      });
    } finally {
      setOCRProcessing(false);
      setShowOCRPanel(false);
      setOcrImageFile(null);
    }
  };

  // Legacy OCR apply handler (for backward compatibility with OCRPanel)
  const handleOCRApply = (data: Partial<OCRFormData>) => {
    if (data.amount) {
      setFormData(prev => ({ ...prev, amount: data.amount! }));
    }
    if (data.date) {
      setFormData(prev => ({ ...prev, date: data.date! }));
    }
    if (data.description) {
      setFormData(prev => ({ ...prev, description: data.description! }));
    }
    showToast({
      title: 'Form Auto-filled',
      description: 'Receipt data has been applied to the form',
      variant: 'success',
    });
  };

  // Save draft to localStorage
  const saveDraft = () => {
    try {
      const draftKey = 'expense_draft';
      localStorage.setItem(draftKey, JSON.stringify(formData));
      setDraftSaved(true);
      showToast({
        title: 'Draft Saved',
        description: 'Your expense form has been saved as a draft',
        variant: 'success',
      });
      setTimeout(() => setDraftSaved(false), 3000);
    } catch (error) {
      showToast({
        title: 'Save Failed',
        description: 'Failed to save draft',
        variant: 'error',
      });
    }
  };

  // Load draft from localStorage
  const loadDraft = () => {
    try {
      const draftKey = 'expense_draft';
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        const parsed = JSON.parse(draft);
        setFormData(parsed);
        showToast({
          title: 'Draft Loaded',
          description: 'Your saved draft has been loaded',
          variant: 'success',
        });
      }
    } catch (error) {
      showToast({
        title: 'Load Failed',
        description: 'Failed to load draft',
        variant: 'error',
      });
    }
  };

  // Auto-save effect - save draft every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const hasData = formData.amount || formData.description;
      if (hasData && !isResubmitMode) {
        try {
          localStorage.setItem('expense_draft', JSON.stringify({
            ...formData,
            savedAt: new Date().toISOString()
          }));
          setLastSaved(new Date());
        } catch (error) {
          // Silently fail - don't interrupt user
        }
      }
    }, 10000); // 10 seconds
    return () => clearInterval(timer);
  }, [formData, isResubmitMode]);

  // Load draft on mount
  useEffect(() => {
    if (isResubmitMode) return; // Don't load draft if in resubmit mode
    
    try {
      const draft = localStorage.getItem('expense_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        setShowRestoreBanner(true);
        setDraftData(parsed as ExpenseFormData & { savedAt?: string });
      }
    } catch (error) {
      // Silently fail
    }
  }, [isResubmitMode]);

  // Handle restore draft
  const handleRestoreDraft = () => {
    if (draftData) {
      setFormData(draftData);
      setShowRestoreBanner(false);
      setDraftData(null);
      showToast({
        title: 'Draft Restored',
        description: 'Your unsaved draft has been loaded.',
        variant: 'success',
      });
    }
  };

  // Handle discard draft
  const handleDiscardDraft = () => {
    localStorage.removeItem('expense_draft');
    setShowRestoreBanner(false);
    setDraftData(null);
    showToast({
      title: 'Draft Discarded',
      description: 'The unsaved draft has been removed.',
      variant: 'info',
    });
  };

  // Suggested advance linking
  const suggestedAdvance = useMemo(() => {
    if (!formData.amount || openAdvances.length === 0) return null;
    
    const expenseAmount = Number(formData.amount);
    // Find advance with sufficient remaining balance
    const suitable = openAdvances.find((adv: any) => 
      adv.remaining >= expenseAmount && adv.status === 'open'
    );
    
    return suitable || null;
  }, [formData.amount, openAdvances]);

  // Check for duplicate expenses
  const checkDuplicates = (): any[] => {
    if (!expensesData?.data || !formData.amount || !formData.date) return [];
    
    const expenses = expensesData.data;
    const expenseDate = formData.date;
    const expenseAmount = Number(formData.amount);
    const expenseDescription = formData.description?.toLowerCase().trim() || '';
    
    return expenses.filter((e: any) => {
      // Check for same amount (within ₹1 tolerance)
      const amountMatch = Math.abs(e.amount - expenseAmount) < 1;
      
      // Check for same date
      const eDate = e.date ? new Date(e.date).toISOString().split('T')[0] : null;
      const dateMatch = expenseDate && eDate && expenseDate === eDate;
      
      // Check for similar description (same or very similar)
      const eDescription = e.description?.toLowerCase().trim() || '';
      const descriptionMatch = expenseDescription && eDescription && 
        (expenseDescription === eDescription || 
         expenseDescription.includes(eDescription) || 
         eDescription.includes(expenseDescription));
      
      // Consider it a duplicate if amount matches and (date matches OR description matches)
      return amountMatch && (dateMatch || descriptionMatch);
    });
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

    // Check for duplicates
    const duplicates = checkDuplicates();
    if (duplicates.length > 0) {
      setDuplicateExpenses(duplicates);
      setShowDuplicateModal(true);
      return;
    }

    // Allow expenses even if balance is insufficient - balance can go negative
    setValidationErrors({});
    await submitExpense();
  };

  const submitExpense = async () => {
    setLoading(true);

    const submitData = {
      amount: Number(formData.amount),
      category: formData.category,
      description: formData.description,
      payment_method: formData.payment_method,
      date: formData.date, // Backend expects 'date' field
      time: formData.time || undefined, // Backend expects 'time' field
      location: formData.location || undefined, // Backend expects 'location' not 'city'
      notes: [formData.description, formData.notes].filter(Boolean).join(' | ') || undefined,
      project_id: formData.project_id || undefined,
      asset_id: formData.useMultiAsset ? undefined : formData.asset_id || undefined, // Single asset
      template_id: formData.template_id || undefined,
      receipts: formData.receipts.length > 0 ? formData.receipts.map((receipt) => receipt.key) : undefined, // Backend expects 'receipts' array, not 'receipt_keys'
      // Multi-asset allocation
      asset_allocations: formData.useMultiAsset && formData.assetAllocations && formData.assetAllocations.length > 0
        ? formData.assetAllocations.map(a => ({ asset_id: a.assetId, amount: a.amount }))
        : undefined,
    };

    try {
      const response = await apiClient.post('/v1/expenses', submitData);
      const expenseId = response.data?.id || response.data?.data?.id || submitData.amount.toString();
      
      // Clear draft on successful submission
      localStorage.removeItem('expense_draft');
      setShowRestoreBanner(false);
      setDraftData(null);
      
      // Invalidate and refetch queries to refresh expense list and balance
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all, refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['float', 'balance'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['ledger', 'transactions'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['ledger', 'balance'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['ledger', 'reconciliation'], refetchType: 'active' }),
      ]);
      
      // Emit workflow event
      await emitExpenseCreated(
        expenseId,
        submitData.amount,
        submitData.category,
        user?.id?.toString() || '',
        user?.id?.toString()
      );

      // Log activity
      const { logActivity } = await import('../../lib/activityLogs');
      await logActivity({
        action: 'create',
        module: 'expense',
        resource_type: 'expense',
        resource_id: expenseId,
        resource_name: `Expense ${expenseId}`,
        details: {
          amount: submitData.amount,
          category: submitData.category,
          payment_method: submitData.payment_method,
        },
      });

      // Update vehicle cost if linked (Users with reports capability only)
      if (hasCapability(user, 'reports', 'read')) {
        if (submitData.asset_id) {
          // Single asset
          await updateVehicleCostOnExpense(
            submitData.amount.toString(), // Will be replaced with actual expense ID from response
            submitData.asset_id,
            submitData.amount,
            submitData.category
          );
        } else if (submitData.asset_allocations && submitData.asset_allocations.length > 0) {
          // Multi-asset - update each vehicle cost
          for (const allocation of submitData.asset_allocations) {
            await updateVehicleCostOnExpense(
              submitData.amount.toString(),
              allocation.asset_id,
              allocation.amount,
              submitData.category
            );
          }
        }
      }

      showToast({
        title: 'Expense submitted',
        description: 'Your expense has been sent for review.',
        variant: 'success',
      });
      navigate('/app/expenses/history');
    } catch (error) {
      const serverErrors: Record<string, string> = {};
      const apiError = normalizeError(error);
      
      if (apiError.data && typeof apiError.data === 'object') {
        const responseData = apiError.data as
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
  };

  const getCategoryLabel = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <PageContainer maxWidth="800px" style={{
      fontFamily: typography.body.fontFamily,
      backgroundColor: colors.neutral[50],
      minHeight: '100dvh', // Use dynamic viewport height for mobile
    }}>
      {/* Header */}
      <PageHeader
        title={isResubmitMode ? "Edit & Resubmit Expense" : "Create Expense"}
        subtitle={isResubmitMode ? "Make necessary changes and resubmit the rejected expense" : "Add a new expense with smart categorization and tracking"}
        icon="💰"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Expenses', path: '/app/expenses' },
          { label: isResubmitMode ? 'Resubmit' : 'Create' }
        ]}
      />

      {/* Resubmit Mode Banner */}
      {isResubmitMode && (
        <div style={{
          padding: spacing.md,
          backgroundColor: colors.status.warning + '15',
          border: `2px solid ${colors.status.warning}`,
          borderRadius: '12px',
          marginBottom: spacing.lg,
        }}>
          <div style={{ 
            ...typography.body, 
            color: colors.neutral[700],
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            <span>✏️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: spacing.xs }}>
                Editing rejected expense
              </div>
              <div style={{ fontSize: '14px' }}>
                Make necessary changes and resubmit.
                {resubmitData?.rejection_reason && (
                  <div style={{ marginTop: spacing.xs, fontStyle: 'italic' }}>
                    Previous rejection reason: "{resubmitData.rejection_reason}"
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Draft Banner */}
      {showRestoreBanner && draftData && (
        <div style={{
          padding: spacing.md,
          backgroundColor: colors.primary + '15',
          border: `2px solid ${colors.primary}`,
          borderRadius: '12px',
          marginBottom: spacing.lg,
        }}>
          <div style={{ 
            ...typography.body, 
            color: colors.neutral[700],
            marginBottom: spacing.sm
          }}>
            <div style={{ fontWeight: 600, marginBottom: spacing.xs }}>
              📝 Unsaved Draft Found
            </div>
            <div style={{ fontSize: '14px', color: colors.neutral[600] }}>
              Found unsaved draft from {draftData.savedAt ? new Date(draftData.savedAt).toLocaleString() : 'earlier'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button
              variant="primary"
              onClick={handleRestoreDraft}
              style={{ fontSize: '14px', padding: `${spacing.xs}px ${spacing.sm}px` }}
            >
              Restore Draft
            </Button>
            <Button
              variant="secondary"
              onClick={handleDiscardDraft}
              style={{ fontSize: '14px', padding: `${spacing.xs}px ${spacing.sm}px` }}
            >
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* Quick Templates Section - Always Visible */}
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
          </div>
        </div>

        {/* Templates always visible - no toggle */}
        <CompactGrid gap="sm">
          {templates.length === 0 && !templatesState.error && templatesState.status !== 'loading' && (
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
        </CompactGrid>

        {getAnyFieldError('template_id', 'template') && (
          <div style={{ color: colors.status.error, fontSize: '12px', marginTop: spacing.xs }}>
            {getAnyFieldError('template_id', 'template')}
          </div>
        )}
      </div>

      {/* Expense Form */}
      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        {/* Transaction Type Label */}
        <div style={{
          padding: spacing.md,
          backgroundColor: colors.status.error + '15',
          border: `2px solid ${colors.status.error}`,
          borderRadius: '8px',
          marginBottom: spacing.lg,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm
        }}>
          <span style={{ fontSize: '1.2rem' }}>📉</span>
          <div>
            <div style={{ ...typography.subheader, color: colors.status.error, fontWeight: 600 }}>
              Expense (Debit Transaction)
            </div>
            <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginTop: spacing.xs }}>
              This expense will reduce your advance balance
            </div>
          </div>
        </div>


        <div style={{ display: 'grid', gap: spacing.lg }}>
          {/* Section 1: Basic Information */}
          <div style={{
            padding: spacing.lg,
            backgroundColor: colors.neutral[50],
            borderRadius: '12px',
            border: `1px solid ${colors.neutral[200]}`
          }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.md, color: colors.neutral[900] }}>
              📋 Basic Information
            </h3>
            <div style={{ display: 'grid', gap: spacing.lg }}>
            <div 
              className="responsive-form-grid"
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr', // Single column on mobile
                gap: spacing.lg
              }}
            >
              <div>
                  <Label>
                    Amount (₹) *
                    <Tooltip content="Enter the expense amount. This will be deducted from your advance balance.">
                      <span style={{ marginLeft: spacing.xs, cursor: 'help', color: colors.neutral[500] }}>ℹ️</span>
                    </Tooltip>
                  </Label>
              <div style={{ position: 'relative' }}>
                <Input
                  type="number"
                  inputMode="decimal"
                  autoComplete="transaction-amount"
                  value={formData.amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ ...prev, amount: value }));
                    // Clear OCR highlight when user edits
                    if (ocrFields.includes('amount')) {
                      setOCRFields(prev => prev.filter(f => f !== 'amount'));
                    }
                    // Real-time validation
                    const error = validateField('amount', value);
                    if (error) {
                      setValidationErrors(prev => ({ ...prev, amount: error }));
                    } else {
                      clearFieldError('amount');
                    }
                  }}
                  onBlur={(e) => {
                    // Validate on blur as well
                    const error = validateField('amount', e.target.value);
                    if (error) {
                      setValidationErrors(prev => ({ ...prev, amount: error }));
                    } else {
                      clearFieldError('amount');
                    }
                  }}
                  placeholder="Enter amount"
                  style={{ 
                    marginTop: spacing.xs,
                    fontSize: '16px', // 16px prevents iOS zoom
                    borderColor: getFieldError('amount') ? colors.status.error : undefined,
                    backgroundColor: ocrFields.includes('amount') ? colors.status.warning + '20' : undefined
                  }}
                />
                {ocrFields.includes('amount') && (
                  <span style={{
                    position: 'absolute',
                    right: spacing.sm,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '11px',
                    color: colors.status.warning,
                    fontWeight: 600,
                    pointerEvents: 'none'
                  }}>
                    ✓ OCR extracted
                  </span>
                )}
              </div>
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
                    const newAssetId = shouldClearAsset ? undefined : prev.asset_id;
                    // Validate asset_id after category change
                    const assetError = validateField('asset_id', newAssetId);
                    if (assetError) {
                      setValidationErrors(prevErrors => ({ ...prevErrors, asset_id: assetError }));
                    } else {
                      clearFieldError('asset_id');
                    }
                    return { 
                      ...prev, 
                      category: newCategory,
                      asset_id: newAssetId,
                    };
                  });
                  clearFieldError('category');
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
              <div style={{ position: 'relative' }}>
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ ...prev, description: value }));
                    // Clear OCR highlight when user edits
                    if (ocrFields.includes('description')) {
                      setOCRFields(prev => prev.filter(f => f !== 'description'));
                    }
                    // Real-time validation
                    const error = validateField('description', value);
                    if (error) {
                      setValidationErrors(prev => ({ ...prev, description: error }));
                    } else {
                      clearFieldError('description');
                    }
                  }}
                  onBlur={(e) => {
                    // Validate on blur as well
                    const error = validateField('description', e.target.value);
                    if (error) {
                      setValidationErrors(prev => ({ ...prev, description: error }));
                    } else {
                      clearFieldError('description');
                    }
                  }}
                  placeholder="Describe the expense..."
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    paddingRight: ocrFields.includes('description') ? '100px' : spacing.sm,
                    border: `1px solid ${getFieldError('description') ? colors.status.error : '#D1D5DB'}`,
                    borderRadius: '8px',
                    fontSize: '16px', // 16px prevents iOS zoom
                    minHeight: '80px',
                    resize: 'vertical',
                    marginTop: spacing.xs,
                    backgroundColor: ocrFields.includes('description') ? colors.status.warning + '20' : undefined
                  }}
                />
                {ocrFields.includes('description') && (
                  <span style={{
                    position: 'absolute',
                    right: spacing.sm,
                    top: spacing.sm + 4,
                    fontSize: '11px',
                    color: colors.status.warning,
                    fontWeight: 600,
                    pointerEvents: 'none'
                  }}>
                    ✓ OCR extracted
                  </span>
                )}
              </div>
              {getFieldError('description') && (
                <div style={{ color: colors.status.error, fontSize: '12px', marginTop: spacing.xs }}>
                  {getFieldError('description')}
                </div>
              )}
            </div>
            </div>
          </div>

          {/* Date and Time */}
          <div 
            className="responsive-form-grid"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr', // Single column on mobile
              gap: spacing.lg
            }}
          >
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, date: e.target.value }));
                  // Real-time validation
                  const error = validateField('date', e.target.value);
                  if (error) {
                    setValidationErrors(prev => ({ ...prev, date: error }));
                  } else {
                    clearFieldError('date');
                  }
                }}
                onBlur={(e) => {
                  // Validate on blur as well
                  const error = validateField('date', e.target.value);
                  if (error) {
                    setValidationErrors(prev => ({ ...prev, date: error }));
                  } else {
                    clearFieldError('date');
                  }
                }}
                style={{ 
                  marginTop: spacing.xs,
                  fontSize: '16px', // 16px prevents iOS zoom
                  borderColor: getFieldError('date') ? colors.status.error : undefined
                }}
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
                  // Real-time validation
                  const error = validateField('time', e.target.value);
                  if (error) {
                    setValidationErrors(prev => ({ ...prev, time: error }));
                  } else {
                    clearFieldError('time');
                  }
                }}
                onBlur={(e) => {
                  // Validate on blur as well
                  const error = validateField('time', e.target.value);
                  if (error) {
                    setValidationErrors(prev => ({ ...prev, time: error }));
                  } else {
                    clearFieldError('time');
                  }
                }}
                style={{ 
                  marginTop: spacing.xs,
                  fontSize: '16px', // 16px prevents iOS zoom
                  borderColor: getFieldError('time') ? colors.status.error : undefined
                }}
              />
              {getFieldError('time') && (
                <div style={{ color: colors.status.error, fontSize: '12px', marginTop: spacing.xs }}>
                  {getFieldError('time')}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Payment & Location */}
          <div style={{
            padding: spacing.lg,
            backgroundColor: colors.neutral[50],
            borderRadius: '12px',
            border: `1px solid ${colors.neutral[200]}`
          }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.md, color: colors.neutral[900] }}>
              💳 Payment & Location
            </h3>
            <div style={{ display: 'grid', gap: spacing.lg }}>
              <div 
                className="responsive-form-grid"
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr', // Single column on mobile
                  gap: spacing.lg
                }}
              >
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
            </div>
          </div>

          {/* Suggested Advance Link */}
          {suggestedAdvance && (
            <div style={{
              padding: spacing.md,
              backgroundColor: colors.status.normal + '15',
              border: `2px solid ${colors.status.normal}`,
              borderRadius: '12px',
              marginBottom: spacing.lg,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ ...typography.subheader, color: colors.status.normal, marginBottom: spacing.xs }}>
                  💡 Suggested Linked Advance
                </div>
                <div style={{ ...typography.bodySmall, color: colors.neutral[700] }}>
                  You have an open advance: <strong>{suggestedAdvance.purpose}</strong> (₹{suggestedAdvance.remaining.toLocaleString('en-IN')} remaining)
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  showToast({
                    title: 'Advance Linked',
                    description: 'This expense will be linked to the suggested advance',
                    variant: 'info',
                  });
                }}
              >
                Link Advance
              </Button>
            </div>
          )}

          {/* Section 3: Project & Asset Linking */}
          <div style={{
            padding: spacing.lg,
            backgroundColor: colors.neutral[50],
            borderRadius: '12px',
            border: `1px solid ${colors.neutral[200]}`
          }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.md, color: colors.neutral[900] }}>
              🔗 Project & Asset Linking
            </h3>
            <div style={{ display: 'grid', gap: spacing.lg }}>
              <div 
                className="responsive-form-grid"
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr', // Single column on mobile
                  gap: spacing.lg
                }}
              >
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                <Label>
                  Asset {isFleetRelatedCategory(formData.category) ? '*' : '(Optional)'}
                  {isFleetRelatedCategory(formData.category) && (
                    <span style={{ color: colors.warning, fontSize: '12px', marginLeft: spacing.xs }}>
                      Required for {getCategoryLabel(formData.category)}
                    </span>
                  )}
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, useMultiAsset: !prev.useMultiAsset }));
                    if (!formData.useMultiAsset) {
                      // Switching to multi-asset - clear single asset
                      setFormData(prev => ({ ...prev, asset_id: undefined }));
                    } else {
                      // Switching to single asset - clear multi-asset
                      setSelectedAssetIds([]);
                      setFormData(prev => ({ ...prev, assetAllocations: [] }));
                    }
                  }}
                  style={{
                    padding: `${spacing.xs} ${spacing.sm}`,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: '6px',
                    background: formData.useMultiAsset ? colors.primary + '15' : 'white',
                    color: formData.useMultiAsset ? colors.primary : colors.neutral[700],
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {formData.useMultiAsset ? 'Single Asset' : 'Multiple Assets'}
                </button>
              </div>
              
              {!formData.useMultiAsset ? (
                <select
                  value={formData.asset_id || ''}
                  onChange={(e) => {
                    const value = e.target.value || undefined;
                    setFormData(prev => ({ ...prev, asset_id: value }));
                    // Real-time validation
                    const error = validateField('asset_id', value);
                    if (error) {
                      setValidationErrors(prev => ({ ...prev, asset_id: error }));
                    } else {
                      clearFieldError('asset_id');
                      clearFieldError('asset');
                    }
                  }}
                  onBlur={(e) => {
                    // Validate on blur as well
                    const error = validateField('asset_id', e.target.value || undefined);
                    if (error) {
                      setValidationErrors(prev => ({ ...prev, asset_id: error }));
                    } else {
                      clearFieldError('asset_id');
                      clearFieldError('asset');
                    }
                  }}
                  required={isFleetRelatedCategory(formData.category)}
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: `1px solid ${getFieldError('asset_id') || (isFleetRelatedCategory(formData.category) && !formData.asset_id)
                      ? colors.status.error 
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
              ) : (
                <MultiAssetAllocation
                  totalAmount={Number(formData.amount) || 0}
                  selectedAssetIds={selectedAssetIds}
                  allocations={formData.assetAllocations || []}
                  onAssetIdsChange={(ids) => {
                    setSelectedAssetIds(ids);
                    // Validate
                    if (isFleetRelatedCategory(formData.category) && ids.length === 0) {
                      setValidationErrors(prev => ({ ...prev, asset_id: 'At least one asset is required' }));
                    } else {
                      clearFieldError('asset_id');
                    }
                  }}
                  onAllocationsChange={(allocations) => {
                    setFormData(prev => ({ ...prev, assetAllocations: allocations }));
                  }}
                  allocationMethod={allocationMethod}
                  onAllocationMethodChange={setAllocationMethod}
                  error={getFieldError('asset_id')}
                />
              )}
              
              {assetsState.status === 'loading' && assets.length === 0 && !formData.useMultiAsset && (
                <div style={{ color: colors.neutral[600], fontSize: '12px', marginTop: spacing.xs }}>
                  Loading assets...
                </div>
              )}
              {assetsState.error && !formData.useMultiAsset && (
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
            </div>
          </div>

          {/* Section 4: Receipts & Documentation */}
          <div style={{
            padding: spacing.lg,
            backgroundColor: colors.neutral[50],
            borderRadius: '12px',
            border: `1px solid ${colors.neutral[200]}`
          }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.md, color: colors.neutral[900] }}>
              📄 Receipts & Documentation
            </h3>
            <div>
            <Label>Receipt Photos (Upload first for OCR extraction)</Label>
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
              <Button
                type="button"
                variant="secondary"
                icon="🔍"
                onClick={() => {
                  // Streamlined OCR - direct file selection and extraction
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      await handleOCRExtract(file);
                    }
                  };
                  input.click();
                }}
                disabled={ocrProcessing}
              >
                {ocrProcessing ? 'Extracting...' : 'Extract with OCR'}
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
            {/* Inline Receipt Thumbnails - Always visible, no separate preview step */}
            {formData.receipts.length > 0 && (
              <DenseGrid gap="sm" style={{ marginTop: spacing.sm }}>
                {formData.receipts.map((receipt, idx) => (
                  <div
                    key={receipt.key}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: `2px solid ${colors.neutral[200]}`,
                      backgroundColor: colors.neutral[50],
                    }}
                  >
                    {receipt.preview ? (
                      <img
                        src={receipt.preview}
                        alt={receipt.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: spacing.xs,
                        textAlign: 'center',
                      }}>
                        <span style={{ fontSize: '1.5rem', marginBottom: spacing.xs }}>📄</span>
                        <span style={{
                          fontSize: '10px',
                          color: colors.neutral[600],
                          wordBreak: 'break-word',
                        }}>
                          {receipt.name}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeReceipt(receipt.key)}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: colors.status.error,
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                      title="Remove receipt"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </DenseGrid>
            )}
            {getAnyFieldError('receipt_keys', 'receipts') && (
              <div style={{ color: colors.status.error, fontSize: '12px', marginTop: spacing.xs }}>
                {getAnyFieldError('receipt_keys', 'receipts')}
              </div>
            )}

            {/* OCR processing indicator */}
            {ocrProcessing && (
              <div style={{
                marginTop: spacing.sm,
                padding: spacing.md,
                backgroundColor: colors.primary + '15',
                border: `1px solid ${colors.primary}`,
                borderRadius: '8px',
                textAlign: 'center',
                color: colors.primary,
                fontWeight: 600
              }}>
                🔍 Extracting data from receipt...
              </div>
            )}
            </div>
          </div>

          {/* Section 5: Additional Notes */}
          <div style={{
            padding: spacing.lg,
            backgroundColor: colors.neutral[50],
            borderRadius: '12px',
            border: `1px solid ${colors.neutral[200]}`
          }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.md, color: colors.neutral[900] }}>
              📝 Additional Notes
            </h3>
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
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              type="button"
              variant="ghost"
              onClick={saveDraft}
              icon={draftSaved ? "✓" : "💾"}
              style={{ color: draftSaved ? colors.status.normal : colors.neutral[600] }}
            >
              {draftSaved ? 'Saved!' : 'Save Draft'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={loadDraft}
              icon="📂"
            >
              Load Draft
            </Button>
            {/* Auto-save indicator */}
            {lastSaved && (
              <div style={{ 
                fontSize: '12px', 
                color: colors.neutral[500],
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs
              }}>
                <span>💾</span>
                <span>Draft saved at {lastSaved.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: spacing.sm }}>
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
              disabled={loading || !isFormValid()}
              title={!isFormValid() ? 'Please fix validation errors before submitting' : ''}
            >
              {loading ? 'Creating...' : 'Create Expense'}
            </Button>
          </div>
        </div>
      </form>

      {/* Responsive grid styles */}
      <style>{`
        @media (min-width: 768px) {
          .responsive-form-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>

      {/* Duplicate Detection Modal */}
      {showDuplicateModal && duplicateExpenses.length > 0 && (
        <Modal
          title="⚠️ Potential Duplicate Expenses Detected"
          onClose={() => setShowDuplicateModal(false)}
          size="lg"
          footer={
            <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                onClick={() => setShowDuplicateModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  setShowDuplicateModal(false);
                  setValidationErrors({});
                  await submitExpense();
                }}
              >
                Submit Anyway
              </Button>
            </div>
          }
        >
          <div style={{ padding: spacing.md }}>
            <p style={{ ...typography.body, marginBottom: spacing.lg, color: colors.neutral[700] }}>
              We found {duplicateExpenses.length} similar expense{duplicateExpenses.length > 1 ? 's' : ''} that might be duplicates:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, maxHeight: '400px', overflowY: 'auto' }}>
              {duplicateExpenses.map((exp: any) => (
                <div
                  key={exp.id}
                  style={{
                    padding: spacing.md,
                    border: `1px solid ${colors.neutral[200]}`,
                    borderRadius: '8px',
                    backgroundColor: colors.neutral[50]
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ ...typography.subheader, marginBottom: spacing.xs }}>
                        Expense #{exp.id?.substring(0, 8)}
                      </div>
                      <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginBottom: spacing.xs }}>
                        {exp.description || 'No description'}
                      </div>
                      <div style={{ ...typography.bodySmall, color: colors.neutral[500] }}>
                        {exp.date ? new Date(exp.date).toLocaleDateString() : 'Unknown date'} • 
                        {exp.category ? ` ${exp.category}` : ''}
                      </div>
                    </div>
                    <div style={{ ...typography.subheader, color: colors.primary, fontWeight: 600 }}>
                      ₹{exp.amount?.toLocaleString('en-IN') || '0'}
                    </div>
                  </div>
                  <a
                    href={`/app/expenses/${exp.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-block',
                      marginTop: spacing.sm,
                      textDecoration: 'none'
                    }}
                  >
                    <Button
                      variant="secondary"
                      style={{ width: '100%' }}
                    >
                      View Expense ↗️
                    </Button>
                  </a>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: spacing.lg,
              padding: spacing.md,
              backgroundColor: colors.status.warning + '20',
              borderRadius: '8px',
              border: `1px solid ${colors.status.warning}`
            }}>
              <div style={{ ...typography.bodySmall, color: colors.neutral[700] }}>
                <strong>Please verify:</strong> Are these expenses different, or is this a duplicate submission?
                If this is a duplicate, please cancel and delete the previous expense instead.
              </div>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};
