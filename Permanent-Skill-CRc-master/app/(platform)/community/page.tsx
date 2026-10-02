"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { CategoryPills, Feed, LiveBanner, PostComposer, ReviewPrompt } from "@/components/feed";
import type { PostCategory } from "@/lib/types";

export default function CommunityPage() {
  const [category, setCategory] = useState<"all" | PostCategory>("all");
  const [showReview, setShowReview] = useState(false);

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

  return (
    <div className="relative flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        <PostComposer />
        <LiveBanner />
        <CategoryPills value={category} onChange={setCategory} />
        {showReview && <ReviewPrompt onDismiss={handleDismissReview} />}
        <Feed category={category} />
      </div>
      <Sidebar />
    </div>
  );
}
