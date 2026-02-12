/**
 * Mock for utils module used in tests
 */

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

function useLocalStorage(key, initialValue) {
  const setValue = (value) => {
    // Mock implementation
  };

  return [initialValue, setValue];
}

module.exports = {
  cn,
  useLocalStorage,
};
