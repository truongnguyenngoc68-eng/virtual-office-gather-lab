/**
 * General helper utilities
 * Combines performance and mobile utilities
 */

// ============================================
// Performance Utilities
// ============================================

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Memoize function results
 */
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

/**
 * Request animation frame throttle
 */
export const rafThrottle = <T extends (...args: any[]) => any>(
  func: T
): ((...args: Parameters<T>) => void) => {
  let rafId: number | null = null;

  return (...args: Parameters<T>) => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
};

/**
 * Intersection Observer for lazy loading
 */
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) => {
  if (typeof IntersectionObserver === "undefined") {
    return null;
  }

  return new IntersectionObserver(callback, {
    rootMargin: "50px",
    threshold: 0.1,
    ...options,
  });
};

/**
 * Virtual scrolling helper
 */
export const getVisibleRange = (
  scrollTop: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number
) => {
  const start = Math.floor(scrollTop / itemHeight);
  const end = Math.min(
    start + Math.ceil(containerHeight / itemHeight) + 1,
    totalItems
  );

  return { start: Math.max(0, start), end };
};

// ============================================
// Mobile Utilities
// ============================================

/**
 * Check if device is mobile
 */
export const isMobile = (): boolean => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Check if device is touch device
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
};

/**
 * Get viewport dimensions
 */
export const getViewportSize = () => {
  if (typeof window === "undefined") {
    return { width: 0, height: 0 };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

/**
 * Check if viewport is mobile size
 */
export const isMobileViewport = (): boolean => {
  const { width } = getViewportSize();
  return width <= 768;
};

/**
 * Check if viewport is tablet size
 */
export const isTabletViewport = (): boolean => {
  const { width } = getViewportSize();
  return width > 768 && width <= 1024;
};

/**
 * Check if viewport is desktop size
 */
export const isDesktopViewport = (): boolean => {
  const { width } = getViewportSize();
  return width > 1024;
};

/**
 * Handle orientation change
 */
export const onOrientationChange = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("orientationchange", callback);
  window.addEventListener("resize", callback);

  return () => {
    window.removeEventListener("orientationchange", callback);
    window.removeEventListener("resize", callback);
  };
};

/**
 * Prevent zoom on double tap (mobile)
 */
export const preventDoubleTapZoom = () => {
  if (!isTouchDevice()) return;

  let lastTouchEnd = 0;
  document.addEventListener(
    "touchend",
    (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    false
  );
};

/**
 * Lock screen orientation (mobile)
 */
export const lockOrientation = async (
  orientation: "portrait" | "landscape" | "any"
) => {
  const orientationObj = (screen as any)?.orientation;
  if (!orientationObj || typeof orientationObj.lock !== "function") return;

  try {
    await orientationObj.lock?.(orientation);
  } catch (error) {
    console.warn("Failed to lock orientation:", error);
  }
};
