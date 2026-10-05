"use client";

import { BookOpen, Info, Mail, MessageCircle, Phone, X } from "lucide-react";
import { useState } from "react";

const EMAIL = "support@permanentseo.com";
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
    <div className="fixed right-3 bottom-3 sm:right-4 sm:bottom-4 z-40 flex flex-col items-end gap-2.5 sm:gap-3">
      {open && (
        <div className="w-[min(calc(100vw-1.5rem),340px)] max-h-[calc(100vh-5.5rem)] overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-white shrink-0">
            <div>
              <p className="text-sm font-bold">Chat with Support</p>
              <p className="text-[11px] text-white/80">We typically reply within minutes</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/15 transition active:scale-95"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <a
                href={`mailto:${EMAIL}`}
                className="flex items-center gap-3 rounded-xl bg-primary/5 px-3 py-2.5 text-xs sm:text-sm text-zinc-800 hover:bg-primary/10 transition"
              >
                <Mail size={16} className="shrink-0 text-primary" />
                <span className="break-all font-medium">{EMAIL}</span>
              </a>
              <a
                href={`tel:${PHONE}`}
                className="flex items-center gap-3 rounded-xl bg-primary/5 px-3 py-2.5 text-xs sm:text-sm text-zinc-800 hover:bg-primary/10 transition"
              >
                <Phone size={16} className="shrink-0 text-primary" />
                <span className="font-medium">{PHONE}</span>
              </a>
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-zinc-800 hover:bg-zinc-50 transition"
              >
                <Mail size={16} className="shrink-0 text-primary" />
                <span>Contact Us Form</span>
              </a>
              <a
                href="#about"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-zinc-800 hover:bg-zinc-50 transition"
              >
                <Info size={16} className="shrink-0 text-primary" />
                <span>About Us</span>
              </a>
            </div>
            <div className="border-t border-zinc-100 pt-3">
              <a
                href="#courses"
                onClick={() => setOpen(false)}
                className="mb-2 flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.16em] text-primary"
              >
                <BookOpen size={14} />
                Explore Classroom Courses
              </a>
              <ul className="space-y-0.5">
                {COURSES.map((course) => (
                  <li key={course}>
                    <a
                      href="#courses"
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-zinc-700 hover:bg-primary/5 hover:text-primary transition"
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
        className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_12px_30px_rgba(80,81,249,0.35)] hover:bg-primary-dark active:scale-95 transition-all"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X size={20} className="sm:w-[22px] sm:h-[22px]" /> : <MessageCircle size={20} className="sm:w-[22px] sm:h-[22px]" />}
      </button>
    </div>
  );
}
