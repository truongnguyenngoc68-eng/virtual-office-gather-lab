import { useEffect, useRef, useState } from "react";

/**
 * Custom hook for intersection observer
 */
export const useIntersectionObserver = (
  options?: IntersectionObserverInit
): [React.RefObject<HTMLElement | null>, boolean] => {
  const elementRef = useRef<HTMLElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [elementRef, isIntersecting];
};

