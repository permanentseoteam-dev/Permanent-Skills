"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { Card, PrimaryButton, GoldButton } from "@/components/ui";
import { Lock, Globe, Users, Plus, Check, Sparkles, AlertCircle } from "lucide-react";
import { formatMoney } from "@/lib/format";

export default function DiscoverPage() {
  const router = useRouter();
  const { allCommunities, communities, activeCommunity, switchCommunity, joinCommunity, purchaseCommunity, user } = useApp();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canSeeTeam = user?.role === "admin" || user?.role === "manager" || user?.role === "team_member";

  const list = useMemo(() => {
    const raw = allCommunities && allCommunities.length > 0 ? allCommunities : [
      {
        id: "comm-ai-architects",
        name: "AI Architects",
        slug: "ai-architects",
        description: "Elite mastermind for AI systems architects, full-stack agent developers, and digital operators.",
        icon: "/logo.png",
        isPrivate: false,
        memberCount: 168,
        createdAt: "",
        createdBy: "u-admin",
      },
    ];

    return raw.filter((c) => {
      const isTeam = c.type === "team" || c.slug === "team-members" || c.id === "comm-team" || c.name.toLowerCase().includes("team");
      if (isTeam && !canSeeTeam) return false;
      return true;
    });
  }, [allCommunities, canSeeTeam]);

  async function handleJoin(communityId: string) {
    setBusyId(communityId);
    setErrorMsg(null);
    try {
      const res = await joinCommunity(communityId);
      if (res.ok) {
        router.push("/community");
      } else {
        setErrorMsg(res.error || "Failed to join community.");
      }
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function handlePurchase(communityId: string) {
    setBusyId(communityId);
    setErrorMsg(null);
    try {
      const res = await purchaseCommunity(communityId);
      if (res.ok) {
        router.push("/community");
      } else {
        setErrorMsg(res.error || "Failed to unlock community.");
      }
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Discover communities</h1>
          <p className="text-sm text-zinc-500">Explore and switch between active communities and special interest groups.</p>
        </div>
        <Link href="/create-community">
          <PrimaryButton className="inline-flex items-center gap-1.5 text-xs">
            <Plus size={15} /> Create community
          </PrimaryButton>
        </Link>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-200 animate-in fade-in duration-150">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid gap-4">
        {list.map((c) => {
          const isJoined = communities.some((j) => j.id === c.id);
          const isCurrent = (activeCommunity?.id || "comm-ai-architects") === c.id;
          const isBusy = busyId === c.id;
          const price = c.price || 0;

          return (
            <Card key={c.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 hover:border-zinc-300 transition shadow-2xs">
              {c.icon ? (
                <Image src={c.icon} alt="" width={56} height={56} className="h-14 w-14 object-contain shrink-0 rounded-xl" />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0b1b4a] via-[#3d3ee6] to-[#7c83ff] text-xl font-bold text-white shadow-xs">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-zinc-900 truncate">{c.name}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                    {c.isPrivate ? <Lock size={11} /> : <Globe size={11} />}
                    {c.isPrivate ? "Private" : "Public"}
                  </span>
                  {price > 0 && !isJoined && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                      {formatMoney(price)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-600 line-clamp-2 leading-relaxed">{c.description}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {c.memberCount || 1} members
                  </span>
                  {isJoined && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                      <Check size={12} /> Member
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 pt-2 sm:pt-0">
                {isCurrent ? (
                  <button
                    onClick={() => router.push("/community")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer border border-emerald-200"
                  >
                    <Check size={14} /> Active (Open)
                  </button>
                ) : isJoined ? (
                  <PrimaryButton
                    onClick={() => {
                      switchCommunity(c.id);
                      router.push("/community");
                    }}
                    className="text-xs"
                  >
                    Switch & Open
                  </PrimaryButton>
                ) : price > 0 ? (
                  <GoldButton
                    disabled={isBusy}
                    onClick={() => handlePurchase(c.id)}
                    className="inline-flex items-center gap-1.5 text-xs"
                  >
                    <Sparkles size={14} /> {isBusy ? "Unlocking..." : `Unlock — ${formatMoney(price)}`}
                  </GoldButton>
                ) : (
                  <PrimaryButton
                    disabled={isBusy}
                    onClick={() => handleJoin(c.id)}
                    className="text-xs inline-flex items-center gap-1.5"
                  >
                    <Plus size={14} /> {isBusy ? "Joining..." : "Join Free"}
                  </PrimaryButton>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
