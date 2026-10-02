"use client";

import { useState } from "react";
import { Check, Clock, MessageSquare, Pencil, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { AdminClassroom } from "@/components/AdminClassroom";
import { Avatar, Card, Field, Modal, PrimaryButton, inputClass } from "@/components/ui";
import { formatMoney, timeAgo } from "@/lib/format";
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

export default function AdminPage() {
  const {
    user,
    users,
    posts,
    comments,
    stats,
    sales,
    approveUser,
    rejectUser,
    createMember,
    updateMember,
    releaseMemberLogin,
    approveComment,
    rejectComment,
    deleteComment,
  } = useApp();
  const [tab, setTab] = useState<"pending" | "members" | "comments" | "sales" | "classroom">("pending");
  const [editor, setEditor] = useState<"create" | PublicUser | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const pending = users.filter((u) => u.status === "pending");
  const pendingComments = comments.filter((c) => c.status === "pending");
  const approvedComments = comments.filter((c) => c.status === "approved" || !c.status);
  const members = users;

  if (user?.role !== "admin") {
    return <p className="text-zinc-500">Admin access only.</p>;
  }

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

  async function onReleaseLogin() {
    if (!editor || editor === "create") return;
    setBusy(true);
    const result = await releaseMemberLogin(editor.id);
    setBusy(false);
    setMessage(result.ok ? "This member can now log in from a new device." : result.error || "Could not release login.");
    if (result.ok) {
      setEditor({ ...editor, hasActiveSession: false });
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-sm text-zinc-500">Total users, sales, and logins are visible only here and on your sidebar.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total users" value={String(stats?.totalUsers ?? 0)} />
        <StatCard label="Total sales" value={formatMoney(stats?.totalSales ?? 0)} />
        <StatCard label="Pending applications" value={String(stats?.pendingCount ?? pending.length)} />
        <StatCard label="Pending comments" value={String(pendingComments.length)} />
      </div>
      <div className="flex gap-2 flex-wrap">
        {(
          [
            { id: "pending", label: `Pending Apps (${pending.length})` },
            { id: "members", label: "Members" },
            { id: "comments", label: `Comments Moderation ${pendingComments.length > 0 ? `(${pendingComments.length})` : ""}` },
            { id: "sales", label: "Sales" },
            { id: "classroom", label: "Classroom" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              tab === t.id
                ? "bg-zinc-900 text-white shadow-sm"
                : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pending" && (
        <Card>
          {pending.length === 0 && <p className="p-6 text-sm text-zinc-500">No pending applications.</p>}
          {pending.map((u) => (
            <div key={u.id} className="border-b border-zinc-100 p-5 last:border-0">
              <div className="flex items-start gap-3">
                <Avatar user={u} size={44} />
                <div className="flex-1">
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-sm text-zinc-500">{u.email}</p>
                  {u.application ? (
                    <dl className="mt-3 grid gap-1 text-sm text-zinc-700 sm:grid-cols-2">
                      <p><span className="text-zinc-400">Phone:</span> {u.application.phone}</p>
                      <p><span className="text-zinc-400">Location:</span> {u.application.city}, {u.application.country}</p>
                      <p className="sm:col-span-2"><span className="text-zinc-400">Goals:</span> {u.application.goals}</p>
                      {(u.application.notes || u.notes) && (
                        <p className="sm:col-span-2"><span className="text-zinc-400">About themselves:</span> {u.application.notes || u.notes}</p>
                      )}
                    </dl>
                  ) : (
                    <div className="mt-2 space-y-1 text-sm">
                      {(u.phone || u.notes) && (
                        <dl className="grid gap-1 text-zinc-700">
                          {u.phone && <p><span className="text-zinc-400">Phone:</span> {u.phone}</p>}
                          {u.notes && <p><span className="text-zinc-400">About themselves:</span> {u.notes}</p>}
                        </dl>
                      )}
                      <p className="text-amber-700">Registered, application form not submitted yet.</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <PrimaryButton onClick={() => approveUser(u.id)}>Approve</PrimaryButton>
                  <button onClick={() => rejectUser(u.id)} className="rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                    Reject
                  </button>
                  <button onClick={() => openEdit(u)} className="rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab === "members" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <PrimaryButton onClick={openCreate} className="gap-1">
              <Plus size={16} /> Add member
            </PrimaryButton>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>IP Address</th>
                  <th>Device</th>
                  <th>Logins</th>
                  <th>Points</th>
                  <th>Joined</th>
                  <th className="pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-t border-zinc-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar user={m} size={28} />
                        <div>
                          <p className="font-medium">{m.name}</p>
                          <p className="text-xs text-zinc-400">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="capitalize">{m.status}</td>
                    <td className="capitalize">{m.role}</td>
                    <td>
                      <span className="font-mono text-xs text-zinc-600">{m.ipAddress || "127.0.0.1"}</span>
                    </td>
                    <td>{m.hasActiveSession ? "Logged in" : "Free"}</td>
                    <td>{m.loginCount ?? "—"}</td>
                    <td>{m.points}</td>
                    <td>{timeAgo(m.joinedAt)}</td>
                    <td className="pr-4 text-right">
                      <button
                        onClick={() => openEdit(m)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === "comments" && (
        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <span>Pending Comments</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${pendingComments.length > 0 ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-600"}`}>
                    {pendingComments.length}
                  </span>
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Comments written by members must be approved by an admin before they become visible to the community.
                </p>
              </div>
            </div>

            {pendingComments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center">
                <Check size={28} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-medium text-zinc-800">All caught up!</p>
                <p className="text-xs text-zinc-500 mt-1">There are no pending comments awaiting approval right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingComments.map((c) => {
                  const author = users.find((u) => u.id === c.authorId);
                  const post = posts.find((p) => p.id === c.postId);
                  return (
                    <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <Avatar user={author} size={38} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-zinc-900">{author?.name || "Member"}</span>
                            <span className="text-xs text-zinc-500">({author?.email})</span>
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 flex items-center gap-1">
                              <Clock size={10} /> {timeAgo(c.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            on post: <span className="font-medium text-zinc-700">&ldquo;{post?.title || "Community Post"}&rdquo;</span>
                          </p>
                          <div className="mt-2 rounded-lg bg-white p-3 text-sm text-zinc-800 shadow-sm border border-amber-100/60 break-words">
                            {c.body}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => approveComment(c.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm transition"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => rejectComment(c.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-200 transition"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-bold text-zinc-900 mb-1">Approved Comments History</h2>
            <p className="text-xs text-zinc-500 mb-4">All currently published comments in the community.</p>

            {approvedComments.length === 0 ? (
              <p className="text-sm text-zinc-500">No approved comments yet.</p>
            ) : (
              <div className="divide-y divide-zinc-100 max-h-[400px] overflow-y-auto pr-1">
                {approvedComments.map((c) => {
                  const author = users.find((u) => u.id === c.authorId);
                  const post = posts.find((p) => p.id === c.postId);
                  return (
                    <div key={c.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <Avatar user={author} size={30} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-zinc-800">{author?.name}</span>
                            <span className="text-[11px] text-zinc-400">{timeAgo(c.createdAt)}</span>
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                              Approved
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 truncate">
                            Post: &ldquo;{post?.title || "Community Post"}&rdquo;
                          </p>
                          <p className="text-xs text-zinc-700 mt-1 bg-zinc-50 p-2 rounded-lg break-words">
                            {c.body}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteComment(c.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 rounded-md hover:bg-zinc-100 transition"
                        title="Delete comment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "sales" && (
        <Card>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-zinc-400">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th>Member</th>
                <th>Plan</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {[...sales].reverse().map((s) => {
                const member = users.find((u) => u.id === s.userId);
                return (
                  <tr key={s.id} className="border-t border-zinc-100">
                    <td className="px-4 py-3">{new Date(s.createdAt).toLocaleString()}</td>
                    <td>{member?.name}</td>
                    <td>{s.plan}</td>
                    <td>{formatMoney(s.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "classroom" && <AdminClassroom />}

      <Modal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        title={editor === "create" ? "Add member" : "Edit member"}
        wide
      >
        <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Full name">
              <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Email">
              <input className={inputClass} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </Field>
            <Field label="Username">
              <input className={inputClass} placeholder="Auto-generated if empty" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
            </Field>
            <Field label={editor === "create" ? "Password" : "New password (optional)"}>
              <input className={inputClass} type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            </Field>
            <Field label="Status">
              <select className={inputClass} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </Field>
            <Field label="Role">
              <select className={inputClass} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Location">
              <input className={inputClass} value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </Field>
            <Field label="Language">
              <select className={inputClass} value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}>
                {["English", "Arabic", "Spanish", "French"].map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Bio">
            <textarea className={`${inputClass} min-h-[80px]`} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={form.isPremium}
              onChange={(e) => setForm((f) => ({ ...f, isPremium: e.target.checked }))}
            />
            Premium member
          </label>
          {editor && editor !== "create" && (
            <div className="space-y-1 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              <div>
                Device login: {editor.hasActiveSession ? "this member is logged in on one device." : "no active device session."}
              </div>
              <div>
                Tracked IP: <span className="font-mono font-medium text-zinc-800">{editor.ipAddress || "127.0.0.1"}</span>
              </div>
            </div>
          )}
          {message && <p className="text-sm text-primary">{message}</p>}
          <div className="flex flex-wrap gap-2">
            <PrimaryButton disabled={busy} onClick={onSave}>
              {busy ? "Saving..." : editor === "create" ? "Add member" : "Save changes"}
            </PrimaryButton>
            {editor && editor !== "create" && editor.hasActiveSession && (
              <button
                disabled={busy}
                onClick={onReleaseLogin}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
              >
                Release device login
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </Card>
  );
}
