/**
 * MapRenderer - Handles map creation and rendering
 */
export class MapRenderer {
  private map?: Phaser.Tilemaps.Tilemap;
  private wallLayer?: Phaser.Tilemaps.TilemapLayer;
  private interactiveObjects?: Phaser.GameObjects.Group;
  private readonly DEPTH = {
    ground: 0,
    walls: 100,
    actorsBase: 200,
    decoration: 1000,
  };

  /**
   * Create the game map with all layers
   */
  createMap(scene: Phaser.Scene, mapData?: any): {
    map: Phaser.Tilemaps.Tilemap;
    wallLayer?: Phaser.Tilemaps.TilemapLayer;
    interactiveObjects?: Phaser.GameObjects.Group;
  } {
    try {
      this.map = scene.make.tilemap({ key: "map" });
      const tileset = this.map.addTilesetImage("office", "tiles");

      if (tileset) {
        // Ground layer
        this.map.createLayer("Ground", tileset, 0, 0)?.setDepth(this.DEPTH.ground);

        // Background Image (if any)
        if ((mapData as any)?.backgroundImage) {
          scene.load.image("background-custom", (mapData as any).backgroundImage);
          scene.load.once("complete", () => {
            scene.add.image(0, 0, "background-custom").setOrigin(0, 0).setDepth(-1);
          });
          scene.load.start();
        }

        // Wall layer with collision
        this.wallLayer = this.map.createLayer("World", tileset, 0, 0) || undefined;
        if (this.wallLayer) {
          this.wallLayer.setDepth(this.DEPTH.walls);
          this.wallLayer.setCollisionByExclusion([-1]);
        }

        // Decoration layer
        this.map.createLayer("Decoration", tileset, 0, 0)?.setDepth(this.DEPTH.decoration);

        // World/camera bounds
        const worldW = this.map.widthInPixels;
        const worldH = this.map.heightInPixels;
        scene.physics.world.setBounds(0, 0, worldW, worldH);
        scene.cameras.main.setBounds(0, 0, worldW, worldH);

        // Interactive objects layer
        this.interactiveObjects = scene.physics.add.group();
        const objectLayer = this.map.getObjectLayer("Interactions");
        if (objectLayer && objectLayer.objects) {
          objectLayer.objects.forEach((obj) => {
            const x = obj.x! + obj.width! / 2;
            const y = obj.y! + obj.height! / 2;
            const zone = scene.add.zone(x, y, obj.width!, obj.height!);
            scene.physics.world.enable(zone);
            (zone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
            (zone.body as Phaser.Physics.Arcade.Body).setImmovable(true);
            zone.setData("type", obj.type);
            zone.setData("name", obj.name);
            this.interactiveObjects?.add(zone);
          });
        }
      }
    } catch (error) {
      console.error("Error creating map:", error);
    }

    return {
      map: this.map!,
      wallLayer: this.wallLayer,
      interactiveObjects: this.interactiveObjects
    };
  }

  getWallLayer(): Phaser.Tilemaps.TilemapLayer | undefined {
    return this.wallLayer;
  }

  getInteractiveObjects(): Phaser.GameObjects.Group | undefined {
    return this.interactiveObjects;
  }
}

