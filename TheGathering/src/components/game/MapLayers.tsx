import { useEffect, useRef } from "react";
import { useObjects } from "../../contexts/ObjectContext";
import { useMap } from "../../contexts/MapContext";
import { Zone, getZoneBounds } from "../../utils/zoneUtils";
import ObjectInteraction from "./ObjectInteraction";

/**
 * MapLayers - Combines ObjectsLayer and ZonesLayer into one component
 */
const MapLayers = () => {
  const { objects } = useObjects();
  const { mapData } = useMap();
  const zonesRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // Get object icon/emoji based on type
  const getObjectIcon = (type: string) => {
    switch (type) {
      case "whiteboard":
        return "📋";
      case "video":
        return "🎥";
      case "website":
        return "🌐";
      case "image":
        return "🖼️";
      case "document":
        return "📄";
      case "game":
        return "🎮";
      default:
        return "📦";
    }
  };

  // Convert game coordinates to screen coordinates
  const gameToScreen = (gameX: number, gameY: number) => {
    const gameContainer = document.getElementById("phaser-game");
    if (!gameContainer) return { x: gameX, y: gameY };

    const rect = gameContainer.getBoundingClientRect();
    return {
      x: rect.left + gameX,
      y: rect.top + gameY,
    };
  };

  // Render zones
  useEffect(() => {
    // Clean up old zones
    zonesRef.current.forEach((element) => {
      element.remove();
    });
    zonesRef.current.clear();

    if (!mapData?.zones || mapData.zones.length === 0) return;

    const gameContainer = document.getElementById("phaser-game");
    if (!gameContainer) return;

    const rect = gameContainer.getBoundingClientRect();

    // Render zones
    mapData.zones.forEach((zone: Zone) => {
      const bounds = getZoneBounds(zone);
      const zoneElement = document.createElement("div");
      zoneElement.className = "fixed border-2 border-dashed border-indigo-600/50 bg-indigo-600/10 pointer-events-none z-[999]";
      zoneElement.style.left = `${rect.left + bounds.x}px`;
      zoneElement.style.top = `${rect.top + bounds.y}px`;
      zoneElement.style.width = `${bounds.width}px`;
      zoneElement.style.height = `${bounds.height}px`;
      zoneElement.setAttribute("data-zone-id", zone.id);
      zoneElement.setAttribute("title", zone.name);

      document.body.appendChild(zoneElement);
      zonesRef.current.set(zone.id, zoneElement);
    });

    return () => {
      zonesRef.current.forEach((element) => {
        element.remove();
      });
      zonesRef.current.clear();
    };
  }, [mapData?.zones]);

  return (
    <>
      {/* Render objects trên map */}
      {objects.map((object) => {
        const screenPos = gameToScreen(object.position.x, object.position.y);
        return (
          <div
            key={object.objectId}
            className="fixed pointer-events-none z-[1000] flex flex-col items-center gap-1"
            style={{
              left: `${screenPos.x}px`,
              top: `${screenPos.y}px`,
            }}
          >
            <div className="text-2xl bg-white/90 rounded-full w-10 h-10 flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.2)] border-2 border-indigo-600">{getObjectIcon(object.type)}</div>
            <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none">{object.name}</div>
          </div>
        );
      })}

      {/* Render ObjectInteraction components để handle interaction */}
      {objects.map((object) => (
        <ObjectInteraction
          key={`interact-${object.objectId}`}
          object={object}
        />
      ))}
    </>
  );
};

export default MapLayers;
