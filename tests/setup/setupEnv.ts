/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
// Basic polyfills or globals for tests
import '@jest/globals';
import { JSDOM } from 'jsdom';

console.log('SetupEnv running...');
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
});
global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
globalThis.document = dom.window.document;
globalThis.window = dom.window as any;

// Mock showToast to avoid DOM noise
(global as any).showToastCalls = [];
(global as any).showToast = function (msg: any, type: any) {
  (global as any).showToastCalls.push({ msg, type });
};
