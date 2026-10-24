import { lazy, Suspense, ComponentType, LazyExoticComponent } from "react";

/**
 * Lazy loading utilities for code splitting
 */

// Lazy load components (type-erased to avoid props inference issues)
const lazyAny = (loader: () => Promise<{ default: ComponentType<any> }>): LazyExoticComponent<ComponentType<any>> =>
  lazy(loader) as LazyExoticComponent<ComponentType<any>>;

export const LazyEventModal = lazyAny(() => import("../components/modals/EventModal"));
export const LazyNotificationPanel = lazyAny(
  () => import("../components/NotificationCenter")
);
export const LazyWhiteboard = lazyAny(() => import("../components/editor/Whiteboard"));

/**
 * Loading fallback component
 */
export const LoadingFallback = () => (
  <div className="flex items-center justify-center p-5 text-sm text-slate-400">
    <div className="flex items-center gap-2">
      <div className="inline-block w-4 h-4 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
      <span>Loading...</span>
    </div>
  </div>
);

/**
 * HOC for lazy loading with Suspense
 */
export const withLazyLoad = <P extends object>(Component: ComponentType<P>) => {
  return (props: P) => (
    <Suspense fallback={<LoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );
};
