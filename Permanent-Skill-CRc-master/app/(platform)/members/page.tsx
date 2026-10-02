"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Search } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, Card, GoldButton, Modal, inputClass } from "@/components/ui";
import { ChatDrawer } from "@/components/ChatDrawer";
import { timeAgo } from "@/lib/format";

export default function MembersPage() {
  const { users, user, inviteMember } = useApp();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"members" | "admins" | "online">("members");
  const [chatId, setChatId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState("");

  const visible = users.filter((u) => u.role === "admin" || u.status === "approved" || typeof u.status === "undefined");
  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    return visible
      .filter((u) => {
        if (tab === "admins") return u.role === "admin";
        if (tab === "online") return u.isOnline;
        return true;
      })
      .filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.username.toLowerCase().includes(query) ||
          u.bio.toLowerCase().includes(query),
      );
  }, [visible, q, tab]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Tab label={`Members ${visible.length}`} active={tab === "members"} onClick={() => setTab("members")} />
          <Tab label={`Admins ${visible.filter((u) => u.role === "admin").length}`} active={tab === "admins"} onClick={() => setTab("admins")} />
          <Tab label={`Online ${visible.filter((u) => u.isOnline).length}`} active={tab === "online"} onClick={() => setTab("online")} />
          <GoldButton className="ml-auto" onClick={() => setInviteOpen(true)}>
            INVITE
          </GoldButton>
        </div>
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members" className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none" />
        </div>
        <Card>
          {filtered.map((m, i) => (
            <div key={m.id} className={`flex items-start gap-3 px-4 py-4 ${i ? "border-t border-zinc-100" : ""}`}>
              <Avatar user={m} size={48} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{m.name}</p>
                <p className="text-xs text-zinc-400">@{m.username}</p>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{m.bio}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  {m.isOnline ? <span className="text-emerald-600">● Online now</span> : "Offline"} · Joined{" "}
                  {new Date(m.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {m.location ? ` · ${m.location}` : ""}
                </p>
              </div>
              {m.id !== user?.id && (
                <button
                  onClick={() => setChatId(m.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold tracking-wide text-zinc-600 hover:bg-zinc-50"
                >
                  CHAT <MessageCircle size={14} />
                </button>
              )}
            </div>
          ))}
        </Card>
      </div>
      <Sidebar />
      <ChatDrawer userId={chatId} onClose={() => setChatId(null)} />
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite a member">
        <p className="mb-3 text-sm text-zinc-600">They will create an account, submit an application, and wait for admin approval.</p>
        <input className={inputClass} placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button
          className="mt-3 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white"
          onClick={async () => {
            await inviteMember(email);
            const link = `${window.location.origin}/register?ref=${user?.affiliateCode || ""}`;
            await navigator.clipboard.writeText(link);
            setCopied("Invite link copied.");
          }}
        >
          Copy invite link
        </button>
        {copied && <p className="mt-2 text-sm text-emerald-600">{copied}</p>}
        <p className="mt-2 text-xs text-zinc-400">Last activity note {timeAgo(new Date().toISOString())}</p>
      </Modal>
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-full px-3 py-1.5 text-sm ${active ? "bg-zinc-800 text-white" : "bg-white ring-1 ring-zinc-200"}`}>
      {label}
    </button>
  );
}
