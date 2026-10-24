// @ts-nocheck
// Import CommonJS modules as namespace - they use module.exports
// @ts-ignore
import * as inheritsModule from './inherits.js';
// @ts-ignore  
import * as deprecateModule from './util_deprecate.js';

// CommonJS modules exported via module.exports become default export when imported
// Access via .default or directly from namespace
const inherits = (inheritsModule as any).default || inheritsModule;
const deprecate = (deprecateModule as any).default || deprecateModule;

export { inherits, deprecate };

export function format(fmt) {
  return fmt;
}

export const TextDecoder = globalThis.TextDecoder;
export const TextEncoder = globalThis.TextEncoder;

export default {
  inherits,
  deprecate,
  format,
  TextDecoder,
  TextEncoder
};
