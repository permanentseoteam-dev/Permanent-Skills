"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Award,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Crown,
  DollarSign,
  ExternalLink,
  Gift,
  Globe,
  HelpCircle,
  Mail,
  MessageCircle,
  MousePointerClick,
  Percent,
  Send,
  Share2,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { Avatar, Card, PrimaryButton, UserRoleBadge } from "@/components/ui";
import { formatMoney, timeAgo } from "@/lib/format";

export default function AffiliatesPage() {
  const { user, users, sales } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSwipeId, setCopiedSwipeId] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [landingType, setLandingType] = useState<"apply" | "register" | "vip">("register");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const affiliateCode = user?.affiliateCode || user?.username || "partner";

  const referralLink = useMemo(() => {
    const base = origin || "https://permanentskills.com";
    if (landingType === "apply") {
      return `${base}/apply?ref=${affiliateCode}`;
    }
    if (landingType === "vip") {
      return `${base}/all-courses?ref=${affiliateCode}`;
    }
    return `${base}/register?ref=${affiliateCode}`;
  }, [origin, affiliateCode, landingType]);

  // Tracked referred users from current community pool
  const referredUsers = useMemo(() => {
    if (!user) return [];
    return users.filter(
      (u) =>
        u.id !== user.id &&
        (u.referredBy === affiliateCode ||
          u.referredBy === user.id ||
          u.application?.howHeard?.toLowerCase().includes(user.name.toLowerCase()) ||
          u.application?.howHeard?.toLowerCase().includes(affiliateCode.toLowerCase()))
    );
  }, [users, user, affiliateCode]);

  // Derived stats with fallbacks
  const clicks = user?.affiliateClicks ?? 0;
  const signups = Math.max(user?.affiliateSignups ?? 0, referredUsers.length);
  const earnings = user?.affiliateEarnings ?? signups * 9;
  const conversionRate = clicks > 0 ? ((signups / clicks) * 100).toFixed(1) : signups > 0 ? "100.0" : "0.0";

  async function copyToClipboard(text: string, isSwipeId?: string) {
    try {
      await navigator.clipboard.writeText(text);
      if (isSwipeId) {
        setCopiedSwipeId(isSwipeId);
        setTimeout(() => setCopiedSwipeId(null), 2500);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      // Fallback
    }
  }

  // Pre-written promotional copy for one-click sharing
  const swipeCopies = useMemo(
    () => [
      {
        id: "swipe-1",
        title: "Twitter / X Post",
        icon: Share2,
        platform: "X / Twitter",
        text: `Leveling up my AI, automations, and digital business systems inside Permanent Skill Strategy. Join the private mastermind community with me: ${referralLink} 🚀`,
      },
      {
        id: "swipe-2",
        title: "LinkedIn & Professional Post",
        icon: Globe,
        platform: "LinkedIn",
        text: `If you're building modern AI agents, automated workflows with Make/n8n, and scaling high-yield digital assets, check out Permanent Skill Strategy. Highly recommended community & academy: ${referralLink}`,
      },
      {
        id: "swipe-3",
        title: "Direct WhatsApp / Telegram Message",
        icon: MessageCircle,
        platform: "WhatsApp / Direct",
        text: `Hey! I'm learning inside Permanent Skill Strategy. They offer weekly live mastermind workshops, complete video curricula, and private consultant networking. Join here: ${referralLink}`,
      },
    ],
    [referralLink]
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* SECTION 1: HEADER & PROGRAM HIGHLIGHT */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900">Affiliate & Partner Hub</h1>
            <span className="rounded-full bg-emerald-500/10 text-emerald-700 px-2.5 py-0.5 text-xs font-bold border border-emerald-200">
              ⚡ 40% Partner Commission
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 leading-normal">
            Share Permanent Skill Strategy with your audience and earn continuous payouts when peers enroll in VIP and premium masterclasses.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 rounded-xl bg-zinc-900 text-white px-3.5 py-2 text-xs font-bold shadow-2xs">
            <Award size={14} className="text-amber-400" />
            <span>Code: <strong className="font-mono text-amber-300">{affiliateCode}</strong></span>
          </span>
        </div>
      </div>

      {/* SECTION 2: STATS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Earnings Card */}
        <Card className="p-4 sm:p-5 border-emerald-200 bg-linear-to-br from-emerald-50/60 to-white shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Total Earnings</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <DollarSign size={15} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-emerald-700">{formatMoney(earnings)}</p>
            <p className="text-[11px] text-emerald-600/80 mt-0.5 font-medium">Ready for monthly payout</p>
          </div>
        </Card>

        {/* Link Clicks Card */}
        <Card className="p-4 sm:p-5 border-zinc-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Link Clicks</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
              <MousePointerClick size={15} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-zinc-900">{clicks}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Unique tracked visits</p>
          </div>
        </Card>

        {/* Successful Signups */}
        <Card className="p-4 sm:p-5 border-zinc-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Referrals Joined</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserCheck size={15} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-zinc-900">{signups}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Verified student accounts</p>
          </div>
        </Card>

        {/* Conversion Rate */}
        <Card className="p-4 sm:p-5 border-zinc-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Conversion Rate</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Percent size={14} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-zinc-900">{conversionRate}%</p>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Clicks to registration</p>
          </div>
        </Card>
      </div>

      {/* SECTION 3: REFERRAL LINK GENERATOR & SOCIAL SHARING */}
      <Card className="p-5 sm:p-6 border border-zinc-200 shadow-sm space-y-4 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-base font-black text-zinc-950 flex items-center gap-2">
              <Share2 size={18} className="text-primary" /> Your Unique Referral Link
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Copy this link or share directly across social channels. Anyone who joins via your link is permanently tagged to your partner account.
            </p>
          </div>

          {/* Landing Target Selector */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-zinc-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLandingType("register")}
              className={`rounded-lg px-2.5 py-1 transition cursor-pointer text-[11px] ${
                landingType === "register" ? "bg-white text-zinc-900 shadow-2xs font-bold" : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Registration
            </button>
            <button
              type="button"
              onClick={() => setLandingType("apply")}
              className={`rounded-lg px-2.5 py-1 transition cursor-pointer text-[11px] ${
                landingType === "apply" ? "bg-white text-zinc-900 shadow-2xs font-bold" : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Application
            </button>
            <button
              type="button"
              onClick={() => setLandingType("vip")}
              className={`rounded-lg px-2.5 py-1 transition cursor-pointer text-[11px] ${
                landingType === "vip" ? "bg-white text-zinc-900 shadow-2xs font-bold" : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              VIP Catalog
            </button>
          </div>
        </div>

        {/* Copy Link Input Strip */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <input
              readOnly
              value={referralLink}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 py-2.5 pl-3.5 pr-10 font-mono text-xs text-zinc-800 outline-none select-all"
            />
          </div>

          <PrimaryButton
            onClick={() => copyToClipboard(referralLink)}
            className="rounded-xl px-5 py-2.5 text-xs font-bold gap-1.5 justify-center shadow-sm cursor-pointer active:scale-95 shrink-0"
          >
            {copiedLink ? (
              <>
                <Check size={14} className="text-emerald-300" /> Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy size={14} /> Copy Partner Link
              </>
            )}
          </PrimaryButton>
        </div>

        {/* Quick Social Share Triggers */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mr-1">Share via:</span>

          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              `Learning digital assets & AI automation with Permanent Skill Strategy. Join here: ${referralLink}`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition cursor-pointer shadow-2xs"
          >
            <Share2 size={13} className="text-zinc-700" /> X / Twitter
          </a>

          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              `Hey! Check out Permanent Skill Strategy academy & mastermind: ${referralLink}`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition cursor-pointer shadow-2xs"
          >
            <MessageCircle size={13} className="text-emerald-600" /> WhatsApp
          </a>

          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition cursor-pointer shadow-2xs"
          >
            <Globe size={13} className="text-blue-600" /> LinkedIn
          </a>

          <a
            href={`mailto:?subject=${encodeURIComponent("Join Permanent Skill Strategy with me")}&body=${encodeURIComponent(
              `Hi,\n\nI thought you'd be interested in Permanent Skill Strategy. Check out the platform and join here: ${referralLink}\n\nBest,`
            )}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition cursor-pointer shadow-2xs"
          >
            <Mail size={13} className="text-zinc-500" /> Email
          </a>
        </div>
      </Card>

      {/* SECTION 4: 3-STEP HOW IT WORKS */}
      <div className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-zinc-500">How the Partner Program Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-4 sm:p-5 border-zinc-200 space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-black text-sm">
              1
            </div>
            <h3 className="font-black text-sm text-zinc-900">Share Your Link</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Place your link on your social profiles, newsletter, YouTube descriptions, or send directly to friends.
            </p>
          </Card>

          <Card className="p-4 sm:p-5 border-zinc-200 space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-black text-sm">
              2
            </div>
            <h3 className="font-black text-sm text-zinc-900">Students Enroll & Learn</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              When applicants register or purchase masterclasses, their cookie is tracked to your affiliate profile.
            </p>
          </Card>

          <Card className="p-4 sm:p-5 border-zinc-200 space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-black text-sm">
              3
            </div>
            <h3 className="font-black text-sm text-zinc-900">Get Paid Automatically</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Earn $9 to $99 per upgrade. Commissions are paid out directly via Bank Transfer, PayPal, or Crypto.
            </p>
          </Card>
        </div>
      </div>

      {/* SECTION 5: READY-TO-USE PROMO SWIPE COPY */}
      <Card className="p-5 sm:p-6 border border-zinc-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" /> Ready-to-Use Promo Swipes
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Tested high-converting social copy. Click any swipe to copy with your referral link pre-formatted.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {swipeCopies.map((swipe) => {
            const IconComponent = swipe.icon;
            const isCopied = copiedSwipeId === swipe.id;

            return (
              <div
                key={swipe.id}
                className="rounded-2xl border border-zinc-200/90 bg-zinc-50/40 p-4 space-y-2.5 transition hover:bg-zinc-50/80"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <IconComponent size={14} className="text-zinc-600" />
                    {swipe.title}
                  </span>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(swipe.text, swipe.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check size={12} className="text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy Text
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-zinc-700 bg-white p-3 rounded-xl border border-zinc-200/70 leading-relaxed font-sans select-all">
                  {swipe.text}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* SECTION 6: REFERRED MEMBERS ACTIVITY LIST */}
      <Card className="p-5 sm:p-6 border border-zinc-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
              <Users size={16} className="text-primary" /> Referred Students & Network ({referredUsers.length})
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Community members who registered using your partner link.
            </p>
          </div>
        </div>

        {referredUsers.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 border border-dashed border-zinc-200 rounded-2xl space-y-2">
            <UserPlus size={32} className="mx-auto text-zinc-300" />
            <p className="text-sm font-bold text-zinc-700">No referrals logged yet</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Share your partner link with colleagues or on social media to see your referred students appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 pb-2">
                <tr>
                  <th className="py-2">Student</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="text-right pr-2">Commission Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {referredUsers.map((refUser) => (
                  <tr key={refUser.id} className="hover:bg-zinc-50/60 transition">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar user={refUser} size={32} />
                        <div>
                          <p className="font-bold text-zinc-900">{refUser.name}</p>
                          <p className="text-[11px] font-mono text-zinc-400">@{refUser.username}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <UserRoleBadge role={refUser.role} isPremium={refUser.isPremium} size="xs" />
                    </td>
                    <td className="text-zinc-500">{timeAgo(refUser.joinedAt)}</td>
                    <td className="text-right pr-2 font-bold text-emerald-600">
                      {refUser.isPremium ? "+$9.00" : "+$0.00"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* SECTION 7: PAYOUT DETAILS & FAQ */}
      <Card className="p-5 sm:p-6 border border-zinc-200 shadow-sm space-y-3 bg-zinc-50/40">
        <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
          <HelpCircle size={15} className="text-primary" /> Affiliate Payout Guidelines & FAQ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-600 pt-1 leading-relaxed">
          <div className="space-y-1">
            <h4 className="font-bold text-zinc-800">When do affiliate payouts occur?</h4>
            <p>Payouts are processed on the 1st and 15th of every month for all balances above $25.</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-zinc-800">How do I set my payout method?</h4>
            <p>Go to your Account Settings to enter your preferred PayPal address, Bank wire details, or USDT wallet.</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-zinc-800">How long is the tracking cookie?</h4>
            <p>Referral cookies last 90 days. If someone clicks your link and enrolls within 90 days, you earn commission.</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-zinc-800">Can I promote custom landing pages?</h4>
            <p>Yes, use the landing target selector at the top to direct your audience to Registration, Application, or Catalog.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
