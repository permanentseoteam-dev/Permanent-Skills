export function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(0, Math.floor((now - then) / 1000));
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: new Date(iso).getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 24);
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function eventTimeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export const CATEGORIES = [
  { id: "all", label: "All", emoji: "" },
  { id: "chat", label: "Chat room", emoji: "💬" },
  { id: "wins", label: "Wins", emoji: "🏆" },
  { id: "recorded", label: "Recorded Calls", emoji: "🎥" },
  { id: "reviews", label: "Reviews", emoji: "⭐" },
] as const;
