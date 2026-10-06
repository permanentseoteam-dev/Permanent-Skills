"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Code2,
  GraduationCap,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { Field, PrimaryButton, inputClass } from "@/components/ui";
import { useApp } from "@/components/AppProvider";

const COURSES = [
  {
    icon: Search,
    title: "Semantic SEO Course",
    body: "Entities, intent, and topical maps so your pages rank for meaning — not one keyword at a time.",
  },
  {
    icon: Sparkles,
    title: "AI SEO",
    body: "Use AI to research, brief, and scale SEO work without giving up quality or the assets you own.",
  },
  {
    icon: Code2,
    title: "AI Web, Software, and Tool Creation",
    body: "Build websites, software, and internal tools with AI so client work and products ship faster.",
  },
  {
    icon: Workflow,
    title: "N8N Automation",
    body: "Connect lead flow, follow-ups, and operations so the busywork runs in the background.",
  },
  {
    icon: Megaphone,
    title: "Meta Ads",
    body: "Research, creative, campaign setup, and scaling on Meta — with a system you can repeat.",
  },
  {
    icon: Target,
    title: "Leads Generation",
    body: "Offers, funnels, and follow-up that fill the calendar with qualified conversations.",
  },
];

const MENU = [
  { href: "#courses", label: "Courses" },
  { href: "#about", label: "About Us" },
  { href: "#contact", label: "Contact Us" },
  { href: "#how", label: "How it works" },
];

