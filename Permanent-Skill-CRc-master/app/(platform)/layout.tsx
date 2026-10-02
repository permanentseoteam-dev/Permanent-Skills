"use client";

import { Header } from "@/components/Header";
import { LeftCommunityRail } from "@/components/LeftCommunityRail";
import { useApp } from "@/components/AppProvider";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, limited } = useApp();
  if (loading || !user || limited) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg relative">
      <Header />
      <LeftCommunityRail />
      <div className="mx-auto max-w-[1180px] px-4 py-6 sm:pl-16 lg:pl-16 xl:px-4">{children}</div>
    </div>
  );
}
