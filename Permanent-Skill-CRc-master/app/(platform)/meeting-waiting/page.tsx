"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  ExternalLink,
  Lock,
  Radio,
  Share2,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { Card, GoldButton, PrimaryButton } from "@/components/ui";
import { formatDateTime, eventTimeLabel } from "@/lib/format";
import {
  checkMeetingStatus,
  createGoogleCalendarUrl,
  downloadIcsCalendarFile,
} from "@/lib/calendar-utils";

function MeetingWaitingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const title = searchParams.get("title") || "Scheduled Meeting";
  const startParam = searchParams.get("start") || "";
  const endParam = searchParams.get("end") || "";
  const meetUrl = searchParams.get("url") || "https://meet.google.com/new";
  const host = searchParams.get("host") || "Permanent Skills Admin";
  const room = searchParams.get("room") || "Nexus Meet #room-general";
  const typeParam = searchParams.get("type") || "live";
  const desc = searchParams.get("desc") || "Discussion, project sync & mastermind session.";

  // Timing state
  const [timing, setTiming] = useState(() => checkMeetingStatus(startParam, endParam));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = checkMeetingStatus(startParam, endParam);
      setTiming(next);

      if (next.status === "ended") {
        router.push(
          `/meeting-ended?title=${encodeURIComponent(title)}&start=${encodeURIComponent(startParam)}&end=${encodeURIComponent(endParam)}&type=${encodeURIComponent(typeParam)}&desc=${encodeURIComponent(desc)}`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startParam, endParam, title, typeParam, desc, router]);

  // Breakdown of countdown
  const totalSeconds = Math.floor(timing.msUntilStart / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  const formattedStart = startParam ? formatDateTime(startParam) : "Upcoming";
  const formattedEnd = endParam ? eventTimeLabel(endParam) : "";

  function handleShare() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleGoogleCalendar() {
    const url = createGoogleCalendarUrl({
      title,
      description: `${desc}\n\nJoin Link: ${meetUrl}`,
      start: timing.startDate,
      end: timing.endDate,
      location: meetUrl,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleDownloadIcs() {
    downloadIcsCalendarFile({
      title,
      description: `${desc}\n\nJoin Link: ${meetUrl}`,
      start: timing.startDate,
      end: timing.endDate,
      location: meetUrl,
      url: meetUrl,
    });
  }

  const isRoomOpen = timing.status === "can_join";

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/calendar"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-primary transition"
        >
          <ArrowLeft size={14} /> Back to Calendar
        </Link>
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 bg-white border border-zinc-200 px-3 py-1.5 rounded-lg shadow-2xs transition cursor-pointer"
        >
          <Share2 size={13} />
          {copied ? "Link Copied!" : "Share Meeting"}
        </button>
      </div>

      {/* Main Countdown & Waiting Card */}
      <Card className="overflow-hidden border border-zinc-200 shadow-sm">
        {/* Banner with Animated Glowing Countdown */}
        <div className="bg-gradient-to-br from-[#0b1b4a] via-[#1e1b4b] to-[#5051F9] px-6 py-10 text-center text-white relative select-none">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md text-amber-300 shadow-inner border border-white/15">
            {isRoomOpen ? <Radio size={32} className="animate-pulse text-emerald-400" /> : <Clock size={32} />}
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold mb-3 border shadow-xs backdrop-blur-xs bg-white/10 border-white/20 text-white">
            <span
              className={`h-2 w-2 rounded-full ${isRoomOpen ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`}
            />
            {isRoomOpen ? "🔴 Meeting Room is Open!" : "⏳ Meeting Starting Soon"}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white max-w-xl mx-auto">
            {title}
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-indigo-100/90 max-w-md mx-auto">
            {isRoomOpen
              ? "The host has opened the video room. You can join the session right now."
              : "The video room automatically opens 5 minutes before scheduled start time."}
          </p>

          {/* Countdown Clock Grid */}
          {!isRoomOpen && (
            <div className="mt-8 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              {days > 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-black/40 border border-white/15 px-4 py-3 min-w-[70px] backdrop-blur-md shadow-lg">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-amber-300">{pad(days)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mt-0.5">Days</span>
                </div>
              )}
              <div className="flex flex-col items-center justify-center rounded-2xl bg-black/40 border border-white/15 px-4 py-3 min-w-[70px] backdrop-blur-md shadow-lg">
                <span className="text-2xl sm:text-3xl font-black font-mono text-white">{pad(hours)}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mt-0.5">Hours</span>
              </div>
              <span className="text-2xl font-black text-white/40">:</span>
              <div className="flex flex-col items-center justify-center rounded-2xl bg-black/40 border border-white/15 px-4 py-3 min-w-[70px] backdrop-blur-md shadow-lg">
                <span className="text-2xl sm:text-3xl font-black font-mono text-white">{pad(minutes)}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mt-0.5">Mins</span>
              </div>
              <span className="text-2xl font-black text-white/40">:</span>
              <div className="flex flex-col items-center justify-center rounded-2xl bg-black/40 border border-white/15 px-4 py-3 min-w-[70px] backdrop-blur-md shadow-lg">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">{pad(seconds)}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mt-0.5">Secs</span>
              </div>
            </div>
          )}
        </div>

        {/* Meeting Information & Actions */}
        <div className="p-6 space-y-6 bg-white">
          {/* Details Card */}
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/60 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                    typeParam === "premium"
                      ? "bg-amber-100 text-amber-900 border border-amber-300/60"
                      : "bg-[#5051F9]/10 text-[#5051F9] border border-[#5051F9]/20"
                  }`}
                >
                  {typeParam === "premium" ? "👑 VIP Mastermind" : "Live Session"}
                </span>
                <span className="text-xs font-semibold text-zinc-500">{room}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 px-2.5 py-1 rounded-lg">
                <Clock size={13} className="text-[#5051F9]" />
                <span>{formattedStart} {formattedEnd && `– ${formattedEnd}`}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-zinc-900">{title}</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">{desc}</p>
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs text-zinc-600">
              <Users size={14} className="text-[#5051F9] shrink-0" />
              <span>Host: <strong className="font-bold text-zinc-900">{host}</strong></span>
            </div>
          </div>

          {/* Join Call Action Area */}
          <div className="rounded-2xl border border-zinc-200 p-5 space-y-4 bg-gradient-to-b from-white to-zinc-50/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-zinc-900">
                  {isRoomOpen ? "Video Room is Ready" : "Waiting for Room to Open"}
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {isRoomOpen
                    ? "Click the button to open Google Meet in a new tab."
                    : "The button unlocks automatically 5 minutes prior to the start time."}
                </p>
              </div>

              <div className="w-full sm:w-auto shrink-0">
                {isRoomOpen ? (
                  <a
                    href={meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 text-sm font-extrabold shadow-lg hover:shadow-xl hover:scale-102 transition cursor-pointer"
                  >
                    <Video size={18} />
                    <span>Join Meeting Now</span>
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <button
                    disabled
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-zinc-200 text-zinc-500 px-6 py-3 text-xs font-bold shadow-xs cursor-not-allowed select-none"
                  >
                    <Lock size={15} />
                    <span>Room Opens at {eventTimeLabel(new Date(timing.startDate.getTime() - 5 * 60 * 1000).toISOString())}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Add to Calendar Strip */}
            <div className="pt-4 border-t border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-semibold text-zinc-600 flex items-center gap-1.5">
                <Calendar size={14} className="text-[#5051F9]" />
                Don&apos;t miss this session. Add it to your calendar:
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGoogleCalendar}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs transition cursor-pointer"
                >
                  <Calendar size={13} className="text-blue-600" />
                  Google Calendar
                </button>
                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs transition cursor-pointer"
                >
                  <Download size={13} className="text-zinc-600" />
                  Download .ics
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function MeetingWaitingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      }
    >
      <MeetingWaitingContent />
    </Suspense>
  );
}
