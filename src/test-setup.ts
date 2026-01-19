// Test setup for Google Ads compliance tests
// This file is run before each test suite

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  // Uncomment to suppress console.log during tests
  // log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set up any global test utilities or mocks here