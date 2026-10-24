/**
 * SpeechBubble - Handles displaying speech bubbles above players
 */
export class SpeechBubble {
  /**
   * Show a speech bubble above a player
   */
  static showSpeechBubble(
    scene: Phaser.Scene,
    container: Phaser.GameObjects.Container,
    message: string
  ): void {
    // Check if scene and container are valid
    if (!scene || !container || !scene.add) {
      console.warn("SpeechBubble: Invalid scene or container");
      return;
    }

    const existingBubble = container.getData("speechBubble");
    if (existingBubble) {
      existingBubble.destroy();
    }

    const bubbleContainer = scene.add.container(0, -60);

    const text = scene.add.text(
      0,
      0,
      message.length > 20 ? message.substring(0, 20) + "..." : message,
      {
        fontSize: "14px",
        color: "#000000",
        backgroundColor: "#ffffff",
        padding: { x: 8, y: 4 },
        align: "center"
      }
    );
    text.setOrigin(0.5);

    const bg = scene.add.graphics();
    bg.fillStyle(0xffffff, 1);
    bg.fillRoundedRect(
      -text.width / 2 - 4,
      -text.height / 2 - 4,
      text.width + 8,
      text.height + 8,
      8
    );
    bg.lineStyle(1, 0xcccccc, 1);
    bg.strokeRoundedRect(
      -text.width / 2 - 4,
      -text.height / 2 - 4,
      text.width + 8,
      text.height + 8,
      8
    );

    const tail = scene.add.graphics();
    tail.fillStyle(0xffffff, 1);
    tail.fillTriangle(
      0,
      text.height / 2 + 4,
      -6,
      text.height / 2 + 4,
      0,
      text.height / 2 + 10
    );

    bubbleContainer.add([bg, tail, text]);
    container.add(bubbleContainer);
    container.setData("speechBubble", bubbleContainer);

    scene.time.delayedCall(5000, () => {
      if (bubbleContainer.active) {
        bubbleContainer.destroy();
        container.setData("speechBubble", null);
      }
    });
  }
}


