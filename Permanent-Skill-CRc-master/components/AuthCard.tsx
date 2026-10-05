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
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onClose?: () => void;
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
        <div className="origin-top scale-105 blur-md brightness-[0.85]">
          <LandingPage />
        </div>
      </div>
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/40 cursor-pointer"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleDismiss();
          }
        }}
      >
        <div
          className="flex min-h-full items-start justify-center px-4 py-8 sm:items-center sm:py-10"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleDismiss();
            }
          }}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.22)] cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={handleDismiss}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-800 cursor-pointer"
            >
              <X size={18} />
            </button>
            <Link href="/" className="mb-6 flex justify-center">
              <Image
                src="/logo.png"
                alt="Permanent Skill Strategy"
                width={220}
                height={56}
                className="h-12 w-auto"
                priority
                unoptimized
              />
            </Link>
            <h1 className="text-center text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mb-6 text-center text-sm text-zinc-500">{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
