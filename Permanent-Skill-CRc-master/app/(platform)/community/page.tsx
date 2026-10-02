"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { CategoryPills, Feed, LiveBanner, PostComposer, ReviewPrompt } from "@/components/feed";
import type { PostCategory } from "@/lib/types";

export default function CommunityPage() {
  const [category, setCategory] = useState<"all" | PostCategory>("all");
  const [showReview, setShowReview] = useState(true);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        <PostComposer />
        <LiveBanner />
        <CategoryPills value={category} onChange={setCategory} />
        {showReview && <ReviewPrompt onDismiss={() => setShowReview(false)} />}
        <Feed category={category} />
      </div>
      <Sidebar />
    </div>
  );
}
