"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Film,
  Play,
  Star,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Sidebar } from "@/components/Sidebar";
import {
  Avatar,
  Card,
  GoldButton,
  PrimaryButton,
  UserRoleBadge,
  inputClass,
} from "@/components/ui";
import { UpgradeModal } from "@/components/UpgradeModal";
import { timeAgo } from "@/lib/format";
import { toEmbed } from "@/lib/video";

const defaultFeatures = [
  "Step-by-step training, beginner to advanced",
  "A proven system for skills and SEO that compound",
  "Offer, cluster, and proof templates",
  "SOPs, KPIs, and weekly operating cadence",
  "Ads & organic page reviews",
  "Weekly live training calls",
  "Daily community Q&A",
  "Built for coaches, agencies, local businesses, and operators",
];

type VideoConfig = {
  videoUrl: string;
  thumbnailUrl?: string;
};

const defaultVideoConfig: VideoConfig = {
  videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
};

export default function AboutPage() {
  const { reviews, users, user, userById, addReview, activeCommunity, videoResources } = useApp();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Video Player state
  const [playing, setPlaying] = useState(false);
  const [videoConfig, setVideoConfig] = useState<VideoConfig>(defaultVideoConfig);

  // Find active video resource from Supabase / DB
  const dbVideo = useMemo(() => {
    return (
      videoResources?.find(
        (v) => (v.category === "about" || v.isFeatured) && (!v.communityId || v.communityId === activeCommunity?.id)
      ) ||
      videoResources?.find((v) => v.category === "about" || v.isFeatured) ||
      videoResources?.[0]
    );
  }, [videoResources, activeCommunity?.id]);

  // Load saved video config from Supabase DB or localStorage fallback
  useEffect(() => {
    if (dbVideo) {
      const activeUrl = dbVideo.videoUrl || dbVideo.videoFileUrl || dbVideo.videoFileData || defaultVideoConfig.videoUrl;
      setVideoConfig({
        videoUrl: activeUrl,
        thumbnailUrl: dbVideo.thumbnailUrl || undefined,
      });
      return;
    }

    try {
      const saved = localStorage.getItem("ps_about_video_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        setVideoConfig({
          videoUrl: parsed.videoUrl || defaultVideoConfig.videoUrl,
          thumbnailUrl: parsed.thumbnailUrl || undefined,
        });
      }
    } catch {
      // Fallback to defaults
    }
  }, [dbVideo]);

  const approvedUsers = useMemo(
    () => users.filter((u) => u.status !== "pending" && u.status !== "rejected"),
    [users]
  );

  const avgRating = useMemo(() => {
    return reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 5;
  }, [reviews]);

  const communityTitle = activeCommunity?.name || "AI Architects";
  const embed = useMemo(() => toEmbed(videoConfig.videoUrl), [videoConfig.videoUrl]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-5">
        {/* Main Community Overview Card */}
        <Card className="p-6 sm:p-7 shadow-sm">
          {/* Header Title & Reviews */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                {communityTitle}
              </h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-zinc-600 font-medium">
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star size={15} fill="currentColor" /> {avgRating.toFixed(1)}
                </span>
                <span>·</span>
                <span>{reviews.length} reviews</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active Community
                </span>
              </div>
            </div>
          </div>

          {/* 16:9 Big Thumbnail / Video Player Container */}
          <div className="mt-5 relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-200 shadow-md group">
            {playing ? (
              embed?.type === "file" ? (
                <div className="relative h-full w-full bg-black">
                  <video
                    src={embed.src}
                    controls
                    autoPlay
                    className="h-full w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setPlaying(false)}
                    className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black transition cursor-pointer"
                    title="Close Video"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : embed ? (
                <div className="relative h-full w-full bg-black">
                  <iframe
                    src={`${embed.src}${embed.src.includes("?") ? "&" : "?"}autoplay=1`}
                    title="Community Video"
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  <button
                    type="button"
                    onClick={() => setPlaying(false)}
                    className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black transition cursor-pointer shadow-md"
                    title="Close Video"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-zinc-400 bg-zinc-900 p-6 text-center">
                  <Film size={36} className="text-zinc-500" />
                  <p className="text-sm font-semibold">Video preview currently unavailable</p>
                  <button
                    onClick={() => setPlaying(false)}
                    className="mt-2 text-xs text-primary underline cursor-pointer"
                  >
                    Back to thumbnail
                  </button>
                </div>
              )
            ) : (
              /* Big 16:9 Thumbnail Hero with Clean Play Trigger */
              <div
                onClick={() => setPlaying(true)}
                className="relative h-full w-full cursor-pointer select-none bg-gradient-to-br from-[#0b1b4a] via-[#5051F9] to-[#22d3ee] flex items-center justify-center overflow-hidden"
              >
                {/* Custom Image Thumbnail background if present */}
                {videoConfig.thumbnailUrl && (
                  <img
                    src={videoConfig.thumbnailUrl}
                    alt={communityTitle}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}

                {/* Subtle dark gradient overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />

                {/* Center Large Play Action Button */}
                <div className="relative z-10 flex items-center justify-center">
                  <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-white text-primary shadow-2xl ring-8 ring-white/30 transition-all duration-300 group-hover:scale-110 group-hover:bg-[#5051F9] group-hover:text-white group-hover:ring-primary/40">
                    <Play fill="currentColor" size={32} className="ml-1 sm:h-10 sm:w-10" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Member Metadata Row */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-zinc-100 py-3 text-xs sm:text-sm text-zinc-600">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-semibold text-zinc-900">
                👥 {approvedUsers.length}+ Members
              </span>
              <span>·</span>
              <span className="font-semibold text-primary">
                💳 $9/month
              </span>
              <span>·</span>
              <span>By <strong>Permanent Skills Team</strong></span>
            </div>

            {user?.isPremium ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle2 size={13} /> Active VIP Membership
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                🔒 Subscription Required
              </span>
            )}
          </div>

          {/* Description & Features Matrix */}
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-zinc-700">
            <p className="text-base font-medium text-zinc-900">
              Join today for <strong className="text-primary font-bold">$9/month</strong> after approval. Applications are reviewed so the room stays useful and highly compounding.
            </p>
            <p>
              Think durable skills take years and $10k courses? Think again. The Permanent Skill framework teaches systems that generate compounding authority and revenue.
            </p>

            <div className="pt-2">
              <p className="text-sm font-bold uppercase tracking-wider text-zinc-900 mb-2">
                What&apos;s inside:
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {defaultFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-800">
                    <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✅</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2">
              <p className="text-sm font-bold uppercase tracking-wider text-zinc-900 mb-2">
                If you&apos;re tired of:
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {[
                  "Tactics that expire with every algorithm update",
                  "Testing blindly with no blueprint",
                  "Wasting ad budget on vanity noise",
                  "Operating with no repeatable framework",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-600">
                    <span className="text-red-500 font-bold shrink-0 mt-0.5">❌</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="pt-2 font-medium text-zinc-800">
              If any of those sound familiar, <strong>{communityTitle}</strong> is built for you.
            </p>
          </div>

          {/* Join / Upgrade CTA Button */}
          <div className="mt-6 border-t border-zinc-100 pt-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-bold text-zinc-900">Unlock All Courses & Masterminds</p>
              <p className="text-xs text-zinc-500">Includes weekly live calls, replays, bonuses, and templates.</p>
            </div>
            {!user?.isPremium ? (
              <GoldButton onClick={() => setUpgradeOpen(true)} className="px-6 py-2.5 shadow-sm text-sm font-bold cursor-pointer">
                Upgrade to Premium ($9/mo)
              </GoldButton>
            ) : (
              <span className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-bold text-primary">
                💎 You Have Full Access
              </span>
            )}
          </div>
        </Card>

        {/* Reviews Section */}
        <Card className="p-6 sm:p-7 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <span>Member Reviews & Ratings</span>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-extrabold text-amber-700 border border-amber-200">
                  ★ {avgRating.toFixed(1)} / 5.0
                </span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Authentic feedback from verified community students and mastermind members.
              </p>
            </div>
            <span className="text-xs font-semibold text-zinc-400">
              {reviews.length} total reviews
            </span>
          </div>

          {/* Write Review Form */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!body.trim()) return;
              setReviewSubmitting(true);
              try {
                await addReview(rating, body.trim());
                setBody("");
                setReviewSuccess(true);
                setTimeout(() => setReviewSuccess(false), 3000);
              } finally {
                setReviewSubmitting(false);
              }
            }}
            className="mt-4 space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/70 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                Share Your Experience
              </label>

              {/* Star Rating Picker */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 text-zinc-300 hover:text-amber-400 transition cursor-pointer"
                    title={`${s} Star${s > 1 ? "s" : ""}`}
                  >
                    <Star
                      size={18}
                      className={
                        rating >= s
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-300"
                      }
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-zinc-700 ml-1.5">
                  {rating} / 5 Stars
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className={`${inputClass} flex-1 text-xs`}
                placeholder="Write your review about the courses, calls, or mastermind..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <PrimaryButton
                type="submit"
                disabled={reviewSubmitting || !body.trim()}
                className="text-xs py-2 px-4 shrink-0 shadow-xs cursor-pointer"
              >
                {reviewSubmitting ? "Posting..." : "Post Review"}
              </PrimaryButton>
            </div>

            {reviewSuccess && (
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>Your review has been posted successfully!</span>
              </p>
            )}
          </form>

          {/* Reviews List */}
          <div className="mt-5 divide-y divide-zinc-100">
            {reviews.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center italic">
                No reviews yet. Be the first to share your experience!
              </p>
            ) : (
              reviews.map((r) => {
                const author = userById(r.userId);
                return (
                  <div key={r.id} className="flex items-start gap-3.5 py-4">
                    <Avatar user={author} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-900">
                            {author?.name || "Community Member"}
                          </span>
                          <UserRoleBadge role={author?.role} isPremium={author?.isPremium} size="xs" />
                        </div>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {timeAgo(r.createdAt)}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={i < r.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"}
                          />
                        ))}
                      </div>

                      <p className="mt-1.5 text-xs sm:text-sm text-zinc-700 leading-relaxed">
                        {r.body}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <Sidebar />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
