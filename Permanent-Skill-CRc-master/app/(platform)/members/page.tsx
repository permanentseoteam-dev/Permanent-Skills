"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Mail,
  MessageCircle,
  Search,
  Share2,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Sidebar } from "@/components/Sidebar";
import {
  AdminShieldFavicon,
  Avatar,
  Card,
  GoldButton,
  ManagerAvatarFavicon,
  Modal,
  PrimaryButton,
  UserRoleBadge,
  inputClass,
} from "@/components/ui";
import { ChatDrawer } from "@/components/ChatDrawer";
import { timeAgo } from "@/lib/format";
import type { PublicUser } from "@/lib/types";

function PillButton({
  label,
  count,
  active,
  onClick,
  icon,
  badgeColor,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  badgeColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
        active
          ? "bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-900"
          : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
      }`}
    >
      {icon}
      <span>{label}</span>
      {typeof count === "number" && (
        <span
          className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
            active
              ? "bg-white/20 text-white"
              : badgeColor || "bg-zinc-100 text-zinc-700"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function MembersPage() {
  const { users, user, inviteMember } = useApp();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "admins" | "managers" | "online" | "premium">("all");
  const [chatUserId, setChatUserId] = useState<string | null>(null);

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDestination, setInviteDestination] = useState<"login" | "register">("login");
  const [copiedLink, setCopiedLink] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const approvedUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.role === "admin" ||
        u.role === "manager" ||
        u.status === "approved" ||
        typeof u.status === "undefined"
    );
  }, [users]);

  const adminsCount = useMemo(
    () => approvedUsers.filter((u) => u.role === "admin").length,
    [approvedUsers]
  );
  const managersCount = useMemo(
    () => approvedUsers.filter((u) => u.role === "manager").length,
    [approvedUsers]
  );
  const onlineCount = useMemo(
    () => approvedUsers.filter((u) => u.isOnline).length,
    [approvedUsers]
  );
  const premiumCount = useMemo(
    () => approvedUsers.filter((u) => u.isPremium || u.role === "admin").length,
    [approvedUsers]
  );

  const filtered = useMemo(() => {
    const search = q.toLowerCase().trim();
    return approvedUsers
      .filter((u) => {
        if (tab === "admins") return u.role === "admin";
        if (tab === "managers") return u.role === "manager";
        if (tab === "online") return u.isOnline;
        if (tab === "premium") return u.isPremium || u.role === "admin";
        return true;
      })
      .filter((u) => {
        if (!search) return true;
        return (
          u.name.toLowerCase().includes(search) ||
          u.username.toLowerCase().includes(search) ||
          (u.email && u.email.toLowerCase().includes(search)) ||
          (u.location && u.location.toLowerCase().includes(search)) ||
          (u.role && u.role.toLowerCase().includes(search)) ||
          Boolean(u.bio?.toLowerCase().includes(search))
        );
      });
  }, [approvedUsers, q, tab]);

  // Generate invite links based on destination
  const affiliateCode = user?.affiliateCode || user?.username || "vip";
  const origin = typeof window !== "undefined" ? window.location.origin : "https://permanentskills.com";
  
  const inviteUrl =
    inviteDestination === "login"
      ? `${origin}/login?invited=true&ref=${encodeURIComponent(affiliateCode)}`
      : `${origin}/register?ref=${encodeURIComponent(affiliateCode)}`;

  async function handleCopyInviteLink() {
    if (typeof window !== "undefined") {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } catch {
        // fallback
      }
    }
  }

  async function handleCopyCode() {
    if (typeof window !== "undefined") {
      try {
        await navigator.clipboard.writeText(affiliateCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } catch {}
    }
  }

  async function handleSendEmailInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setEmailBusy(true);
    setEmailSuccess(false);
    try {
      await inviteMember(inviteEmail.trim());
      setEmailSuccess(true);
      setInviteEmail("");
      setTimeout(() => setEmailSuccess(false), 4000);
    } catch {
      // error handled in action
    } finally {
      setEmailBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        {/* Top Control Bar: Pills & Invite Button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Pills Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <PillButton
              label="All Members"
              count={approvedUsers.length}
              active={tab === "all"}
              onClick={() => setTab("all")}
            />
            <PillButton
              label="Online"
              count={onlineCount}
              active={tab === "online"}
              onClick={() => setTab("online")}
              icon={<span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
              badgeColor="bg-emerald-100 text-emerald-800"
            />
            <PillButton
              label="Admins"
              count={adminsCount}
              active={tab === "admins"}
              onClick={() => setTab("admins")}
              icon={<AdminShieldFavicon size={13} />}
              badgeColor="bg-indigo-100 text-indigo-900"
            />
            <PillButton
              label="Managers"
              count={managersCount}
              active={tab === "managers"}
              onClick={() => setTab("managers")}
              icon={<ManagerAvatarFavicon size={13} />}
              badgeColor="bg-blue-100 text-blue-900"
            />
            <PillButton
              label="VIP / Premium"
              count={premiumCount}
              active={tab === "premium"}
              onClick={() => setTab("premium")}
              icon={<span className="text-yellow-600 text-xs">💎</span>}
              badgeColor="bg-yellow-100 text-yellow-900"
            />
          </div>

          {/* Invite Action Button */}
          <GoldButton
            onClick={() => {
              setInviteOpen(true);
              setCopiedLink(false);
              setEmailSuccess(false);
            }}
            className="inline-flex items-center gap-1.5 shadow-sm text-xs font-bold py-2 px-4 cursor-pointer"
          >
            <UserPlus size={15} />
            <span>INVITE MEMBERS</span>
          </GoldButton>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search members by name, @username, role, or bio..."
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-9 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 rounded cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Members List Card */}
        <Card className="overflow-hidden border border-zinc-200 shadow-sm">
          <div className="bg-zinc-50/70 px-4 py-2.5 border-b border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span className="font-semibold text-zinc-700">
              Showing {filtered.length} of {approvedUsers.length} members
            </span>
            <span className="font-medium">
              {tab === "online"
                ? "Filtered: Online Now"
                : tab === "admins"
                  ? "Filtered: Staff Admins"
                  : tab === "managers"
                    ? "Filtered: Community Managers"
                    : tab === "premium"
                      ? "Filtered: VIP Members"
                      : "All Community Members"}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Users size={32} className="mx-auto text-zinc-300" />
              <p className="text-sm font-semibold text-zinc-700">No members found</p>
              <p className="text-xs text-zinc-400">
                {q
                  ? `No members match your search "${q}". Try clearing filters.`
                  : "No members currently match this category."}
              </p>
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="mt-2 text-xs font-semibold text-primary underline cursor-pointer"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {filtered.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-zinc-50/60 transition"
                >
                  {/* Member Details */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <Avatar user={m} size={48} />
                      {m.isOnline && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500"
                          title="Online now"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/profile?id=${m.id}`}
                          className="font-bold text-zinc-900 hover:text-primary transition"
                        >
                          {m.name}
                        </Link>
                        <UserRoleBadge role={m.role} isPremium={m.isPremium} size="xs" />
                      </div>

                      <p className="text-xs text-zinc-400 font-mono">@{m.username}</p>

                      {m.bio && (
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-600 leading-relaxed">
                          {m.bio}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                        {m.isOnline ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Online now
                          </span>
                        ) : (
                          <span>Offline</span>
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
                        {typeof m.points === "number" && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-zinc-700">
                              🏆 {m.points.toLocaleString()} pts
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {m.id !== user?.id ? (
                      <button
                        type="button"
                        onClick={() => setChatUserId(m.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-primary/40 px-3.5 py-1.5 text-xs font-bold text-zinc-700 hover:text-primary transition shadow-2xs cursor-pointer"
                      >
                        <MessageCircle size={14} className="text-primary" />
                        <span>CHAT</span>
                      </button>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-semibold text-zinc-500">
                        You
                      </span>
                    )}

                    <Link
                      href={`/profile?id=${m.id}`}
                      className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 p-2 text-zinc-500 hover:text-zinc-800 transition shadow-2xs"
                      title="View Member Profile"
                    >
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Sidebar />
      <ChatDrawer userId={chatUserId} onClose={() => setChatUserId(null)} />

      {/* Comprehensive Invite Members Modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite New Members"
        wide
      >
        <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
          {/* Top explainer */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900">
                Share Permanent Skills with your team & network
              </p>
              <p className="mt-0.5 text-xs text-zinc-600 leading-normal">
                Invited users can follow the link to the login/join portal, create an account, and get approved to join the community and masterminds.
              </p>
            </div>
          </div>

          {/* Section 1: Generated Invite Link */}
          <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                Generated Invite Link
              </label>

              {/* Destination selector toggle */}
              <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setInviteDestination("login")}
                  className={`rounded-md px-2.5 py-0.5 transition cursor-pointer ${
                    inviteDestination === "login"
                      ? "bg-primary text-white shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Redirect to Login
                </button>
                <button
                  type="button"
                  onClick={() => setInviteDestination("register")}
                  className={`rounded-md px-2.5 py-0.5 transition cursor-pointer ${
                    inviteDestination === "register"
                      ? "bg-primary text-white shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Direct Register
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                readOnly
                value={inviteUrl}
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-mono text-zinc-700 select-all outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition shadow-sm cursor-pointer shrink-0 ${
                  copiedLink
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-[#5051F9] hover:bg-[#4041d8]"
                }`}
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={15} />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            {copiedLink && (
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check size={13} />
                <span>Invite link copied to clipboard. Share it with whoever you want to join!</span>
              </p>
            )}

            <p className="text-[11px] text-zinc-500">
              {inviteDestination === "login"
                ? "💡 Directs to the Login Page with an invitation banner + 1-click option to create account & join."
                : "💡 Directs straight to the Account Application page with your referral attribution."}
            </p>
          </div>

          {/* Section 2: Direct Email Invitation Sender */}
          <form onSubmit={handleSendEmailInvite} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
              Send Direct Email Invite
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={emailBusy || !inviteEmail.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white transition shadow-sm cursor-pointer shrink-0"
              >
                <Mail size={14} />
                <span>{emailBusy ? "Sending..." : "Send Invite"}</span>
              </button>
            </div>

            {emailSuccess && (
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 size={14} />
                <span>Invitation recorded and dispatched successfully!</span>
              </p>
            )}
          </form>

          {/* Section 3: 1-Click Social Share */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Quick Share Via
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Join me on Permanent Skills Nexus: ${inviteUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 p-2.5 text-xs font-semibold text-zinc-700 transition shadow-2xs"
              >
                <span>💬 WhatsApp</span>
              </a>

              {/* Telegram */}
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(
                  "Join me on Permanent Skills Nexus"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 p-2.5 text-xs font-semibold text-zinc-700 transition shadow-2xs"
              >
                <span>✈️ Telegram</span>
              </a>

              {/* Email */}
              <a
                href={`mailto:?subject=${encodeURIComponent(
                  "Invitation to join Permanent Skills Nexus"
                )}&body=${encodeURIComponent(
                  `Hi,\n\nI'd like to invite you to join Permanent Skills Nexus.\n\nYou can access and create your account here: ${inviteUrl}\n\nBest regards,\n${user?.name || "Permanent Skills Member"}`
                )}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 p-2.5 text-xs font-semibold text-zinc-700 transition shadow-2xs col-span-2 sm:col-span-1"
              >
                <Mail size={13} />
                <span>Default Mail</span>
              </a>
            </div>
          </div>

          {/* Section 4: Your Personal Referral Code */}
          <div className="rounded-xl bg-zinc-50 p-3.5 border border-zinc-200 flex items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-zinc-800">Your Referral / Invite Code: </span>
              <span className="font-mono font-bold text-primary">{affiliateCode}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 px-2.5 py-1 rounded-lg shadow-2xs transition cursor-pointer"
            >
              {copiedCode ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copiedCode ? "Copied" : "Copy Code"}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
