"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Crown,
  Globe,
  Lock,
  Plus,
  Search,
  Shield,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Card, GoldButton, PrimaryButton } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import type { Community } from "@/lib/types";

type FilterTab = "all" | "joined" | "public" | "private" | "premium";

export default function DiscoverPage() {
  const router = useRouter();
  const {
    allCommunities,
    communities,
    activeCommunity,
    switchCommunity,
    joinCommunity,
    purchaseCommunity,
    user,
  } = useApp();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  const canSeeTeam = user?.role === "admin" || user?.role === "manager" || user?.role === "team_member";
  const isStaff = user?.role === "admin" || user?.role === "manager";

  // Base list of communities with fallbacks
  const list = useMemo(() => {
    const raw: Community[] =
      allCommunities && allCommunities.length > 0
        ? allCommunities
        : [
            {
              id: "comm-ai-architects",
              name: "AI Architects & Agents",
              slug: "ai-architects",
              description:
                "Elite mastermind for AI systems architects, full-stack autonomous agent developers, and digital operators scaling high-yield assets.",
              icon: "/logo.png",
              isPrivate: false,
              memberCount: 168,
              createdAt: "",
              createdBy: "u-admin",
            },
          ];

    return raw.filter((c) => {
      const isTeam =
        c.type === "team" ||
        c.slug === "team-members" ||
        c.id === "comm-team" ||
        c.name.toLowerCase().includes("team");
      if (isTeam && !canSeeTeam) return false;
      return true;
    });
  }, [allCommunities, canSeeTeam]);

  // Filtered list based on search and tab
  const filteredList = useMemo(() => {
    return list.filter((c) => {
      const isJoined = communities.some((j) => j.id === c.id);
      const isPrivate = Boolean(c.isPrivate);
      const isPremium = (c.price || 0) > 0;

      // Tab filter
      if (filterTab === "joined" && !isJoined) return false;
      if (filterTab === "public" && isPrivate) return false;
      if (filterTab === "private" && !isPrivate) return false;
      if (filterTab === "premium" && !isPremium) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = c.name.toLowerCase().includes(q);
        const descMatch = c.description?.toLowerCase().includes(q);
        const slugMatch = c.slug?.toLowerCase().includes(q);
        return nameMatch || descMatch || slugMatch;
      }

      return true;
    });
  }, [list, communities, filterTab, searchQuery]);

  async function handleJoin(communityId: string) {
    setBusyId(communityId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await joinCommunity(communityId);
      if (res.ok) {
        setSuccessMsg("✓ Successfully joined community!");
        setTimeout(() => router.push("/community"), 400);
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
    setSuccessMsg(null);
    try {
      const res = await purchaseCommunity(communityId);
      if (res.ok) {
        setSuccessMsg("✓ Successfully unlocked community access!");
        setTimeout(() => router.push("/community"), 400);
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
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* SECTION 1: HERO & CREATE COMMUNITY TRIGGER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900">Discover Communities</h1>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-bold">
              {list.length} {list.length === 1 ? "Hub" : "Hubs Available"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 leading-normal">
            Explore dedicated mastermind groups, specialized interest hubs, and live collaboration channels.
          </p>
        </div>

        {isStaff && (
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/create-community">
              <PrimaryButton className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs px-4 py-2 font-bold shadow-sm active:scale-95 cursor-pointer">
                <Plus size={14} /> Create Community
              </PrimaryButton>
            </Link>
          </div>
        )}
      </div>

      {/* Action Notification Banners */}
      {errorMsg && (
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-red-50 p-3.5 sm:p-4 text-xs font-semibold text-red-700 border border-red-200 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 p-1 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-emerald-50 p-3.5 sm:p-4 text-xs font-semibold text-emerald-800 border border-emerald-200 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {/* SECTION 2: SEARCH & FILTER BAR */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communities by name, description, topic..."
              className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-8 text-xs outline-none focus:border-zinc-900 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick Stats Counter */}
          <span className="text-xs font-semibold text-zinc-500 self-end sm:self-center">
            Showing {filteredList.length} of {list.length} groups
          </span>
        </div>

        {/* Filter Tabs Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap active:scale-95 cursor-pointer ${
              filterTab === "all"
                ? "bg-zinc-900 text-white shadow-2xs"
                : "bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200 shadow-2xs"
            }`}
          >
            All Communities ({list.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("joined")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap active:scale-95 cursor-pointer ${
              filterTab === "joined"
                ? "bg-primary text-white shadow-2xs"
                : "bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200 shadow-2xs"
            }`}
          >
            My Joined ({communities.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("public")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap active:scale-95 cursor-pointer ${
              filterTab === "public"
                ? "bg-zinc-900 text-white shadow-2xs"
                : "bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200 shadow-2xs"
            }`}
          >
            Public Groups
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("private")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap active:scale-95 cursor-pointer ${
              filterTab === "private"
                ? "bg-zinc-900 text-white shadow-2xs"
                : "bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200 shadow-2xs"
            }`}
          >
            Private Masterminds
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("premium")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap active:scale-95 cursor-pointer ${
              filterTab === "premium"
                ? "bg-amber-500 text-zinc-950 font-black shadow-2xs"
                : "bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200 shadow-2xs"
            }`}
          >
            👑 VIP / Paid
          </button>
        </div>
      </div>

      {/* SECTION 3: COMMUNITIES GRID */}
      {filteredList.length === 0 ? (
        <Card className="p-12 text-center shadow-sm space-y-3">
          <Globe size={36} className="mx-auto text-zinc-300" />
          <h3 className="text-base font-bold text-zinc-900">No Communities Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery
              ? `No communities matched your search for "${searchQuery}".`
              : "No groups match the selected filter."}
          </p>
          {(searchQuery || filterTab !== "all") && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setFilterTab("all");
                }}
                className="inline-flex items-center gap-1 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((c) => {
            const isJoined = communities.some((j) => j.id === c.id);
            const isCurrent = (activeCommunity?.id || "comm-ai-architects") === c.id;
            const isBusy = busyId === c.id;
            const price = c.price || 0;
            const isPrivate = Boolean(c.isPrivate);

            return (
              <Card
                key={c.id}
                className={`flex flex-col justify-between p-5 sm:p-6 transition hover:shadow-md border ${
                  isCurrent
                    ? "border-primary/40 bg-primary/2 shadow-xs"
                    : isJoined
                    ? "border-zinc-200 bg-white hover:border-zinc-300"
                    : "border-zinc-200/90 bg-white hover:border-zinc-300"
                }`}
              >
                <div className="space-y-3.5">
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {c.icon ? (
                        <Image
                          src={c.icon}
                          alt={c.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 object-contain shrink-0 rounded-xl border border-zinc-200 bg-white p-1"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-[#0b1b4a] via-[#3d3ee6] to-[#7c83ff] text-base font-black text-white shadow-xs">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-black text-sm sm:text-base text-zinc-950 truncate tracking-tight">
                            {c.name}
                          </h3>
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500 flex-wrap">
                          <span className="inline-flex items-center gap-1 font-medium">
                            {isPrivate ? <Lock size={11} className="text-zinc-400" /> : <Globe size={11} className="text-zinc-400" />}
                            {isPrivate ? "Private Mastermind" : "Public Community"}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-zinc-600">
                            <Users size={11} className="text-zinc-400" /> {c.memberCount || 1} members
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill Badge */}
                    {isCurrent ? (
                      <span className="shrink-0 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                        ● Active Hub
                      </span>
                    ) : isJoined ? (
                      <span className="shrink-0 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold">
                        Joined
                      </span>
                    ) : price > 0 ? (
                      <span className="shrink-0 rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[10px] font-bold">
                        {formatMoney(price)}
                      </span>
                    ) : null}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-600 line-clamp-3 leading-relaxed">
                    {c.description || "A collaborative space for learning, sharing project updates, and connecting with peers."}
                  </p>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-4 mt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    {isJoined && !isCurrent && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                        <Check size={12} /> Member Access
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isCurrent ? (
                      <button
                        type="button"
                        onClick={() => router.push("/community")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white px-4 py-2 text-xs font-bold hover:bg-emerald-700 transition shadow-2xs cursor-pointer active:scale-95"
                      >
                        <Check size={13} /> Open Feed
                      </button>
                    ) : isJoined ? (
                      <PrimaryButton
                        onClick={() => {
                          switchCommunity(c.id);
                          router.push("/community");
                        }}
                        className="text-xs px-4 py-2 font-bold cursor-pointer active:scale-95"
                      >
                        Switch Hub <ArrowRight size={13} />
                      </PrimaryButton>
                    ) : price > 0 ? (
                      <GoldButton
                        disabled={isBusy}
                        onClick={() => handlePurchase(c.id)}
                        className="inline-flex items-center gap-1.5 text-xs px-4 py-2 font-bold cursor-pointer active:scale-95"
                      >
                        <Sparkles size={13} /> {isBusy ? "Unlocking..." : `Unlock — ${formatMoney(price)}`}
                      </GoldButton>
                    ) : (
                      <PrimaryButton
                        disabled={isBusy}
                        onClick={() => handleJoin(c.id)}
                        className="text-xs inline-flex items-center gap-1.5 px-4 py-2 font-bold cursor-pointer active:scale-95"
                      >
                        <Plus size={13} /> {isBusy ? "Joining..." : "Join Free"}
                      </PrimaryButton>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
