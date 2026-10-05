"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  Lock,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Unlock,
  X,
  Zap,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Card, PrimaryButton, GoldButton, ProgressBar, Modal } from "@/components/ui";
import { UpgradeModal } from "@/components/UpgradeModal";
import { LockedCourseModal } from "@/components/LockedCourseModal";
import { getLevel } from "@/lib/levels";
import { formatMoney } from "@/lib/format";
import { isCourseAccessible } from "@/lib/course-security";
import type { Course } from "@/lib/types";

type FilterTab = "all" | "in_progress" | "completed" | "unlocked" | "vip" | "team";
type SortOption = "default" | "progress_desc" | "lessons_desc" | "level_asc" | "level_desc" | "title_asc";

export default function AllCoursesPage() {
  const router = useRouter();
  const { courses, progress, user, purchaseCourse } = useApp();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>("all");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);
  const [purchasingCourse, setPurchasingCourse] = useState<Course | null>(null);
  const [lockedModalCourse, setLockedModalCourse] = useState<Course | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Horizontal Slider for Filter Tabs
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showTabsLeftArrow, setShowTabsLeftArrow] = useState(false);
  const [showTabsRightArrow, setShowTabsRightArrow] = useState(false);

  function checkTabsScroll() {
    if (!tabsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
    setShowTabsLeftArrow(scrollLeft > 8);
    setShowTabsRightArrow(scrollLeft < scrollWidth - clientWidth - 8);
  }

  function scrollTabs(dir: "left" | "right") {
    if (!tabsRef.current) return;
    const delta = dir === "left" ? -200 : 200;
    tabsRef.current.scrollBy({ left: delta, behavior: "smooth" });
  }

  useEffect(() => {
    checkTabsScroll();
    const handleResize = () => checkTabsScroll();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [selectedFilter]);

  const isAdminOrManager = user?.role === "admin" || user?.role === "manager";
  const canViewTeam = user?.role === "admin" || user?.role === "manager" || user?.role === "team_member";
  const userLevelData = getLevel(user?.points || 0);
  const userLevel = userLevelData.level;

  // Aggregate stats
  const stats = useMemo(() => {
    let totalLessonsCount = 0;
    let completedLessonsCount = 0;
    let inProgressCoursesCount = 0;
    let completedCoursesCount = 0;

    courses.forEach((c) => {
      const isTeam = c.badge?.toLowerCase().includes("team") || c.title.toLowerCase().includes("team") || c.slug.toLowerCase().includes("team") || c.id.toLowerCase().includes("team") || c.description.toLowerCase().includes("team");
      if (isTeam && !canViewTeam) return;

      const cTotal = c.lessons.length;
      totalLessonsCount += cTotal;
      const row = progress.find((p) => p.courseId === c.id && p.userId === user?.id);
      const cDone = row?.completedLessonIds.length || 0;
      completedLessonsCount += cDone;

      if (cTotal > 0 && cDone === cTotal) {
        completedCoursesCount++;
      } else if (cDone > 0) {
        inProgressCoursesCount++;
      }
    });

    const overallPct = totalLessonsCount ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;

    return {
      totalCourses: courses.length,
      totalLessons: totalLessonsCount,
      completedLessons: completedLessonsCount,
      inProgressCourses: inProgressCoursesCount,
      completedCourses: completedCoursesCount,
      overallPct,
    };
  }, [courses, progress, user, canViewTeam]);

  // Filter & sort logic
  const filteredCourses = useMemo(() => {
    let list = [...courses];

    // Hide team courses from non-staff/non-team users
    list = list.filter((c) => {
      const isTeamCourse =
        c.badge?.toLowerCase().includes("team") ||
        c.title.toLowerCase().includes("team") ||
        c.slug.toLowerCase().includes("team") ||
        c.id.toLowerCase().includes("team") ||
        c.description.toLowerCase().includes("team");
      if (isTeamCourse && !canViewTeam) return false;
      return true;
    });

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => {
        const titleMatch = c.title.toLowerCase().includes(q);
        const descMatch = c.description.toLowerCase().includes(q);
        const badgeMatch = c.badge?.toLowerCase().includes(q);
        const lessonMatch = c.lessons.some((l) =>
          l.title.toLowerCase().includes(q) || l.module?.toLowerCase().includes(q)
        );
        return titleMatch || descMatch || badgeMatch || lessonMatch;
      });
    }

    // Category filter
    list = list.filter((c) => {
      const row = progress.find((p) => p.courseId === c.id && p.userId === user?.id);
      const doneCount = row?.completedLessonIds.length || 0;
      const totalCount = c.lessons.length;
      const isAccessible = isCourseAccessible(c, user);

      if (selectedFilter === "in_progress") {
        return doneCount > 0 && doneCount < totalCount;
      }
      if (selectedFilter === "completed") {
        return totalCount > 0 && doneCount === totalCount;
      }
      if (selectedFilter === "unlocked") {
        return isAccessible;
      }
      if (selectedFilter === "vip") {
        return c.isPremiumOnly || c.badge === "PREMIUM" || c.badge === "VIP";
      }
      if (selectedFilter === "team") {
        if (!canViewTeam) return false;
        return (
          c.badge?.toLowerCase().includes("team") ||
          c.title.toLowerCase().includes("team") ||
          c.slug.toLowerCase().includes("team") ||
          c.id.toLowerCase().includes("team") ||
          c.description.toLowerCase().includes("team")
        );
      }
      return true;
    });

    // Sorting
    list.sort((a, b) => {
      const rowA = progress.find((p) => p.courseId === a.id && p.userId === user?.id);
      const rowB = progress.find((p) => p.courseId === b.id && p.userId === user?.id);
      const pctA = a.lessons.length ? ((rowA?.completedLessonIds.length || 0) / a.lessons.length) * 100 : 0;
      const pctB = b.lessons.length ? ((rowB?.completedLessonIds.length || 0) / b.lessons.length) * 100 : 0;

      if (sortBy === "progress_desc") return pctB - pctA;
      if (sortBy === "lessons_desc") return b.lessons.length - a.lessons.length;
      if (sortBy === "level_asc") return (a.unlockLevel || 1) - (b.unlockLevel || 1);
      if (sortBy === "level_desc") return (b.unlockLevel || 1) - (a.unlockLevel || 1);
      if (sortBy === "title_asc") return a.title.localeCompare(b.title);
      return 0;
    });

    return list;
  }, [courses, progress, user, searchQuery, selectedFilter, sortBy, userLevel]);

  // Handle Purchase Confirmation
  async function confirmPurchase() {
    if (!purchasingCourse) return;
    setBusyId(purchasingCourse.id);
    setSuccessMsg(null);
    try {
      const res = await purchaseCourse(purchasingCourse.id);
      if (res.ok) {
        setSuccessMsg(`"${purchasingCourse.title}" unlocked successfully! You now have permanent lifetime access.`);
        setPurchasingCourse(null);
      }
    } finally {
      setBusyId(null);
    }
  }

  // Helper to render classroom-style lock banner matching ClassroomView
  function renderCourseBanner(course: Course) {
    const isAccessible = isCourseAccessible(course, user);
    const isLevel1 = course.unlockLevel === 1 && !course.isPremiumOnly;
    const isPremiumOnly = Boolean(course.isPremiumOnly || course.badge?.toUpperCase() === "VIP");
    const glow = course.glowColor || "yellow";
    const watermark = course.watermark || `> ${course.slug}_`;

    // 1. Custom Background Image if configured by admin/manager
    if (course.thumbnail) {
      return (
        <div
          className="relative h-40 sm:h-44 md:h-48 w-full overflow-hidden p-4 flex flex-col items-center justify-center select-none bg-cover bg-center"
          style={{
            backgroundImage: `url(${course.thumbnail})`,
          }}
        >
          {/* Subtle contrast overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px]" />

          {/* Terminal Watermark behind */}
          {watermark && (
            <div className="absolute inset-x-0 bottom-3 sm:bottom-4 text-center font-mono text-xl sm:text-2xl md:text-3xl font-black text-white/25 tracking-tight pointer-events-none select-none">
              {watermark}
            </div>
          )}

          {/* Center Badge */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/85 text-white shadow-xl border border-white/25">
              {isAccessible ? (
                <Unlock size={18} className="sm:w-5 sm:h-5 stroke-[2.5]" />
              ) : (
                <Lock size={18} className="sm:w-5 sm:h-5 stroke-[2.5]" />
              )}
            </div>
            {!isAccessible && (
              <span className="mt-1.5 sm:mt-2 text-xs sm:text-[13px] font-extrabold text-white drop-shadow-md">
                {isPremiumOnly ? "👑 Unlock with VIP" : `Unlock at Level ${course.unlockLevel}`}
              </span>
            )}
          </div>
        </div>
      );
    }

    if (isLevel1 || glow === "yellow") {
      return (
        <div
          className="relative h-40 sm:h-44 md:h-48 w-full overflow-hidden bg-[#786c12] p-4 flex flex-col items-center justify-center select-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(0,0,0,0.22) 1.5px, transparent 1.5px)",
            backgroundSize: "12px 12px",
          }}
        >
          {/* Terminal Watermark behind */}
          <div className="absolute inset-x-0 bottom-3 sm:bottom-4 text-center font-mono text-xl sm:text-2xl md:text-3xl font-black text-black/35 tracking-tight pointer-events-none select-none">
            {watermark}
          </div>

          {/* Center Badge */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/90 text-white shadow-xl border border-white/20">
              {isAccessible ? (
                <Unlock size={18} className="sm:w-5 sm:h-5 stroke-[2.5]" />
              ) : (
                <Lock size={18} className="sm:w-5 sm:h-5 stroke-[2.5]" />
              )}
            </div>
            {!isAccessible && (
              <span className="mt-1.5 sm:mt-2 text-xs sm:text-[13px] font-extrabold text-white drop-shadow-md">
                Unlock at Level 1
              </span>
            )}
          </div>
        </div>
      );
    }

    // Glow Configurations
    let glowBg = "bg-emerald-500/25";
    let ringBorder = "border-emerald-400/90 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]";

    if (glow === "green") {
      glowBg = "bg-emerald-500/25";
      ringBorder = "border-emerald-400/90 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]";
    } else if (glow === "blue") {
      glowBg = "bg-sky-500/25";
      ringBorder = "border-sky-400/90 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.4)]";
    } else if (glow === "orange") {
      glowBg = "bg-orange-500/30";
      ringBorder = "border-orange-400/90 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.45)]";
    } else if (glow === "red") {
      glowBg = "bg-rose-500/25";
      ringBorder = "border-rose-400/90 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]";
    } else if (glow === "purple") {
      glowBg = "bg-purple-500/30";
      ringBorder = "border-purple-400/90 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.45)]";
    }

    return (
      <div className="relative h-40 sm:h-44 md:h-48 w-full overflow-hidden bg-black p-4 flex flex-col items-center justify-center select-none">
        {/* Radial Glow */}
        <div className={`absolute h-24 sm:h-28 w-24 sm:w-28 rounded-full ${glowBg} blur-2xl pointer-events-none`} />

        {/* Terminal Watermark behind */}
        <div className="absolute inset-x-0 bottom-3 sm:bottom-4 text-center font-mono text-xl sm:text-2xl md:text-3xl font-black text-white/10 tracking-tight pointer-events-none select-none">
          {watermark}
        </div>

        {/* Center Glowing Badge */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div
            className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-zinc-950/90 border-2 ${ringBorder} transition-transform group-hover:scale-105`}
          >
            {isAccessible ? (
              <Unlock size={18} className="sm:w-5 sm:h-5 stroke-[2.5]" />
            ) : glow === "orange" ? (
              <Flame size={18} className="sm:w-5 sm:h-5 stroke-[2.5]" />
            ) : (
              <Lock size={18} className="sm:w-5 sm:h-5 stroke-[2.5]" />
            )}
          </div>

          {!isAccessible && (
            <>
              <span className="mt-1.5 sm:mt-2 text-xs sm:text-[13px] font-extrabold text-white drop-shadow-md">
                {isPremiumOnly
                  ? "👑 Unlock with VIP"
                  : `Unlock at Level ${course.unlockLevel}`}
              </span>

              {!isPremiumOnly && (
                <span className="text-[10px] sm:text-[10.5px] text-zinc-400 font-medium">
                  or Upgrade to VIP
                </span>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Helper to get total duration
  function getCourseDuration(c: Course) {
    let totalMinutes = 0;
    c.lessons.forEach((l) => {
      const parts = (l.duration || "10:00").split(":");
      if (parts.length === 2) {
        totalMinutes += parseInt(parts[0], 10) || 0;
      }
    });
    if (totalMinutes === 0) return `${c.lessons.length * 12} mins`;
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins} mins`;
  }

  return (
    <div className="space-y-5 sm:space-y-7 pb-12">
      {/* 1. Header with Learning Portfolio Summary */}
      <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50/50 to-primary/5 p-4 sm:p-6 md:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
          <div>
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md shrink-0">
                <BookOpen size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-zinc-900 leading-tight">
                  All Courses & Masterminds
                </h1>
                <p className="text-[11px] sm:text-xs text-zinc-500 font-medium mt-0.5">
                  Complete training library. Earn community points to unlock courses for free, or unlock instantly via VIP.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!user?.isPremium && (
              <GoldButton
                onClick={() => setUpgradeOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs shadow-xs py-2 px-3.5"
              >
                <Sparkles size={13} className="sm:w-3.5 sm:h-3.5" /> <span>Upgrade to VIP ($9/mo)</span>
              </GoldButton>
            )}

            {user?.role === "admin" && (
              <Link href="/admin">
                <PrimaryButton className="inline-flex items-center gap-1.5 text-xs py-2 px-3.5">
                  <Plus size={13} className="sm:w-3.5 sm:h-3.5" /> <span>Course Editor</span>
                </PrimaryButton>
              </Link>
            )}
          </div>
        </div>

        {/* Learning Scorecard Strip */}
        <div className="mt-5 sm:mt-6 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-4 sm:pt-5 border-t border-zinc-200/80">
          <div className="rounded-xl bg-white p-3 sm:p-3.5 border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Total Courses</span>
              <Layers size={13} className="sm:w-3.5 sm:h-3.5 text-primary" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-zinc-900">{stats.totalCourses}</div>
            <div className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5">Curriculum modules</div>
          </div>

          <div className="rounded-xl bg-white p-3 sm:p-3.5 border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Video Lessons</span>
              <Play size={13} className="sm:w-3.5 sm:h-3.5 text-primary" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-zinc-900">{stats.totalLessons}</div>
            <div className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5">Step-by-step videos</div>
          </div>

          <div className="rounded-xl bg-white p-3 sm:p-3.5 border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Completed</span>
              <CheckCircle2 size={13} className="sm:w-3.5 sm:h-3.5 text-emerald-500" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-emerald-600">
              {stats.completedLessons} <span className="text-[11px] sm:text-xs font-semibold text-zinc-400">({stats.overallPct}%)</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 truncate">{stats.completedCourses} courses finished</div>
          </div>

          <div className="rounded-xl bg-white p-3 sm:p-3.5 border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Your Rank</span>
              <Trophy size={13} className="sm:w-3.5 sm:h-3.5 text-amber-500" />
            </div>
            <div className="text-sm sm:text-base font-extrabold text-zinc-900 truncate">
              {userLevelData.name}
            </div>
            <div className="text-[10px] sm:text-[11px] text-amber-600 font-bold mt-0.5">
              Level {userLevel} ({user?.points || 0} pts)
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800 border border-emerald-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check size={18} className="text-emerald-600 shrink-0" />
            {successMsg}
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="rounded p-1 text-emerald-600 hover:bg-emerald-100"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. Search, Filter Tabs & Sorting Toolbar */}
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-full md:max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search courses, lessons, topics, or modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9.5 pr-8 text-xs font-medium text-zinc-800 placeholder-zinc-400 shadow-2xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center justify-between sm:justify-start gap-2 self-stretch sm:self-auto">
          <span className="text-xs font-semibold text-zinc-500 shrink-0">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 sm:py-2 text-xs font-semibold text-zinc-700 shadow-2xs outline-none focus:border-primary cursor-pointer w-full sm:w-auto"
          >
            <option value="default">Default Order</option>
            <option value="progress_desc">Highest Progress</option>
            <option value="lessons_desc">Most Lessons</option>
            <option value="level_asc">Level: Low to High</option>
            <option value="level_desc">Level: High to Low</option>
            <option value="title_asc">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Filter Tabs - Responsive Horizontal Slider */}
      <div className="relative w-full border-b border-zinc-200/80 pb-1.5">
        {showTabsLeftArrow && (
          <div className="absolute left-0 top-0 bottom-1.5 z-20 flex w-8 sm:w-9 items-center justify-center bg-gradient-to-r from-[#fbfbfb] via-[#fbfbfb]/95 to-transparent pointer-events-none">
            <button
              type="button"
              onClick={() => scrollTabs("left")}
              className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-white shadow-md border border-zinc-200 text-zinc-600 hover:text-zinc-950 transition cursor-pointer pointer-events-auto active:scale-95"
              aria-label="Scroll tabs left"
            >
              <ChevronLeft size={15} />
            </button>
          </div>
        )}

        <div
          ref={tabsRef}
          onScroll={checkTabsScroll}
          className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs scroll-smooth scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0"
        >
          {[
            { id: "all" as const, label: "All Courses", count: courses.filter((c) => canViewTeam || !(c.badge?.toLowerCase().includes("team") || c.title.toLowerCase().includes("team") || c.slug.toLowerCase().includes("team") || c.id.toLowerCase().includes("team") || c.description.toLowerCase().includes("team"))).length },
            { id: "unlocked" as const, label: "Unlocked", count: courses.filter((c) => {
              const isTeam = c.badge?.toLowerCase().includes("team") || c.title.toLowerCase().includes("team") || c.slug.toLowerCase().includes("team") || c.id.toLowerCase().includes("team") || c.description.toLowerCase().includes("team");
              if (isTeam && !canViewTeam) return false;
              return isCourseAccessible(c, user);
            }).length },
            { id: "in_progress" as const, label: "In Progress", count: stats.inProgressCourses },
            { id: "completed" as const, label: "Completed", count: stats.completedCourses },
            { id: "vip" as const, label: "VIP Masterminds", count: courses.filter((c) => {
              const isTeam = c.badge?.toLowerCase().includes("team") || c.title.toLowerCase().includes("team") || c.slug.toLowerCase().includes("team") || c.id.toLowerCase().includes("team") || c.description.toLowerCase().includes("team");
              if (isTeam && !canViewTeam) return false;
              return c.isPremiumOnly || c.badge === "PREMIUM" || c.badge === "VIP";
            }).length },
            ...(canViewTeam
              ? [
                  {
                    id: "team" as const,
                    label: "Team",
                    icon: "/team-icon.png",
                    count: courses.filter(
                      (c) =>
                        c.badge?.toLowerCase().includes("team") ||
                        c.title.toLowerCase().includes("team") ||
                        c.slug.toLowerCase().includes("team") ||
                        c.id.toLowerCase().includes("team") ||
                        c.description.toLowerCase().includes("team")
                    ).length,
                  },
                ]
              : []),
          ].map((tab) => {
            const isActive = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={(e) => {
                  setSelectedFilter(tab.id as FilterTab);
                  e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-primary text-white shadow-xs"
                    : "bg-white text-zinc-600 border border-zinc-200 hover:border-primary/40 hover:text-primary"
                }`}
              >
                {"icon" in tab && tab.icon && (
                  <img
                    src={tab.icon}
                    alt=""
                    className="h-3.5 w-3.5 rounded object-cover shrink-0"
                  />
                )}
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[9px] sm:text-[10px] font-extrabold ${
                    isActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {showTabsRightArrow && (
          <div className="absolute right-0 top-0 bottom-1.5 z-20 flex w-8 sm:w-9 items-center justify-center bg-gradient-to-l from-[#fbfbfb] via-[#fbfbfb]/95 to-transparent pointer-events-none">
            <button
              type="button"
              onClick={() => scrollTabs("right")}
              className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-white shadow-md border border-zinc-200 text-zinc-600 hover:text-zinc-950 transition cursor-pointer pointer-events-auto active:scale-95"
              aria-label="Scroll tabs right"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* 3. Course Cards Grid */}
      {filteredCourses.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 sm:p-12 text-center shadow-xs">
          <BookOpen className="mx-auto mb-3 text-zinc-300" size={36} />
          <h3 className="text-sm sm:text-base font-bold text-zinc-900">No courses found</h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
            We couldn&apos;t find any courses matching your active search query or filter selection.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedFilter("all");
            }}
            className="mt-4 inline-flex items-center rounded-xl bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 transition cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => {
            const row = progress.find((p) => p.courseId === course.id && p.userId === user?.id);
            const total = course.lessons.length;
            const completedCount = row?.completedLessonIds.length || 0;
            const pct = total ? Math.round((completedCount / total) * 100) : 0;

            const isAccessible = isCourseAccessible(course, user);
            const isAdmin = user?.role === "admin";
            const price = course.price || 49;
            const duration = getCourseDuration(course);

            if (isAdmin) {
              return (
                <Link
                  key={course.id}
                  href={`/classroom/${course.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-zinc-400 cursor-pointer"
                >
                  {/* Course Banner */}
                  {renderCourseBanner(course)}

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                    <div>
                      <h3 className="text-[15px] sm:text-base font-bold text-zinc-900 group-hover:text-primary transition-colors line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="mt-1 text-xs sm:text-[13px] text-zinc-600 line-clamp-2 leading-relaxed min-h-[32px] sm:min-h-[36px]">
                        {course.description}
                      </p>
                    </div>

                    {/* Clean Pill Progress Bar */}
                    <div className="mt-3.5 sm:mt-4">
                      <div className="relative h-5 w-full overflow-hidden rounded-full bg-[#e5e7eb] flex items-center shadow-inner">
                        {pct > 0 && (
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary via-[#6366f1] to-[#7c83ff] transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        )}
                        <span className="absolute left-3 text-[11px] font-bold text-zinc-700">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            }

            return (
              <Card
                key={course.id}
                className="group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-zinc-200/90"
              >
                {/* Course Banner */}
                {!isAccessible ? (
                  <div
                    className="cursor-pointer"
                    onClick={() => setLockedModalCourse(course)}
                    title="Click to view unlock details"
                  >
                    {renderCourseBanner(course)}
                  </div>
                ) : (
                  <Link
                    href={`/classroom/${course.slug}`}
                    className={`relative h-40 sm:h-44 md:h-48 bg-gradient-to-br ${course.accent || "from-zinc-900 to-zinc-950"} p-4 sm:p-5 text-white flex flex-col justify-between overflow-hidden select-none cursor-pointer`}
                  >
                    {/* Subtle Glow overlay */}
                    <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex items-center justify-between">
                      <span className="rounded-md bg-black/40 backdrop-blur-xs px-2.5 py-0.5 sm:py-1 text-[10px] font-black tracking-wider text-white uppercase border border-white/15">
                        {course.badge || "MODULE"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/95 backdrop-blur-xs px-2 sm:px-2.5 py-0.5 text-[11px] sm:text-xs font-bold text-white shadow-xs">
                        <ShieldCheck size={13} /> Unlocked
                      </span>
                    </div>

                    <div className="relative z-10">
                      <h2 className="text-sm sm:text-base md:text-lg font-black leading-snug group-hover:text-primary-light transition-colors line-clamp-1">
                        {course.title}
                      </h2>
                      <div className="mt-1 flex items-center gap-2.5 sm:gap-3 text-[11px] sm:text-xs text-white/80 font-medium">
                        <span className="flex items-center gap-1">
                          <Play size={12} /> {total} Lessons
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {duration}
                        </span>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Card Body */}
                {isAccessible ? (
                  <Link
                    href={`/classroom/${course.slug}`}
                    className="flex flex-1 flex-col justify-between p-4 sm:p-5 cursor-pointer hover:bg-zinc-50/50 transition-colors"
                  >
                    <div>
                      <p className="min-h-[32px] sm:min-h-[40px] text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>

                      {/* Progress */}
                      <div className="mt-3.5 sm:mt-4">
                        <div className="flex items-center justify-between text-xs font-bold text-zinc-700 mb-1.5">
                          <span className="text-zinc-500">Progress ({completedCount}/{total})</span>
                          <span className={pct === 100 ? "text-emerald-600" : "text-primary"}>
                            {pct}% {pct === 100 && "✓"}
                          </span>
                        </div>
                        <ProgressBar value={pct} />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div
                    onClick={() => setLockedModalCourse(course)}
                    className="flex flex-1 flex-col justify-between p-4 sm:p-5 cursor-pointer hover:bg-zinc-50/50 transition-colors"
                  >
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-zinc-900 group-hover:text-primary transition-colors line-clamp-1 mb-1">
                        {course.title}
                      </h3>
                      <p className="min-h-[32px] sm:min-h-[40px] text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>

                      <div className="mt-3.5 sm:mt-4 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600 border border-zinc-100 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-zinc-800">
                            {course.isPremiumOnly
                              ? "👑 VIP Mastermind"
                              : `Unlocks at Level ${course.unlockLevel}`}
                          </div>
                          <div className="text-[10.5px] sm:text-[11px] text-zinc-500 mt-0.5">
                            {course.isPremiumOnly
                              ? "Requires active VIP subscription ($9/mo)"
                              : `Price: ${formatMoney(course.price || 49)} or Level ${course.unlockLevel}`}
                          </div>
                        </div>
                        <Lock size={15} className="text-zinc-400 shrink-0" />
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-100 pt-2.5">
                        <span className="text-xs font-bold text-zinc-900">
                          {course.isPremiumOnly ? "$9/mo (VIP)" : formatMoney(course.price || 49)}
                        </span>
                        <Link
                          href={`/about?course=${course.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-primary shadow-2xs hover:border-primary/40 hover:bg-primary/5 transition"
                        >
                          See About →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* 4. Gamification Roadmap & Points Callout Banner */}
      {!isAdminOrManager && (
        <div className="rounded-2xl border border-zinc-200 bg-gradient-to-r from-zinc-900 via-zinc-950 to-primary/30 p-4 sm:p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5">
          <div className="space-y-1 text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/30 px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold text-primary-light ring-1 ring-primary/40">
              <Flame size={14} className="text-amber-400" /> Unlock Courses by Leveling Up
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight">Want to unlock all courses without purchasing?</h2>
            <p className="text-xs text-zinc-300 max-w-xl">
              Post your business wins, answer peer questions, and climb the Leaderboard. Each level you reach unlocks exclusive new course modules and resources automatically!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <Link href="/leaderboards">
              <PrimaryButton className="inline-flex items-center gap-1.5 text-xs py-2 px-3.5">
                <Trophy size={14} /> View Leaderboard
              </PrimaryButton>
            </Link>
            <Link href="/community">
              <button className="rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/20 transition cursor-pointer border border-white/20">
                Go to Community
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* 5. Course Curriculum & Syllabus Preview Modal */}
      {previewCourse && (
        <Modal
          open={!!previewCourse}
          onClose={() => setPreviewCourse(null)}
          title={previewCourse.title}
          wide
        >
          <div className="space-y-4 sm:space-y-5">
            {/* Course Meta Banner */}
            <div className={`rounded-xl bg-gradient-to-br ${previewCourse.accent || "from-zinc-900 to-zinc-950"} p-3.5 sm:p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
              <div>
                <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                  {previewCourse.badge || "MODULE"}
                </span>
                <p className="mt-1 text-xs text-white/80">{previewCourse.description}</p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <div className="text-xs font-semibold text-white/90">
                  {previewCourse.lessons.length} Lessons • {getCourseDuration(previewCourse)}
                </div>
                <div className="text-[11px] text-white/70">
                  {previewCourse.isPremiumOnly ? "VIP Exclusive" : `Requires Level ${previewCourse.unlockLevel}`}
                </div>
              </div>
            </div>

            {/* Lessons Syllabus List */}
            <div className="space-y-3 max-h-[300px] sm:max-h-[380px] overflow-y-auto pr-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Curriculum & Lesson Breakdown
              </h4>

              <div className="space-y-2">
                {previewCourse.lessons.map((lesson, idx) => {
                  const isDone = progress
                    .find((p) => p.courseId === previewCourse.id && p.userId === user?.id)
                    ?.completedLessonIds.includes(lesson.id);

                  return (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 sm:p-3.5 hover:bg-white transition"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-zinc-200 text-xs font-bold text-zinc-700 shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-zinc-900 truncate">
                            {lesson.title}
                          </div>
                          {lesson.module && (
                            <div className="text-[11px] text-zinc-500 truncate">
                              {lesson.module}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[10px] sm:text-[11px] text-zinc-500">
                          {lesson.duration || "10:00"}
                        </span>
                        {isDone && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <Check size={11} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-between gap-2.5 pt-3 sm:pt-4 border-t border-zinc-200">
              <button
                onClick={() => setPreviewCourse(null)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer text-center"
              >
                Close Preview
              </button>

              <div className="flex items-center gap-2">
                <Link
                  href={`/about?course=${previewCourse.id}`}
                  onClick={() => setPreviewCourse(null)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:border-primary/40 hover:text-primary transition shadow-2xs"
                >
                  See About →
                </Link>
                {user?.role === "admin" ||
                user?.role === "manager" ||
                user?.isPremium ||
                user?.purchasedCourseIds?.includes(previewCourse.id) ||
                (!previewCourse.isPremiumOnly && (previewCourse.unlockLevel <= 1 || userLevel >= previewCourse.unlockLevel)) ? (
                  <Link href={`/classroom/${previewCourse.slug}`} className="w-full xs:w-auto">
                    <PrimaryButton className="inline-flex items-center justify-center gap-1.5 text-xs w-full xs:w-auto">
                      <Play size={14} /> Open in Classroom
                    </PrimaryButton>
                  </Link>
                ) : previewCourse.isPremiumOnly ? (
                  <GoldButton
                    onClick={() => {
                      setPreviewCourse(null);
                      setUpgradeOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 text-xs w-full xs:w-auto"
                  >
                    <Sparkles size={14} /> Upgrade to VIP ($9/mo)
                  </GoldButton>
                ) : (
                  <GoldButton
                    onClick={() => {
                      const c = previewCourse;
                      setPreviewCourse(null);
                      setPurchasingCourse(c);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 text-xs w-full xs:w-auto"
                  >
                    <Sparkles size={14} /> Unlock Course — {formatMoney(previewCourse.price || 49)}
                  </GoldButton>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. Purchase Confirmation Modal */}
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
              
              <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="text-xl sm:text-2xl font-black text-zinc-900">
                    {formatMoney(purchasingCourse.price || 49)}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-zinc-500 ml-2">One-time payment • Lifetime Access</span>
                </div>
                <Link
                  href={`/about?course=${purchasingCourse.id}`}
                  onClick={() => setPurchasingCourse(null)}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-bold text-primary hover:border-primary/40 hover:bg-primary/5 transition shadow-2xs"
                >
                  See About →
                </Link>
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
                Lesson discussion forums & instructor feedback
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Check size={14} className="text-emerald-600 shrink-0" />
                Future curriculum updates included at no extra charge
              </div>
            </div>

            <div className="rounded-xl bg-amber-50/80 p-3 border border-amber-200/80 text-[11px] sm:text-[11.5px] text-amber-900">
              <span className="font-bold">💡 Free Unlock Alternative:</span> You can also unlock this course for free by participating in community discussions to reach <strong>Level {purchasingCourse.unlockLevel}</strong> (Currently Level {userLevel}).
            </div>

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
                disabled={busyId === purchasingCourse.id}
                onClick={confirmPurchase}
              >
                {busyId === purchasingCourse.id ? "Processing..." : `Confirm ${formatMoney(purchasingCourse.price || 49)}`}
              </GoldButton>
            </div>
          </div>
        </Modal>
      )}

      {/* 7. Locked Course Modal */}
      <LockedCourseModal
        course={lockedModalCourse}
        open={Boolean(lockedModalCourse)}
        onClose={() => setLockedModalCourse(null)}
        onUpgradeClick={() => {
          setLockedModalCourse(null);
          setUpgradeOpen(true);
        }}
      />

      {/* 8. Upgrade Modal */}
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
