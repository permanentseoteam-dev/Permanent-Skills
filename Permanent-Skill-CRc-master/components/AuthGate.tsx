"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "./AppProvider";

const OPEN = ["/", "/login", "/register"];
const LIMITED = ["/apply", "/pending"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, limited } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const publicPath = OPEN.includes(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !publicPath) {
      router.replace("/login");
      return;
    }
    const isApprovedOrStaff = user && (user.role === "admin" || user.role === "manager" || user.status === "approved");
    if (user && (pathname === "/login" || pathname === "/register")) {
      if (isApprovedOrStaff) router.replace("/community");
      else if (!user.application) router.replace("/apply");
      else router.replace("/pending");
      return;
    }
    if (user && pathname === "/" && isApprovedOrStaff) {
      router.replace("/community");
      return;
    }
    if (user && limited && !LIMITED.includes(pathname) && pathname !== "/login" && pathname !== "/") {
      if (!user.application) router.replace("/apply");
      else router.replace("/pending");
    }
    if (user && pathname === "/apply" && user.application && user.status === "pending") {
      router.replace("/pending");
    }
    if (user && pathname.startsWith("/admin") && user.role !== "admin") {
      router.replace("/community");
    }
  }, [user, loading, limited, pathname, publicPath, router]);

  if (loading && !publicPath) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
