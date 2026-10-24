/**
 * AssetLoader - Handles loading all game assets (sprites, tiles, objects)
 */
export class AssetLoader {
  /**
   * Preload all game assets
   */
  static preload(scene: Phaser.Scene): void {
    // Load Map and Tileset
    scene.load.image("tiles", "/assets/tiles/office.png");
    scene.load.tilemapTiledJSON("map", "/assets/map_layered.json");

    // Load Characters
    scene.load.spritesheet("player", "/assets/characters/player.png", { frameWidth: 32, frameHeight: 48 });
    scene.load.spritesheet("npc1", "/assets/characters/npc1.png", { frameWidth: 32, frameHeight: 48 });
    scene.load.spritesheet("npc2", "/assets/characters/npc2.png", { frameWidth: 32, frameHeight: 48 });

    // Load Office Objects
    scene.load.image("desk", "/assets/objects/Desk_Ornate.png");
    scene.load.image("laptop", "/assets/objects/Laptop.png");
    scene.load.image("water_cooler", "/assets/objects/Water_Cooler.png");
    scene.load.image("coffee_maker", "/assets/objects/Coffee_Maker.png");
    scene.load.image("coffee_cup", "/assets/objects/Coffee_Cup.png");
    scene.load.image("tv", "/assets/objects/TV_Widescreen.png");
    scene.load.image("bin", "/assets/objects/Bins.png");
    scene.load.image("card_table", "/assets/objects/Card_Table.png");
    scene.load.image("copy_machine", "/assets/objects/Copy_Machine.png");
    scene.load.image("sink", "/assets/objects/Sink.png");
    scene.load.image("mailboxes", "/assets/objects/Mailboxes.png");
  }
}


