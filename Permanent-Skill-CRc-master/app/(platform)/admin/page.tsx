"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  DollarSign,
  Eye,
  EyeOff,
  Globe,
  Key,
  Layers,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { AdminClassroom } from "@/components/AdminClassroom";
import {
  Avatar,
  Card,
  Field,
  Modal,
  PrimaryButton,
  UserRoleBadge,
  inputClass,
} from "@/components/ui";
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

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Arabic",
  "Hindi",
  "Portuguese",
  "Japanese",
  "Chinese",
  "Russian",
  "Other",
];

type AdminTab = "pending" | "members" | "manager" | "comments" | "sales" | "classroom";

export default function AdminPage() {
  const {
    user,
    users,
    posts,
    comments,
    stats,
    sales,
    courses,
    approveUser,
    rejectUser,
    createMember,
    updateMember,
    releaseMemberLogin,
    approveComment,
    rejectComment,
    deleteComment,
  } = useApp();

  const [tab, setTab] = useState<AdminTab>("pending");
  const [editor, setEditor] = useState<"create" | PublicUser | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Search and filter states
  const [pendingSearch, setPendingSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState<string>("all");
  const [memberStatusFilter, setMemberStatusFilter] = useState<string>("all");
  const [commentsSearch, setCommentsSearch] = useState("");

  // Dedicated Manager Setup form state
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

  const isStaff = user?.role === "admin" || user?.role === "manager";
  const isAdmin = user?.role === "admin";

  // Data pools
  const pending = useMemo(() => users.filter((u) => u.status === "pending"), [users]);
  const pendingComments = useMemo(() => comments.filter((c) => c.status === "pending"), [comments]);
  const approvedComments = useMemo(() => comments.filter((c) => c.status === "approved" || !c.status), [comments]);
  const managerUsers = useMemo(() => users.filter((u) => u.role === "manager"), [users]);

  // Total sales calculation
  const totalSalesRevenue = useMemo(() => {
    return sales.reduce((sum, s) => sum + (s.amount || 0), 0);
  }, [sales]);

  // Filtered Pending Applicants
  const filteredPending = useMemo(() => {
    if (!pendingSearch.trim()) return pending;
    const q = pendingSearch.trim().toLowerCase();
    return pending.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.application?.profession?.toLowerCase().includes(q) ||
        u.application?.city?.toLowerCase().includes(q)
    );
  }, [pending, pendingSearch]);

  // Filtered Members Table
  const filteredMembers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (memberRoleFilter !== "all" && u.role !== memberRoleFilter) return false;
      // Status filter
      if (memberStatusFilter !== "all" && u.status !== memberStatusFilter) return false;
      // Search query
      if (memberSearch.trim()) {
        const q = memberSearch.trim().toLowerCase();
        const nameMatch = u.name.toLowerCase().includes(q);
        const emailMatch = u.email?.toLowerCase().includes(q);
        const userMatch = u.username.toLowerCase().includes(q);
        const ipMatch = u.ipAddress?.includes(q);
        return nameMatch || emailMatch || userMatch || ipMatch;
      }
      return true;
    });
  }, [users, memberRoleFilter, memberStatusFilter, memberSearch]);

  // Filtered Approved Comments
  const filteredApprovedComments = useMemo(() => {
    if (!commentsSearch.trim()) return approvedComments;
    const q = commentsSearch.trim().toLowerCase();
    return approvedComments.filter((c) => {
      const author = users.find((u) => u.id === c.authorId);
      const post = posts.find((p) => p.id === c.postId);
      return (
        c.body.toLowerCase().includes(q) ||
        author?.name.toLowerCase().includes(q) ||
        post?.title.toLowerCase().includes(q)
      );
    });
  }, [approvedComments, commentsSearch, users, posts]);

  if (!isStaff) {
    return (
      <div className="mx-auto max-w-xl text-center p-12 bg-white rounded-2xl border border-zinc-200">
        <ShieldAlert size={36} className="mx-auto text-amber-500 mb-3" />
        <h2 className="text-lg font-bold text-zinc-900">Access Restricted</h2>
        <p className="mt-1 text-xs text-zinc-500">
          This section is exclusively available for community administrators and verified operations managers.
        </p>
        <Link href="/community" className="mt-4 inline-block text-xs font-bold text-primary hover:underline">
          ← Return to Community Feed
        </Link>
      </div>
    );
  }

  function openCreate() {
    setForm(emptyForm);
    setMessage(null);
    setShowPassword(false);
    setEditor("create");
  }

  function openEdit(member: PublicUser) {
    setForm({
      name: member.name,
      email: member.email || "",
      username: member.username,
      password: "",
      bio: member.bio || "",
      location: member.location || "",
      status: member.status || "approved",
      role: member.role,
      isPremium: Boolean(member.isPremium),
      language: member.language || "English",
    });
    setMessage(null);
    setShowPassword(false);
    setEditor(member);
  }

  async function onSave() {
    if (!form.name.trim()) {
      setMessage({ type: "error", text: "Full name is required." });
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      setMessage({ type: "error", text: "A valid email address is required." });
      return;
    }
    if (editor === "create" && (!form.password || form.password.length < 8)) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }

    setBusy(true);
    setMessage(null);
    const result =
      editor === "create"
        ? await createMember({
            ...form,
            name: form.name.trim(),
            email: form.email.trim(),
            username: form.username.trim() || undefined,
            password: form.password,
          })
        : editor
          ? await updateMember({
              userId: editor.id,
              ...form,
              name: form.name.trim(),
              email: form.email.trim(),
              username: form.username.trim() || editor.username,
              password: form.password || undefined,
            })
          : { ok: false, error: "Nothing to save." };

    setBusy(false);
    if (!result.ok) {
      setMessage({ type: "error", text: result.error || "Could not save member." });
      return;
    }
    setEditor(null);
  }

  async function onReleaseLogin(userId: string) {
    setBusy(true);
    const result = await releaseMemberLogin(userId);
    setBusy(false);
    if (result.ok) {
      setMessage({ type: "success", text: "✓ Active device session released. Member can now log in." });
      if (editor && editor !== "create") {
        setEditor({ ...editor, hasActiveSession: false });
      }
    } else {
      setMessage({ type: "error", text: result.error || "Could not release login session." });
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
      bio: mgr.bio || "",
      location: mgr.location || "",
      status: mgr.status || "approved",
    });
    setManagerEditingId(mgr.id);
    setManagerFeedback(null);
  }

  async function onSaveManager() {
    if (!managerForm.name.trim() && !managerForm.email.trim() && !managerForm.password.trim()) {
      setManagerFeedback({
        type: "error",
        text: "Please enter the manager's name, email, and password.",
      });
      return;
    }

    if (managerForm.email && !managerForm.email.includes("@")) {
      setManagerFeedback({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    setManagerBusy(true);
    setManagerFeedback(null);

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
      });
      setManagerBusy(false);
      if (res.ok) {
        setManagerFeedback({
          type: "success",
          text: "✓ Manager account credentials and role updated successfully.",
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
          text: "✓ New Manager account configured successfully with delegated access.",
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
    <div className="space-y-6">
      {/* SECTION 1: HEADER & KPI STATS STRIP */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Admin & Operations Hub</h1>
            <span className="rounded-md bg-zinc-900 text-white px-2 py-0.5 text-[10px] font-black uppercase">
              {isAdmin ? "Superuser Access" : "Manager Portal"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            Real-time management for applicant approvals, members directory, delegated staff, comment moderation, sales, and classroom curriculum.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PrimaryButton onClick={openCreate} className="rounded-xl px-4 py-2 text-xs font-bold gap-1.5 shadow-sm">
            <UserPlus size={14} /> Add Member
          </PrimaryButton>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setTab("members")}
          className="text-left cursor-pointer transition hover:scale-[1.02] active:scale-98"
        >
          <Card className="p-4 border-zinc-200 hover:border-zinc-300 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Users</span>
            <p className="mt-1 text-xl font-black text-zinc-900">{stats?.totalUsers ?? users.length}</p>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => setTab("sales")}
          className="text-left cursor-pointer transition hover:scale-[1.02] active:scale-98"
        >
          <Card className="p-4 border-zinc-200 hover:border-zinc-300 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Sales</span>
            <p className="mt-1 text-xl font-black text-emerald-600">{formatMoney(stats?.totalSales ?? totalSalesRevenue)}</p>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => setTab("pending")}
          className="text-left cursor-pointer transition hover:scale-[1.02] active:scale-98"
        >
          <Card className={`p-4 shadow-2xs ${pending.length > 0 ? "border-amber-300 bg-amber-50/40" : "border-zinc-200"}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Pending Apps</span>
            <p className="mt-1 text-xl font-black text-amber-700 flex items-center gap-1.5">
              {pending.length}
              {pending.length > 0 && <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />}
            </p>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => setTab("comments")}
          className="text-left cursor-pointer transition hover:scale-[1.02] active:scale-98"
        >
          <Card className={`p-4 shadow-2xs ${pendingComments.length > 0 ? "border-amber-300 bg-amber-50/40" : "border-zinc-200"}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Pending Comments</span>
            <p className="mt-1 text-xl font-black text-primary flex items-center gap-1.5">
              {pendingComments.length}
              {pendingComments.length > 0 && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
            </p>
          </Card>
        </button>
      </div>

      {/* Global Feedback Banner */}
      {message && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-zinc-400 hover:text-zinc-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* SECTION 2: SUBTAB NAVIGATION BAR */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <TabButton
          active={tab === "pending"}
          onClick={() => setTab("pending")}
          label={`Pending Apps (${pending.length})`}
          badgeColor={pending.length > 0 ? "bg-amber-500 text-zinc-950 font-black animate-pulse" : undefined}
        />
        <TabButton
          active={tab === "members"}
          onClick={() => setTab("members")}
          label={`Members Directory (${users.length})`}
        />
        <TabButton
          active={tab === "manager"}
          onClick={() => setTab("manager")}
          label={`★ Manager Setup (${managerUsers.length})`}
          badgeColor="bg-blue-600 text-white"
        />
        <TabButton
          active={tab === "comments"}
          onClick={() => setTab("comments")}
          label={`Comments Moderation (${pendingComments.length})`}
          badgeColor={pendingComments.length > 0 ? "bg-amber-500 text-zinc-950 font-bold" : undefined}
        />
        <TabButton
          active={tab === "sales"}
          onClick={() => setTab("sales")}
          label={`Sales & Revenue (${sales.length})`}
        />
        <TabButton
          active={tab === "classroom"}
          onClick={() => setTab("classroom")}
          label={`Classroom Curriculum (${courses.length})`}
        />
      </div>

      {/* SECTION 3: SUBTAB 1 - PENDING APPLICATIONS */}
      {tab === "pending" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-zinc-900"
                placeholder="Search applicants by name, email, profession, or city..."
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
              />
            </div>
            <p className="text-xs font-semibold text-zinc-500">
              {filteredPending.length} {filteredPending.length === 1 ? "applicant" : "applicants"} awaiting review
            </p>
          </div>

          <Card className="divide-y divide-zinc-100 overflow-hidden shadow-sm">
            {filteredPending.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
                <h3 className="text-base font-bold text-zinc-900">All Applications Processed</h3>
                <p className="text-xs text-zinc-500 mt-1">There are no pending member applications right now.</p>
              </div>
            ) : (
              filteredPending.map((u) => {
                const app = u.application;

                return (
                  <div key={u.id} className="p-5 transition hover:bg-zinc-50/70 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <Avatar user={u} size={48} className="border-2 border-zinc-200" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-zinc-950">{u.name}</h3>
                            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                              Pending Review
                            </span>
                            {app?.profession && (
                              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">
                                {app.profession}
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500 font-medium">
                            <span className="font-mono text-zinc-700">{u.email}</span>
                            {u.phone && <span>• {u.phone}</span>}
                            <span>• Applied {timeAgo(u.joinedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={async () => {
                            const res = await approveUser(u.id);
                            if (res.ok) setMessage({ type: "success", text: `✓ Approved ${u.name}.` });
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs transition"
                        >
                          <Check size={13} /> Approve Member
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Reject application for ${u.name}?`)) {
                              const res = await rejectUser(u.id);
                              if (res.ok) setMessage({ type: "success", text: `Rejected application for ${u.name}.` });
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/60 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                        >
                          <X size={13} /> Reject
                        </button>
                        <button
                          onClick={() => openEdit(u)}
                          className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      </div>
                    </div>

                    {/* Application Details Grid */}
                    {app ? (
                      <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-700">
                        {app.city && app.country && (
                          <div>
                            <span className="text-zinc-400 font-medium">Location:</span>{" "}
                            <strong>{app.city}, {app.country}</strong>
                          </div>
                        )}
                        {app.experience && (
                          <div>
                            <span className="text-zinc-400 font-medium">Experience:</span>{" "}
                            <strong>{app.experience}</strong>
                          </div>
                        )}
                        {app.website && (
                          <div className="sm:col-span-2 truncate">
                            <span className="text-zinc-400 font-medium">Website / Portfolio:</span>{" "}
                            <a href={app.website.startsWith("http") ? app.website : `https://${app.website}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-mono">
                              {app.website}
                            </a>
                          </div>
                        )}
                        {app.goals && (
                          <div className="sm:col-span-2">
                            <span className="text-zinc-400 font-medium">Primary Goals:</span>{" "}
                            <span>{app.goals}</span>
                          </div>
                        )}
                        {(app.notes || u.notes) && (
                          <div className="sm:col-span-2 pt-1 border-t border-zinc-100">
                            <span className="text-zinc-400 font-medium">Background & Bio:</span>{" "}
                            <span>{app.notes || u.notes}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl bg-amber-50/70 border border-amber-200/70 p-3 text-xs text-amber-800">
                        Registered basic account. Detailed application questionnaire pending submission.
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </Card>
        </div>
      )}

      {/* SECTION 4: SUBTAB 2 - MEMBERS DIRECTORY */}
      {tab === "members" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-zinc-900"
                placeholder="Search by name, email, @username, or IP..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 outline-none"
                value={memberRoleFilter}
                onChange={(e) => setMemberRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="manager">Managers</option>
                <option value="team_member">Team Specialists</option>
                <option value="member">Members</option>
              </select>

              <select
                className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 outline-none"
                value={memberStatusFilter}
                onChange={(e) => setMemberStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <Card className="overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-100 uppercase tracking-wider text-zinc-400 text-[10px]">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Points</th>
                  <th>Device / IP</th>
                  <th>Logins</th>
                  <th>Joined</th>
                  <th className="pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50/70 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar user={m} size={32} />
                        <div className="min-w-0">
                          <Link href={`/profile/${m.id}`} className="font-bold text-zinc-900 hover:text-primary transition truncate block">
                            {m.name}
                          </Link>
                          <span className="text-[11px] text-zinc-400 font-mono">{m.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <UserRoleBadge role={m.role} isPremium={m.isPremium} size="xs" />
                    </td>

                    <td>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          m.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : m.status === "pending"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {m.status || "approved"}
                      </span>
                    </td>

                    <td className="font-bold text-zinc-800">{m.points || 0}</td>

                    <td>
                      <div>
                        <span className={`inline-block rounded px-1.5 py-0.2 text-[10px] font-bold ${
                          m.hasActiveSession ? "bg-blue-50 text-blue-700" : "bg-zinc-100 text-zinc-500"
                        }`}>
                          {m.hasActiveSession ? "● Active Session" : "Free"}
                        </span>
                        <p className="text-[10px] font-mono text-zinc-400 mt-0.5">{m.ipAddress || "127.0.0.1"}</p>
                      </div>
                    </td>

                    <td className="font-semibold text-zinc-600">{m.loginCount ?? "—"}</td>

                    <td className="text-zinc-500">{timeAgo(m.joinedAt)}</td>

                    <td className="pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {m.hasActiveSession && (
                          <button
                            onClick={() => onReleaseLogin(m.id)}
                            className="rounded-lg p-1.5 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 transition"
                            title="Release device login"
                          >
                            <RefreshCw size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(m)}
                          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 border border-zinc-200 transition"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* SECTION 5: SUBTAB 3 - MANAGER SETUP & DELEGATED ROLES */}
      {tab === "manager" && (
        <div className="space-y-6">
          <Card className="p-6 border border-zinc-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                  <Key size={18} className="text-primary" />
                  <span>{managerEditingId ? "Edit Manager Credentials" : "Manager Login Setup"}</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Configure delegated community operations managers to review applications, moderate discussions, and assist students.
                </p>
              </div>

              {managerEditingId && (
                <button
                  onClick={resetManagerForm}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  <RotateCcw size={12} /> Clear to new manager
                </button>
              )}
            </div>

            {managerFeedback && (
              <div
                className={`rounded-xl p-3.5 text-xs flex items-center gap-2 font-medium ${
                  managerFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {managerFeedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{managerFeedback.text}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Manager Full Name *">
                <input
                  className={inputClass}
                  placeholder="e.g. Community Operations Manager"
                  value={managerForm.name}
                  onChange={(e) => setManagerForm((f) => ({ ...f, name: e.target.value }))}
                />
              </Field>

              <Field label="Manager Email (Login ID) *">
                <input
                  className={inputClass}
                  type="email"
                  placeholder="manager@permanentseo.com"
                  value={managerForm.email}
                  onChange={(e) => setManagerForm((f) => ({ ...f, email: e.target.value }))}
                />
              </Field>

              <Field label="Username (Slug)">
                <input
                  className={inputClass}
                  placeholder="community-manager"
                  value={managerForm.username}
                  onChange={(e) => setManagerForm((f) => ({ ...f, username: e.target.value }))}
                />
              </Field>

              <Field label={managerEditingId ? "New Password (Optional)" : "Manager Password *"}>
                <div className="relative">
                  <input
                    className={`${inputClass} pr-10`}
                    type={showManagerPassword ? "text" : "password"}
                    placeholder={managerEditingId ? "•••••••• (Leave blank to keep)" : "Min 8 characters"}
                    value={managerForm.password}
                    onChange={(e) => setManagerForm((f) => ({ ...f, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowManagerPassword(!showManagerPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showManagerPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
            </div>

            <Field label="Staff Bio & Responsibilities">
              <textarea
                className={`${inputClass} min-h-[70px]`}
                placeholder="Responsibilities, moderation areas, and student success focus..."
                value={managerForm.bio}
                onChange={(e) => setManagerForm((f) => ({ ...f, bio: e.target.value }))}
              />
            </Field>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={resetManagerForm}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition"
              >
                Clear Form
              </button>
              <PrimaryButton disabled={managerBusy} onClick={onSaveManager} className="rounded-xl px-5 py-2.5 text-xs font-bold gap-1.5">
                {managerBusy ? "Saving..." : managerEditingId ? "Save Changes" : "Create Manager Account"}
              </PrimaryButton>
            </div>
          </Card>

          {/* Active Managers List */}
          <Card className="p-6 border border-zinc-200 shadow-sm space-y-4">
            <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
              <Shield size={16} className="text-primary" /> Active Managers ({managerUsers.length})
            </h3>

            {managerUsers.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">No manager accounts configured yet.</p>
            ) : (
              <div className="space-y-3">
                {managerUsers.map((mgr) => (
                  <div key={mgr.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/40">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <Avatar user={mgr} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-zinc-900">{mgr.name}</span>
                          <UserRoleBadge role="manager" size="xs" />
                          <span className="text-xs text-zinc-400 font-mono">@{mgr.username}</span>
                        </div>
                        <p className="text-xs text-zinc-500 font-mono">{mgr.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => loadManagerIntoForm(mgr)}
                        className="rounded-lg px-3 py-1.5 text-xs font-bold border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 transition"
                      >
                        Edit Credentials
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Demote ${mgr.name} to standard member?`)) {
                            await updateMember({ userId: mgr.id, role: "member" });
                          }
                        }}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
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

      {/* SECTION 6: SUBTAB 4 - COMMENTS MODERATION */}
      {tab === "comments" && (
        <div className="space-y-6">
          {/* Pending Comments */}
          <Card className="p-6 border border-zinc-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                  <Clock size={16} className="text-amber-500" /> Pending Comments Queue ({pendingComments.length})
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Member comments require moderator approval before displaying in the public community feed.
                </p>
              </div>
            </div>

            {pendingComments.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 border border-dashed border-zinc-200 rounded-2xl">
                <Check size={28} className="mx-auto text-emerald-500 mb-1" />
                <p className="text-sm font-bold text-zinc-700">Moderation Queue Clear</p>
                <p className="text-xs text-zinc-400">All submitted comments have been reviewed.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingComments.map((c) => {
                  const author = users.find((u) => u.id === c.authorId);
                  const post = posts.find((p) => p.id === c.postId);

                  return (
                    <div key={c.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Avatar user={author} size={28} />
                          <span className="font-bold text-xs text-zinc-900">{author?.name}</span>
                          <span className="text-[11px] text-zinc-400">({author?.email})</span>
                          <span className="text-[11px] text-zinc-500">• on &ldquo;{post?.title || "Community Post"}&rdquo;</span>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => approveComment(c.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs transition"
                          >
                            <Check size={12} /> Approve (+2 pts)
                          </button>
                          <button
                            onClick={() => rejectComment(c.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 transition"
                          >
                            <X size={12} /> Reject
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-800 bg-white p-3 rounded-lg border border-amber-100/80 leading-relaxed break-words">
                        {c.body}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Approved Comments Feed */}
          <Card className="p-6 border border-zinc-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-black text-zinc-900">Published Comments History</h3>
                <p className="text-xs text-zinc-500">Live community comments currently visible to all members.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-zinc-900"
                  placeholder="Filter comments..."
                  value={commentsSearch}
                  onChange={(e) => setCommentsSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="divide-y divide-zinc-100 max-h-[420px] overflow-y-auto pr-1 space-y-2">
              {filteredApprovedComments.map((c) => {
                const author = users.find((u) => u.id === c.authorId);
                const post = posts.find((p) => p.id === c.postId);

                return (
                  <div key={c.id} className="pt-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <Avatar user={author} size={30} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-zinc-900">{author?.name}</span>
                          <span className="text-[11px] text-zinc-400">{timeAgo(c.createdAt)}</span>
                          <span className="text-[11px] text-zinc-500 font-medium">• Post: &ldquo;{post?.title}&rdquo;</span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-700 bg-zinc-50 p-2.5 rounded-lg break-words">
                          {c.body}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm("Delete this comment permanently?")) deleteComment(c.id);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-zinc-100 transition"
                      title="Delete Comment"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* SECTION 7: SUBTAB 5 - SALES & REVENUE */}
      {tab === "sales" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="p-4 border-zinc-200">
              <span className="text-[10px] font-bold uppercase text-zinc-400">Total Revenue</span>
              <p className="text-2xl font-black text-emerald-600">{formatMoney(totalSalesRevenue)}</p>
            </Card>
            <Card className="p-4 border-zinc-200">
              <span className="text-[10px] font-bold uppercase text-zinc-400">Completed Transactions</span>
              <p className="text-2xl font-black text-zinc-900">{sales.length}</p>
            </Card>
            <Card className="p-4 border-zinc-200">
              <span className="text-[10px] font-bold uppercase text-zinc-400">Average Order</span>
              <p className="text-2xl font-black text-primary">
                {formatMoney(sales.length ? totalSalesRevenue / sales.length : 0)}
              </p>
            </Card>
          </div>

          <Card className="overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-100 uppercase tracking-wider text-zinc-400 text-[10px]">
                <tr>
                  <th className="px-4 py-3">Transaction Date</th>
                  <th>Customer</th>
                  <th>Product / Plan</th>
                  <th className="pr-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {[...sales].reverse().map((s) => {
                  const customer = users.find((u) => u.id === s.userId);
                  return (
                    <tr key={s.id} className="hover:bg-zinc-50/70 transition">
                      <td className="px-4 py-3 font-mono text-zinc-500">{new Date(s.createdAt).toLocaleString()}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar user={customer} size={24} />
                          <div>
                            <span className="font-bold text-zinc-900">{customer?.name || "Member"}</span>
                            <p className="text-[10px] text-zinc-400 font-mono">{customer?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-semibold text-zinc-800">{s.plan}</td>
                      <td className="pr-4 text-right font-black text-emerald-600">{formatMoney(s.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* SECTION 8: SUBTAB 6 - CLASSROOM MANAGEMENT */}
      {tab === "classroom" && <AdminClassroom />}

      {/* GLOBAL CREATE / EDIT MEMBER MODAL */}
      <Modal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        title={editor === "create" ? "Add New Member" : `Edit Member: ${typeof editor === "object" && editor ? editor.name : ""}`}
        wide
      >
        <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full Name *">
              <input
                className={inputClass}
                placeholder="e.g. Alex Morgan"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </Field>

            <Field label="Email Address *">
              <input
                className={inputClass}
                type="email"
                placeholder="alex@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </Field>

            <Field label="Username">
              <input
                className={inputClass}
                placeholder="alex-morgan (optional, auto-slug)"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
            </Field>

            <Field label={editor === "create" ? "Password *" : "New Password (optional)"}>
              <div className="relative">
                <input
                  className={`${inputClass} pr-10`}
                  type={showPassword ? "text" : "password"}
                  placeholder={editor === "create" ? "Min 8 characters" : "••••••••"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <Field label="Role">
              <select
                className={inputClass}
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
              >
                <option value="member">Student / Member</option>
                <option value="team_member">Team Specialist</option>
                <option value="manager">★ Community Manager</option>
                {isAdmin && <option value="admin">⚡ Administrator</option>}
              </select>
            </Field>

            <Field label="Account Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}
              >
                <option value="approved">Approved (Active)</option>
                <option value="pending">Pending Review</option>
                <option value="rejected">Rejected (Suspended)</option>
              </select>
            </Field>

            <Field label="Location">
              <input
                className={inputClass}
                placeholder="e.g. San Francisco, CA"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </Field>

            <Field label="Language">
              <select
                className={inputClass}
                value={form.language}
                onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Bio / Goals">
            <textarea
              className={inputClass}
              rows={2}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            />
          </Field>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPremium}
                onChange={(e) => setForm((f) => ({ ...f, isPremium: e.target.checked }))}
                className="h-4 w-4 rounded-md border-zinc-300 text-primary"
              />
              <Crown size={14} className="text-amber-500" />
              <span className="text-xs font-bold text-zinc-900">VIP / Premium Member Access</span>
            </label>
          </div>

          {editor && editor !== "create" && (
            <div className="rounded-xl bg-zinc-900 text-zinc-100 p-3.5 space-y-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Security & Session Status</span>
              <div className="flex items-center justify-between">
                <span>Active Device Session:</span>
                <span className="font-bold">{editor.hasActiveSession ? "Logged in on device" : "Free / No active session"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Tracked IP:</span>
                <span className="font-mono text-zinc-300">{editor.ipAddress || "127.0.0.1"}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
            {editor && editor !== "create" && editor.hasActiveSession && (
              <button
                type="button"
                onClick={() => onReleaseLogin(editor.id)}
                className="rounded-xl border border-zinc-200 px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
              >
                Release Device Session
              </button>
            )}

            <button
              type="button"
              onClick={() => setEditor(null)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition"
            >
              Cancel
            </button>

            <PrimaryButton disabled={busy} onClick={onSave} className="rounded-xl px-5 py-2.5 text-xs font-bold">
              {busy ? "Saving..." : editor === "create" ? "Add Member" : "Save Changes"}
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  badgeColor = "bg-zinc-100 text-zinc-700",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badgeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition whitespace-nowrap active:scale-95 cursor-pointer ${
        active
          ? "bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-900"
          : "bg-white ring-1 ring-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-2xs"
      }`}
    >
      <span>{label}</span>
    </button>
  );
}
