export const LEVELS = [
  { level: 1, name: "Skill Starter", min: 0, unlock: null as string | null },
  { level: 2, name: "Strategy Explorer", min: 15, unlock: "Premium classroom extras" },
  { level: 3, name: "Link Builder", min: 40, unlock: null },
  { level: 4, name: "Conversion Hustler", min: 80, unlock: null },
  { level: 5, name: "Niche Dominator", min: 130, unlock: "Member chat perks" },
  { level: 6, name: "Traffic Commander", min: 190, unlock: null },
  { level: 7, name: "Authority Master", min: 260, unlock: null },
  { level: 8, name: "Strategy Overlord", min: 350, unlock: null },
  { level: 9, name: "Skill Whisperer", min: 460, unlock: null },
];

export function getLevel(points: number) {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (points >= level.min) current = level;
  }
  const next = LEVELS.find((l) => l.level === current.level + 1);
  const span = next ? next.min - current.min : 1;
  const into = next ? Math.max(0, points - current.min) : span;
  const pointsToNext = next ? Math.max(0, next.min - points) : 0;
  const progress = next ? Math.min(100, Math.round((into / span) * 100) || 2) : 100;
  return { ...current, next, pointsToNext, progress };
}

export function levelShare(users: { points: number }[]) {
  const approved = users.length || 1;
  return LEVELS.map((level) => {
    const count = users.filter((u) => getLevel(u.points).level === level.level).length;
    return { ...level, percent: Math.round((count / approved) * 100) };
  });
}
