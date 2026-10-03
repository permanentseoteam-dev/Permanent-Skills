"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  Clock,
  VideoOff,
  Star,
  CheckCircle2,
  BookOpen,
  MessageSquare,
  FileText,
  ArrowLeft,
  Share2,
  Sparkles,
  HelpCircle,
  Video,
} from "lucide-react";
import { Card, PrimaryButton } from "@/components/ui";
import { formatDateTime, eventTimeLabel } from "@/lib/format";

function MeetingEndedContent() {
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "Community Live Session";
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");
  const typeParam = searchParams.get("type") || "live";
  const descParam = searchParams.get("desc") || "This scheduled meeting session has officially concluded.";

  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [submittedRating, setSubmittedRating] = useState(false);
  const [feedbackTag, setFeedbackTag] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const formattedTime = startParam
    ? `${formatDateTime(startParam)}${endParam ? ` - ${eventTimeLabel(endParam)}` : ""}`
    : "Recently Concluded";

  function handleRate(stars: number) {
    setRating(stars);
    setSubmittedRating(true);
  }

  function handleCopyShare() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.origin + "/calendar");
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/calendar"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-primary transition"
        >
          <ArrowLeft size={14} /> Back to Calendar
        </Link>
        <button
          onClick={handleCopyShare}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 bg-white border border-zinc-200 px-3 py-1.5 rounded-lg shadow-2xs transition cursor-pointer"
        >
          <Share2 size={13} />
          {copiedLink ? "Link Copied!" : "Share Calendar"}
        </button>
      </div>

      {/* Main Hero Card (Zoom / Google Meet Finished Style) */}
      <Card className="overflow-hidden border border-zinc-200 shadow-sm">
        {/* Top visual banner */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 px-6 py-8 text-center text-white relative">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md text-zinc-200 shadow-inner border border-white/10">
            <VideoOff size={32} className="text-red-400" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300 border border-red-500/30 mb-2">
            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
            Session Concluded
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            This Meeting Has Ended
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-300 max-w-md mx-auto">
            The live video session has finished. You can review session resources, check the upcoming calendar, or connect in the community.
          </p>
        </div>

        {/* Meeting details section */}
        <div className="p-6 space-y-5 bg-white">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={`inline-block rounded px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                  typeParam === "premium"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {typeParam === "premium" ? "👑 VIP Session" : "Live Session"}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                <Clock size={14} className="text-zinc-400" />
                <span>{formattedTime}</span>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
              <p className="mt-1 text-xs text-zinc-600 leading-relaxed">{descParam}</p>
            </div>
          </div>

          {/* Zoom-Style Session Feedback Widget */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center space-y-3 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Session Experience & Audio Quality
            </h3>
            
            {submittedRating ? (
              <div className="py-2 flex flex-col items-center justify-center gap-1 text-emerald-600 animate-fadeIn">
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <CheckCircle2 size={16} />
                  <span>Thank you! Your feedback has been recorded.</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Rated {rating} / 5 stars {feedbackTag && `• "${feedbackTag}"`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleRate(star)}
                      className="p-1 text-zinc-300 hover:text-amber-400 transition transform hover:scale-110 cursor-pointer"
                      title={`${star} Star${star > 1 ? "s" : ""}`}
                    >
                      <Star
                        size={24}
                        className={
                          (hoverRating || rating) >= star
                            ? "fill-amber-400 text-amber-400"
                            : "text-zinc-300"
                        }
                      />
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap justify-center gap-1.5">
                  {["Clear Audio & Video", "Great Insights", "Helpful Q&A", "Pacing was Good"].map(
                    (tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setFeedbackTag(tag);
                          if (!rating) setRating(5);
                          setSubmittedRating(true);
                        }}
                        className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition cursor-pointer"
                      >
                        {tag}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Post-Meeting Action Cards Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 px-1">
          Where would you like to go next?
        </h3>
        
        <div className="grid gap-3 sm:grid-cols-2">
          {/* 1. Return to Calendar */}
          <Link
            href="/calendar"
            className="group flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 hover:border-primary/50 hover:shadow-md transition shadow-2xs"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-primary group-hover:text-white transition">
                <Calendar size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 group-hover:text-primary transition">
                  Upcoming Calendar
                </h4>
                <p className="mt-0.5 text-xs text-zinc-500 leading-normal">
                  View next scheduled calls, mastermind sessions, and sync them to your calendar.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end text-xs font-semibold text-primary">
              Open Schedule &rarr;
            </div>
          </Link>

          {/* 2. Classroom & Replays */}
          <Link
            href="/classroom"
            className="group flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 hover:border-primary/50 hover:shadow-md transition shadow-2xs"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                <BookOpen size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 group-hover:text-purple-600 transition">
                  Classroom & Recordings
                </h4>
                <p className="mt-0.5 text-xs text-zinc-500 leading-normal">
                  Access course video lessons, replays, cheat sheets, and downloadable assets.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end text-xs font-semibold text-purple-600">
              Browse Classroom &rarr;
            </div>
          </Link>

          {/* 3. Community Discussions */}
          <Link
            href="/community"
            className="group flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 hover:border-primary/50 hover:shadow-md transition shadow-2xs"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                <MessageSquare size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 group-hover:text-emerald-600 transition">
                  Community Discussion
                </h4>
                <p className="mt-0.5 text-xs text-zinc-500 leading-normal">
                  Discuss takeaways, post wins, and connect with other attendees in the forum.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end text-xs font-semibold text-emerald-600">
              Join Discussion &rarr;
            </div>
          </Link>

          {/* 4. Notes & Deliverables */}
          <Link
            href="/classroom?tab=notes"
            className="group flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 hover:border-primary/50 hover:shadow-md transition shadow-2xs"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
                <FileText size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 group-hover:text-amber-600 transition">
                  My Meeting Notes
                </h4>
                <p className="mt-0.5 text-xs text-zinc-500 leading-normal">
                  Capture your key action items, tasks, and document your learnings with autosave.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end text-xs font-semibold text-amber-600">
              Open Notes &rarr;
            </div>
          </Link>
        </div>
      </div>

      {/* Helpful info footer */}
      <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-200 text-xs text-zinc-500 flex items-start gap-2.5">
        <Sparkles size={16} className="text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-zinc-700">Looking for the session recording?</span>
          <p className="mt-0.5">
            Full session replays and timestamped transcripts are processed and published to the Classroom tab within 24 hours of call conclusion.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MeetingEndedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      }
    >
      <MeetingEndedContent />
    </Suspense>
  );
}
