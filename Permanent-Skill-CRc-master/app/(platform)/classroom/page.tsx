"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Card, ProgressBar } from "@/components/ui";
import { getLevel } from "@/lib/levels";

export default function ClassroomPage() {
  const { courses, progress, user } = useApp();
  const level = getLevel(user?.points || 0).level;

  return (
    <div>
      <h1 className="sr-only">Classroom</h1>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => {
          const row = progress.find((p) => p.courseId === course.id && p.userId === user?.id);
          const total = course.lessons.length;
          const pct = total ? Math.round(((row?.completedLessonIds.length || 0) / total) * 100) : 0;
          const locked =
            course.unlockLevel > 1 &&
            level < course.unlockLevel &&
            !user?.isPremium &&
            user?.role !== "admin";
          return (
            <Link key={course.id} href={`/classroom/${course.slug}`}>
              <Card className="overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
                <div className={`relative h-44 bg-gradient-to-br ${course.accent} p-5 text-white`}>
                  <p className="text-xs font-semibold tracking-[0.25em] text-white/70">{course.badge}</p>
                  <h2 className="mt-4 text-2xl font-black leading-tight">{course.title}</h2>
                  {locked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 p-4 text-center">
                      <Lock className="mb-2" />
                      <p className="text-lg font-bold">Unlock at Level {course.unlockLevel}</p>
                      <p className="text-sm text-white/80">or Upgrade to Premium</p>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{course.title}</h3>
                  <p className="mt-1 min-h-[40px] text-sm text-zinc-500">{course.description}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <ProgressBar value={locked ? 0 : pct} />
                    <span className="text-xs font-semibold text-zinc-500">{locked ? "0%" : `${pct}%`}</span>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
