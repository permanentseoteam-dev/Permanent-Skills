"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Crown,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Key,
  Lock,
  Mail,
  MapPin,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import {
  Avatar,
  Card,
  Field,
  PasswordInput,
  PrimaryButton,
  UserRoleBadge,
  inputClass,
} from "@/components/ui";
import { formatMoney, timeAgo } from "@/lib/format";

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

type SettingsTab = "profile" | "security" | "preferences" | "billing";

export default function SettingsPage() {
  const { user, updateProfile, changePassword, releaseMemberLogin } = useApp();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Profile Form State
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [language, setLanguage] = useState(user?.language || "English");
  const [profileBusy, setProfileBusy] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  // Preference notification toggles (client-persisted)
  const [notifyReplies, setNotifyReplies] = useState(true);
  const [notifyDMs, setNotifyDMs] = useState(true);
  const [notifyLiveEvents, setNotifyLiveEvents] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(false);

  // Feedback Notification Banner
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setBio(user.bio || "");
    setLocation(user.location || "");
    setLanguage(user.language || "English");
  }, [user]);

  // Auto-dismiss feedback message
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => {
      setFeedback(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [feedback]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ type: "error", text: "Please enter your full name." });
      return;
    }

    setProfileBusy(true);
    setFeedback(null);

    const res = await updateProfile({
      name: name.trim(),
      bio: bio.trim(),
      location: location.trim(),
      language,
    });

    setProfileBusy(false);

    if (res.ok) {
      setFeedback({ type: "success", text: "✓ Your profile information has been saved." });
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to update profile." });
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword) {
      setFeedback({ type: "error", text: "Please provide your current password." });
      return;
    }
    if (newPassword.length < 8) {
      setFeedback({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", text: "New passwords do not match." });
      return;
    }

    setPasswordBusy(true);
    setFeedback(null);

    const res = await changePassword(currentPassword, newPassword);
    setPasswordBusy(false);

    if (res.ok) {
      setFeedback({ type: "success", text: "✓ Your password has been successfully updated." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setFeedback({ type: "error", text: res.error || "Could not change password." });
    }
  }

  async function handleReleaseSession() {
    if (!user) return;
    const res = await releaseMemberLogin(user.id);
    if (res.ok) {
      setFeedback({ type: "success", text: "✓ Active device session lock released successfully." });
    } else {
      setFeedback({ type: "error", text: res.error || "Could not release device session." });
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* SECTION 1: HEADER & IDENTITY OVERVIEW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950">Settings & Preferences</h1>
            <span className="rounded-md bg-zinc-100 text-zinc-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-zinc-200">
              Account Center
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 leading-normal">
            Manage your personal profile, account credentials, notifications, and subscription plan.
          </p>
        </div>

        {user && (
          <Link
            href={`/profile/${user.id}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition self-start sm:self-auto cursor-pointer"
          >
            <span>View Public Profile</span>
            <ExternalLink size={12} className="text-zinc-400" />
          </Link>
        )}
      </div>

      {/* USER PROFILE MINI-BANNER */}
      {user && (
        <Card className="p-4 sm:p-5 border border-zinc-200 shadow-2xs bg-gradient-to-r from-zinc-50 via-white to-zinc-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <Avatar user={user} size={52} className="border-2 border-white shadow-xs shrink-0" showOnline />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-zinc-950 truncate">{user.name}</h2>
                  <UserRoleBadge role={user.role} isPremium={user.isPremium} size="xs" />
                  {user.isPremium && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 text-[10px] font-bold text-amber-700">
                      <Crown size={11} className="text-amber-500" /> VIP
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span className="font-mono text-zinc-700">@{user.username}</span>
                  <span>•</span>
                  <span className="font-mono text-zinc-500">{user.email}</span>
                  <span>•</span>
                  <span>{user.points || 0} Points</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center shrink-0 text-xs text-zinc-500">
              <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 border border-zinc-200/60">
                Joined {timeAgo(user.joinedAt)}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* GLOBAL FEEDBACK BANNER */}
      {feedback && (
        <div
          className={`rounded-2xl p-3.5 sm:p-4 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
            type="button"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* SECTION 2: RESPONSIVE TAB SLIDER */}
      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition whitespace-nowrap active:scale-95 cursor-pointer shrink-0 ${
              activeTab === "profile"
                ? "bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-900"
                : "bg-white ring-1 ring-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 shadow-2xs"
            }`}
          >
            <User size={14} className={activeTab === "profile" ? "text-white" : "text-zinc-400"} />
            <span>Profile & Bio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition whitespace-nowrap active:scale-95 cursor-pointer shrink-0 ${
              activeTab === "security"
                ? "bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-900"
                : "bg-white ring-1 ring-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 shadow-2xs"
            }`}
          >
            <Shield size={14} className={activeTab === "security" ? "text-white" : "text-zinc-400"} />
            <span>Security & Password</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("preferences")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition whitespace-nowrap active:scale-95 cursor-pointer shrink-0 ${
              activeTab === "preferences"
                ? "bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-900"
                : "bg-white ring-1 ring-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 shadow-2xs"
            }`}
          >
            <Bell size={14} className={activeTab === "preferences" ? "text-white" : "text-zinc-400"} />
            <span>Notifications & Preferences</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("billing")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition whitespace-nowrap active:scale-95 cursor-pointer shrink-0 ${
              activeTab === "billing"
                ? "bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-900"
                : "bg-white ring-1 ring-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 shadow-2xs"
            }`}
          >
            <Crown size={14} className={activeTab === "billing" ? "text-amber-400" : "text-amber-500"} />
            <span>Membership & Billing</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PROFILE & BIO */}
      {activeTab === "profile" && (
        <Card className="p-5 sm:p-6 border border-zinc-200 shadow-sm space-y-5">
          <div className="border-b border-zinc-100 pb-3">
            <h2 className="text-base font-black text-zinc-900 flex items-center gap-2">
              <User size={16} className="text-primary" /> Profile Information
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              This information is displayed publicly on your student profile and community discussions.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name *">
                <input
                  className={inputClass}
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>

              <Field label="Username / Profile Slug">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-400">@</span>
                  <input
                    className={`${inputClass} pl-8 bg-zinc-50/70 text-zinc-500 cursor-not-allowed`}
                    value={user?.username || ""}
                    disabled
                    readOnly
                    title="Usernames cannot be changed directly"
                  />
                </div>
                <p className="mt-1 text-[11px] text-zinc-400">Your unique public handle for mentions and links.</p>
              </Field>

              <Field label="Email Address">
                <input
                  className={`${inputClass} bg-zinc-50/70 text-zinc-500 cursor-not-allowed`}
                  type="email"
                  value={user?.email || ""}
                  disabled
                  readOnly
                  title="Contact administration to change your verified email"
                />
                <p className="mt-1 text-[11px] text-zinc-400">
                  Primary account email. To update, please submit a request to support.
                </p>
              </Field>

              <Field label="Location / City">
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    className={`${inputClass} pl-9`}
                    placeholder="e.g. San Francisco, CA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </Field>
            </div>

            <Field label="Preferred Language">
              <div className="relative max-w-sm">
                <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <select
                  className={`${inputClass} pl-9 cursor-pointer`}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </Field>

            <Field label="Bio & Background">
              <textarea
                className={`${inputClass} min-h-[100px] leading-relaxed`}
                placeholder="Share your goals, current projects, automation expertise, or background..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <p className="mt-1 text-[11px] text-zinc-400">
                Shown on your public profile card when community members view your contributions.
              </p>
            </Field>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
              <PrimaryButton
                type="submit"
                disabled={profileBusy}
                className="w-full sm:w-auto justify-center rounded-xl px-6 py-2.5 text-xs font-bold gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                {profileBusy ? "Saving Profile..." : "Save Profile Changes"}
              </PrimaryButton>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 2: SECURITY & PASSWORD */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <Card className="p-5 sm:p-6 border border-zinc-200 shadow-sm space-y-5">
            <div className="border-b border-zinc-100 pb-3">
              <h2 className="text-base font-black text-zinc-900 flex items-center gap-2">
                <Lock size={16} className="text-primary" /> Change Password
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Ensure your account is protected with a secure password of at least 8 characters.
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
              <Field label="Current Password *">
                <PasswordInput
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </Field>

              <Field label="New Password *">
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                />
              </Field>

              <Field label="Confirm New Password *">
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                />
              </Field>

              <div className="pt-2">
                <PrimaryButton
                  type="submit"
                  disabled={passwordBusy}
                  className="w-full sm:w-auto justify-center rounded-xl px-6 py-2.5 text-xs font-bold gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  {passwordBusy ? "Updating Password..." : "Update Password"}
                </PrimaryButton>
              </div>
            </form>
          </Card>

          {/* ACTIVE DEVICE SESSION STATUS */}
          <Card className="p-5 sm:p-6 border border-zinc-200 shadow-sm space-y-4 bg-zinc-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/60 pb-3">
              <div>
                <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600" /> Active Device Session & Protection
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Single-device concurrent session enforcement ensures your account credentials remain secure.
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 self-start sm:self-auto">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Active on this device
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-zinc-200/80 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Last Tracked IP</span>
                <p className="font-mono text-xs font-bold text-zinc-900">{user?.ipAddress || "127.0.0.1"}</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-zinc-200/80 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Logins</span>
                <p className="font-mono text-xs font-bold text-zinc-900">{user?.loginCount ?? 1} sessions recorded</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <p className="text-xs text-zinc-500 leading-normal">
                If you encounter login conflicts when switching devices, you can manually release your previous session.
              </p>
              <button
                type="button"
                onClick={handleReleaseSession}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition shadow-2xs cursor-pointer shrink-0"
              >
                <RefreshCw size={13} />
                <span>Reset Device Lock</span>
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: NOTIFICATIONS & PREFERENCES */}
      {activeTab === "preferences" && (
        <Card className="p-5 sm:p-6 border border-zinc-200 shadow-sm space-y-5">
          <div className="border-b border-zinc-100 pb-3">
            <h2 className="text-base font-black text-zinc-900 flex items-center gap-2">
              <Bell size={16} className="text-primary" /> Community & Email Notifications
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Choose what notifications you receive inside the platform and to your registered email address.
            </p>
          </div>

          <div className="divide-y divide-zinc-100 space-y-1">
            <div className="flex items-center justify-between py-3 gap-3">
              <div>
                <p className="text-xs font-bold text-zinc-900">Post Replies & Comments</p>
                <p className="text-[11px] text-zinc-500">Notify me when someone replies to my post or comments on my discussion.</p>
              </div>
              <input
                type="checkbox"
                checked={notifyReplies}
                onChange={(e) => setNotifyReplies(e.target.checked)}
                className="h-4 w-4 rounded-md border-zinc-300 text-primary cursor-pointer shrink-0"
              />
            </div>

            <div className="flex items-center justify-between py-3 gap-3">
              <div>
                <p className="text-xs font-bold text-zinc-900">Direct Messages & Mentions</p>
                <p className="text-[11px] text-zinc-500">Receive in-app alerts when a peer or mentor sends a direct message.</p>
              </div>
              <input
                type="checkbox"
                checked={notifyDMs}
                onChange={(e) => setNotifyDMs(e.target.checked)}
                className="h-4 w-4 rounded-md border-zinc-300 text-primary cursor-pointer shrink-0"
              />
            </div>

            <div className="flex items-center justify-between py-3 gap-3">
              <div>
                <p className="text-xs font-bold text-zinc-900">Live Mastermind & Workshop Alerts</p>
                <p className="text-[11px] text-zinc-500">Remind me 5 minutes before scheduled live Zoom and Q&A sessions begin.</p>
              </div>
              <input
                type="checkbox"
                checked={notifyLiveEvents}
                onChange={(e) => setNotifyLiveEvents(e.target.checked)}
                className="h-4 w-4 rounded-md border-zinc-300 text-primary cursor-pointer shrink-0"
              />
            </div>

            <div className="flex items-center justify-between py-3 gap-3">
              <div>
                <p className="text-xs font-bold text-zinc-900">Weekly Community Digest</p>
                <p className="text-[11px] text-zinc-500">Send a weekly roundup of top discussions, student wins, and newly released lessons.</p>
              </div>
              <input
                type="checkbox"
                checked={notifyDigest}
                onChange={(e) => setNotifyDigest(e.target.checked)}
                className="h-4 w-4 rounded-md border-zinc-300 text-primary cursor-pointer shrink-0"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-zinc-100">
            <PrimaryButton
              type="button"
              onClick={() => setFeedback({ type: "success", text: "✓ Notification preferences saved." })}
              className="w-full sm:w-auto justify-center rounded-xl px-6 py-2.5 text-xs font-bold gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              Save Notification Preferences
            </PrimaryButton>
          </div>
        </Card>
      )}

      {/* TAB 4: MEMBERSHIP & BILLING */}
      {activeTab === "billing" && (
        <div className="space-y-6">
          <Card className="p-5 sm:p-6 border border-zinc-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
              <div>
                <h2 className="text-base font-black text-zinc-900 flex items-center gap-2">
                  <CreditCard size={16} className="text-primary" /> Active Membership Plan
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Your current tier and benefits in Permanent Skill Strategy.
                </p>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                  user?.isPremium
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-blue-100 text-blue-900 border border-blue-300"
                }`}
              >
                {user?.isPremium ? (
                  <>
                    <Crown size={13} className="text-amber-600" />
                    <span>VIP Mastermind Pass</span>
                  </>
                ) : (
                  <>
                    <Zap size={13} className="text-blue-600" />
                    <span>Academy Standard</span>
                  </>
                )}
              </span>
            </div>

            <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/50 p-4 sm:p-5 space-y-3">
              <h3 className="text-sm font-black text-zinc-900">Your Plan Privileges:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-zinc-700">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Full access to community discussions & feeds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Direct messaging with students & peers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Interactive leaderboard leveling system</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>{user?.isPremium ? "Full VIP Course catalog unlocked" : "Standard foundation modules"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>{user?.isPremium ? "Weekly live Mastermind Zoom calls" : "Public webinar replays"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Partner program with 40% commissions</span>
                </div>
              </div>
            </div>

            {!user?.isPremium && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-amber-950 flex items-center gap-1.5">
                    <Sparkles size={15} className="text-amber-600" /> Upgrade to The Daily Pulse VIP Mastermind
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed max-w-md">
                    Unlock all video courses, private specialist mastermind sessions, and weekly live consultation workshops.
                  </p>
                </div>
                <Link
                  href="/all-courses"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-xs font-black text-zinc-950 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Crown size={14} />
                  <span>Explore VIP Upgrade</span>
                </Link>
              </div>
            )}
          </Card>

          {/* AFFILIATE PROGRAM SHORTCUT */}
          <Card className="p-5 sm:p-6 border border-zinc-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                  <Users size={16} className="text-primary" /> Partner & Referral Program
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Earn up to 40% recurring commissions when colleagues join through your personal partner link.
                </p>
              </div>

              <Link
                href="/affiliates"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition self-start sm:self-auto cursor-pointer"
              >
                <span>Affiliate Dashboard</span>
                <ExternalLink size={12} className="text-zinc-400" />
              </Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
