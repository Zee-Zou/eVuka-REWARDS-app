/**
 * Jest Test Setup
 * Configures global test environment and mocks
 */

// Import testing library matchers
require('@testing-library/jest-dom');

// Setup fake IndexedDB for offline storage tests
require('fake-indexeddb/auto');

// Mock the utils module to avoid issues with clsx and tailwind-merge in tests
jest.mock('@/lib/utils');

// Mock import.meta for Vite environment variables
// This must be set before any modules are imported
global.importMeta = {
  env: {
    VITE_SUPABASE_URL: "https://test.supabase.co",
    VITE_SUPABASE_ANON_KEY: "test-anon-key",
    VITE_ENABLE_OCR: "true",
    VITE_ENABLE_OFFLINE: "true",
    VITE_ENABLE_PWA: "true",
    VITE_DEBUG_LOGS: "false",
    VITE_ENABLE_EXTERNAL_LOGGING: "false",
    VITE_ENABLE_CSP: "false",
    VITE_WEBSOCKET_URL: "http://localhost:3001",
    VITE_VAPID_PUBLIC_KEY: "test-vapid-key",
    VITE_LOGGING_ENDPOINT: undefined,
    VITE_MONITORING_ENDPOINT: undefined,
    MODE: "test",
    DEV: false,
    PROD: false,
  },
};

// Mock Web Crypto API for encryption tests
const crypto = require('crypto');

Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr) => crypto.randomBytes(arr.length),
    subtle: {
      generateKey: jest.fn(),
      importKey: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
      digest: jest.fn((algorithm, data) => {
        return Promise.resolve(crypto.createHash('sha256').update(data).digest());
      }),
    },
  },
});

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() =>
        Promise.resolve({
          data: {
            session: {
              access_token: 'mock-jwt-token',
              user: { id: 'mock-user-id', email: 'test@example.com' },
            },
          },
          error: null,
        })
      ),
      getUser: jest.fn(() =>
        Promise.resolve({
          data: { user: { id: 'mock-user-id', email: 'test@example.com' } },
          error: null,
        })
      ),
      signInWithPassword: jest.fn(() =>
        Promise.resolve({
          data: {
            session: { access_token: 'mock-jwt-token' },
            user: { id: 'mock-user-id' },
          },
          error: null,
        })
      ),
      signUp: jest.fn(() =>
        Promise.resolve({
          data: {
            session: { access_token: 'mock-jwt-token' },
            user: { id: 'mock-user-id' },
          },
          error: null,
        })
      ),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      onAuthStateChange: jest.fn((callback) => {
        // Simulate initial auth state
        callback('SIGNED_IN', {
          access_token: 'mock-jwt-token',
          user: { id: 'mock-user-id' },
        });
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      }),
    },
    from: jest.fn((table) => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: { id: 'mock-id', [table]: 'mock-data' },
              error: null,
            })
          ),
          data: [],
          error: null,
        })),
        data: [],
        error: null,
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: { id: 'mock-inserted-id' },
              error: null,
            })
          ),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() =>
          Promise.resolve({
            data: { id: 'mock-updated-id' },
            error: null,
          })
        ),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}));

// Mock Socket.io client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    removeAllListeners: jest.fn(),
    auth: {},
  })),
}));

// Mock Tesseract.js for OCR tests
jest.mock('tesseract.js', () => ({
  createWorker: jest.fn(() =>
    Promise.resolve({
      loadLanguage: jest.fn(() => Promise.resolve()),
      initialize: jest.fn(() => Promise.resolve()),
      recognize: jest.fn(() =>
        Promise.resolve({
          data: {
            text: 'Mock OCR Text\nTotal: $50.00',
            confidence: 95,
          },
        })
      ),
      terminate: jest.fn(() => Promise.resolve()),
    })
  ),
}));

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Suppress console errors in tests (optional - comment out to see all errors)
// global.console.error = jest.fn();
// global.console.warn = jest.fn();

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  sessionStorageMock.clear();
  localStorageMock.clear();
});
