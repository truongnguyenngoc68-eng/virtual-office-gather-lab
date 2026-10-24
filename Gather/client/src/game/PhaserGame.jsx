import { useEffect, useRef } from "react";
import Phaser from "phaser";
import OfficeScene from "./OfficeScene";

// Simple global bridge - Phaser scene reads/writes these
window.__GATHER__ = {
  playerName: "",
  players: {},
  myId: null,
  connected: false,
  onPlayersUpdate: null,
  onConnectionUpdate: null,
};

export default function PhaserGame({ playerName, onPlayersUpdate, onConnectionUpdate }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);

  // Set globals before Phaser starts
  window.__GATHER__.playerName = playerName;
  window.__GATHER__.onPlayersUpdate = onPlayersUpdate;
  window.__GATHER__.onConnectionUpdate = onConnectionUpdate;

  useEffect(() => {
    if (gameRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      pixelArt: true,
      backgroundColor: "#4A5568",
      scene: [OfficeScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });
    gameRef.current = game;

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
      }}
    />
  );
}
