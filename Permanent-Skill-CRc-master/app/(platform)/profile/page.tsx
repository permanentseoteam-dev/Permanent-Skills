"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Globe, MapPin, MessageCircle, Shield, Trophy } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Avatar, Card, PrimaryButton, StaffRoleFavicon, UserRoleBadge } from "@/components/ui";
import { getLevel } from "@/lib/levels";

function ProfileView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userById, user } = useApp();
  const queryId = searchParams.get("id");
  const targetId = queryId || user?.id || "";
  const person = userById(targetId) || user;

  if (!person) {
    return (
      <div className="mx-auto max-w-xl text-center p-12 bg-white rounded-2xl border border-zinc-200 shadow-sm">
        <p className="text-base font-bold text-zinc-800">Member not found.</p>
        <Link
          href="/members"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
        >
          ← Back to Members Directory
        </Link>
      </div>
    );
  }

  const level = getLevel(person.points || 0);
  const isVipOnly = person.isPremium && person.role !== "admin" && person.role !== "manager";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/members"
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition"
        >
          <ChevronLeft size={14} /> Back to Members
        </Link>
      </div>

      <Card className="p-8 text-center relative overflow-hidden shadow-sm">
        {/* Subtle decorative banner gradient */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-r from-primary/10 via-[#6366f1]/10 to-[#7c83ff]/10" />

        <div className="relative z-10 pt-4">
          <Avatar
            user={person}
            size={96}
            className="mx-auto border-4 border-white shadow-md ring-1 ring-zinc-200"
          />

          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-zinc-900">{person.name}</h1>
            <UserRoleBadge role={person.role} isPremium={isVipOnly} size="md" />
          </div>

          <p className="mt-0.5 text-xs font-semibold text-zinc-400 font-mono">
            @{person.username}
          </p>

          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700 border border-amber-300/60 shadow-2xs">
              <Trophy size={13} /> Level {level.level} · {level.name}
            </span>

            {isVipOnly && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200 shadow-2xs">
                💎 VIP Member
              </span>
            )}

            {person.role === "team_member" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 border border-purple-200 shadow-2xs">
                Team Specialist
              </span>
            )}
          </div>

          {/* Level Progress */}
          <div className="mt-5 max-w-md mx-auto rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-2 text-left">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                <Trophy size={14} className="text-amber-500" /> Level {level.level} · {level.name}
              </span>
              <span className="font-semibold text-zinc-500">
                {person.points || 0} pts
                {level.next && ` / ${level.next.min} pts`}
              </span>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${level.progress}%` }}
              />
            </div>
          </div>

          {/* Bio & Details */}
          {person.bio && (
            <p className="mt-4 text-sm text-zinc-700 leading-relaxed max-w-lg mx-auto">
              {person.bio}
            </p>
          )}

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-zinc-500">
            {person.location && (
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-zinc-400" /> {person.location}
              </span>
            )}
            <span>
              Joined {new Date(person.joinedAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      }
    >
      <ProfileView />
    </Suspense>
  );
}
