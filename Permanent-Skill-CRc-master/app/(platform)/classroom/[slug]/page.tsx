"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Circle, Lock } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { ProgressBar, PrimaryButton } from "@/components/ui";
import { UpgradeModal } from "@/components/UpgradeModal";
import { getLevel } from "@/lib/levels";
import { renderNotes, toEmbed } from "@/lib/video";

export default function CoursePage() {
  const params = useParams<{ slug: string }>();
  const { courses, progress, user, completeLesson } = useApp();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const course = courses.find((c) => c.slug === params.slug);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  const locked = useMemo(() => {
    if (!course || !user) return true;
    const level = getLevel(user.points).level;
    return course.unlockLevel > 1 && level < course.unlockLevel && !user.isPremium && user.role !== "admin";
  }, [course, user]);

  const modules = useMemo(() => {
    if (!course) return [];
    const order: string[] = [];
    const map = new Map<string, typeof course.lessons>();
    for (const lesson of course.lessons) {
      const name = lesson.module || course.title;
      if (!map.has(name)) {
        map.set(name, []);
        order.push(name);
      }
      map.get(name)!.push(lesson);
    }
    return order.map((name) => ({ name, lessons: map.get(name)! }));
  }, [course]);

  if (!course) return <p className="text-zinc-500">Course not found.</p>;

  const row = progress.find((p) => p.courseId === course.id && p.userId === user?.id);
  const done = row?.completedLessonIds || [];
  const total = course.lessons.length || 1;
  const pct = Math.round((done.length / total) * 100);
  const lesson = course.lessons.find((l) => l.id === activeId) || course.lessons[0];
  const embed = toEmbed(lesson?.videoUrl);
  const currentIndex = course.lessons.findIndex((l) => l.id === lesson?.id);

  function isOpen(name: string) {
    if (openModules[name] !== undefined) return openModules[name];
    if (!lesson) return true;
    return lesson.module === name || modules[0]?.name === name;
  }

  return (
    <div>
      <Link href="/classroom" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-primary">
        <ChevronLeft size={16} /> Classroom
      </Link>

      {locked ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center">
          <Lock className="mx-auto mb-3 text-primary" />
          <h2 className="text-xl font-semibold">Unlock at Level {course.unlockLevel} or upgrade to Premium</h2>
          <PrimaryButton className="mt-5" onClick={() => setUpgradeOpen(true)}>
            Upgrade to Premium
          </PrimaryButton>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl bg-white p-4 lg:sticky lg:top-24">
            <h1 className="text-lg font-semibold">{course.title}</h1>
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar value={pct} />
              <span className="text-sm font-medium text-zinc-500">{pct}%</span>
            </div>
            <div className="mt-5 space-y-1">
              {modules.length === 0 && (
                <p className="px-2 py-6 text-sm text-zinc-500">No videos yet. Admins can add them from Admin → Classroom.</p>
              )}
              {modules.map((mod) => {
                const open = isOpen(mod.name);
                return (
                  <div key={mod.name}>
                    <button
                      onClick={() => setOpenModules((s) => ({ ...s, [mod.name]: !open }))}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      {mod.name}
                      {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {open && (
                      <div className="mb-2">
                        {mod.lessons.map((item) => {
                          const active = lesson?.id === item.id;
                          const complete = done.includes(item.id);
                          return (
                            <button
                              key={item.id}
                              onClick={() => setActiveId(item.id)}
                              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                                active ? "bg-[#f6e7c1] font-medium text-zinc-900" : "text-zinc-600 hover:bg-zinc-50"
                              }`}
                            >
                              {complete ? (
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                                  <Check size={10} />
                                </span>
                              ) : (
                                <Circle size={14} className="text-zinc-300" />
                              )}
                              {item.title}
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

          {!lesson && (
            <section className="rounded-2xl bg-white p-10 text-center text-zinc-500">
              <h2 className="text-xl font-semibold text-zinc-800">{course.title}</h2>
              <p className="mt-2 text-sm">No videos in this course yet. Open Admin → Classroom to add a video, title, and notes.</p>
            </section>
          )}

          {lesson && (
            <section className="relative rounded-2xl bg-white p-5 shadow-sm md:p-8">
              <button
                onClick={() => completeLesson(course.id, lesson.id)}
                className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                {done.includes(lesson.id) ? "Completed" : "Mark as done"}
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    done.includes(lesson.id) ? "bg-emerald-500" : "bg-zinc-600"
                  }`}
                >
                  <Check size={14} />
                </span>
              </button>

              <h2 className="pr-40 text-3xl font-bold tracking-tight">{lesson.videoTitle || lesson.title}</h2>

              <div className="mt-5 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950">
                {embed?.type === "file" ? (
                  <video key={embed.src} src={embed.src} controls className="aspect-video w-full bg-black" />
                ) : embed ? (
                  <iframe
                    key={embed.src}
                    src={embed.src}
                    title={lesson.videoTitle || lesson.title}
                    className="aspect-video w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center text-sm text-white/70">
                    No video yet. Admin can add one from the Admin classroom tab.
                  </div>
                )}
              </div>

              <div className="prose mt-6 max-w-none space-y-2 text-[15px] leading-7">{renderNotes(lesson.notes)}</div>

              <div className="mt-8 flex justify-between border-t border-zinc-100 pt-4">
                <button
                  disabled={currentIndex <= 0}
                  onClick={() => setActiveId(course.lessons[currentIndex - 1].id)}
                  className="text-sm font-medium text-zinc-500 disabled:opacity-30"
                >
                  ← Previous
                </button>
                <button
                  disabled={currentIndex >= course.lessons.length - 1}
                  onClick={() => setActiveId(course.lessons[currentIndex + 1].id)}
                  className="text-sm font-medium text-primary disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            </section>
          )}
        </div>
      )}
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
