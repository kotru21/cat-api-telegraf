// Basic polyfills or globals for tests
import "@jest/globals";

// Mock showToast to avoid DOM noise
global.showToastCalls = [];
global.showToast = function (msg, type) {
  showToastCalls.push({ msg, type });
};
