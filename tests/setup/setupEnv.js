// Basic polyfills or globals for tests
import "@jest/globals";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock showToast to avoid DOM noise
global.showToastCalls = [];
global.showToast = function (msg, type) {
  showToastCalls.push({ msg, type });
};
