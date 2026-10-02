"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Key,
  Lock,
  MessageSquare,
  Pencil,
  Plus,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { AdminClassroom } from "@/components/AdminClassroom";
import { Avatar, Card, Field, Modal, PrimaryButton, UserRoleBadge, inputClass } from "@/components/ui";
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
  const [tab, setTab] = useState<"pending" | "members" | "manager" | "comments" | "sales" | "classroom">("pending");
  const [editor, setEditor] = useState<"create" | PublicUser | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  // Dedicated Manager Setup form state (initial login details empty for later setup)
  const [managerForm, setManagerForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    bio: "",
    location: "",
    status: "approved" as Status,
  });
  const [managerEditingId, setManagerEditingId] = useState<string | null>(null);
  const [managerBusy, setManagerBusy] = useState(false);
  const [managerFeedback, setManagerFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showManagerPassword, setShowManagerPassword] = useState(false);

  const pending = users.filter((u) => u.status === "pending");
  const pendingComments = comments.filter((c) => c.status === "pending");
  const approvedComments = comments.filter((c) => c.status === "approved" || !c.status);
  const members = users;
  const managerUsers = users.filter((u) => u.role === "manager");

  if (user?.role !== "admin" && user?.role !== "manager") {
    return <p className="text-zinc-500">Admin and Manager access only.</p>;
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

  function resetManagerForm() {
    setManagerForm({
      name: "",
      email: "",
      username: "",
      password: "",
      bio: "",
      location: "",
      status: "approved",
    });
    setManagerEditingId(null);
    setManagerFeedback(null);
  }

  function loadManagerIntoForm(mgr: PublicUser) {
    setManagerForm({
      name: mgr.name,
      email: mgr.email || "",
      username: mgr.username,
      password: "",
      bio: mgr.bio,
      location: mgr.location,
      status: mgr.status || "approved",
    });
    setManagerEditingId(mgr.id);
    setManagerFeedback(null);
  }

  async function onSaveManager() {
    setManagerBusy(true);
    setManagerFeedback(null);

    if (
      !managerForm.name.trim() &&
      !managerForm.email.trim() &&
      !managerForm.username.trim() &&
      !managerForm.password.trim()
    ) {
      setManagerBusy(false);
      setManagerFeedback({
        type: "error",
        text: "Please enter the manager's name, email, or credentials to save the account.",
      });
      return;
    }

    if (managerForm.email && !managerForm.email.includes("@")) {
      setManagerBusy(false);
      setManagerFeedback({
        type: "error",
        text: "Please enter a valid email address.",
      });
      return;
    }

    if (managerEditingId) {
      const res = await updateMember({
        userId: managerEditingId,
        name: managerForm.name.trim() || undefined,
        email: managerForm.email.trim() || undefined,
        username: managerForm.username.trim() || undefined,
        password: managerForm.password.trim() || undefined,
        bio: managerForm.bio.trim() || undefined,
        location: managerForm.location.trim() || undefined,
        status: managerForm.status,
        role: "manager",
        isPremium: true,
        language: "English",
      });
      setManagerBusy(false);
      if (res.ok) {
        setManagerFeedback({
          type: "success",
          text: "✓ Manager account updated successfully with full delegated permissions.",
        });
      } else {
        setManagerFeedback({
          type: "error",
          text: res.error || "Failed to update manager account.",
        });
      }
    } else {
      const res = await createMember({
        name: managerForm.name.trim() || "Community Operations Manager",
        email: managerForm.email.trim() || "manager@permanentseo.com",
        username: managerForm.username.trim() || undefined,
        password: managerForm.password.trim() || "manager123456",
        bio: managerForm.bio.trim() || "Community Operations & Moderation Manager",
        location: managerForm.location.trim() || "",
        status: managerForm.status,
        role: "manager",
        isPremium: true,
        language: "English",
      });
      setManagerBusy(false);
      if (res.ok) {
        setManagerFeedback({
          type: "success",
          text: "✓ New Manager account created successfully with full delegated permissions.",
        });
        resetManagerForm();
      } else {
        setManagerFeedback({
          type: "error",
          text: res.error || "Failed to create manager account.",
        });
      }
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Admin & Operations</h1>
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
            { id: "manager", label: `★ Manager Setup ${managerUsers.length > 0 ? `(${managerUsers.length})` : ""}` },
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
                    <td className="capitalize">
                      <div className="flex items-center gap-1.5">
                        <span>{m.role}</span>
                        {m.role === "manager" && (
                          <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-700">★</span>
                        )}
                      </div>
                    </td>
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

      {/* NEW MANAGER SETUP SECTION */}
      {tab === "manager" && (
        <div className="space-y-6">
          {/* Overview & Responsibilities Banner */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-900 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-blue-100 shadow-xs border border-blue-400/40">
                    <span className="text-[10px]">★</span> Manager Role
                  </span>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                    Delegated Operations
                  </span>
                </div>
                <h2 className="text-xl font-bold text-zinc-900 pt-1">
                  Manager Responsibilities & Credentials Setup
                </h2>
                <p className="text-sm text-zinc-600 max-w-3xl">
                  The Manager role gives delegated staff complete operational control across all communities, students, and comment moderation while safeguarding root system privileges.
                </p>
              </div>

              <div className="shrink-0">
                <div className="rounded-xl border border-blue-100 bg-white p-3.5 shadow-xs text-center">
                  <p className="text-xs font-medium text-zinc-500">Active Managers</p>
                  <p className="text-2xl font-black text-blue-900">{managerUsers.length}</p>
                </div>
              </div>
            </div>

            {/* Responsibilities Matrix */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-4 border-t border-blue-100/80">
              <div className="rounded-xl border border-blue-100/60 bg-white/90 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-xs text-blue-900">
                  <UserCheck size={15} className="text-blue-600" />
                  <span>Student & Member Management</span>
                </div>
                <p className="text-xs text-zinc-600">
                  Add, edit, approve, and reject students. Update profiles and release device login locks anytime.
                </p>
              </div>

              <div className="rounded-xl border border-blue-100/60 bg-white/90 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-xs text-blue-900">
                  <MessageSquare size={15} className="text-blue-600" />
                  <span>Comments & Discussion Moderation</span>
                </div>
                <p className="text-xs text-zinc-600">
                  Review, approve, and reject submitted comments across both Classroom lessons and Community posts.
                </p>
              </div>

              <div className="rounded-xl border border-blue-100/60 bg-white/90 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-xs text-blue-900">
                  <Sparkles size={15} className="text-blue-600" />
                  <span>Verified ★ Manager Favicon Badge</span>
                </div>
                <p className="text-xs text-zinc-600">
                  All posts, announcements, replies, and notes automatically show the official verified Manager badge.
                </p>
              </div>

              <div className="rounded-xl border border-blue-100/60 bg-white/90 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-xs text-blue-900">
                  <Users size={15} className="text-blue-600" />
                  <span>Multi-Community Leadership</span>
                </div>
                <p className="text-xs text-zinc-600">
                  Post and oversee discussions across Students Community and Team Members Community.
                </p>
              </div>

              <div className="rounded-xl border border-blue-100/60 bg-white/90 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-xs text-blue-900">
                  <Clock size={15} className="text-blue-600" />
                  <span>Application Review Workflow</span>
                </div>
                <p className="text-xs text-zinc-600">
                  Process applicant questionnaires, contact phones, and country/experience notes.
                </p>
              </div>

              <div className="rounded-xl border border-blue-100/60 bg-white/90 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-xs text-blue-900">
                  <ShieldCheck size={15} className="text-blue-600" />
                  <span>Safeguarded Superuser Scope</span>
                </div>
                <p className="text-xs text-zinc-600">
                  Protected boundaries prevent modifying admin accounts or elevating users to root superadmin.
                </p>
              </div>
            </div>
          </div>

          {/* Dedicated Empty Manager Login Credentials Section */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Key size={18} className="text-blue-600" />
                  <span>{managerEditingId ? "Edit Manager Credentials" : "Manager Login Credentials"}</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Login details are kept empty in this dedicated section so you can configure them whenever you are ready.
                </p>
              </div>

              {managerEditingId && (
                <button
                  onClick={resetManagerForm}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  <RotateCcw size={12} /> Reset to empty form
                </button>
              )}
            </div>

            {/* Info notice about empty state */}
            <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
              <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Setup Notice:</span> Manager credentials are prepped and empty below. You can fill out the email, username, and password fields now or later whenever ready to activate or update manager access.
              </div>
            </div>

            {/* Feedback Alert */}
            {managerFeedback && (
              <div
                className={`mb-4 rounded-xl p-3.5 text-xs flex items-center gap-2 font-medium ${
                  managerFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {managerFeedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{managerFeedback.text}</span>
              </div>
            )}

            {/* Empty Credentials Input Form */}
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Manager Full Name">
                  <input
                    className={inputClass}
                    placeholder="e.g. Community Operations Manager"
                    value={managerForm.name}
                    onChange={(e) => setManagerForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </Field>

                <Field label="Manager Email (Login ID)">
                  <input
                    className={inputClass}
                    type="email"
                    placeholder="e.g. manager@permanentseo.com"
                    value={managerForm.email}
                    onChange={(e) => setManagerForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </Field>

                <Field label="Username (Slug)">
                  <input
                    className={inputClass}
                    placeholder="e.g. community-manager"
                    value={managerForm.username}
                    onChange={(e) => setManagerForm((f) => ({ ...f, username: e.target.value }))}
                  />
                </Field>

                <Field label={managerEditingId ? "New Password (Leave empty to keep existing)" : "Manager Password"}>
                  <div className="relative">
                    <input
                      className={`${inputClass} pr-10`}
                      type={showManagerPassword ? "text" : "password"}
                      placeholder={managerEditingId ? "•••••••• (Leave blank to keep)" : "Set secure manager password (min 8 chars)"}
                      value={managerForm.password}
                      onChange={(e) => setManagerForm((f) => ({ ...f, password: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowManagerPassword(!showManagerPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      tabIndex={-1}
                    >
                      {showManagerPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Field>

                <Field label="Location">
                  <input
                    className={inputClass}
                    placeholder="e.g. New York, USA"
                    value={managerForm.location}
                    onChange={(e) => setManagerForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </Field>

                <Field label="Account Status">
                  <select
                    className={inputClass}
                    value={managerForm.status}
                    onChange={(e) => setManagerForm((f) => ({ ...f, status: e.target.value as Status }))}
                  >
                    <option value="approved">Approved (Active Staff)</option>
                    <option value="pending">Pending</option>
                  </select>
                </Field>
              </div>

              <Field label="Staff Bio / Role Description">
                <textarea
                  className={`${inputClass} min-h-[70px]`}
                  placeholder="e.g. Community manager and student success lead assisting students and moderating community submissions."
                  value={managerForm.bio}
                  onChange={(e) => setManagerForm((f) => ({ ...f, bio: e.target.value }))}
                />
              </Field>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Shield size={14} className="text-blue-600" />
                  <span>Role is automatically locked to <strong className="text-zinc-800">★ Manager</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetManagerForm}
                    className="rounded-lg px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition"
                  >
                    Clear Form
                  </button>
                  <PrimaryButton
                    disabled={managerBusy}
                    onClick={onSaveManager}
                    className="gap-1.5 text-xs py-2 bg-blue-900 hover:bg-blue-800 ring-blue-900"
                  >
                    <Check size={14} />
                    {managerBusy
                      ? "Saving..."
                      : managerEditingId
                        ? "Save Changes to Manager"
                        : "Save / Configure Manager Account"}
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </Card>

          {/* Active Configured Managers List */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <span>Current Active Managers</span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                    {managerUsers.length}
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Accounts configured with delegated management access.
                </p>
              </div>
            </div>

            {managerUsers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center">
                <Shield size={28} className="mx-auto text-zinc-300 mb-2" />
                <p className="text-sm font-medium text-zinc-700">No Manager Accounts Configured Yet</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Fill in the empty credentials form above whenever you are ready to create your manager account.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {managerUsers.map((mgr) => (
                  <div
                    key={mgr.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs hover:border-blue-200 transition"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <Avatar user={mgr} size={42} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-zinc-900">{mgr.name}</span>
                          <UserRoleBadge role="manager" size="xs" />
                          <span className="text-xs text-zinc-400 font-mono">@{mgr.username}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{mgr.email || "No email provided"}</p>
                        {mgr.bio && <p className="text-xs text-zinc-700 mt-1 line-clamp-1">{mgr.bio}</p>}
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-400">
                          <span>Joined {timeAgo(mgr.joinedAt)}</span>
                          <span>•</span>
                          <span>Device: {mgr.hasActiveSession ? "Logged in" : "Free"}</span>
                          <span>•</span>
                          <span>IP: {mgr.ipAddress || "127.0.0.1"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => loadManagerIntoForm(mgr)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
                      >
                        <Pencil size={12} /> Edit Details
                      </button>
                      <button
                        onClick={async () => {
                          const res = await updateMember({
                            userId: mgr.id,
                            role: "member",
                          });
                          if (res.ok) {
                            setManagerFeedback({
                              type: "success",
                              text: `Demoted ${mgr.name} to member.`,
                            });
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 hover:text-red-600 hover:bg-red-50 transition"
                        title="Demote to Member"
                      >
                        Demote
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  Comments written by members must be approved by an admin or manager before they become visible to the community.
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
                            <UserRoleBadge role={author?.role} size="xs" />
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
                <option value="manager">★ Manager (Staff)</option>
                <option value="admin">Admin (Superuser)</option>
                <option value="student">Student</option>
                <option value="team_member">Team Member</option>
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
