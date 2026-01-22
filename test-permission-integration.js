/**
 * Integration Test: Enhanced Permission System
 * 
 * Simulates complete user flow for testing the enhanced permission system:
 * 1. Login
 * 2. Create user with enhanced capabilities
 * 3. Edit user and update enhanced capabilities
 * 4. Test permission templates
 * 5. Test permission checking
 * 6. Test data masking rules
 */

const API_BASE = 'http://127.0.0.1:8000/api';
let cookieJar = [];

// Helper function to extract cookies from response
function extractCookies(response) {
  const setCookieHeaders = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
  setCookieHeaders.forEach(cookie => {
    const [nameValue] = cookie.split(';');
    const [name, value] = nameValue.split('=');
    // Remove existing cookie with same name
    cookieJar = cookieJar.filter(c => !c.startsWith(name + '='));
    cookieJar.push(nameValue.trim());
  });
}

// Helper function to get cookie header string
function getCookieHeader() {
  return cookieJar.join('; ');
}

// Helper function to get CSRF token from cookies
function getCsrfToken() {
  for (const cookie of cookieJar) {
    if (cookie.startsWith('XSRF-TOKEN=')) {
      return decodeURIComponent(cookie.split('=')[1].split(';')[0]);
    }
  }
  return null;
}

// Helper function to make API requests
async function apiRequest(method, path, data = null, useAuth = true) {
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

  const response = await fetch(url, options);
  
  // Extract and store cookies
  extractCookies(response);

  const responseData = await response.json().catch(() => ({}));
  
  return {
    status: response.status,
    data: responseData,
    headers: response.headers,
  };
}

// Test 1: Login
async function testLogin() {
  console.log('\n=== Test 1: Login ===');
  
  // First get CSRF cookie
  const csrfResponse = await fetch('http://127.0.0.1:8000/sanctum/csrf-cookie', {
    method: 'GET',
    credentials: 'include',
  });
  extractCookies(csrfResponse);
  console.log('CSRF cookies obtained');

  const result = await apiRequest('POST', '/login', {
    employee_id: 'SUPER001',
    password: 'password'
  }, true);

  console.log('Login Status:', result.status);
  console.log('Login Response:', JSON.stringify(result.data, null, 2));
  console.log('Cookies after login:', cookieJar.length, 'cookies stored');
  
  if (result.status === 200) {
    console.log('✅ Login successful');
    return true;
  } else {
    console.log('❌ Login failed');
    return false;
  }
}

// Test 2: Create User with Enhanced Capabilities
async function testCreateUserWithEnhancedCapabilities() {
  console.log('\n=== Test 2: Create User with Enhanced Capabilities ===');
  
  // Create user with unique ID
  const timestamp = Date.now();
  const employeeId = `TEST${timestamp}`;
  const email = `test${timestamp}@example.com`;
  
  const userResult = await apiRequest('POST', '/v1/users', {
    employee_id: employeeId,
    name: 'Test User',
    email: email,
    password: 'password123',
    role: 'inspector',
    capabilities: {
      gate_pass: ['read'],
      inspection: ['create', 'read'],
    },
    is_active: true,
  });

  console.log('Create User Status:', userResult.status);
  console.log('Create User Response:', JSON.stringify(userResult.data, null, 2));

  if (userResult.status !== 201 && userResult.status !== 200) {
    console.log('❌ User creation failed');
    return null;
  }

  const userId = userResult.data?.data?.id || userResult.data?.id;
  console.log('✅ User created with ID:', userId);

  // Add enhanced capabilities
  const enhancedCap1 = await apiRequest('POST', `/v1/users/${userId}/enhanced-capabilities`, {
    module: 'gate_pass',
    action: 'read',
    scope: { type: 'own_only' },
    time_restrictions: {
      days_of_week: [1, 2, 3, 4, 5], // Monday to Friday
      time_of_day: {
        start: '09:00',
        end: '17:00'
      }
    },
    reason: 'Test enhanced capability with time restrictions',
  });

  console.log('Enhanced Capability 1 Status:', enhancedCap1.status);
  console.log('Enhanced Capability 1 Response:', JSON.stringify(enhancedCap1.data, null, 2));

  const enhancedCap2 = await apiRequest('POST', `/v1/users/${userId}/enhanced-capabilities`, {
    module: 'inspection',
    action: 'create',
    scope: { type: 'yard_only' },
    conditions: {
      combine_with: 'AND',
      conditions: [
        {
          field: 'status',
          operator: '==',
          value: 'pending'
        }
      ]
    },
    reason: 'Test enhanced capability with conditions',
  });

  console.log('Enhanced Capability 2 Status:', enhancedCap2.status);
  console.log('Enhanced Capability 2 Response:', JSON.stringify(enhancedCap2.data, null, 2));

  if (enhancedCap1.status === 201 && enhancedCap2.status === 201) {
    console.log('✅ Enhanced capabilities created successfully');
  } else {
    console.log('❌ Some enhanced capabilities failed to create');
  }

  return userId;
}

