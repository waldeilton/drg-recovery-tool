// Test environment setup
// This file runs before all tests

// Suppress console output during tests (uncomment if needed)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Extend Jest matchers if needed
expect.extend({
  toBeValidDeviceId(received: string) {
    const pass = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(received);
    return {
      pass,
      message: () => `Expected ${received} to be a valid device ID`,
    };
  },
});

// Global test timeout
jest.setTimeout(10000);