export default function LandingPage() {
  const { user } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#f6f6f3] text-zinc-900 overflow-x-hidden selection:bg-primary/20">
      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" aria-label="Permanent Skill Strategy home" className="shrink-0 flex items-center">
            <Image
              src="/logo.png"
              alt="Permanent Skill Strategy"
              width={220}
              height={56}
              className="h-8 sm:h-9 md:h-10 w-auto max-w-[150px] xs:max-w-[190px] sm:max-w-none object-contain"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-6 xl:gap-8 text-sm font-medium text-zinc-600 lg:flex">
            {MENU.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-primary transition-colors">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link href={user.role === "admin" ? "/admin" : "/community"}>
                  <PrimaryButton className="text-xs py-1.5 px-3 sm:py-2 sm:px-3.5 inline-flex items-center gap-1.5 shadow-sm">
                    <span className="hidden xs:inline">Go to Platform</span>
                    <span className="xs:hidden">Platform</span>
                    <ArrowRight size={13} />
                  </PrimaryButton>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition shadow-2xs"
                >
                  Login
                </Link>
              </div>
            ) : (
              <>
                <Link href="/login" className="hidden text-sm font-semibold text-zinc-700 hover:text-primary sm:inline px-2 py-1">
                  Login
                </Link>
                <Link href="/register" className="hidden sm:inline">
                  <PrimaryButton className="text-xs sm:text-sm py-2 px-3.5 sm:px-4">Apply to join</PrimaryButton>
                </Link>
              </>
            )}

            <button
              type="button"
              className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition active:scale-95 lg:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <div className="border-t border-zinc-200 bg-white px-4 py-4 sm:px-6 lg:hidden shadow-lg animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
              {MENU.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-3.5 py-2.5 hover:bg-primary/5 hover:text-primary transition"
                  onClick={closeMenu}
                >
                  {item.label}
                </a>
              ))}
              <div className="my-2 border-t border-zinc-100 pt-2 flex flex-col gap-2">
                {user ? (
                  <>
                    <Link
                      href={user.role === "admin" ? "/admin" : "/community"}
                      className="rounded-xl px-3.5 py-2.5 font-bold text-primary hover:bg-primary/5 flex items-center justify-between"
                      onClick={closeMenu}
                    >
                      <span>Open Platform</span>
                      <ArrowRight size={14} />
                    </Link>
                    <Link
                      href="/login"
                      className="rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                      onClick={closeMenu}
                    >
                      Login
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="rounded-xl px-3.5 py-2.5 hover:bg-primary/5 hover:text-primary font-semibold"
                      onClick={closeMenu}
                    >
                      Login
                    </Link>
                    <Link href="/register" className="mt-1" onClick={closeMenu}>
                      <PrimaryButton className="w-full py-2.5 justify-center">Apply to join</PrimaryButton>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* SECTION 1: HERO */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_12%,rgba(80,81,249,0.16),transparent_34%),radial-gradient(circle_at_8%_88%,rgba(80,81,249,0.08),transparent_30%)]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 md:gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:pt-20">
            <div>
              <p className="mb-4 sm:mb-5 inline-flex rounded-full border border-primary/20 bg-white px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-primary shadow-2xs">
                Private community
              </p>
              <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight text-zinc-950 leading-[1.12]">
                Build Permanent Skills and Make Your Life Easy and Busy
              </h1>
              <p className="mt-4 sm:mt-6 text-sm xs:text-base sm:text-lg leading-relaxed text-zinc-600 max-w-xl">
                Permanent Skill Strategy is a guided community for people who want durable skills, a clearer offer, and a calendar filled with useful work — not another shortcut that expires.
              </p>
              <div className="mt-6 sm:mt-8 flex flex-col xs:flex-row items-stretch xs:items-center gap-3">
                <Link href="/register" className="w-full xs:w-auto">
                  <PrimaryButton className="w-full xs:w-auto px-6 py-3 text-sm sm:text-base justify-center shadow-sm">
                    <span>Apply to join</span>
                    <ArrowRight size={16} className="ml-2" />
                  </PrimaryButton>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex justify-center rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-white hover:text-zinc-900 border border-transparent hover:border-zinc-200 transition text-center"
                >
                  Already a member? Log in
                </Link>
              </div>
              <div className="mt-8 sm:mt-10 grid grid-cols-3 gap-2 sm:gap-4 border-t border-zinc-200/80 pt-5 sm:pt-6">
                <Stat label="Classroom path" value="6 courses" />
                <Stat label="Live strategy calls" value="Weekly" />
                <Stat label="Applications" value="Reviewed" />
              </div>
            </div>

            <div className="rounded-2xl sm:rounded-[28px] border border-primary/15 bg-white p-2.5 sm:p-3 shadow-[0_20px_60px_rgba(80,81,249,0.10)] sm:shadow-[0_28px_80px_rgba(80,81,249,0.12)]">
              <div className="course-shine overflow-hidden rounded-[18px] sm:rounded-[22px] p-5 sm:p-8">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-white/80">Classroom</p>
                <h2 className="mt-2 sm:mt-3 text-2xl xs:text-3xl font-black leading-tight text-white">THE PERMANENT SKILL METHOD</h2>
                <p className="mt-2 sm:mt-3 max-w-sm text-xs sm:text-sm leading-relaxed text-white/90">
                  Six courses. One path. Skills you can use for years.
                </p>
                <div className="mt-5 sm:mt-6 flex flex-wrap gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium text-white">
                  {["Semantic SEO", "AI SEO", "AI Tools", "N8N", "Meta Ads", "Leads"].map((item) => (
                    <span key={item} className="rounded-full bg-white/20 px-2.5 py-0.5 sm:px-3 sm:py-1 backdrop-blur-xs">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid gap-2.5 sm:gap-3 p-3 sm:p-4 sm:grid-cols-2">
                <MiniCard icon={<CalendarDays size={18} className="text-primary shrink-0" />} title="PSS Live" body="Mondays · strategy, teardowns, Q&A" />
                <MiniCard icon={<GraduationCap size={18} className="text-primary shrink-0" />} title="Classroom first" body="A path you can finish" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: THE METHOD */}
        <section id="method" className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-primary">The method</p>
              <h2 className="mt-2 sm:mt-3 text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
                A professional system, not another content feed.
              </h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-zinc-600 leading-relaxed">
                Learn the work, ship it on assets you own, then get live feedback. The room is built to keep you moving — busy with the right work, and easier because the path is clear.
              </p>
            </div>
            <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-5 md:grid-cols-3">
              <Feature
                icon={<GraduationCap size={20} />}
                title="Classroom path"
                body="Six courses in order: Semantic SEO, AI SEO, AI tools, N8N, Meta Ads, and leads generation."
              />
              <Feature
                icon={<CalendarDays size={20} />}
                title="Live strategy calls"
                body="Bring real pages, offers, and questions. Leave with a next action you can ship."
              />
              <Feature
                icon={<Users size={20} />}
                title="Reviewed community"
                body="Every application is reviewed so you learn beside people who are actually shipping."
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: COURSES */}
        <section id="courses" className="scroll-mt-24 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-primary">Courses</p>
              <h2 className="mt-2 sm:mt-3 text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
                What you will learn inside the classroom.
              </h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-zinc-600 leading-relaxed">
                Each course is built to be used on your own work — so the skill stays with you after the lesson ends.
              </p>
            </div>
            <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {COURSES.map((course) => (
                <article key={course.title} className="rounded-2xl border border-primary/10 bg-white p-5 sm:p-6 shadow-xs hover:border-primary/30 transition">
                  <span className="inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <course.icon size={20} />
                  </span>
                  <h3 className="mt-3.5 sm:mt-4 text-base sm:text-lg font-bold text-zinc-900">{course.title}</h3>
                  <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed text-zinc-600">{course.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: CLASSROOM PATH */}
        <section id="classroom" className="bg-white py-14 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-8 sm:gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/15 bg-white shadow-xs">
              <div className="course-shine p-5 sm:p-8">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Inside the classroom</p>
                <h3 className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-black leading-tight text-white">Train once. Use it for years.</h3>
                <p className="mt-2 sm:mt-3 max-w-sm text-xs sm:text-sm text-white/90">A complete path from search to leads.</p>
                <ul className="mt-5 sm:mt-6 grid gap-2 text-xs sm:text-sm text-white">
                  {COURSES.map((course) => (
                    <li key={course.title} className="flex items-center gap-2 rounded-lg bg-white/12 px-3 py-2">
                      <CheckCircle2 size={16} className="shrink-0 text-white/90" />
                      <span className="leading-snug">{course.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-primary">How the path is ordered</p>
              <h2 className="mt-2 sm:mt-3 text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
                Skills that keep your days full.
              </h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-zinc-600 leading-relaxed">
                Start with search, then AI systems, then distribution. You always know what to study next.
              </p>
              <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
                {[
                  { title: "Search first", body: "Semantic SEO and AI SEO so attention compounds on pages you own." },
                  { title: "Build with AI", body: "Websites, software, and tools you can ship for yourself or for clients." },
                  { title: "Fill the calendar", body: "N8N, Meta Ads, and leads generation so the right work stays on the books." },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl sm:rounded-2xl border border-primary/10 bg-[#f6f6f3] p-4 sm:p-5">
                    <p className="font-bold text-sm sm:text-base text-primary">{item.title}</p>
                    <p className="mt-1 text-xs sm:text-sm leading-relaxed text-zinc-600">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: HOW IT WORKS */}
        <section id="how" className="scroll-mt-24 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-primary">How it works</p>
            <h2 className="mt-2 sm:mt-3 text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
              Three steps from application to live work.
            </h2>
            <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3">
              {[
                { step: "01", title: "Apply to join", body: "Create your account and tell us what you want to build. Admin review keeps the room focused." },
                { step: "02", title: "Follow the classroom", body: "Move through all six courses in order. Complete lessons, then apply them to your own work." },
                { step: "03", title: "Show up live", body: "Join weekly strategy calls, get feedback, and leave with a next action you can ship the same week." },
              ].map((item) => (
                <article key={item.step} className="rounded-2xl border border-primary/10 bg-white p-5 sm:p-6 shadow-2xs">
                  <p className="text-xs sm:text-sm font-bold tracking-[0.2em] text-primary">{item.step}</p>
                  <h3 className="mt-2 sm:mt-3 text-lg sm:text-xl font-bold text-zinc-900">{item.title}</h3>
                  <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed text-zinc-600">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6: ABOUT US */}
        <section id="about" className="scroll-mt-24 bg-white py-14 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-start gap-8 sm:gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-primary">About Us</p>
              <h2 className="mt-2 sm:mt-3 text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
                A private room for skills that stay with you.
              </h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-zinc-600 leading-relaxed">
                Permanent Skill Strategy is a guided community for professionals who want durable skills, a clearer offer, and a calendar full of useful work. We teach a path you can finish — then we review the work live.
              </p>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-zinc-600 leading-relaxed">
                Applications are reviewed so the room stays focused. You learn beside people who are shipping, not collecting unused courses.
              </p>
            </div>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              {[
                { title: "Classroom first", body: "Six courses from Semantic SEO to leads generation." },
                { title: "Live calls", body: "Weekly strategy, teardowns, and Q&A." },
                { title: "Reviewed entry", body: "Every application is read before full access." },
                { title: "Work you own", body: "Practice on assets that stay with you." },
              ].map((item) => (
                <div key={item.title} className="rounded-xl sm:rounded-2xl border border-primary/10 bg-[#f6f6f3] p-4 sm:p-5">
                  <p className="font-bold text-sm sm:text-base text-primary">{item.title}</p>
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-zinc-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 7: CONTACT US */}
        <section id="contact" className="scroll-mt-24 py-14 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 sm:gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-primary">Contact Us</p>
              <h2 className="mt-2 sm:mt-3 text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
                Questions before you apply?
              </h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-zinc-600 leading-relaxed">
                Send a message and we will get back to you. If you are ready to join, apply and an admin will review your request.
              </p>
              <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 text-xs sm:text-sm">
                <p className="flex items-center gap-3 text-zinc-700">
                  <span className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Mail size={18} />
                  </span>
                  <a href="mailto:admin@permanentseo.com" className="font-medium hover:text-primary break-all">
                    admin@permanentseo.com
                  </a>
                </p>
                <p className="flex items-center gap-3 text-zinc-700">
                  <span className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <MapPin size={18} />
                  </span>
                  Dubai, UAE
                </p>
              </div>
            </div>
            <form
              className="rounded-2xl sm:rounded-3xl border border-primary/10 bg-white p-5 sm:p-8 shadow-sm"
              onSubmit={(e) => {
                e.preventDefault();
                setContactSent(true);
              }}
            >
              {contactSent ? (
                <div className="flex min-h-[220px] sm:min-h-[240px] flex-col items-center justify-center text-center p-4">
                  <CheckCircle2 className="mb-3 text-primary" size={32} />
                  <p className="text-base sm:text-lg font-bold">Message sent</p>
                  <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-zinc-600">Thank you. We will reply as soon as we can.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name">
                      <input className={inputClass} name="name" placeholder="John Doe" required />
                    </Field>
                    <Field label="Email">
                      <input className={inputClass} type="email" name="email" placeholder="john@example.com" required />
                    </Field>
                  </div>
                  <Field label="Message">
                    <textarea className={`${inputClass} min-h-[110px] sm:min-h-[120px]`} name="message" placeholder="How can we help you?" required />
                  </Field>
                  <PrimaryButton type="submit" className="w-full sm:w-auto py-2.5 px-6 justify-center">
                    Send message
                  </PrimaryButton>
                </div>
              )}
            </form>
          </div>
        </section>

        {/* SECTION 8: BOTTOM CTA BANNER */}
        <section className="px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl sm:rounded-[28px] bg-primary px-6 py-8 sm:px-10 sm:py-12 md:px-14 text-white shadow-lg">
            <div className="grid items-center gap-6 sm:gap-10 lg:grid-cols-[1.2fr_auto]">
              <div>
                <div className="mb-3 sm:mb-4 inline-flex items-center gap-2 text-xs sm:text-sm text-white/90">
                  <ShieldCheck size={16} className="shrink-0" />
                  <span>Applications are reviewed before full access</span>
                </div>
                <h2 className="text-2xl xs:text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
                  Ready to make the work easier — and the calendar fuller?
                </h2>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-white/85 max-w-xl leading-relaxed">
                  Join a private community that keeps you learning, shipping, and accountable.
                </p>
              </div>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-primary hover:bg-zinc-100 transition shadow-sm w-full sm:w-auto text-center"
              >
                <span>Apply to join</span>
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 sm:gap-10 px-4 py-10 sm:px-6 sm:py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Image src="/logo.png" alt="Permanent Skill Strategy" width={200} height={52} className="h-9 sm:h-10 w-auto" />
            <p className="mt-3 sm:mt-4 max-w-xs text-xs sm:text-sm leading-relaxed text-zinc-600">
              A private community to build permanent skills, ship the work, and keep the calendar full.
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900">Menu</p>
            <nav className="mt-3 sm:mt-4 flex flex-col gap-2 text-xs sm:text-sm text-zinc-600">
              {MENU.map((item) => (
                <a key={item.href} href={item.href} className="hover:text-primary transition-colors">
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900">Courses</p>
            <nav className="mt-3 sm:mt-4 flex flex-col gap-2 text-xs sm:text-sm text-zinc-600">
              {COURSES.map((course) => (
                <a key={course.title} href="#courses" className="hover:text-primary transition-colors">
                  {course.title}
                </a>
              ))}
            </nav>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900">Contact</p>
            <div className="mt-3 sm:mt-4 space-y-2.5 text-xs sm:text-sm text-zinc-600">
              <a href="mailto:admin@permanentseo.com" className="flex items-center gap-2 hover:text-primary break-all">
                <Mail size={16} className="text-primary shrink-0" />
                admin@permanentseo.com
              </a>
              <p className="flex items-center gap-2">
                <MapPin size={16} className="text-primary shrink-0" />
                Dubai, UAE
              </p>
              <div className="pt-2">
                <Link href="/register" className="inline-flex w-full xs:w-auto">
                  <PrimaryButton className="w-full xs:w-auto text-xs py-2 px-3.5">Apply to join</PrimaryButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-200">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 text-xs sm:text-sm text-zinc-500 sm:flex-row text-center sm:text-left">
            <p>© 2026 Permanent Skill Strategy. All rights reserved.</p>
            <Link href="/login" className="hover:text-primary font-medium">
              Log in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-left">
      <p className="text-base xs:text-lg sm:text-xl font-bold text-primary">{value}</p>
      <p className="mt-0.5 sm:mt-1 text-[10px] xs:text-xs sm:text-sm text-zinc-500 leading-tight">{label}</p>
    </div>
  );
}

function MiniCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl bg-primary/5 p-3 sm:p-4">
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm font-bold text-zinc-900 truncate">{title}</p>
        <p className="text-[11px] sm:text-xs text-zinc-500 truncate">{body}</p>
      </div>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-primary/10 bg-[#f6f6f3] p-5 sm:p-6 shadow-2xs hover:border-primary/30 transition">
      <span className="inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-white text-primary shadow-xs">
        {icon}
      </span>
      <h3 className="mt-3.5 sm:mt-4 text-base sm:text-lg font-bold text-zinc-900">{title}</h3>
      <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed text-zinc-600">{body}</p>
    </article>
  );
}