// Test 3: Get User with Enhanced Capabilities
async function testGetUserWithEnhancedCapabilities(userId) {
  console.log('\n=== Test 3: Get User with Enhanced Capabilities ===');
  
  const userResult = await apiRequest('GET', `/v1/users/${userId}`);
  console.log('Get User Status:', userResult.status);
  console.log('User Data:', JSON.stringify(userResult.data, null, 2));

  const enhancedCapsResult = await apiRequest('GET', `/v1/users/${userId}/enhanced-capabilities`);
  console.log('Enhanced Capabilities Status:', enhancedCapsResult.status);
  console.log('Enhanced Capabilities:', JSON.stringify(enhancedCapsResult.data, null, 2));

  if (enhancedCapsResult.status === 200 && enhancedCapsResult.data?.data?.length > 0) {
    console.log('✅ Successfully retrieved user with enhanced capabilities');
    return true;
  } else {
    console.log('❌ Failed to retrieve enhanced capabilities');
    return false;
  }
}

// Test 4: Update Enhanced Capabilities
async function testUpdateEnhancedCapabilities(userId) {
  console.log('\n=== Test 4: Update Enhanced Capabilities ===');
  
  // Get existing capabilities
  const getResult = await apiRequest('GET', `/v1/users/${userId}/enhanced-capabilities`);
  const capabilities = getResult.data?.data || [];
  
  if (capabilities.length === 0) {
    console.log('❌ No capabilities to update');
    return false;
  }

  const capId = capabilities[0].id;
  const updateResult = await apiRequest('PUT', `/v1/users/${userId}/enhanced-capabilities/${capId}`, {
    scope: { type: 'all' },
    reason: 'Updated to allow all records',
  });

  console.log('Update Status:', updateResult.status);
  console.log('Update Response:', JSON.stringify(updateResult.data, null, 2));

  if (updateResult.status === 200) {
    console.log('✅ Enhanced capability updated successfully');
    return true;
  } else {
    console.log('❌ Failed to update enhanced capability');
    return false;
  }
}

// Test 5: Permission Templates
async function testPermissionTemplates() {
  console.log('\n=== Test 5: Permission Templates ===');
  
  // Create template
  const createResult = await apiRequest('POST', '/v1/permission-templates', {
    name: 'Test Inspector Template',
    description: 'Template for testing inspector permissions',
    icon: 'shield',
    capabilities: {
      gate_pass: ['read'],
      inspection: ['create', 'read', 'update'],
      enhanced_capabilities: [
        {
          module: 'inspection',
          action: 'create',
          scope: { type: 'own_only' },
          reason: 'Can only create own inspections',
        }
      ]
    },
    recommended_for_roles: ['inspector'],
  });

  console.log('Create Template Status:', createResult.status);
  console.log('Create Template Response:', JSON.stringify(createResult.data, null, 2));

  if (createResult.status !== 201) {
    console.log('❌ Template creation failed');
    return null;
  }

  const templateId = createResult.data?.data?.id || createResult.data?.id;
  console.log('✅ Template created with ID:', templateId);

  // Get all templates
  const listResult = await apiRequest('GET', '/v1/permission-templates');
  console.log('Templates List Status:', listResult.status);
  console.log('Templates Count:', listResult.data?.data?.length || 0);

  return templateId;
}

// Test 6: Permission Testing
async function testPermissionChecking(userId) {
  console.log('\n=== Test 6: Permission Checking ===');
  
  // Test single permission check
  const checkResult = await apiRequest('POST', '/v1/permissions/check', {
    user_id: userId,
    module: 'gate_pass',
    action: 'read',
    context: {
      record: {
        created_by: userId,
        yard_id: null,
      }
    }
  });

  console.log('Permission Check Status:', checkResult.status);
  console.log('Permission Check Result:', JSON.stringify(checkResult.data, null, 2));

  if (checkResult.status === 200) {
    console.log('✅ Permission check successful');
    console.log('Allowed:', checkResult.data?.data?.allowed);
    return true;
  } else {
    console.log('❌ Permission check failed');
    return false;
  }
}

// Test 7: Data Masking Rules
async function testDataMaskingRules() {
  console.log('\n=== Test 7: Data Masking Rules ===');
  
  // Create masking rule
  const createResult = await apiRequest('POST', '/v1/masking-rules', {
    module: 'gate_pass',
    field: 'sensitive_data',
    mask_type: 'partial',
    visible_to_roles: ['admin', 'super_admin'],
  });

  console.log('Create Masking Rule Status:', createResult.status);
  console.log('Create Masking Rule Response:', JSON.stringify(createResult.data, null, 2));

  if (createResult.status === 201) {
    console.log('✅ Data masking rule created successfully');
    
    // Get all rules
    const listResult = await apiRequest('GET', '/v1/masking-rules');
    console.log('Masking Rules List Status:', listResult.status);
    console.log('Masking Rules Count:', listResult.data?.data?.length || 0);
    
    return true;
  } else {
    console.log('❌ Data masking rule creation failed');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Enhanced Permission System Integration Tests\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Login
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.log('\n❌ Login failed. Cannot continue with other tests.');
      return;
    }

    // Test 2: Create user with enhanced capabilities
    const userId = await testCreateUserWithEnhancedCapabilities();
    if (!userId) {
      console.log('\n❌ User creation failed. Cannot continue with user-related tests.');
      return;
    }

    // Test 3: Get user with enhanced capabilities
    await testGetUserWithEnhancedCapabilities(userId);

    // Test 4: Update enhanced capabilities
    await testUpdateEnhancedCapabilities(userId);

    // Test 5: Permission templates
    await testPermissionTemplates();

    // Test 6: Permission checking
    await testPermissionChecking(userId);

    // Test 7: Data masking rules
    await testDataMaskingRules();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All integration tests completed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error('Stack:', error.stack);
  }
}

// Run tests
runAllTests();

