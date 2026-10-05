"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  Lock,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  Unlock,
  Users,
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
import { AboutHeroCard } from "@/components/AboutHeroCard";
import { generateCourseSlides } from "@/lib/course-about-slides";
import { timeAgo, formatMoney } from "@/lib/format";
import { getLevel } from "@/lib/levels";
import type { Course } from "@/lib/types";

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
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      }
    >
      <AboutPageContent />
    </Suspense>
  );
}

function AboutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseParam = searchParams.get("course");
  const planParam = searchParams.get("plan");

  const {
    courses,
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
    purchaseCourse,
  } = useApp();

  const isAdminOrManager = user?.role === "admin" || user?.role === "manager";
  const userLevelData = getLevel(user?.points || 0);
  const userLevel = userLevelData.level;

  // Selected course if URL specifies a course
  const selectedCourse: Course | null = useMemo(() => {
    if (!courseParam) return null;
    return (
      courses.find(
        (c) =>
          c.id.toLowerCase() === courseParam.toLowerCase() ||
          c.slug.toLowerCase() === courseParam.toLowerCase()
      ) || null
    );
  }, [courses, courseParam]);

  // Modals & Purchase State
  const [upgradeOpen, setUpgradeOpen] = useState(planParam === "vip");
  const [purchasingCourse, setPurchasingCourse] = useState<Course | null>(null);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [purchaseSuccessMsg, setPurchaseSuccessMsg] = useState("");

  // Review Form State
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Video Config
  const [videoConfig, setVideoConfig] = useState<VideoConfig>(defaultVideoConfig);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editThumbnailUrl, setEditThumbnailUrl] = useState("");
  const [savingVideo, setSavingVideo] = useState(false);
  const [videoSaveError, setVideoSaveError] = useState("");

  // Community Description State
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

  // Creator Info Edit State (Admin & Manager)
  const [editCreatorModalOpen, setEditCreatorModalOpen] = useState(false);
  const [editCreatorName, setEditCreatorName] = useState(activeCommunity?.creatorName || "Nate Herk");
  const [editCreatorBadge, setEditCreatorBadge] = useState(activeCommunity?.creatorBadge || "💎");
  const [editCreatorAvatarUrl, setEditCreatorAvatarUrl] = useState(activeCommunity?.creatorAvatarUrl || "");
  const [savingCreator, setSavingCreator] = useState(false);
  const [creatorSaveError, setCreatorSaveError] = useState("");

  // Sync stored video resource
  useEffect(() => {
    const vrMap = videoResources as Record<string, any> | undefined;
    if (activeCommunity?.id && vrMap && vrMap[activeCommunity.id]) {
      const res = vrMap[activeCommunity.id];
      setVideoConfig({
        videoUrl: res.videoUrl || defaultVideoConfig.videoUrl,
        thumbnailUrl: res.thumbnailUrl,
      });
    } else {
      setVideoConfig(defaultVideoConfig);
    }
  }, [activeCommunity?.id, videoResources]);

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
        `If any of those sound familiar, ${activeCommunity?.name || "Permanent Skills"} is built for you.`
    );
    setEditCreatorName(activeCommunity?.creatorName || "Nate Herk");
    setEditCreatorBadge(activeCommunity?.creatorBadge || "💎");
    setEditCreatorAvatarUrl(activeCommunity?.creatorAvatarUrl || "");
    setDescSaveError("");
    setDescSaveSuccess(false);
    setEditDescModalOpen(true);
  }

  async function handleSaveCreator(e: React.FormEvent) {
    e.preventDefault();
    if (!editCreatorName.trim()) {
      setCreatorSaveError("Creator name is required.");
      return;
    }
    setSavingCreator(true);
    setCreatorSaveError("");
    try {
      const targetCommId = activeCommunity?.id || "comm-ps-main";
      await updateCommunityDescription({
        communityId: targetCommId,
        creatorName: editCreatorName.trim(),
        creatorBadge: editCreatorBadge.trim() || "💎",
        creatorAvatarUrl: editCreatorAvatarUrl.trim() || undefined,
      });
      setEditCreatorModalOpen(false);
    } catch {
      setCreatorSaveError("Failed to update creator details.");
    } finally {
      setSavingCreator(false);
    }
  }

  async function handleSaveVideo(e: React.FormEvent) {
    e.preventDefault();
    if (!editVideoUrl.trim()) {
      setVideoSaveError("Please provide a valid video URL.");
      return;
    }
    setSavingVideo(true);
    setVideoSaveError("");
    try {
      const targetCommId = activeCommunity?.id || "comm-ps-main";
      await saveVideoResource({
        communityId: targetCommId,
        videoUrl: editVideoUrl.trim(),
        thumbnailUrl: editThumbnailUrl.trim() || undefined,
        category: "about",
      });
      setVideoConfig({
        videoUrl: editVideoUrl.trim(),
        thumbnailUrl: editThumbnailUrl.trim() || undefined,
      });
      setEditModalOpen(false);
    } catch {
      setVideoSaveError("Failed to save video. Please try again.");
    } finally {
      setSavingVideo(false);
    }
  }

  async function handleSaveDescription(e: React.FormEvent) {
    e.preventDefault();
    setSavingDesc(true);
    setDescSaveError("");
    setDescSaveSuccess(false);
    try {
      const targetCommId = activeCommunity?.id || "comm-ps-main";
      await updateCommunityDescription({
        communityId: targetCommId,
        priceNote: editDescPriceNote.trim() || "$9/month",
        aboutHeadline: editDescHeadline.trim(),
        aboutDescription: editDescMainStory.trim(),
        aboutFeatures: editDescFeatures.filter((f) => f.trim().length > 0),
        aboutPainPoints: editDescPainPoints.filter((p) => p.trim().length > 0),
        aboutClosingText: editDescClosingText.trim(),
        creatorName: editCreatorName.trim(),
        creatorBadge: editCreatorBadge.trim() || "💎",
        creatorAvatarUrl: editCreatorAvatarUrl.trim() || undefined,
      });
      setDescSaveSuccess(true);
      setTimeout(() => {
        setDescSaveSuccess(false);
        setEditDescModalOpen(false);
      }, 800);
    } catch {
      setDescSaveError("Failed to update description. Please try again.");
    } finally {
      setSavingDesc(false);
    }
  }

  async function handleConfirmPurchase(course: Course) {
    setPurchaseBusy(true);
    try {
      const res = await purchaseCourse(course.id);
      if (res.ok) {
        setPurchaseSuccessMsg(`🎉 You have unlocked ${course.title}!`);
        setTimeout(() => {
          setPurchasingCourse(null);
          setPurchaseSuccessMsg("");
          router.push(`/classroom/${course.slug}`);
        }, 1200);
      } else {
        alert(res.error || "Could not complete course unlock.");
      }
    } finally {
      setPurchaseBusy(false);
    }
  }

  // Reviews & Member stats
  const approvedUsers = useMemo(
    () => users.filter((u) => u.status === "approved" || !u.status),
    [users]
  );
  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 5;
  const sortedReviews = useMemo(
    () =>
      [...reviews].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [reviews]
  );

  const communityTitle = activeCommunity?.name || "AI Automation Society";
  const currentPriceNote = activeCommunity?.priceNote || "Free";
  const currentFeatures =
    activeCommunity?.aboutFeatures && activeCommunity.aboutFeatures.length > 0
      ? activeCommunity.aboutFeatures
      : defaultFeatures;
  const currentPainPoints =
    activeCommunity?.aboutPainPoints && activeCommunity.aboutPainPoints.length > 0
      ? activeCommunity.aboutPainPoints
      : defaultPainPoints;
  const currentHeadline =
    activeCommunity?.aboutHeadline ||
    activeCommunity?.headline ||
    "Join today for free after approval. Applications are reviewed so the room stays useful and highly compounding.";
  const currentMainStory =
    activeCommunity?.aboutDescription ||
    activeCommunity?.description ||
    "Think durable skills take years and $10k courses? Think again. The Permanent Skill framework teaches systems that generate compounding authority and revenue.";
  const currentClosingText =
    activeCommunity?.aboutClosingText ||
    `If any of those sound familiar, ${communityTitle} is built for you.`;

  // Check if selected course is accessible
  const isSelectedCourseAccessible = Boolean(
    selectedCourse &&
      (isAdminOrManager ||
        user?.isPremium ||
        user?.purchasedCourseIds?.includes(selectedCourse.id) ||
        (!selectedCourse.isPremiumOnly &&
          (selectedCourse.unlockLevel <= 1 || userLevel >= selectedCourse.unlockLevel)))
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Global Navigation Bar: Course & Community Switcher Pills */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none border-b border-zinc-200/80 pb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            href="/about"
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
              !selectedCourse
                ? "bg-zinc-900 text-white shadow-xs"
                : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-400 hover:text-primary"
            }`}
          >
            <span>🌐</span>
            <span>AI Automation Society</span>
          </Link>

          <span className="text-zinc-300">|</span>

          {courses.map((c) => {
            const isTarget = selectedCourse?.id === c.id;
            return (
              <Link
                key={c.id}
                href={`/about?course=${c.id}`}
                className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition shrink-0 shadow-2xs ${
                  isTarget
                    ? "bg-primary text-white shadow-xs font-bold"
                    : "bg-white text-zinc-700 border border-zinc-200 hover:border-primary/40 hover:text-primary"
                }`}
                title={c.title}
              >
                <span>{c.badge === "VIP" ? "👑" : "📚"}</span>
                <span className="max-w-[130px] sm:max-w-none truncate">{c.title}</span>
                <span className="text-[10px] opacity-80">
                  {c.isPremiumOnly ? "VIP" : c.price ? `$${c.price}` : "Free"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 2. Main About View: Either Course Specific OR Global Community */}
      {selectedCourse ? (
        /* ================= COURSE SPECIFIC ABOUT PAGE ================= */
        <div className="space-y-5 sm:space-y-6">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-primary transition"
            >
              <ArrowLeft size={14} /> Back to Community About
            </Link>

            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles size={12} /> Course Overview
            </span>
          </div>

          {/* Skool-Style Hero Card for Selected Course */}
          <AboutHeroCard
            title={selectedCourse.title}
            privacy={
              selectedCourse.isPremiumOnly
                ? "VIP"
                : selectedCourse.unlockLevel > 1
                ? "Private"
                : "Public"
            }
            memberCountText={`${Math.max(12, approvedUsers.length * 15)}+ enrolled`}
            priceText={
              selectedCourse.isPremiumOnly
                ? "$9/month (VIP)"
                : selectedCourse.price
                ? formatMoney(selectedCourse.price)
                : "Free Access"
            }
            creatorName={activeCommunity?.creatorName || "Nate Herk"}
            creatorAvatarUrl={activeCommunity?.creatorAvatarUrl}
            creatorBadge={activeCommunity?.creatorBadge || "💎"}
            slides={generateCourseSlides(selectedCourse, videoConfig.videoUrl)}
            defaultVideoUrl={
              selectedCourse.lessons[0]?.videoUrl || videoConfig.videoUrl
            }
            isAdminOrManager={isAdminOrManager}
            onEditCreator={() => {
              setEditCreatorName(activeCommunity?.creatorName || "Nate Herk");
              setEditCreatorBadge(activeCommunity?.creatorBadge || "💎");
              setEditCreatorAvatarUrl(activeCommunity?.creatorAvatarUrl || "");
              setCreatorSaveError("");
              setEditCreatorModalOpen(true);
            }}
          />

          {/* Course Details, Curriculum & Purchase Box Grid */}
          <div className="grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
            <div className="space-y-5 sm:space-y-6">
              {/* Course Headline & Overview */}
              <Card className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-primary">
                    {selectedCourse.badge || "FEATURED"}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    {selectedCourse.lessons.length} Total Lessons
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                  About {selectedCourse.title}
                </h2>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                  {selectedCourse.description}
                </p>

                {/* What's Included Checklist */}
                <div className="mt-5 border-t border-zinc-100 pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 mb-3">
                    What&apos;s Included in this Course:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-zinc-700">
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-500 shrink-0 stroke-[3]" />
                      <span>Full HD video training across all lessons</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-500 shrink-0 stroke-[3]" />
                      <span>Downloadable Word notes & swipe files</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-500 shrink-0 stroke-[3]" />
                      <span>Production workflow templates & JSONs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-500 shrink-0 stroke-[3]" />
                      <span>Peer comments & instructor feedback</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-500 shrink-0 stroke-[3]" />
                      <span>Lifetime access & future curriculum updates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-500 shrink-0 stroke-[3]" />
                      <span>Permanent Skills Academy Certificate</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Complete Curriculum Breakdown */}
              <Card className="p-5 sm:p-6">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                      Curriculum & Lesson Outline
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Step-by-step sequential learning designed for fast execution.
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                    {selectedCourse.lessons.length} Lessons
                  </span>
                </div>

                <div className="space-y-2.5">
                  {selectedCourse.lessons.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 sm:p-3.5 hover:bg-zinc-50 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-zinc-200 text-xs font-bold text-zinc-700 shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-[13px] font-bold text-zinc-900 truncate">
                            {lesson.title}
                          </h4>
                          <span className="text-[11px] text-zinc-500">
                            {lesson.module || "Core Curriculum"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[11px] text-zinc-500">
                          {lesson.duration || "10:00"}
                        </span>
                        <Play size={13} className="text-zinc-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Sticky Enrollment / Action Card */}
            <div className="space-y-4 lg:sticky lg:top-20">
              <Card className="p-5 sm:p-6 border-zinc-300 shadow-md">
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-zinc-900">
                      {selectedCourse.isPremiumOnly
                        ? "$9/mo"
                        : selectedCourse.price
                        ? formatMoney(selectedCourse.price)
                        : "Free"}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {selectedCourse.isPremiumOnly
                        ? "VIP Mastermind"
                        : selectedCourse.price
                        ? "Lifetime Access"
                        : "Level 1 Access"}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {selectedCourse.isPremiumOnly
                      ? "Join the VIP membership to unlock this mastermind course plus all live sessions and community perks."
                      : selectedCourse.price
                      ? `Unlock instant lifetime access to all ${selectedCourse.lessons.length} lessons, or level up your community profile to unlock for free.`
                      : "This course is open to all community members."}
                  </p>

                  <div className="pt-2">
                    {isSelectedCourseAccessible ? (
                      <Link href={`/classroom/${selectedCourse.slug}`} className="block">
                        <PrimaryButton className="w-full justify-center py-3 text-xs sm:text-sm font-bold shadow-md cursor-pointer">
                          <Play size={15} /> Open in Classroom
                        </PrimaryButton>
                      </Link>
                    ) : selectedCourse.isPremiumOnly ? (
                      <GoldButton
                        onClick={() => setUpgradeOpen(true)}
                        className="w-full justify-center py-3 text-xs sm:text-sm font-bold shadow-md cursor-pointer"
                      >
                        <Sparkles size={15} /> Upgrade to VIP ($9/mo)
                      </GoldButton>
                    ) : (
                      <GoldButton
                        onClick={() => setPurchasingCourse(selectedCourse)}
                        className="w-full justify-center py-3 text-xs sm:text-sm font-bold shadow-md cursor-pointer"
                      >
                        <Sparkles size={15} /> Unlock Course — {formatMoney(selectedCourse.price || 49)}
                      </GoldButton>
                    )}
                  </div>

                  {!isSelectedCourseAccessible && !selectedCourse.isPremiumOnly && (
                    <div className="rounded-xl bg-amber-50 p-2.5 text-[11px] text-amber-900 border border-amber-200">
                      <span className="font-bold">💡 Free Unlock Option:</span> Reach <strong>Level {selectedCourse.unlockLevel}</strong> in the community feed to unlock this course at $0!
                    </div>
                  )}

                  <div className="pt-2 text-center">
                    <Link
                      href="/all-courses"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Browse All Classroom Courses →
                    </Link>
                  </div>
                </div>
              </Card>

              {/* Quick Info Box */}
              <Card className="p-4 text-xs text-zinc-600 space-y-2 bg-zinc-50/50">
                <div className="font-bold text-zinc-800">Instructor: Nate Herk 💎</div>
                <p className="text-[11.5px] leading-relaxed">
                  Founder & Principal Instructor at AI Automation Society. Teaching compounding digital systems that generate recurring revenue.
                </p>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        /* ================= COMMUNITY ABOUT PAGE (REFERENCE PHOTO) ================= */
        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row items-start">
          <div className="min-w-0 w-full flex-1 space-y-4 sm:space-y-5">
            {/* Main Skool-Style Hero Card matching Reference Image */}
            <AboutHeroCard
              title={communityTitle}
              privacy="Public"
              memberCountText={
                activeCommunity?.memberCount
                  ? `${(activeCommunity.memberCount / 1000).toFixed(1)}k members`
                  : "466.9k members"
              }
              priceText={currentPriceNote}
              creatorName={activeCommunity?.creatorName || "Nate Herk"}
              creatorAvatarUrl={activeCommunity?.creatorAvatarUrl}
              creatorBadge={activeCommunity?.creatorBadge || "💎"}
              defaultVideoUrl={videoConfig.videoUrl}
              customThumbnailUrl={videoConfig.thumbnailUrl}
              isAdminOrManager={isAdminOrManager}
              onEditVideo={openEditModal}
              onEditCreator={() => {
                setEditCreatorName(activeCommunity?.creatorName || "Nate Herk");
                setEditCreatorBadge(activeCommunity?.creatorBadge || "💎");
                setEditCreatorAvatarUrl(activeCommunity?.creatorAvatarUrl || "");
                setCreatorSaveError("");
                setEditCreatorModalOpen(true);
              }}
            />

            {/* Description & Features Matrix Card */}
            <Card className="p-4 sm:p-6 lg:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-zinc-100 pb-3">
                <p className="text-sm sm:text-base font-bold text-zinc-900 flex-1 leading-snug">
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

              <div className="mt-4 space-y-4 text-xs sm:text-sm leading-relaxed text-zinc-700">
                <p className="whitespace-pre-line text-zinc-700 text-xs sm:text-sm leading-relaxed">
                  {currentMainStory}
                </p>

                {/* What's inside */}
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

                {/* If you're tired of */}
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
                  <GoldButton
                    onClick={() => setUpgradeOpen(true)}
                    className="w-full sm:w-auto px-6 py-2.5 shadow-xs text-xs sm:text-sm font-bold cursor-pointer justify-center text-center"
                  >
                    👑 Upgrade to VIP ($9/mo)
                  </GoldButton>
                ) : (
                  <span className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-bold text-primary text-center">
                    💎 You Have Full Access
                  </span>
                )}
              </div>
            </Card>

            {/* Featured Classroom Courses with 'See About' Buttons */}
            <Card className="p-4 sm:p-6 lg:p-7 shadow-xs">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                    Courses in Classroom
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Each course has a dedicated curriculum, lesson player, and separate About page.
                  </p>
                </div>
                <Link
                  href="/all-courses"
                  className="text-xs font-bold text-primary hover:underline"
                >
                  View All ({courses.length}) →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {courses.slice(0, 6).map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 hover:border-zinc-300 transition shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {c.badge || "COURSE"}
                        </span>
                        <span className="text-xs font-bold text-zinc-900">
                          {c.isPremiumOnly ? "$9/mo" : c.price ? `$${c.price}` : "Free"}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-900 line-clamp-1">
                        {c.title}
                      </h4>
                      <p className="mt-1 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5">
                      <span className="text-[11px] font-mono text-zinc-400">
                        {c.lessons.length} lessons
                      </span>
                      <Link
                        href={`/about?course=${c.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-bold text-primary hover:border-primary/40 hover:bg-primary/5 transition shadow-2xs"
                      >
                        See About →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Reviews Section */}
            <Card className="p-4 sm:p-6 lg:p-7 shadow-xs">
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
        </div>
      )}

      {/* Upgrade VIP Modal */}
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      {/* Course Purchase Modal */}
      {purchasingCourse && (
        <Modal
          open={!!purchasingCourse}
          onClose={() => setPurchasingCourse(null)}
          title="Unlock Course Access"
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-zinc-50 p-3.5 sm:p-4 border border-zinc-200">
              <div className="text-xs sm:text-sm font-bold text-zinc-900">{purchasingCourse.title}</div>
              <p className="text-xs text-zinc-500 mt-1">{purchasingCourse.description}</p>
              
              <div className="mt-3 flex flex-wrap items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-zinc-900">
                  {formatMoney(purchasingCourse.price || 49)}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-zinc-500">One-time payment • Lifetime Access</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-zinc-700">
              <div className="flex items-center gap-2 font-medium">
                <Check size={14} className="text-emerald-600 shrink-0" />
                Full access to all {purchasingCourse.lessons.length} video lessons & modules
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Check size={14} className="text-emerald-600 shrink-0" />
                Downloadable Word Notes, swipe files & resources
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Check size={14} className="text-emerald-600 shrink-0" />
                Future curriculum updates included at no extra charge
              </div>
            </div>

            {purchaseSuccessMsg && (
              <div className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 border border-emerald-200">
                {purchaseSuccessMsg}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPurchasingCourse(null)}
                className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <GoldButton
                className="flex-1 text-xs py-2.5"
                disabled={purchaseBusy}
                onClick={() => handleConfirmPurchase(purchasingCourse)}
              >
                {purchaseBusy ? "Unlocking..." : `Confirm ${formatMoney(purchasingCourse.price || 49)}`}
              </GoldButton>
            </div>
          </div>
        </Modal>
      )}

      {/* Admin Edit Video Modal */}
      {isAdminOrManager && (
        <Modal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit Community Video & Thumbnail"
        >
          <form onSubmit={handleSaveVideo} className="space-y-4">
            <Field label="Video URL (YouTube, Vimeo, Loom, or MP4)">
              <input
                className={inputClass}
                placeholder="https://www.youtube.com/watch?v=..."
                value={editVideoUrl}
                onChange={(e) => setEditVideoUrl(e.target.value)}
                required
              />
            </Field>

            <Field label="Custom Thumbnail Image URL (optional)">
              <input
                className={inputClass}
                placeholder="https://example.com/thumbnail.jpg"
                value={editThumbnailUrl}
                onChange={(e) => setEditThumbnailUrl(e.target.value)}
              />
            </Field>

            {videoSaveError && (
              <p className="text-xs text-red-600 font-semibold">{videoSaveError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <PrimaryButton type="submit" disabled={savingVideo} className="text-xs py-2 px-4">
                {savingVideo ? "Saving..." : "Save Changes"}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {/* Admin Edit Description Modal */}
      {isAdminOrManager && (
        <Modal
          open={editDescModalOpen}
          onClose={() => setEditDescModalOpen(false)}
          title={`Edit Description — ${communityTitle}`}
        >
          <form onSubmit={handleSaveDescription} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <Field label="Price Note / Subtitle">
              <input
                className={inputClass}
                value={editDescPriceNote}
                onChange={(e) => setEditDescPriceNote(e.target.value)}
                placeholder="e.g. Free or $9/month"
              />
            </Field>

            <Field label="Headline">
              <textarea
                className={`${inputClass} min-h-[70px] resize-y`}
                value={editDescHeadline}
                onChange={(e) => setEditDescHeadline(e.target.value)}
              />
            </Field>

            <Field label="Main Story / Overview">
              <textarea
                className={`${inputClass} min-h-[100px] resize-y`}
                value={editDescMainStory}
                onChange={(e) => setEditDescMainStory(e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-zinc-100">
              <Field label="Creator Display Name">
                <input
                  className={inputClass}
                  placeholder="e.g. Nate Herk"
                  value={editCreatorName}
                  onChange={(e) => setEditCreatorName(e.target.value)}
                />
              </Field>

              <Field label="Creator Badge / Emoji">
                <input
                  className={inputClass}
                  placeholder="e.g. 💎 or 👑"
                  value={editCreatorBadge}
                  onChange={(e) => setEditCreatorBadge(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Creator Avatar Image URL (optional)">
              <input
                className={inputClass}
                placeholder="https://example.com/avatar.jpg"
                value={editCreatorAvatarUrl}
                onChange={(e) => setEditCreatorAvatarUrl(e.target.value)}
              />
            </Field>

            {descSaveError && (
              <p className="text-xs text-red-600 font-semibold">{descSaveError}</p>
            )}
            {descSaveSuccess && (
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 size={13} /> Description saved successfully!
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setEditDescModalOpen(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <PrimaryButton type="submit" disabled={savingDesc} className="text-xs py-2 px-4">
                {savingDesc ? "Saving..." : "Save Changes"}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {/* Admin Edit Creator Modal */}
      {isAdminOrManager && (
        <Modal
          open={editCreatorModalOpen}
          onClose={() => setEditCreatorModalOpen(false)}
          title="Edit Creator Details"
        >
          <form onSubmit={handleSaveCreator} className="space-y-4">
            <Field label="Creator Display Name">
              <input
                className={inputClass}
                placeholder="e.g. Nate Herk"
                value={editCreatorName}
                onChange={(e) => setEditCreatorName(e.target.value)}
                required
              />
            </Field>

            <Field label="Creator Badge / Emoji (displayed next to name)">
              <input
                className={inputClass}
                placeholder="e.g. 💎 or 👑"
                value={editCreatorBadge}
                onChange={(e) => setEditCreatorBadge(e.target.value)}
              />
            </Field>

            <Field label="Creator Avatar Image URL (optional)">
              <input
                className={inputClass}
                placeholder="https://example.com/avatar.jpg"
                value={editCreatorAvatarUrl}
                onChange={(e) => setEditCreatorAvatarUrl(e.target.value)}
              />
            </Field>

            {creatorSaveError && (
              <p className="text-xs text-red-600 font-semibold">{creatorSaveError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setEditCreatorModalOpen(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <PrimaryButton type="submit" disabled={savingCreator} className="text-xs py-2 px-4">
                {savingCreator ? "Saving..." : "Save Creator"}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
