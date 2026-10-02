"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Flame,
  Globe,
  Heart,
  HelpCircle,
  Info,
  Layers,
  Lock,
  MapPin,
  MessageCircle,
  Play,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Sidebar } from "@/components/Sidebar";
import {
  Avatar,
  Card,
  GoldButton,
  Modal,
  PrimaryButton,
  UserRoleBadge,
  inputClass,
} from "@/components/ui";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ChatDrawer } from "@/components/ChatDrawer";
import { timeAgo } from "@/lib/format";
import { toEmbed } from "@/lib/video";
import type { PublicUser, Review } from "@/lib/types";

const PILLARS = [
  {
    icon: <Target className="text-amber-500" size={24} />,
    title: "Durable Skills Architecture",
    description:
      "Master high-yield digital competencies that never decay. Learn systemic SEO, topical authority graphs, and permanent content engines built to compound value.",
  },
  {
    icon: <Zap className="text-indigo-500" size={24} />,
    title: "AI Systems & Autonomous Workflows",
    description:
      "Integrate next-generation AI agents, automated pipelines, and structured prompt frameworks to 10x your output and execute at scale.",
  },
  {
    icon: <TrendingUpIcon className="text-emerald-500" size={24} />,
    title: "Offer & Retention Engineering",
    description:
      "Package high-ticket consulting, productized services, and recurring subscriber retention playbooks designed for durable client acquisition.",
  },
  {
    icon: <Layers className="text-purple-500" size={24} />,
    title: "Battle-Tested SOPs & Swipe Files",
    description:
      "Immediate access to Figma component design systems, Notion operating cadences, Google Sheet model calculators, and client onboarding templates.",
  },
];

const INCLUDED_FEATURES = [
  "Comprehensive step-by-step video courses from foundational to advanced mastery",
  "Weekly live strategy workshops, live teardowns, and interactive member hot seats",
  "Permanent Skill topic cluster mapping, internal linking graphs, and keyword frameworks",
  "Direct networking and collaboration with vetted agency operators, founders, and specialists",
  "Gamified skill progression tiers with unlockable perks, badges, and secret masterminds",
  "Bonus Vault with Figma swipe files, prompt templates, and retention workflows",
  "Private mastermind channels and direct peer messaging",
  "Continuous content updates and new course drops as market dynamics evolve",
];

const HOUSE_RULES = [
  {
    title: "Give Value Before Asking",
    desc: "Share real case studies, breakdowns, and insights. The room thrives when everyone contributes.",
  },
  {
    title: "Zero Spam & Pitching",
    desc: "No unsolicited DM pitches or affiliate spam. High signal, zero noise is strictly enforced.",
  },
  {
    title: "Confidentiality & Respect",
    desc: "Strategies and numbers shared during teardowns stay private within the academy.",
  },
  {
    title: "Constructive Peer Support",
    desc: "Provide thoughtful feedback, celebrate peer wins, and lift each other up.",
  },
];

