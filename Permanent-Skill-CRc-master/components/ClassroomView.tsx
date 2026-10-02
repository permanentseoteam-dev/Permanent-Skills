"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  FileText,
  Lock,
  MessageSquare,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { UpgradeModal } from "@/components/UpgradeModal";
import { WordDocumentNotes } from "@/components/WordDocumentNotes";
import { LessonComments } from "@/components/LessonComments";
import { getLevel } from "@/lib/levels";
import { formatMoney } from "@/lib/format";
import { getVideoThumbnail, renderNotes, toEmbed } from "@/lib/video";
import type { Course, Lesson } from "@/lib/types";

interface ClassroomViewProps {
  initialCourseSlug?: string;
}

export function ClassroomView({ initialCourseSlug }: ClassroomViewProps) {
  const { courses, progress, user, completeLesson } = useApp();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<"overview" | "word-notes" | "comments">("overview");

  // Available courses
  const availableCourses = courses.length > 0 ? courses : [];

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(() => {
    if (initialCourseSlug) {
      const found = availableCourses.find((c) => c.slug === initialCourseSlug);
      if (found) return found.id;
    }
    return null;
  });

  // Sync selected course when initialCourseSlug changes from navigation
  useEffect(() => {
    if (initialCourseSlug) {
      const found = availableCourses.find((c) => c.slug === initialCourseSlug);
      if (found) {
        setSelectedCourseId(found.id);
        setActiveLessonId(null);
        setPlaying(false);
      }
    }
  }, [initialCourseSlug, availableCourses]);

  const activeCourse = useMemo(() => {
    if (!selectedCourseId) return null;
    return availableCourses.find((c) => c.id === selectedCourseId) || null;
  }, [availableCourses, selectedCourseId]);

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const locked = useMemo(() => {
    if (!activeCourse || !user) return false;
    const level = getLevel(user.points).level;
    const isPurchased = user.purchasedCourseIds?.includes(activeCourse.id);
    return (
      activeCourse.unlockLevel > 1 &&
      level < activeCourse.unlockLevel &&
      !user.isPremium &&
      user.role !== "admin" &&
      !isPurchased
    );
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
    setActiveLessonId(id);
    setPlaying(false);
  }

  function handleToggleComplete() {
    if (!activeCourse || !activeLesson) return;
    completeLesson(activeCourse.id, activeLesson.id);
  }

  // 1. PRIMARY VIEW: Classroom Course / Module Cards Grid (Store Theme)
  if (!activeCourse) {
    return (
      <div className="space-y-6">
        {/* Module Cards Grid matching Store Theme */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableCourses.map((course, idx) => {
            const cRow = progress.find(
              (p) => p.courseId === course.id && p.userId === user?.id
            );
            const cCompleted = cRow?.completedLessonIds || [];
            const cTotal = course.lessons.length;
            const cDone = cTotal
              ? course.lessons.filter((l) => cCompleted.includes(l.id)).length
              : 0;
            const cPct = cTotal ? Math.round((cDone / cTotal) * 100) : 0;

            const userLevel = getLevel(user?.points || 0).level;
            const isPurchased = user?.purchasedCourseIds?.includes(course.id);
            const isCourseLocked =
              course.unlockLevel > 1 &&
              userLevel < course.unlockLevel &&
              !user?.isPremium &&
              user?.role !== "admin" &&
              !isPurchased;

            const bannerBrand = course.bannerBrand || "PSS ACADEMY";
            const bannerSubtitle =
              course.bannerSubtitle || `MODULE ${idx + 1}.`;
            const bannerTitle =
              course.bannerTitle ||
              course.title.replace(/^Module\s*\d+:\s*/i, "");

            return (
              <div
                key={course.id}
                onClick={() => {
                  setSelectedCourseId(course.id);
                  setActiveLessonId(null);
                  setPlaying(false);
                }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/40 cursor-pointer"
              >
                {/* Store Theme Dark Card Banner with Blurple & Indigo Glow */}
                <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-[#121324] via-[#1a1b35] to-[#25284e] p-4 flex flex-col justify-between select-none">
                  {/* Subtle decorative radial gradients */}
                  <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/25 blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[#7c83ff]/20 blur-2xl pointer-events-none" />
                  
                  {/* Top brand header & Status pill */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 backdrop-blur-xs border border-white/10 text-xs font-bold text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="tracking-wide text-[11px]">{bannerBrand}</span>
                    </div>

                    {isCourseLocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-300 backdrop-blur-xs border border-amber-500/30">
                        <Lock size={10} /> {course.price ? formatMoney(course.price) : "Locked"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-300 backdrop-blur-xs border border-emerald-500/30">
                        <ShieldCheck size={11} /> Unlocked
                      </span>
                    )}
                  </div>

                  {/* Center Module Number & Bold Title */}
                  <div className="relative z-10 my-auto flex flex-col items-center justify-center px-2 text-center">
                    <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-[#7c83ff] mb-1">
                      {bannerSubtitle}
                    </span>
                    <h2 className="text-lg md:text-xl font-black uppercase tracking-wide text-white drop-shadow-md line-clamp-2">
                      {bannerTitle}
                    </h2>
                  </div>

                  {/* Bottom indicator space */}
                  <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-white/50">
                    <span>{cTotal} lessons</span>
                    <span>{cPct}% completed</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 group-hover:text-primary transition-colors line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="mt-1 text-xs md:text-sm text-zinc-600 line-clamp-2 leading-relaxed min-h-[38px]">
                      {course.description}
                    </p>
                  </div>

                  {/* Store Theme Pill Progress Bar */}
                  <div className="mt-5 space-y-2">
                    <div className="relative h-6 w-full overflow-hidden rounded-full bg-zinc-100 border border-zinc-200/80 flex items-center shadow-inner">
                      {cPct > 0 ? (
                        <>
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary via-[#6366f1] to-[#7c83ff] transition-all duration-500 flex items-center shadow-xs"
                            style={{ width: `${Math.max(cPct, 14)}%` }}
                          />
                          <span className="absolute left-3 text-[11.5px] font-extrabold text-white drop-shadow-xs">
                            {cPct}%
                          </span>
                        </>
                      ) : (
                        <span className="absolute left-3 text-[11.5px] font-extrabold text-zinc-500">
                          0%
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-zinc-500 font-medium">
                        {cDone} of {cTotal} lessons done
                      </span>
                      <span className="text-primary font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        {cPct > 0 ? "Continue" : "Start"} <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. DETAILED MODULE / COURSE LESSON VIEW (Store Theme)
  return (
    <div className="space-y-6">
      {/* Navigation Bar: Back to Classroom & Course Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/90 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedCourseId(null);
              setActiveLessonId(null);
              setPlaying(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition cursor-pointer shadow-xs"
          >
            <ChevronLeft size={16} /> Back to Classroom
          </button>

          <span className="text-zinc-300">/</span>

          <h1 className="text-sm font-bold text-zinc-900 line-clamp-1">
            {activeCourse.title}
          </h1>
        </div>

        {/* Course Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {availableCourses.map((c, idx) => {
            const isSelected = c.id === activeCourse.id;
            const cRow = progress.find(
              (p) => p.courseId === c.id && p.userId === user?.id
            );
            const cDone = c.lessons.filter((l) =>
              cRow?.completedLessonIds.includes(l.id)
            ).length;
            const cPct = c.lessons.length
              ? Math.round((cDone / c.lessons.length) * 100)
              : 0;

            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCourseId(c.id);
                  setActiveLessonId(null);
                  setPlaying(false);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? "bg-primary text-white shadow-xs"
                    : "bg-white text-zinc-600 border border-zinc-200 hover:border-primary/30 hover:text-primary"
                }`}
                title={c.title}
              >
                <span>{idx + 1}</span>
                <span className="text-[10px] opacity-80">{cPct}%</span>
              </button>
            );
          })}
        </div>
      </div>

      {locked ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center">
          <Lock className="mx-auto mb-3 text-primary" />
          <h2 className="text-xl font-bold text-zinc-900">
            Unlock at Level {activeCourse.unlockLevel} or upgrade to Premium
          </h2>
          <button
            onClick={() => setUpgradeOpen(true)}
            className="mt-5 inline-flex items-center rounded-xl bg-primary px-5 py-2.5 font-bold text-white shadow-md hover:bg-primary-dark transition"
          >
            Upgrade to Premium
          </button>
        </div>
      ) : (
        <div className="grid gap-7 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
          {/* Left Sidebar */}
          <aside className="order-2 lg:order-1 space-y-6">
            {/* Store Theme Pill Progress Bar */}
            <div
              className="relative h-8 w-full overflow-hidden rounded-full bg-[#e2e4e9] flex items-center shadow-inner"
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
                className={`absolute inset-y-0 left-4 flex items-center text-xs font-black tracking-wide transition-colors ${
                  pct > 15 ? "text-white drop-shadow-xs" : "text-zinc-800"
                }`}
              >
                {pct}%
              </span>
            </div>

            {/* Prominent Lesson Navigation List */}
            <div className="space-y-6">
              {modules.map((mod) => (
                <div key={mod.name} className="space-y-2.5">
                  <h2 className="text-lg font-bold tracking-tight text-zinc-900">
                    {mod.name}
                  </h2>

                  <div className="space-y-1.5">
                    {mod.lessons.map((item) => {
                      const isActive = activeLesson?.id === item.id;
                      const isDone = completedIds.includes(item.id);

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectLesson(item.id)}
                          className={`group flex w-full items-center justify-between text-left transition-all cursor-pointer ${
                            isActive
                              ? "rounded-xl bg-primary/10 border border-primary/25 px-4 py-2.5 font-bold text-primary shadow-2xs"
                              : "rounded-xl px-4 py-2.5 text-[14.5px] font-medium text-zinc-800 hover:bg-white hover:text-primary hover:shadow-xs border border-transparent hover:border-zinc-200"
                          }`}
                        >
                          <span
                            className={`truncate leading-snug ${
                              isActive
                                ? "font-bold text-primary text-[14.5px]"
                                : "text-zinc-800 group-hover:text-primary"
                            }`}
                            title={item.title}
                          >
                            {item.title}
                          </span>

                          {isDone && (
                            <span
                              className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full shadow-xs bg-primary text-white"
                              title="Completed"
                            >
                              <Check size={11} strokeWidth={3.5} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Right Main Card */}
          <main className="order-1 lg:order-2 rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm md:p-8 space-y-8">
            {activeLesson ? (
              <div className="space-y-8">
                {/* Header: Lesson Title + Circular Completion Checkmark Button */}
                <div className="flex items-center justify-between gap-4 pb-5 border-b border-zinc-100">
                  <h1 className="text-xl font-bold tracking-tight text-zinc-900 md:text-2xl">
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
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer ${
                      isCurrentCompleted
                        ? "border-2 border-primary bg-primary text-white shadow-sm hover:bg-primary-dark hover:border-primary-dark hover:scale-105"
                        : "border-2 border-zinc-400 text-zinc-400 hover:border-primary hover:text-primary hover:scale-105"
                    }`}
                  >
                    <Check size={17} strokeWidth={3} />
                  </button>
                </div>

                {/* 16:9 Video Player Container */}
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-200 shadow-inner group">
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
                      <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
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
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-primary/20 flex flex-col items-center justify-center p-6 text-center">
                          <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/30 mb-2">
                            {activeCourse.badge || "LESSON"}
                          </span>
                          <h2 className="max-w-md text-lg font-bold text-white line-clamp-2">
                            {activeLesson.title}
                          </h2>
                        </div>
                      )}

                      {/* Subtle Vignette */}
                      <div className="absolute inset-0 bg-black/25 transition group-hover:bg-black/15" />

                      {/* Center Play Button Overlay with Store Blurple Theme */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/65 text-white backdrop-blur-xs transition group-hover:scale-110 group-hover:bg-primary shadow-2xl">
                          <Play size={26} fill="currentColor" className="ml-1" />
                        </div>
                      </div>

                      {/* Bottom-right Duration Badge */}
                      <div className="absolute bottom-3 right-3 rounded bg-black/85 px-2.5 py-1 font-mono text-xs font-bold text-white shadow-xs">
                        {activeLesson.duration || "0:34"}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Section Navigator Tabs */}
                <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveBottomTab("overview")}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                      activeBottomTab === "overview"
                        ? "bg-primary text-white shadow-xs"
                        : "bg-white text-zinc-700 border border-zinc-200 hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    <BookOpen size={14} /> Lesson Overview & Swipe Files
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBottomTab("word-notes")}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                      activeBottomTab === "word-notes"
                        ? "bg-primary text-white shadow-xs"
                        : "bg-white text-zinc-700 border border-zinc-200 hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    <FileText size={14} /> Word Document Notes
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBottomTab("comments")}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                      activeBottomTab === "comments"
                        ? "bg-primary text-white shadow-xs"
                        : "bg-white text-zinc-700 border border-zinc-200 hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    <MessageSquare size={14} /> Discussion & Comments
                  </button>
                </div>

                {/* 1. SECTION 1: Lesson Description & Notes matching Image 1 */}
                {activeBottomTab === "overview" && (
                  <div className="space-y-4 rounded-2xl border border-zinc-200/90 bg-white p-6 md:p-8 shadow-xs">
                    <div className="prose max-w-none text-[15px] leading-relaxed text-zinc-800">
                      {renderNotes(activeLesson.notes || "No notes provided for this lesson.")}
                    </div>
                  </div>
                )}

                {/* 2. SECTION 2: Word Document Notes Sheet matching Image 2 */}
                {activeBottomTab === "word-notes" && (
                  <div className="space-y-2">
                    <WordDocumentNotes
                      lessonId={activeLesson.id}
                      lessonTitle={activeLesson.title}
                    />
                  </div>
                )}

                {/* 3. SECTION 3: Lesson Comments with Admin & Manager Moderation */}
                {activeBottomTab === "comments" && (
                  <div>
                    <LessonComments
                      lessonId={activeLesson.id}
                      lessonTitle={activeLesson.title}
                    />
                  </div>
                )}

                {/* Previous / Next Navigation in Store Theme */}
                <div className="flex items-center justify-between border-t border-zinc-100 pt-6">
                  <button
                    disabled={currentIndex <= 0}
                    onClick={() => {
                      if (currentIndex > 0) {
                        handleSelectLesson(activeCourse.lessons[currentIndex - 1].id);
                      }
                    }}
                    className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    ← Previous Lesson
                  </button>

                  <div className="text-xs font-bold text-zinc-400">
                    Lesson {currentIndex + 1} of {totalLessons}
                  </div>

                  <button
                    disabled={currentIndex >= totalLessons - 1}
                    onClick={() => {
                      if (currentIndex < totalLessons - 1) {
                        handleSelectLesson(activeCourse.lessons[currentIndex + 1].id);
                      }
                    }}
                    className="text-sm font-bold text-primary hover:text-primary-dark disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    Next Lesson →
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-500">
                <p>No lessons available in this course.</p>
              </div>
            )}
          </main>
        </div>
      )}

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
