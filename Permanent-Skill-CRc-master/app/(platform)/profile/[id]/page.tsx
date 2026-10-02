"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, Globe, MapPin, MessageCircle, Shield, Trophy } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Avatar, Card, PrimaryButton, StaffRoleFavicon } from "@/components/ui";
import { ChatDrawer } from "@/components/ChatDrawer";
import { getLevel } from "@/lib/levels";
import { timeAgo } from "@/lib/format";

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { userById, user } = useApp();
  const [chatId, setChatId] = useState<string | null>(null);
  const person = userById(params.id);

  if (!person) {
    return (
      <div className="mx-auto max-w-xl text-center p-12 bg-white rounded-2xl border border-zinc-200">
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

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/members"
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition"
        >
          <ChevronLeft size={14} /> Back to Directory
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
            <StaffRoleFavicon role={person.role} size="md" />
          </div>

          <p className="mt-0.5 text-xs font-semibold text-zinc-400">
            @{person.username}
          </p>

          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700 border border-amber-300/60 shadow-2xs">
              <Trophy size={13} /> Level {level.level} · {level.name}
            </span>

            {person.isPremium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200 shadow-2xs">
                💎 Premium Member
              </span>
            )}

            {person.role === "team_member" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 border border-purple-200 shadow-2xs">
                Team Specialist
              </span>
            )}
          </div>

          {person.bio && (
            <p className="mt-4 max-w-lg mx-auto text-sm leading-relaxed text-zinc-700">
              {person.bio}
            </p>
          )}

          {/* Metadata Row */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-zinc-500 border-t border-zinc-100 pt-4">
            {person.location && (
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-zinc-400" />
                {person.location}
              </span>
            )}

            <span>
              Joined{" "}
              {new Date(person.joinedAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>

            <span>⭐ {person.points || 0} Total Points</span>

            <span>
              {person.isOnline ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              ) : (
                `Active ${timeAgo(person.lastSeenAt || person.joinedAt)}`
              )}
            </span>
          </div>

          {person.id !== user?.id && (
            <div className="mt-6">
              <PrimaryButton
                className="gap-1.5 shadow-sm"
                onClick={() => setChatId(person.id)}
              >
                <MessageCircle size={15} /> Send Direct Message
              </PrimaryButton>
            </div>
          )}
        </div>
      </Card>

      <ChatDrawer userId={chatId} onClose={() => setChatId(null)} />
    </div>
  );
}
