#!/usr/bin/env node

/**
 * Nhost Authentication and Database Test Script
 * Tests authentication flow and database connectivity with Nhost.io
 */

import https from 'https';
import http from 'http';

// Nhost configuration - get from environment variables
const NHOST_SUBDOMAIN = process.env.NHOST_SUBDOMAIN || process.env.NHOST_PROJECT_ID;
const NHOST_REGION = process.env.NHOST_REGION || 'us-east-1';
const NHOST_ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET || process.env.ADMIN_SECRET_KEY;

// Construct Nhost URLs
const getNhostUrl = (service = 'auth') => {
  if (!NHOST_SUBDOMAIN) {
    throw new Error('NHOST_SUBDOMAIN or NHOST_PROJECT_ID environment variable is required');
  }
  return `https://${NHOST_SUBDOMAIN}.${NHOST_REGION}.nhost.run/v1/${service}`;
};

const getGraphQLUrl = () => {
  if (!NHOST_SUBDOMAIN) {
    throw new Error('NHOST_SUBDOMAIN or NHOST_PROJECT_ID environment variable is required');
  }
  return `https://${NHOST_SUBDOMAIN}.${NHOST_REGION}.nhost.run/v1/graphql`;
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test 1: Health Check
async function testHealthCheck() {
  console.log('\n🔍 Test 1: Health Check');
  console.log('─'.repeat(50));
  
  try {
    const healthUrl = getNhostUrl('healthz');
    console.log(`Checking: ${healthUrl}`);
    
    const response = await makeRequest(healthUrl);
    
    if (response.status === 200) {
      console.log('✅ Health check passed');
      console.log('Response:', response.data);
      return true;
    } else {
      console.log(`❌ Health check failed: Status ${response.status}`);
      console.log('Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

// Test 2: Authentication - Sign Up
async function testSignUp() {
  console.log('\n🔍 Test 2: User Sign Up');
  console.log('─'.repeat(50));
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    const authUrl = getNhostUrl('auth') + '/signup/email-password';
    console.log(`Signing up: ${testEmail}`);
    console.log(`URL: ${authUrl}`);
    
    const response = await makeRequest(authUrl, {
      method: 'POST',
      body: {
        email: testEmail,
        password: testPassword,
      },
    });
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Sign up successful');
      console.log('User ID:', response.data?.user?.id || response.data?.id);
      return { success: true, email: testEmail, password: testPassword, token: response.data?.session?.accessToken };
    } else {
      console.log(`❌ Sign up failed: Status ${response.status}`);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log('❌ Sign up error:', error.message);
    return { success: false, error: error.message };
  }
}

// Test 3: Authentication - Sign In
async function testSignIn(email, password) {
  console.log('\n🔍 Test 3: User Sign In');
  console.log('─'.repeat(50));
  
  try {
    const authUrl = getNhostUrl('auth') + '/signin/email-password';
    console.log(`Signing in: ${email}`);
    
    const response = await makeRequest(authUrl, {
      method: 'POST',
      body: {
        email: email,
        password: password,
      },
    });
    
    if (response.status === 200) {
      console.log('✅ Sign in successful');
      console.log('Access Token:', response.data?.session?.accessToken?.substring(0, 20) + '...');
      return { success: true, token: response.data?.session?.accessToken, user: response.data?.user };
    } else {
      console.log(`❌ Sign in failed: Status ${response.status}`);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log('❌ Sign in error:', error.message);
    return { success: false, error: error.message };
  }
}

// Test 4: Database Query via GraphQL
async function testDatabaseQuery(token) {
  console.log('\n🔍 Test 4: Database Query (GraphQL)');
  console.log('─'.repeat(50));
  
  try {
    const graphqlUrl = getGraphQLUrl();
    console.log(`Querying: ${graphqlUrl}`);
    
    // Simple query to test database connectivity
    const query = {
      query: `
        query {
          users {
            id
            email
            displayName
          }
        }
      `,
    };
    
    const response = await makeRequest(graphqlUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: query,
    });
    
    if (response.status === 200 && !response.data.errors) {
      console.log('✅ Database query successful');
      console.log('Users found:', response.data?.data?.users?.length || 0);
      return { success: true, data: response.data };
    } else {
      console.log(`❌ Database query failed: Status ${response.status}`);
      console.log('Errors:', response.data?.errors || response.data);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log('❌ Database query error:', error.message);
    return { success: false, error: error.message };
  }
}

// Test 5: Admin Secret Authentication
async function testAdminAuth() {
  console.log('\n🔍 Test 5: Admin Secret Authentication');
  console.log('─'.repeat(50));
  
  if (!NHOST_ADMIN_SECRET) {
    console.log('⚠️  NHOST_ADMIN_SECRET not set, skipping admin test');
    return { success: false, skipped: true };
  }
  
  try {
    // Test admin endpoint (if available)
    const adminUrl = getNhostUrl('auth') + '/user';
    console.log(`Testing admin auth with secret`);
    
    const response = await makeRequest(adminUrl, {
      method: 'GET',
      headers: {
        'x-hasura-admin-secret': NHOST_ADMIN_SECRET,
      },
    });
    
    if (response.status === 200) {
      console.log('✅ Admin authentication successful');
      return { success: true };
    } else {
      console.log(`❌ Admin authentication failed: Status ${response.status}`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log('❌ Admin authentication error:', error.message);
    return { success: false, error: error.message };
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Nhost.io Authentication & Database Test Suite');
  console.log('='.repeat(50));
  console.log(`Nhost Subdomain: ${NHOST_SUBDOMAIN || 'NOT SET'}`);
  console.log(`Nhost Region: ${NHOST_REGION}`);
  console.log(`Admin Secret: ${NHOST_ADMIN_SECRET ? 'SET' : 'NOT SET'}`);
  console.log('='.repeat(50));
  
  if (!NHOST_SUBDOMAIN) {
    console.error('\n❌ ERROR: NHOST_SUBDOMAIN or NHOST_PROJECT_ID environment variable is required');
    console.log('\nSet it with:');
    console.log('  export NHOST_SUBDOMAIN=your-project-id');
    console.log('  export NHOST_REGION=us-east-1');
    console.log('  export NHOST_ADMIN_SECRET=your-admin-secret');
    process.exit(1);
  }
  
  const results = {
    healthCheck: false,
    signUp: null,
    signIn: null,
    databaseQuery: null,
    adminAuth: null,
  };
  
  // Run tests sequentially
  results.healthCheck = await testHealthCheck();
  
  if (!results.healthCheck) {
    console.log('\n⚠️  Health check failed. Some tests may not work.');
  }
  
  results.signUp = await testSignUp();
  
  if (results.signUp.success) {
    results.signIn = await testSignIn(results.signUp.email, results.signUp.password);
    
    if (results.signIn.success && results.signIn.token) {
      results.databaseQuery = await testDatabaseQuery(results.signIn.token);
    }
  }
  
  results.adminAuth = await testAdminAuth();
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`Health Check:     ${results.healthCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Sign Up:          ${results.signUp?.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Sign In:          ${results.signIn?.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database Query:   ${results.databaseQuery?.success ? '✅ PASS' : results.databaseQuery ? '❌ FAIL' : '⏭️  SKIP'}`);
  console.log(`Admin Auth:       ${results.adminAuth?.skipped ? '⏭️  SKIP' : results.adminAuth?.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(50));
  
  const allPassed = results.healthCheck && 
                    results.signUp?.success && 
                    results.signIn?.success && 
                    (results.databaseQuery?.success || !results.databaseQuery);
  
  if (allPassed) {
    console.log('\n✅ All critical tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
