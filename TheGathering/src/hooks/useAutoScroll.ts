import { useRef, useEffect } from "react";

/**
 * Custom hook for auto-scrolling to bottom when dependencies change
 * Commonly used for chat messages, logs, etc.
 */
export const useAutoScroll = <T>(dependencies: T[]) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, dependencies);

  return scrollRef;
};
