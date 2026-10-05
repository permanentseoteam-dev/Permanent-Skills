"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Compass } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Sidebar } from "@/components/Sidebar";
import { CategoryPills, Feed, PostComposer, ReviewPrompt } from "@/components/feed";
import type { PostCategory } from "@/lib/types";

function CommunityContent() {
  const { communities, activeCommunity, switchCommunity } = useApp();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab") || searchParams?.get("category");
  const postParam = searchParams?.get("post") || searchParams?.get("postId");

  const [category, setCategory] = useState<"all" | PostCategory>(() => {
    if (postParam) return "all";
    if (tabParam && ["all", "chat", "wins", "recorded", "reviews", "team"].includes(tabParam)) {
      return tabParam as "all" | PostCategory;
    }
    return "all";
  });
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (postParam) {
      setCategory("all");
    } else if (tabParam && ["all", "chat", "wins", "recorded", "reviews", "team"].includes(tabParam)) {
      setCategory(tabParam as "all" | PostCategory);
    }
  }, [tabParam, postParam]);

  useEffect(() => {
    // Check if review prompt was dismissed previously
    const dismissed = localStorage.getItem("pss_dismiss_review_prompt");
    if (!dismissed) {
      setShowReview(true);
    }
  }, []);

  function handleDismissReview() {
    try {
      localStorage.setItem("pss_dismiss_review_prompt", "true");
    } catch {
      // Ignore
    }
    setShowReview(false);
  }

  function handleSelectReviews() {
    setCategory("reviews");
  }

  return (
    <div className="relative flex flex-col gap-4 sm:gap-6 lg:flex-row items-start">
      <div className="min-w-0 w-full flex-1 space-y-3 sm:space-y-4">
        {communities.length > 1 && (
          <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {communities.map((c) => {
              const isActive = c.id === activeCommunity?.id;
              return (
                <button
                  key={c.id}
                  onClick={() => switchCommunity(c.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition shrink-0 cursor-pointer active:scale-95 ${
                    isActive
                      ? "bg-primary text-white shadow-xs"
                      : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <span className="truncate max-w-[130px]">{c.name}</span>
                </button>
              );
            })}
            <Link
              href="/discover"
              className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-zinc-200 text-zinc-500 hover:text-primary transition shrink-0"
              title="Discover communities"
            >
              <Compass size={13} />
              <span>Discover</span>
            </Link>
          </div>
        )}
        <PostComposer defaultCategory={category === "reviews" ? "reviews" : undefined} />
        <CategoryPills value={category} onChange={setCategory} />
        {showReview && (
          <ReviewPrompt
            onDismiss={handleDismissReview}
            onSelect={handleSelectReviews}
          />
        )}
        <Feed category={category} targetPostId={postParam} />
      </div>
      <Sidebar />
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <CommunityContent />
    </Suspense>
  );
}
