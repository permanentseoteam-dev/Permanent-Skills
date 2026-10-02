"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Search } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, Card, GoldButton, Modal, UserRoleBadge, inputClass } from "@/components/ui";
import { ChatDrawer } from "@/components/ChatDrawer";
import { timeAgo } from "@/lib/format";
import type { PublicUser } from "@/lib/types";

function PillButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm transition font-medium ${
        active ? "bg-zinc-800 text-white shadow-sm" : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
      }`}
    >
      {label}
    </button>
  );
}

export default function MembersPage() {
  const { users, user, inviteMember } = useApp();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"members" | "admins" | "managers" | "online">("members");
  const [chatUserId, setChatUserId] = useState<string | null>(null);

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  const approvedUsers = users.filter(
    (u) =>
      u.role === "admin" ||
      u.role === "manager" ||
      u.status === "approved" ||
      typeof u.status === "undefined"
  );

  const filtered = useMemo(() => {
    const search = q.toLowerCase().trim();
    return approvedUsers
      .filter((u) => {
        if (tab === "admins") return u.role === "admin";
        if (tab === "managers") return u.role === "manager";
        if (tab === "online") return u.isOnline;
        return true;
      })
      .filter(
        (u) =>
          u.name.toLowerCase().includes(search) ||
          u.username.toLowerCase().includes(search) ||
          Boolean(u.bio?.toLowerCase().includes(search))
      );
  }, [approvedUsers, q, tab]);

  const adminsCount = approvedUsers.filter((u) => u.role === "admin").length;
  const managersCount = approvedUsers.filter((u) => u.role === "manager").length;
  const onlineCount = approvedUsers.filter((u) => u.isOnline).length;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1">
        {/* Pills row */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <PillButton
            label={`Members ${approvedUsers.length}`}
            active={tab === "members"}
            onClick={() => setTab("members")}
          />
          <PillButton
            label={`Admins ${adminsCount}`}
            active={tab === "admins"}
            onClick={() => setTab("admins")}
          />
          {managersCount > 0 && (
            <PillButton
              label={`Managers ${managersCount}`}
              active={tab === "managers"}
              onClick={() => setTab("managers")}
            />
          )}
          <PillButton
            label={`Online ${onlineCount}`}
            active={tab === "online"}
            onClick={() => setTab("online")}
          />
          <GoldButton className="ml-auto" onClick={() => setInviteOpen(true)}>
            INVITE
          </GoldButton>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search members"
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Member list Card */}
        <Card>
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-zinc-500">No members found.</p>
          ) : (
            filtered.map((m, idx) => (
              <div
                key={m.id}
                className={`flex items-start gap-3 px-4 py-4 ${idx > 0 ? "border-t border-zinc-100" : ""}`}
              >
                <Avatar user={m} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-zinc-900">{m.name}</p>
                    <UserRoleBadge role={m.role} size="xs" />
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">@{m.username}</p>
                  {m.bio && <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{m.bio}</p>}
                  <p className="mt-2 text-xs text-zinc-500">
                    {m.isOnline ? (
                      <span className="text-emerald-600 font-medium">● Online now</span>
                    ) : (
                      "Offline"
                    )}
                    {" · Joined "}
                    {new Date(m.joinedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {m.location ? ` · ${m.location}` : ""}
                  </p>
                </div>
                {m.id !== user?.id && (
                  <button
                    onClick={() => setChatUserId(m.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold tracking-wide text-zinc-600 hover:bg-zinc-50 transition"
                  >
                    CHAT <MessageCircle size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </Card>
      </div>

      <Sidebar />
      <ChatDrawer userId={chatUserId} onClose={() => setChatUserId(null)} />

      {/* Invite Modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite a member">
        <p className="mb-3 text-sm text-zinc-600">
          They will create an account, submit an application, and wait for admin approval.
        </p>
        <input
          className={inputClass}
          placeholder="Email address"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
        />
        <button
          className="mt-3 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
          onClick={async () => {
            if (!inviteEmail.trim()) return;
            await inviteMember(inviteEmail);
            const link = `${window.location.origin}/register?ref=${user?.affiliateCode || ""}`;
            try {
              await navigator.clipboard.writeText(link);
              setInviteMessage("Invite link copied to clipboard.");
            } catch {
              setInviteMessage(`Share this link: ${link}`);
            }
          }}
        >
          Copy invite link
        </button>
        {inviteMessage && <p className="mt-2 text-sm text-emerald-600">{inviteMessage}</p>}
        <p className="mt-2 text-xs text-zinc-400">
          Last activity note {timeAgo(new Date().toISOString())}
        </p>
      </Modal>
    </div>
  );
}
