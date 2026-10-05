"use client";

import { Cookie, X } from "lucide-react";
import { useEffect, useState } from "react";
import { PrimaryButton } from "@/components/ui";

const KEY = "pss_cookies";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(KEY) !== "accepted");
    } catch {
      setVisible(true);
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(KEY, "accepted");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:right-auto sm:left-4 sm:bottom-4 z-40 max-w-sm sm:w-[320px] rounded-2xl border border-zinc-200/90 bg-white/95 backdrop-blur-md p-4 shadow-[0_16px_50px_rgba(15,23,42,0.16)] animate-in fade-in slide-in-from-bottom-3 duration-300">
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute right-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
        aria-label="Close"
      >
        <X size={15} />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Cookie size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-zinc-900">Cookies & Privacy</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            We use cookies to maintain your login session and enhance your learning experience.
          </p>
        </div>
      </div>
      <PrimaryButton type="button" className="mt-3.5 w-full py-2 text-xs font-bold shadow-2xs" onClick={accept}>
        Accept
      </PrimaryButton>
    </div>
  );
}
