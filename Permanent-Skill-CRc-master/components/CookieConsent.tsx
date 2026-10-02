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
    <div className="fixed bottom-4 left-4 z-40 w-[min(100%-2rem,320px)] rounded-2xl border border-zinc-200 bg-white p-4 pt-5 shadow-[0_16px_50px_rgba(15,23,42,0.14)]">
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute right-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        aria-label="Close"
      >
        <X size={16} />
      </button>
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Cookie size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-zinc-900">Cookies</p>
          <p className="mt-1 text-xs leading-5 text-zinc-600">
            We use cookies to keep the site working and remember your visit.
          </p>
        </div>
      </div>
      <PrimaryButton type="button" className="mt-3 w-full" onClick={accept}>
        Accept
      </PrimaryButton>
    </div>
  );
}
