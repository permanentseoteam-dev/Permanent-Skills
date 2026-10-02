"use client";

import Link from "next/link";
import { Compass, Plus, Terminal } from "lucide-react";
import { useApp } from "./AppProvider";
import type { Community } from "@/lib/types";

export function LeftCommunityRail() {
  const { communities, activeCommunity, switchCommunity } = useApp();

  // Inactive communities that are currently not active
  const inactiveCommunities = communities.filter(
    (c) => c.id !== activeCommunity?.id
  );

  function renderCommunityIcon(c: Community) {
    if (c.slug === "ai-architects" || c.name.toLowerCase().includes("ai")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black border border-amber-500/50 shadow-xs">
          <span className="font-mono text-xs font-black text-amber-400">&gt;_</span>
        </div>
      );
    }

    if (c.type === "team" || c.slug === "team-members") {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-purple-500/40 shadow-xs">
          <span className="text-xs font-black text-purple-300">TM</span>
        </div>
      );
    }

    // Default icon
    const initials = c.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();

    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black border border-white/20 shadow-xs">
        <span className="text-[11px] font-black tracking-tight text-white">
          {initials || "PS"}
        </span>
      </div>
    );
  }

  return (
    <aside
      className="fixed left-2 top-20 z-40 hidden sm:flex flex-col items-center gap-2.5 py-2 select-none"
      aria-label="Community switcher dock"
    >
      {/* 1. Discover Communities Button */}
      <Link
        href="/discover"
        className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-600 transition shadow-2xs hover:scale-105"
        title="Discover communities"
      >
        <Compass size={18} className="text-zinc-600 group-hover:text-zinc-900 transition-colors" />

        {/* Tooltip on hover */}
        <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-bold text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          Discover communities
        </span>
      </Link>

      {/* 2. Inactive Communities List */}
      {inactiveCommunities.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => switchCommunity(c.id)}
          className="group relative flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-105 cursor-pointer"
          title={`Switch to ${c.name}`}
        >
          {renderCommunityIcon(c)}

          {/* Tooltip on hover */}
          <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-bold text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {c.name}
          </span>
        </button>
      ))}

      {/* 3. Create Community Quick Action */}
      <Link
        href="/create-community"
        className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-white hover:bg-zinc-100 border border-dashed border-zinc-300 text-zinc-400 hover:text-zinc-700 transition shadow-2xs hover:scale-105 mt-1"
        title="Create a new community"
      >
        <Plus size={16} />
        <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-bold text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          Create a community
        </span>
      </Link>
    </aside>
  );
}
