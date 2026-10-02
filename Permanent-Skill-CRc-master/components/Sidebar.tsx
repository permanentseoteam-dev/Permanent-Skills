"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Settings } from "lucide-react";
import { useApp } from "./AppProvider";
import { Avatar, GoldButton } from "./ui";
import { formatMoney } from "@/lib/format";
import { UpgradeModal } from "./UpgradeModal";

export function Sidebar() {
  const { users, stats, user, activeCommunity } = useApp();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const visible = users.filter((u) => u.role === "admin" || u.status === "approved" || typeof u.status === "undefined");
  const online = visible.filter((u) => u.isOnline).length;
  const admins = visible.filter((u) => u.role === "admin").length;
  const top = useMemo(
    () => [...visible].sort((a, b) => b.points30d - a.points30d).slice(0, 5),
    [visible],
  );

  const communityName =
    activeCommunity?.name ||
    (activeCommunity?.type === "team" ? "Team Members" : "Ecommerce Email Marketing");
  const communityDesc =
    activeCommunity?.description ||
    "Join ecommerce founders to learn email marketing from the team behind 200+ brands. Courses, templates, case studies, and much more. ©VEX MEDIA.";
  const memberCount = activeCommunity?.memberCount || visible.length;
  const onlineCount = activeCommunity?.onlineCount || online;
  const adminCount = activeCommunity?.adminCount || admins;

  return (
    <aside className="w-full shrink-0 space-y-4 lg:w-[310px]">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
        {/* Banner matching reference screenshot */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#0e1626] via-[#10243e] to-[#0a1220] p-4 text-white">
          <div className="flex items-start justify-between">
            <div className="pr-16">
              <h2 className="text-xl font-black tracking-tight leading-tight uppercase font-sans">
                {activeCommunity?.type === "team" ? "VEX MEDIA TEAM SPECIALISTS" : "ECOMMERCE EMAIL MARKETING"}
              </h2>
            </div>
            <span className="absolute right-2 top-3 rotate-12 rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-black shadow-xs">
              powered by skool
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 opacity-40">
            <div className="h-12 w-8 rounded-sm bg-white/20" />
            <div className="h-14 w-9 rounded-sm bg-white/30" />
            <div className="h-16 w-10 rounded-sm bg-amber-400/50" />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-base font-bold text-zinc-950">{communityName}</h3>
          <p className="text-xs text-zinc-400 mt-0.5 truncate">
            skool.com/{activeCommunity?.slug || "retention-secrets-by-vex-8995"}
          </p>

          <p className="mt-3 text-xs leading-relaxed text-zinc-600">
            {communityDesc}
          </p>

          <div className="mt-4 grid grid-cols-3 divide-x divide-zinc-200 border-y border-zinc-100 py-3 text-center">
            <div>
              <p className="text-lg font-bold text-zinc-900">{memberCount}</p>
              <p className="text-[11px] font-medium text-zinc-400">Members</p>
            </div>
            <div>
              <p className="text-lg font-bold text-zinc-900">{onlineCount}</p>
              <p className="text-[11px] font-medium text-zinc-400">Online</p>
            </div>
            <div>
              <p className="text-lg font-bold text-zinc-900">{adminCount}</p>
              <p className="text-[11px] font-medium text-zinc-400">Admin</p>
            </div>
          </div>

          <div className="mt-3.5 flex items-center justify-start -space-x-2">
            {visible.slice(0, 5).map((m) => (
              <Avatar key={m.id} user={m} size={28} className="border-2 border-white shadow-xs" />
            ))}
          </div>

          <div className="mt-4 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
            <Link
              href="/settings"
              className="w-full flex items-center justify-center gap-1.5 py-2 font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-50 transition"
            >
              <Settings size={13} /> Settings
            </Link>
          </div>
        </div>
      </div>

      {user?.role === "admin" && stats && (
        <div className="rounded-2xl border border-primary/20 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-primary">Admin only</p>
          <div className="grid grid-cols-1 gap-3">
            <Stat label="Total users" value={String(stats.totalUsers)} />
            <Stat label="Total sales" value={formatMoney(stats.totalSales)} />
            <Stat label="Total logins" value={String(stats.totalLogins)} />
          </div>
          <Link href="/admin" className="mt-3 block text-center text-sm font-medium text-primary">
            Open admin panel →
          </Link>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="mb-3 font-semibold">Leaderboard (30-day)</p>
        <ol className="space-y-3">
          {top.map((m, i) => (
            <li key={m.id}>
              <Link href={`/profile/${m.id}`} className="flex items-center gap-3">
                <span className={`w-5 text-sm font-bold ${i < 3 ? "text-amber-500" : "text-zinc-400"}`}>{i + 1}</span>
                <Avatar user={m} size={32} />
                <span className="flex-1 truncate text-sm font-medium">{m.name}</span>
                <span className="text-sm font-semibold text-primary">+{m.points30d}</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
