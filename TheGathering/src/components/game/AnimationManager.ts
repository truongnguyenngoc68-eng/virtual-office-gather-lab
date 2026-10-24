/**
 * AnimationManager - Handles creating character animations
 */
export class AnimationManager {
  /**
   * Create animations for a character sprite
   */
  static createCharacterAnimations(
    scene: Phaser.Scene,
    key: string,
    opts?: { layout?: "simple3" | "lpc"; frameWidth?: number; frameHeight?: number }
  ): void {
    const layout = opts?.layout || "simple3";

    if (layout === "lpc") {
      const frameW = opts?.frameWidth || 64;
      const frameH = opts?.frameHeight || 64;
      const tex: any = (scene.textures as any).get(key);
      const sourceImg: any = tex?.getSourceImage?.();
      const sheetW = sourceImg?.width;
      const sheetH = sourceImg?.height;
      const cols = sheetW ? Math.floor(sheetW / frameW) : 0;
      const rows = sheetH ? Math.floor(sheetH / frameH) : 0;

      // Based on LPC layout (common): walk rows are around 8-11.
      // This project uses idle-down at row 10.
      const rowByDir: Record<string, number> = {
        up: 8,
        left: 9,
        down: 10,
        right: 11,
      };

      const directions = ["down", "left", "right", "up"] as const;
      directions.forEach((dir) => {
        const row = rowByDir[dir];
        if (!cols || !rows || row >= rows) return;

        const idx = (col: number) => row * cols + col;

        // Use 3-frame walk loop (0,1,2) with yoyo for smoothness
        scene.anims.create({
          key: `${key}-walk-${dir}`,
          frames: [
            { key, frame: idx(0) },
            { key, frame: idx(1) },
            { key, frame: idx(2) },
          ],
          frameRate: 8,
          repeat: -1,
          yoyo: true,
        });

        scene.anims.create({
          key: `${key}-idle-${dir}`,
          frames: [{ key, frame: idx(0) }],
          frameRate: 1,
          repeat: -1,
        });
      });

      return;
    }

    // Default: simple spritesheets (first 3 frames reused for all directions)
    const directions = ["down", "left", "right", "up"];
    directions.forEach((dir) => {
      const startFrame = 0;
      scene.anims.create({
        key: `${key}-walk-${dir}`,
        frames: scene.anims.generateFrameNumbers(key, {
          frames: [startFrame, startFrame + 1, startFrame + 2],
        }),
        frameRate: 8,
        repeat: -1,
        yoyo: true,
      });
      scene.anims.create({
        key: `${key}-idle-${dir}`,
        frames: [{ key: key, frame: startFrame + 1 }],
        frameRate: 1,
        repeat: -1,
      });
    });
  }

  /**
   * Create all game animations
   */
  static createAllAnimations(scene: Phaser.Scene): void {
    this.createCharacterAnimations(scene, "player", { layout: "simple3" });
    this.createCharacterAnimations(scene, "npc1", { layout: "simple3" });
    this.createCharacterAnimations(scene, "npc2", { layout: "simple3" });
  }
}


