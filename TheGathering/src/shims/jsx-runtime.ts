import * as React from "react";

// Minimal shim for React 18 automatic JSX runtime.
// This avoids depending on the actual `react/jsx-runtime` implementation,
// which is causing Rollup interop issues on Netlify. It is sufficient for
// typical client-side rendering in this project.

type Props = Record<string, any> | null;

export function jsx(
  type: React.ElementType,
  props: Props,
  key?: string | number
) {
  return React.createElement(type as any, { ...(props || {}), key });
}

export const jsxs = jsx;

// Dev variant – map to same implementation for our purposes
export const jsxDEV = jsx;

