"use client";

import { useState } from "react";
import { Play, Star } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, Card, GoldButton, PrimaryButton, inputClass } from "@/components/ui";
import { UpgradeModal } from "@/components/UpgradeModal";
import { timeAgo } from "@/lib/format";

const features = [
  "Step-by-step training, beginner to advanced",
  "A proven system for skills and SEO that compound",
  "Offer, cluster, and proof templates",
  "SOPs, KPIs, and weekly operating cadence",
  "Ads & organic page reviews",
  "Weekly live training calls",
  "Daily community Q&A",
  "Built for coaches, agencies, local businesses, and operators",
];

export default function AboutPage() {
  const { reviews, users, user, userById, addReview, activeCommunity } = useApp();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");

  const approvedUsers = users.filter((u) => u.status !== "pending" && u.status !== "rejected");
  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 5;

  const communityTitle = activeCommunity?.name || "Permanent Skill Strategy";

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        <Card className="p-6">
          <h1 className="text-2xl font-bold">{communityTitle}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-zinc-500">
            <Star size={14} className="text-amber-400" fill="currentColor" /> {avgRating.toFixed(1)} · {reviews.length} reviews
          </p>
          <div className="relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1b4a] via-[#5051F9] to-[#22d3ee] p-10 text-white">
            <p className="text-5xl font-black leading-none">REAL STATS</p>
            <p className="mt-2 text-white/80">real members · real compounding</p>
            <button
              onClick={() => setOpen(true)}
              className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-lg transition hover:scale-105 active:scale-95"
              aria-label="Play video"
            >
              <Play fill="currentColor" size={20} className="ml-0.5" />
            </button>
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            Private · {approvedUsers.length}+ members · $9/month · By PSS Admin
          </p>
          <div className="mt-4 space-y-2 text-sm leading-6 text-zinc-700">
            <p>Join today for $9/month after approval. Applications are reviewed so the room stays useful.</p>
            <p>Think durable skills take years and $10k courses? Think again.</p>
            <p className="font-semibold">What&apos;s inside:</p>
            <ul className="space-y-1">
              {features.map((f) => (
                <li key={f}>✅ {f}</li>
              ))}
            </ul>
            <p className="pt-2 font-semibold">If you&apos;re tired of:</p>
            <ul className="space-y-1">
              <li>❌ Tactics that expire</li>
              <li>❌ Testing blindly</li>
              <li>❌ Wasting budget on noise</li>
              <li>❌ No real framework</li>
            </ul>
            <p>If any of those sound familiar, {communityTitle} is for you.</p>
          </div>
          {!user?.isPremium && (
            <GoldButton className="mt-5" onClick={() => setOpen(true)}>
              Upgrade to Premium
            </GoldButton>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">{avgRating.toFixed(1)} · {reviews.length} reviews</h2>
          <div className="mt-3 flex gap-2">
            <input
              className={inputClass}
              placeholder="Write a review..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <select
              className={inputClass}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
            <PrimaryButton
              onClick={async () => {
                if (!body.trim()) return;
                await addReview(rating, body);
                setBody("");
              }}
            >
              Post
            </PrimaryButton>
          </div>
          <div className="mt-5 space-y-4">
            {reviews.map((r) => {
              const author = userById(r.userId);
              return (
                <div key={r.id} className="flex gap-3 border-t border-zinc-100 pt-4">
                  <Avatar user={author} size={40} />
                  <div>
                    <p className="font-semibold">{author?.name}</p>
                    <p className="text-amber-400">{"★".repeat(r.rating)}</p>
                    <p className="text-sm text-zinc-700">{r.body}</p>
                    <p className="text-xs text-zinc-400">{timeAgo(r.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Sidebar />
      <UpgradeModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
