// @ts-nocheck
var inherits = require('./inherits');
var deprecate = require('./util_deprecate');

function format(fmt) {
  return fmt;
}

var TextDecoder = globalThis.TextDecoder;
var TextEncoder = globalThis.TextEncoder;

module.exports = {
  inherits: inherits,
  deprecate: deprecate,
  format: format,
  TextDecoder: TextDecoder,
  TextEncoder: TextEncoder,
  promisify: function(f) { return f; } // Minimal stub
};
