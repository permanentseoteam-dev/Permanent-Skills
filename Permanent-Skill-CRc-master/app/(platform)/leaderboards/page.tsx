"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Avatar, Card } from "@/components/ui";
import { getLevel, levelShare } from "@/lib/levels";
import type { PublicUser } from "@/lib/types";

function BoardCard({
  title,
  rows,
  metric,
}: {
  title: string;
  rows: PublicUser[];
  metric: (u: PublicUser) => string;
}) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-semibold text-zinc-900">{title}</h2>
      <ol className="space-y-3">
        {rows.map((u, i) => (
          <li key={u.id}>
            <Link href={`/profile/${u.id}`} className="flex items-center gap-3 hover:opacity-80 transition">
              <span className={`w-5 text-sm font-bold ${i < 3 ? "text-amber-500" : "text-zinc-400"}`}>
                {i + 1}
              </span>
              <Avatar user={u} size={34} />
              <span className="flex-1 truncate text-sm font-medium text-zinc-800">{u.name}</span>
              <span className="text-sm font-semibold text-primary">{metric(u)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export default function LeaderboardsPage() {
  const { users, user } = useApp();
  const approved = users.filter(
    (u) =>
      u.role === "admin" ||
      u.role === "manager" ||
      u.status === "approved" ||
      typeof u.status === "undefined"
  );
  const me = user ? getLevel(user.points || 0) : getLevel(0);
  const shares = levelShare(approved);

  const d7 = useMemo(
    () => [...approved].sort((a, b) => (b.points7d || 0) - (a.points7d || 0)).slice(0, 8),
    [approved]
  );
  const d30 = useMemo(
    () => [...approved].sort((a, b) => (b.points30d || 0) - (a.points30d || 0)).slice(0, 8),
    [approved]
  );
  const dAll = useMemo(
    () => [...approved].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 8),
    [approved]
  );

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div
                className="flex h-36 w-36 items-center justify-center rounded-full bg-[conic-gradient(#5051F9_0deg,#5051F9_var(--p),#e4e4e7_var(--p))] p-1"
                style={{ "--p": `${3.6 * me.progress}deg` } as React.CSSProperties}
              >
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
                  <Avatar user={user} size={112} showOnline={false} />
                </div>
              </div>
              <span className="absolute -bottom-1 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-white shadow-md ring-4 ring-white">
                {me.level}
              </span>
            </div>
            <h1 className="mt-4 text-xl font-bold text-zinc-900">{user?.name}</h1>
            <p className="text-sm font-semibold text-primary">
              Level {me.level} - {me.name}
            </p>
            <p className="text-xs text-zinc-500">{me.pointsToNext} points to level up</p>
          </div>

          <div className="grid flex-1 gap-x-10 gap-y-3 sm:grid-cols-2">
            {shares.map((s) => {
              const unlocked = user && getLevel(user.points || 0).level >= s.level;
              return (
                <div key={s.level} className="flex items-start gap-3">
                  {unlocked ? (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                      {s.level}
                    </span>
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                      <Lock size={12} />
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-medium text-zinc-800">
                      Level {s.level} - {s.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {s.unlock ? (
                        <>
                          Unlock <span className="text-primary">{s.unlock}</span> · {s.percent}% of
                          members
                        </>
                      ) : (
                        `${s.percent}% of members`
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <BoardCard title="Leaderboard (7-day)" rows={d7} metric={(u) => `+${u.points7d || 0}`} />
        <BoardCard title="Leaderboard (30-day)" rows={d30} metric={(u) => `+${u.points30d || 0}`} />
        <BoardCard title="Leaderboard (all-time)" rows={dAll} metric={(u) => String(u.points || 0)} />
      </div>
    </div>
  );
}
