"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Shield,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  X,
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
  StaffRoleFavicon,
  inputClass,
} from "@/components/ui";
import { ChatDrawer } from "@/components/ChatDrawer";
import { timeAgo } from "@/lib/format";
import { getLevel } from "@/lib/levels";
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
  const {
    users,
    user,
    inviteMember,
    createMember,
    updateMember,
    rejectUser,
    activeCommunity,
  } = useApp();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<
    "all" | "students" | "team" | "staff" | "online"
  >("all");
  const [communityFilter, setCommunityFilter] = useState<"all" | "students" | "team">("all");
  const [sortBy, setSortBy] = useState<"points" | "active" | "newest" | "name">("points");
  const [chatId, setChatId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState("");

  const [editor, setEditor] = useState<"create" | PublicUser | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [deletingUser, setDeletingUser] = useState<PublicUser | null>(null);

  const isStaff = user?.role === "admin" || user?.role === "manager";
  const isAdmin = user?.role === "admin";

  const visible = useMemo(() => {
    return users.filter(
      (u) =>
        u.role === "admin" ||
        u.role === "manager" ||
        u.status === "approved" ||
        typeof u.status === "undefined"
    );
  }, [users]);

  // Tab counts
  const countAll = visible.length;
  const countStudents = visible.filter(
    (u) => u.role === "member" || u.role === "student" || u.role === "user"
  ).length;
  const countTeam = visible.filter((u) => u.role === "team_member").length;
  const countStaff = visible.filter(
    (u) => u.role === "admin" || u.role === "manager"
  ).length;
  const countOnline = visible.filter((u) => u.isOnline).length;

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    let list = visible.filter((u) => {
      // Role Tab Filter
      if (tab === "students") {
        if (u.role !== "member" && u.role !== "student" && u.role !== "user") {
          return false;
        }
      } else if (tab === "team") {
        if (u.role !== "team_member") return false;
      } else if (tab === "staff") {
        if (u.role !== "admin" && u.role !== "manager") return false;
      } else if (tab === "online") {
        if (!u.isOnline) return false;
      }

      // Community Scope Filter
      if (communityFilter === "team") {
        if (u.role !== "team_member" && u.role !== "admin" && u.role !== "manager") {
          return false;
        }
      } else if (communityFilter === "students") {
        if (u.role === "team_member") return false;
      }

      // Search Query
      if (query) {
        const nameMatch = u.name.toLowerCase().includes(query);
        const usernameMatch = u.username.toLowerCase().includes(query);
        const bioMatch = (u.bio || "").toLowerCase().includes(query);
        const locMatch = (u.location || "").toLowerCase().includes(query);
        const roleMatch = (u.role || "").toLowerCase().includes(query);
        return nameMatch || usernameMatch || bioMatch || locMatch || roleMatch;
      }

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === "points") {
        return (b.points || 0) - (a.points || 0);
      }
      if (sortBy === "active") {
        const timeA = new Date(a.lastSeenAt || a.joinedAt).getTime();
        const timeB = new Date(b.lastSeenAt || b.joinedAt).getTime();
        return timeB - timeA;
      }
      if (sortBy === "newest") {
        return (
          new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
        );
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return list;
  }, [visible, tab, communityFilter, q, sortBy]);

  function openCreate() {
    setForm({
      ...emptyForm,
      role: activeCommunity?.type === "team" ? "team_member" : "member",
    });
    setMessage("");
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
      isPremium: member.isPremium || false,
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

  async function handleConfirmReject() {
    if (!deletingUser) return;
    setBusy(true);
    await rejectUser(deletingUser.id);
    setBusy(false);
    setDeletingUser(null);
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        {/* Top Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-zinc-200/90 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <Users size={20} className="text-primary" />
              <h1 className="text-lg font-black text-zinc-900">
                Directory & Members
              </h1>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Connect with fellow builders, students, team specialists, and leaders.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isStaff && (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-black px-3.5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <Plus size={14} /> Add Member
              </button>
            )}
            <GoldButton onClick={() => setInviteOpen(true)}>
              <UserPlus size={14} className="mr-1 inline" /> INVITE
            </GoldButton>
          </div>
        </div>

        {/* Filter Tabs & Community Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Tab
              label={`All (${countAll})`}
              active={tab === "all"}
              onClick={() => setTab("all")}
            />
            <Tab
              label={`Students (${countStudents})`}
              active={tab === "students"}
              onClick={() => setTab("students")}
            />
            <Tab
              label={`Team (${countTeam})`}
              active={tab === "team"}
              onClick={() => setTab("team")}
            />
            <Tab
              label={`Staff (${countStaff})`}
              active={tab === "staff"}
              onClick={() => setTab("staff")}
            />
            <Tab
              label={`Online (${countOnline})`}
              active={tab === "online"}
              onClick={() => setTab("online")}
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 outline-none hover:border-zinc-300 cursor-pointer shadow-2xs"
            >
              <option value="points">Top Points (Leaderboard)</option>
              <option value="active">Recently Active</option>
              <option value="newest">Newest Members</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, username, bio, skills, or location..."
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Members List */}
        <Card className="divide-y divide-zinc-100 overflow-hidden shadow-xs">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-zinc-500">
              <Users size={36} className="mx-auto mb-2 text-zinc-300" />
              <p className="text-base font-bold text-zinc-800">
                No members found
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Try adjusting your search query or filter settings.
              </p>
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="mt-3 inline-flex items-center gap-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filtered.map((m) => {
              const level = getLevel(m.points || 0);
              const isCurrentUser = m.id === user?.id;

              return (
                <div
                  key={m.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-zinc-50/70 transition-colors"
                >
                  {/* Left: Avatar & Member Info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <Link
                      href={`/profile/${m.id}`}
                      className="shrink-0 transition-transform hover:scale-105"
                      title={`View ${m.name}'s profile`}
                    >
                      <Avatar user={m} size={48} />
                    </Link>

                    <div className="min-w-0 flex-1">
                      {/* Name & Role Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/profile/${m.id}`}
                          className="font-bold text-[15px] text-zinc-900 hover:text-primary transition-colors truncate"
                        >
                          {m.name}
                        </Link>

                        {/* Staff Role Favicon */}
                        <StaffRoleFavicon role={m.role} size="sm" />

                        {/* Level Badge */}
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-extrabold text-amber-700 border border-amber-300/60"
                          title={`${m.points || 0} Total Points`}
                        >
                          <Trophy size={10} /> Lvl {level.level}
                        </span>

                        {/* Role tag if team member */}
                        {m.role === "team_member" && (
                          <span className="rounded-md bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 text-[10px] font-bold uppercase">
                            Team Specialist
                          </span>
                        )}

                        {/* Premium Member Badge */}
                        {m.isPremium && (
                          <span className="rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 text-[10px] font-bold">
                            💎 Premium
                          </span>
                        )}
                      </div>

                      {/* Username & Bio */}
                      <p className="text-xs text-zinc-400 mt-0.5">
                        @{m.username}
                      </p>

                      {m.bio && (
                        <p className="mt-1 line-clamp-2 text-xs md:text-[13px] text-zinc-600 leading-relaxed">
                          {m.bio}
                        </p>
                      )}

                      {/* Metadata Chips: Online / Joined / Location / Points */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-zinc-500 font-medium">
                        {m.isOnline ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-bold">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Online now
                          </span>
                        ) : (
                          <span className="text-zinc-400">
                            Active {timeAgo(m.lastSeenAt || m.joinedAt)}
                          </span>
                        )}

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
                            <span>📍 {m.location}</span>
                          </>
                        )}

                        <span>·</span>
                        <span className="font-semibold text-zinc-700">
                          ⭐ {m.points || 0} pts
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                    <Link
                      href={`/profile/${m.id}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 py-1.5 text-xs font-bold text-zinc-700 transition shadow-2xs"
                      title="View full profile"
                    >
                      <ExternalLink size={13} /> Profile
                    </Link>

                    {!isCurrentUser && (
                      <button
                        type="button"
                        onClick={() => setChatId(m.id)}
                        className="inline-flex items-center gap-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1.5 text-xs font-bold transition shadow-2xs cursor-pointer"
                        title={`Direct message with ${m.name}`}
                      >
                        <MessageCircle size={13} /> Chat
                      </button>
                    )}

                    {isStaff && (
                      <button
                        type="button"
                        onClick={() => openEdit(m)}
                        className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 py-1.5 text-xs font-bold text-zinc-700 transition shadow-2xs cursor-pointer"
                        title="Edit member settings"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                    )}

                    {isAdmin && !isCurrentUser && m.role !== "admin" && (
                      <button
                        type="button"
                        onClick={() => setDeletingUser(m)}
                        className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-600 px-2.5 py-1.5 text-xs font-bold transition cursor-pointer"
                        title="Remove or reject member"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </div>

      {/* Right Sidebar */}
      <Sidebar />

      {/* Chat Drawer */}
      <ChatDrawer userId={chatId} onClose={() => setChatId(null)} />

      {/* Invite Modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a New Member"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
            Share your invite link with students, team members, or founders.
            Invited members will create an account and receive community access.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700">
              Invite by Email
            </label>
            <input
              className={inputClass}
              placeholder="colleague@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="w-full rounded-xl bg-primary hover:bg-primary-dark px-4 py-2.5 text-sm font-bold text-white transition shadow-sm cursor-pointer"
            onClick={async () => {
              if (email) await inviteMember(email);
              const link = `${window.location.origin}/register?ref=${
                user?.affiliateCode || ""
              }`;
              await navigator.clipboard.writeText(link);
              setCopied("Invite registration link copied to clipboard!");
              setTimeout(() => setCopied(""), 4000);
            }}
          >
            Copy Registration Invite Link
          </button>

          {copied && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <span>✓</span> {copied}
            </div>
          )}
        </div>
      </Modal>

      {/* Create / Edit Student / Member Modal */}
      <Modal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        title={
          editor === "create"
            ? "Add New Member"
            : `Edit Member: ${
                typeof editor === "object" && editor ? editor.name : "Member"
              }`
        }
      >
        <div className="space-y-3">
          {message && (
            <p className="rounded-xl bg-red-50 p-2.5 text-xs font-semibold text-red-700 border border-red-200">
              {message}
            </p>
          )}

          <Field label="Full Name">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Alex Rivera"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Email Address">
              <input
                className={inputClass}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="alex@example.com"
              />
            </Field>

            <Field label="Username">
              <input
                className={inputClass}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="alex-rivera"
              />
            </Field>
          </div>

          <Field
            label={
              editor === "create"
                ? "Password (min 8 characters)"
                : "New Password (leave blank to retain current)"
            }
          >
            <input
              className={inputClass}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </Field>

          <Field label="Bio / Title">
            <textarea
              className={inputClass}
              rows={2}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Short description of member background or role..."
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Location">
              <input
                className={inputClass}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Dubai, UAE"
              />
            </Field>

            <Field label="Role">
              <select
                className={inputClass}
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as Role })
                }
              >
                <option value="member">Student / Member</option>
                <option value="team_member">Team Specialist</option>
                <option value="manager">Manager</option>
                {isAdmin && <option value="admin">Admin</option>}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Account Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as Status })
                }
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending Review</option>
                <option value="rejected">Rejected / Inactive</option>
              </select>
            </Field>

            <Field label="Membership Tier">
              <select
                className={inputClass}
                value={form.isPremium ? "yes" : "no"}
                onChange={(e) =>
                  setForm({ ...form, isPremium: e.target.value === "yes" })
                }
              >
                <option value="no">Standard Access</option>
                <option value="yes">💎 Premium Access</option>
              </select>
            </Field>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setEditor(null)}
              className="rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition"
            >
              Cancel
            </button>
            <PrimaryButton disabled={busy} onClick={onSave}>
              {busy ? "Saving..." : "Save Member"}
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* Delete / Reject Member Confirmation Modal */}
      <Modal
        open={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        title="Remove Member"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
            Are you sure you want to deactivate and remove{" "}
            <span className="font-bold text-zinc-900">
              {deletingUser?.name}
            </span>{" "}
            (@{deletingUser?.username})? Their sessions will be invalidated and
            their status changed to rejected.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setDeletingUser(null)}
              className="rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleConfirmReject}
              className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white transition shadow-sm cursor-pointer"
            >
              {busy ? "Removing..." : "Confirm Remove"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Tab({
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
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer shadow-2xs ${
        active
          ? "bg-zinc-900 text-white shadow-xs"
          : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}
