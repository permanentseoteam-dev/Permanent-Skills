"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Lock, Trophy, Sparkles } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Avatar, Card } from "@/components/ui";
import { AvatarWithLevel } from "@/components/feed";
import { getLevel, levelShare } from "@/lib/levels";
import type { PublicUser } from "@/lib/types";

function BoardCard({
  title,
  rows,
  metric,
  currentUserId,
  period,
}: {
  title: string;
  rows: PublicUser[];
  metric: (u: PublicUser) => string;
  currentUserId?: string;
  period?: string;
}) {
  return (
    <Card className="p-3.5 sm:p-5">
      <div className="mb-3.5 flex items-center justify-between gap-2 border-b border-zinc-100 pb-2.5">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-1.5">
            <Trophy size={16} className="text-amber-500" />
            <span>{title}</span>
          </h2>
          {period && <p className="text-[11px] text-zinc-400 mt-0.5">{period}</p>}
        </div>
        <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-100 rounded-full px-2 py-0.5">
          Top {rows.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-400">
          No members ranked in this period yet.
        </div>
      ) : (
        <ol className="space-y-2 sm:space-y-2.5">
          {rows.map((u, i) => {
            const isMe = u.id === currentUserId;
            return (
              <li key={u.id}>
                <Link
                  href={`/profile/${u.id}`}
                  className={`flex items-center gap-2.5 sm:gap-3 p-1.5 sm:p-2 rounded-xl transition ${
                    isMe
                      ? "bg-primary/5 border border-primary/20 hover:bg-primary/10"
                      : "hover:bg-zinc-50 border border-transparent"
                  }`}
                >
                  <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center font-bold text-xs sm:text-sm">
                    {i === 0 ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-800 ring-2 ring-amber-300 shadow-2xs text-xs font-black">
                        1
                      </span>
                    ) : i === 1 ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 ring-2 ring-slate-300 shadow-2xs text-xs font-black">
                        2
                      </span>
                    ) : i === 2 ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 text-amber-900 ring-2 ring-amber-600/40 shadow-2xs text-xs font-black">
                        3
                      </span>
                    ) : (
                      <span className="text-zinc-400">{i + 1}</span>
                    )}
                  </div>

                  <AvatarWithLevel user={u} size={32} />

                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-xs sm:text-sm font-semibold ${isMe ? "text-primary" : "text-zinc-900"}`}>
                      {u.name} {isMe && <span className="text-[10px] text-primary/80 font-normal">(You)</span>}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs sm:text-sm font-bold text-primary bg-primary/5 rounded-lg px-2 py-0.5">
                    {metric(u)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

export default function LeaderboardsPage() {
  const { users, user } = useApp();
  const [activeTab, setActiveTab] = useState<"7d" | "30d" | "all">("30d");

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
    <div className="space-y-4 sm:space-y-5">
      <Card className="p-4 sm:p-6 md:p-7">
        <div className="flex flex-col gap-6 sm:gap-8 lg:flex-row lg:items-center">
          {/* Left: User progress ring and level card */}
          <div className="flex flex-col items-center text-center shrink-0 lg:w-56">
            <div className="relative">
              <div
                className="flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-full bg-[conic-gradient(#5051F9_0deg,#5051F9_var(--p),#e4e4e7_var(--p))] p-1 transition-all duration-700 shadow-sm"
                style={{ "--p": `${3.6 * me.progress}deg` } as React.CSSProperties}
              >
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
                  <Avatar user={user} size={84} className="sm:hidden" showOnline={false} />
                  <Avatar user={user} size={112} className="hidden sm:inline-flex" showOnline={false} />
                </div>
              </div>
              <span className="absolute -bottom-1 right-1 sm:right-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary text-sm sm:text-base font-bold text-white shadow-md ring-3 sm:ring-4 ring-white">
                {me.level}
              </span>
            </div>

            <h1 className="mt-3 sm:mt-4 text-base sm:text-xl font-bold tracking-tight text-zinc-900 truncate max-w-full">
              {user?.name || "Community Member"}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-primary">
              Level {me.level} · {me.name}
            </p>

            <div className="w-full max-w-[200px] mt-2 space-y-1">
              <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${me.progress}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-500 font-medium">
                {me.pointsToNext > 0 ? `${me.pointsToNext} pts to Level ${me.level + 1}` : "Max level reached"}
              </p>
            </div>
          </div>

          {/* Right: Levels tier breakdown */}
          <div className="flex-1 border-t lg:border-t-0 lg:border-l border-zinc-100 pt-5 lg:pt-0 lg:pl-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-500">
                Community Levels & Perks
              </h2>
              <span className="text-[11px] text-zinc-400">Total {shares.length} levels</span>
            </div>

            <div className="grid gap-2 sm:gap-x-6 sm:gap-y-2.5 grid-cols-1 sm:grid-cols-2">
              {shares.map((s) => {
                const isCurrent = user && me.level === s.level;
                const unlocked = user && me.level >= s.level;
                return (
                  <div
                    key={s.level}
                    className={`flex items-start gap-2.5 p-2 rounded-xl transition ${
                      isCurrent
                        ? "bg-primary/5 border border-primary/30 ring-1 ring-primary/20"
                        : "hover:bg-zinc-50/80"
                    }`}
                  >
                    {isCurrent ? (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-xs">
                        {s.level}
                      </span>
                    ) : unlocked ? (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                        {s.level}
                      </span>
                    ) : (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                        <Lock size={12} />
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={`text-xs sm:text-sm font-semibold ${isCurrent ? "text-primary" : "text-zinc-900"}`}>
                          Level {s.level} · {s.name}
                        </p>
                        {isCurrent && (
                          <span className="text-[10px] font-bold bg-primary text-white rounded-full px-1.5 py-0.2">
                            Current
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-zinc-500 mt-0.5 leading-tight">
                        {s.min} pts · {s.percent}% of members
                      </p>

                      {s.unlock && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            <Sparkles size={10} className="text-amber-600" />
                            <span>Unlock: {s.unlock}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden items-center p-1 rounded-xl bg-zinc-200/60 border border-zinc-200/80 gap-1">
        <button
          onClick={() => setActiveTab("7d")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer active:scale-95 ${
            activeTab === "7d" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          7-Day
        </button>
        <button
          onClick={() => setActiveTab("30d")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer active:scale-95 ${
            activeTab === "30d" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          30-Day
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer active:scale-95 ${
            activeTab === "all" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          All-Time
        </button>
      </div>

      {/* Leaderboard Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className={activeTab === "7d" ? "block" : "hidden lg:block"}>
          <BoardCard
            title="7-Day Leaderboard"
            period="Points earned in the last 7 days"
            rows={d7}
            metric={(u) => `+${u.points7d || 0}`}
            currentUserId={user?.id}
          />
        </div>
        <div className={activeTab === "30d" ? "block" : "hidden lg:block"}>
          <BoardCard
            title="30-Day Leaderboard"
            period="Points earned in the last 30 days"
            rows={d30}
            metric={(u) => `+${u.points30d || 0}`}
            currentUserId={user?.id}
          />
        </div>
        <div className={activeTab === "all" ? "block" : "hidden lg:block"}>
          <BoardCard
            title="All-Time Leaderboard"
            period="Total points since joining"
            rows={dAll}
            metric={(u) => String(u.points || 0)}
            currentUserId={user?.id}
          />
        </div>
      </div>
    </div>
  );
}
