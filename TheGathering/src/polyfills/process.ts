// Polyfill for Node.js process.nextTick in browser
// Used by simple-peer and other Node.js modules

// Ensure process is available on globalThis
if (typeof globalThis.process === 'undefined') {
  (globalThis as any).process = {};
}

// Ensure process.nextTick is available
if (typeof (globalThis as any).process.nextTick === 'undefined') {
  (globalThis as any).process.nextTick = function nextTick(callback: (...args: any[]) => void, ...args: any[]) {
    // Use queueMicrotask for better performance, fallback to setTimeout
    if (typeof queueMicrotask !== 'undefined') {
      queueMicrotask(() => {
        callback(...args);
      });
    } else {
      setTimeout(() => {
        callback(...args);
      }, 0);
    }
  };
}

// Ensure process.env is available
if (typeof (globalThis as any).process.env === 'undefined') {
  (globalThis as any).process.env = {};
}

// Set other process properties
(globalThis as any).process.version = '';
(globalThis as any).process.versions = {};
(globalThis as any).process.platform = 'browser';
(globalThis as any).process.browser = true;

// Also set on window for compatibility
if (typeof window !== 'undefined') {
  (window as any).process = (globalThis as any).process;
}

export default (globalThis as any).process;



