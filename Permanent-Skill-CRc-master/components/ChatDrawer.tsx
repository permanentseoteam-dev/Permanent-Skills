"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Send, X } from "lucide-react";
import { useApp } from "./AppProvider";
import { Avatar, StaffRoleFavicon } from "./ui";
import { timeAgo } from "@/lib/format";

export function ChatDrawer({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const { user, users, messages, sendMessage, markThreadRead } = useApp();
  const [text, setText] = useState("");
  const person = users.find((u) => u.id === userId);
  const drawerRef = useRef<HTMLDivElement>(null);

  const thread = useMemo(() => {
    if (!user || !userId) return [];
    return messages
      .filter(
        (m) =>
          (m.senderId === user.id && m.receiverId === userId) ||
          (m.senderId === userId && m.receiverId === user.id),
      )
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  }, [messages, user, userId]);

  useEffect(() => {
    if (userId) {
      void markThreadRead(userId);
    }
    // Only when the open conversation changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Outside click/tap listener to dismiss chat drawer when clicking on side/white area
  useEffect(() => {
    function onPointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null;
      if (drawerRef.current && target && !drawerRef.current.contains(target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [onClose]);

  // Handle ESC key to go back / dismiss
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!userId || !person) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !userId) return;
    await sendMessage(userId, text);
    setText("");
  }

  return (
    <div
      ref={drawerRef}
      className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:bottom-4 sm:right-4 z-[70] flex h-[480px] sm:h-[520px] w-auto sm:w-[380px] max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150"
    >
        <div className="flex items-center justify-between border-b border-zinc-100 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-zinc-50/50">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onClose}
              className="mr-0.5 rounded-lg p-1 text-zinc-500 hover:bg-zinc-200/60 transition cursor-pointer"
              title="Go back"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
            <Avatar user={person} size={34} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs sm:text-sm font-semibold text-zinc-900 truncate">{person.name}</p>
                <StaffRoleFavicon role={person.role} size="xs" />
              </div>
              <p className="text-[11px] text-zinc-500">{person.isOnline ? "Online now" : "Offline"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-3.5 sm:p-4">
          {thread.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-zinc-400">
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs">Say hello to {person.name}!</p>
            </div>
          )}
          {thread.map((m) => {
            const mine = m.senderId === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm ${mine ? "bg-primary text-white" : "bg-zinc-100 text-zinc-800"}`}>
                  <p className="leading-relaxed break-words">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-zinc-400"}`}>{timeAgo(m.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
        <form onSubmit={submit} className="flex gap-2 border-t border-zinc-100 p-2.5 sm:p-3 bg-white">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 rounded-full bg-zinc-100 px-3.5 sm:px-4 py-2 text-base sm:text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary border border-transparent focus:border-zinc-200 shadow-2xs"
          />
          <button type="submit" className="rounded-full bg-primary p-2 text-white hover:bg-primary/90 transition shadow-sm cursor-pointer active:scale-95 shrink-0">
            <Send size={16} />
          </button>
        </form>
      </div>
    );
  }
