/**
 * ObjectManager - Handles creating office objects
 */
export class ObjectManager {
  /**
   * Create all office objects in the scene
   */
  static createOfficeObjects(scene: Phaser.Scene, playerContainer?: Phaser.GameObjects.Container): void {
    const DEPTH_ACTORS_BASE = 200;
    const addObject = (key: string, x: number, y: number, scale = 1, collides = true) => {
      const obj = scene.physics.add.image(x, y, key);
      obj.setScale(scale);
      obj.setDepth(DEPTH_ACTORS_BASE + y);
      if (collides) {
        obj.setImmovable(true);
        obj.body.setSize(obj.width * 0.8, obj.height * 0.5);
        obj.body.setOffset(obj.width * 0.1, obj.height * 0.5);
        if (playerContainer) {
          scene.physics.add.collider(playerContainer, obj);
        }
      }
      return obj;
    };

    addObject("desk", 200, 200);
    scene.add.image(200, 190, "laptop").setScale(0.8).setDepth(DEPTH_ACTORS_BASE + 190);
    addObject("desk", 350, 200);
    scene.add.image(350, 190, "laptop").setScale(0.8).setDepth(DEPTH_ACTORS_BASE + 190);
    addObject("desk", 200, 350);
    scene.add.image(200, 340, "laptop").setScale(0.8).setDepth(DEPTH_ACTORS_BASE + 340);
    addObject("desk", 350, 350);
    scene.add.image(350, 340, "laptop").setScale(0.8).setDepth(DEPTH_ACTORS_BASE + 340);
    addObject("card_table", 600, 250, 1.2);
    scene.add.image(600, 240, "coffee_cup").setScale(0.5).setDepth(DEPTH_ACTORS_BASE + 240);
    scene.add.image(620, 260, "coffee_cup").setScale(0.5).setDepth(DEPTH_ACTORS_BASE + 260);
    addObject("water_cooler", 800, 100);
    addObject("coffee_maker", 850, 100);
    addObject("sink", 900, 100);
    addObject("bin", 950, 120, 1, false);
    addObject("copy_machine", 100, 500);
    addObject("mailboxes", 150, 500);
    const tv = addObject("tv", 600, 100);
    tv.setFlipX(false);
  }
}


