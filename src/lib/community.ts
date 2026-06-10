// Soft-gate for the social surfaces (Guild chat, Discover Players).
// Empty multiplayer reads as a dead product, so we hide it behind a
// "launching soon" state until there's real density. The owner always
// bypasses the gate so they can still demo/test.
export const COMMUNITY_MIN = 12

export function socialUnlocked(playerCount: number, owner: boolean): boolean {
  return owner || playerCount >= COMMUNITY_MIN
}
