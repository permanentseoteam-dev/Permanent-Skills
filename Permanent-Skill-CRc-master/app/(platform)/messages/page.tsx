"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Avatar, Card } from "@/components/ui";
import { ChatDrawer } from "@/components/ChatDrawer";
import { timeAgo } from "@/lib/format";

export default function MessagesPage() {
  const { user, users, messages } = useApp();
  const [active, setActive] = useState<string | null>(null);

  const threads = useMemo(() => {
    if (!user) return [];
    const map = new Map<string, (typeof messages)[number]>();
    for (const m of [...messages].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))) {
      const other = m.senderId === user.id ? m.receiverId : m.senderId;
      if (!map.has(other)) map.set(other, m);
    }
    return [...map.entries()];
  }, [messages, user]);

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="overflow-hidden">
        <h1 className="border-b border-zinc-100 px-4 py-3 font-semibold">Messages</h1>
        {threads.length === 0 && <p className="p-6 text-sm text-zinc-500">No conversations yet. Chat a member to start.</p>}
        {threads.map(([id, last]) => {
          const person = users.find((u) => u.id === id);
          const unread = messages.some((m) => m.senderId === id && m.receiverId === user?.id && !m.read);
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50 ${active === id ? "bg-primary/5" : ""}`}
            >
              <Avatar user={person} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{person?.name}</p>
                  <span className="text-xs text-zinc-400">{timeAgo(last.createdAt)}</span>
                </div>
                <p className="truncate text-sm text-zinc-500">{last.body}</p>
              </div>
              {unread && <span className="mt-2 h-2 w-2 rounded-full bg-primary" />}
            </button>
          );
        })}
      </Card>
      <Card className="flex min-h-[520px] items-center justify-center p-6 text-sm text-zinc-500">
        {active ? "Conversation opened in the chat drawer →" : "Select a conversation"}
      </Card>
      <ChatDrawer userId={active} onClose={() => setActive(null)} />
    </div>
  );
}
