"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { CategoryPills, Feed, LiveBanner, PostComposer, ReviewPrompt } from "@/components/feed";
import { ExperimentationControlBar } from "@/components/experimentation/ExperimentationControlBar";
import { assignVariant, getQAOverride } from "@/lib/experimentation/bucketing";
import { useApp } from "@/components/AppProvider";
import type { ExperimentVariant, PostCategory } from "@/lib/types";

export default function CommunityPage() {
  const { user } = useApp();
  const [category, setCategory] = useState<"all" | PostCategory>("all");
  const [showReview, setShowReview] = useState(true);
  const [variant, setVariant] = useState<ExperimentVariant>("control");

  useEffect(() => {
    const override = getQAOverride();
    setVariant(override || assignVariant(user?.id));
  }, [user?.id]);

  return (
    <div className="relative flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        <PostComposer variantOverride={variant} />
        <LiveBanner />
        <CategoryPills value={category} onChange={setCategory} />
        {showReview && <ReviewPrompt onDismiss={() => setShowReview(false)} />}
        <Feed category={category} />
      </div>
      <Sidebar />

      {/* Floating QA Switcher & Live Statistical Dashboard */}
      <ExperimentationControlBar
        currentVariant={variant}
        onVariantChange={(newVariant) => setVariant(newVariant)}
      />
    </div>
  );
}
