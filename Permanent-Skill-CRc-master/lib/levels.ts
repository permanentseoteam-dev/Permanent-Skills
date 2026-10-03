export const LEVELS = [
  { level: 1, name: "Skill Starter", min: 0, unlock: null as string | null },
  { level: 2, name: "Strategy Explorer", min: 15, unlock: "👑 VIP classroom extras" },
  { level: 3, name: "Link Builder", min: 40, unlock: null },
  { level: 4, name: "Conversion Hustler", min: 80, unlock: null },
  { level: 5, name: "Niche Dominator", min: 130, unlock: "Member chat perks" },
  { level: 6, name: "Traffic Commander", min: 190, unlock: null },
  { level: 7, name: "Authority Master", min: 260, unlock: null },
  { level: 8, name: "Strategy Overlord", min: 350, unlock: null },
  { level: 9, name: "Skill Whisperer", min: 460, unlock: null },
];

export function getLevel(points?: number | null) {
  const safePoints = Math.max(0, typeof points === "number" && !isNaN(points) ? points : 0);
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (safePoints >= level.min) current = level;
  }
  const next = LEVELS.find((l) => l.level === current.level + 1);
  const span = next ? Math.max(1, next.min - current.min) : 1;
  const into = next ? Math.max(0, safePoints - current.min) : span;
  const pointsToNext = next ? Math.max(0, next.min - safePoints) : 0;
  const progress = next ? Math.min(100, Math.max(0, Math.round((into / span) * 100))) : 100;
  return { ...current, next, pointsToNext, progress };
}

export function levelShare(users: { points?: number | null }[] = []) {
  const approved = users.length || 1;
  return LEVELS.map((level) => {
    const count = users.filter((u) => getLevel(u?.points || 0).level === level.level).length;
    return { ...level, percent: Math.round((count / approved) * 100) };
  });
}
