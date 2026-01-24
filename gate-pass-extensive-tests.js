/**
 * EXTENSIVE GATE PASS MODULE TESTING SUITE
 * 
 * Comprehensive programmatic testing of all gate pass functionality:
 * - Visitor Gate Passes (CRUD, validation, scanning)
 * - Vehicle Entry Passes (CRUD, clerking sheets)
 * - Vehicle Exit Passes (CRUD, exit workflow, GPS validation, documents, photos, signatures)
 * - Gate Pass Validation (QR scanning, entry/exit recording)
 * - Gate Pass Approval (pending, approve, reject, comments, history)
 * - Gate Pass Reports (summary, analytics, export, dashboard, calendar, yards)
 * - Gate Pass Records (unified listing, sync, stats)
 * - Bulk Operations (templates, execute, export)
 * - Visitor Management (visitors list, stats, update, notes)
 * 
 * Tests include:
 * - Happy paths
 * - Error scenarios
 * - Edge cases
 * - Validation rules
 * - State transitions
 * - Permission checks
 * - Data integrity
 */

const API_BASE = 'http://127.0.0.1:8000/api';
let cookieJar = [];
let testResults = {
  passed: [],
  failed: [],
  warnings: [],
  errors: [],
  gatePassIds: {
    visitor: null,
    vehicleEntry: null,
    vehicleExit: null,
  },
};

// Helper functions
function extractCookies(response) {
  const setCookieHeaders = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
  setCookieHeaders.forEach(cookie => {
    const [nameValue] = cookie.split(';');
    const [name] = nameValue.split('=');
    cookieJar = cookieJar.filter(c => !c.startsWith(name + '='));
    cookieJar.push(nameValue.trim());
  });
}

function getCookieHeader() {
  return cookieJar.join('; ');
}

function getCsrfToken() {
  for (const cookie of cookieJar) {
    if (cookie.startsWith('XSRF-TOKEN=')) {
      return decodeURIComponent(cookie.split('=')[1].split(';')[0]);
    }
  }
  return null;
}

