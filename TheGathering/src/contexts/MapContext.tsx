import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useSocket } from "./SocketContext";

export interface MapData {
  mapId: string;
  roomId: string;
  name: string;
  width: number;
  height: number;
  tileSize: number;
  tiles: number[][];
  collision: boolean[][];
  zones?: Array<{
    id: string;
    name: string;
    bounds: { x1: number; y1: number; x2: number; y2: number };
    maxUsers: number;
  }>;
}

interface MapContextType {
  mapData: MapData | null;
  loading: boolean;
  refreshMap: () => Promise<void>;
}

export const MapContext = createContext<MapContextType | undefined>(undefined);

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMap must be used within MapProvider");
  }
  return context;
};

interface MapProviderProps {
  children: ReactNode;
}

export const MapProvider = ({ children }: MapProviderProps) => {
  const { currentUser } = useSocket();
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMap = async () => {
    if (!currentUser?.roomId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_SERVER_URL || "http://localhost:5001"
        }/api/world/room/${currentUser.roomId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMapData(data);
      } else if (response.status === 404) {
        // Room might not have map yet, set null
        setMapData(null);
      } else {
        console.error("Failed to fetch map:", response.status);
      }
    } catch (error) {
      console.error("Error fetching map:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.roomId) {
      fetchMap();
    }
  }, [currentUser?.roomId]);

  const refreshMap = async () => {
    await fetchMap();
  };

  return (
    <MapContext.Provider
      value={{
        mapData,
        loading,
        refreshMap,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};
