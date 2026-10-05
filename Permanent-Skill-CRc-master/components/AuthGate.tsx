"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "./AppProvider";

const OPEN = ["/", "/login", "/register", "/apply", "/pending"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const publicPath = OPEN.includes(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !publicPath) {
      router.replace("/login");
      return;
    }
    if (user && pathname.startsWith("/admin") && user.role !== "admin") {
      router.replace("/community");
    }
  }, [user, loading, pathname, publicPath, router]);

  if (loading && !publicPath) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
