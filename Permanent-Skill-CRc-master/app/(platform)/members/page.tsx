"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Pencil, Plus, Search, UserPlus } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, Card, Field, GoldButton, Modal, PrimaryButton, inputClass } from "@/components/ui";
import { ChatDrawer } from "@/components/ChatDrawer";
import { timeAgo } from "@/lib/format";
import type { PublicUser, Role, Status } from "@/lib/types";

type MemberForm = {
  name: string;
  email: string;
  username: string;
  password: string;
  bio: string;
  location: string;
  status: Status;
  role: Role;
  isPremium: boolean;
  language: string;
};

const emptyForm: MemberForm = {
  name: "",
  email: "",
  username: "",
  password: "",
  bio: "",
  location: "",
  status: "approved",
  role: "member",
  isPremium: false,
  language: "English",
};

export default function MembersPage() {
  const { users, user, inviteMember, createMember, updateMember } = useApp();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"members" | "admins" | "managers" | "online">("members");
  const [chatId, setChatId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState("");

  const [editor, setEditor] = useState<"create" | PublicUser | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const isStaff = user?.role === "admin" || user?.role === "manager";
  const visible = users.filter((u) => u.role === "admin" || u.role === "manager" || u.status === "approved" || typeof u.status === "undefined");

  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    return visible
      .filter((u) => {
        if (tab === "admins") return u.role === "admin";
        if (tab === "managers") return u.role === "manager";
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

  function openCreate() {
    setForm(emptyForm);
    setMessage("");
    setEditor("create");
  }

  function openEdit(member: PublicUser) {
    setForm({
      name: member.name,
      email: member.email || "",
      username: member.username,
      password: "",
      bio: member.bio,
      location: member.location,
      status: member.status || "approved",
      role: member.role,
      isPremium: member.isPremium,
      language: member.language || "English",
    });
    setMessage("");
    setEditor(member);
  }

  async function onSave() {
    setBusy(true);
    setMessage("");
    const result =
      editor === "create"
        ? await createMember({
            ...form,
            username: form.username || undefined,
            password: form.password,
          })
        : editor
          ? await updateMember({
              userId: editor.id,
              ...form,
              password: form.password || undefined,
            })
          : { ok: false, error: "Nothing to save." };
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error || "Could not save member.");
      return;
    }
    setEditor(null);
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Tab label={`Members ${visible.length}`} active={tab === "members"} onClick={() => setTab("members")} />
          <Tab label={`Admins ${visible.filter((u) => u.role === "admin").length}`} active={tab === "admins"} onClick={() => setTab("admins")} />
          <Tab label={`Managers ${visible.filter((u) => u.role === "manager").length}`} active={tab === "managers"} onClick={() => setTab("managers")} />
          <Tab label={`Online ${visible.filter((u) => u.isOnline).length}`} active={tab === "online"} onClick={() => setTab("online")} />
          <div className="ml-auto flex items-center gap-2">
            {isStaff && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-black transition"
              >
                <Plus size={14} /> Add Student / Member
              </button>
            )}
            <GoldButton onClick={() => setInviteOpen(true)}>
              INVITE
            </GoldButton>
          </div>
        </div>

        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search students and members..."
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-zinc-900"
          />
        </div>

        <Card>
          {filtered.map((m, i) => (
            <div key={m.id} className={`flex items-start gap-3 px-4 py-4 ${i ? "border-t border-zinc-100" : ""}`}>
              <Avatar user={m} size={48} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{m.name}</p>
                  {m.role === "admin" && (
                    <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                      Admin
                    </span>
                  )}
                  {m.role === "manager" && (
                    <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                      Manager
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">@{m.username}</p>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{m.bio}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  {m.isOnline ? <span className="text-emerald-600">● Online now</span> : "Offline"} · Joined{" "}
                  {new Date(m.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {m.location ? ` · ${m.location}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isStaff && (
                  <button
                    onClick={() => openEdit(m)}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs"
                    title="Edit Student / Member"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                )}
                {m.id !== user?.id && (
                  <button
                    onClick={() => setChatId(m.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold tracking-wide text-zinc-600 hover:bg-zinc-50"
                  >
                    CHAT <MessageCircle size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Sidebar />
      <ChatDrawer userId={chatId} onClose={() => setChatId(null)} />

      {/* Invite Modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite a member">
        <p className="mb-3 text-sm text-zinc-600">They will create an account, submit an application, and wait for admin/manager approval.</p>
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

      {/* Create / Edit Student / Member Modal */}
      <Modal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        title={editor === "create" ? "Add Student / Member" : `Edit ${typeof editor === "object" && editor ? editor.name : "Member"}`}
      >
        <div className="space-y-3">
          {message && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{message}</p>}
          <Field label="Full name">
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <input className={inputClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Username">
            <input className={inputClass} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </Field>
          <Field label={editor === "create" ? "Password" : "New password (leave blank to keep)"}>
            <input className={inputClass} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="Bio">
            <textarea className={inputClass} rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location">
              <input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Field>
            <Field label="Role">
              <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                <option value="member">Student / Member</option>
                <option value="team_member">Team Member</option>
                <option value="manager">Manager</option>
                {user?.role === "admin" && <option value="admin">Admin</option>}
              </select>
            </Field>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={() => setEditor(null)} className="rounded-lg px-3 py-2 text-sm text-zinc-500 hover:text-zinc-800">
              Cancel
            </button>
            <PrimaryButton disabled={busy} onClick={onSave}>
              {busy ? "Saving..." : "Save Member"}
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${active ? "bg-zinc-900 text-white shadow-xs" : "bg-white ring-1 ring-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}>
      {label}
    </button>
  );
}
