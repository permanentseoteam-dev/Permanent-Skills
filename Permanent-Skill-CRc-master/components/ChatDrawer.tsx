"use client";

import { useEffect, useMemo, useState } from "react";
import { Send, X } from "lucide-react";
import { useApp } from "./AppProvider";
import { Avatar } from "./ui";
import { timeAgo } from "@/lib/format";

export function ChatDrawer({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const { user, users, messages, sendMessage, markThreadRead } = useApp();
  const [text, setText] = useState("");
  const person = users.find((u) => u.id === userId);

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

  if (!userId || !person) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !userId) return;
    await sendMessage(userId, text);
    setText("");
  }

  return (
    <div className="fixed bottom-4 right-4 z-[70] flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Avatar user={person} size={36} />
          <div>
            <p className="text-sm font-semibold">{person.name}</p>
            <p className="text-xs text-zinc-500">{person.isOnline ? "Online now" : "Offline"}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1 hover:bg-zinc-100">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {thread.map((m) => {
          const mine = m.senderId === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-white" : "bg-zinc-100 text-zinc-800"}`}>
                <p>{m.body}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-zinc-400"}`}>{timeAgo(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-zinc-100 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 rounded-full bg-zinc-100 px-4 py-2 text-sm outline-none"
        />
        <button type="submit" className="rounded-full bg-primary p-2 text-white">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
