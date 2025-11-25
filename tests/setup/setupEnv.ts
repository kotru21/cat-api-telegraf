/**
 * Test setup for Bun with happy-dom
 * Registers DOM globals for frontend component testing
 */
import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Register happy-dom globals (window, document, etc.)
GlobalRegistrator.register();

// Mock showToast to avoid DOM noise in tests
interface ShowToastCall {
  msg: string;
  type: string;
}

declare global {
  var showToastCalls: ShowToastCall[];
  var showToast: (msg: string, type: string) => void;
  var PLACEHOLDER: { SMALL: string };
}

globalThis.showToastCalls = [];
globalThis.showToast = function (msg: string, type: string) {
  globalThis.showToastCalls.push({ msg, type });
};

// Common test placeholder
globalThis.PLACEHOLDER = { SMALL: '' };
