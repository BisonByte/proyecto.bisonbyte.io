if (typeof globalThis.global === 'undefined') {
  (globalThis as typeof globalThis & { global: typeof globalThis }).global = globalThis;
}
