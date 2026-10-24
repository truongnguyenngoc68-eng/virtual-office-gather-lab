/**
 * Avatar utilities
 */

/**
 * Get avatar color for a user ID
 * Returns a consistent color based on user ID
 */
export function getAvatarColor(userId: string): string {
  const colors = [
    "#5865f2",
    "#57f287",
    "#fee75c",
    "#eb459e",
    "#ed4245",
    "#3ba55d",
    "#faa61a",
    "#00d9ff",
    "#9b59b6",
    "#e67e22",
  ];
  const index =
    userId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}
