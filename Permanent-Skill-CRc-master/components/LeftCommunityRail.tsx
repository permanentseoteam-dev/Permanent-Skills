"use client";

import Link from "next/link";
import { Compass, Plus } from "lucide-react";
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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0b1b4a] via-[#1e1b4b] to-[#5051F9] border border-[#5051F9]/60 shadow-xs">
          <span className="font-mono text-xs font-black text-amber-400">&gt;_</span>
        </div>
      );
    }

    if (c.type === "team" || c.slug === "team-members") {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1e1b4b] via-[#4c1d95] to-[#7c3aed] border border-purple-400/50 shadow-xs">
          <span className="text-xs font-black text-purple-200">TM</span>
        </div>
      );
    }

    // Default icon with blue + purple gradient
    const initials = c.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();

    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0b1b4a] via-[#3d3ee6] to-[#7c83ff] border border-indigo-300/40 shadow-xs">
        <span className="text-[11px] font-black tracking-tight text-white drop-shadow-xs">
          {initials || "PS"}
        </span>
      </div>
    );
  }

  return (
    <aside
      className="fixed left-2.5 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col items-center gap-2 p-1.5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#5051F9]/20 shadow-[0_8px_30px_rgba(80,81,249,0.14)] select-none"
      aria-label="Community switcher dock"
    >
      {/* 1. Discover Communities Button */}
      <Link
        href="/discover"
        className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-[#5051F9] hover:to-[#7c83ff] border border-[#5051F9]/25 text-[#5051F9] hover:text-white transition-all duration-200 shadow-2xs hover:scale-110 hover:shadow-[0_4px_14px_rgba(80,81,249,0.35)]"
        title="Discover communities"
      >
        <Compass size={18} className="transition-colors" />

        {/* Tooltip on hover */}
        <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 rounded-lg bg-gradient-to-r from-zinc-900 to-[#1e1b4b] border border-[#5051F9]/30 px-2.5 py-1 text-xs font-bold text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          Discover communities
        </span>
      </Link>

      {/* 2. Inactive Communities List */}
      {inactiveCommunities.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => switchCommunity(c.id)}
          className="group relative flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-[0_4px_14px_rgba(80,81,249,0.35)] cursor-pointer"
          title={`Switch to ${c.name}`}
        >
          {renderCommunityIcon(c)}

          {/* Tooltip on hover */}
          <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 rounded-lg bg-gradient-to-r from-zinc-900 to-[#1e1b4b] border border-[#5051F9]/30 px-2.5 py-1 text-xs font-bold text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {c.name}
          </span>
        </button>
      ))}

      {/* 3. Create Community Quick Action */}
      <Link
        href="/create-community"
        className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-50/90 to-indigo-50/90 hover:from-[#5051F9] hover:to-[#3d3ee6] border border-dashed border-[#5051F9]/40 text-[#5051F9] hover:text-white transition-all duration-200 shadow-2xs hover:scale-110 hover:shadow-[0_4px_14px_rgba(80,81,249,0.35)] mt-0.5"
        title="Create a new community"
      >
        <Plus size={16} />
        <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 rounded-lg bg-gradient-to-r from-zinc-900 to-[#1e1b4b] border border-[#5051F9]/30 px-2.5 py-1 text-xs font-bold text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          Create a community
        </span>
      </Link>
    </aside>
  );
}

