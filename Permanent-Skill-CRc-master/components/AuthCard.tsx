"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { X } from "lucide-react";
import LandingPage from "@/components/LandingPage";
import { useApp } from "@/components/AppProvider";

export function AuthCard({
  title,
  subtitle,
  children,
  onClose,
  maxWidth = "max-w-md sm:max-w-lg",
  stepBadge,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onClose?: () => void;
  maxWidth?: string;
  stepBadge?: string;
}) {
  const router = useRouter();
  const { user } = useApp();

  function handleDismiss() {
    if (onClose) {
      onClose();
      return;
    }
    if (user) {
      router.push("/community");
    } else {
      router.push("/");
    }
  }

  // Allow closing via Escape key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleDismiss();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [user]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden inert>
        <div className="origin-top scale-105 blur-sm sm:blur-md brightness-[0.85]">
          <LandingPage />
        </div>
      </div>
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/45 cursor-pointer p-2.5 sm:p-4 md:p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleDismiss();
          }
        }}
      >
        <div
          className="flex min-h-full items-center justify-center py-3 sm:py-6 md:py-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleDismiss();
            }
          }}
        >
          <div
            className={`relative w-full ${maxWidth} rounded-2xl sm:rounded-3xl border border-zinc-200/90 bg-white p-4 sm:p-7 md:p-8 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.22)] cursor-default transition-all`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={handleDismiss}
              className="absolute right-3 top-3 sm:right-4 sm:top-4 inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-800 cursor-pointer active:scale-95"
            >
              <X size={18} />
            </button>
            <Link href="/" className="mb-3.5 sm:mb-5 flex justify-center">
              <Image
                src="/logo.png"
                alt="Permanent Skill Strategy"
                width={220}
                height={56}
                className="h-8 sm:h-10 md:h-11 w-auto max-w-[170px] sm:max-w-none object-contain"
                priority
                unoptimized
              />
            </Link>
            {stepBadge && (
              <div className="mb-2.5 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary ring-1 ring-primary/20">
                  {stepBadge}
                </span>
              </div>
            )}
            <h1 className="text-center text-lg sm:text-2xl font-bold tracking-tight text-zinc-950 px-2">{title}</h1>
            <p className="mb-4 sm:mb-6 text-center text-xs sm:text-sm text-zinc-500 leading-relaxed px-2">{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
