import { useContext } from "react";
import { MapContext } from "../contexts/MapContext";

/**
 * Safe hook to use MapContext - returns null if MapProvider is not available
 */
export const useMapSafe = () => {
  try {
    const context = useContext(MapContext as any) as any;
    return context || null;
  } catch (e) {
    return null;
  }
};
