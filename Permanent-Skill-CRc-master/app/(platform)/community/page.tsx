"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { CategoryPills, Feed, PostComposer, ReviewPrompt } from "@/components/feed";
import type { PostCategory } from "@/lib/types";

function CommunityContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab") || searchParams?.get("category");

  const [category, setCategory] = useState<"all" | PostCategory>(() => {
    if (tabParam && ["all", "chat", "wins", "recorded", "reviews", "team"].includes(tabParam)) {
      return tabParam as "all" | PostCategory;
    }
    return "all";
  });
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (tabParam && ["all", "chat", "wins", "recorded", "reviews", "team"].includes(tabParam)) {
      setCategory(tabParam as "all" | PostCategory);
    }
  }, [tabParam]);

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
    <div className="relative flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        <PostComposer defaultCategory={category === "reviews" ? "reviews" : undefined} />
        <CategoryPills value={category} onChange={setCategory} />
        {showReview && (
          <ReviewPrompt
            onDismiss={handleDismissReview}
            onSelect={handleSelectReviews}
          />
        )}
        <Feed category={category} />
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
