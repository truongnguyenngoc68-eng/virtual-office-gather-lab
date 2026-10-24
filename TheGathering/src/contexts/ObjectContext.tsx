import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useSocket } from "./SocketContext";

interface InteractiveObject {
  objectId: string;
  roomId: string;
  type: "whiteboard" | "video" | "website" | "image" | "document" | "game";
  name: string;
  position: { x: number; y: number };
  properties: {
    url?: string;
    content?: string;
    imageUrl?: string;
    documentUrl?: string;
    width?: number;
    height?: number;
    allowFullscreen?: boolean;
  };
}

interface ObjectContextType {
  objects: InteractiveObject[];
  loading: boolean;
  refreshObjects: () => Promise<void>;
  getObjectById: (objectId: string) => InteractiveObject | undefined;
}

const ObjectContext = createContext<ObjectContextType | undefined>(undefined);

export const useObjects = () => {
  const context = useContext(ObjectContext);
  if (!context) {
    throw new Error("useObjects must be used within ObjectProvider");
  }
  return context;
};

interface ObjectProviderProps {
  children: ReactNode;
}

export const ObjectProvider = ({ children }: ObjectProviderProps) => {
  const { currentUser } = useSocket();
  const [objects, setObjects] = useState<InteractiveObject[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchObjects = async () => {
    if (!currentUser?.roomId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_SERVER_URL || "http://localhost:5001"
        }/api/world/objects/room/${currentUser.roomId}`
      );
      if (response.ok) {
        const data = await response.json();
        setObjects(data || []);
      } else if (response.status === 404) {
        // Room might not have objects yet, set empty array
        setObjects([]);
      } else {
        console.error("Failed to fetch objects:", response.status);
      }
    } catch (error) {
      console.error("Error fetching objects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.roomId) {
      fetchObjects();
    }
  }, [currentUser?.roomId]);

  const refreshObjects = async () => {
    await fetchObjects();
  };

  const getObjectById = (objectId: string) => {
    return objects.find((obj) => obj.objectId === objectId);
  };

  return (
    <ObjectContext.Provider
      value={{
        objects,
        loading,
        refreshObjects,
        getObjectById,
      }}
    >
      {children}
    </ObjectContext.Provider>
  );
};
