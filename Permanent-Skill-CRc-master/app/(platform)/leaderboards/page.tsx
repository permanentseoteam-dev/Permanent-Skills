"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Flame,
  Globe,
  HelpCircle,
  Info,
  Layers,
  Lock,
  MapPin,
  Medal,
  MessageCircle,
  Search,
  Share2,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Unlock,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Avatar, Card, PrimaryButton, ProgressBar, UserRoleBadge } from "@/components/ui";
import { ChatDrawer } from "@/components/ChatDrawer";
import { LEVELS, getLevel, levelShare } from "@/lib/levels";
import { timeAgo } from "@/lib/format";
import type { PublicUser } from "@/lib/types";

type ViewTab = "7day" | "30day" | "alltime" | "roadmap" | "rules";
type RoleFilter = "all" | "team" | "students";

export default function LeaderboardsPage() {
  const { users, user, activeCommunity } = useApp();
  const [activeTab, setActiveTab] = useState<ViewTab>("30day");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);

  // Filter approved/visible members
  const members = useMemo(() => {
    return users.filter(
      (u) =>
        u.role === "admin" ||
        u.role === "manager" ||
        u.status === "approved" ||
        typeof u.status === "undefined"
    );
  }, [users]);

  // Current logged in user's level info
  const me = user ? getLevel(user.points || 0) : getLevel(0);
  const shares = levelShare(members);

  // Compute filtered member pool by role and search
  const filteredMembers = useMemo(() => {
    let pool = members;

    if (roleFilter === "team") {
      pool = pool.filter((u) => u.role === "team_member");
    } else if (roleFilter === "students") {
      pool = pool.filter((u) => u.role === "member" || u.role === "student" || u.role === "user");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      pool = pool.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.bio?.toLowerCase().includes(q)
      );
    }

    return pool;
  }, [members, roleFilter, searchQuery]);

  // Ranked lists for each timeframe
  const ranked7d = useMemo(
    () => [...filteredMembers].sort((a, b) => (b.points7d || 0) - (a.points7d || 0)),
    [filteredMembers]
  );
  const ranked30d = useMemo(
    () => [...filteredMembers].sort((a, b) => (b.points30d || 0) - (a.points30d || 0)),
    [filteredMembers]
  );
  const rankedAll = useMemo(
    () => [...filteredMembers].sort((a, b) => (b.points || 0) - (a.points || 0)),
    [filteredMembers]
  );

  // Active ranked list based on active tab
  const currentRanked = useMemo(() => {
    if (activeTab === "7day") return ranked7d;
    if (activeTab === "alltime") return rankedAll;
    return ranked30d;
  }, [activeTab, ranked7d, ranked30d, rankedAll]);

  // Find user's ranks
  const userRank7d = user ? ranked7d.findIndex((u) => u.id === user.id) + 1 : 0;
  const userRank30d = user ? ranked30d.findIndex((u) => u.id === user.id) + 1 : 0;
  const userRankAll = user ? rankedAll.findIndex((u) => u.id === user.id) + 1 : 0;

  const currentRank =
    activeTab === "7day"
      ? userRank7d
      : activeTab === "alltime"
        ? userRankAll
        : userRank30d;

  // Top 3 Podium Winners
  const top3 = currentRanked.slice(0, 3);
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  // Metric value formatting helper
  function getMetricValue(u: PublicUser) {
    if (activeTab === "7day") return `+${u.points7d || 0} pts`;
    if (activeTab === "alltime") return `${u.points || 0} pts`;
    return `+${u.points30d || 0} pts`;
  }

  function getMetricSub(u: PublicUser) {
    if (activeTab === "7day") return "earned this week";
    if (activeTab === "alltime") return "lifetime points";
    return "earned this month";
  }

  return (
    <div className="space-y-6">
      {/* SECTION 1: User Gamification Hero Showcase */}
      <Card className="relative overflow-hidden border border-zinc-200/80 bg-gradient-to-b from-white via-zinc-50/50 to-zinc-100/40 p-6 shadow-sm">
        {/* Subtle decorative background glow */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 -mb-16 h-48 w-48 rounded-full bg-amber-500/5 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center">
          {/* Avatar Ring & Level Badge */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative">
              {/* Circular SVG Progress Ring */}
              <div className="relative flex h-32 w-32 items-center justify-center">
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    className="text-zinc-200 stroke-current"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    className="text-amber-500 stroke-current transition-all duration-700 ease-out"
                    strokeWidth="7"
                    strokeDasharray={276.46}
                    strokeDashoffset={276.46 - (276.46 * me.progress) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center p-2.5">
                  <Avatar
                    user={user}
                    size={96}
                    className="border-3 border-white shadow-md ring-1 ring-zinc-200"
                  />
                </div>
              </div>

              {/* Level Pill floating at bottom right */}
              <span
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-sm font-black text-amber-300 ring-4 ring-white shadow-md border border-amber-500/40"
                title={`Level ${me.level}`}
              >
                {me.level}
              </span>
            </div>

            <div className="mt-3 text-center">
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <h2 className="text-base font-black text-zinc-900">{user?.name || "Guest Member"}</h2>
                <UserRoleBadge role={user?.role} isPremium={user?.isPremium} size="xs" />
              </div>
              <p className="mt-0.5 text-xs font-semibold text-zinc-400">@{user?.username || "member"}</p>
            </div>
          </div>

          {/* User Scorecard & Level Progress Details */}
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-200/70 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-extrabold text-amber-700 border border-amber-500/20">
                    <Trophy size={13} className="text-amber-600" /> Level {me.level} · {me.name}
                  </span>
                  {user?.isPremium && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary border border-primary/20">
                      <Crown size={12} /> VIP Member
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {me.next
                    ? `${me.pointsToNext} more points needed to unlock Level ${me.next.level} (${me.next.name})`
                    : "Maximum Level Mastered! You are at the top of the academy."}
                </p>
              </div>

              {/* Quick Rank Callout */}
              {currentRank > 0 && (
                <div className="rounded-xl bg-white border border-zinc-200 px-3.5 py-1.5 text-center shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Your Rank</p>
                  <p className="text-sm font-black text-zinc-900">
                    {currentRank === 1 ? "🥇 #1 Champion" : currentRank === 2 ? "🥈 #2 Contender" : currentRank === 3 ? "🥉 #3 Contender" : `#${currentRank} Overall`}
                  </p>
                </div>
              )}
            </div>

            {/* Level Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
                <span>Level {me.level} Progress</span>
                <span>
                  {user?.points || 0} pts {me.next && `/ ${me.next.min} pts`} ({me.progress}%)
                </span>
              </div>
              <ProgressBar value={me.progress} max={100} size="md" variant="amber" />
            </div>

            {/* 4-Stat Scorecard Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="rounded-xl bg-white border border-zinc-200/80 p-2.5 text-center shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Total Points</span>
                <p className="text-base font-black text-zinc-900">{user?.points || 0}</p>
              </div>
              <div className="rounded-xl bg-white border border-zinc-200/80 p-2.5 text-center shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-zinc-400">7-Day Sprint</span>
                <p className="text-base font-black text-primary">+{user?.points7d || 0}</p>
              </div>
              <div className="rounded-xl bg-white border border-zinc-200/80 p-2.5 text-center shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-zinc-400">30-Day Season</span>
                <p className="text-base font-black text-amber-600">+{user?.points30d || 0}</p>
              </div>
              <div className="rounded-xl bg-white border border-zinc-200/80 p-2.5 text-center shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Level Perks</span>
                <p className="text-xs font-bold text-emerald-600 truncate mt-0.5" title={me.unlock || "Active Community Access"}>
                  {me.unlock ? "🔓 Unlocked" : "Active Member"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION 2: Navigation Tabs & Timeframe Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <TabButton
            active={activeTab === "30day"}
            onClick={() => setActiveTab("30day")}
            icon={<Flame size={14} className="text-amber-500" />}
            label="30-Day Season"
            badge={`${ranked30d.length}`}
          />
          <TabButton
            active={activeTab === "7day"}
            onClick={() => setActiveTab("7day")}
            icon={<Zap size={14} className="text-indigo-500" />}
            label="7-Day Sprint"
            badge={`${ranked7d.length}`}
          />
          <TabButton
            active={activeTab === "alltime"}
            onClick={() => setActiveTab("alltime")}
            icon={<Crown size={14} className="text-amber-600" />}
            label="All-Time Hall of Fame"
            badge={`${rankedAll.length}`}
          />
          <TabButton
            active={activeTab === "roadmap"}
            onClick={() => setActiveTab("roadmap")}
            icon={<Layers size={14} className="text-purple-500" />}
            label="Levels & Perks Roadmap"
          />
          <TabButton
            active={activeTab === "rules"}
            onClick={() => setActiveTab("rules")}
            icon={<HelpCircle size={14} className="text-zinc-500" />}
            label="How Points Work"
          />
        </div>

        {/* Role Filters for Leaderboard Views */}
        {(activeTab === "7day" || activeTab === "30day" || activeTab === "alltime") && (
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            <span className="text-xs font-semibold text-zinc-400 mr-1">Filter:</span>
            <button
              onClick={() => setRoleFilter("all")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                roleFilter === "all"
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRoleFilter("team")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                roleFilter === "team"
                  ? "bg-purple-900 text-purple-100"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              Team
            </button>
            <button
              onClick={() => setRoleFilter("students")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                roleFilter === "students"
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              Students
            </button>
          </div>
        )}
      </div>

      {/* RENDER VIEW: LEADERBOARD LIST / PODIUM VIEW (7-Day, 30-Day, All-Time) */}
      {(activeTab === "7day" || activeTab === "30day" || activeTab === "alltime") && (
        <div className="space-y-6">
          {/* SECTION 3: TOP 3 PODIUM SPOTLIGHT */}
          {top3.length > 0 && !searchQuery && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4 pb-2">
              {/* 2nd Place Silver Podium */}
              {second && (
                <div className="order-2 md:order-1 flex flex-col items-center rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white p-5 text-center shadow-xs transition hover:shadow-md">
                  <div className="relative">
                    <Avatar
                      user={second}
                      size={72}
                      className="border-3 border-zinc-300 shadow-md ring-2 ring-zinc-200/80"
                    />
                    <span className="absolute -top-2 -left-2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-sm font-black text-zinc-100 ring-2 ring-white shadow-sm">
                      🥈
                    </span>
                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-black text-white ring-2 ring-white">
                      #2
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-zinc-900 truncate max-w-full">
                    <Link href={`/profile/${second.id}`} className="hover:text-primary transition">
                      {second.name}
                    </Link>
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">@{second.username}</p>

                  <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
                    <UserRoleBadge role={second.role} isPremium={second.isPremium} size="xs" />
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                      Lvl {getLevel(second.points || 0).level}
                    </span>
                  </div>

                  <div className="mt-3 w-full rounded-xl bg-zinc-100 py-1.5 text-center">
                    <p className="text-sm font-black text-zinc-900">{getMetricValue(second)}</p>
                    <p className="text-[10px] font-semibold text-zinc-400">{getMetricSub(second)}</p>
                  </div>

                  {second.id !== user?.id && (
                    <button
                      onClick={() => setChatId(second.id)}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <MessageCircle size={12} /> Message
                    </button>
                  )}
                </div>
              )}

              {/* 1st Place Gold Podium Champion */}
              {first && (
                <div className="order-1 md:order-2 flex flex-col items-center rounded-2xl border-2 border-amber-400/80 bg-gradient-to-b from-amber-50/80 via-white to-amber-50/20 p-6 text-center shadow-md -mt-2 scale-105 transition hover:shadow-lg">
                  <div className="relative">
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                      👑
                    </div>
                    <Avatar
                      user={first}
                      size={88}
                      className="border-4 border-amber-400 shadow-lg ring-4 ring-amber-200/60"
                    />
                    <span className="absolute -top-2 -left-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-base font-black text-white ring-2 ring-white shadow-sm">
                      🥇
                    </span>
                    <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950 text-xs font-black text-amber-300 ring-2 ring-white">
                      #1
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-black text-zinc-950 truncate max-w-full">
                    <Link href={`/profile/${first.id}`} className="hover:text-primary transition">
                      {first.name}
                    </Link>
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">@{first.username}</p>

                  <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
                    <UserRoleBadge role={first.role} isPremium={first.isPremium} size="xs" />
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800 border border-amber-300">
                      🏆 Lvl {getLevel(first.points || 0).level} · {getLevel(first.points || 0).name}
                    </span>
                  </div>

                  <div className="mt-3.5 w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 p-2 text-center text-zinc-950 shadow-xs">
                    <p className="text-base font-black leading-tight">{getMetricValue(first)}</p>
                    <p className="text-[10px] font-extrabold uppercase tracking-wide opacity-80">{getMetricSub(first)}</p>
                  </div>

                  {first.id !== user?.id && (
                    <button
                      onClick={() => setChatId(first.id)}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline"
                    >
                      <MessageCircle size={13} /> Congratulate Champion
                    </button>
                  )}
                </div>
              )}

              {/* 3rd Place Bronze Podium */}
              {third && (
                <div className="order-3 flex flex-col items-center rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white p-5 text-center shadow-xs transition hover:shadow-md">
                  <div className="relative">
                    <Avatar
                      user={third}
                      size={72}
                      className="border-3 border-amber-700/60 shadow-md ring-2 ring-amber-700/20"
                    />
                    <span className="absolute -top-2 -left-2 flex h-7 w-7 items-center justify-center rounded-full bg-amber-800 text-sm font-black text-amber-100 ring-2 ring-white shadow-sm">
                      🥉
                    </span>
                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-black text-white ring-2 ring-white">
                      #3
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-zinc-900 truncate max-w-full">
                    <Link href={`/profile/${third.id}`} className="hover:text-primary transition">
                      {third.name}
                    </Link>
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">@{third.username}</p>

                  <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
                    <UserRoleBadge role={third.role} isPremium={third.isPremium} size="xs" />
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                      Lvl {getLevel(third.points || 0).level}
                    </span>
                  </div>

                  <div className="mt-3 w-full rounded-xl bg-zinc-100 py-1.5 text-center">
                    <p className="text-sm font-black text-zinc-900">{getMetricValue(third)}</p>
                    <p className="text-[10px] font-semibold text-zinc-400">{getMetricSub(third)}</p>
                  </div>

                  {third.id !== user?.id && (
                    <button
                      onClick={() => setChatId(third.id)}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <MessageCircle size={12} /> Message
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Search Bar for Member Ranking */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member by name or @username on this leaderboard..."
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-9 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* SECTION 4: FULL RANKED LIST CARD */}
          <Card className="divide-y divide-zinc-100 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between bg-zinc-50/70 px-4 py-3 border-b border-zinc-100 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <div className="flex items-center gap-6">
                <span className="w-8 text-center">Rank</span>
                <span>Member</span>
              </div>
              <div className="flex items-center gap-8">
                <span className="hidden sm:inline">Level</span>
                <span className="text-right">Score</span>
              </div>
            </div>

            {currentRanked.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-zinc-600">No members found matching your search.</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-2 text-xs font-bold text-primary hover:underline"
                  >
                    Clear search query
                  </button>
                )}
              </div>
            ) : (
              currentRanked.map((m, idx) => {
                const rank = idx + 1;
                const isMe = m.id === user?.id;
                const mLevel = getLevel(m.points || 0);

                return (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between px-4 py-3.5 transition ${
                      isMe
                        ? "bg-amber-50/60 ring-1 ring-inset ring-amber-200/80 font-semibold"
                        : "hover:bg-zinc-50/80"
                    }`}
                  >
                    {/* Rank & Member Details */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Rank Badge */}
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center font-black">
                        {rank === 1 ? (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-sm text-zinc-950 shadow-xs">
                            🥇
                          </span>
                        ) : rank === 2 ? (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-sm text-zinc-800 shadow-xs">
                            🥈
                          </span>
                        ) : rank === 3 ? (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-700/80 text-sm text-white shadow-xs">
                            🥉
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-zinc-500">#{rank}</span>
                        )}
                      </span>

                      {/* Avatar */}
                      <Link href={`/profile/${m.id}`} className="shrink-0 group">
                        <Avatar user={m} size={40} className="group-hover:ring-2 group-hover:ring-primary transition" />
                      </Link>

                      {/* Name, Username, Role */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            href={`/profile/${m.id}`}
                            className="text-sm font-bold text-zinc-900 hover:text-primary transition truncate"
                          >
                            {m.name}
                          </Link>

                          {isMe && (
                            <span className="rounded-md bg-amber-500 text-zinc-950 px-1.5 py-0.2 text-[10px] font-black uppercase">
                              You
                            </span>
                          )}

                          <UserRoleBadge role={m.role} isPremium={m.isPremium} size="xs" />
                        </div>

                        <p className="text-xs text-zinc-400 truncate">@{m.username}</p>
                      </div>
                    </div>

                    {/* Level & Points Metric */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-700 border border-zinc-200">
                          <Trophy size={11} className="text-amber-500" /> Lvl {mLevel.level}
                        </span>
                        <span className="text-[10px] text-zinc-400">{mLevel.name}</span>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <p className="text-sm font-black text-primary">{getMetricValue(m)}</p>
                        <p className="text-[10px] font-medium text-zinc-400">{getMetricSub(m)}</p>
                      </div>

                      {m.id !== user?.id && (
                        <button
                          onClick={() => setChatId(m.id)}
                          className="hidden md:inline-flex items-center justify-center rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
                          title={`Chat with ${m.name}`}
                        >
                          <MessageCircle size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </Card>

          {/* SECTION 5: Pinned "Your Standing" Sticky Banner */}
          {user && currentRank > 5 && (
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white text-base font-black">
                  #{currentRank}
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-900">
                    Your Current Rank: #{currentRank} in {activeTab === "7day" ? "7-Day Sprint" : activeTab === "alltime" ? "All-Time" : "30-Day Season"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    You have earned <strong className="text-primary">{getMetricValue(user as PublicUser)}</strong>. Complete lessons and post discussions to climb higher!
                  </p>
                </div>
              </div>

              <Link
                href="/classroom"
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-dark transition shrink-0 shadow-2xs"
              >
                Earn Points Now →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* RENDER VIEW: LEVELS & PERKS ROADMAP */}
      {activeTab === "roadmap" && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-r from-[#0b1b4a] via-[#1e293b] to-[#0f172a] p-6 text-white shadow-md">
            <h2 className="text-xl font-black">Level Progression & Mastery Roadmap</h2>
            <p className="mt-1 text-xs text-zinc-300 max-w-2xl leading-relaxed">
              Every level in the Permanent Skills Academy unlocks new permissions, exclusive masterminds, classroom modules, and community recognition. Climb from Level 1 Skill Starter to Level 9 Skill Whisperer!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LEVELS.map((lvl) => {
              const isUnlocked = user && getLevel(user.points || 0).level >= lvl.level;
              const isCurrent = user && getLevel(user.points || 0).level === lvl.level;
              const shareInfo = shares.find((s) => s.level === lvl.level);

              return (
                <Card
                  key={lvl.level}
                  className={`relative p-5 transition hover:shadow-md ${
                    isCurrent
                      ? "border-2 border-amber-500 bg-amber-50/30 shadow-md ring-2 ring-amber-500/10"
                      : isUnlocked
                        ? "border-zinc-300 bg-white"
                        : "border-zinc-200/70 bg-zinc-50/50 opacity-80"
                  }`}
                >
                  {/* Status Tag */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black shadow-2xs ${
                        isCurrent
                          ? "bg-amber-500 text-zinc-950 ring-2 ring-amber-300"
                          : isUnlocked
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-200 text-zinc-500"
                      }`}
                    >
                      {lvl.level}
                    </span>

                    {isCurrent ? (
                      <span className="rounded-full bg-amber-500 text-zinc-950 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                        ★ Your Level
                      </span>
                    ) : isUnlocked ? (
                      <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
                        <Check size={11} /> Unlocked
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-200 text-zinc-600 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
                        <Lock size={10} /> {lvl.min} pts required
                      </span>
                    )}
                  </div>

                  {/* Title & Min Points */}
                  <div className="mt-3">
                    <h3 className="text-base font-black text-zinc-900">{lvl.name}</h3>
                    <p className="text-xs font-semibold text-primary">{lvl.min}+ Points Threshold</p>
                  </div>

                  {/* Unlock Perk */}
                  <div className="mt-3 rounded-xl bg-zinc-100/80 p-2.5 text-xs">
                    <span className="font-bold text-zinc-700 block text-[11px] uppercase tracking-wider">
                      {lvl.unlock ? "🔓 Unlockable Perk:" : "✨ Community Perks:"}
                    </span>
                    <p className="mt-0.5 font-medium text-zinc-600">
                      {lvl.unlock || "Full community engagement, discussion access, and strategy network."}
                    </p>
                  </div>

                  {/* Community Share Bar */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500">
                      <span>Community at this tier</span>
                      <span>{shareInfo?.percent || 0}% of members</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${shareInfo?.percent || 0}%` }}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* RENDER VIEW: HOW POINTS WORK (GAMIFICATION RULES GUIDE) */}
      {activeTab === "rules" && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-r from-primary via-indigo-700 to-indigo-900 p-6 text-white shadow-md">
            <h2 className="text-xl font-black">How to Earn Points & Climb the Leaderboards</h2>
            <p className="mt-1 text-xs text-zinc-200 max-w-2xl leading-relaxed">
              Points represent your active contribution, consistency, and skill growth. Active members unlock access to premium courses, specialist channels, and mastermind calls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 text-lg font-black">
                  +5
                </span>
                <div>
                  <h3 className="text-sm font-black text-zinc-900">Create Valuable Community Posts</h3>
                  <p className="text-xs text-zinc-500">Share your wins, SEO case studies, or questions in the Community.</p>
                </div>
              </div>
              <p className="text-xs text-zinc-600 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/60">
                Every approved post in wins, chat, or recorded calls grants you 5 points immediately.
              </p>
            </Card>

            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-800 text-lg font-black">
                  +3
                </span>
                <div>
                  <h3 className="text-sm font-black text-zinc-900">Complete Classroom Lessons</h3>
                  <p className="text-xs text-zinc-500">Watch video lessons and mark modules as completed.</p>
                </div>
              </div>
              <p className="text-xs text-zinc-600 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/60">
                Each finished lesson in the Classroom adds 3 points to your lifetime, 7-day, and 30-day scoreboards.
              </p>
            </Card>

            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-800 text-lg font-black">
                  +2
                </span>
                <div>
                  <h3 className="text-sm font-black text-zinc-900">Post Comments & Discussions</h3>
                  <p className="text-xs text-zinc-500">Help other members, provide insights, and engage.</p>
                </div>
              </div>
              <p className="text-xs text-zinc-600 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/60">
                When your comments are approved by moderators, you receive 2 points per valuable contribution.
              </p>
            </Card>

            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 text-lg font-black">
                  +1
                </span>
                <div>
                  <h3 className="text-sm font-black text-zinc-900">Receive Likes on Your Content</h3>
                  <p className="text-xs text-zinc-500">Earn recognition when peers appreciate your insights.</p>
                </div>
              </div>
              <p className="text-xs text-zinc-600 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/60">
                Every like your posts receive automatically credits +1 point to your profile.
              </p>
            </Card>
          </div>

          <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-5 space-y-2">
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
              <Sparkles size={15} className="text-amber-600" /> Leaderboard Seasons & Reset Cycles
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              The <strong>7-Day Sprint</strong> measures activity over the last 7 rolling days, while the <strong>30-Day Season</strong> tracks the rolling month. All-Time points represent your cumulative reputation and permanent level unlocks!
            </p>
          </div>
        </div>
      )}

      {/* Direct Chat Drawer Binding */}
      <ChatDrawer userId={chatId} onClose={() => setChatId(null)} />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition whitespace-nowrap active:scale-95 cursor-pointer ${
        active
          ? "bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-900"
          : "bg-white ring-1 ring-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-2xs"
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <span
          className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
            active ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
