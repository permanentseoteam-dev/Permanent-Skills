"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, Check, Lock, Play, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Card, PrimaryButton, GoldButton, ProgressBar } from "@/components/ui";
import { getLevel } from "@/lib/levels";
import { formatMoney } from "@/lib/format";

export default function AllCoursesPage() {
  const { courses, progress, user, purchaseCourse } = useApp();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const level = getLevel(user?.points || 0).level;

  async function handlePurchase(courseId: string) {
    setBusyId(courseId);
    setSuccessMsg(null);
    try {
      const res = await purchaseCourse(courseId);
      if (res.ok) {
        setSuccessMsg("Course purchased successfully! You now have full lifetime access.");
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">All Courses</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {courses.length} Courses
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Explore every training, course, and mastermind module offered by the admin.
          </p>
        </div>

        {user?.role === "admin" && (
          <Link href="/admin">
            <PrimaryButton className="inline-flex items-center gap-1.5 text-xs">
              <Plus size={14} /> Add / Manage Courses
            </PrimaryButton>
          </Link>
        )}
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800 border border-emerald-200">
          <Check size={18} className="text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => {
          const row = progress.find((p) => p.courseId === course.id && p.userId === user?.id);
          const total = course.lessons.length;
          const pct = total ? Math.round(((row?.completedLessonIds.length || 0) / total) * 100) : 0;

          const isPurchased = user?.purchasedCourseIds?.includes(course.id);
          const isLevelUnlocked = course.unlockLevel <= 1 || level >= course.unlockLevel;
          const isAccessible = user?.role === "admin" || user?.isPremium || isPurchased || isLevelUnlocked;
          const price = course.price || 49;

          return (
            <Card key={course.id} className="flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
              <div className={`relative h-44 bg-gradient-to-br ${course.accent} p-5 text-white flex flex-col justify-between`}>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-black/25 px-2 py-0.5 text-[10px] font-bold tracking-[0.2em] text-white">
                    {course.badge}
                  </span>
                  {isAccessible ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-xs font-semibold text-white">
                      <ShieldCheck size={13} /> Unlocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-0.5 text-xs font-semibold text-white">
                      <Lock size={12} /> {formatMoney(price)}
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-bold leading-snug">{course.title}</h2>
                  <p className="mt-1 text-xs text-white/80">{total} video lessons</p>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <p className="min-h-[44px] text-sm text-zinc-600 line-clamp-2">{course.description}</p>
                  
                  {isAccessible ? (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs font-medium text-zinc-500 mb-1.5">
                        <span>Progress</span>
                        <span>{pct}%</span>
                      </div>
                      <ProgressBar value={pct} />
                    </div>
                  ) : (
                    <div className="mt-4 rounded-lg bg-zinc-50 p-2.5 text-xs text-zinc-600">
                      <span>Requires Level {course.unlockLevel} or direct course purchase</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100">
                  {isAccessible ? (
                    <Link href={`/classroom/${course.slug}`} className="block">
                      <PrimaryButton className="w-full inline-flex items-center justify-center gap-2">
                        <Play size={15} /> {pct > 0 ? "Continue Learning" : "Start Course"}
                      </PrimaryButton>
                    </Link>
                  ) : (
                    <div className="space-y-2">
                      <GoldButton
                        className="w-full inline-flex items-center justify-center gap-1.5"
                        disabled={busyId === course.id}
                        onClick={() => handlePurchase(course.id)}
                      >
                        <Sparkles size={15} />
                        {busyId === course.id ? "Processing..." : `Purchase Course — ${formatMoney(price)}`}
                      </GoldButton>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
