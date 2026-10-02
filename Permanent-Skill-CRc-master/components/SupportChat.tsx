"use client";

import { BookOpen, Info, Mail, MessageCircle, Phone, X } from "lucide-react";
import { useState } from "react";

const EMAIL = "support@permanentskilldevelop";
const PHONE = "03704555076";

const COURSES = [
  "Semantic SEO Course",
  "AI SEO",
  "AI Web, Software, and Tool Creation",
  "N8N Automation",
  "Meta Ads",
  "Leads Generation",
];

export function SupportChat() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[min(100vw-2rem,340px)] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Chat with us</p>
              <p className="text-xs text-white/80">We usually reply quickly</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/15"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>
          <div className="max-h-[min(70vh,460px)] space-y-4 overflow-y-auto p-4">
            <div className="space-y-2">
              <a
                href={`mailto:${EMAIL}`}
                className="flex items-center gap-3 rounded-xl bg-primary/5 px-3 py-2.5 text-sm text-zinc-800 hover:bg-primary/10"
              >
                <Mail size={16} className="shrink-0 text-primary" />
                <span className="break-all">{EMAIL}</span>
              </a>
              <a
                href={`tel:${PHONE}`}
                className="flex items-center gap-3 rounded-xl bg-primary/5 px-3 py-2.5 text-sm text-zinc-800 hover:bg-primary/10"
              >
                <Phone size={16} className="shrink-0 text-primary" />
                {PHONE}
              </a>
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                <Mail size={16} className="shrink-0 text-primary" />
                Contact Us
              </a>
              <a
                href="#about"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                <Info size={16} className="shrink-0 text-primary" />
                About Us
              </a>
            </div>
            <div>
              <a
                href="#courses"
                onClick={() => setOpen(false)}
                className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"
              >
                <BookOpen size={14} />
                All courses
              </a>
              <ul className="space-y-1">
                {COURSES.map((course) => (
                  <li key={course}>
                    <a
                      href="#courses"
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-1.5 text-sm text-zinc-700 hover:bg-primary/5 hover:text-primary"
                    >
                      {course}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_12px_30px_rgba(80,81,249,0.35)] hover:bg-primary-dark"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
