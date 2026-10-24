/**
 * ReactionDisplay - Hiển thị emoji reactions trên character trong game
 */

interface ReactionData {
  userId: string;
  reaction: string;
  timestamp: number;
}

export class ReactionDisplay {
  private scene: Phaser.Scene;
  private activeReactions: Map<string, Phaser.GameObjects.Text> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Hiển thị reaction trên character
   */
  showReaction(userId: string, reaction: string, characterContainer: Phaser.GameObjects.Container) {
    // Remove existing reaction for this user
    this.removeReaction(userId);

    // Create reaction text
    const reactionText = this.scene.add.text(0, -60, reaction, {
      fontSize: '32px',
      fontFamily: 'Arial',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
      resolution: 2
    });
    
    reactionText.setOrigin(0.5, 1);
    reactionText.setDepth(1000); // Very high depth to appear above everything

    // Add to container
    characterContainer.add(reactionText);

    // Store reference
    this.activeReactions.set(userId, reactionText);

    // Animation: Pop in and float up
    this.scene.tweens.add({
      targets: reactionText,
      scale: { from: 0, to: 1 },
      y: { from: -40, to: -80 },
      alpha: { from: 1, to: 0 },
      duration: 3000,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.removeReaction(userId);
      }
    });

    console.log(`✨ Showing reaction ${reaction} for user ${userId}`);
  }

  /**
   * Remove reaction for a specific user
   */
  removeReaction(userId: string) {
    const existingReaction = this.activeReactions.get(userId);
    if (existingReaction) {
      existingReaction.destroy();
      this.activeReactions.delete(userId);
    }
  }

  /**
   * Clear all reactions
   */
  clearAll() {
    this.activeReactions.forEach(text => text.destroy());
    this.activeReactions.clear();
  }

  /**
   * Cleanup on scene destroy
   */
  destroy() {
    this.clearAll();
  }
}