function TrendingUpIcon(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  const size = props.size || 24;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

export default function AboutPage() {
  const { reviews, users, user, courses, posts, userById, addReview, activeCommunity } = useApp();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);

  // Review form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);

  // Community metrics calculation
  const approvedMembers = useMemo(
    () => users.filter((u) => u.role === "admin" || u.role === "manager" || u.status === "approved" || typeof u.status === "undefined"),
    [users]
  );

  const avgRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return 5.0;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }, [reviews]);

  // Star distribution breakdown
  const starBreakdown = useMemo(() => {
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((r) => Math.round(r.rating) === star).length;
      const percentage = Math.round((count / total) * 100);
      return { star, count, percentage };
    });
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    if (selectedStarFilter === null) return reviews;
    return reviews.filter((r) => Math.round(r.rating) === selectedStarFilter);
  }, [reviews, selectedStarFilter]);

  // Community Leadership & Instructors
  const leadership = useMemo(() => {
    return approvedMembers.filter((u) => u.role === "admin" || u.role === "manager").slice(0, 4);
  }, [approvedMembers]);

  // Handle Review Submission
  async function handlePostReview(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      setReviewMsg({ type: "error", text: "Please write a few words about your experience." });
      return;
    }
    setReviewBusy(true);
    setReviewMsg(null);

    const result = await addReview(rating, body.trim());
    setReviewBusy(false);
    if (!result.ok) {
      setReviewMsg({ type: "error", text: result.error || "Could not post review." });
      return;
    }
    setBody("");
    setReviewMsg({
      type: "success",
      text: "Thank you! Your review was posted and 5 points were added to your profile.",
    });
  }

  const isTeamHub = activeCommunity?.type === "team";
  const communityName = activeCommunity?.name || "Permanent Skills Academy";
  const introVideoUrl = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";
  const embed = toEmbed(introVideoUrl);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-6">
        {/* SECTION 1: HERO SHOWCASE BANNER & COMMUNITY IDENTITY */}
        <Card className="relative overflow-hidden border border-zinc-200/80 bg-white p-6 shadow-sm">
          {/* Header Title & Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-md bg-zinc-950 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300 border border-amber-500/40">
                  {isTeamHub ? "Specialists Hub" : "Permanent Skills"}
                </span>
                <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 border border-zinc-200">
                  Private Academy
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 border border-amber-200">
                  <Star size={11} className="text-amber-500 fill-amber-500" /> {avgRating.toFixed(1)} ({reviews.length} reviews)
                </span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
                {isTeamHub ? "Team Specialists Hub" : "Permanent Skills Academy"}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
                {activeCommunity?.description ||
                  "A private, high-signal academy and operating community for mastering durable digital systems, SEO compounding, autonomous AI agents, and high-value skill architecture."}
              </p>
            </div>

            {/* Upgrade or Status Action */}
            <div className="shrink-0 self-start sm:self-center">
              {!user?.isPremium && (
                <GoldButton onClick={() => setUpgradeOpen(true)} className="rounded-xl px-4 py-2 text-xs shadow-sm">
                  <Crown size={14} className="mr-1.5 inline-block" /> Upgrade to Premium
                </GoldButton>
              )}
            </div>
          </div>

          {/* Interactive Hero Media Banner */}
          <div className="group relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a142c] via-[#102a5c] to-[#1e3a8a] p-8 sm:p-10 text-white shadow-lg">
            <div className="relative z-10 max-w-md">
              <span className="inline-block rounded-full bg-amber-400/20 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-300 border border-amber-400/30">
                ★ Core Methodology
              </span>
              <h2 className="mt-3 text-2xl sm:text-4xl font-black uppercase tracking-tight leading-none text-white">
                DURABLE SKILLS. REAL COMPOUNDING.
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed">
                No fleeting hacks or algorithmic tricks. Master repeatable, high-leverage frameworks that yield compounded returns over time.
              </p>
            </div>

            {/* Video Play Button */}
            <button
              onClick={() => setVideoOpen(true)}
              className="absolute bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-amber-400 active:scale-95 cursor-pointer group-hover:ring-4 group-hover:ring-white/30"
              title="Watch Academy Video Overview"
            >
              <Play size={24} className="ml-1 fill-current text-zinc-950" />
            </button>
          </div>

          {/* Fast Facts Bar */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-zinc-100 pt-5 text-center">
            <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Active Members</span>
              <p className="text-lg font-black text-zinc-900">{approvedMembers.length}+</p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Classroom Modules</span>
              <p className="text-lg font-black text-primary">{courses.length} Courses</p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Member Rating</span>
              <p className="text-lg font-black text-amber-600 flex items-center justify-center gap-1">
                <Star size={16} className="fill-amber-500 text-amber-500" /> {avgRating.toFixed(1)} / 5.0
              </p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Community Wins</span>
              <p className="text-lg font-black text-emerald-600">{posts.length}+ Posts</p>
            </div>
          </div>
        </Card>

        {/* SECTION 2: THE 4 PILLARS OF PERMANENT SKILLS */}
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-black text-zinc-900">The 4 Pillars of Permanent Skills</h2>
            <p className="text-xs text-zinc-500">How our curriculum is structured to build compounding, antifragile operators.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PILLARS.map((p, idx) => (
              <Card key={idx} className="p-5 space-y-2.5 transition hover:shadow-md border-zinc-200/80">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 shadow-2xs">
                    {p.icon}
                  </div>
                  <h3 className="text-sm font-black text-zinc-900">{p.title}</h3>
                </div>
                <p className="text-xs leading-relaxed text-zinc-600">{p.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* SECTION 3: WHAT'S INCLUDED IN THE ACADEMY */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CheckCircle2 size={18} />
            </span>
            <div>
              <h2 className="text-base font-black text-zinc-900">What&apos;s Included in Your Membership</h2>
              <p className="text-xs text-zinc-500">Everything you unlock inside the Permanent Skills platform.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {INCLUDED_FEATURES.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 rounded-xl bg-zinc-50/70 p-3 border border-zinc-200/60 text-xs text-zinc-700">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-black">
                  ✓
                </span>
                <span className="font-medium leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* SECTION 4: COMMUNITY LEADERSHIP & INSTRUCTORS */}
        {leadership.length > 0 && (
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-black text-zinc-900">Academy Leadership & Instructors</h2>
              <p className="text-xs text-zinc-500">Experienced operators leading teardowns, live workshops, and classroom discussions.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {leadership.map((leader) => (
                <Card key={leader.id} className="p-4 flex items-start gap-3.5 transition hover:shadow-md">
                  <Link href={`/profile/${leader.id}`} className="shrink-0">
                    <Avatar user={leader} size={52} className="border-2 border-zinc-200 hover:ring-2 hover:ring-primary transition" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link href={`/profile/${leader.id}`} className="font-bold text-zinc-950 hover:text-primary transition truncate text-sm">
                        {leader.name}
                      </Link>
                      <UserRoleBadge role={leader.role} isPremium={leader.isPremium} size="xs" />
                    </div>
                    <p className="text-xs text-zinc-400 font-medium">@{leader.username}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-600 leading-relaxed">
                      {leader.bio || "Academy instructor and digital systems specialist."}
                    </p>
                    {leader.id !== user?.id && (
                      <button
                        onClick={() => setChatId(leader.id)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        <MessageCircle size={13} /> Direct Message
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 5: COMMUNITY GUIDELINES & HOUSE RULES */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h2 className="text-base font-black text-zinc-900">Community Code of Conduct</h2>
              <p className="text-xs text-zinc-500">Guidelines that maintain a supportive, high-signal learning environment.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {HOUSE_RULES.map((rule, idx) => (
              <div key={idx} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 space-y-1">
                <p className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[10px] text-white">
                    {idx + 1}
                  </span>
                  {rule.title}
                </p>
                <p className="text-xs text-zinc-600 leading-relaxed pl-5.5">{rule.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* SECTION 6: MEMBERSHIP PLANS & VIP UPGRADE */}
        <Card className="p-6 space-y-4 relative overflow-hidden border border-zinc-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="rounded-full bg-amber-100 px-3 py-0.5 text-[10px] font-black uppercase text-amber-800 border border-amber-300">
                Membership Status
              </span>
              <h2 className="mt-2 text-xl font-black text-zinc-900">
                {user?.isPremium ? "You Have Premium VIP Access" : "Standard Community Membership"}
              </h2>
              <p className="mt-1 text-xs text-zinc-600 max-w-lg">
                {user?.isPremium
                  ? "All courses, live call replays, premium masterminds, and bonus vaults are currently unlocked on your account."
                  : "Upgrade to Premium for $9/month to instantly unlock secret masterminds, advanced teardowns, and VIP perks."}
              </p>
            </div>

            <div className="shrink-0">
              {user?.isPremium ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-center">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <Check size={14} /> VIP Active
                  </span>
                </div>
              ) : (
                <GoldButton onClick={() => setUpgradeOpen(true)} className="rounded-xl px-5 py-2.5 text-xs font-bold shadow-sm">
                  Upgrade to VIP ($9/mo)
                </GoldButton>
              )}
            </div>
          </div>
        </Card>

        {/* SECTION 7: INTERACTIVE REVIEWS & TESTIMONIALS */}
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 pb-5">
            <div>
              <h2 className="text-xl font-black text-zinc-900">Member Reviews & Testimonials</h2>
              <p className="text-xs text-zinc-500">Real feedback from students, founders, and specialists in the academy.</p>
            </div>

            {/* Score Summary Badge */}
            <div className="flex items-center gap-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3">
              <div className="text-center">
                <span className="text-2xl font-black text-amber-700">{avgRating.toFixed(1)}</span>
                <p className="text-[10px] font-semibold text-amber-600">out of 5.0</p>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-0.5 text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      className={s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-zinc-300"}
                    />
                  ))}
                </div>
                <p className="text-xs font-semibold text-zinc-600">{reviews.length} total reviews</p>
              </div>
            </div>
          </div>

          {/* Star Distribution Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/60 p-4 rounded-2xl border border-zinc-200/60">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-zinc-700">Rating Breakdown</span>
              {starBreakdown.map((b) => (
                <button
                  key={b.star}
                  type="button"
                  onClick={() => setSelectedStarFilter(selectedStarFilter === b.star ? null : b.star)}
                  className={`flex w-full items-center gap-2 text-xs transition p-1 rounded-lg ${
                    selectedStarFilter === b.star ? "bg-amber-100/70 font-bold" : "hover:bg-zinc-100"
                  }`}
                >
                  <span className="w-12 text-left font-semibold text-zinc-600">{b.star} stars</span>
                  <div className="flex-1 bg-zinc-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${b.percentage}%` }} />
                  </div>
                  <span className="w-8 text-right font-medium text-zinc-500">{b.count}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col justify-center space-y-2 text-xs text-zinc-600 sm:border-l sm:border-zinc-200 sm:pl-4">
              <p className="font-bold text-zinc-900 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" /> Share Your Experience
              </p>
              <p className="leading-relaxed">
                Post an honest review of the classroom, live calls, or community to earn <strong>+5 points</strong> on your profile and help other members.
              </p>
              {selectedStarFilter !== null && (
                <button
                  onClick={() => setSelectedStarFilter(null)}
                  className="text-left font-bold text-primary hover:underline text-xs"
                >
                  Clear star filter (showing {selectedStarFilter}-star only)
                </button>
              )}
            </div>
          </div>

          {/* Write a Review Interactive Form */}
          <form onSubmit={handlePostReview} className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800">Leave Your Rating</span>

              {/* Star Picker */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(s)}
                    className="p-1 transition-transform hover:scale-110 cursor-pointer"
                    title={`${s} Star${s > 1 ? "s" : ""}`}
                  >
                    <Star
                      size={20}
                      className={
                        s <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-300"
                      }
                    />
                  </button>
                ))}
                <span className="ml-1 text-xs font-bold text-zinc-700">{rating} / 5</span>
              </div>
            </div>

            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="What do you think about the curriculum, modules, or live calls? Write your review here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />

            {reviewMsg && (
              <p
                className={`rounded-xl p-2.5 text-xs font-semibold ${
                  reviewMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {reviewMsg.text}
              </p>
            )}

            <div className="flex items-center justify-end">
              <PrimaryButton disabled={reviewBusy} type="submit" className="rounded-xl px-5 py-2 text-xs font-bold gap-1.5 shadow-sm">
                <Send size={13} /> {reviewBusy ? "Posting..." : "Post Review (+5 pts)"}
              </PrimaryButton>
            </div>
          </form>

          {/* Reviews List */}
          <div className="space-y-3 pt-2">
            {filteredReviews.length === 0 ? (
              <div className="p-8 text-center text-zinc-400">
                <p className="text-xs font-semibold">No reviews found for this star filter.</p>
                <button
                  onClick={() => setSelectedStarFilter(null)}
                  className="mt-2 text-xs font-bold text-primary hover:underline"
                >
                  View All Reviews
                </button>
              </div>
            ) : (
              filteredReviews.map((r) => {
                const author = userById(r.userId);

                return (
                  <div key={r.id} className="flex gap-3.5 rounded-2xl border border-zinc-100 bg-zinc-50/40 p-4 transition hover:bg-zinc-50">
                    <Link href={`/profile/${r.userId}`} className="shrink-0">
                      <Avatar user={author} size={42} className="border-2 border-zinc-200" />
                    </Link>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link href={`/profile/${r.userId}`} className="text-xs font-bold text-zinc-900 hover:text-primary transition">
                            {author?.name || "Verified Member"}
                          </Link>
                          {author && <UserRoleBadge role={author.role} isPremium={author.isPremium} size="xs" />}
                        </div>

                        <span className="text-[11px] text-zinc-400 font-medium">{timeAgo(r.createdAt)}</span>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={12}
                            className={s <= r.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"}
                          />
                        ))}
                      </div>

                      <p className="text-xs leading-relaxed text-zinc-700 pt-1">{r.body}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Sidebar with Leaderboard and Stats */}
      <Sidebar />

      {/* Video Introduction Modal */}
      <Modal open={videoOpen} onClose={() => setVideoOpen(false)} title="Permanent Skills Introduction" wide>
        <div className="space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg">
            {embed ? (
              <iframe
                src={embed.src}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Permanent Skills Video Overview"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white text-sm">
                Video player unavailable
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900">Welcome to Permanent Skills Academy</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Watch this walkthrough to learn how our course pathways, weekly sprint calls, topic clusters, and community networking work together to accelerate your growth.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
            <Link
              href="/classroom"
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-dark transition"
            >
              Go to Classroom →
            </Link>
          </div>
        </div>
      </Modal>

      {/* Upgrade to Premium Modal */}
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      {/* Direct Chat Drawer */}
      <ChatDrawer userId={chatId} onClose={() => setChatId(null)} />
    </div>
  );
}
