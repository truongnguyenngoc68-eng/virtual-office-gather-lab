/**
 * NPCManager - Handles NPC creation and updates
 */
export class NPCManager {
  private npcs: Phaser.GameObjects.Container[] = [];
  private lastUpdate = 0;
  private updateInterval = 200; // Update NPCs every 200ms instead of every frame

  /**
   * Create an NPC at the specified position
   */
  createNPC(
    scene: Phaser.Scene,
    x: number,
    y: number,
    name: string,
    playerContainer?: Phaser.GameObjects.Container
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    container.setSize(32, 32);
    scene.physics.world.enable(container);
    const body = container.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.setSize(24, 24);
    body.setOffset(-12, 12);

    const type = name === "Receptionist" ? "npc1" : "npc2";
    const sprite = scene.add.sprite(0, 0, type);
    container.add(sprite);

    const nameLabel = scene.add.text(0, -25, name, {
      fontSize: "12px",
      color: "#ffff00",
      backgroundColor: "#000000",
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5);
    container.add(nameLabel);

    sprite.play(`${type}-idle-down`, true);
    container.setData("sprite", sprite);
    container.setData("type", type);
    this.npcs.push(container);

    if (playerContainer) {
      scene.physics.add.collider(playerContainer, container);
    }

    return container;
  }

  /**
   * Update all NPCs (random movement)
   * Throttled to improve performance
   */
  updateNPCs(time?: number): void {
    // Throttle updates to reduce CPU usage
    const now = time || Date.now();
    if (now - this.lastUpdate < this.updateInterval) {
      return;
    }
    this.lastUpdate = now;

    this.npcs.forEach((npc) => {
      const body = npc.body as Phaser.Physics.Arcade.Body;
      const sprite = npc.getData("sprite") as Phaser.GameObjects.Sprite;
      const type = npc.getData("type") as string;

      if (Phaser.Math.Between(0, 1000) < 20) {
        const dir = Phaser.Math.Between(0, 4);
        const speed = 30;
        body.setVelocity(0);
        if (dir === 0) {
          sprite.play(`${type}-idle-down`, true);
        } else if (dir === 1) {
          body.setVelocityX(-speed);
          sprite.play(`${type}-walk-left`, true);
        } else if (dir === 2) {
          body.setVelocityX(speed);
          sprite.play(`${type}-walk-right`, true);
        } else if (dir === 3) {
          body.setVelocityY(-speed);
          sprite.play(`${type}-walk-up`, true);
        } else if (dir === 4) {
          body.setVelocityY(speed);
          sprite.play(`${type}-walk-down`, true);
        }
      }
      // Keep NPCs within bounds
      if (npc.x < 32) npc.x = 32;
      if (npc.y < 32) npc.y = 32;
      if (npc.x > 30 * 32 - 32) npc.x = 30 * 32 - 32;
      if (npc.y > 20 * 32 - 32) npc.y = 20 * 32 - 32;
    });
  }

  /**
   * Get all NPCs
   */
  getNPCs(): Phaser.GameObjects.Container[] {
    return this.npcs;
  }
}


