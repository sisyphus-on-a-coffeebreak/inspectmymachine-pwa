# QR Code Requirements - Backend Implementation

## Overview

The frontend now **REQUIRES** verifiable QR codes from the backend. Dummy access codes are no longer accepted.

## Critical Backend Requirement

The `/api/gate-pass-records/sync` endpoint **MUST** return a `qr_payload` field containing verifiable pass information.

### Required Response Format

```json
{
  "record": {
    "id": "uuid-here",
    "access_code": "ABC123",
    "qr_payload": "verifiable-payload-here",
    "qr_code": "data:image/png;base64,...",  // Optional: pre-generated QR image
    "pass_number": "VP123456"
  }
}
```

### QR Payload Structure

The `qr_payload` should contain one of the following:

#### Option 1: JSON String (Recommended)
```json
{
  "type": "gate_pass",
  "pass_id": "uuid-here",
  "access_code": "ABC123",
  "validation_url": "https://api.inspectmymachine.in/api/gate-pass-validation/validate",
  "timestamp": "2024-01-20T10:30:00Z",
  "signature": "secure-hash-here"
}
```

**Stringified as:** `"{\"type\":\"gate_pass\",\"pass_id\":\"uuid-here\",...}"`

#### Option 2: Simple Format
```json
{
  "pass_id": "uuid-here",
  "access_code": "ABC123"
}
```

**Stringified as:** `"{\"pass_id\":\"uuid-here\",\"access_code\":\"ABC123\"}"`

#### Option 3: Validation Token (Most Secure)
A secure, unique token that can be validated by the backend:
```
"voms:gate-pass:uuid-here:secure-token-here"
```

### What NOT to Return

❌ **DO NOT** return a 6-digit dummy access code like `"123456"`
❌ **DO NOT** return empty or null `qr_payload`
❌ **DO NOT** omit the `qr_payload` field

### Frontend Behavior

If `qr_payload` is missing or empty:
- Frontend will **throw an error**
- QR code generation will **fail**
- User will see error message: "Backend did not provide verifiable QR payload"

## Implementation Steps

### 1. Update Backend Controller

In `GatePassRecordController@sync`:

```php
public function sync(Request $request)
{
    // ... existing validation and record creation ...
    
    $record = GatePassRecord::firstOrCreate(
        ['pass_id' => $request->pass_id],
        [
            'pass_id' => $request->pass_id,
            'pass_type' => $request->pass_type,
            'access_code' => $request->access_code ?? $this->generateAccessCode(),
            // ... other fields ...
        ]
    );
    
    // Generate verifiable QR payload
    $qrPayload = json_encode([
        'type' => 'gate_pass',
        'pass_id' => $record->id,
        'access_code' => $record->access_code,
        'validation_url' => config('app.url') . '/api/gate-pass-validation/validate',
        'timestamp' => now()->toIso8601String(),
        'signature' => $this->generateSignature($record),
    ]);
    
    // Optionally pre-generate QR code image
    $qrCode = $this->generateQRCodeImage($qrPayload);
    
    return response()->json([
        'record' => [
            'id' => $record->id,
            'access_code' => $record->access_code,
            'qr_payload' => $qrPayload,  // REQUIRED
            'qr_code' => $qrCode,        // Optional
            'pass_number' => $record->pass_number,
            'metadata' => $record->metadata,
        ]
    ]);
}

private function generateSignature($record): string
{
    // Generate secure signature for validation
    $data = $record->id . $record->access_code . $record->created_at;
    return hash_hmac('sha256', $data, config('app.key'));
}

private function generateQRCodeImage(string $payload): ?string
{
    // Use a QR code library (e.g., SimpleSoftwareIO/simple-qrcode)
    try {
        $qr = QrCode::format('png')
            ->size(256)
            ->errorCorrection('M')
            ->generate($payload);
        
        return 'data:image/png;base64,' . base64_encode($qr);
    } catch (\Exception $e) {
        return null; // Frontend will generate it
    }
}
```

### 2. Update Database Schema

Ensure `gate_pass_records` table has:
- `qr_payload` (TEXT) - Store the verifiable payload
- `qr_code` (TEXT, nullable) - Store pre-generated QR image (optional)

### 3. Update Validation Endpoint

The `/api/gate-pass-validation/validate` endpoint should:

1. Accept the `qr_payload` from scanned QR code
2. Parse the JSON payload
3. Validate the signature (if using Option 1)
4. Look up the pass by `pass_id` or `access_code`
5. Return validation result

```php
public function validate(Request $request)
{
    $qrPayload = $request->input('access_code'); // Or 'qr_payload'
    
    // Parse JSON if it's a JSON string
    $data = json_decode($qrPayload, true);
    
    if ($data) {
        // Validate using pass_id and signature
        $record = GatePassRecord::where('id', $data['pass_id'])->first();
        
        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Pass not found',
            ], 404);
        }
        
        // Verify signature if present
        if (isset($data['signature'])) {
            $expectedSignature = $this->generateSignature($record);
            if ($data['signature'] !== $expectedSignature) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid QR code signature',
                ], 401);
            }
        }
        
        // Return pass details
        return response()->json([
            'success' => true,
            'message' => 'Pass validated successfully',
            'pass_data' => $record,
        ]);
    } else {
        // Fallback: validate by access_code only
        $record = GatePassRecord::where('access_code', $qrPayload)->first();
        
        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid access code',
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Pass validated successfully',
            'pass_data' => $record,
        ]);
    }
}
```

## Testing

### Test Cases

1. **Valid QR Payload**
   - Backend returns `qr_payload` with valid JSON
   - Frontend generates QR code successfully
   - QR code can be scanned and validated

2. **Missing QR Payload**
   - Backend omits `qr_payload` or returns empty string
   - Frontend throws error
   - User sees error message

3. **Invalid QR Payload**
   - Backend returns dummy 6-digit code
   - Frontend rejects it and throws error

4. **QR Validation**
   - Scan QR code
   - Backend validates payload
   - Returns pass details

## Migration Notes

- **Breaking Change:** Frontend will fail if backend doesn't provide `qr_payload`
- **Backward Compatibility:** None - backend MUST be updated first
- **Deployment Order:** 
  1. Update backend API first
  2. Deploy backend
  3. Deploy frontend

## Security Considerations

1. **Signature Validation:** Use HMAC-SHA256 with app key
2. **Token Expiration:** Consider adding expiration to QR payloads
3. **Rate Limiting:** Limit validation attempts
4. **Logging:** Log all validation attempts for security audit

---

**Last Updated:** 2024-01-20
**Status:** Ready for Backend Implementation

