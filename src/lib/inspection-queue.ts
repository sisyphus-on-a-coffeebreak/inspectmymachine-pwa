import { get, set, del, keys } from 'idb-keyval';
import type { SerializedInspectionAnswers } from './inspection-serialization-types';

const QUEUE_PREFIX = 'inspection-queue:';
const DRAFT_PREFIX = 'inspection-draft:';
const QUEUE_VERSION = 1;
const DRAFT_VERSION = 1;
const CHANNEL_NAME = 'inspection-queue-channel';

const queueChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

export type InspectionSubmissionMode = 'draft' | 'final';

export interface QueuedInspectionSubmission {
  id: string;
  templateId: string;
  vehicleId?: string;
  answers: SerializedInspectionAnswers;
  metadata?: Record<string, any>;
  mode: InspectionSubmissionMode;
  createdAt: number;
  updatedAt: number;
  attempts: number;
  lastError?: string;
}

export interface InspectionDraftRecord {
  templateId: string;
  vehicleId?: string;
  updatedAt: number;
  answers: SerializedInspectionAnswers;
  metadata?: {
    templateVersion?: number;
    conflictResolved?: boolean;
    [key: string]: any;
  };
}

export async function queueInspectionSubmission(options: {
  templateId: string;
  vehicleId?: string;
  answers: SerializedInspectionAnswers;
  metadata?: Record<string, any>;
  mode: InspectionSubmissionMode;
  queueId?: string;
}): Promise<string> {
  const { templateId, vehicleId, answers, metadata = {}, mode, queueId } = options;

  const id = queueId ?? crypto.randomUUID();
  const key = buildQueueKey(id);
  const existing = queueId ? await get<QueuedInspectionSubmission>(key) : null;

  const record: QueuedInspectionSubmission = {
    id,
    templateId,
    vehicleId,
    answers,
    metadata,
    mode,
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
    attempts: existing?.attempts ?? 0,
    lastError: existing?.lastError,
  };

  await set(key, record);
  notifyQueueChange();

  return id;
}

export async function listQueuedInspections(): Promise<QueuedInspectionSubmission[]> {
  const allKeys = await keys();
  const relevant = allKeys
    .filter((key): key is string => typeof key === 'string' && key.startsWith(QUEUE_PREFIX))
    .sort();

  const records = await Promise.all(relevant.map((key) => get<QueuedInspectionSubmission>(key)));
  return (records.filter(Boolean) as QueuedInspectionSubmission[]).sort((a, b) => a.createdAt - b.createdAt);
}

export async function removeQueuedInspection(queueId: string) {
  await del(buildQueueKey(queueId));
  notifyQueueChange();
}

export async function updateQueuedInspection(queueId: string, updates: Partial<QueuedInspectionSubmission>) {
  const key = buildQueueKey(queueId);
  const existing = await get<QueuedInspectionSubmission>(key);
  if (!existing) {
    return;
  }

  const record: QueuedInspectionSubmission = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };

  await set(key, record);
  notifyQueueChange();
}

export function subscribeQueuedInspectionCount(callback: (count: number) => void) {
  let cancelled = false;

  const emit = async () => {
    if (cancelled) return;
    const queued = await listQueuedInspections();
    callback(queued.length);
  };

  emit();

  if (queueChannel) {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'inspection-queue-change') {
        emit();
      }
    };
    queueChannel.addEventListener('message', handler);

    return () => {
      cancelled = true;
      queueChannel.removeEventListener('message', handler);
    };
  }

  const interval = setInterval(emit, 5000);
  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}

export async function saveInspectionDraft(templateId: string, vehicleId: string | undefined, answers: SerializedInspectionAnswers) {
  const key = buildDraftKey(templateId, vehicleId);
  const record: InspectionDraftRecord = {
    templateId,
    vehicleId,
    updatedAt: Date.now(),
    answers,
  };
  await set(key, record);
}

export async function loadInspectionDraft(templateId: string, vehicleId?: string): Promise<InspectionDraftRecord | null> {
  const key = buildDraftKey(templateId, vehicleId);
  const record = await get<InspectionDraftRecord>(key);
  return record ?? null;
}

export async function clearInspectionDraft(templateId: string, vehicleId?: string) {
  const key = buildDraftKey(templateId, vehicleId);
  await del(key);
}

export function notifyQueueChange() {
  if (queueChannel) {
    queueChannel.postMessage({ type: 'inspection-queue-change', ts: Date.now() });
  }
}

function buildQueueKey(id: string): string {
  return `${QUEUE_PREFIX}${QUEUE_VERSION}:${id}`;
}

function buildDraftKey(templateId: string, vehicleId?: string): string {
  const suffix = vehicleId ? `${templateId}:${vehicleId}` : templateId;
  return `${DRAFT_PREFIX}${DRAFT_VERSION}:${suffix}`;
}
