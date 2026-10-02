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

  const communityName = activeCommunity?.name || "Permanent Skill Strategy";
  const communityDesc =
    activeCommunity?.description ||
    "Learn a durable skill system for SEO, offers, and authority so your pipeline is not rented from an algorithm.";

  return (
    <aside className="w-full shrink-0 space-y-4 lg:w-[300px]">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-[#0b1b4a] via-[#5051F9] to-[#7c83ff] px-4 py-5 text-white">
          <p className="text-lg font-black tracking-wide">THE PERMANENT</p>
          <p className="text-2xl font-black">SKILL METHOD</p>
          <p className="mt-1 text-xs text-white/80">Learn once. Compound forever.</p>
        </div>
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            {activeCommunity?.icon ? (
              <Image src={activeCommunity.icon} alt="" width={28} height={28} className="h-7 w-7 rounded-lg object-contain" />
            ) : (
              <Image src="/logo.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
            )}
            <div>
              <p className="font-semibold truncate max-w-[180px]">{communityName}</p>
              <p className="text-xs text-zinc-500">permanentseo.com</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-zinc-600">
            {communityDesc}
          </p>
          <div className="mt-4 grid grid-cols-3 divide-x divide-zinc-200 border-y border-zinc-100 py-3 text-center">
            <div>
              <p className="text-lg font-semibold">{visible.length}</p>
              <p className="text-xs text-zinc-500">Members</p>
            </div>
            <div>
              <p className="text-lg font-semibold">{online}</p>
              <p className="text-xs text-zinc-500">Online</p>
            </div>
            <div>
              <p className="text-lg font-semibold">{admins}</p>
              <p className="text-xs text-zinc-500">Admins</p>
            </div>
          </div>
          <div className="mt-3 flex -space-x-2">
            {visible.slice(0, 8).map((m) => (
              <Avatar key={m.id} user={m} size={28} className="border-2 border-white" />
            ))}
          </div>
          {!user?.isPremium && (
            <GoldButton className="mt-4 w-full" onClick={() => setUpgradeOpen(true)}>
              UPGRADE
            </GoldButton>
          )}
          <Link href="/settings" className="mt-2 flex items-center justify-center gap-1 py-2 text-sm text-zinc-500 hover:text-zinc-800">
            <Settings size={14} /> Settings
          </Link>
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