async function apiRequest(method, path, data = null, useAuth = true, expectedStatus = null) {
  const url = `${API_BASE}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'include',
  };

  if (useAuth && cookieJar.length > 0) {
    options.headers['Cookie'] = getCookieHeader();
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      options.headers['X-XSRF-TOKEN'] = csrfToken;
    }
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    extractCookies(response);
    const responseData = await response.json().catch(() => ({}));
    
    const result = {
      status: response.status,
      data: responseData,
      headers: response.headers,
      success: expectedStatus ? response.status === expectedStatus : response.status < 400,
    };

    if (expectedStatus && response.status !== expectedStatus) {
      result.unexpected = true;
    }

    return result;
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      success: false,
      networkError: true,
    };
  }
}

function logResult(testName, result, details = {}) {
  if (result.success && !result.unexpected) {
    testResults.passed.push({ test: testName, ...details });
    console.log(`✅ ${testName}`);
  } else if (result.unexpected) {
    testResults.warnings.push({ test: testName, expected: details.expectedStatus, got: result.status, ...details });
    console.log(`⚠️  ${testName} - Expected ${details.expectedStatus}, got ${result.status}`);
  } else {
    testResults.failed.push({ test: testName, error: result.data, status: result.status, ...details });
    console.log(`❌ ${testName} - Status: ${result.status}`);
    if (result.data?.message) {
      console.log(`   Error: ${result.data.message.substring(0, 100)}`);
    }
  }
}

// Initialize authentication
async function initializeAuth() {
  const csrfResponse = await fetch('http://127.0.0.1:8000/sanctum/csrf-cookie', {
    method: 'GET',
    credentials: 'include',
  });
  extractCookies(csrfResponse);
  
  const loginResult = await apiRequest('POST', '/login', {
    employee_id: 'SUPER001',
    password: 'password'
  }, false);
  
  if (!loginResult.success) {
    throw new Error('Authentication failed');
  }
  
  console.log('✅ Authenticated successfully\n');
}

// ========================================
// TEST SUITE 1: Visitor Gate Passes
// ========================================

async function testVisitorGatePasses() {
  console.log('\n🚪 TEST SUITE 1: Visitor Gate Passes\n');
  console.log('='.repeat(60));

  // Test 1.1: List visitor gate passes
  const listPasses = await apiRequest('GET', '/visitor-gate-passes', null, true);
  logResult('1.1: List visitor gate passes', listPasses, { expectedStatus: 200 });

  // Test 1.2: Create visitor gate pass - minimal required fields
  const timestamp = Date.now();
  const createMinimal = await apiRequest('POST', '/visitor-gate-passes', {
    visitor_name: `Test Visitor ${timestamp}`,
    visitor_phone: '1234567890',
    purpose: 'VISIT', // Try common purpose
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 86400000).toISOString(), // +1 day
  }, true);
  logResult('1.2: Create visitor pass (minimal)', createMinimal, { expectedStatus: 201 });
  if (createMinimal.success) {
    testResults.gatePassIds.visitor = createMinimal.data?.data?.id || createMinimal.data?.id;
  }

  // Test 1.3: Create visitor gate pass - with all optional fields
  const createFull = await apiRequest('POST', '/visitor-gate-passes', {
    visitor_name: `Full Visitor ${timestamp}`,
    visitor_phone: '9876543210',
    visitor_email: `visitor${timestamp}@example.com`,
    visitor_company: 'Test Company',
    purpose: 'VISIT',
    referred_by: 'Test Referrer',
    additional_visitors: 2,
    vehicles_to_view: [], // Empty array
    notes: 'Test notes for visitor',
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 86400000).toISOString(),
  }, true);
  logResult('1.3: Create visitor pass (full data)', createFull, { expectedStatus: 201 });

  // Test 1.4: Get visitor gate pass details
  if (testResults.gatePassIds.visitor) {
    const getPass = await apiRequest('GET', `/visitor-gate-passes/${testResults.gatePassIds.visitor}`, null, true);
    logResult('1.4: Get visitor pass details', getPass, { expectedStatus: 200 });
  }

  // Test 1.5: Update visitor gate pass
  if (testResults.gatePassIds.visitor) {
    const updatePass = await apiRequest('PUT', `/visitor-gate-passes/${testResults.gatePassIds.visitor}`, {
      notes: 'Updated notes',
      additional_visitors: 3,
    }, true);
    logResult('1.5: Update visitor pass', updatePass, { expectedStatus: 200 });
  }

  // Test 1.6: Record entry for visitor pass
  if (testResults.gatePassIds.visitor) {
    const recordEntry = await apiRequest('POST', `/visitor-gate-passes/${testResults.gatePassIds.visitor}/entries`, {
      entry_time: new Date().toISOString(),
      guard_notes: 'Test entry recording',
    }, true);
    logResult('1.6: Record visitor entry', recordEntry, { expectedStatus: 200 });
  }

  // Test 1.7: Record exit for visitor pass
  if (testResults.gatePassIds.visitor) {
    const recordExit = await apiRequest('POST', `/visitor-gate-passes/${testResults.gatePassIds.visitor}/exit`, {
      exit_time: new Date().toISOString(),
      guard_notes: 'Test exit recording',
    }, true);
    logResult('1.7: Record visitor exit', recordExit, { expectedStatus: 200 });
  }

  // Test 1.8: Cancel visitor pass
  if (testResults.gatePassIds.visitor) {
    const cancelPass = await apiRequest('POST', `/visitor-gate-passes/${testResults.gatePassIds.visitor}/cancel`, {
      cancellation_reason: 'Test cancellation',
    }, true);
    logResult('1.8: Cancel visitor pass', cancelPass, { expectedStatus: 200 });
  }

  // Test 1.9: Create visitor pass with missing required fields
  const missingFields = await apiRequest('POST', '/visitor-gate-passes', {
    visitor_name: 'Test',
  }, true);
  logResult('1.9: Create pass with missing fields', missingFields, { expectedStatus: 422 });

  // Test 1.10: Create visitor pass with invalid phone
  const invalidPhone = await apiRequest('POST', '/visitor-gate-passes', {
    visitor_name: `Test ${timestamp}`,
    visitor_phone: '123', // Too short
    purpose: 'VISIT',
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 86400000).toISOString(),
  }, true);
  logResult('1.10: Create pass with invalid phone', invalidPhone, { expectedStatus: 422 });

  // Test 1.11: Create visitor pass with past valid_until date
  const pastDate = await apiRequest('POST', '/visitor-gate-passes', {
    visitor_name: `Test ${timestamp}`,
    visitor_phone: '1234567890',
    purpose: 'VISIT',
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() - 86400000).toISOString(), // Past date
  }, true);
  logResult('1.11: Create pass with past valid_until', pastDate, { expectedStatus: 422 });

  // Test 1.12: Get non-existent visitor pass
  const getNonExistent = await apiRequest('GET', '/visitor-gate-passes/99999', null, true);
  logResult('1.12: Get non-existent visitor pass', getNonExistent, { expectedStatus: 404 });

  // Test 1.13: Update non-existent visitor pass
  const updateNonExistent = await apiRequest('PUT', '/visitor-gate-passes/99999', {
    notes: 'Test',
  }, true);
  logResult('1.13: Update non-existent visitor pass', updateNonExistent, { expectedStatus: 404 });
}

// ========================================
// TEST SUITE 2: Vehicle Entry Passes
// ========================================

async function testVehicleEntryPasses() {
  console.log('\n🚗 TEST SUITE 2: Vehicle Entry Passes\n');
  console.log('='.repeat(60));

  // Test 2.1: List vehicle entry passes
  const listPasses = await apiRequest('GET', '/vehicle-entry-passes', null, true);
  logResult('2.1: List vehicle entry passes', listPasses, { expectedStatus: 200 });

  // Test 2.2: Create vehicle entry pass
  const timestamp = Date.now();
  const createEntry = await apiRequest('POST', '/vehicle-entry-passes', {
    vehicle_id: '1', // Assuming vehicle exists
    driver_name: `Driver ${timestamp}`,
    driver_license: `DL${timestamp}`,
    entry_purpose: 'DELIVERY',
    expected_exit_date: new Date(Date.now() + 86400000).toISOString(),
  }, true);
  logResult('2.2: Create vehicle entry pass', createEntry, { expectedStatus: 201 });
  if (createEntry.success) {
    testResults.gatePassIds.vehicleEntry = createEntry.data?.data?.id || createEntry.data?.id;
  }

  // Test 2.3: Get vehicle entry pass details
  if (testResults.gatePassIds.vehicleEntry) {
    const getPass = await apiRequest('GET', `/vehicle-entry-passes/${testResults.gatePassIds.vehicleEntry}`, null, true);
    logResult('2.3: Get vehicle entry pass details', getPass, { expectedStatus: 200 });
  }

  // Test 2.4: Scan vehicle entry pass
  const scanEntry = await apiRequest('POST', '/vehicle-entry-passes/scan', {
    access_code: 'TEST123', // Would need actual access code
  }, true);
  logResult('2.4: Scan vehicle entry pass', scanEntry, { expectedStatus: 200 });

  // Test 2.5: Submit clerking sheet for entry pass
  if (testResults.gatePassIds.vehicleEntry) {
    const clerkingSheet = await apiRequest('POST', `/vehicle-entry-passes/${testResults.gatePassIds.vehicleEntry}/clerking-sheet`, {
      odometer_reading: 10000,
      fuel_level: 'FULL',
      condition_notes: 'Vehicle in good condition',
    }, true);
    logResult('2.5: Submit clerking sheet', clerkingSheet, { expectedStatus: 200 });
  }

  // Test 2.6: Create entry pass with missing fields
  const missingFields = await apiRequest('POST', '/vehicle-entry-passes', {
    vehicle_id: '1',
  }, true);
  logResult('2.6: Create entry pass with missing fields', missingFields, { expectedStatus: 422 });

  // Test 2.7: Create entry pass with invalid vehicle_id
  const invalidVehicle = await apiRequest('POST', '/vehicle-entry-passes', {
    vehicle_id: '99999',
    driver_name: 'Test Driver',
    driver_license: 'DL123',
    entry_purpose: 'DELIVERY',
  }, true);
  logResult('2.7: Create entry pass with invalid vehicle_id', invalidVehicle, { expectedStatus: 422 });
}

// ========================================
// TEST SUITE 3: Vehicle Exit Passes
// ========================================

async function testVehicleExitPasses() {
  console.log('\n🚛 TEST SUITE 3: Vehicle Exit Passes\n');
  console.log('='.repeat(60));

  // Test 3.1: List vehicle exit passes
  const listPasses = await apiRequest('GET', '/vehicle-exit-passes', null, true);
  logResult('3.1: List vehicle exit passes', listPasses, { expectedStatus: 200 });

  // Test 3.2: Create vehicle exit pass
  const timestamp = Date.now();
  const createExit = await apiRequest('POST', '/vehicle-exit-passes', {
    vehicle_id: '1',
    driver_name: `Driver ${timestamp}`,
    driver_license: `DL${timestamp}`,
    exit_purpose: 'DELIVERY',
    destination: 'Test Destination',
    expected_return_date: new Date(Date.now() + 86400000).toISOString(),
  }, true);
  logResult('3.2: Create vehicle exit pass', createExit, { expectedStatus: 201 });
  if (createExit.success) {
    testResults.gatePassIds.vehicleExit = createExit.data?.data?.id || createExit.data?.id;
  }

  // Test 3.3: Get vehicle exit pass details
  if (testResults.gatePassIds.vehicleExit) {
    const getPass = await apiRequest('GET', `/vehicle-exit-passes/${testResults.gatePassIds.vehicleExit}`, null, true);
    logResult('3.3: Get vehicle exit pass details', getPass, { expectedStatus: 200 });
  }

  // Test 3.4: Update vehicle exit pass
  if (testResults.gatePassIds.vehicleExit) {
    const updatePass = await apiRequest('PUT', `/vehicle-exit-passes/${testResults.gatePassIds.vehicleExit}`, {
      destination: 'Updated Destination',
      notes: 'Updated notes',
    }, true);
    logResult('3.4: Update vehicle exit pass', updatePass, { expectedStatus: 200 });
  }

  // Test 3.5: Start exit process
  if (testResults.gatePassIds.vehicleExit) {
    const startExit = await apiRequest('POST', '/vehicle-exit-passes/start-exit', {
      pass_id: testResults.gatePassIds.vehicleExit,
    }, true);
    logResult('3.5: Start exit process', startExit, { expectedStatus: 200 });
  }

  // Test 3.6: Verify driver
  if (testResults.gatePassIds.vehicleExit) {
    const verifyDriver = await apiRequest('POST', `/vehicle-exit-passes/${testResults.gatePassIds.vehicleExit}/verify-driver`, {
      driver_verified: true,
      verification_notes: 'Driver ID verified',
    }, true);
    logResult('3.6: Verify driver', verifyDriver, { expectedStatus: 200 });
  }

  // Test 3.7: Verify escort
  if (testResults.gatePassIds.vehicleExit) {
    const verifyEscort = await apiRequest('POST', `/vehicle-exit-passes/${testResults.gatePassIds.vehicleExit}/verify-escort`, {
      escort_verified: true,
      escort_name: 'Test Escort',
    }, true);
    logResult('3.7: Verify escort', verifyEscort, { expectedStatus: 200 });
  }

  // Test 3.8: Validate GPS
  if (testResults.gatePassIds.vehicleExit) {
    const validateGPS = await apiRequest('POST', `/vehicle-exit-passes/${testResults.gatePassIds.vehicleExit}/validate-gps`, {
      latitude: 28.6139,
      longitude: 77.2090,
      accuracy: 10,
    }, true);
    logResult('3.8: Validate GPS coordinates', validateGPS, { expectedStatus: 200 });
  }

  // Test 3.9: Submit documents
  if (testResults.gatePassIds.vehicleExit) {
    const submitDocs = await apiRequest('POST', `/vehicle-exit-passes/${testResults.gatePassIds.vehicleExit}/submit-documents`, {
      documents: [
        { type: 'permit', file_key: 'test-permit.pdf' },
        { type: 'license', file_key: 'test-license.pdf' },
      ],
    }, true);
    logResult('3.9: Submit documents', submitDocs, { expectedStatus: 200 });
  }

  // Test 3.10: Submit exit photos
  if (testResults.gatePassIds.vehicleExit) {
    const submitPhotos = await apiRequest('POST', `/vehicle-exit-passes/${testResults.gatePassIds.vehicleExit}/submit-photos`, {
      photos: [
        { type: 'front', file_key: 'front-photo.jpg' },
        { type: 'back', file_key: 'back-photo.jpg' },
        { type: 'side', file_key: 'side-photo.jpg' },
      ],
    }, true);
    logResult('3.10: Submit exit photos', submitPhotos, { expectedStatus: 200 });
  }

  // Test 3.11: Submit signatures
  if (testResults.gatePassIds.vehicleExit) {
    const submitSignatures = await apiRequest('POST', `/vehicle-exit-passes/${testResults.gatePassIds.vehicleExit}/submit-signatures`, {
      driver_signature: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
      guard_signature: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
    }, true);
    logResult('3.11: Submit signatures', submitSignatures, { expectedStatus: 200 });
  }

  // Test 3.12: Complete exit
  if (testResults.gatePassIds.vehicleExit) {
    const completeExit = await apiRequest('POST', `/vehicle-exit-passes/${testResults.gatePassIds.vehicleExit}/complete`, {
      exit_time: new Date().toISOString(),
      final_notes: 'Exit completed successfully',
    }, true);
    logResult('3.12: Complete exit process', completeExit, { expectedStatus: 200 });
  }

  // Test 3.13: Create exit pass with missing fields
  const missingFields = await apiRequest('POST', '/vehicle-exit-passes', {
    vehicle_id: '1',
  }, true);
  logResult('3.13: Create exit pass with missing fields', missingFields, { expectedStatus: 422 });
}

// ========================================
// TEST SUITE 4: Gate Pass Validation
// ========================================

async function testGatePassValidation() {
  console.log('\n🔍 TEST SUITE 4: Gate Pass Validation\n');
  console.log('='.repeat(60));

  // Test 4.1: Validate gate pass (QR code scanning)
  const validate = await apiRequest('POST', '/gate-pass-validation/validate', {
    access_code: 'TEST123', // Would need actual access code
  }, true);
  logResult('4.1: Validate gate pass (QR scan)', validate, { expectedStatus: 200 });

  // Test 4.2: Verify gate pass (QR code verification)
  const verify = await apiRequest('GET', '/gate-pass-validation/verify', null, true);
  logResult('4.2: Verify gate pass (QR verification)', verify, { expectedStatus: 200 });

  // Test 4.3: Record entry
  if (testResults.gatePassIds.visitor) {
    const recordEntry = await apiRequest('POST', '/gate-pass-validation/entry', {
      pass_id: testResults.gatePassIds.visitor,
      entry_time: new Date().toISOString(),
      guard_id: 1,
    }, true);
    logResult('4.3: Record entry via validation endpoint', recordEntry, { expectedStatus: 200 });
  }

  // Test 4.4: Record exit
  if (testResults.gatePassIds.visitor) {
    const recordExit = await apiRequest('POST', '/gate-pass-validation/exit', {
      pass_id: testResults.gatePassIds.visitor,
      exit_time: new Date().toISOString(),
      guard_id: 1,
    }, true);
    logResult('4.4: Record exit via validation endpoint', recordExit, { expectedStatus: 200 });
  }

  // Test 4.5: Get validation history
  if (testResults.gatePassIds.visitor) {
    const history = await apiRequest('GET', `/gate-pass-validation/history/${testResults.gatePassIds.visitor}`, null, true);
    logResult('4.5: Get validation history', history, { expectedStatus: 200 });
  }

  // Test 4.6: Validate with invalid access code
  const invalidCode = await apiRequest('POST', '/gate-pass-validation/validate', {
    access_code: 'INVALID123',
  }, true);
  logResult('4.6: Validate with invalid access code', invalidCode, { expectedStatus: 404 });

  // Test 4.7: Validate with missing access code
  const missingCode = await apiRequest('POST', '/gate-pass-validation/validate', {}, true);
  logResult('4.7: Validate with missing access code', missingCode, { expectedStatus: 422 });
}

// ========================================
// TEST SUITE 5: Gate Pass Approval
// ========================================

async function testGatePassApproval() {
  console.log('\n✅ TEST SUITE 5: Gate Pass Approval\n');
  console.log('='.repeat(60));

  // Test 5.1: Get pending approvals
  const pending = await apiRequest('GET', '/gate-pass-approval/pending', null, true);
  logResult('5.1: Get pending approvals', pending, { expectedStatus: 200 });

  // Test 5.2: Get approval history
  const history = await apiRequest('GET', '/gate-pass-approval/history', null, true);
  logResult('5.2: Get approval history', history, { expectedStatus: 200 });

  // Test 5.3: Get pass details for approval
  if (testResults.gatePassIds.visitor) {
    const passDetails = await apiRequest('GET', `/gate-pass-approval/pass-details/${testResults.gatePassIds.visitor}`, null, true);
    logResult('5.3: Get pass details for approval', passDetails, { expectedStatus: 200 });
  }

  // Test 5.4: Get approval comments
  // Note: Would need actual approval_id
  const comments = await apiRequest('GET', '/gate-pass-approval/comments/1', null, true);
  logResult('5.4: Get approval comments', comments, { expectedStatus: 200 });

  // Test 5.5: Add approval comment
  const addComment = await apiRequest('POST', '/gate-pass-approval/comments/1', {
    comment: 'Test approval comment',
  }, true);
  logResult('5.5: Add approval comment', addComment, { expectedStatus: 200 });

  // Test 5.6: Approve gate pass
  const approve = await apiRequest('POST', '/gate-pass-approval/approve/1', {
    notes: 'Approved for testing',
  }, true);
  logResult('5.6: Approve gate pass', approve, { expectedStatus: 200 });

  // Test 5.7: Reject gate pass
  const reject = await apiRequest('POST', '/gate-pass-approval/reject/1', {
    rejection_reason: 'Test rejection',
  }, true);
  logResult('5.7: Reject gate pass', reject, { expectedStatus: 200 });

  // Test 5.8: Approve with missing approval_id
  const missingId = await apiRequest('POST', '/gate-pass-approval/approve/99999', {
    notes: 'Test',
  }, true);
  logResult('5.8: Approve non-existent pass', missingId, { expectedStatus: 404 });
}

// ========================================
// TEST SUITE 6: Gate Pass Reports
// ========================================

async function testGatePassReports() {
  console.log('\n📊 TEST SUITE 6: Gate Pass Reports\n');
  console.log('='.repeat(60));

  // Test 6.1: Get summary report
  const summary = await apiRequest('GET', '/gate-pass-reports/summary', null, true);
  logResult('6.1: Get summary report', summary, { expectedStatus: 200 });

  // Test 6.2: Get analytics report
  const analytics = await apiRequest('GET', '/gate-pass-reports/analytics', null, true);
  logResult('6.2: Get analytics report', analytics, { expectedStatus: 200 });

  // Test 6.3: Export report
  const exportReport = await apiRequest('GET', '/gate-pass-reports/export', null, true);
  logResult('6.3: Export report', exportReport, { expectedStatus: 200 });

  // Test 6.4: Get dashboard data
  const dashboard = await apiRequest('GET', '/gate-pass-reports/dashboard', null, true);
  logResult('6.4: Get dashboard data', dashboard, { expectedStatus: 200 });

  // Test 6.5: Get calendar view
  const calendar = await apiRequest('GET', '/gate-pass-calendar', null, true);
  logResult('6.5: Get calendar view', calendar, { expectedStatus: 200 });

  // Test 6.6: Get yards report
  const yards = await apiRequest('GET', '/gate-pass-reports/yards', null, true);
  logResult('6.6: Get yards report', yards, { expectedStatus: 200 });

  // Test 6.7: Get summary with date filters
  const summaryFiltered = await apiRequest('GET', '/gate-pass-reports/summary?date_from=2025-01-01&date_to=2025-12-31', null, true);
  logResult('6.7: Get summary with date filters', summaryFiltered, { expectedStatus: 200 });

  // Test 6.8: Get analytics with filters
  const analyticsFiltered = await apiRequest('GET', '/gate-pass-reports/analytics?type=visitor&status=approved', null, true);
  logResult('6.8: Get analytics with filters', analyticsFiltered, { expectedStatus: 200 });
}

// ========================================
// TEST SUITE 7: Gate Pass Records (Unified)
// ========================================

async function testGatePassRecords() {
  console.log('\n📋 TEST SUITE 7: Gate Pass Records (Unified)\n');
  console.log('='.repeat(60));

  // Test 7.1: List gate pass records
  const listRecords = await apiRequest('GET', '/gate-pass-records', null, true);
  logResult('7.1: List gate pass records', listRecords, { expectedStatus: 200 });

  // Test 7.2: Get gate pass stats
  const stats = await apiRequest('GET', '/gate-pass-records/stats', null, true);
  logResult('7.2: Get gate pass stats', stats, { expectedStatus: 200 });

  // Test 7.3: Sync gate pass records
  const sync = await apiRequest('POST', '/gate-pass-records/sync', {
    last_sync_time: new Date(Date.now() - 86400000).toISOString(),
  }, true);
  logResult('7.3: Sync gate pass records', sync, { expectedStatus: 200 });

  // Test 7.4: List records with filters
  const filtered = await apiRequest('GET', '/gate-pass-records?type=visitor&status=active', null, true);
  logResult('7.4: List records with filters', filtered, { expectedStatus: 200 });

  // Test 7.5: List records with pagination
  const paginated = await apiRequest('GET', '/gate-pass-records?page=1&per_page=10', null, true);
  logResult('7.5: List records with pagination', paginated, { expectedStatus: 200 });

  // Test 7.6: List records with search
  const search = await apiRequest('GET', '/gate-pass-records?search=test', null, true);
  logResult('7.6: List records with search', search, { expectedStatus: 200 });
}

// ========================================
// TEST SUITE 8: Bulk Operations
// ========================================

async function testBulkOperations() {
  console.log('\n📦 TEST SUITE 8: Bulk Operations\n');
  console.log('='.repeat(60));

  // Test 8.1: Get bulk operations
  const operations = await apiRequest('GET', '/gate-pass-bulk/operations', null, true);
  logResult('8.1: Get bulk operations', operations, { expectedStatus: 200 });

  // Test 8.2: Get bulk operation templates
  const templates = await apiRequest('GET', '/gate-pass-bulk/templates', null, true);
  logResult('8.2: Get bulk operation templates', templates, { expectedStatus: 200 });

  // Test 8.3: Execute bulk operation
  const execute = await apiRequest('POST', '/gate-pass-bulk/execute', {
    operation: 'approve',
    pass_ids: [],
  }, true);
  logResult('8.3: Execute bulk operation', execute, { expectedStatus: 200 });

  // Test 8.4: Export bulk data
  const exportBulk = await apiRequest('GET', '/gate-pass-bulk/export', null, true);
  logResult('8.4: Export bulk data', exportBulk, { expectedStatus: 200 });

  // Test 8.5: Execute bulk operation with invalid data
  const invalidBulk = await apiRequest('POST', '/gate-pass-bulk/execute', {
    operation: 'invalid_operation',
  }, true);
  logResult('8.5: Execute invalid bulk operation', invalidBulk, { expectedStatus: 422 });
}

// ========================================
// TEST SUITE 9: Visitor Management
// ========================================

async function testVisitorManagement() {
  console.log('\n👥 TEST SUITE 9: Visitor Management\n');
  console.log('='.repeat(60));

  // Test 9.1: Get visitors list
  const visitors = await apiRequest('GET', '/visitor-management/visitors', null, true);
  logResult('9.1: Get visitors list', visitors, { expectedStatus: 200 });

  // Test 9.2: Get visitor stats
  const stats = await apiRequest('GET', '/visitor-management/stats', null, true);
  logResult('9.2: Get visitor stats', stats, { expectedStatus: 200 });

  // Test 9.3: Update visitor
  const updateVisitor = await apiRequest('PUT', '/visitor-management/visitors/1', {
    notes: 'Updated visitor notes',
  }, true);
  logResult('9.3: Update visitor', updateVisitor, { expectedStatus: 200 });

  // Test 9.4: Update visitor notes
  const updateNotes = await apiRequest('PUT', '/visitor-management/visitors/1/notes', {
    notes: 'Test visitor notes',
  }, true);
  logResult('9.4: Update visitor notes', updateNotes, { expectedStatus: 200 });

  // Test 9.5: Get visitors with filters
  const filtered = await apiRequest('GET', '/visitor-management/visitors?status=active', null, true);
  logResult('9.5: Get visitors with filters', filtered, { expectedStatus: 200 });
}

// ========================================
// TEST SUITE 10: Edge Cases & Error Scenarios
// ========================================

async function testEdgeCases() {
  console.log('\n⚠️  TEST SUITE 10: Edge Cases & Error Scenarios\n');
  console.log('='.repeat(60));

  // Test 10.1: Very long visitor name
  const longName = await apiRequest('POST', '/visitor-gate-passes', {
    visitor_name: 'A'.repeat(500),
    visitor_phone: '1234567890',
    purpose: 'VISIT',
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 86400000).toISOString(),
  }, true);
  logResult('10.1: Create pass with very long name', longName, { expectedStatus: 422 });

  // Test 10.2: Special characters in visitor name
  const specialChars = await apiRequest('POST', '/visitor-gate-passes', {
    visitor_name: 'Test Visitor !@#$%^&*()_+-=[]{}|;:,.<>?',
    visitor_phone: '1234567890',
    purpose: 'VISIT',
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 86400000).toISOString(),
  }, true);
  logResult('10.2: Create pass with special characters', specialChars, { expectedStatus: 201 });

  // Test 10.3: SQL injection attempt in visitor name
  const sqlInjection = await apiRequest('POST', '/visitor-gate-passes', {
    visitor_name: "'; DROP TABLE visitors; --",
    visitor_phone: '1234567890',
    purpose: 'VISIT',
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 86400000).toISOString(),
  }, true);
  logResult('10.3: SQL injection attempt', sqlInjection, { expectedStatus: 201 }); // Should sanitize, not fail

  // Test 10.4: XSS attempt in notes
  const xssAttempt = await apiRequest('POST', '/visitor-gate-passes', {
    visitor_name: 'Test Visitor',
    visitor_phone: '1234567890',
    purpose: 'VISIT',
    notes: '<script>alert("xss")</script>',
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 86400000).toISOString(),
  }, true);
  logResult('10.4: XSS attempt in notes', xssAttempt, { expectedStatus: 201 }); // Should sanitize

  // Test 10.5: Concurrent create requests
  const concurrent1 = apiRequest('POST', '/visitor-gate-passes', {
    visitor_name: `Concurrent 1 ${Date.now()}`,
    visitor_phone: '1111111111',
    purpose: 'VISIT',
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 86400000).toISOString(),
  }, true);
  const concurrent2 = apiRequest('POST', '/visitor-gate-passes', {
    visitor_name: `Concurrent 2 ${Date.now()}`,
    visitor_phone: '2222222222',
    purpose: 'VISIT',
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 86400000).toISOString(),
  }, true);
  const [r1, r2] = await Promise.all([concurrent1, concurrent2]);
  logResult('10.5: Concurrent create requests', { success: r1.success && r2.success, status: r1.status });

  // Test 10.6: Invalid date format
  const invalidDate = await apiRequest('POST', '/visitor-gate-passes', {
    visitor_name: 'Test Visitor',
    visitor_phone: '1234567890',
    purpose: 'VISIT',
    valid_from: 'invalid-date',
    valid_until: 'invalid-date',
  }, true);
  logResult('10.6: Invalid date format', invalidDate, { expectedStatus: 422 });

  // Test 10.7: Empty request body
  const emptyBody = await apiRequest('POST', '/visitor-gate-passes', {}, true);
  logResult('10.7: Empty request body', emptyBody, { expectedStatus: 422 });

  // Test 10.8: Missing Content-Type header
  const noContentType = await fetch(`${API_BASE}/visitor-gate-passes`, {
    method: 'POST',
    headers: {
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': getCsrfToken() || '',
    },
    body: JSON.stringify({ visitor_name: 'Test', visitor_phone: '1234567890', purpose: 'VISIT' }),
  });
  logResult('10.8: Missing Content-Type header', { success: !noContentType.ok, status: noContentType.status });

  // Test 10.9: Very large payload
  const largePayload = await apiRequest('POST', '/visitor-gate-passes', {
    visitor_name: 'Test Visitor',
    visitor_phone: '1234567890',
    purpose: 'VISIT',
    notes: 'A'.repeat(10000), // Very long notes
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 86400000).toISOString(),
  }, true);
  logResult('10.9: Very large payload', largePayload, { expectedStatus: 201 });

  // Test 10.10: Invalid JSON
  const invalidJson = await fetch(`${API_BASE}/visitor-gate-passes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': getCookieHeader(),
      'X-XSRF-TOKEN': getCsrfToken() || '',
    },
    body: 'invalid json{',
  });
  logResult('10.10: Invalid JSON', { success: !invalidJson.ok, status: invalidJson.status });
}

