"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crown,
  Eye,
  EyeOff,
  Filter,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Share2,
  Sparkles,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
  Zap,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Sidebar } from "@/components/Sidebar";
import {
  Avatar,
  Card,
  Field,
  GoldButton,
  Modal,
  PrimaryButton,
  ProgressBar,
  UserRoleBadge,
  inputClass,
} from "@/components/ui";
import { ChatDrawer } from "@/components/ChatDrawer";
import { getLevel } from "@/lib/levels";
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

type TabType = "all" | "admins" | "managers" | "team" | "students" | "online" | "pending";
type SortOption = "points_desc" | "online_first" | "newest" | "oldest" | "name_asc" | "name_desc";

export default function MembersPage() {
  const { users, user, inviteMember, createMember, updateMember, approveUser, activeCommunity } = useApp();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<TabType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("points_desc");
  const [chatId, setChatId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<PublicUser | null>(null);

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Editor modal state
  const [editor, setEditor] = useState<"create" | PublicUser | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [editorSuccess, setEditorSuccess] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const isStaff = user?.role === "admin" || user?.role === "manager";
  const isAdmin = user?.role === "admin";

  // Visible users in standard view
  const visible = useMemo(() => {
    return users.filter(
      (u) =>
        u.role === "admin" ||
        u.role === "manager" ||
        u.status === "approved" ||
        typeof u.status === "undefined"
    );
  }, [users]);

  // Pending users (for staff view)
  const pendingUsers = useMemo(() => {
    return users.filter((u) => u.status === "pending");
  }, [users]);

  // Filter and search computation
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    // Pick base pool based on active tab
    let pool: PublicUser[] = [];
    if (tab === "pending") {
      pool = isStaff ? pendingUsers : [];
    } else {
      pool = visible.filter((u) => {
        if (tab === "admins") return u.role === "admin";
        if (tab === "managers") return u.role === "manager";
        if (tab === "team") return u.role === "team_member";
        if (tab === "students") return u.role === "member" || u.role === "student" || u.role === "user";
        if (tab === "online") return u.isOnline;
        return true;
      });
    }

    // Apply search query
    if (query) {
      pool = pool.filter((u) => {
        const nameMatch = u.name.toLowerCase().includes(query);
        const usernameMatch = u.username.toLowerCase().includes(query);
        const bioMatch = u.bio?.toLowerCase().includes(query) || false;
        const locMatch = u.location?.toLowerCase().includes(query) || false;
        const roleMatch = u.role.toLowerCase().includes(query);
        const levelObj = getLevel(u.points || 0);
        const levelMatch = levelObj.name.toLowerCase().includes(query);
        return nameMatch || usernameMatch || bioMatch || locMatch || roleMatch || levelMatch;
      });
    }

    // Apply sorting
    return [...pool].sort((a, b) => {
      switch (sortBy) {
        case "points_desc":
          return (b.points || 0) - (a.points || 0);
        case "online_first":
          if (a.isOnline === b.isOnline) {
            return new Date(b.lastSeenAt || b.joinedAt).getTime() - new Date(a.lastSeenAt || a.joinedAt).getTime();
          }
          return a.isOnline ? -1 : 1;
        case "newest":
          return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
        case "oldest":
          return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
  }, [visible, pendingUsers, q, tab, sortBy, isStaff]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Tab count metrics
  const counts = useMemo(() => {
    return {
      all: visible.length,
      admins: visible.filter((u) => u.role === "admin").length,
      managers: visible.filter((u) => u.role === "manager").length,
      team: visible.filter((u) => u.role === "team_member").length,
      students: visible.filter((u) => u.role === "member" || u.role === "student" || u.role === "user").length,
      online: visible.filter((u) => u.isOnline).length,
      pending: pendingUsers.length,
    };
  }, [visible, pendingUsers]);

  // Reset page when tab or search changes
  function changeTab(newTab: TabType) {
    setTab(newTab);
    setPage(1);
  }

  function openCreate() {
    setForm(emptyForm);
    setEditorError("");
    setEditorSuccess("");
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
    setEditorError("");
    setEditorSuccess("");
    setShowPassword(false);
    setEditor(member);
  }

  async function onSave() {
    setBusy(true);
    setEditorError("");
    setEditorSuccess("");

    if (!form.name.trim()) {
      setEditorError("Full name is required.");
      setBusy(false);
      return;
    }

    if (!form.email.trim() || !form.email.includes("@")) {
      setEditorError("A valid email address is required.");
      setBusy(false);
      return;
    }

    if (editor === "create" && (!form.password || form.password.length < 8)) {
      setEditorError("Password must be at least 8 characters.");
      setBusy(false);
      return;
    }

    if (editor !== "create" && form.password && form.password.length < 8) {
      setEditorError("New password must be at least 8 characters.");
      setBusy(false);
      return;
    }

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
      setEditorError(result.error || "Could not save member.");
      return;
    }

    // Refresh selected member if currently open
    if (selectedMember && typeof editor === "object" && editor?.id === selectedMember.id) {
      const updated = users.find((u) => u.id === selectedMember.id);
      if (updated) setSelectedMember(updated);
    }

    setEditor(null);
  }

  async function handleQuickApprove(userId: string) {
    const res = await approveUser(userId);
    if (res.ok) {
      if (selectedMember?.id === userId) {
        setSelectedMember(null);
      }
    }
  }

  async function handleCopyInviteLink() {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://permanentskills.com";
    const refCode = user?.affiliateCode || "";
    const link = `${origin}/register?ref=${refCode}`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = link;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  }

  async function handleSendEmailInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      setInviteMsg({ type: "error", text: "Please enter a valid email address." });
      return;
    }
    setInviteBusy(true);
    setInviteMsg(null);

    const res = await inviteMember(inviteEmail.trim());
    setInviteBusy(false);
    if (res.ok) {
      setInviteMsg({
        type: "success",
        text: `Invitation ready for ${inviteEmail.trim()}! Link is active.`,
      });
      setInviteEmail("");
    } else {
      setInviteMsg({
        type: "error",
        text: res.error || "Could not send invitation.",
      });
    }
  }

  const isTeamHub = activeCommunity?.type === "team";

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        {/* Section 1: Header Bar & Title */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-zinc-900">
                {isTeamHub ? "Team Specialists Directory" : "Community Members"}
              </h1>
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-600 border border-zinc-200">
                {visible.length}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">
              {isTeamHub
                ? "Specialists, engineers, and strategists collaborating in the Team Specialists Hub."
                : "Connect, network, and collaborate with members of the Permanent Skills Academy."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isStaff && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-black transition active:scale-98"
              >
                <Plus size={14} /> Add Member
              </button>
            )}
            <GoldButton onClick={() => setInviteOpen(true)} className="rounded-xl px-4 py-2 text-xs shadow-sm">
              <Share2 size={13} className="mr-1 inline-block" /> INVITE
            </GoldButton>
          </div>
        </div>

        {/* Section 2: Filter Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <TabButton
            label="All Members"
            count={counts.all}
            active={tab === "all"}
            onClick={() => changeTab("all")}
          />
          <TabButton
            label="Admins"
            count={counts.admins}
            active={tab === "admins"}
            onClick={() => changeTab("admins")}
            badgeColor="bg-zinc-900 text-amber-300"
          />
          <TabButton
            label="Managers"
            count={counts.managers}
            active={tab === "managers"}
            onClick={() => changeTab("managers")}
            badgeColor="bg-blue-600 text-white"
          />
          <TabButton
            label="Team Specialists"
            count={counts.team}
            active={tab === "team"}
            onClick={() => changeTab("team")}
            badgeColor="bg-purple-600 text-white"
          />
          <TabButton
            label="Students"
            count={counts.students}
            active={tab === "students"}
            onClick={() => changeTab("students")}
          />
          <TabButton
            label="Online"
            count={counts.online}
            active={tab === "online"}
            onClick={() => changeTab("online")}
            icon={<span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
          />
          {isStaff && counts.pending > 0 && (
            <TabButton
              label="Pending"
              count={counts.pending}
              active={tab === "pending"}
              onClick={() => changeTab("pending")}
              badgeColor="bg-amber-500 text-zinc-950 font-black animate-bounce"
            />
          )}
        </div>

        {/* Section 3: Search, Sort & Results Bar */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, @username, skill, location, or role..."
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-9 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 shadow-2xs"
            />
            {q && (
              <button
                onClick={() => {
                  setQ("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex items-center">
              <ArrowUpDown size={14} className="absolute left-3 text-zinc-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-xl border border-zinc-200 bg-white py-2.5 pl-8 pr-8 text-xs font-semibold text-zinc-700 outline-none transition hover:bg-zinc-50 focus:border-zinc-900 cursor-pointer shadow-2xs appearance-none"
              >
                <option value="points_desc">🏆 Most Points (Rank)</option>
                <option value="online_first">⚡ Online First</option>
                <option value="newest">🕒 Recently Joined</option>
                <option value="oldest">📅 Earliest Members</option>
                <option value="name_asc">🔤 Name (A → Z)</option>
                <option value="name_desc">🔤 Name (Z → A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search / Filter active indicator */}
        {(q || tab !== "all") && (
          <div className="flex items-center justify-between rounded-xl bg-zinc-50 border border-zinc-200/70 px-3.5 py-2 text-xs text-zinc-600">
            <span>
              Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? "member" : "members"}
              {tab !== "all" ? ` in ${tab}` : ""} {q ? `matching "${q}"` : ""}
            </span>
            <button
              onClick={() => {
                setQ("");
                setTab("all");
                setPage(1);
              }}
              className="font-bold text-zinc-900 hover:underline"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Section 4: Members Cards Directory */}
        <Card className="divide-y divide-zinc-100 overflow-hidden shadow-sm">
          {paginatedMembers.length === 0 ? (
            /* Section 5: Empty State */
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                <UserX size={28} />
              </div>
              <h3 className="mt-3 text-base font-bold text-zinc-900">No members found</h3>
              <p className="mt-1 max-w-sm text-xs text-zinc-500">
                {q
                  ? `We couldn't find any members matching "${q}". Try adjusting your search query or switching tabs.`
                  : "There are currently no members in this category."}
              </p>
              {(q || tab !== "all") && (
                <button
                  onClick={() => {
                    setQ("");
                    setTab("all");
                    setPage(1);
                  }}
                  className="mt-4 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-black transition"
                >
                  View All Members
                </button>
              )}
            </div>
          ) : (
            paginatedMembers.map((m) => {
              const level = getLevel(m.points || 0);
              const isCurrentUser = m.id === user?.id;
              const isPending = m.status === "pending";

              return (
                <div
                  key={m.id}
                  className="group flex flex-col gap-3 p-4 transition hover:bg-zinc-50/70 sm:flex-row sm:items-start"
                >
                  {/* Avatar with Clickable Quick Profile */}
                  <div
                    onClick={() => setSelectedMember(m)}
                    className="cursor-pointer shrink-0 transition-transform group-hover:scale-105 active:scale-95"
                    title={`View ${m.name}'s profile`}
                  >
                    <Avatar user={m} size={48} className="ring-2 ring-transparent group-hover:ring-zinc-300" />
                  </div>

                  {/* Member Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setSelectedMember(m)}
                        className="text-left font-bold text-zinc-950 hover:text-primary transition"
                      >
                        {m.name}
                      </button>

                      {isCurrentUser && (
                        <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-zinc-600 border border-zinc-200">
                          You
                        </span>
                      )}

                      <UserRoleBadge role={m.role} isPremium={m.isPremium} size="xs" />

                      {isPending && (
                        <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-800 border border-amber-300">
                          Pending Approval
                        </span>
                      )}
                    </div>

                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <span className="font-medium">@{m.username}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80 text-[11px]">
                        <Trophy size={11} className="text-amber-600" /> Lvl {level.level} · {level.name}
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-zinc-700">{m.points || 0} pts</span>
                    </div>

                    {m.bio && (
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-600">
                        {m.bio}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-medium text-zinc-500">
                      <span>
                        {m.isOnline ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Online now
                          </span>
                        ) : (
                          `Active ${timeAgo(m.lastSeenAt || m.joinedAt)}`
                        )}
                      </span>

                      <span>·</span>

                      <span>
                        Joined{" "}
                        {new Date(m.joinedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>

                      {m.location && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin size={11} className="text-zinc-400" /> {m.location}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {isStaff && isPending && (
                      <button
                        onClick={() => handleQuickApprove(m.id)}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs transition"
                        title="Approve member application"
                      >
                        <UserCheck size={13} /> Approve
                      </button>
                    )}

                    {isStaff && (
                      <button
                        onClick={() => openEdit(m)}
                        className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition"
                        title="Edit member details"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedMember(m)}
                      className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition"
                      title="View full profile"
                    >
                      <Eye size={12} /> Profile
                    </button>

                    {!isCurrentUser && (
                      <button
                        onClick={() => setChatId(m.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-dark shadow-2xs transition active:scale-98"
                        title={`Chat with ${m.name}`}
                      >
                        <MessageCircle size={13} /> Chat
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </Card>

        {/* Section 9: Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between rounded-xl bg-white border border-zinc-200 p-3 shadow-2xs">
            <p className="text-xs font-medium text-zinc-500">
              Showing <span className="font-bold text-zinc-800">{(currentPage - 1) * pageSize + 1}</span> to{" "}
              <span className="font-bold text-zinc-800">
                {Math.min(currentPage * pageSize, filtered.length)}
              </span>{" "}
              of <span className="font-bold text-zinc-800">{filtered.length}</span> members
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="px-2 text-xs font-bold text-zinc-600">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar with Leaderboard and Community Stats */}
      <Sidebar />

      {/* Section 4 & 6: Interactive Member Profile Modal / Drawer */}
      {selectedMember && (
        <Modal
          open={Boolean(selectedMember)}
          onClose={() => setSelectedMember(null)}
          title="Member Profile"
          wide
        >
          {(() => {
            const memberLevel = getLevel(selectedMember.points || 0);
            const isMe = selectedMember.id === user?.id;

            return (
              <div className="space-y-5">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0b1b4a] via-[#1e293b] to-[#0f172a] p-6 text-white shadow-md">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                    <Avatar
                      user={selectedMember}
                      size={80}
                      className="border-3 border-white shadow-lg shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h2 className="text-xl font-black">{selectedMember.name}</h2>
                        <UserRoleBadge role={selectedMember.role} isPremium={selectedMember.isPremium} size="sm" />
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-300 font-medium">@{selectedMember.username}</p>
                      <p className="mt-2 text-xs text-zinc-300 max-w-md">
                        {selectedMember.bio || "Community specialist at Permanent Skills."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Level Progress Bar Section */}
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                      <Trophy size={14} className="text-amber-500" /> Level {memberLevel.level} · {memberLevel.name}
                    </span>
                    <span className="font-semibold text-zinc-500">
                      {selectedMember.points || 0} pts
                      {memberLevel.next && ` / ${memberLevel.next.min} pts`}
                    </span>
                  </div>
                  <ProgressBar value={memberLevel.progress} max={100} size="sm" variant="amber" />
                  {memberLevel.next && (
                    <p className="text-[11px] text-zinc-500 text-right">
                      {memberLevel.pointsToNext} points needed for Level {memberLevel.next.level} ({memberLevel.next.name})
                    </p>
                  )}
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-2xs">
                    <p className="text-lg font-black text-zinc-900">{selectedMember.points || 0}</p>
                    <p className="text-[11px] font-medium text-zinc-500">Total Points</p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-2xs">
                    <p className="text-lg font-black text-primary">+{selectedMember.points7d || 0}</p>
                    <p className="text-[11px] font-medium text-zinc-500">7-Day Points</p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-2xs">
                    <p className="text-lg font-black text-amber-600">+{selectedMember.points30d || 0}</p>
                    <p className="text-[11px] font-medium text-zinc-500">30-Day Score</p>
                  </div>
                </div>

                {/* Member Metadata List */}
                <div className="space-y-2 text-xs text-zinc-600 border-t border-zinc-100 pt-3">
                  <div className="flex items-center justify-between py-1">
                    <span className="font-medium text-zinc-400">Activity Status</span>
                    <span className="font-semibold">
                      {selectedMember.isOnline ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          Online Now
                        </span>
                      ) : (
                        `Active ${timeAgo(selectedMember.lastSeenAt || selectedMember.joinedAt)}`
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-t border-zinc-100">
                    <span className="font-medium text-zinc-400">Joined Platform</span>
                    <span className="font-semibold text-zinc-800">
                      {new Date(selectedMember.joinedAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {selectedMember.location && (
                    <div className="flex items-center justify-between py-1 border-t border-zinc-100">
                      <span className="font-medium text-zinc-400">Location</span>
                      <span className="font-semibold text-zinc-800 flex items-center gap-1">
                        <MapPin size={12} className="text-zinc-400" /> {selectedMember.location}
                      </span>
                    </div>
                  )}

                  {selectedMember.language && (
                    <div className="flex items-center justify-between py-1 border-t border-zinc-100">
                      <span className="font-medium text-zinc-400">Language</span>
                      <span className="font-semibold text-zinc-800 flex items-center gap-1">
                        <Globe size={12} className="text-zinc-400" /> {selectedMember.language}
                      </span>
                    </div>
                  )}

                  {/* Staff Information (Admin & Manager viewers only) */}
                  {isStaff && (
                    <div className="mt-3 rounded-xl bg-zinc-900 text-zinc-100 p-3.5 space-y-2 border border-zinc-800">
                      <p className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                        Staff View · Account Details
                      </p>
                      {selectedMember.email && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">Email:</span>
                          <span className="font-mono text-zinc-200">{selectedMember.email}</span>
                        </div>
                      )}
                      {selectedMember.status && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">Status:</span>
                          <span className="capitalize font-bold text-amber-300">{selectedMember.status}</span>
                        </div>
                      )}
                      {selectedMember.phone && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">Phone:</span>
                          <span className="font-mono text-zinc-200">{selectedMember.phone}</span>
                        </div>
                      )}
                      {selectedMember.affiliateCode && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">Affiliate Code:</span>
                          <span className="font-mono text-zinc-200">{selectedMember.affiliateCode}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-100 pt-3">
                  <Link
                    href={`/profile/${selectedMember.id}`}
                    className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
                  >
                    View Full Profile Page →
                  </Link>

                  {isStaff && (
                    <button
                      onClick={() => {
                        const target = selectedMember;
                        setSelectedMember(null);
                        openEdit(target);
                      }}
                      className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition inline-flex items-center gap-1"
                    >
                      <Pencil size={13} /> Edit Member
                    </button>
                  )}

                  {!isMe && (
                    <PrimaryButton
                      onClick={() => {
                        const targetId = selectedMember.id;
                        setSelectedMember(null);
                        setChatId(targetId);
                      }}
                      className="rounded-xl px-4 py-2 text-xs font-bold gap-1.5"
                    >
                      <MessageCircle size={14} /> Direct Message
                    </PrimaryButton>
                  )}
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Direct Chat Drawer */}
      <ChatDrawer userId={chatId} onClose={() => setChatId(null)} />

      {/* Section 6 & 8: Invite Modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite to Community">
        <div className="space-y-4">
          <p className="text-xs leading-relaxed text-zinc-600">
            Invite friends, teammates, and specialists to join Permanent Skills. They will receive access upon application approval.
          </p>

          {/* Section 1: Referral / Share Link */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 flex items-center gap-1">
                <Sparkles size={14} className="text-amber-500" /> Your Personal Invite Link
              </span>
              {user?.affiliateCode && (
                <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  Ref: {user.affiliateCode}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                readOnly
                value={
                  typeof window !== "undefined"
                    ? `${window.location.origin}/register?ref=${user?.affiliateCode || ""}`
                    : `https://permanentskills.com/register?ref=${user?.affiliateCode || ""}`
                }
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600 font-mono select-all outline-none"
              />
              <button
                onClick={handleCopyInviteLink}
                className={`inline-flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-2xs ${
                  copiedLink
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-900 text-white hover:bg-black"
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check size={14} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 2: Direct Email Invite */}
          <form onSubmit={handleSendEmailInvite} className="space-y-2.5">
            <span className="block text-xs font-bold text-zinc-900">
              Or Send Direct Email Invitation
            </span>
            <div className="flex gap-2">
              <input
                type="email"
                className={inputClass}
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <PrimaryButton disabled={inviteBusy} type="submit" className="shrink-0 rounded-xl px-4 text-xs font-bold">
                {inviteBusy ? "Sending..." : "Send Invite"}
              </PrimaryButton>
            </div>

            {inviteMsg && (
              <p
                className={`rounded-xl p-2.5 text-xs font-medium ${
                  inviteMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {inviteMsg.text}
              </p>
            )}
          </form>

          {/* Affiliate info banner */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] text-zinc-600 space-y-1">
            <p className="font-bold text-primary">Earn 100% affiliate commission</p>
            <p>
              When invited members upgrade to Premium or purchase masterminds, you earn reward credits directly to your affiliate balance.
            </p>
          </div>
        </div>
      </Modal>

      {/* Section 5 & 7: Complete Create / Edit Student / Member Modal */}
      <Modal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        title={
          editor === "create"
            ? "Add Student / Member"
            : `Edit ${typeof editor === "object" && editor ? editor.name : "Member"}`
        }
        wide
      >
        <div className="space-y-3.5">
          {editorError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700">
              {editorError}
            </div>
          )}

          {editorSuccess && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-700">
              {editorSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Full Name *">
              <input
                className={inputClass}
                placeholder="e.g. Sarah Connor"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>

            <Field label="Email Address *">
              <input
                className={inputClass}
                type="email"
                placeholder="sarah@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Username">
              <input
                className={inputClass}
                placeholder="sarah-connor (optional, auto-generated)"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </Field>

            <Field
              label={
                editor === "create"
                  ? "Account Password *"
                  : "New Password (leave blank to keep current)"
              }
            >
              <div className="relative">
                <input
                  className={`${inputClass} pr-9`}
                  type={showPassword ? "text" : "password"}
                  placeholder={editor === "create" ? "Min 8 characters" : "••••••••"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </Field>
          </div>

          <Field label="Bio / Goals">
            <textarea
              className={inputClass}
              rows={2}
              placeholder="Tell the community about their skills and goals..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Role">
              <select
                className={inputClass}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                <option value="member">Student / Member</option>
                <option value="team_member">Team Specialist</option>
                <option value="manager">Community Manager</option>
                {isAdmin && <option value="admin">Administrator</option>}
              </select>
            </Field>

            <Field label="Account Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
              >
                <option value="approved">Approved (Active)</option>
                <option value="pending">Pending Review</option>
                <option value="rejected">Rejected (Suspended)</option>
              </select>
            </Field>

            <Field label="Language">
              <select
                className={inputClass}
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Location">
              <input
                className={inputClass}
                placeholder="e.g. Austin, TX or London, UK"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </Field>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2.5 cursor-pointer rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 w-full hover:bg-zinc-100/50 transition">
                <input
                  type="checkbox"
                  checked={form.isPremium}
                  onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                  className="h-4 w-4 rounded-md border-zinc-300 text-primary focus:ring-primary"
                />
                <div className="flex items-center gap-1.5">
                  <Crown size={14} className="text-amber-500" />
                  <span className="text-xs font-bold text-zinc-900">Grant Premium VIP Access</span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
            <button
              type="button"
              onClick={() => setEditor(null)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition"
            >
              Cancel
            </button>
            <PrimaryButton disabled={busy} onClick={onSave} className="rounded-xl px-5 py-2 text-xs font-bold">
              {busy ? "Saving..." : editor === "create" ? "Create Member" : "Save Changes"}
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TabButton({
  label,
  count,
  active,
  onClick,
  badgeColor = "bg-zinc-200 text-zinc-800",
  icon,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  badgeColor?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap active:scale-95 ${
        active
          ? "bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-900"
          : "bg-white ring-1 ring-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-2xs"
      }`}
    >
      {icon}
      <span>{label}</span>
      <span
        className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
          active ? "bg-white/20 text-white" : badgeColor
        }`}
      >
        {count}
      </span>
    </button>
  );
}
