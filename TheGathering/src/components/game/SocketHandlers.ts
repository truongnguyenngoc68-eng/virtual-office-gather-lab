/**
 * SocketHandlers - Handles all Socket.IO event listeners for the game
 */
export class SocketHandlers {
  /**
   * Setup all socket event listeners
   */
  static setupListeners(
    scene: Phaser.Scene,
    socket: any,
    currentUser: any,
    otherPlayers: Map<
      string,
      { container: Phaser.GameObjects.Container; sprite: Phaser.GameObjects.Sprite; label: Phaser.GameObjects.Text }
    >,
    createOtherPlayer: (user: any) => void,
    updateOtherPlayer: (userId: string, position: { x: number; y: number }, direction?: string) => void,
    showSpeechBubble: (userId: string, message: string) => void,
    showReaction?: (userId: string, reaction: string) => void
  ): () => void {
    // Listen for individual player movement updates
    socket.on("playerMoved", (data: any) => {
      updateOtherPlayer(data.userId, data.position, data.direction);
    });

    // Listen for all players positions (batch update)
    socket.on("allPlayersPositions", (allPlayers: any[]) => {
      allPlayers.forEach((player) => {
        if (player.userId !== currentUser?.userId) {
          const userStatus = (player as any).status || "online";
          // Only show online users on map
          if (userStatus === "online") {
            if (!otherPlayers.has(player.userId)) {
              // Create player if doesn't exist
              createOtherPlayer(player);
            } else {
              // Update existing player position
              updateOtherPlayer(player.userId, player.position, player.direction);
            }
          } else {
            // Remove offline users from map
            if (otherPlayers.has(player.userId)) {
              const offlinePlayer = otherPlayers.get(player.userId);
              offlinePlayer?.container.destroy();
              otherPlayers.delete(player.userId);
            }
          }
        }
      });
    });

    socket.on("user-joined", (user: any) => {
      // Only create player for online users
      if (user.userId !== currentUser?.userId && !otherPlayers.has(user.userId)) {
        const userStatus = (user as any).status || "online";
        if (userStatus === "online") {
          createOtherPlayer(user);
        }
      }
    });

    socket.on("room-users", (roomUsers: any[]) => {
      // Only create players for online users (offline users shouldn't appear on map)
      roomUsers.forEach((user) => {
        if (user.userId !== currentUser?.userId && !otherPlayers.has(user.userId)) {
          // Only create player if user is online
          const userStatus = (user as any).status || "online";
          if (userStatus === "online") {
            createOtherPlayer(user);
          }
        }
      });
    });

    socket.on("user-left", (data: { userId: string }) => {
      // Remove player sprite when user goes offline
      if (otherPlayers.has(data.userId)) {
        const player = otherPlayers.get(data.userId);
        player?.container.destroy();
        otherPlayers.delete(data.userId);
      }
    });

    socket.on("chat-message", (data: any) => {
      showSpeechBubble(data.userId, data.message);
    });

    // Listen for reactions
    socket.on("reaction", (data: { userId: string; reaction: string; timestamp: number }) => {
      console.log(`📣 Received reaction from ${data.userId}: ${data.reaction}`);
      if (showReaction) {
        showReaction(data.userId, data.reaction);
      }
    });

    // Return cleanup function
    return () => {
      socket.off("playerMoved");
      socket.off("allPlayersPositions");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("room-users");
      socket.off("chat-message");
      socket.off("reaction");
    };
  }
}


