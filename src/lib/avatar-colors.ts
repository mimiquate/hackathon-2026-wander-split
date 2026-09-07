// Must match the ramp class list in src/components/trip/Avatar.tsx. Kept as
// a separate constant because this module is imported from the server-side
// data layer, which must not import a React component file.
export const AVATAR_COLOR_COUNT = 5;

export function isAvatarColorIndex(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < AVATAR_COLOR_COUNT;
}

/**
 * A stable per-person color, so the same account tends to keep its color
 * across trips — Avatar assigns color per person, never by list position.
 * Not cryptographic; just needs to be deterministic and spread evenly.
 */
export function defaultColorIndexFor(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % AVATAR_COLOR_COUNT;
}
