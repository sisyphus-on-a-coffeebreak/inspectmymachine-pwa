#!/usr/bin/env node

/**
 * Script to check users in the backend database
 * This script attempts to query the API for users
 */

import https from 'https';
import http from 'http';

const API_BASE = process.env.VITE_API_BASE || 'https://api.inspectmymachine.in/api';
const API_ORIGIN = process.env.VITE_API_ORIGIN || 'https://api.inspectmymachine.in/api';

console.log('🔍 Checking for users in the backend...\n');
console.log(`API Base: ${API_BASE}`);
console.log(`API Origin: ${API_ORIGIN}\n`);

// Try to get users from API
function checkUsers() {
  const url = new URL(`${API_BASE}/v1/users`);
  
  const options = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  };

  const client = url.protocol === 'https:' ? https : http;
  
  const req = client.request(url, options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        try {
          const users = JSON.parse(data);
          const userList = Array.isArray(users) ? users : (users.data || []);
          
          if (userList.length > 0) {
            console.log(`✅ Found ${userList.length} user(s):\n`);
            userList.forEach((user, index) => {
              console.log(`${index + 1}. Employee ID: ${user.employee_id || 'N/A'}`);
              console.log(`   Name: ${user.name || 'N/A'}`);
              console.log(`   Email: ${user.email || 'N/A'}`);
              console.log(`   Role: ${user.role || 'N/A'}`);
              console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);
              console.log(`   Last Login: ${user.last_login_at || 'Never'}`);
              console.log('');
            });
          } else {
            console.log('⚠️  No users found in the API response');
          }
        } catch (error) {
          console.log('❌ Error parsing response:', error.message);
          console.log('Response:', data);
        }
      } else if (res.statusCode === 401) {
        console.log('❌ Authentication required (401)');
        console.log('💡 You need to log in first. Try using the login credentials.');
      } else if (res.statusCode === 404) {
        console.log('⚠️  Users endpoint not found (404)');
        console.log('💡 The /api/v1/users endpoint may not be implemented yet in the backend.');
      } else {
        console.log(`❌ Error: ${res.statusCode} ${res.statusMessage}`);
        console.log('Response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Request error:', error.message);
    console.log('\n💡 Make sure the backend API is running and accessible.');
  });

  req.end();
}

// Also try to check the /api/user endpoint (current user)
function checkCurrentUser() {
  const url = new URL(API_ORIGIN.endsWith('/api') ? `${API_ORIGIN}/user` : `${API_ORIGIN}/api/user`);
  
  const options = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  };

  const client = url.protocol === 'https:' ? https : http;
  
  const req = client.request(url, options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          const user = response.user || response;
          console.log('\n📋 Current User Endpoint Response:');
          console.log(`   Employee ID: ${user.employee_id || 'N/A'}`);
          console.log(`   Name: ${user.name || 'N/A'}`);
          console.log(`   Email: ${user.email || 'N/A'}`);
          console.log(`   Role: ${user.role || 'N/A'}`);
        } catch (error) {
          console.log('❌ Error parsing current user response:', error.message);
        }
      } else if (res.statusCode === 401) {
        console.log('\n⚠️  Not authenticated - cannot check current user');
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Error checking current user:', error.message);
  });

  req.end();
}

// Run checks
checkUsers();
setTimeout(checkCurrentUser, 1000);

console.log('\n💡 Note: If you see 401 errors, you need valid login credentials.');
console.log('💡 If you see 404 errors, the users endpoint may not be implemented in the backend yet.');
console.log('💡 Check the backend Laravel application for user seeders or database migrations.\n');

