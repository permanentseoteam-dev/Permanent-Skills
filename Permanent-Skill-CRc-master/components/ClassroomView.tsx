"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronRight, Lock, Play } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { UpgradeModal } from "@/components/UpgradeModal";
import { getLevel } from "@/lib/levels";
import { renderNotes, toEmbed } from "@/lib/video";
import type { Course, Lesson } from "@/lib/types";

interface ClassroomViewProps {
  initialCourseSlug?: string;
}

export function ClassroomView({ initialCourseSlug }: ClassroomViewProps) {
  const { courses, progress, user, completeLesson } = useApp();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Available courses (ensuring we have at least 2 visible courses to switch between)
  const availableCourses = courses.length > 0 ? courses : [];

  const defaultCourse = useMemo(() => {
    if (initialCourseSlug) {
      const found = availableCourses.find((c) => c.slug === initialCourseSlug);
      if (found) return found;
    }
    return availableCourses[0] || null;
  }, [availableCourses, initialCourseSlug]);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    defaultCourse?.id || null
  );

  const activeCourse = useMemo(() => {
    return (
      availableCourses.find((c) => c.id === selectedCourseId) ||
      defaultCourse ||
      availableCourses[0] ||
      null
    );
  }, [availableCourses, selectedCourseId, defaultCourse]);

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  const locked = useMemo(() => {
    if (!activeCourse || !user) return false;
    const level = getLevel(user.points).level;
    return (
      activeCourse.unlockLevel > 1 &&
      level < activeCourse.unlockLevel &&
      !user.isPremium &&
      user.role !== "admin"
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

  // Progress calculations
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

  function toggleModule(name: string) {
    setOpenModules((prev) => ({
      ...prev,
      [name]: prev[name] !== undefined ? !prev[name] : false,
    }));
  }

  function handleSelectLesson(id: string) {
    setActiveLessonId(id);
    setPlaying(false);
  }

  function handleToggleComplete() {
    if (!activeCourse || !activeLesson) return;
    completeLesson(activeCourse.id, activeLesson.id);
  }

  if (!activeCourse) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-zinc-500">
        <p className="text-lg font-medium">No courses available yet.</p>
      </div>
    );
  }

  // Active module name for header
  const currentModuleName =
    activeLesson?.module || modules[0]?.name || "Module 1: Introduction";

  return (
    <div className="space-y-5">
      {/* Course Switcher Pills (Allows testing multiple dummy courses visually) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200/80 pb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mr-1">
          Courses:
        </span>
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
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition ${
                isSelected
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200/70"
              }`}
            >
              <span>
                {idx + 1}. {c.title}
              </span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isSelected
                    ? "bg-zinc-800 text-zinc-200"
                    : "bg-zinc-200 text-zinc-600"
                }`}
              >
                {cPct}%
              </span>
            </button>
          );
        })}
      </div>

      {locked ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center">
          <Lock className="mx-auto mb-3 text-primary" />
          <h2 className="text-xl font-semibold">
            Unlock at Level {activeCourse.unlockLevel} or upgrade to Premium
          </h2>
          <button
            onClick={() => setUpgradeOpen(true)}
            className="mt-5 inline-flex items-center rounded-xl bg-primary px-5 py-2.5 font-semibold text-white hover:bg-primary-dark"
          >
            Upgrade to Premium
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          {/* Left Sidebar */}
          <aside className="space-y-5">
            <div>
              {/* Module Header */}
              <h2 className="text-[17px] font-bold tracking-tight text-zinc-900">
                {currentModuleName}
              </h2>

              {/* Pill Progress Bar */}
              <div
                className="mt-2.5 relative h-7 w-full overflow-hidden rounded-full bg-[#e5e7eb] flex items-center shadow-inner"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                title={`Course Progress: ${pct}%`}
              >
                {/* Progress Fill */}
                <div
                  className="h-full rounded-full bg-zinc-800 transition-all duration-300 ease-out"
                  style={{ width: `${pct}%` }}
                />

                {/* Percentage Label */}
                <span
                  className={`absolute inset-y-0 left-3.5 flex items-center text-xs font-bold transition-colors ${
                    pct > 15 ? "text-white" : "text-zinc-700"
                  }`}
                >
                  {pct}%
                </span>
              </div>
            </div>

            {/* Lesson Navigation List */}
            <div className="space-y-4">
              {modules.map((mod) => {
                const isExpanded = openModules[mod.name] !== false; // Default expanded
                return (
                  <div key={mod.name} className="space-y-1">
                    {modules.length > 1 && (
                      <button
                        onClick={() => toggleModule(mod.name)}
                        className="flex w-full items-center justify-between px-1 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-700"
                      >
                        <span>{mod.name}</span>
                        {isExpanded ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                      </button>
                    )}

                    {isExpanded && (
                      <div className="space-y-1">
                        {mod.lessons.map((item) => {
                          const isActive = activeLesson?.id === item.id;
                          const isDone = completedIds.includes(item.id);

                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelectLesson(item.id)}
                              className={`group flex w-full items-center justify-between text-left transition-all ${
                                isActive
                                  ? "rounded-xl bg-[#fcd34d] px-3.5 py-2.5 font-medium text-zinc-950 shadow-xs"
                                  : "rounded-xl px-3.5 py-2 text-sm text-zinc-800 hover:bg-zinc-100/80 hover:text-zinc-950"
                              }`}
                            >
                              <span
                                className={`truncate text-[13.5px] leading-snug ${
                                  isActive ? "font-semibold text-zinc-950" : "font-normal"
                                }`}
                                title={item.title}
                              >
                                {item.title}
                              </span>

                              {isDone && (
                                <span
                                  className={`ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                                    isActive
                                      ? "bg-zinc-950 text-white"
                                      : "bg-emerald-500 text-white"
                                  }`}
                                  title="Completed"
                                >
                                  <Check size={10} strokeWidth={3} />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Right Main Card */}
          <main className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs md:p-7">
            {activeLesson ? (
              <div>
                {/* Header: Lesson Title + Completion Checkmark Button */}
                <div className="flex items-center justify-between gap-4 pb-4">
                  <h1 className="text-xl font-bold tracking-tight text-zinc-900 md:text-2xl">
                    {activeLesson.videoTitle || activeLesson.title}
                  </h1>

                  {/* Circular Completion Toggle Button matching reference */}
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
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
                      isCurrentCompleted
                        ? "border-2 border-emerald-500 bg-emerald-500 text-white shadow-xs hover:bg-emerald-600 hover:border-emerald-600"
                        : "border-2 border-zinc-400 text-zinc-400 hover:border-zinc-800 hover:text-zinc-800"
                    }`}
                  >
                    <Check size={16} strokeWidth={2.8} />
                  </button>
                </div>

                {/* 16:9 Video Player Container */}
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-950 border border-zinc-200/80 shadow-inner group">
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
                    /* Video Preview Overlay matching user's screenshot */
                    <div
                      onClick={() => setPlaying(true)}
                      className="relative h-full w-full cursor-pointer select-none bg-zinc-900"
                    >
                      {/* Background Visual Frame / Thumbnail */}
                      <img
                        src="/founder-welcome.png"
                        alt={activeLesson.title}
                        className="h-full w-full object-cover object-right"
                        onError={(e) => {
                          // Fallback to neutral dark background if image missing
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />

                      {/* Subtle Dark Vignette */}
                      <div className="absolute inset-0 bg-black/20 transition group-hover:bg-black/10" />

                      {/* Center Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-black/65 text-white backdrop-blur-xs transition group-hover:scale-105 group-hover:bg-black/80 shadow-xl">
                          <Play size={24} fill="currentColor" className="ml-1" />
                        </div>
                      </div>

                      {/* Bottom-right Duration Badge */}
                      <div className="absolute bottom-3 right-3 rounded bg-black/85 px-2 py-0.5 font-mono text-xs font-semibold text-white shadow-xs">
                        {activeLesson.duration || "0:34"}
                      </div>
                    </div>
                  )}
                </div>

                {/* Lesson Description & Notes */}
                {activeLesson.notes && (
                  <div className="mt-6 border-t border-zinc-100 pt-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Lesson Notes & Resources
                    </h3>
                    <div className="prose max-w-none text-[15px] leading-relaxed text-zinc-700">
                      {renderNotes(activeLesson.notes)}
                    </div>
                  </div>
                )}

                {/* Previous / Next Navigation */}
                <div className="mt-8 flex items-center justify-between border-t border-zinc-100 pt-4">
                  <button
                    disabled={currentIndex <= 0}
                    onClick={() => {
                      if (currentIndex > 0) {
                        handleSelectLesson(activeCourse.lessons[currentIndex - 1].id);
                      }
                    }}
                    className="text-sm font-medium text-zinc-500 hover:text-zinc-900 disabled:opacity-30 disabled:pointer-events-none transition"
                  >
                    ← Previous
                  </button>

                  <div className="text-xs font-medium text-zinc-400">
                    Lesson {currentIndex + 1} of {totalLessons}
                  </div>

                  <button
                    disabled={currentIndex >= totalLessons - 1}
                    onClick={() => {
                      if (currentIndex < totalLessons - 1) {
                        handleSelectLesson(activeCourse.lessons[currentIndex + 1].id);
                      }
                    }}
                    className="text-sm font-semibold text-primary hover:text-primary-dark disabled:opacity-30 disabled:pointer-events-none transition"
                  >
                    Next →
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
