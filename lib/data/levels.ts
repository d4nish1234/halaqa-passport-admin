export type LevelDetails = {
  level: number;
  currentLevelAt: number;
  nextLevelAt: number;
  total: number;
};

// Leveling rules: XP is floored to >= 0. L1 at 0. L2 at 1. L3 at 3. L4 at 5. L5 at 7.
// After L5, levels advance every +3 XP (L6 at 9, L7 at 12, ...).
export function getLevelFromExperience(experience?: number | null): LevelDetails {
  const rawTotal = Math.floor(Number(experience ?? 0));
  const total = Number.isFinite(rawTotal) ? Math.max(0, rawTotal) : 0;

  if (total <= 0) {
    return { level: 1, currentLevelAt: 0, nextLevelAt: 1, total };
  }

  const levels2to5 = Math.floor((total - 1) / 2);
  let level = Math.min(5, 2 + levels2to5);
  let currentLevelAt = 1 + (level - 2) * 2;
  let nextLevelAt = currentLevelAt + 2;

  if (level === 5 && total >= nextLevelAt) {
    const extraLevels = Math.floor((total - nextLevelAt) / 3) + 1;
    level = 5 + extraLevels;
    currentLevelAt = nextLevelAt + (extraLevels - 1) * 3;
    nextLevelAt = currentLevelAt + 3;
  }

  return { level, currentLevelAt, nextLevelAt, total };
}
