const globalObj =
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : typeof global !== "undefined"
        ? (global as any)
        : typeof self !== "undefined"
          ? self
          : {};

export const globalPolyfill = globalObj as typeof globalThis;
export { globalPolyfill as global };
export default globalPolyfill;
