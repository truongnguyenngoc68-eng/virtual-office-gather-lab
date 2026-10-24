/**
 * ZoneIndicator - Handles zone indicator UI
 */
import { getZoneForPosition } from "../../utils/zoneUtils";

export class ZoneIndicator {
  private zoneIndicator?: Phaser.GameObjects.Container;
  private zoneText?: Phaser.GameObjects.Text;

  /**
   * Create zone indicator UI
   */
  createIndicator(scene: Phaser.Scene): void {
    this.zoneIndicator = scene.add.container(10, 10);
    this.zoneIndicator.setScrollFactor(0);
    this.zoneIndicator.setDepth(1000);
    this.zoneIndicator.setVisible(false);

    const bg = scene.add.rectangle(0, 0, 200, 40, 0x000000, 0.7);
    bg.setOrigin(0, 0);

    this.zoneText = scene.add.text(10, 10, "", {
      fontSize: "16px",
      color: "#ffffff",
      fontStyle: "bold"
    });

    this.zoneIndicator.add([bg, this.zoneText]);
  }

  /**
   * Update zone indicator based on player position
   */
  updateIndicator(
    scene: Phaser.Scene,
    playerPosition: { x: number; y: number },
    mapData: any,
    setCurrentZone: (zone: { id: string; name: string } | null) => void
  ): void {
    if (!mapData?.zones) return;

    const zoneId = getZoneForPosition(
      playerPosition.x,
      playerPosition.y,
      mapData.zones
    );

    if (zoneId) {
      const zone = mapData.zones.find((z: any) => z.id === zoneId);
      if (zone) {
        this.zoneText?.setText(`🔊 ${zone.name}`);
        this.zoneIndicator?.setVisible(true);
        setCurrentZone({ id: zone.id, name: zone.name });
      }
    } else {
      this.zoneIndicator?.setVisible(false);
      setCurrentZone(null);
    }
  }
}


