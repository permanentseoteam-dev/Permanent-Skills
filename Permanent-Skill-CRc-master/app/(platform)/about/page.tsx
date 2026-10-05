"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Film,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Star,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Sidebar } from "@/components/Sidebar";
import {
  Avatar,
  Card,
  Field,
  GoldButton,
  Modal,
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

const defaultPainPoints = [
  "Tactics that expire with every algorithm update",
  "Testing blindly with no blueprint",
  "Wasting ad budget on vanity noise",
  "Operating with no repeatable framework",
];

type VideoConfig = {
  videoUrl: string;
  thumbnailUrl?: string;
};

const defaultVideoConfig: VideoConfig = {
  videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
};

export default function AboutPage() {
  const {
    reviews,
    users,
    user,
    userById,
    addReview,
    deleteReview,
    activeCommunity,
    updateCommunityDescription,
    videoResources,
    saveVideoResource,
  } = useApp();

  const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Video Player state
  const [playing, setPlaying] = useState(false);
  const [videoConfig, setVideoConfig] = useState<VideoConfig>(defaultVideoConfig);

  // Edit Video Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editThumbnailUrl, setEditThumbnailUrl] = useState("");
  const [savingVideo, setSavingVideo] = useState(false);
  const [videoSaveError, setVideoSaveError] = useState("");

  // Edit Description Modal state (Admin & Manager only)
  const [editDescModalOpen, setEditDescModalOpen] = useState(false);
  const [editDescPriceNote, setEditDescPriceNote] = useState("");
  const [editDescHeadline, setEditDescHeadline] = useState("");
  const [editDescMainStory, setEditDescMainStory] = useState("");
  const [editDescFeatures, setEditDescFeatures] = useState<string[]>([]);
  const [editDescPainPoints, setEditDescPainPoints] = useState<string[]>([]);
  const [editDescClosingText, setEditDescClosingText] = useState("");
  const [savingDesc, setSavingDesc] = useState(false);
  const [descSaveError, setDescSaveError] = useState("");
  const [descSaveSuccess, setDescSaveSuccess] = useState(false);

  function openEditModal() {
    setEditVideoUrl(videoConfig.videoUrl || "");
    setEditThumbnailUrl(videoConfig.thumbnailUrl || "");
    setVideoSaveError("");
    setEditModalOpen(true);
  }

  function openEditDescModal() {
    setEditDescPriceNote(activeCommunity?.priceNote || "$9/month");
    setEditDescHeadline(
      activeCommunity?.aboutHeadline ||
        activeCommunity?.headline ||
        "Join today for $9/month after approval. Applications are reviewed so the room stays useful and highly compounding."
    );
    setEditDescMainStory(
      activeCommunity?.aboutDescription ||
        activeCommunity?.description ||
        "Think durable skills take years and $10k courses? Think again. The Permanent Skill framework teaches systems that generate compounding authority and revenue."
    );
    setEditDescFeatures(
      activeCommunity?.aboutFeatures && activeCommunity.aboutFeatures.length > 0
        ? [...activeCommunity.aboutFeatures]
        : [...defaultFeatures]
    );
    setEditDescPainPoints(
      activeCommunity?.aboutPainPoints && activeCommunity.aboutPainPoints.length > 0
        ? [...activeCommunity.aboutPainPoints]
        : [...defaultPainPoints]
    );
    setEditDescClosingText(
      activeCommunity?.aboutClosingText ||
        `If any of those sound familiar, ${activeCommunity?.name || "AI Architects"} is built for you.`
    );
    setDescSaveError("");
    setDescSaveSuccess(false);
    setEditDescModalOpen(true);
  }

  async function handleSaveDescription(e: React.FormEvent) {
    e.preventDefault();
    if (!activeCommunity?.id) {
      setDescSaveError("No active community selected.");
      return;
    }

    setSavingDesc(true);
    setDescSaveError("");

    try {
      const res = await updateCommunityDescription({
        communityId: activeCommunity.id,
        priceNote: editDescPriceNote.trim() || "$9/month",
        aboutHeadline: editDescHeadline.trim(),
        headline: editDescHeadline.trim(),
        aboutDescription: editDescMainStory.trim(),
        aboutFeatures: editDescFeatures.map((f) => f.trim()).filter(Boolean),
        aboutPainPoints: editDescPainPoints.map((p) => p.trim()).filter(Boolean),
        aboutClosingText: editDescClosingText.trim(),
      });

      if (!res.ok) {
        setDescSaveError(res.error || "Failed to update community description.");
        return;
      }

      setDescSaveSuccess(true);
      setTimeout(() => {
        setEditDescModalOpen(false);
        setDescSaveSuccess(false);
      }, 700);
    } catch (err: any) {
      console.error(err);
      setDescSaveError(err.message || "Failed to save description.");
    } finally {
      setSavingDesc(false);
    }
  }

  function handleResetDescriptionDefaults() {
    setEditDescPriceNote("$9/month");
    setEditDescHeadline(
      "Join today for $9/month after approval. Applications are reviewed so the room stays useful and highly compounding."
    );
    setEditDescMainStory(
      "Think durable skills take years and $10k courses? Think again. The Permanent Skill framework teaches systems that generate compounding authority and revenue."
    );
    setEditDescFeatures([...defaultFeatures]);
    setEditDescPainPoints([...defaultPainPoints]);
    setEditDescClosingText(
      `If any of those sound familiar, ${activeCommunity?.name || "AI Architects"} is built for you.`
    );
  }

  async function handleSaveVideo(e: React.FormEvent) {
    e.preventDefault();
    if (!editVideoUrl.trim()) {
      setVideoSaveError("Please enter a valid video URL.");
      return;
    }

    setSavingVideo(true);
    setVideoSaveError("");

    try {
      const updatedConfig: VideoConfig = {
        videoUrl: editVideoUrl.trim(),
        thumbnailUrl: editThumbnailUrl.trim() || undefined,
      };

      // 1. Save to localStorage immediately as local cache
      try {
        localStorage.setItem("ps_about_video_config", JSON.stringify(updatedConfig));
      } catch {}

      setVideoConfig(updatedConfig);

      // 2. Persist to DB & Supabase through saveVideoResource action
      const targetId = dbVideo?.id || `vid-about-${activeCommunity?.id || "default"}`;
      await saveVideoResource({
        id: targetId,
        title: `${activeCommunity?.name || "Community"} Welcome Video`,
        videoUrl: editVideoUrl.trim(),
        thumbnailUrl: editThumbnailUrl.trim() || undefined,
        category: "about",
        isFeatured: true,
        communityId: activeCommunity?.id || "comm-students",
      });

      setEditModalOpen(false);
    } catch (err) {
      console.error(err);
      setVideoSaveError("Failed to save video. Please try again.");
    } finally {
      setSavingVideo(false);
    }
  }

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

  const sortedReviews = useMemo(() => {
    return [...reviews].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [reviews]);

  const communityTitle = activeCommunity?.name || "AI Architects";
  const embed = useMemo(() => toEmbed(videoConfig.videoUrl), [videoConfig.videoUrl]);

  const currentFeatures =
    activeCommunity?.aboutFeatures && activeCommunity.aboutFeatures.length > 0
      ? activeCommunity.aboutFeatures
      : defaultFeatures;

  const currentPainPoints =
    activeCommunity?.aboutPainPoints && activeCommunity.aboutPainPoints.length > 0
      ? activeCommunity.aboutPainPoints
      : defaultPainPoints;

  const currentPriceNote = activeCommunity?.priceNote || "$9/month";
  const currentHeadline =
    activeCommunity?.aboutHeadline ||
    activeCommunity?.headline ||
    `Join today for ${currentPriceNote} after approval. Applications are reviewed so the room stays useful and highly compounding.`;

  const currentMainStory =
    activeCommunity?.aboutDescription ||
    activeCommunity?.description ||
    "Think durable skills take years and $10k courses? Think again. The Permanent Skill framework teaches systems that generate compounding authority and revenue.";

  const currentClosingText =
    activeCommunity?.aboutClosingText ||
    `If any of those sound familiar, ${communityTitle} is built for you.`;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row items-start">
      <div className="min-w-0 w-full flex-1 space-y-4 sm:space-y-5">
        {/* Main Community Overview Card */}
        <Card className="p-4 sm:p-6 lg:p-7 shadow-sm">
          {/* Header Title & Reviews */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-zinc-900 tracking-tight break-words">
                {communityTitle}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-zinc-600 font-medium">
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star size={14} fill="currentColor" /> {avgRating.toFixed(1)}
                </span>
                <span>·</span>
                <span>{reviews.length} reviews</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active Community
                </span>
              </div>
            </div>

            {isAdminOrManager && (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={openEditDescModal}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-zinc-800 shadow-2xs transition cursor-pointer"
                  title="Edit community description, headline & features"
                >
                  <Pencil size={12} className="text-primary" />
                  <span>Edit Description</span>
                </button>
                <button
                  type="button"
                  onClick={openEditModal}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-zinc-800 shadow-2xs transition cursor-pointer"
                  title="Edit video and thumbnail"
                >
                  <Video size={12} className="text-primary" />
                  <span>Edit Video</span>
                </button>
              </div>
            )}
          </div>

          {/* 16:9 Big Thumbnail / Video Player Container */}
          <div className="mt-4 sm:mt-5 relative aspect-video w-full overflow-hidden rounded-xl sm:rounded-2xl bg-zinc-950 border border-zinc-200 shadow-md group">
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
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black transition cursor-pointer shadow-md"
                    title="Close Video"
                  >
                    <X size={15} />
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
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black transition cursor-pointer shadow-md"
                    title="Close Video"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-zinc-400 bg-zinc-900 p-4 sm:p-6 text-center">
                  <Film size={32} className="text-zinc-500" />
                  <p className="text-xs sm:text-sm font-semibold">Video preview currently unavailable</p>
                  <button
                    onClick={() => setPlaying(false)}
                    className="mt-1 text-xs text-primary underline cursor-pointer"
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

                {/* Admin Quick Edit Corner Button */}
                {isAdminOrManager && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal();
                    }}
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 inline-flex items-center gap-1 rounded-lg bg-black/60 hover:bg-black/90 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-white shadow-md backdrop-blur-xs transition cursor-pointer"
                    title="Change community video"
                  >
                    <Pencil size={11} />
                    <span>Change Video</span>
                  </button>
                )}

                {/* Center Large Play Action Button */}
                <div className="relative z-10 flex items-center justify-center">
                  <div className="flex h-14 w-14 sm:h-20 sm:w-20 lg:h-24 lg:w-24 items-center justify-center rounded-full bg-white text-primary shadow-2xl ring-6 sm:ring-8 ring-white/30 transition-all duration-300 group-hover:scale-110 group-hover:bg-[#5051F9] group-hover:text-white group-hover:ring-primary/40">
                    <Play fill="currentColor" size={24} className="ml-1 sm:size-8 lg:size-10" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Member Metadata Row */}
          <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-y border-zinc-100 py-3 text-xs sm:text-sm text-zinc-600">
            <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1">
              <span className="font-semibold text-zinc-900">
                👥 {approvedUsers.length}+ Members
              </span>
              <span>·</span>
              <span className="font-semibold text-primary">
                💳 {currentPriceNote}
              </span>
              <span>·</span>
              <span>By <strong>Permanent Skills Team</strong></span>
            </div>

            <div className="shrink-0">
              {user?.isPremium ? (
                <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={13} /> Active VIP Membership
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  🔒 Subscription Required
                </span>
              )}
            </div>
          </div>

          {/* Description & Features Matrix */}
          <div className="mt-4 sm:mt-5 space-y-4 text-xs sm:text-sm leading-relaxed text-zinc-700 relative">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <p className="text-sm sm:text-base font-semibold text-zinc-900 flex-1 leading-snug">
                {currentHeadline}
              </p>
              {isAdminOrManager && (
                <button
                  type="button"
                  onClick={openEditDescModal}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg transition cursor-pointer self-start shrink-0"
                  title="Edit community description section"
                >
                  <Pencil size={11} />
                  <span>Edit Description</span>
                </button>
              )}
            </div>

            <p className="whitespace-pre-line text-zinc-700 text-xs sm:text-sm leading-relaxed">
              {currentMainStory}
            </p>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900">
                  What&apos;s inside:
                </p>
                {isAdminOrManager && (
                  <button
                    type="button"
                    onClick={openEditDescModal}
                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Edit Checklist
                  </button>
                )}
              </div>
              <ul className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                {currentFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-800">
                    <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✅</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900">
                  If you&apos;re tired of:
                </p>
                {isAdminOrManager && (
                  <button
                    type="button"
                    onClick={openEditDescModal}
                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Edit Pain Points
                  </button>
                )}
              </div>
              <ul className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                {currentPainPoints.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-600">
                    <span className="text-red-500 font-bold shrink-0 mt-0.5">❌</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="pt-2 font-medium text-xs sm:text-sm text-zinc-800">
              {currentClosingText}
            </p>
          </div>

          {/* Join / Upgrade CTA Button */}
          <div className="mt-6 border-t border-zinc-100 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs sm:text-sm font-bold text-zinc-900">Unlock All Courses & Masterminds</p>
              <p className="text-xs text-zinc-500">Includes weekly live calls, replays, bonuses, and templates.</p>
            </div>
            {!user?.isPremium ? (
              <GoldButton onClick={() => setUpgradeOpen(true)} className="w-full sm:w-auto px-6 py-2.5 shadow-sm text-xs sm:text-sm font-bold cursor-pointer justify-center text-center">
                👑 Upgrade to VIP ($9/mo)
              </GoldButton>
            ) : (
              <span className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-bold text-primary text-center">
                💎 You Have Full Access
              </span>
            )}
          </div>
        </Card>

        {/* Reviews Section */}
        <Card className="p-4 sm:p-6 lg:p-7 shadow-sm">
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
          <div className="mt-4 sm:mt-5 divide-y divide-zinc-100">
            {sortedReviews.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center italic">
                No reviews yet. Be the first to share your experience!
              </p>
            ) : (
              sortedReviews.map((r) => {
                const author = userById(r.userId);
                const canDelete = isAdminOrManager || (user && user.id === r.userId);
                return (
                  <div key={r.id} className="flex items-start gap-3 py-3.5 sm:py-4 group">
                    <Avatar user={author} size={36} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                          <span className="font-bold text-xs sm:text-sm text-zinc-900 truncate max-w-[160px] sm:max-w-none">
                            {author?.name || "Community Member"}
                          </span>
                          <UserRoleBadge role={author?.role} isPremium={author?.isPremium} size="xs" />
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono">
                            {timeAgo(r.createdAt)}
                          </span>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm("Are you sure you want to delete this review?")) {
                                  await deleteReview(r.id);
                                }
                              }}
                              className="text-zinc-400 hover:text-red-500 opacity-80 sm:opacity-0 group-hover:opacity-100 transition p-1 rounded cursor-pointer"
                              title="Delete review"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-1 flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < r.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"}
                          />
                        ))}
                      </div>

                      <p className="mt-1.5 text-xs sm:text-sm text-zinc-700 leading-relaxed break-words">
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

      {/* Admin & Manager Edit Description & Features Modal */}
      {isAdminOrManager && (
        <Modal
          open={editDescModalOpen}
          onClose={() => setEditDescModalOpen(false)}
          title={`Edit Description — ${communityTitle}`}
        >
          <form onSubmit={handleSaveDescription} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            <p className="text-xs text-zinc-500">
              Customize the overview description, marketing hook, deliverables checklist, and pain points for <strong>{communityTitle}</strong>.
            </p>

            {descSaveError && (
              <div className="rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-700 border border-red-200">
                {descSaveError}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Price Badge / Access Note">
                <input
                  type="text"
                  required
                  className={inputClass}
                  placeholder="e.g. $9/month or Free Access"
                  value={editDescPriceNote}
                  onChange={(e) => setEditDescPriceNote(e.target.value)}
                />
              </Field>

              <Field label="Top Headline Callout">
                <input
                  type="text"
                  required
                  className={inputClass}
                  placeholder="e.g. Join today for $9/month after approval..."
                  value={editDescHeadline}
                  onChange={(e) => setEditDescHeadline(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Main Overview Story / Hook">
              <textarea
                rows={3}
                required
                className={`${inputClass} resize-y text-xs sm:text-sm`}
                placeholder="Describe what makes this community valuable..."
                value={editDescMainStory}
                onChange={(e) => setEditDescMainStory(e.target.value)}
              />
            </Field>

            {/* Features Checklist Builder */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                  What&apos;s Inside (Checklist)
                </label>
                <button
                  type="button"
                  onClick={() => setEditDescFeatures([...editDescFeatures, ""])}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Item</span>
                </button>
              </div>

              <div className="space-y-2">
                {editDescFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold shrink-0 text-xs">✅</span>
                    <input
                      type="text"
                      className={`${inputClass} text-xs py-1.5 flex-1`}
                      placeholder={`Feature item #${idx + 1}`}
                      value={feat}
                      onChange={(e) => {
                        const updated = [...editDescFeatures];
                        updated[idx] = e.target.value;
                        setEditDescFeatures(updated);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = editDescFeatures.filter((_, i) => i !== idx);
                        setEditDescFeatures(updated);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-red-500 rounded transition cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Pain Points Builder */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                  If You&apos;re Tired Of (Pain Points)
                </label>
                <button
                  type="button"
                  onClick={() => setEditDescPainPoints([...editDescPainPoints, ""])}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Item</span>
                </button>
              </div>

              <div className="space-y-2">
                {editDescPainPoints.map((pain, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-red-500 font-bold shrink-0 text-xs">❌</span>
                    <input
                      type="text"
                      className={`${inputClass} text-xs py-1.5 flex-1`}
                      placeholder={`Pain point #${idx + 1}`}
                      value={pain}
                      onChange={(e) => {
                        const updated = [...editDescPainPoints];
                        updated[idx] = e.target.value;
                        setEditDescPainPoints(updated);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = editDescPainPoints.filter((_, i) => i !== idx);
                        setEditDescPainPoints(updated);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-red-500 rounded transition cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Field label="Closing Pitch Note">
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. If any of those sound familiar, AI Architects is built for you."
                value={editDescClosingText}
                onChange={(e) => setEditDescClosingText(e.target.value)}
              />
            </Field>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={handleResetDescriptionDefaults}
                className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-800 py-1.5 transition cursor-pointer"
                title="Reset to default copy"
              >
                <RotateCcw size={12} />
                <span>Reset to Defaults</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setEditDescModalOpen(false)}
                  className="flex-1 sm:flex-initial rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <PrimaryButton type="submit" disabled={savingDesc} className="flex-1 sm:flex-initial text-center justify-center">
                  {savingDesc ? (
                    "Saving..."
                  ) : descSaveSuccess ? (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={14} /> Saved!
                    </span>
                  ) : (
                    "Save Description"
                  )}
                </PrimaryButton>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Admin & Manager Edit Video Modal */}
      {isAdminOrManager && (
        <Modal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit Community Overview Video"
        >
          <form onSubmit={handleSaveVideo} className="space-y-4">
            <p className="text-xs text-zinc-500">
              Paste a video link from <strong>YouTube</strong>, <strong>Loom</strong>, <strong>Vimeo</strong>, or a direct <strong>MP4 / video file URL</strong> (e.g. Supabase Storage).
            </p>

            {videoSaveError && (
              <div className="rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-700 border border-red-200">
                {videoSaveError}
              </div>
            )}

            <Field label="Video URL (YouTube, Loom, Vimeo, or MP4 file)">
              <input
                type="text"
                required
                className={inputClass}
                placeholder="e.g. https://www.youtube.com/watch?v=... or https://www.loom.com/share/..."
                value={editVideoUrl}
                onChange={(e) => setEditVideoUrl(e.target.value)}
              />
            </Field>

            <Field label="Custom Thumbnail Image URL (Optional)">
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. https://images.unsplash.com/... or https://your-bucket.supabase.co/..."
                value={editThumbnailUrl}
                onChange={(e) => setEditThumbnailUrl(e.target.value)}
              />
            </Field>

            {/* Quick Preview Box */}
            {editVideoUrl.trim() && (
              <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3 space-y-2">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                  Preview Embed
                </span>
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                  {(() => {
                    const prevEmbed = toEmbed(editVideoUrl.trim());
                    if (!prevEmbed) {
                      return (
                        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                          Invalid or unsupported video URL
                        </div>
                      );
                    }
                    if (prevEmbed.type === "file") {
                      return <video src={prevEmbed.src} controls className="h-full w-full object-contain" />;
                    }
                    return (
                      <iframe
                        src={prevEmbed.src}
                        title="Preview"
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="flex-1 sm:flex-initial rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer text-center"
              >
                Cancel
              </button>
              <PrimaryButton type="submit" disabled={savingVideo} className="flex-1 sm:flex-initial text-center justify-center">
                {savingVideo ? "Saving..." : "Save Video"}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
