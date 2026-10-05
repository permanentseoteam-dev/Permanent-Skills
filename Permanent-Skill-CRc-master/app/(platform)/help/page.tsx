"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  CreditCard,
  Crown,
  ExternalLink,
  HelpCircle,
  LifeBuoy,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Card, PrimaryButton } from "@/components/ui";

type FaqCategory =
  | "all"
  | "onboarding"
  | "classroom"
  | "security"
  | "vip"
  | "affiliates";

interface FaqItem {
  id: string;
  category: FaqCategory;
  categoryLabel: string;
  question: string;
  answer: string;
  actionLink?: {
    label: string;
    href: string;
  };
}

const FAQS: FaqItem[] = [
  {
    id: "faq-1",
    category: "onboarding",
    categoryLabel: "Getting Started",
    question: "How do I get approved to access the community & courses?",
    answer:
      "After creating your account, submit your student application detailing your background and goals. Our operations staff reviews submissions continuously. Once approved, all community discussion feeds, foundation classroom modules, and networking tools unlock instantly.",
    actionLink: {
      label: "View Application Status",
      href: "/pending",
    },
  },
  {
    id: "faq-2",
    category: "security",
    categoryLabel: "Account & Security",
    question: "Why does the platform enforce single-device concurrent sessions?",
    answer:
      "To protect proprietary course IP and ensure student account security, Permanent Skill Strategy enforces one active session per account. If you switch between a laptop and mobile phone, your device session lock transfers automatically. You can also manually release your session in Account Settings.",
    actionLink: {
      label: "Manage Device Lock",
      href: "/settings",
    },
  },
  {
    id: "faq-3",
    category: "classroom",
    categoryLabel: "Classroom & Video",
    question: "Where do I find lesson notes, templates, and downloadable resources?",
    answer:
      "Every video lesson in the Classroom features a dedicated 'Lesson Notes & Downloads' section beneath the video player. Links, code snippets, and templates provided by the instructors are formatted with clickable shortcuts for instant copy-pasting.",
    actionLink: {
      label: "Go to Classroom",
      href: "/classroom",
    },
  },
  {
    id: "faq-4",
    category: "vip",
    categoryLabel: "VIP Mastermind",
    question: "What is included with The Daily Pulse VIP Mastermind upgrade?",
    answer:
      "VIP Mastermind members receive full access to our entire premium course catalog (Learn to Build Apps, Make.com Automations, Business Clarity, n8n Workflows), weekly live Zoom mastermind workshops with Q&A, and private consulting networking.",
    actionLink: {
      label: "Explore VIP Mastermind",
      href: "/all-courses",
    },
  },
  {
    id: "faq-5",
    category: "onboarding",
    categoryLabel: "Leaderboards & Points",
    question: "How do community leaderboard levels and point milestones work?",
    answer:
      "You earn points organically by contributing: +5 points for approved discussion posts, +2 points for helpful comments, +3 points for completing classroom lessons, and up to +20 points when peers like your solutions. Higher levels unlock exclusive mastermind badges and recognition.",
    actionLink: {
      label: "Check Leaderboards",
      href: "/leaderboards",
    },
  },
  {
    id: "faq-6",
    category: "vip",
    categoryLabel: "Live Workshops",
    question: "How do I join the scheduled live Zoom Mastermind calls?",
    answer:
      "Live call dates, agendas, and Zoom access links are published in the Calendar & Meet tab. In addition, registered members receive an automated banner alert 5 minutes before live sessions begin.",
    actionLink: {
      label: "View Mastermind Schedule",
      href: "/calendar",
    },
  },
  {
    id: "faq-7",
    category: "affiliates",
    categoryLabel: "Partner Program",
    question: "How does the 40% Partner & Affiliate commission program work?",
    answer:
      "Every member is provided a unique referral code and tracking link. When colleagues, clients, or students enroll in paid masterclasses or VIP passes using your link, you earn 40% recurring commissions. Payouts occur semi-monthly via Bank Wire, PayPal, or USDT.",
    actionLink: {
      label: "Open Affiliate Dashboard",
      href: "/affiliates",
    },
  },
  {
    id: "faq-8",
    category: "security",
    categoryLabel: "Account & Security",
    question: "Can I access the platform on mobile phones and tablets?",
    answer:
      "Yes! The entire platform is built with fluid responsive design optimized for iPhone, iPad, Android devices, and laptops. You can watch lessons, participate in discussions, and join live meetings directly in your mobile browser without installing third-party apps.",
  },
  {
    id: "faq-9",
    category: "security",
    categoryLabel: "Account & Security",
    question: "How do I reset my password or update my profile details?",
    answer:
      "Navigate to Settings & Preferences from the user menu. Under the 'Profile & Bio' tab you can update your name, location, and bio. Under the 'Security & Password' tab you can set a new 8+ character password.",
    actionLink: {
      label: "Open Settings",
      href: "/settings",
    },
  },
  {
    id: "faq-10",
    category: "classroom",
    categoryLabel: "Classroom & Video",
    question: "What if a video lesson fails to play or buffers continuously?",
    answer:
      "First check your internet connection. Our video lessons are delivered via high-speed global CDNs supporting adaptive bitrates. If playback issues persist, try clearing your browser cache or switching video quality settings.",
  },
];