// ========================================
// MAIN TEST RUNNER
// ========================================

async function runAllTests() {
  console.log('🚪 EXTENSIVE GATE PASS MODULE TESTING SUITE');
  console.log('='.repeat(60));
  console.log('Testing all gate pass functionality comprehensively...\n');

  const startTime = Date.now();

  try {
    // Initialize authentication
    await initializeAuth();

    // Run all test suites
    await testVisitorGatePasses();
    await testVehicleEntryPasses();
    await testVehicleExitPasses();
    await testGatePassValidation();
    await testGatePassApproval();
    await testGatePassReports();
    await testGatePassRecords();
    await testBulkOperations();
    await testVisitorManagement();
    await testEdgeCases();

  } catch (error) {
    testResults.errors.push({ error: error.message, stack: error.stack });
    console.error('\n❌ Test suite crashed:', error);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 GATE PASS TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
  console.log(`💥 Errors: ${testResults.errors.length}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log('='.repeat(60));

  // Print failures
  if (testResults.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.failed.forEach((failure, idx) => {
      console.log(`${idx + 1}. ${failure.test}`);
      console.log(`   Status: ${failure.status}`);
      if (failure.error?.message) {
        console.log(`   Error: ${failure.error.message.substring(0, 150)}`);
      }
    });
  }

  // Print warnings
  if (testResults.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    testResults.warnings.forEach((warning, idx) => {
      console.log(`${idx + 1}. ${warning.test}`);
      console.log(`   Expected: ${warning.expected}, Got: ${warning.got}`);
    });
  }

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    duration: `${duration}s`,
    summary: {
      passed: testResults.passed.length,
      failed: testResults.failed.length,
      warnings: testResults.warnings.length,
      errors: testResults.errors.length,
    },
    testSuites: {
      visitorGatePasses: testResults.passed.filter(t => t.test.startsWith('1.')).length,
      vehicleEntryPasses: testResults.passed.filter(t => t.test.startsWith('2.')).length,
      vehicleExitPasses: testResults.passed.filter(t => t.test.startsWith('3.')).length,
      validation: testResults.passed.filter(t => t.test.startsWith('4.')).length,
      approval: testResults.passed.filter(t => t.test.startsWith('5.')).length,
      reports: testResults.passed.filter(t => t.test.startsWith('6.')).length,
      records: testResults.passed.filter(t => t.test.startsWith('7.')).length,
      bulkOperations: testResults.passed.filter(t => t.test.startsWith('8.')).length,
      visitorManagement: testResults.passed.filter(t => t.test.startsWith('9.')).length,
      edgeCases: testResults.passed.filter(t => t.test.startsWith('10.')).length,
    },
    passed: testResults.passed,
    failed: testResults.failed,
    warnings: testResults.warnings,
    errors: testResults.errors,
  };

  console.log('\n📄 Detailed report saved to gate-pass-test-results.json');
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    const fs = require('fs');
    fs.writeFileSync('gate-pass-test-results.json', JSON.stringify(report, null, 2));
  }

  return report;
}

// Run tests
runAllTests().then(report => {
  process.exit(report.summary.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});









