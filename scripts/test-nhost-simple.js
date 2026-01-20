#!/usr/bin/env node

/**
 * Simple Nhost Test - Works with admin secret only
 * Tests basic connectivity and admin authentication
 */

import https from 'https';

// Get configuration from environment or command line args
const NHOST_SUBDOMAIN = process.env.NHOST_SUBDOMAIN || process.argv[2];
const NHOST_REGION = process.env.NHOST_REGION || process.argv[3] || 'us-east-1';
const NHOST_ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET || process.env.ADMIN_SECRET_KEY || process.argv[4] || "T#R9hd%p3QR3sRG)p^uy*%m'*BIv)DUx";

console.log('\n🔍 Nhost.io Quick Test');
console.log('='.repeat(60));
console.log(`Subdomain: ${NHOST_SUBDOMAIN || 'NOT SET (provide as first argument)'}`);
console.log(`Region: ${NHOST_REGION}`);
console.log(`Admin Secret: ${NHOST_ADMIN_SECRET ? 'SET ✅' : 'NOT SET ❌'}`);
console.log('='.repeat(60));

if (!NHOST_SUBDOMAIN) {
  console.log('\n❌ ERROR: Nhost subdomain/project ID required!');
  console.log('\nUsage:');
  console.log('  node scripts/test-nhost-simple.js YOUR_PROJECT_ID [region] [admin-secret]');
  console.log('\nOr set environment variables:');
  console.log('  export NHOST_SUBDOMAIN=your-project-id');
  console.log('  export NHOST_REGION=us-east-1');
  console.log('  export NHOST_ADMIN_SECRET=your-secret');
  console.log('\nTo find your project ID:');
  console.log('  1. Go to https://app.nhost.io');
  console.log('  2. Select your project');
  console.log('  3. Go to Settings → API');
  console.log('  4. Copy the Project ID (subdomain)');
  process.exit(1);
}

// Helper to make HTTPS requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

// Test 1: Health Check
async function testHealth() {
  console.log('\n📡 Test 1: Health Check');
  try {
    const url = `https://${NHOST_SUBDOMAIN}.${NHOST_REGION}.nhost.run/v1/healthz`;
    console.log(`   URL: ${url}`);
    const result = await makeRequest(url);
    
    if (result.status === 200) {
      console.log('   ✅ Health check passed');
      return true;
    } else {
      console.log(`   ❌ Failed (Status: ${result.status})`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

// Test 2: Admin Secret Authentication
async function testAdminAuth() {
  console.log('\n🔐 Test 2: Admin Secret Authentication');
  try {
    const url = `https://${NHOST_SUBDOMAIN}.${NHOST_REGION}.nhost.run/v1/graphql`;
    console.log(`   URL: ${url}`);
    
    // Try a simple GraphQL query with admin secret
    const query = {
      query: `query { __typename }`
    };
    
    const result = await makeRequest(url, {
      method: 'POST',
      headers: {
        'x-hasura-admin-secret': NHOST_ADMIN_SECRET,
      },
      body: query,
    });
    
    if (result.status === 200 && !result.data.errors) {
      console.log('   ✅ Admin authentication successful');
      console.log('   Response:', JSON.stringify(result.data, null, 2));
      return true;
    } else {
      console.log(`   ❌ Failed (Status: ${result.status})`);
      console.log('   Response:', JSON.stringify(result.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

// Test 3: Auth Endpoint Check
async function testAuthEndpoint() {
  console.log('\n🔑 Test 3: Auth Endpoint Availability');
  try {
    const url = `https://${NHOST_SUBDOMAIN}.${NHOST_REGION}.nhost.run/v1/auth`;
    console.log(`   URL: ${url}`);
    
    // Try to get auth configuration
    const result = await makeRequest(url);
    
    if (result.status === 200 || result.status === 404) {
      console.log('   ✅ Auth endpoint accessible');
      return true;
    } else {
      console.log(`   ⚠️  Status: ${result.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

// Test 4: Database Query with Admin Secret
async function testDatabaseQuery() {
  console.log('\n💾 Test 4: Database Query (GraphQL)');
  try {
    const url = `https://${NHOST_SUBDOMAIN}.${NHOST_REGION}.nhost.run/v1/graphql`;
    console.log(`   URL: ${url}`);
    
    // Query to check if database is accessible
    const query = {
      query: `
        query {
          __schema {
            queryType {
              name
            }
          }
        }
      `
    };
    
    const result = await makeRequest(url, {
      method: 'POST',
      headers: {
        'x-hasura-admin-secret': NHOST_ADMIN_SECRET,
      },
      body: query,
    });
    
    if (result.status === 200 && result.data.data) {
      console.log('   ✅ Database/GraphQL accessible');
      console.log('   Schema available:', result.data.data.__schema ? 'Yes' : 'No');
      return true;
    } else {
      console.log(`   ❌ Failed (Status: ${result.status})`);
      if (result.data.errors) {
        console.log('   Errors:', JSON.stringify(result.data.errors, null, 2));
      }
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

// Test 5: User Sign Up (if possible)
async function testUserSignUp() {
  console.log('\n👤 Test 5: User Sign Up');
  try {
    const url = `https://${NHOST_SUBDOMAIN}.${NHOST_REGION}.nhost.run/v1/auth/signup/email-password`;
    console.log(`   URL: ${url}`);
    
    const testEmail = `test-${Date.now()}@test.com`;
    const testPassword = 'TestPassword123!';
    
    const result = await makeRequest(url, {
      method: 'POST',
      body: {
        email: testEmail,
        password: testPassword,
      },
    });
    
    if (result.status === 200 || result.status === 201) {
      console.log('   ✅ User sign up successful');
      console.log('   User ID:', result.data?.user?.id || 'N/A');
      return { success: true, email: testEmail, password: testPassword, token: result.data?.session?.accessToken };
    } else {
      console.log(`   ⚠️  Sign up response: ${result.status}`);
      console.log('   Response:', JSON.stringify(result.data, null, 2));
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false };
  }
}

// Run all tests
async function runTests() {
  const results = {
    health: false,
    adminAuth: false,
    authEndpoint: false,
    databaseQuery: false,
    signUp: null,
  };
  
  results.health = await testHealth();
  results.adminAuth = await testAdminAuth();
  results.authEndpoint = await testAuthEndpoint();
  results.databaseQuery = await testDatabaseQuery();
  results.signUp = await testUserSignUp();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`Health Check:        ${results.health ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Admin Auth:          ${results.adminAuth ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Auth Endpoint:       ${results.authEndpoint ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database Query:      ${results.databaseQuery ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`User Sign Up:        ${results.signUp?.success ? '✅ PASS' : '⚠️  CHECK'}`);
  console.log('='.repeat(60));
  
  const criticalPassed = results.health && results.adminAuth && results.databaseQuery;
  
  if (criticalPassed) {
    console.log('\n✅ Critical tests passed! Nhost is working correctly.');
    console.log('\nNext steps:');
    console.log('  1. Integrate Nhost SDK into your app');
    console.log('  2. Update authentication code to use Nhost');
    console.log('  3. Test end-to-end user flow');
  } else {
    console.log('\n⚠️  Some critical tests failed. Check the errors above.');
    console.log('\nTroubleshooting:');
    console.log('  - Verify your project ID is correct');
    console.log('  - Check if your project is active in Nhost dashboard');
    console.log('  - Verify the admin secret is correct');
    console.log('  - Ensure your project region matches');
  }
  
  process.exit(criticalPassed ? 0 : 1);
}

runTests().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
