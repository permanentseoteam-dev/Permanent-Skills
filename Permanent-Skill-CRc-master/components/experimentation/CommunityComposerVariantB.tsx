"use client";

import { useState } from "react";
import { MessageSquare, Trophy, Star, Sparkles, HelpCircle, X } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Avatar, Card, PrimaryButton } from "@/components/ui";
import { trackExperimentEvent } from "@/lib/experimentation/telemetry";
import type { PostCategory } from "@/lib/types";

interface Props {
  onPostCreated?: () => void;
}

export function CommunityComposerVariantB({ onPostCreated }: Props) {
  const { createPost, user } = useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState<PostCategory>("chat");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [activeIntent, setActiveIntent] = useState<"question" | "win" | "review" | "general">("general");

  function handleOpenWithIntent(intent: "question" | "win" | "review") {
    setActiveIntent(intent);
    if (intent === "question") {
      setCategory("chat");
    } else if (intent === "win") {
      setCategory("wins");
    } else if (intent === "review") {
      setCategory("reviews");
    }
    setOpen(true);
    trackExperimentEvent("composer_open", "treatment", user?.id, { intent });
  }

  async function submit() {
    if (!body.trim()) return;
    setBusy(true);
    try {
      await createPost(title, body, category);
      trackExperimentEvent("post_submit", "treatment", user?.id, {
        category,
        intent: activeIntent,
        charCount: body.length,
      });
      setTitle("");
      setBody("");
      setOpen(false);
      onPostCreated?.();
    } finally {
      setBusy(false);
    }
  }

  // Guiding placeholder text based on intent
  const intentPlaceholders = {
    question: {
      title: "e.g. How do you structure internal links for local SEO?",
      body: "Describe your current setup, what challenge you're encountering, and what outcome you need help with...",
      badge: "Question",
      icon: <HelpCircle size={14} className="text-blue-500" />,
      hint: "Tip: Detailed questions get 3x faster solutions from top contributors.",
    },
    win: {
      title: "e.g. Crossed 50k monthly organic visitors with semantic silos!",
      body: "Share the strategy, timeline, tools used, and key takeaways that helped you achieve this milestone...",
      badge: "Win",
      icon: <Trophy size={14} className="text-amber-500" />,
      hint: "Tip: Real metrics and screenshots inspire the community and build your reputation.",
    },
    review: {
      title: "e.g. My experience with the Permanent Skills SEO System",
      body: "Share your honest feedback on the courses, community support, and what was most valuable for you...",
      badge: "Review",
      icon: <Star size={14} className="text-purple-500" />,
      hint: "Tip: Honest reviews help us continuously refine and improve course material.",
    },
    general: {
      title: "Title (optional)",
      body: "Share a thought, insight, or workflow with the community...",
      badge: "General",
      icon: <Sparkles size={14} className="text-primary" />,
      hint: "Tip: Keep discussions actionable and supportive.",
    },
  };

  const currentIntentConfig = intentPlaceholders[activeIntent];

  if (!open) {
    return (
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-xs transition hover:border-zinc-300">
        {/* Top Header Prompt */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar user={user} size={38} />
            <button
              onClick={() => handleOpenWithIntent("question")}
              className="text-left text-[14.5px] font-medium text-zinc-600 hover:text-zinc-900 transition"
            >
              What&apos;s happening in your SEO journey?
            </button>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active Community
          </span>
        </div>

        {/* Action-Oriented Prompt Chips */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
          <button
            onClick={() => handleOpenWithIntent("question")}
            className="group inline-flex items-center gap-2 rounded-xl bg-blue-50/70 hover:bg-blue-100/80 px-3.5 py-2 text-xs font-semibold text-blue-800 transition"
          >
            <MessageSquare size={14} className="text-blue-600 transition group-hover:scale-110" />
            <span>💬 Ask a Question</span>
          </button>

          <button
            onClick={() => handleOpenWithIntent("win")}
            className="group inline-flex items-center gap-2 rounded-xl bg-amber-50/70 hover:bg-amber-100/80 px-3.5 py-2 text-xs font-semibold text-amber-900 transition"
          >
            <Trophy size={14} className="text-amber-600 transition group-hover:scale-110" />
            <span>🏆 Share a Win</span>
          </button>

          <button
            onClick={() => handleOpenWithIntent("review")}
            className="group inline-flex items-center gap-2 rounded-xl bg-purple-50/70 hover:bg-purple-100/80 px-3.5 py-2 text-xs font-semibold text-purple-900 transition"
          >
            <Star size={14} className="text-purple-600 transition group-hover:scale-110" />
            <span>⭐ Leave a Review</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-5 border-primary/30 shadow-md">
      {/* Intent Banner */}
      <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2">
          {currentIntentConfig.icon}
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">
            Creating {currentIntentConfig.badge}
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
        >
          <X size={16} />
        </button>
      </div>

      {/* Category Pills */}
      <div className="mb-3 flex flex-wrap gap-2">
        {(["chat", "wins", "recorded", "reviews"] as PostCategory[]).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold capitalize transition ${
              category === c
                ? "bg-primary text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Title Input */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={currentIntentConfig.title}
        className="mb-2.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
      />

      {/* Body Input with Contextual Prompt */}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={currentIntentConfig.body}
        rows={4}
        className="min-h-[120px] w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
      />

      {/* Quality hint & Actions */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-xs text-zinc-400 font-medium">
          {currentIntentConfig.hint}
        </p>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setOpen(false)}
            className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition"
          >
            Cancel
          </button>
          <PrimaryButton
            disabled={busy || !body.trim()}
            onClick={submit}
            className="rounded-xl px-5 py-2"
          >
            {busy ? "Publishing..." : "Publish Post"}
          </PrimaryButton>
        </div>
      </div>
    </Card>
  );
}
