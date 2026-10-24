import React from 'react';
import { useMap } from '../../contexts/MapContext';

interface SimplifiedMapProps {
    visible: boolean;
    onClose: () => void; // Add close handler
}

const SimplifiedMap: React.FC<SimplifiedMapProps> = ({ visible, onClose }) => {
    const { mapData } = useMap();

    if (!visible || !mapData?.zones) return null;

    // Assume game map is 60x40 tiles (1920x1280)
    // We will draw the map at a smaller scale in the UI (e.g., 800x600)
    const UI_WIDTH = 800;
    const SCALE_FACTOR = UI_WIDTH / 1920; // Auto-calculate scale

    const getZoneColor = (type: string) => {
        switch (type) {
            case 'meeting': return '#60A5FA'; // Blue
            case 'work': return '#34D399';    // Green
            case 'break': return '#FBBF24';   // Amber
            default: return '#9CA3AF';
        }
    };

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(26, 26, 26, 0.95)', // Dark background to hide game
            zIndex: 9999,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            backdropFilter: 'blur(5px)',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            {/* Map Container */}
            <div style={{
                position: 'relative',
                width: UI_WIDTH,
                height: 1280 * SCALE_FACTOR,
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                overflow: 'hidden'
            }}>
                <h2 style={{ position: 'absolute', top: 10, left: 20, margin: 0, color: '#333' }}>
                    🏢 Office Layout
                </h2>

                {/* Draw Zones */}
                {mapData.zones.map((zone: any) => (
                    <div
                        key={zone.id}
                        style={{
                            position: 'absolute',
                            left: zone.x * SCALE_FACTOR,
                            top: zone.y * SCALE_FACTOR,
                            width: zone.width * SCALE_FACTOR,
                            height: zone.height * SCALE_FACTOR,
                            backgroundColor: getZoneColor(zone.type),
                            opacity: 0.8,
                            border: '1px solid rgba(0,0,0,0.2)',
                            borderRadius: '4px',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            color: '#fff', fontWeight: 'bold', fontSize: '12px',
                            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
                        }}
                    >
                        {zone.name}
                    </div>
                ))}

                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: 10, right: 10,
                        padding: '8px 16px', background: '#EF4444', color: 'white',
                        border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                    }}
                >
                    Close Map (ESC)
                </button>
            </div>
        </div>
    );
};

export default SimplifiedMap;
