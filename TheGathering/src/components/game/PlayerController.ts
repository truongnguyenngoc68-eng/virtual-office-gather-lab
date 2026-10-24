/**
 * PlayerController - Handles player movement and input
 */
export class PlayerController {
  private playerContainer?: Phaser.GameObjects.Container;
  private playerSprite?: Phaser.GameObjects.Sprite;
  private playerPosition = { x: 100, y: 100 };
  private lastSentPosition = { x: 0, y: 0 };
  private moveSpeed = 150;
  private isSitting = false;
  private wasMoving = false;
  private lastDirection = "down";
  private lastSentTime = 0;
  private movementThrottleMs = 100; // Send position update max every 100ms (10 updates/sec)
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
  };

  /**
   * Initialize input controls
   */
  initInput(scene: Phaser.Scene): void {
    this.cursors = scene.input.keyboard?.createCursorKeys();
    this.wasd = {
      W: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      E: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    };
  }

  /**
   * Set player container and sprite
   */
  setPlayer(
    container: Phaser.GameObjects.Container,
    sprite: Phaser.GameObjects.Sprite
  ): void {
    this.playerContainer = container;
    this.playerSprite = sprite;
    this.playerPosition = { x: container.x, y: container.y };
    this.lastSentPosition = { x: container.x, y: container.y };
  }

  /**
   * Update player position based on input
   */
  updatePlayerPosition(
    scene: Phaser.Scene,
    socket: any,
    playAnimation: (animName: string) => void
  ): void {
    if (!this.playerContainer || !this.cursors) return;

    if (this.isSitting) {
      if (
        (this.wasd?.W && Phaser.Input.Keyboard.JustDown(this.wasd.W)) ||
        (this.wasd?.S && Phaser.Input.Keyboard.JustDown(this.wasd.S)) ||
        (this.wasd?.A && Phaser.Input.Keyboard.JustDown(this.wasd.A)) ||
        (this.wasd?.D && Phaser.Input.Keyboard.JustDown(this.wasd.D))
      ) {
        this.isSitting = false;
      } else {
        return;
      }
    }

    const body = this.playerContainer.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    let moved = false;
    let direction = "down";
    let anim = "idle-down";

    if (this.cursors.left.isDown || this.wasd?.A?.isDown) {
      body.setVelocityX(-this.moveSpeed);
      moved = true;
      direction = "left";
      anim = "walk-left";
      // For legacy "player" spritesheet, right direction is mirrored.
      // For LPC avatar spritesheets, left/right have distinct rows, so don't flip.
      if (this.playerSprite?.texture?.key === "player") {
        this.playerSprite?.setFlipX(false);
      } else {
        this.playerSprite?.setFlipX(false);
      }
    } else if (this.cursors.right.isDown || this.wasd?.D?.isDown) {
      body.setVelocityX(this.moveSpeed);
      moved = true;
      direction = "right";
      anim = "walk-right";
      if (this.playerSprite?.texture?.key === "player") {
        this.playerSprite?.setFlipX(true);
      } else {
        this.playerSprite?.setFlipX(false);
      }
    }

    if (this.cursors.up.isDown || this.wasd?.W?.isDown) {
      body.setVelocityY(-this.moveSpeed);
      moved = true;
      direction = "up";
      anim = "walk-up";
    } else if (this.cursors.down.isDown || this.wasd?.S?.isDown) {
      body.setVelocityY(this.moveSpeed);
      moved = true;
      direction = "down";
      anim = "walk-down";
    }

    if (moved) {
      playAnimation(anim);
      this.lastDirection = direction;
      this.wasMoving = true;
    } else {
      playAnimation(`idle-${this.lastDirection}`);

      if (this.wasMoving) {
        this.wasMoving = false;
        if (socket) {
          const payload = {
            x: this.playerPosition.x,
            y: this.playerPosition.y,
            position: this.playerPosition,
            direction: `idle-${this.lastDirection}`,
          };
          socket.emit("playerMovement", payload);
          try {
            localStorage.setItem(
              "userPosition",
              JSON.stringify(payload.position)
            );
          } catch (error) {
            // Ignore storage errors
          }
        }
      }
    }

    this.playerPosition.x = this.playerContainer.x;
    this.playerPosition.y = this.playerContainer.y;

    if (moved) {
      const distance = Phaser.Math.Distance.Between(
        this.lastSentPosition.x,
        this.lastSentPosition.y,
        this.playerPosition.x,
        this.playerPosition.y
      );

      const now = Date.now();
      const timeSinceLastSend = now - this.lastSentTime;
      
      // Throttle: only send if moved enough distance AND enough time has passed
      if (distance > 5 && timeSinceLastSend >= this.movementThrottleMs && socket) {
        const payload = {
          x: this.playerPosition.x,
          y: this.playerPosition.y,
          position: this.playerPosition,
          direction,
        };
        socket.emit("playerMovement", payload);
        try {
          localStorage.setItem(
            "userPosition",
            JSON.stringify(payload.position)
          );
        } catch (error) {
          // Ignore storage errors
        }
        this.lastSentPosition = { ...this.playerPosition };
        this.lastSentTime = now;
      }
    }
  }

  /**
   * Check for interactions with objects
   */
  checkInteractions(
    scene: Phaser.Scene,
    interactiveObjects: Phaser.GameObjects.Group | null,
    setInteractionPrompt: (prompt: string | null) => void,
    setIsSitting: (sitting: boolean) => void,
    setPlayerPosition: (x: number, y: number) => void,
    playAnimation: (animName: string) => void,
    onInteract?: (interaction: { type: string; name: string }) => void
  ): void {
    if (!this.playerContainer || !interactiveObjects) return;

    let closestObj: Phaser.GameObjects.Zone | null = null;
    let minDist = 50;

    interactiveObjects.getChildren().forEach((child) => {
      const zone = child as Phaser.GameObjects.Zone;
      const dist = Phaser.Math.Distance.Between(
        this.playerContainer!.x,
        this.playerContainer!.y,
        zone.x,
        zone.y
      );

      if (dist < minDist) {
        minDist = dist;
        closestObj = zone;
      }
    });

    if (closestObj) {
      const type = (closestObj as Phaser.GameObjects.Zone).getData("type");
      const name = (closestObj as Phaser.GameObjects.Zone).getData("name");

      if (type === "chair") {
        setInteractionPrompt(`Press E to Sit on ${name}`);
        if (this.wasd?.E && Phaser.Input.Keyboard.JustDown(this.wasd.E)) {
          this.isSitting = true;
          setIsSitting(true);
          setPlayerPosition(
            (closestObj as Phaser.GameObjects.Zone).x,
            (closestObj as Phaser.GameObjects.Zone).y
          );
          playAnimation("idle-down");
        }
      } else {
        setInteractionPrompt(`Press E to Interact with ${name}`);
        if (this.wasd?.E && Phaser.Input.Keyboard.JustDown(this.wasd.E)) {
          onInteract?.({ type, name });
        }
      }
    } else {
      setInteractionPrompt(null);
    }
  }

  /**
   * Get player position
   */
  getPlayerPosition(): { x: number; y: number } {
    return this.playerPosition;
  }

  /**
   * Get player container
   */
  getPlayerContainer(): Phaser.GameObjects.Container | undefined {
    return this.playerContainer;
  }

  /**
   * Set sitting state
   */
  setSitting(sitting: boolean): void {
    this.isSitting = sitting;
  }
}

