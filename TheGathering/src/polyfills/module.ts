export {};

// Polyfill module for CommonJS compatibility in browser
if (typeof (globalThis as any).module === "undefined") {
  (globalThis as any).module = { exports: {} };
}

// Also set on window for compatibility
if (typeof window !== "undefined") {
  (window as any).module = (globalThis as any).module;
}

// Ensure module.exports exists
if (!(globalThis as any).module.exports) {
  (globalThis as any).module.exports = {};
}
