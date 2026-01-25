import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { colors, typography, spacing, borderRadius, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/ui/PageHeader';
import { NetworkError } from '../../components/ui/NetworkError';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../providers/ToastProvider';
import { addRecentlyViewed } from '../../lib/recentlyViewed';
import { RelatedItems } from '../../components/ui/RelatedItems';
import { AnomalyAlert } from '../../components/ui/AnomalyAlert';
import { PolicyLinks } from '../../components/ui/PolicyLinks';
import { ConflictResolutionModal } from '../../components/inspection/ConflictResolutionModal';
import { DraggableReportBuilder } from '../../components/inspection/DraggableReportBuilder';
import { RtoDetailsManager } from '../../components/inspection/RtoDetailsManager';
import { ImageDownloadManager } from '../../components/inspection/ImageDownloadManager';
import { fetchInspectionTemplate } from '../../lib/inspection-templates';
import { useInspections } from '../../lib/queries';
import { useAuth } from '../../providers/useAuth';
import { hasCapability } from '../../lib/users';
import { generateInspectionPDF } from '../../lib/inspection-pdf-generator';
import { logger } from '../../lib/logger';
import { ShareButton } from '../../components/ui/ShareButton';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { ActionMenu, type ActionMenuItem } from '../../components/ui/ActionMenu';
import { CompactGrid, CardGrid } from '../../components/ui/ResponsiveGrid';
import { CollapsibleSection } from '../../components/ui/CollapsibleSection';
import { MapPin, FileText, Download, Trash2, Settings } from 'lucide-react';

import { API_ORIGIN } from '../../lib/apiConfig';

const STORAGE_ORIGIN = API_ORIGIN;

type MediaType = 'image' | 'video';

interface AnswerMediaItem {
  id: string;
  url: string;
  type: MediaType;
  name: string;
  s3Key?: string; // S3 key for fetching signed URLs
}

const buildMediaUrl = (pathOrUrl?: string | null): string | null => {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith('http') || pathOrUrl.startsWith('data:')) {
    return pathOrUrl;
  }

  let normalized = pathOrUrl.trim();
  let storagePath = '';

  // Build storage path
  if (normalized.startsWith('/storage/')) {
    storagePath = normalized;
  } else if (normalized.startsWith('storage/')) {
    storagePath = `/${normalized}`;
  } else if (normalized.startsWith('/')) {
    storagePath = normalized;
  } else if (normalized.startsWith('inspections/')) {
    storagePath = `/storage/${normalized}`;
  } else {
    storagePath = `/storage/inspections/media/${normalized}`;
  }

  // In development, use relative path (Vite proxy handles it)
  // In production, use full URL
  if (import.meta.env.DEV) {
    return storagePath;
  } else {
    return `${STORAGE_ORIGIN}${storagePath}`;
  }
};

const guessMediaType = (value?: string): MediaType => {
  if (!value) return 'image';
  const normalized = value.toLowerCase();
  const videoExtensions = /\.(mp4|webm|mov|avi|mkv|ogg)$/i;
  if (
    normalized.startsWith('video/') ||
    videoExtensions.test(normalized)
  ) {
    return 'video';
  }
  return 'image';
};

const extractStringArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string' && item.length > 0)
      .map(item => item.trim().replace(/^["']|["']$/g, '')); // Remove surrounding quotes
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === 'string' && item.length > 0)
          .map(item => item.trim().replace(/^["']|["']$/g, '')); // Remove surrounding quotes
      }
      // If parsed value is a single string (not array), return it
      if (typeof parsed === 'string' && parsed.length > 0) {
        return [parsed.trim().replace(/^["']|["']$/g, '')];
      }
    } catch {
      // Not JSON – allow comma-separated or single filename
      // Also handle cases like ["filename.jpg"] as plain string
      const cleaned = value.trim();
      
      // Try to extract filename from array-like string: ["filename.jpg"]
      const arrayMatch = cleaned.match(/\["([^"]+)"\]|\['([^']+)'\]/);
      if (arrayMatch) {
        return [arrayMatch[1] || arrayMatch[2]];
      }
      
      if (cleaned.includes(',')) {
        return cleaned
          .split(',')
          .map((part) => part.trim().replace(/^["'\[\]]+|["'\[\]]+$/g, ''))
          .filter(Boolean);
      }
      if (cleaned.length > 0) {
        // Remove any JSON array brackets or quotes
        const final = cleaned.replace(/^["'\[\]]+|["'\[\]]+$/g, '').trim();
        return final ? [final] : [];
      }
    }
  }
  return [];
};

const getAnswerMediaItems = (answer: any): AnswerMediaItem[] => {
  const items: AnswerMediaItem[] = [];
  
  if (Array.isArray(answer?.answer_files) && answer.answer_files.length > 0) {
    answer.answer_files.forEach((file: any, index: number) => {
      const directUrl = file?.url;
      const storageKey = file?.key || file?.path;
      const localPath = file?.path;
      
      let url = '';
      if (directUrl && (directUrl.startsWith('http') || directUrl.startsWith('data:'))) {
        url = directUrl;
      } else if (localPath) {
        url = buildMediaUrl(localPath) || '';
      } else if (file?.name) {
        url = buildMediaUrl(file.name) || '';
      }
      
      if (!url && !storageKey) {
        console.warn('[InspectionDetails] Skipping file with no accessible path:', file);
        return;
      }
      
      items.push({
        id: `${answer.id || answer.question_id}-file-${index}`,
        url: url || '',
        type: guessMediaType(file?.type || file?.name || file?.path),
        name: file?.name || file?.path || `Media ${index + 1}`,
        s3Key: storageKey ? storageKey.trim().replace(/^\/+|\/+$/g, '') : undefined,
      });
    });
  }

  // If no items from answer_files, try to extract from answer_value
  // This handles cases where files were stored but answer_files wasn't populated
  if (items.length === 0) {
    const filenames = extractStringArray(answer?.answer_value);
    
    filenames.forEach((name: string, index: number) => {
      if (!name || typeof name !== 'string' || name.length === 0) {
        return;
      }
      
      // Clean the filename - remove any JSON array brackets or quotes
      const cleanName = name.trim().replace(/^\[|\]$/g, '').replace(/^["']|["']$/g, '').trim();
      
      if (!cleanName) {
        console.warn('[InspectionDetails] Empty filename after cleaning:', name);
        return;
      }
      
      // Check if it looks like a filename (has extension)
      const hasExtension = cleanName.match(/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|webm)$/i);
      if (!hasExtension) {
        console.warn('[InspectionDetails] Filename does not have valid extension:', cleanName);
        return;
      }
      
      // Build path - if it's just a filename (not already a full path), prepend inspections/media/
      let pathToUse = cleanName;
      if (!cleanName.startsWith('inspections/') && 
          !cleanName.startsWith('/storage/') && 
          !cleanName.startsWith('storage/') && 
          !cleanName.startsWith('http') &&
          !cleanName.startsWith('data:')) {
        pathToUse = `inspections/media/${cleanName}`;
      }
      
      // Build URL using the path
      let url = buildMediaUrl(pathToUse);
      
      // Fallback: if buildMediaUrl fails, construct manually
      if (!url) {
        if (import.meta.env.DEV) {
          url = `/storage/${pathToUse}`;
        } else {
          url = `${STORAGE_ORIGIN}/storage/${pathToUse}`;
        }
      }
      
      
      if (!url) {
        console.warn('[InspectionDetails] Could not build URL for filename:', cleanName);
        return;
      }
      
      items.push({
        id: `${answer.id || answer.question_id}-value-${index}`,
        url,
        type: guessMediaType(cleanName),
        name: cleanName,
        s3Key: pathToUse && !pathToUse.startsWith('http') && !pathToUse.startsWith('data:') ? pathToUse : undefined,
      });
    });
  }

  return items;
};

const formatAnswerValue = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return 'No answer provided';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

interface InspectionDetails {
  id: string;
  template_id: string;
  vehicle_id?: string;
  inspector_id: string;
  reviewer_id?: string;
  status: string;
  overall_rating?: number;
  pass_fail?: string;
  has_critical_issues: boolean;
  duration_minutes?: number;
  started_at?: string;
  completed_at?: string;
  reviewed_at?: string;
  inspector_notes?: string;
  reviewer_notes?: string;
  created_at: string;
  updated_at: string;
  template?: {
    id: string;
    name: string;
    description: string;
    sections: Array<{
      id: string;
      name: string;
      questions: Array<{
        id: string;
        question_text: string;
        question_type: string;
        is_required: boolean;
        is_critical: boolean;
      }>;
    }>;
  };
  vehicle?: {
    id: string;
    registration_number: string;
    make: string;
    model: string;
    year: number;
  };
  inspector?: {
    id: string;
    name: string;
    email: string;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
  answers: Array<{
    id: string;
    question_id: string;
    answer_value: any;
    answer_files?: any[];
    answer_metadata?: any;
    is_critical_finding: boolean;
    question?: {
      id: string;
      question_text: string;
      question_type: string;
      is_critical: boolean;
    };
  }>;
  rto_details?: {
    id: string;
    rc_number?: string;
    rc_issue_date?: string;
    rc_expiry_date?: string;
    rc_owner_name?: string;
    rc_owner_address?: string;
    fitness_certificate_number?: string;
    fitness_issue_date?: string;
    fitness_expiry_date?: string;
    fitness_status?: string;
    permit_number?: string;
    permit_issue_date?: string;
    permit_expiry_date?: string;
    permit_type?: string;
    insurance_policy_number?: string;
    insurance_company?: string;
    insurance_issue_date?: string;
    insurance_expiry_date?: string;
    insurance_type?: string;
    tax_certificate_number?: string;
    tax_paid_date?: string;
    tax_valid_until?: string;
    puc_certificate_number?: string;
    puc_issue_date?: string;
    puc_expiry_date?: string;
    puc_status?: string;
    show_rc_details?: boolean;
    show_fitness?: boolean;
    show_permit?: boolean;
    show_insurance?: boolean;
    show_tax?: boolean;
    show_puc?: boolean;
    [key: string]: any;
  };
}

export const InspectionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect legacy route /inspections/:id to /app/inspections/:id
  useEffect(() => {
    if (location.pathname.startsWith('/inspections/') && !location.pathname.startsWith('/app/inspections/')) {
      navigate(`/app/inspections/${id}`, { replace: true });
    }
  }, [location.pathname, id, navigate]);
  const { showToast } = useToast();
  const { user } = useAuth();
  const [inspection, setInspection] = useState<InspectionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const [resolvingConflict, setResolvingConflict] = useState(false);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showRtoManager, setShowRtoManager] = useState(false);
  const [signedUrlCache, setSignedUrlCache] = useState<Map<string, string>>(new Map());
  const [failedSignedUrls, setFailedSignedUrls] = useState<Set<string>>(new Set());

  // Get the actual URL for a media item (signed URL if available)
  // Always returns a full, absolute URL that works in new tabs
const getMediaUrl = useCallback((item: AnswerMediaItem): string => {
    // If signed URL failed before, use the local URL instead
    if (item.s3Key && failedSignedUrls.has(item.s3Key)) {
      // Fall through to use item.url
    } else if (item.s3Key && signedUrlCache.has(item.s3Key)) {
      // Use signed URL if available and not failed
      let cachedUrl = signedUrlCache.get(item.s3Key)!;
      
      // In development, convert absolute URLs to relative paths to use Vite proxy
      if (import.meta.env.DEV && cachedUrl.startsWith('http')) {
        try {
          const urlObj = new URL(cachedUrl);
          cachedUrl = urlObj.pathname; // Extract path (e.g., /storage/inspections/media/...)
        } catch (e) {
          // If URL parsing fails, use as-is
        }
      }
      
      return cachedUrl;
    }
    
    // Existing absolute or data URLs
    if (item.url && (item.url.startsWith('http://') || item.url.startsWith('https://') || item.url.startsWith('data:'))) {
      // In development, convert absolute URLs to relative paths
      if (import.meta.env.DEV && item.url.startsWith('http')) {
        try {
          const urlObj = new URL(item.url);
          return urlObj.pathname; // Extract path
        } catch (e) {
          // If URL parsing fails, use as-is
        }
      }
      return item.url;
    }
    
    // If we have a local URL, use it (prefer this over waiting for signed URL)
    if (item.url) {
      return item.url;
    }
    
    // If we have an S3/local key but the signed URL isn't ready yet, show placeholder
    if (item.s3Key && !failedSignedUrls.has(item.s3Key)) {
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23f3f4f6" width="200" height="150"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ELoading...%3C/text%3E%3C/svg%3E';
    }
    
    return '';
  }, [signedUrlCache, failedSignedUrls]);

  // Fetch signed URLs for S3 files
  useEffect(() => {
    const fetchSignedUrls = async () => {
      // Get all media items from all answers
      const allMediaItems: AnswerMediaItem[] = [];
      if (inspection?.answers) {
        inspection.answers.forEach((answer: any) => {
          allMediaItems.push(...getAnswerMediaItems(answer));
        });
      }

      const itemsNeedingSignedUrls = allMediaItems.filter(item => 
        item.s3Key && 
        !signedUrlCache.has(item.s3Key)
      );
      
      if (itemsNeedingSignedUrls.length === 0) return;

      const newCache = new Map(signedUrlCache);
      
      await Promise.all(
        itemsNeedingSignedUrls.map(async (item) => {
          if (!item.s3Key) return;
          
          try {
            const response = await apiClient.get<{ key: string; url: string; expires_at?: string }>(
              `/v1/files/signed?key=${encodeURIComponent(item.s3Key)}`
            );
            let urlToCache = response.data.url;
            
            // In development, convert absolute URLs to relative paths to use Vite proxy
            if (import.meta.env.DEV && urlToCache.startsWith('http')) {
              try {
                const urlObj = new URL(urlToCache);
                urlToCache = urlObj.pathname; // Extract path (e.g., /storage/inspections/media/...)
              } catch (e) {
                // If URL parsing fails, use as-is
              }
            }
            
            newCache.set(item.s3Key, urlToCache);
          } catch (error) {
            logger.error(`Failed to get signed URL for ${item.s3Key}`, error, 'InspectionDetails');
          }
        })
      );
      
      if (newCache.size > signedUrlCache.size) {
        setSignedUrlCache(newCache);
      }
    };

    if (inspection) {
      fetchSignedUrls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspection]);

  const renderAnswerContent = useCallback((answer: any) => {
    const mediaItems = getAnswerMediaItems(answer);

    // Check if answer_value contains filenames that should be displayed as media
    const answerValueStr = String(answer?.answer_value || '');
    const looksLikeFilenames = answerValueStr.match(/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|webm)/i);

    // If we have media items OR it looks like filenames, show media and don't show the answer_value text
    if (mediaItems.length > 0 || looksLikeFilenames) {
      // If we have media items, render them
      if (mediaItems.length > 0) {
        return (
          <CompactGrid gap="sm">
            {mediaItems.map((item) => (
              <div
                key={item.id}
                style={{
                  border: `1px solid ${colors.neutral[200]}`,
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: colors.neutral[50],
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '190px',
                }}
              >
                {item.type === 'video' ? (
                  <video
                    src={getMediaUrl(item)}
                    style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                    controls
                  />
                ) : (
                  <a
                    href={getMediaUrl(item)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', width: '100%', height: '140px', textDecoration: 'none' }}
                  >
                    <img
                      src={getMediaUrl(item)}
                      alt={item.name}
                      // In development, relative paths are same-origin via Vite proxy (no crossOrigin needed)
                      // In production, use crossOrigin for external URLs
                      crossOrigin={import.meta.env.DEV ? undefined : (getMediaUrl(item).startsWith('http') && !getMediaUrl(item).startsWith(window.location.origin) ? "anonymous" : undefined)}
                      style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        const currentUrl = img.src;
                        console.warn('[InspectionDetails] Image failed to load:', currentUrl, 'for item:', item);
                        
                        // If this was a signed URL that failed, mark it as failed and use local URL
                        if (item.s3Key && signedUrlCache.has(item.s3Key) && currentUrl === signedUrlCache.get(item.s3Key)) {
                          console.log('[InspectionDetails] Signed URL failed, marking as failed and using local URL');
                          setFailedSignedUrls(prev => new Set(prev).add(item.s3Key!));
                          // Use the local storage URL instead
                          if (item.url && item.url !== currentUrl) {
                            img.src = item.url;
                            return;
                          }
                        }
                        
                        // Try alternative URL formats
                        const alternatives: string[] = [];
                        
                        // First, try the local URL if we have one and it's different
                        if (item.url && item.url !== currentUrl) {
                          alternatives.push(item.url);
                        }
                        
                        // Try with s3Key directly (it may already be a full path)
                        if (item.s3Key) {
                          // Don't prepend inspections/media/ if s3Key already starts with it
                          const keyToUse = item.s3Key.startsWith('inspections/') 
                            ? item.s3Key 
                            : `inspections/media/${item.s3Key}`;
                          const builtUrl = buildMediaUrl(keyToUse);
                          if (builtUrl && builtUrl !== currentUrl) {
                            alternatives.push(builtUrl);
                          }
                        }
                        
                        // If current URL has /storage/, try without it
                        if (currentUrl.includes('/storage/')) {
                          const withoutStorage = currentUrl.replace('/storage/', '/');
                          if (withoutStorage !== currentUrl) {
                            alternatives.push(withoutStorage);
                          }
                        }
                        
                        // Try direct filename (only if it's just a filename, not a path)
                        if (item.name && item.name.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
                          // Only prepend if name doesn't already look like a path
                          if (!item.name.includes('/')) {
                            const builtUrl = buildMediaUrl(`inspections/media/${item.name}`);
                            if (builtUrl && builtUrl !== currentUrl) {
                              alternatives.push(builtUrl);
                            }
                          } else {
                            const builtUrl = buildMediaUrl(item.name);
                            if (builtUrl && builtUrl !== currentUrl) {
                              alternatives.push(builtUrl);
                            }
                          }
                        }
                        
                        // Try next alternative
                        for (const altUrl of alternatives) {
                          if (altUrl && altUrl !== currentUrl) {
                            console.log('[InspectionDetails] Trying alternative URL:', altUrl);
                            img.src = altUrl;
                            return;
                          }
                        }
                        
                        // If all alternatives fail, show placeholder
                        img.style.display = 'none';
                        const placeholder = document.createElement('div');
                        placeholder.style.cssText = 'width: 100%; height: 140px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 12px;';
                        placeholder.textContent = 'Image not found';
                        img.parentElement?.appendChild(placeholder);
                      }}
                    />
                  </a>
                )}
                <div
                  style={{
                    padding: spacing.xs,
                    fontSize: '12px',
                    color: colors.neutral[700],
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                  title={item.name}
                >
                  {item.name}
                </div>
              </div>
            ))}
          </CompactGrid>
        );
      }
      
      // If it looks like filenames but we have no media items, show a message instead of raw text
      return (
        <div style={{ color: colors.neutral[500], fontStyle: 'italic' }}>
          Media files detected but could not be loaded. Please check file paths.
        </div>
      );
    }
    
    const formattedValue = formatAnswerValue(answer?.answer_value);
    const isEmpty = formattedValue === 'No answer provided';
    const isMultiline = formattedValue.includes('\n');

    return (
      <div
        style={{
          color: isEmpty ? colors.neutral[500] : colors.neutral[700],
          fontStyle: isEmpty ? 'italic' : 'normal',
          whiteSpace: isMultiline ? 'pre-wrap' : 'normal',
        }}
      >
        {formattedValue}
      </div>
    );
  }, [getMediaUrl]);

  const [showImageDownload, setShowImageDownload] = useState(false);

  // Fetch related inspections for the same vehicle
  const { data: relatedInspectionsData } = useInspections(
    inspection?.vehicle_id ? { vehicle_id: inspection.vehicle_id, per_page: 5 } : undefined,
    { enabled: !!inspection?.vehicle_id }
  );
  
  const relatedInspections = relatedInspectionsData?.data?.filter(
    (insp: any) => insp.id !== id
  ) || [];

  const fetchInspectionDetails = useCallback(async () => {
    // Validate ID - must be present, not "0", not empty, and not the route placeholder
    // Inspection IDs are UUIDs, so they should be at least 36 characters (standard UUID format)
    // Basic UUID format check: contains hyphens and is 36 characters long
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // Check if ID is a simple number (like "0", "1", "2", etc.) - these are invalid
    const isNumericId = id && /^\d+$/.test(id) && id.length < 10;
    
    const isValidId = id && 
                     id !== '0' && 
                     id !== '' && 
                     id !== ':id' &&
                     !isNumericId && // Reject simple numeric IDs
                     (uuidPattern.test(id) || id.length > 20); // Allow UUIDs or IDs longer than 20 chars
    
    if (!isValidId) {
      let errorMessage: string;
      if (isNumericId) {
        errorMessage = `Invalid inspection ID: "${id}" appears to be a numeric ID. Inspection IDs must be UUIDs (e.g., "019a8f07-3aa1-705f-9589-e9044b54269b"). Please select an inspection from the dashboard.`;
      } else if (id === '0') {
        errorMessage = 'Invalid inspection ID: "0" is not a valid inspection identifier. Please select an inspection from the dashboard.';
      } else {
        errorMessage = `Invalid inspection ID: "${id}" is not a valid inspection identifier. Inspection IDs must be UUIDs.`;
      }
      
      setError(new Error(errorMessage));
      setLoading(false);
      // Redirect to inspections dashboard after a short delay for all invalid IDs
      setTimeout(() => {
        navigate('/app/inspections', { replace: true });
      }, 3000);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/v1/inspections/${id}`, {
        suppressErrorLog: false, // Log errors for valid-looking IDs
      });
      // Ensure ID is always a string
      let inspectionData = {
        ...response.data,
        id: String(response.data?.id || id),
      };
      
      // Inspection data loaded successfully
      
      // If template is not fully loaded, fetch it
      if (inspectionData.template_id && (!inspectionData.template || !inspectionData.template.sections)) {
        try {
          const templateData = await fetchInspectionTemplate(inspectionData.template_id, { forceRefresh: false });
          inspectionData = {
            ...inspectionData,
            template: templateData.template,
          };
        } catch (err) {
          logger.warn('Failed to fetch template for inspection', err, 'InspectionDetails');
        }
      }
      
      setInspection(inspectionData);
      
      // Check for template version conflict
      if (inspectionData.template_id && inspectionData.started_at) {
        try {
          const templateData = await fetchInspectionTemplate(inspectionData.template_id, { forceRefresh: true });
          const templateUpdatedAt = templateData.template.updated_at 
            ? new Date(templateData.template.updated_at) 
            : null;
          const startedAt = new Date(inspectionData.started_at);
          
          if (templateUpdatedAt && templateUpdatedAt > startedAt) {
            setCurrentTemplate(templateData.template);
            // Only show modal if inspection is still in progress
            if (inspectionData.status === 'draft' || inspectionData.status === 'in_progress') {
              setShowConflictModal(true);
            }
          }
        } catch (err) {
          // Silently fail - template fetch is not critical
          logger.warn('Failed to fetch current template for conflict detection', err, 'InspectionDetails');
        }
      }
      
      // Track in recently viewed
      if (response.data && id) {
        addRecentlyViewed({
          id: String(id),
          type: 'inspection',
          title: `Inspection #${id.substring(0, 8)}`,
          subtitle: response.data.template?.name || response.data.vehicle?.registration_number || 'Vehicle Inspection',
          path: `/app/inspections/${id}`,
        });
      }
    } catch (apiError) {
      // Backend not available - show error instead of mock data
      setError(apiError instanceof Error ? apiError : new Error('Failed to load inspection details'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInspectionDetails();
  }, [fetchInspectionDetails]);

  const generatePDF = async () => {
    if (!inspection || !id) return;
    
    try {
      setGeneratingPDF(true);
      await generateInspectionPDF(inspection, id);
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'error',
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.status.normal;
      case 'pending': return colors.status.warning;
      case 'rejected': return colors.status.critical;
      case 'approved': return colors.status.normal;
      default: return colors.neutral[400];
    }
  };

  const getPassFailColor = (passFail: string) => {
    switch (passFail) {
      case 'pass': return colors.status.normal;
      case 'fail': return colors.status.critical;
      case 'conditional': return colors.status.warning;
      default: return colors.neutral[400];
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.xl }}>
        <SkeletonLoader variant="page" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.sm }}>
        <NetworkError
          error={error}
          onRetry={fetchInspectionDetails}
          onGoBack={() => navigate('/app/inspections')}
        />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.sm }}>
        <EmptyState
          icon="🔍"
          title="Inspection Not Found"
          description="The requested inspection could not be found."
          action={{
            label: "Back to Inspections",
            onClick: () => navigate('/app/inspections'),
            icon: "⬅️"
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: spacing.xl,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: colors.neutral[50],
      minHeight: '100vh'
    }}>
      {/* Header */}
      <PageHeader
        title={`Inspection #${String(inspection.id || '').substring(0, 8)}`}
        subtitle={inspection.template?.name || 'Vehicle Inspection Report'}
        icon="🔍"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Inspections', path: '/app/inspections' },
          { label: 'Details' }
        ]}
        actions={
          <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
            {/* Primary Actions - Always Visible */}
            <Button
              variant="primary"
              onClick={generatePDF}
              disabled={generatingPDF}
              icon="📄"
            >
              {generatingPDF ? 'Generating...' : 'PDF'}
            </Button>
            <ShareButton
              title={`Inspection Report: ${inspection.vehicle?.registration_number || inspection.id}`}
              text={`Inspection report for ${inspection.vehicle?.registration_number || 'vehicle'}`}
              url={`${window.location.origin}/app/inspections/${inspection.id}`}
              variant="secondary"
            >
              Share
            </ShareButton>
            
            {/* Secondary Actions - In Menu */}
            <ActionMenu
              items={[
                {
                  id: 'customize',
                  label: 'Customize Report',
                  icon: <Settings size={16} />,
                  onClick: () => setShowReportBuilder(true),
                },
                {
                  id: 'download-media',
                  label: 'Download All Media',
                  icon: <Download size={16} />,
                  onClick: () => setShowImageDownload(true),
                },
                {
                  id: 'rto',
                  label: 'Add RTO Details',
                  icon: <FileText size={16} />,
                  onClick: () => setShowRtoManager(true),
                  hidden: !hasCapability(user, 'inspection', 'approve'),
                },
                {
                  id: 'related',
                  label: 'View Related',
                  icon: <MapPin size={16} />,
                  onClick: () => {
                    // Scroll to related items section
                    const relatedSection = document.getElementById('related-items-section');
                    relatedSection?.scrollIntoView({ behavior: 'smooth' });
                  },
                },
                // Divider before destructive
                {
                  id: 'delete',
                  label: 'Delete Inspection',
                  icon: <Trash2 size={16} />,
                  onClick: () => {
                    // TODO: Implement delete confirmation
                    showToast({
                      title: 'Delete Inspection',
                      description: 'Delete functionality coming soon',
                      variant: 'info',
                    });
                  },
                  variant: 'destructive',
                  hidden: !hasCapability(user, 'inspection', 'delete'),
                },
              ]}
            />
          </div>
        }
      />

      {/* Policy Links */}
      <PolicyLinks
        title="Inspection Standards & Compliance"
        links={[
          {
            label: 'Inspection Standards',
            url: '/policies/inspection-standards',
            external: false,
            icon: '📐'
          },
          {
            label: 'Critical Issue Definitions',
            url: '/policies/critical-issues',
            external: false,
            icon: '⚠️'
          },
          {
            label: 'Regulatory Compliance',
            url: '/policies/regulatory-compliance',
            external: false,
            icon: '⚖️'
          }
        ]}
        variant="compact"
      />

      {/* Anomaly Alerts */}
      {inspection && (() => {
        const now = new Date();
        const anomalies = [];

        // Check for inspection overdue > 30 days
        if (inspection.started_at && !inspection.completed_at) {
          const startedAt = new Date(inspection.started_at);
          const daysSinceStart = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceStart > 30) {
            anomalies.push({
              title: 'Inspection Overdue > 30 Days',
              description: `This inspection was started ${Math.floor(daysSinceStart)} days ago and is still incomplete. Please complete or cancel it.`,
              severity: 'error' as const,
            });
          }
        }

        // Check for critical issues found
        if (inspection.has_critical_issues) {
          const criticalCount = inspection.answers?.filter((a: any) => a.is_critical_finding).length || 0;
          anomalies.push({
            title: 'Critical Issues Found',
            description: `This inspection has ${criticalCount} critical finding${criticalCount > 1 ? 's' : ''}. Immediate action may be required.`,
            severity: 'critical' as const,
          });
        }

        // Check for template updated mid-inspection
        if (inspection.template && inspection.started_at && inspection.template.updated_at) {
          const startedAt = new Date(inspection.started_at);
          const templateUpdatedAt = new Date(inspection.template.updated_at);
          if (templateUpdatedAt > startedAt) {
            anomalies.push({
              title: 'Template Updated During Inspection',
              description: 'The inspection template was updated after this inspection was started. Some questions may have changed.',
              severity: 'warning' as const,
            });
          }
        }

        return anomalies.length > 0 ? (
          <div style={{ marginTop: spacing.lg }}>
            {anomalies.map((anomaly, index) => (
              <AnomalyAlert
                key={`anomaly-${anomaly.title || anomaly.id || index}`}
                title={anomaly.title}
                description={anomaly.description}
                severity={anomaly.severity}
                dismissible={false}
              />
            ))}
          </div>
        ) : null;
      })()}

      {/* Summary Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.xl,
        marginBottom: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg }}>
          <div>
            <h3 style={{ 
              ...typography.header,
              fontSize: '20px',
              marginBottom: spacing.xs,
              color: colors.neutral[900]
            }}>
              {inspection.template?.name || 'Inspection Report'}
            </h3>
            <p style={{ ...typography.body, color: colors.neutral[600], marginBottom: spacing.sm }}>
              {inspection.vehicle?.registration_number || 'N/A'} • {inspection.vehicle?.make || ''} {inspection.vehicle?.model || ''}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                Rating: <strong style={{ color: colors.primary }}>{inspection.overall_rating || 'N/A'}/10</strong>
              </div>
              <span style={{ color: colors.neutral[400] }}>•</span>
              <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                Inspector: {inspection.inspector?.name || 'Unknown'} • {inspection.completed_at ? new Date(inspection.completed_at).toLocaleDateString('en-IN') : 'N/A'}
              </div>
            </div>
          </div>
          
          {/* Primary Actions in Summary */}
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button
              variant="primary"
              onClick={generatePDF}
              disabled={generatingPDF}
              icon="📄"
              size="sm"
            >
              {generatingPDF ? 'Generating...' : 'Download PDF'}
            </Button>
            <ShareButton
              title={`Inspection Report: ${inspection.vehicle?.registration_number || inspection.id}`}
              text={`Inspection report for ${inspection.vehicle?.registration_number || 'vehicle'}`}
              url={`${window.location.origin}/app/inspections/${inspection.id}`}
              variant="secondary"
            >
              Share
            </ShareButton>
          </div>
        </div>
        
        <CardGrid gap="lg">
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Vehicle Information
            </div>
            <div style={{ ...typography.body, color: colors.neutral[900] }}>
              {inspection.vehicle ? 
                `${inspection.vehicle.make} ${inspection.vehicle.model} (${inspection.vehicle.registration_number})` :
                'No vehicle information available'
              }
            </div>
          </div>
          
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Inspector
            </div>
            <div style={{ ...typography.body, color: colors.neutral[900] }}>
              {inspection.inspector?.name || 'Unknown Inspector'}
            </div>
          </div>
          
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Overall Rating
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '24px',
              color: colors.primary,
              fontWeight: 700
            }}>
              {inspection.overall_rating ? `${inspection.overall_rating}/10` : 'N/A'}
            </div>
          </div>
          
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Result
            </div>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <span style={{
                padding: '6px 16px',
                backgroundColor: getStatusColor(inspection.status),
                color: 'white',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 600,
                textTransform: 'capitalize'
              }}>
                {inspection.status}
              </span>
              {inspection.pass_fail && (
                <span style={{
                  padding: '6px 16px',
                  backgroundColor: getPassFailColor(inspection.pass_fail),
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}>
                  {inspection.pass_fail}
                </span>
              )}
            </div>
          </div>
        </CardGrid>
        
        {inspection.has_critical_issues && (
          <div style={{
            marginTop: spacing.lg,
            padding: spacing.md,
            backgroundColor: colors.status.critical + '20',
            border: `1px solid ${colors.status.critical}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div style={{ ...typography.label, color: colors.status.critical }}>
              Critical Issues Found
            </div>
          </div>
        )}
      </div>

      {/* Inspection Details */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ 
          ...typography.subheader,
          marginBottom: spacing.lg,
          color: colors.neutral[900]
        }}>
          📋 Inspection Details
        </h3>
        
        {inspection.template?.sections && inspection.template.sections.length > 0 ? (
          inspection.template.sections.map((section, sectionIndex) => {
            // Count answered questions and photos in this section
            const sectionQuestions = section.questions || [];
            const answeredCount = sectionQuestions.filter((q: any) => {
              const answer = inspection.answers?.find((a: any) => a.question_id === q.id);
              return answer && answer.answer_value !== null && answer.answer_value !== undefined && answer.answer_value !== '';
            }).length;
            
            const photoCount = sectionQuestions.reduce((count: number, q: any) => {
              const answer = inspection.answers?.find((a: any) => a.question_id === q.id);
              const mediaItems = getAnswerMediaItems(answer);
              return count + mediaItems.filter((item: AnswerMediaItem) => item.type === 'image').length;
            }, 0);
            
            const subtitle = `${answeredCount}/${sectionQuestions.length} answered${photoCount > 0 ? ` • ${photoCount} photo${photoCount !== 1 ? 's' : ''}` : ''}`;
            
            return (
              <CollapsibleSection
                key={section.id}
                id={`inspection-section-${section.id}`}
                title={section.name}
                badge={subtitle}
                defaultExpanded={sectionIndex === 0} // First section expanded by default
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                  {sectionQuestions.map((question: any) => {
                    const answer = inspection.answers?.find((a: any) => a.question_id === question.id);
                    const mediaItems = getAnswerMediaItems(answer);
                    const hasPhotos = mediaItems.filter((item: AnswerMediaItem) => item.type === 'image').length > 0;
                    
                    return (
                      <div key={question.id} style={{
                        padding: spacing.lg,
                        border: `1px solid ${question.is_critical ? colors.status.critical : colors.neutral[200]}`,
                        borderRadius: '12px',
                        backgroundColor: question.is_critical ? colors.status.critical + '10' : colors.neutral[50]
                      }}>
                        <div style={{ 
                          ...typography.subheader,
                          fontSize: '16px',
                          color: colors.neutral[900],
                          marginBottom: spacing.sm,
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.sm
                        }}>
                          {question.question_text}
                          {question.is_critical && (
                            <span style={{
                              padding: '2px 8px',
                              backgroundColor: colors.status.critical,
                              color: 'white',
                              borderRadius: '12px',
                              fontSize: '10px',
                              fontWeight: 600
                            }}>
                              CRITICAL
                            </span>
                          )}
                        </div>
                        
                        <div style={{ 
                          ...typography.body,
                          color: colors.neutral[700],
                          padding: spacing.sm,
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB',
                          marginBottom: hasPhotos ? spacing.md : 0,
                        }}>
                          {answer ? (
                            <div>
                              {renderAnswerContent(answer)}
                              {answer.is_critical_finding && (
                                <div style={{
                                  color: colors.status.critical,
                                  fontWeight: 600,
                                  fontSize: '14px',
                                  marginTop: spacing.xs,
                                }}>
                                  ⚠️ Critical Finding
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ color: colors.neutral[500], fontStyle: 'italic' }}>
                              No answer provided
                            </div>
                          )}
                        </div>
                        
                        {/* Inline Media Gallery */}
                        {hasPhotos && (
                          <div style={{ marginTop: spacing.md }}>
                            <div style={{ 
                              ...typography.label, 
                              fontSize: '12px', 
                              color: colors.neutral[600],
                              marginBottom: spacing.xs 
                            }}>
                              Photos:
                            </div>
                            <div style={{ 
                              display: 'flex', 
                              gap: spacing.sm, 
                              flexWrap: 'wrap',
                              marginTop: spacing.xs,
                            }}>
                              {mediaItems
                                .filter((item: AnswerMediaItem) => item.type === 'image')
                                .slice(0, 6)
                                .map((item: AnswerMediaItem, idx: number) => (
                                  <img
                                    key={idx}
                                    src={item.url}
                                    alt={`Photo ${idx + 1}`}
                                    style={{
                                      width: '80px',
                                      height: '80px',
                                      objectFit: 'cover',
                                      borderRadius: borderRadius.md,
                                      cursor: 'pointer',
                                      border: `1px solid ${colors.neutral[200]}`,
                                    }}
                                    onClick={() => {
                                      // Open in new tab for now (can add lightbox later)
                                      window.open(item.url, '_blank');
                                    }}
                                  />
                                ))}
                              {mediaItems.filter((item: AnswerMediaItem) => item.type === 'image').length > 6 && (
                                <div
                                  style={{
                                    width: '80px',
                                    height: '80px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: colors.neutral[100],
                                    borderRadius: borderRadius.md,
                                    border: `1px solid ${colors.neutral[200]}`,
                                    ...typography.bodySmall,
                                    color: colors.neutral[600],
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => setShowImageDownload(true)}
                                >
                                  +{mediaItems.filter((item: AnswerMediaItem) => item.type === 'image').length - 6}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {sectionQuestions.length === 0 && (
                    <div style={{ ...typography.bodySmall, color: colors.neutral[500], fontStyle: 'italic' }}>
                      No questions in this section
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            );
          })
        ) : inspection.answers && inspection.answers.length > 0 ? (
          // Fallback: Show answers even if template sections are missing
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {inspection.answers.map((answer: any) => (
              <div key={answer.id || answer.question_id} style={{
                padding: spacing.lg,
                border: `1px solid ${answer.is_critical_finding ? colors.status.critical : colors.neutral[200]}`,
                borderRadius: '12px',
                backgroundColor: answer.is_critical_finding ? colors.status.critical + '10' : colors.neutral[50]
              }}>
                <div style={{ 
                  ...typography.subheader,
                  fontSize: '16px',
                  color: colors.neutral[900],
                  marginBottom: spacing.sm
                }}>
                  {answer.question?.question_text || `Question ${answer.question_id}`}
                </div>
                <div style={{ 
                  ...typography.body,
                  color: colors.neutral[700],
                  padding: spacing.sm,
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB'
                }}>
                  {renderAnswerContent(answer)}
                  {answer.is_critical_finding && (
                    <div style={{
                      color: colors.status.critical,
                      fontWeight: 600,
                      fontSize: '14px',
                      marginTop: spacing.xs
                    }}>
                      ⚠️ Critical Finding
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: spacing.xl }}>
            <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📋</div>
            <div style={{ ...typography.body, color: colors.neutral[600] }}>
              No inspection details available. Template or answers not loaded.
            </div>
          </div>
        )}
        
        {inspection.inspector_notes && (
          <div style={{ marginTop: spacing.xl }}>
            <h4 style={{ 
              ...typography.subheader,
              fontSize: '18px',
              color: colors.neutral[900],
              marginBottom: spacing.md
            }}>
              📝 Inspector Notes
            </h4>
            <div style={{
              padding: spacing.lg,
              backgroundColor: colors.neutral[50],
              borderRadius: '12px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ ...typography.body, color: colors.neutral[700] }}>
                {inspection.inspector_notes}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Linked Gate Pass */}
      {inspection.linked_gate_pass && (
        <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
          <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>Auto-created Gate Pass</h3>
          <div style={{ ...typography.body, color: colors.neutral[600], marginBottom: spacing.md }}>
            A vehicle exit pass was automatically created for this inspection:
          </div>
          <div style={{
            padding: spacing.md,
            border: `1px solid ${colors.neutral[200]}`,
            borderRadius: borderRadius.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ ...typography.body, fontWeight: 600 }}>
                Gate Pass #{inspection.linked_gate_pass.pass_number}
              </div>
              <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                Purpose: {inspection.linked_gate_pass.purpose} • Status: {inspection.linked_gate_pass.status}
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate(`/app/gate-pass/${inspection.linked_gate_pass.id}`)}
              style={{ padding: `${spacing.xs}px ${spacing.sm}px` }}
            >
              View
            </Button>
          </div>
        </div>
      )}

      {/* Linked Components */}
      {inspection.linked_components && inspection.linked_components.length > 0 && (
        <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
          <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>Linked Components</h3>
          <div style={{ ...typography.body, color: colors.neutral[600], marginBottom: spacing.md }}>
            The following components were linked to this inspection based on inspection findings:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {inspection.linked_components.map((component: any) => {
              const typeLabels: Record<string, string> = {
                battery: 'Battery',
                tyre: 'Tyre',
                spare_part: 'Spare Part',
              };
              
              return (
                <div
                  key={`${component.component_type}-${component.component_id}`}
                  style={{
                    padding: spacing.md,
                    border: `1px solid ${colors.neutral[200]}`,
                    borderRadius: borderRadius.md,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ ...typography.body, fontWeight: 600 }}>{component.component_name}</div>
                    <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                      {typeLabels[component.component_type] || 'Component'}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/app/stockyard/components/${component.component_type}/${component.component_id}`)}
                    style={{ padding: `${spacing.xs}px ${spacing.sm}px` }}
                  >
                    View
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Related Items */}
      {inspection.vehicle_id && (
        <CardGrid id="related-items-section" gap="lg" style={{ marginTop: spacing.lg }}>
          {/* Related Inspections Panel */}
          {relatedInspections.length > 0 && (
            <RelatedItems
              title="Related Inspections"
              items={relatedInspections.slice(0, 5).map((insp: any) => ({
                id: insp.id,
                title: `Inspection #${String(insp.id || '').substring(0, 8)}`,
                subtitle: `${insp.template?.name || 'Inspection'} - ${insp.status || 'Unknown'}`,
                path: `/app/inspections/${insp.id}`,
                icon: '🔍',
                type: insp.has_critical_issues ? 'Has Critical Issues' : undefined,
              }))}
              variant="compact"
              maxItems={5}
            />
          )}
          
          <RelatedItems
            title="Vehicle History"
            items={[
              {
                id: 'all-inspections',
                title: 'All Inspections',
                subtitle: `View all ${relatedInspectionsData?.total || 0} inspections for this vehicle`,
                path: `/app/inspections?vehicle=${inspection.vehicle_id}`,
                icon: '🔍',
              },
              {
                id: 'gate-passes',
                title: 'Gate Passes',
                subtitle: 'View gate passes for this vehicle',
                path: `/app/gate-pass?vehicle=${inspection.vehicle_id}`,
                icon: '🚪',
              },
            ]}
            variant="compact"
          />
        </CardGrid>
      )}

      {/* Template Conflict Resolution Modal */}
      {inspection && currentTemplate && inspection.template && (
        <ConflictResolutionModal
          isOpen={showConflictModal}
          onClose={() => setShowConflictModal(false)}
          oldTemplate={inspection.template}
          newTemplate={currentTemplate}
          inspectionAnswers={inspection.answers.reduce((acc: Record<string, any>, answer: any) => {
            acc[answer.question_id] = answer.answer_value;
            return acc;
          }, {})}
          onResolve={async (strategy) => {
            try {
              setResolvingConflict(true);
              
              // Update inspection template reference
              await apiClient.patch(`/v1/inspections/${id}`, {
                template_id: currentTemplate.id,
                template_version_resolution: strategy,
              });
              
              // Refresh inspection data
              await fetchInspectionDetails();
              
              setShowConflictModal(false);
              showToast({
                title: 'Conflict Resolved',
                description: `Template conflict resolved using ${strategy === 'keep_answers' ? 'Keep Answers' : strategy === 'use_new_template' ? 'New Template' : 'Smart Merge'} strategy.`,
                variant: 'success',
              });
            } catch (err) {
              showToast({
                title: 'Error',
                description: err instanceof Error ? err.message : 'Failed to resolve template conflict',
                variant: 'error',
              });
            } finally {
              setResolvingConflict(false);
            }
          }}
          resolving={resolvingConflict}
        />
      )}

      {/* Report Builder Modal */}
      {showReportBuilder && inspection && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, backgroundColor: 'white' }}>
          <DraggableReportBuilder
            inspection={inspection}
            onClose={() => {
              setShowReportBuilder(false);
              fetchInspectionDetails(); // Refresh to get updated layout
            }}
          />
        </div>
      )}

      {/* RTO Details Manager Modal */}
      {showRtoManager && (
        <RtoDetailsManager
          inspectionId={id || ''}
          isOpen={showRtoManager}
          onClose={() => setShowRtoManager(false)}
          onSave={() => {
            fetchInspectionDetails(); // Refresh to get updated RTO details
          }}
        />
      )}

      {/* Image Download Manager Modal */}
      {showImageDownload && inspection && (
        <ImageDownloadManager
          inspection={inspection}
          onClose={() => setShowImageDownload(false)}
        />
      )}
    </div>
  );
};

export default InspectionDetails;
