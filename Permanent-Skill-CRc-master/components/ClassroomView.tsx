"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  FileText,
  Flame,
  Lock,
  MessageSquare,
  Pencil,
  Play,
  ShieldCheck,
  Sparkles,
  Unlock,
  Upload,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { UpgradeModal } from "@/components/UpgradeModal";
import { LockedCourseModal } from "@/components/LockedCourseModal";
import { WordDocumentNotes } from "@/components/WordDocumentNotes";
import { LessonComments } from "@/components/LessonComments";
import { Card, Field, Modal, PrimaryButton, StaffRoleFavicon, inputClass } from "@/components/ui";
import { getLevel } from "@/lib/levels";
import { formatMoney } from "@/lib/format";
import { getVideoThumbnail, renderNotes, toEmbed } from "@/lib/video";
import { isCourseAccessible } from "@/lib/course-security";
import type { Course, Lesson } from "@/lib/types";

interface ClassroomViewProps {
  initialCourseSlug?: string;
}

export function ClassroomView({ initialCourseSlug }: ClassroomViewProps) {
  const router = useRouter();
  const { courses, progress, user, completeLesson, saveCourse } = useApp();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [lockedModalCourse, setLockedModalCourse] = useState<Course | null>(null);
  const [playing, setPlaying] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<"overview" | "word-notes" | "comments">("overview");

  const isAdmin = user?.role === "admin" || user?.role === "manager";

  // Cover image modal state for Admin / Manager
  const [editingCoverCourse, setEditingCoverCourse] = useState<Course | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverWatermark, setCoverWatermark] = useState("");
  const [coverGlow, setCoverGlow] = useState<"yellow" | "green" | "blue" | "orange" | "red" | "purple">("yellow");
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverSaving, setCoverSaving] = useState(false);

  function openEditCoverModal(c: Course) {
    setEditingCoverCourse(c);
    setCoverImageUrl(c.thumbnail || "");
    setCoverWatermark(c.watermark || "");
    setCoverGlow(c.glowColor || "yellow");
  }

  async function handleUploadCoverImage(file: File) {
    setCoverUploading(true);
    const data = new FormData();
    data.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      setCoverUploading(false);
      if (json.ok && json.url) {
        setCoverImageUrl(json.url);
      } else {
        alert(json.error || "Image upload failed.");
      }
    } catch {
      setCoverUploading(false);
      alert("Image upload failed.");
    }
  }

  async function handleSaveCover() {
    if (!editingCoverCourse) return;
    setCoverSaving(true);
    const res = await saveCourse({
      id: editingCoverCourse.id,
      title: editingCoverCourse.title,
      description: editingCoverCourse.description,
      unlockLevel: editingCoverCourse.unlockLevel,
      badge: editingCoverCourse.badge,
      price: editingCoverCourse.price,
      isPremiumOnly: editingCoverCourse.isPremiumOnly,
      thumbnail: coverImageUrl.trim() || undefined,
      watermark: coverWatermark.trim() || undefined,
      glowColor: coverGlow,
    });
    setCoverSaving(false);
    if (res.ok) {
      setEditingCoverCourse(null);
    } else {
      alert(res.error || "Failed to update course cover.");
    }
  }

  // Available courses
  const availableCourses = courses.length > 0 ? courses : [];

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(() => {
    if (initialCourseSlug) {
      const found = availableCourses.find((c) => c.slug === initialCourseSlug);
      if (found) return found.id;
    }
    return null;
  });

  // Sync selected course when initialCourseSlug changes from navigation / browser back
  useEffect(() => {
    if (initialCourseSlug && availableCourses.length > 0) {
      const found = availableCourses.find((c) => c.slug === initialCourseSlug);
      if (found) {
        setSelectedCourseId(found.id);
      }
    }
  }, [initialCourseSlug, availableCourses]);

  function isCourseUnlocked(c: Course) {
    return isCourseAccessible(c, user);
  }

  function handleSelectCourse(course: Course) {
    if (!isCourseAccessible(course, user)) {
      setLockedModalCourse(course);
      return;
    }
    setSelectedCourseId(course.id);
    setActiveLessonId(null);
    setPlaying(false);
    router.push(`/classroom/${course.slug}`);
  }

  function handleBackToClassroom() {
    setSelectedCourseId(null);
    setActiveLessonId(null);
    setPlaying(false);
    router.push("/classroom");
  }

  const activeCourse = useMemo(() => {
    if (!selectedCourseId) return null;
    return availableCourses.find((c) => c.id === selectedCourseId) || null;
  }, [availableCourses, selectedCourseId]);

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const locked = useMemo(() => {
    if (!activeCourse) return false;
    return !isCourseAccessible(activeCourse, user);
  }, [activeCourse, user]);

  // Group lessons by module
  const modules = useMemo(() => {
    if (!activeCourse) return [];
    const order: string[] = [];
    const map = new Map<string, Lesson[]>();
    for (const lesson of activeCourse.lessons) {
      const name = lesson.module || "Module 1: Introduction";
      if (!map.has(name)) {
        map.set(name, []);
        order.push(name);
      }
      map.get(name)!.push(lesson);
    }
    return order.map((name) => ({ name, lessons: map.get(name)! }));
  }, [activeCourse]);

  // Active lesson
  const activeLesson: Lesson | null = useMemo(() => {
    if (!activeCourse || activeCourse.lessons.length === 0) return null;
    if (activeLessonId) {
      const found = activeCourse.lessons.find((l) => l.id === activeLessonId);
      if (found) return found;
    }
    return activeCourse.lessons[0];
  }, [activeCourse, activeLessonId]);

  // Progress calculations for active course
  const row = progress.find(
    (p) => p.courseId === activeCourse?.id && p.userId === user?.id
  );
  const completedIds = row?.completedLessonIds || [];
  const totalLessons = activeCourse?.lessons.length || 0;
  const completedCount = totalLessons
    ? activeCourse!.lessons.filter((l) => completedIds.includes(l.id)).length
    : 0;
  const pct = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;

  const isCurrentCompleted = activeLesson
    ? completedIds.includes(activeLesson.id)
    : false;

  const currentIndex = activeCourse && activeLesson
    ? activeCourse.lessons.findIndex((l) => l.id === activeLesson.id)
    : -1;

  const embed = activeLesson ? toEmbed(activeLesson.videoUrl) : null;

  function handleSelectLesson(id: string) {
    if (locked) return;
    setActiveLessonId(id);
    setPlaying(false);
  }

  function handleToggleComplete() {
    if (locked || !activeCourse || !activeLesson) return;
    completeLesson(activeCourse.id, activeLesson.id);
  }

  function handleToggleLessonComplete(lessonId: string, e?: React.MouseEvent) {
    if (e) {
      e.stopPropagation();
    }
    if (locked || !activeCourse) return;
    completeLesson(activeCourse.id, lessonId);
  }

  // Helper to render course banner matching original design
  function renderCourseBanner(course: Course) {
    const isAccessible = isCourseAccessible(course, user);
    const isLevel1 = course.unlockLevel === 1 && !course.isPremiumOnly;
    const isPremiumOnly = Boolean(
      course.isPremiumOnly ||
      course.badge?.toUpperCase() === "VIP" ||
      course.badge?.toUpperCase() === "PREMIUM"
    );
    const glow = course.glowColor || "yellow";
    const watermark = course.watermark || `> ${course.slug}_`;

    // 1. Custom Background Image if configured by admin/manager
    if (course.thumbnail) {
      return (
        <div
          className="relative h-40 sm:h-44 md:h-48 w-full overflow-hidden p-4 flex flex-col items-center justify-center select-none bg-cover bg-center group/banner"
          style={{
            backgroundImage: `url(${course.thumbnail})`,
          }}
        >
          {/* Subtle contrast overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px]" />

          {/* Admin / Manager Quick Edit Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openEditCoverModal(course);
              }}
              className="absolute top-2.5 right-2.5 z-20 inline-flex items-center gap-1 rounded-lg bg-black/80 hover:bg-black px-2 py-1 text-[11px] font-bold text-white backdrop-blur-xs border border-white/20 shadow-md transition cursor-pointer"
              title="Edit Course Background Cover (Admin/Manager)"
            >
              <Pencil size={11} /> Edit Cover
            </button>
          )}

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
          className="relative h-40 sm:h-44 md:h-48 w-full overflow-hidden bg-[#786c12] p-4 flex flex-col items-center justify-center select-none group/banner"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(0,0,0,0.22) 1.5px, transparent 1.5px)",
            backgroundSize: "12px 12px",
          }}
        >
          {/* Admin / Manager Quick Edit Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openEditCoverModal(course);
              }}
              className="absolute top-2.5 right-2.5 z-20 inline-flex items-center gap-1 rounded-lg bg-black/80 hover:bg-black px-2 py-1 text-[11px] font-bold text-white backdrop-blur-xs border border-white/20 shadow-md transition cursor-pointer"
              title="Edit Course Background Cover (Admin/Manager)"
            >
              <Pencil size={11} /> Edit Cover
            </button>
          )}

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
      <div className="relative h-40 sm:h-44 md:h-48 w-full overflow-hidden bg-black p-4 flex flex-col items-center justify-center select-none group/banner">
        {/* Admin / Manager Quick Edit Button */}
        {isAdmin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openEditCoverModal(course);
            }}
            className="absolute top-2.5 right-2.5 z-20 inline-flex items-center gap-1 rounded-lg bg-black/80 hover:bg-black px-2 py-1 text-[11px] font-bold text-white backdrop-blur-xs border border-white/20 shadow-md transition cursor-pointer"
            title="Edit Course Background Cover (Admin/Manager)"
          >
            <Pencil size={11} /> Edit Cover
          </button>
        )}

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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. PRIMARY VIEW: Classroom Course / Module Cards Grid (Original Design) */}
      {!activeCourse ? (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableCourses.map((course) => {
            const cRow = progress.find(
              (p) => p.courseId === course.id && p.userId === user?.id
            );
            const cCompleted = cRow?.completedLessonIds || [];
            const cTotal = course.lessons.length;
            const cDone = cTotal
              ? course.lessons.filter((l) => cCompleted.includes(l.id)).length
              : 0;
            const cPct = cTotal ? Math.round((cDone / cTotal) * 100) : 0;

            return (
              <div
                key={course.id}
                onClick={() => handleSelectCourse(course)}
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
                    <p className="mt-1 text-xs sm:text-[13px] text-zinc-600 line-clamp-2 leading-relaxed min-h-[34px] sm:min-h-[36px]">
                      {course.description}
                    </p>
                  </div>

                  {/* Clean Pill Progress Bar */}
                  <div className="mt-3.5 sm:mt-4">
                    <div className="relative h-5 w-full overflow-hidden rounded-full bg-[#e5e7eb] flex items-center shadow-inner">
                      {cPct > 0 && (
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary via-[#6366f1] to-[#7c83ff] transition-all duration-500"
                          style={{ width: `${cPct}%` }}
                        />
                      )}
                      <span className="absolute left-3 text-[11px] font-bold text-zinc-700">
                        {cPct}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 text-[11px]">
                    <span className="font-semibold text-zinc-500">
                      {course.isPremiumOnly
                        ? "👑 VIP Plan"
                        : course.price
                        ? formatMoney(course.price)
                        : `Level ${course.unlockLevel}`}
                    </span>
                    <Link
                      href={`/about?course=${course.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-bold text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      See About →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 2. DETAILED MODULE / COURSE LESSON VIEW */
        <div className="space-y-4 sm:space-y-6">
      {/* Navigation Bar: Back to Classroom & Course Title */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200/90 pb-3 sm:pb-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={handleBackToClassroom}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 sm:px-3.5 py-1.5 text-xs font-bold text-zinc-700 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition cursor-pointer shadow-xs shrink-0 active:scale-95"
          >
            <ChevronLeft size={16} /> Back to Classroom
          </button>

          <span className="text-zinc-300 shrink-0">/</span>

          <h1 className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
            {activeCourse.title}
          </h1>
        </div>
      </div>

      {locked ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-10 text-center">
          <Lock className="mx-auto mb-3 text-primary" />
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
            {activeCourse.isPremiumOnly || activeCourse.badge?.toUpperCase() === "VIP" || activeCourse.badge?.toUpperCase() === "PREMIUM"
              ? "👑 VIP Mastermind Access Required"
              : `Unlock at Level ${activeCourse.unlockLevel} or upgrade to VIP`}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {activeCourse.isPremiumOnly || activeCourse.badge?.toUpperCase() === "VIP" || activeCourse.badge?.toUpperCase() === "PREMIUM"
              ? "This mastermind is reserved exclusively for active VIP subscribers."
              : `Course Price: ${formatMoney(activeCourse.price || 49)} or Level ${activeCourse.unlockLevel}`}
          </p>
          <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={() => setUpgradeOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 sm:px-5 py-2.5 font-bold text-xs sm:text-sm text-white shadow-md hover:bg-primary-dark transition cursor-pointer"
            >
              👑 Upgrade to VIP ($9/mo)
            </button>
            <Link
              href={`/about?course=${activeCourse.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 sm:px-5 py-2.5 font-bold text-xs sm:text-sm text-zinc-700 shadow-2xs hover:border-primary/40 hover:text-primary transition"
            >
              See About →
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:gap-7 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          {/* Left / Secondary Sidebar for Module Lessons */}
          <aside className="order-2 lg:order-1 space-y-4 sm:space-y-6">
            {/* Store Theme Pill Progress Bar */}
            <div
              className="relative h-7 sm:h-8 w-full overflow-hidden rounded-full bg-[#e2e4e9] flex items-center shadow-inner"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              title={`Course Progress: ${pct}%`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-[#6366f1] to-[#7c83ff] transition-all duration-400 ease-out shadow-xs"
                style={{ width: `${pct}%` }}
              />

              <span
                className={`absolute inset-y-0 left-3.5 sm:left-4 flex items-center text-xs font-black tracking-wide transition-colors ${
                  pct > 15 ? "text-white drop-shadow-xs" : "text-zinc-800"
                }`}
              >
                {pct}%
              </span>
            </div>

            {/* Prominent Lesson Navigation List */}
            <div className="space-y-4 sm:space-y-6">
              {modules.map((mod) => (
                <div key={mod.name} className="space-y-2 sm:space-y-2.5">
                  <h2 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-zinc-900">
                    {mod.name}
                  </h2>

                  <div className="space-y-1 sm:space-y-1.5">
                    {mod.lessons.map((item) => {
                      const isActive = activeLesson?.id === item.id;
                      const isDone = completedIds.includes(item.id);

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectLesson(item.id)}
                          className={`group flex w-full items-center justify-between text-left transition-all cursor-pointer select-none ${
                            isActive
                              ? "rounded-xl bg-primary/10 border border-primary/25 px-3.5 sm:px-4 py-2 sm:py-2.5 font-bold text-primary shadow-2xs"
                              : "rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-[14.5px] font-medium text-zinc-800 hover:bg-white hover:text-primary hover:shadow-xs border border-transparent hover:border-zinc-200"
                          }`}
                        >
                          <span
                            className={`truncate flex-1 leading-snug ${
                              isActive
                                ? "font-bold text-primary text-xs sm:text-[14.5px]"
                                : "text-zinc-800 group-hover:text-primary"
                            }`}
                            title={item.title}
                          >
                            {item.title}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => handleToggleLessonComplete(item.id, e)}
                            aria-label={isDone ? `Mark ${item.title} as incomplete` : `Mark ${item.title} as complete`}
                            title={isDone ? "Completed! Click to unmark" : "Click to mark as completed"}
                            className={`ml-2 flex h-5 w-5 sm:h-5.5 sm:w-5.5 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer ${
                              isDone
                                ? "bg-primary text-white shadow-xs hover:bg-primary-dark hover:scale-105"
                                : "border-2 border-zinc-300 text-transparent hover:border-primary hover:text-primary/40 hover:scale-105"
                            }`}
                          >
                            <Check size={11} className={`sm:w-3 sm:h-3 stroke-[3] ${isDone ? "opacity-100 text-white" : "opacity-0 group-hover:opacity-60"}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Right Main Player & Content Card */}
          <main className="order-1 lg:order-2 rounded-2xl border border-zinc-200/90 bg-white p-4 sm:p-6 md:p-8 shadow-sm space-y-5 sm:space-y-8 min-w-0">
            {activeLesson ? (
              <div className="space-y-5 sm:space-y-8">
                {/* Header: Lesson Title + Circular Completion Checkmark Button */}
                <div className="flex items-start sm:items-center justify-between gap-3 pb-3.5 sm:pb-5 border-b border-zinc-100">
                  <h1 className="text-base sm:text-xl md:text-2xl font-bold tracking-tight text-zinc-950 leading-snug">
                    {activeLesson.videoTitle || activeLesson.title}
                  </h1>

                  {/* Circular Completion Toggle Button in Store Brand Theme */}
                  <button
                    onClick={handleToggleComplete}
                    aria-label={
                      isCurrentCompleted
                        ? "Mark as uncompleted"
                        : "Mark as completed"
                    }
                    title={
                      isCurrentCompleted
                        ? "Completed! Click to unmark"
                        : "Click to mark as completed"
                    }
                    className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer ${
                      isCurrentCompleted
                        ? "border-2 border-primary bg-primary text-white shadow-sm hover:bg-primary-dark hover:border-primary-dark hover:scale-105"
                        : "border-2 border-zinc-400 text-zinc-400 hover:border-primary hover:text-primary hover:scale-105"
                    }`}
                  >
                    <Check size={15} className="sm:w-4 sm:h-4 stroke-[3]" />
                  </button>
                </div>

                {/* 16:9 Video Player Container */}
                <div className="relative aspect-video w-full overflow-hidden rounded-xl sm:rounded-2xl bg-zinc-950 border border-zinc-200 shadow-inner group">
                  {playing ? (
                    embed?.type === "file" ? (
                      <video
                        key={embed.src}
                        src={embed.src}
                        controls
                        autoPlay
                        className="h-full w-full object-cover"
                      />
                    ) : embed ? (
                      <iframe
                        key={embed.src}
                        src={`${embed.src}?autoplay=1`}
                        title={activeLesson.videoTitle || activeLesson.title}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs sm:text-sm text-zinc-400">
                        No video source available.
                      </div>
                    )
                  ) : (
                    /* Dynamic Video Preview Overlay */
                    <div
                      onClick={() => setPlaying(true)}
                      className="relative h-full w-full cursor-pointer select-none bg-zinc-950 overflow-hidden"
                    >
                      {getVideoThumbnail(activeLesson.videoUrl) ? (
                        <img
                          src={getVideoThumbnail(activeLesson.videoUrl)!}
                          alt={activeLesson.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-primary/20 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                          <span className="rounded-full bg-primary/20 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold text-primary ring-1 ring-primary/30 mb-2">
                            {activeCourse.badge || "LESSON"}
                          </span>
                          <h2 className="max-w-md text-sm sm:text-lg font-bold text-white line-clamp-2">
                            {activeLesson.title}
                          </h2>
                        </div>
                      )}

                      {/* Subtle Vignette */}
                      <div className="absolute inset-0 bg-black/25 transition group-hover:bg-black/15" />

                      {/* Center Play Button Overlay with Store Blurple Theme */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-black/65 text-white backdrop-blur-xs transition group-hover:scale-110 group-hover:bg-primary shadow-2xl">
                          <Play size={22} className="sm:w-6 sm:h-6 ml-1 fill-current" />
                        </div>
                      </div>

                      {/* Bottom-right Duration Badge */}
                      <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 rounded bg-black/85 px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono text-[10px] sm:text-xs font-bold text-white shadow-xs">
                        {activeLesson.duration || "0:34"}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Section Navigator Tabs - Responsive Horizontal Slider */}
                <div className="relative w-full border-b border-zinc-200 pb-2.5 sm:pb-3">
                  <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveBottomTab("overview")}
                      className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition cursor-pointer active:scale-95 ${
                        activeBottomTab === "overview"
                          ? "bg-primary text-white shadow-xs"
                          : "bg-white text-zinc-700 border border-zinc-200 hover:border-primary/40 hover:text-primary"
                      }`}
                    >
                      <BookOpen size={13} className="sm:w-3.5 sm:h-3.5 shrink-0" /> <span>Lesson Overview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveBottomTab("word-notes")}
                      className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition cursor-pointer active:scale-95 ${
                        activeBottomTab === "word-notes"
                          ? "bg-primary text-white shadow-xs"
                          : "bg-white text-zinc-700 border border-zinc-200 hover:border-primary/40 hover:text-primary"
                      }`}
                    >
                      <FileText size={13} className="sm:w-3.5 sm:h-3.5 shrink-0" /> <span>Notes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveBottomTab("comments")}
                      className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition cursor-pointer active:scale-95 ${
                        activeBottomTab === "comments"
                          ? "bg-primary text-white shadow-xs"
                          : "bg-white text-zinc-700 border border-zinc-200 hover:border-primary/40 hover:text-primary"
                      }`}
                    >
                      <MessageSquare size={13} className="sm:w-3.5 sm:h-3.5 shrink-0" /> <span>Discussion</span>
                    </button>
                  </div>
                </div>

                {/* 1. SECTION 1: Lesson Description & Notes */}
                {activeBottomTab === "overview" && (
                  <div className="space-y-3.5 sm:space-y-4 rounded-xl sm:rounded-2xl border border-zinc-200/90 bg-white p-4 sm:p-6 md:p-8 shadow-xs">
                    <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-black text-[9px] sm:text-[10px] font-black text-white">
                          PSS
                        </span>
                        <span className="text-xs font-bold text-zinc-900">Permanent Skills Academy</span>
                        <StaffRoleFavicon role="admin" size="xs" />
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">Official Course Material</span>
                    </div>
                    <div className="prose max-w-none text-xs sm:text-sm md:text-[15px] leading-relaxed text-zinc-800 break-words">
                      {renderNotes(activeLesson.notes || "No notes provided for this lesson.")}
                    </div>
                  </div>
                )}

                {/* 2. SECTION 2: Notes Sheet */}
                {activeBottomTab === "word-notes" && (
                  <div className="space-y-2">
                    <WordDocumentNotes
                      lessonId={activeLesson.id}
                      lessonTitle={activeLesson.title}
                    />
                  </div>
                )}

                {/* 3. SECTION 3: Lesson Comments */}
                {activeBottomTab === "comments" && (
                  <div>
                    <LessonComments
                      lessonId={activeLesson.id}
                      lessonTitle={activeLesson.title}
                    />
                  </div>
                )}

                {/* Previous / Next Navigation */}
                <div className="flex items-center justify-between gap-2 border-t border-zinc-100 pt-4 sm:pt-6 flex-wrap">
                  <button
                    disabled={currentIndex <= 0}
                    onClick={() => {
                      if (currentIndex > 0) {
                        handleSelectLesson(activeCourse.lessons[currentIndex - 1].id);
                      }
                    }}
                    className="text-xs sm:text-sm font-semibold text-zinc-500 hover:text-zinc-900 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    ← Previous Lesson
                  </button>

                  <div className="text-[11px] sm:text-xs font-bold text-zinc-400">
                    Lesson {currentIndex + 1} of {totalLessons}
                  </div>

                  <button
                    disabled={currentIndex >= totalLessons - 1}
                    onClick={() => {
                      if (currentIndex < totalLessons - 1) {
                        handleSelectLesson(activeCourse.lessons[currentIndex + 1].id);
                      }
                    }}
                    className="text-xs sm:text-sm font-bold text-primary hover:text-primary-dark disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    Next Lesson →
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-500 text-xs sm:text-sm">
                <p>No lessons available in this course.</p>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  )}

      {/* EDIT COURSE BACKGROUND / COVER MODAL (Admin & Manager Only) */}
      <Modal
        open={Boolean(editingCoverCourse)}
        onClose={() => setEditingCoverCourse(null)}
        title={`Edit Background: ${editingCoverCourse?.title || "Course"}`}
        wide
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3.5 sm:p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" /> Course Cover / Background Image
              </span>
              <span className="text-[10px] font-bold text-zinc-400">Admin & Manager Only</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Background Image URL">
                <input
                  className={inputClass}
                  placeholder="https://images.unsplash.com/... or CDN link"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                />
              </Field>

              <Field label="Or Upload Direct Image File">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white p-2.5 text-xs font-semibold text-zinc-600 hover:border-primary hover:bg-primary/5 hover:text-primary transition min-h-[42px] shadow-2xs">
                  <Upload size={14} className="shrink-0" />
                  {coverUploading ? (
                    <span className="text-primary font-bold">Uploading Image...</span>
                  ) : coverImageUrl ? (
                    <span className="truncate max-w-[200px] text-zinc-700">Change Image File</span>
                  ) : (
                    "Upload PNG / JPG / WebP"
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={coverUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadCoverImage(file);
                    }}
                  />
                </label>
              </Field>
            </div>

            {coverImageUrl && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-emerald-700 font-medium">✓ Custom background cover image active</span>
                <button
                  type="button"
                  onClick={() => setCoverImageUrl("")}
                  className="text-[11px] font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                >
                  Remove Custom Image
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Field label="Terminal Watermark (Optional background text)">
                <input
                  className={inputClass}
                  placeholder="e.g. > AI_AUTOMATION_"
                  value={coverWatermark}
                  onChange={(e) => setCoverWatermark(e.target.value)}
                />
              </Field>

              <Field label="Glow Theme (Fallback or Ambient)">
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {(["yellow", "green", "blue", "orange", "red", "purple"] as const).map((color) => {
                    const bgColors: Record<string, string> = {
                      yellow: "bg-amber-400",
                      green: "bg-emerald-500",
                      blue: "bg-sky-500",
                      orange: "bg-orange-500",
                      red: "bg-rose-500",
                      purple: "bg-purple-500",
                    };
                    const isSelected = coverGlow === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCoverGlow(color)}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold capitalize transition shadow-2xs cursor-pointer ${
                          isSelected
                            ? "border-zinc-900 bg-zinc-900 text-white shadow-xs"
                            : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${bgColors[color]}`} />
                        {color}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>

            {/* Live Banner Preview */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Live Card Banner Preview
              </label>
              <div className="overflow-hidden rounded-2xl border border-zinc-300 shadow-sm max-w-md mx-auto">
                {coverImageUrl ? (
                  <div
                    className="relative h-36 w-full overflow-hidden p-4 flex flex-col items-center justify-center select-none bg-cover bg-center"
                    style={{ backgroundImage: `url(${coverImageUrl})` }}
                  >
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px]" />
                    {coverWatermark && (
                      <div className="absolute inset-x-0 bottom-2 text-center font-mono text-xl font-black text-white/30 tracking-tight select-none">
                        {coverWatermark}
                      </div>
                    )}
                    <div className="relative z-10 flex flex-col items-center justify-center text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/85 text-white shadow-xl border border-white/25">
                        <Unlock size={16} />
                      </div>
                      <span className="mt-1 text-xs font-extrabold text-white drop-shadow-md">
                        {editingCoverCourse?.title}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-36 w-full overflow-hidden bg-black p-4 flex flex-col items-center justify-center select-none">
                    <div
                      className={`absolute h-24 w-24 rounded-full blur-2xl pointer-events-none ${
                        coverGlow === "green"
                          ? "bg-emerald-500/30"
                          : coverGlow === "blue"
                          ? "bg-sky-500/30"
                          : coverGlow === "orange"
                          ? "bg-orange-500/35"
                          : coverGlow === "red"
                          ? "bg-rose-500/30"
                          : coverGlow === "purple"
                          ? "bg-purple-500/35"
                          : "bg-amber-400/25"
                      }`}
                    />
                    <div className="absolute inset-x-0 bottom-2 text-center font-mono text-xl font-black text-white/15 tracking-tight select-none">
                      {coverWatermark || `> ${editingCoverCourse?.slug || "course"}_`}
                    </div>
                    <div className="relative z-10 flex flex-col items-center justify-center text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950/90 border-2 border-white/40 text-white shadow-xl">
                        <Unlock size={16} />
                      </div>
                      <span className="mt-1 text-xs font-extrabold text-white drop-shadow-md">
                        {editingCoverCourse?.title}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
            <button
              type="button"
              onClick={() => setEditingCoverCourse(null)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <PrimaryButton
              disabled={coverSaving || coverUploading}
              onClick={handleSaveCover}
              className="rounded-xl px-5 py-2.5 text-xs font-bold cursor-pointer"
            >
              {coverSaving ? "Saving Cover..." : "Save Background Image"}
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      <LockedCourseModal
        course={lockedModalCourse}
        open={Boolean(lockedModalCourse)}
        onClose={() => setLockedModalCourse(null)}
        onUpgradeClick={() => {
          setLockedModalCourse(null);
          setUpgradeOpen(true);
        }}
      />

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
