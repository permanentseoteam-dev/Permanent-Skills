"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  MapPin,
  MessageCircle,
  Settings,
  Sparkles,
  ThumbsUp,
  Trophy,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Avatar, Card, PrimaryButton, StaffRoleFavicon, UserRoleBadge } from "@/components/ui";
import { ChatDrawer } from "@/components/ChatDrawer";
import { getLevel } from "@/lib/levels";
import { timeAgo } from "@/lib/format";

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { userById, user, posts, comments } = useApp();
  const [chatId, setChatId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "comments" | "level">("posts");
  const person = userById(params.id);

  const userPosts = useMemo(
    () => (posts || []).filter((p) => p.authorId === person?.id),
    [posts, person?.id]
  );
  const userComments = useMemo(
    () => (comments || []).filter((c) => c.authorId === person?.id),
    [comments, person?.id]
  );

  if (!person) {
    return (
      <div className="mx-auto max-w-xl text-center p-8 sm:p-12 bg-white rounded-2xl border border-zinc-200">
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
  const isMe = person.id === user?.id;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/members"
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition cursor-pointer active:scale-95"
        >
          <ChevronLeft size={14} /> Back to Directory
        </Link>

        {isMe && (
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition cursor-pointer active:scale-95"
          >
            <Settings size={14} /> Edit Profile
          </Link>
        )}
      </div>

      <Card className="p-5 sm:p-8 text-center relative overflow-hidden shadow-sm">
        {/* Subtle decorative banner gradient */}
        <div className="absolute top-0 inset-x-0 h-20 sm:h-24 bg-gradient-to-r from-primary/10 via-[#6366f1]/10 to-[#7c83ff]/10" />

        <div className="relative z-10 pt-2 sm:pt-4">
          <Avatar
            user={person}
            size={84}
            className="mx-auto border-4 border-white shadow-md ring-1 ring-zinc-200 sm:w-24 sm:h-24"
          />

          <div className="mt-3.5 sm:mt-4 flex items-center justify-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900">{person.name}</h1>
            <UserRoleBadge role={person.role} isPremium={isVipOnly} size="md" />
          </div>

          <p className="mt-0.5 text-xs font-semibold text-zinc-400 font-mono">
            @{person.username}
          </p>

          <div className="mt-2.5 sm:mt-3 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 sm:px-3 py-1 text-xs font-extrabold text-amber-700 border border-amber-300/60 shadow-2xs">
              <Trophy size={13} /> Level {level.level} · {level.name}
            </span>

            {isVipOnly && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 sm:px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200 shadow-2xs">
                💎 VIP Member
              </span>
            )}

            {person.role === "team_member" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 sm:px-3 py-1 text-xs font-bold text-purple-700 border border-purple-200 shadow-2xs">
                Team Specialist
              </span>
            )}
          </div>

          {/* Level Progress */}
          <div className="mt-4 sm:mt-5 max-w-md mx-auto rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5 sm:p-4 space-y-2 text-left">
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
            {level.next && (
              <p className="text-[11px] text-zinc-500 text-right">
                {level.pointsToNext} points needed for Level {level.next.level} ({level.next.name})
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="mt-4 sm:mt-5 grid grid-cols-3 gap-2 sm:gap-3 max-w-md mx-auto text-center">
            <div className="rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 shadow-2xs">
              <p className="text-base sm:text-lg font-black text-zinc-900">{person.points || 0}</p>
              <p className="text-[10px] sm:text-[11px] font-medium text-zinc-500">Total Points</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 shadow-2xs">
              <p className="text-base sm:text-lg font-black text-primary">+{person.points7d || 0}</p>
              <p className="text-[10px] sm:text-[11px] font-medium text-zinc-500">7-Day Score</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 shadow-2xs">
              <p className="text-base sm:text-lg font-black text-amber-600">+{person.points30d || 0}</p>
              <p className="text-[10px] sm:text-[11px] font-medium text-zinc-500">30-Day Score</p>
            </div>
          </div>

          {person.bio && (
            <p className="mt-4 sm:mt-5 max-w-lg mx-auto text-xs sm:text-sm leading-relaxed text-zinc-700 px-1">
              {person.bio}
            </p>
          )}

          {/* Metadata Row */}
          <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-medium text-zinc-500 border-t border-zinc-100 pt-3.5 sm:pt-4">
            {person.location && (
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-zinc-400" />
                {person.location}
              </span>
            )}

            <span>
              Joined{" "}
              {new Date(person.joinedAt || Date.now()).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>

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

          {/* Staff Information (Admin & Manager viewers only) */}
          {(user?.role === "admin" || user?.role === "manager") && (
            <div className="mt-5 max-w-md mx-auto text-left rounded-xl bg-zinc-900 text-zinc-100 p-3 sm:p-3.5 space-y-2 border border-zinc-800">
              <p className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                Staff View · Account Details
              </p>
              {person.email && (
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="text-zinc-400">Email:</span>
                  <span className="font-mono text-zinc-200 truncate">{person.email}</span>
                </div>
              )}
              {person.status && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Status:</span>
                  <span className="capitalize font-bold text-amber-300">{person.status}</span>
                </div>
              )}
              {person.phone && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Phone:</span>
                  <span className="font-mono text-zinc-200">{person.phone}</span>
                </div>
              )}
              {person.affiliateCode && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Affiliate Code:</span>
                  <span className="font-mono text-zinc-200">{person.affiliateCode}</span>
                </div>
              )}
            </div>
          )}

          {!isMe && (
            <div className="mt-5 sm:mt-6">
              <PrimaryButton
                className="gap-1.5 shadow-sm py-2.5 sm:py-3 text-xs sm:text-sm font-bold active:scale-95"
                onClick={() => setChatId(person.id)}
              >
                <MessageCircle size={15} /> Send Direct Message
              </PrimaryButton>
            </div>
          )}
        </div>
      </Card>

      {/* Member Activity Feed */}
      <Card className="p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 gap-2 flex-wrap">
          <h2 className="text-sm sm:text-base font-bold text-zinc-900">
            Activity & Contributions
          </h2>
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("posts")}
              className={`rounded-lg px-2.5 sm:px-3 py-1 text-xs font-bold transition cursor-pointer active:scale-95 ${
                activeTab === "posts" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Posts ({userPosts.length})
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={`rounded-lg px-2.5 sm:px-3 py-1 text-xs font-bold transition cursor-pointer active:scale-95 ${
                activeTab === "comments" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Comments ({userComments.length})
            </button>
            <button
              onClick={() => setActiveTab("level")}
              className={`rounded-lg px-2.5 sm:px-3 py-1 text-xs font-bold transition cursor-pointer active:scale-95 ${
                activeTab === "level" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Perks
            </button>
          </div>
        </div>

        {/* Tab content: Posts */}
        {activeTab === "posts" && (
          <div className="space-y-2.5 sm:space-y-3">
            {userPosts.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                No discussions or questions shared yet.
              </div>
            ) : (
              userPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/community?post=${post.id}`}
                  className="block rounded-xl border border-zinc-200/80 bg-white p-3 sm:p-4 hover:border-primary/50 hover:shadow-xs transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400 mb-1">
                    <span className="capitalize font-semibold text-zinc-600 bg-zinc-100 rounded-md px-2 py-0.5">
                      {post.category}
                    </span>
                    <span>{timeAgo(post.createdAt)}</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-900 group-hover:text-primary transition break-words">
                    {post.title}
                  </h3>
                  <p className="text-xs text-zinc-600 line-clamp-2 mt-1 leading-relaxed">
                    {post.body}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-zinc-400 mt-2.5 pt-2 border-t border-zinc-100">
                    <span className="inline-flex items-center gap-1 font-medium text-zinc-500">
                      <ThumbsUp size={12} /> {post.likes?.length || 0}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-zinc-500">
                      <MessageCircle size={12} /> View in Community
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Tab content: Comments */}
        {activeTab === "comments" && (
          <div className="space-y-2 sm:space-y-2.5">
            {userComments.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                No comments posted yet.
              </div>
            ) : (
              userComments.map((c) => (
                <Link
                  key={c.id}
                  href={`/community?post=${c.postId}`}
                  className="block rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 hover:bg-zinc-50 hover:border-zinc-200 transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                    <span className="font-semibold text-zinc-500">Left a comment</span>
                    <span>{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-800 break-words leading-relaxed group-hover:text-primary transition">
                    &ldquo;{c.body}&rdquo;
                  </p>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Tab content: Perks & Level Details */}
        {activeTab === "level" && (
          <div className="space-y-2">
            <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3 sm:p-3.5 text-xs text-amber-900">
              <span className="font-bold">Level {level.level} · {level.name}</span>
              <p className="mt-1 text-amber-800 leading-relaxed">
                {level.unlock ? `Unlocked: ${level.unlock}` : "Core community member access unlocked."}
              </p>
            </div>
            {level.next && (
              <p className="text-xs text-zinc-500 text-center pt-2">
                Earn <strong className="font-bold text-zinc-800">{level.pointsToNext} more points</strong> to unlock Level {level.next.level} ({level.next.name}).
              </p>
            )}
          </div>
        )}
      </Card>

      <ChatDrawer userId={chatId} onClose={() => setChatId(null)} />
    </div>
  );
}