const CATEGORIES: { id: FaqCategory; label: string }[] = [
  { id: "all", label: "All Topics" },
  { id: "onboarding", label: "Onboarding & Points" },
  { id: "classroom", label: "Classroom & Video" },
  { id: "security", label: "Account & Security" },
  { id: "vip", label: "VIP Mastermind" },
  { id: "affiliates", label: "Partner Program" },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FaqCategory>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["faq-1", "faq-2"]));
  const [copiedEmail, setCopiedEmail] = useState(false);

  function toggleFaq(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    setExpandedIds(new Set(filteredFaqs.map((f) => f.id)));
  }

  function collapseAll() {
    setExpandedIds(new Set());
  }

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q) ||
          item.categoryLabel.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [category, search]);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText("support@permanentseo.com");
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    } catch {}
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* SECTION 1: HERO HEADER & SEARCH BAR */}
      <div className="rounded-3xl border border-zinc-200/90 bg-gradient-to-b from-white via-zinc-50/50 to-zinc-50 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Student Support
              </span>
              <span className="text-zinc-300">•</span>
              <span className="text-xs text-zinc-500 font-medium">Knowledge Base & FAQ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">
              How Can We Help You Today?
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 leading-normal max-w-2xl">
              Search our complete documentation for instant answers to platform access, video playback, VIP mastermind sessions, and account management.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition"
            >
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Session Status</span>
            </Link>
          </div>
        </div>

        {/* SEARCH INPUT */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            className="w-full rounded-2xl border border-zinc-200 bg-white py-3 sm:py-3.5 pl-11 pr-10 text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs transition"
            placeholder="Search keywords: approval, VIP, Zoom meetings, password, points, certificates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* SECTION 2: THREE DIRECT SUPPORT CHANNELS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Support Channel 1: Email */}
        <Card className="p-4 sm:p-5 border-zinc-200/90 shadow-2xs hover:border-zinc-300 transition space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Mail size={18} />
            </div>
            <h3 className="text-sm font-bold text-zinc-950">Email Support</h3>
            <p className="text-xs text-zinc-500 leading-normal">
              Direct ticket assistance for account, billing, and technical questions.
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
            <a
              href="mailto:support@permanentseo.com"
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              Send Message <ExternalLink size={12} />
            </a>
            <button
              type="button"
              onClick={copyEmail}
              className="p-1 text-zinc-400 hover:text-zinc-600 transition"
              title="Copy support email"
            >
              {copiedEmail ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            </button>
          </div>
        </Card>

        {/* Support Channel 2: WhatsApp / Phone */}
        <Card className="p-4 sm:p-5 border-zinc-200/90 shadow-2xs hover:border-zinc-300 transition space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <MessageCircle size={18} />
            </div>
            <h3 className="text-sm font-bold text-zinc-950">WhatsApp & Phone</h3>
            <p className="text-xs text-zinc-500 leading-normal">
              Urgent WhatsApp inquiries & student concierge line during office hours.
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100">
            <a
              href="tel:03704555076"
              className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1 font-mono"
            >
              <Phone size={12} /> 03704555076
            </a>
          </div>
        </Card>

        {/* Support Channel 3: Live Masterminds */}
        <Card className="p-4 sm:p-5 border-zinc-200/90 shadow-2xs hover:border-zinc-300 transition space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Calendar size={18} />
            </div>
            <h3 className="text-sm font-bold text-zinc-950">Weekly Masterminds</h3>
            <p className="text-xs text-zinc-500 leading-normal">
              Live consultation workshops & screen-share sessions every week.
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100">
            <Link
              href="/calendar"
              className="text-xs font-bold text-amber-700 hover:underline inline-flex items-center gap-1"
            >
              View Calendar Schedule →
            </Link>
          </div>
        </Card>
      </div>

      {/* SECTION 3: TOPIC CATEGORY SLIDER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0 flex-1 overflow-x-auto pb-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap active:scale-95 cursor-pointer shrink-0 ${
                  category === cat.id
                    ? "bg-zinc-900 text-white shadow-2xs"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 shadow-2xs"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={expandAll}
            className="hover:text-zinc-900 transition font-semibold"
          >
            Expand All
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={collapseAll}
            className="hover:text-zinc-900 transition font-semibold"
          >
            Collapse
          </button>
        </div>
      </div>

      {/* SECTION 4: ACCORDION FAQ ITEMS */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <Card className="p-8 text-center border-dashed border-zinc-200 text-zinc-500 space-y-2">
            <HelpCircle size={32} className="mx-auto text-zinc-300" />
            <p className="font-bold text-zinc-700 text-sm">No Matching Articles Found</p>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              We couldn't find any FAQs matching &ldquo;{search}&rdquo;. Try another search term or contact our support desk directly.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                }}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
              >
                Reset Filters
              </button>
            </div>
          </Card>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedIds.has(faq.id);

            return (
              <div
                key={faq.id}
                className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden transition-all hover:border-zinc-300"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-3 cursor-pointer"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                      {faq.categoryLabel}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-zinc-950 leading-snug">
                      {faq.question}
                    </h3>
                  </div>

                  <span
                    className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 transition-transform duration-200 ${
                      isExpanded ? "rotate-180 bg-zinc-900 text-white border-zinc-900" : ""
                    }`}
                  >
                    <ChevronDown size={15} />
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-zinc-100 text-xs sm:text-sm text-zinc-600 leading-relaxed space-y-3 bg-zinc-50/30">
                    <p>{faq.answer}</p>
                    {faq.actionLink && (
                      <div className="pt-1">
                        <Link
                          href={faq.actionLink.href}
                          className="inline-flex items-center gap-1 font-bold text-primary hover:underline text-xs"
                        >
                          <span>{faq.actionLink.label}</span>
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* SECTION 5: ACCOUNT SESSION TROUBLESHOOTING CARD */}
      <Card className="p-5 sm:p-6 border border-zinc-200 shadow-sm space-y-3 bg-gradient-to-r from-zinc-50 via-white to-zinc-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
              <RefreshCw size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950">Switching Between Devices?</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                If you encounter a concurrent login message, you can release device locks instantly in Account Settings.
              </p>
            </div>
          </div>

          <Link
            href="/settings"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-50 shadow-2xs transition self-start sm:self-auto cursor-pointer shrink-0"
          >
            <span>Reset Device Lock</span>
            <ExternalLink size={12} className="text-zinc-400" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
