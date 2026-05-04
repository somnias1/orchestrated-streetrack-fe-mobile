'use strict';
// Expo's winter runtime installs globals as lazy getters. When MSW's CJS code
// accesses these globals, the lazy getters call require() which throws a
// jest-runtime ReferenceError outside test-code scope.
// We pre-define them with configurable:false so expo's installGlobal() skips
// them (it checks for configurable:false and returns early without overwriting).

const noop = {};

function freezeGlobal(name, value) {
  try {
    const existing = Object.getOwnPropertyDescriptor(global, name);
    if (!existing || existing.configurable) {
      Object.defineProperty(global, name, {
        value: value !== undefined ? value : global[name] ?? noop,
        writable: false,
        configurable: false,
        enumerable: false,
      });
    }
  } catch (_) {
    // Ignore if already locked
  }
}

freezeGlobal('__ExpoImportMetaRegistry', { url: null });
freezeGlobal('structuredClone', typeof structuredClone !== 'undefined' ? structuredClone : (v) => JSON.parse(JSON.stringify(v)));
freezeGlobal('TextDecoder', typeof TextDecoder !== 'undefined' ? TextDecoder : undefined);
freezeGlobal('TextEncoder', typeof TextEncoder !== 'undefined' ? TextEncoder : undefined);
freezeGlobal('URL', typeof URL !== 'undefined' ? URL : undefined);
freezeGlobal('URLSearchParams', typeof URLSearchParams !== 'undefined' ? URLSearchParams : undefined);
