"use client";

import { Lock } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Avatar, Card } from "@/components/ui";
import { getLevel, levelShare } from "@/lib/levels";
import Link from "next/link";

export default function LeaderboardsPage() {
  const { users, user } = useApp();
  const members = users.filter((u) => u.role === "admin" || u.status === "approved" || typeof u.status === "undefined");
  const me = user ? getLevel(user.points) : getLevel(0);
  const shares = levelShare(members);
  const seven = [...members].sort((a, b) => b.points7d - a.points7d).slice(0, 8);
  const thirty = [...members].sort((a, b) => b.points30d - a.points30d).slice(0, 8);
  const all = [...members].sort((a, b) => b.points - a.points).slice(0, 8);

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="flex h-36 w-36 items-center justify-center rounded-full bg-[conic-gradient(#5051F9_0deg,#5051F9_var(--p),#e4e4e7_var(--p))] p-1" style={{ ["--p" as string]: `${me.progress * 3.6}deg` }}>
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
                  <Avatar user={user} size={112} />
                </div>
              </div>
              <span className="absolute -bottom-1 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                {me.level}
              </span>
            </div>
            <h1 className="mt-4 text-xl font-bold">{user?.name}</h1>
            <p className="text-sm text-primary">
              Level {me.level} - {me.name}
            </p>
            <p className="text-xs text-zinc-500">
              {me.pointsToNext} points to level up
            </p>
          </div>
          <div className="grid flex-1 gap-x-10 gap-y-3 sm:grid-cols-2">
            {shares.map((lvl) => (
              <div key={lvl.level} className="flex items-start gap-3">
                {user && getLevel(user.points).level >= lvl.level ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                    {lvl.level}
                  </span>
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                    <Lock size={12} />
                  </span>
                )}
                <div>
                  <p className="text-sm font-medium">
                    Level {lvl.level} - {lvl.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {lvl.unlock ? (
                      <>
                        Unlock <span className="text-primary">{lvl.unlock}</span> · {lvl.percent}% of members
                      </>
                    ) : (
                      `${lvl.percent}% of members`
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Board title="Leaderboard (7-day)" rows={seven} metric={(u) => `+${u.points7d}`} />
        <Board title="Leaderboard (30-day)" rows={thirty} metric={(u) => `+${u.points30d}`} />
        <Board title="Leaderboard (all-time)" rows={all} metric={(u) => String(u.points)} />
      </div>
    </div>
  );
}

function Board({
  title,
  rows,
  metric,
}: {
  title: string;
  rows: { id: string; name: string; points: number; points7d: number; points30d: number; avatarColor: string; isOnline: boolean }[];
  metric: (u: { points: number; points7d: number; points30d: number }) => string;
}) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <ol className="space-y-3">
        {rows.map((m, i) => (
          <li key={m.id}>
            <Link href={`/profile/${m.id}`} className="flex items-center gap-3">
              <span className={`w-5 text-sm font-bold ${i < 3 ? "text-amber-500" : "text-zinc-400"}`}>{i + 1}</span>
              <Avatar user={m} size={34} />
              <span className="flex-1 truncate text-sm font-medium">{m.name}</span>
              <span className="text-sm font-semibold text-primary">{metric(m)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}
