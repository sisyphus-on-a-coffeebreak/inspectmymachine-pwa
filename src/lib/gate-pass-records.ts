import axios from 'axios';
import { formatPassNumber } from './pdf-generator-simple';

type GatePassType = 'visitor' | 'vehicle';

export interface GatePassRecordMetadata {
  passNumber?: string;
  passType?: GatePassType;
  visitorName?: string;
  vehicleDetails?: {
    registration?: string;
    make?: string;
    model?: string;
  };
  purpose?: string;
  entryTime?: string;
  expectedReturn?: string;
  companyName?: string;
  companyLogo?: string;
  [key: string]: unknown;
}

export interface GatePassRecord {
  id: string;
  accessCode: string;
  qrCode?: string;
  qrPayload?: string;
  passNumber?: string;
  metadata?: GatePassRecordMetadata;
}

interface SyncGatePassRecordArgs {
  passId: string | number;
  passType: GatePassType;
  metadata?: GatePassRecordMetadata;
  preferredAccessCode?: string;
}

interface RawGatePassRecord {
  id?: string;
  record_id?: string;
  pass_id?: string | number;
  access_code?: string;
  accessCode?: string;
  code?: string;
  qr_code?: string;
  qrCode?: string;
  qr_svg?: string;
  qrSvg?: string;
  qr_png?: string;
  qr_base64?: string;
  qrPayload?: string;
  qr_payload?: string;
  payload?: string;
  qr?: string;
  pass_number?: string;
  passNumber?: string;
  metadata?: GatePassRecordMetadata;
  [key: string]: unknown;
}

const resolveRecordId = (raw: RawGatePassRecord, fallback: string): string => {
  return (
    (raw.id && String(raw.id)) ||
    (raw.record_id && String(raw.record_id)) ||
    (raw.pass_id && String(raw.pass_id)) ||
    fallback
  );
};

const resolveAccessCode = (raw: RawGatePassRecord, fallback?: string): string => {
  return (
    (raw.access_code && String(raw.access_code)) ||
    (raw.accessCode && String(raw.accessCode)) ||
    (raw.code && String(raw.code)) ||
    fallback ||
    ''
  );
};

const resolveQrCode = (raw: RawGatePassRecord): string | undefined => {
  return (
    (raw.qr_code && String(raw.qr_code)) ||
    (raw.qrCode && String(raw.qrCode)) ||
    (raw.qr_svg && String(raw.qr_svg)) ||
    (raw.qrSvg && String(raw.qrSvg)) ||
    (raw.qr_png && String(raw.qr_png)) ||
    (raw.qr_base64 && String(raw.qr_base64)) ||
    (raw.qr && String(raw.qr)) ||
    undefined
  );
};

const resolveQrPayload = (raw: RawGatePassRecord): string | undefined => {
  return (
    (raw.qr_payload && String(raw.qr_payload)) ||
    (raw.qrPayload && String(raw.qrPayload)) ||
    (raw.payload && String(raw.payload)) ||
    undefined
  );
};

/**
 * Syncs a gate-pass record with the backend. This will create the record if needed
 * and returns the canonical access code, QR payload/image and record identifier.
 */
export const syncGatePassRecord = async ({
  passId,
  passType,
  metadata = {},
  preferredAccessCode,
}: SyncGatePassRecordArgs): Promise<GatePassRecord> => {
  const fallbackPassNumber = metadata.passNumber || formatPassNumber(passType, passId);

  const payload: Record<string, unknown> = {
    pass_id: passId,
    pass_type: passType,
    metadata: {
      ...metadata,
      passNumber: fallbackPassNumber,
      passType,
    },
  };

  if (preferredAccessCode) {
    payload.access_code = preferredAccessCode;
  }

  const response = await axios.post('/api/gate-pass-records/sync', payload);
  const raw: RawGatePassRecord = response.data?.record || response.data?.data || response.data || {};

  const recordId = resolveRecordId(raw, String(passId));
  const accessCode = resolveAccessCode(raw, preferredAccessCode);
  if (!accessCode) {
    throw new Error('Unable to determine access code from gate-pass record response');
  }

  const qrCode = resolveQrCode(raw);
  const qrPayload = resolveQrPayload(raw);
  const passNumber = raw.pass_number || raw.passNumber || fallbackPassNumber;

  return {
    id: recordId,
    accessCode,
    qrCode,
    qrPayload,
    passNumber,
    metadata: raw.metadata || metadata,
  };
};

