"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Film,
  Link as LinkIcon,
  Pencil,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  Upload,
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

type VideoConfig = {
  title: string;
  subtitle: string;
  videoUrl: string;
  videoFileName?: string;
  thumbnailUrl?: string;
};

const defaultVideoConfig: VideoConfig = {
  title: "REAL STATS",
  subtitle: "real members · real compounding",
  videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
};

export default function AboutPage() {
  const { reviews, users, user, userById, addReview, activeCommunity } = useApp();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Video Player state
  const [playing, setPlaying] = useState(false);
  const [videoConfig, setVideoConfig] = useState<VideoConfig>(defaultVideoConfig);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Video edit form state
  const [videoSourceType, setVideoSourceType] = useState<"link" | "upload">("link");
  const [formTitle, setFormTitle] = useState(defaultVideoConfig.title);
  const [formSubtitle, setFormSubtitle] = useState(defaultVideoConfig.subtitle);
  const [formUrl, setFormUrl] = useState(defaultVideoConfig.videoUrl);
  const [formUploadedData, setFormUploadedData] = useState<string>("");
  const [formUploadedFileName, setFormUploadedFileName] = useState<string>("");
  const [formThumbnailUrl, setFormThumbnailUrl] = useState<string>("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const canEdit = user?.role === "admin" || user?.role === "manager";

  // Load saved video config from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ps_about_video_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        setVideoConfig(parsed);
        setFormTitle(parsed.title || defaultVideoConfig.title);
        setFormSubtitle(parsed.subtitle || defaultVideoConfig.subtitle);
        setFormUrl(parsed.videoUrl || defaultVideoConfig.videoUrl);
        setFormThumbnailUrl(parsed.thumbnailUrl || "");
        if (parsed.videoUrl?.startsWith("data:")) {
          setVideoSourceType("upload");
          setFormUploadedData(parsed.videoUrl);
          setFormUploadedFileName(parsed.videoFileName || "uploaded-video.mp4");
        }
      }
    } catch (e) {
      // Fallback to defaults
    }
  }, []);

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

  // Handle Video File Upload
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormUploadedData(result);
        setFormUploadedFileName(file.name);
        setFormUrl(result);
      }
    };
    reader.readAsDataURL(file);
  }

  // Handle Thumbnail File Upload
  function handleThumbUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormThumbnailUrl(result);
      }
    };
    reader.readAsDataURL(file);
  }

  // Save Video Settings
  function handleSaveVideoConfig(e: React.FormEvent) {
    e.preventDefault();
    const finalUrl =
      videoSourceType === "upload" && formUploadedData
        ? formUploadedData
        : formUrl.trim() || defaultVideoConfig.videoUrl;

    const nextConfig: VideoConfig = {
      title: formTitle.trim() || "REAL STATS",
      subtitle: formSubtitle.trim() || "real members · real compounding",
      videoUrl: finalUrl,
      videoFileName: videoSourceType === "upload" ? formUploadedFileName : undefined,
      thumbnailUrl: formThumbnailUrl.trim() || undefined,
    };

    setVideoConfig(nextConfig);
    setPlaying(false);
    try {
      localStorage.setItem("ps_about_video_config", JSON.stringify(nextConfig));
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditModalOpen(false);
      }, 1000);
    } catch (err) {
      setEditModalOpen(false);
    }
  }

  // Reset Video Settings to default
  function handleResetVideoConfig() {
    setVideoConfig(defaultVideoConfig);
    setFormTitle(defaultVideoConfig.title);
    setFormSubtitle(defaultVideoConfig.subtitle);
    setFormUrl(defaultVideoConfig.videoUrl);
    setFormUploadedData("");
    setFormUploadedFileName("");
    setFormThumbnailUrl("");
    setVideoSourceType("link");
    setPlaying(false);
    try {
      localStorage.removeItem("ps_about_video_config");
    } catch {}
  }

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

            {/* Quick staff badge */}
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
                Private Mastermind
              </span>
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
                    title={videoConfig.title}
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
              /* Big 16:9 Thumbnail Hero with Gradient & Play Trigger */
              <div
                onClick={() => setPlaying(true)}
                className="relative h-full w-full cursor-pointer select-none bg-gradient-to-br from-[#0b1b4a] via-[#5051F9] to-[#22d3ee] p-6 sm:p-10 text-white flex flex-col justify-between overflow-hidden"
              >
                {/* Custom Image Thumbnail background if present */}
                {videoConfig.thumbnailUrl && (
                  <img
                    src={videoConfig.thumbnailUrl}
                    alt={videoConfig.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}

                {/* Subtle dark gradient overlay for high contrast readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />

                {/* Top Control Bar with Edit Video button for staff */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-wider text-white border border-white/20 shadow-xs">
                    <Sparkles size={13} className="text-yellow-300" /> Community Overview
                  </span>

                  {canEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-black/60 hover:bg-black/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-white border border-white/20 transition cursor-pointer shadow-sm"
                    >
                      <Pencil size={13} />
                      <span>Edit Video / Link</span>
                    </button>
                  )}
                </div>

                {/* Center Large Play Action Button */}
                <div className="relative z-10 flex items-center justify-center my-auto">
                  <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-white text-primary shadow-2xl ring-8 ring-white/30 transition-all duration-300 group-hover:scale-110 group-hover:bg-[#5051F9] group-hover:text-white group-hover:ring-primary/40">
                    <Play fill="currentColor" size={32} className="ml-1 sm:h-10 sm:w-10" />
                  </div>
                </div>

                {/* Bottom Title & Subtitle Banner */}
                <div className="relative z-10 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-lg leading-none">
                      {videoConfig.title}
                    </p>
                    <p className="mt-2 text-sm sm:text-base text-white/90 drop-shadow-md font-medium">
                      {videoConfig.subtitle}
                    </p>
                  </div>

                  <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-white/80 bg-white/15 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20">
                    <Play size={12} fill="currentColor" /> Click to Watch
                  </span>
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

      {/* Video Customization Modal (For Upload or Linking from Any Platform) */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Customize Community Video & Banner"
        wide
      >
        <form onSubmit={handleSaveVideoConfig} className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-3">
            <Film size={18} className="text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-700 leading-normal">
              <p className="font-bold text-zinc-900">
                Embed or Upload Community Overview Video
              </p>
              <p className="mt-0.5 text-zinc-600">
                You can link a video directly from YouTube, Loom, Vimeo, Google Drive, or any MP4 URL, or upload a video file from your computer.
              </p>
            </div>
          </div>

          {/* Source Selector Toggle */}
          <div className="flex items-center gap-2 rounded-xl bg-zinc-100 p-1">
            <button
              type="button"
              onClick={() => setVideoSourceType("link")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition cursor-pointer ${
                videoSourceType === "link"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <LinkIcon size={14} />
              <span>Link from Platform (YouTube, Loom, Vimeo)</span>
            </button>

            <button
              type="button"
              onClick={() => setVideoSourceType("upload")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition cursor-pointer ${
                videoSourceType === "upload"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Upload size={14} />
              <span>Upload Video File (.mp4, .webm)</span>
            </button>
          </div>

          {/* Tab 1: Video Link */}
          {videoSourceType === "link" && (
            <Field label="Video Link / URL *">
              <input
                className={inputClass}
                placeholder="e.g. https://www.youtube.com/watch?v=... or https://loom.com/share/..."
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
              />
              <p className="mt-1 text-[11px] text-zinc-500">
                Supported: YouTube, Loom, Vimeo, Google Drive preview, and direct video file URLs (.mp4).
              </p>
            </Field>
          )}

          {/* Tab 2: Upload Video File */}
          {videoSourceType === "upload" && (
            <Field label="Select Video File *">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50/60 p-6 text-center hover:border-primary/50 hover:bg-zinc-50 transition cursor-pointer"
              >
                <Video size={28} className="text-zinc-400 mb-2" />
                <p className="text-xs font-bold text-zinc-800">
                  {formUploadedFileName ? `Selected: ${formUploadedFileName}` : "Click to browse video file"}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Supports MP4, WebM, MOV files
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </Field>
          )}

          {/* Banner Title & Subtitle */}
          <div className="grid gap-3 sm:grid-cols-2 pt-1">
            <Field label="Banner Main Heading">
              <input
                className={inputClass}
                placeholder="e.g. REAL STATS"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </Field>

            <Field label="Banner Subtitle">
              <input
                className={inputClass}
                placeholder="e.g. real members · real compounding"
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
              />
            </Field>
          </div>

          {/* Optional Custom Poster / Thumbnail */}
          <Field label="Custom Thumbnail Image (Optional)">
            <div className="flex gap-2">
              <input
                className={`${inputClass} flex-1 text-xs`}
                placeholder="Paste image URL (https://...)"
                value={formThumbnailUrl}
                onChange={(e) => setFormThumbnailUrl(e.target.value)}
              />
              <button
                type="button"
                onClick={() => thumbInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 shadow-2xs transition cursor-pointer"
              >
                <Upload size={13} />
                <span>Browse</span>
              </button>
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbUpload}
                className="hidden"
              />
            </div>
          </Field>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={handleResetVideoConfig}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset to Default</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
              >
                Cancel
              </button>

              <PrimaryButton type="submit" className="text-xs py-2 px-5 cursor-pointer">
                {saveSuccess ? "Saved!" : "Save Video Settings"}
              </PrimaryButton>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
