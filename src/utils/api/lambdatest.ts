// LambdaTest API Integration
// Credentials are loaded from environment variables
// Set VITE_LAMBDATEST_USERNAME and VITE_LAMBDATEST_ACCESS_KEY in your .env file
const LAMBDATEST_USERNAME = import.meta.env.VITE_LAMBDATEST_USERNAME || '';
const LAMBDATEST_TOKEN = import.meta.env.VITE_LAMBDATEST_ACCESS_KEY || '';
const LAMBDATEST_API_BASE = 'https://api.lambdatest.com/automation/api/v1';

// Create Basic Auth header
const getAuthHeader = () => {
  if (!LAMBDATEST_USERNAME || !LAMBDATEST_TOKEN) {
    throw new Error(
      'LambdaTest credentials are not configured. Please set VITE_LAMBDATEST_USERNAME and VITE_LAMBDATEST_ACCESS_KEY in your .env file.'
    );
  }
  const credentials = btoa(`${LAMBDATEST_USERNAME}:${LAMBDATEST_TOKEN}`);
  return `Basic ${credentials}`;
};

// Make authenticated request to LambdaTest API
async function lambdaTestFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${LAMBDATEST_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `LambdaTest API error: ${response.statusText}`);
  }

  return response.json();
}

export interface LambdaTestBuild {
  build_id: string;
  name: string;
  status: string;
  duration: number;
  start_time: string;
  end_time?: string;
  test_count?: number;
  passed?: number;
  failed?: number;
}

export interface LambdaTestSession {
  session_id: string;
  build_id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  browser?: string;
  os?: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  test_type?: 'selenium' | 'cypress' | 'playwright' | 'puppeteer' | 'k6';
}

export interface LambdaTestConsoleLog {
  timestamp: string;
  level: string;
  message: string;
}

export const lambdaTestApi = {
  // Get all builds
  async getBuilds(params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const query = queryParams.toString();
    return lambdaTestFetch(`/builds${query ? `?${query}` : ''}`);
  },

  // Get build details
  async getBuildDetails(buildId: string) {
    return lambdaTestFetch(`/builds/${buildId}`);
  },

  // Get sessions for a build
  async getBuildSessions(buildId: string) {
    return lambdaTestFetch(`/builds/${buildId}/sessions`);
  },

  // Get session details
  async getSessionDetails(sessionId: string) {
    return lambdaTestFetch(`/sessions/${sessionId}`);
  },

  // Get console logs for a session
  async getSessionConsoleLogs(sessionId: string) {
    return lambdaTestFetch(`/sessions/${sessionId}/log/console`);
  },

  // Trigger a test build (this would typically be done via CI/CD or LambdaTest dashboard)
  // For now, we'll fetch existing builds and sessions
  async triggerTest(testType: 'selenium' | 'cypress' | 'playwright' | 'puppeteer' | 'k6', config?: any) {
    // Note: Actual test triggering requires LambdaTest's test execution API or CI/CD integration
    // This is a placeholder that returns a message
    return {
      message: `Test triggering for ${testType} requires LambdaTest CI/CD integration or API execution setup.`,
      testType,
      config,
    };
  },

  // Get all sessions (across all builds)
  async getAllSessions(params?: { limit?: number; offset?: number; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.status) queryParams.append('status', params.status);
    
    const query = queryParams.toString();
    return lambdaTestFetch(`/sessions${query ? `?${query}` : ''}`);
  },
};

