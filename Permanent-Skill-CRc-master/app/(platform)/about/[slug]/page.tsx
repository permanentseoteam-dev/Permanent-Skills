"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CourseAboutSlugPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  useEffect(() => {
    if (slug) {
      router.replace(`/about?course=${encodeURIComponent(slug)}`);
    } else {
      router.replace("/about");
    }
  }, [slug, router]);

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
    </div>
  );
}
