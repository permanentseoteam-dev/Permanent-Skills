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
  Users,
  Workflow,
  X,
} from "lucide-react";
import { Field, PrimaryButton, inputClass } from "@/components/ui";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#f6f6f3] text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-6">
          <Link href="/" aria-label="Permanent Skill Strategy home">
            <Image src="/logo.png" alt="Permanent Skill Strategy" width={220} height={56} className="h-10 w-auto md:h-11" priority />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 lg:flex">
            {MENU.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-primary">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-semibold text-zinc-700 hover:text-primary sm:inline">
              Log in
            </Link>
            <Link href="/register" className="hidden sm:inline">
              <PrimaryButton>Apply to join</PrimaryButton>
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 lg:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-zinc-200 bg-white px-5 py-4 lg:hidden">
            <nav className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
              {MENU.map((item) => (
                <a key={item.href} href={item.href} className="rounded-lg px-3 py-2 hover:bg-primary/5 hover:text-primary" onClick={closeMenu}>
                  {item.label}
                </a>
              ))}
              <Link href="/login" className="rounded-lg px-3 py-2 hover:bg-primary/5 hover:text-primary" onClick={closeMenu}>
                Log in
              </Link>
              <Link href="/register" className="mt-2" onClick={closeMenu}>
                <PrimaryButton className="w-full">Apply to join</PrimaryButton>
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_12%,rgba(80,81,249,0.16),transparent_34%),radial-gradient(circle_at_8%_88%,rgba(80,81,249,0.08),transparent_30%)]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-12 md:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:pt-20">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-primary/20 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                Private community
              </p>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl sm:leading-[1.08]">
                Build Permanent Skills and Make Your Life Easy and Busy
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">
                Permanent Skill Strategy is a guided community for people who want durable skills, a clearer offer, and a calendar filled with useful work — not another shortcut that expires.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/register">
                  <PrimaryButton className="px-6 py-3">
                    Apply to join
                    <ArrowRight size={16} className="ml-2" />
                  </PrimaryButton>
                </Link>
                <Link href="/login" className="rounded-lg px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-white">
                  Already a member? Log in
                </Link>
              </div>
              <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-zinc-200 pt-6">
                <Stat label="Classroom path" value="6 courses" />
                <Stat label="Live strategy calls" value="Weekly" />
                <Stat label="Every application" value="Reviewed" />
              </div>
            </div>

            <div className="rounded-[28px] border border-primary/15 bg-white p-3 shadow-[0_28px_80px_rgba(80,81,249,0.12)]">
              <div className="course-shine overflow-hidden rounded-[22px] p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">Classroom</p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-white">THE PERMANENT SKILL METHOD</h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/90">
                  Six courses. One path. Skills you can use for years.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-white">
                  {["Semantic SEO", "AI SEO", "AI Tools", "N8N", "Meta Ads", "Leads"].map((item) => (
                    <span key={item} className="rounded-full bg-white/20 px-3 py-1">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                <MiniCard icon={<CalendarDays size={18} className="text-primary" />} title="PSS Live" body="Mondays · strategy, teardowns, Q&A" />
                <MiniCard icon={<GraduationCap size={18} className="text-primary" />} title="Classroom first" body="A path you can finish" />
              </div>
            </div>
          </div>
        </section>

        <section id="method" className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-5 md:px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">The method</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">A professional system, not another content feed.</h2>
              <p className="mt-4 text-zinc-600">
                Learn the work, ship it on assets you own, then get live feedback. The room is built to keep you moving — busy with the right work, and easier because the path is clear.
              </p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
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

        <section id="courses" className="scroll-mt-24 py-20">
          <div className="mx-auto max-w-6xl px-5 md:px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Courses</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">What you will learn inside the classroom.</h2>
              <p className="mt-4 text-zinc-600">
                Each course is built to be used on your own work — so the skill stays with you after the lesson ends.
              </p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {COURSES.map((course) => (
                <article key={course.title} className="rounded-2xl border border-primary/10 bg-white p-6 shadow-sm">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <course.icon size={20} />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{course.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{course.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="classroom" className="bg-white py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 md:px-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-3xl border border-primary/15 bg-white shadow-sm">
              <div className="course-shine p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Inside the classroom</p>
                <h3 className="mt-3 text-3xl font-black leading-tight text-white">Train once. Use it for years.</h3>
                <p className="mt-3 max-w-sm text-white/90">A complete path from search to leads.</p>
                <ul className="mt-6 grid gap-2 text-sm text-white">
                  {COURSES.map((course) => (
                    <li key={course.title} className="flex items-center gap-2 rounded-lg bg-white/12 px-3 py-2">
                      <CheckCircle2 size={16} className="shrink-0" />
                      {course.title}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">How the path is ordered</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Skills that keep your days full.</h2>
              <p className="mt-4 text-zinc-600">
                Start with search, then AI systems, then distribution. You always know what to study next.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { title: "Search first", body: "Semantic SEO and AI SEO so attention compounds on pages you own." },
                  { title: "Build with AI", body: "Websites, software, and tools you can ship for yourself or for clients." },
                  { title: "Fill the calendar", body: "N8N, Meta Ads, and leads generation so the right work stays on the books." },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-primary/10 bg-[#f6f6f3] p-5">
                    <p className="font-semibold text-primary">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="scroll-mt-24 py-20">
          <div className="mx-auto max-w-6xl px-5 md:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Three steps from application to live work.</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                { step: "01", title: "Apply to join", body: "Create your account and tell us what you want to build. Admin review keeps the room focused." },
                { step: "02", title: "Follow the classroom", body: "Move through all six courses in order. Complete lessons, then apply them to your own work." },
                { step: "03", title: "Show up live", body: "Join weekly strategy calls, get feedback, and leave with a next action you can ship the same week." },
              ].map((item) => (
                <article key={item.step} className="rounded-2xl border border-primary/10 bg-white p-6">
                  <p className="text-sm font-bold tracking-[0.2em] text-primary">{item.step}</p>
                  <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-24 bg-white py-20">
          <div className="mx-auto grid max-w-6xl items-start gap-12 px-5 md:px-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">About Us</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">A private room for skills that stay with you.</h2>
              <p className="mt-4 text-zinc-600 leading-7">
                Permanent Skill Strategy is a guided community for professionals who want durable skills, a clearer offer, and a calendar full of useful work. We teach a path you can finish — then we review the work live.
              </p>
              <p className="mt-4 text-zinc-600 leading-7">
                Applications are reviewed so the room stays focused. You learn beside people who are shipping, not collecting unused courses.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: "Classroom first", body: "Six courses from Semantic SEO to leads generation." },
                { title: "Live calls", body: "Weekly strategy, teardowns, and Q&A." },
                { title: "Reviewed entry", body: "Every application is read before full access." },
                { title: "Work you own", body: "Practice on assets that stay with you." },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-primary/10 bg-[#f6f6f3] p-5">
                  <p className="font-semibold text-primary">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24 py-20">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 md:px-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Contact Us</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Questions before you apply?</h2>
              <p className="mt-4 text-zinc-600 leading-7">
                Send a message and we will get back to you. If you are ready to join, apply and an admin will review your request.
              </p>
              <div className="mt-8 space-y-4 text-sm">
                <p className="flex items-center gap-3 text-zinc-700">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Mail size={18} />
                  </span>
                  <a href="mailto:admin@permanentseo.com" className="font-medium hover:text-primary">
                    admin@permanentseo.com
                  </a>
                </p>
                <p className="flex items-center gap-3 text-zinc-700">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin size={18} />
                  </span>
                  Dubai, UAE
                </p>
              </div>
            </div>
            <form
              className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm md:p-8"
              onSubmit={(e) => {
                e.preventDefault();
                setContactSent(true);
              }}
            >
              {contactSent ? (
                <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
                  <CheckCircle2 className="mb-3 text-primary" size={32} />
                  <p className="text-lg font-semibold">Message sent</p>
                  <p className="mt-2 max-w-sm text-sm text-zinc-600">Thank you. We will reply as soon as we can.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name">
                      <input className={inputClass} name="name" required />
                    </Field>
                    <Field label="Email">
                      <input className={inputClass} type="email" name="email" required />
                    </Field>
                  </div>
                  <Field label="Message">
                    <textarea className={`${inputClass} min-h-[120px]`} name="message" required />
                  </Field>
                  <PrimaryButton type="submit" className="w-full sm:w-auto">
                    Send message
                  </PrimaryButton>
                </div>
              )}
            </form>
          </div>
        </section>

        <section className="px-5 py-16 md:px-6">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-primary px-8 py-12 text-white md:px-14">
            <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_auto]">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 text-sm text-white/85">
                  <ShieldCheck size={16} />
                  Applications are reviewed before full access
                </div>
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Ready to make the work easier — and the calendar fuller?</h2>
                <p className="mt-4 max-w-xl text-white/85">
                  Join a private community that keeps you learning, shipping, and accountable.
                </p>
              </div>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary hover:bg-zinc-100"
              >
                Apply to join
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-2 md:px-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Image src="/logo.png" alt="Permanent Skill Strategy" width={200} height={52} className="h-10 w-auto" />
            <p className="mt-4 max-w-xs text-sm leading-6 text-zinc-600">
              A private community to build permanent skills, ship the work, and keep the calendar full.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Menu</p>
            <nav className="mt-4 flex flex-col gap-2 text-sm text-zinc-600">
              {MENU.map((item) => (
                <a key={item.href} href={item.href} className="hover:text-primary">
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Courses</p>
            <nav className="mt-4 flex flex-col gap-2 text-sm text-zinc-600">
              {COURSES.map((course) => (
                <a key={course.title} href="#courses" className="hover:text-primary">
                  {course.title}
                </a>
              ))}
            </nav>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Contact</p>
            <div className="mt-4 space-y-3 text-sm text-zinc-600">
              <a href="mailto:admin@permanentseo.com" className="flex items-center gap-2 hover:text-primary">
                <Mail size={16} className="text-primary" />
                admin@permanentseo.com
              </a>
              <p className="flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                Dubai, UAE
              </p>
              <Link href="/register" className="inline-flex pt-2">
                <PrimaryButton>Apply to join</PrimaryButton>
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-200">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-5 py-5 text-sm text-zinc-500 md:flex-row md:items-center md:px-6">
            <p>© 2026 Permanent Skill Strategy. All rights reserved.</p>
            <Link href="/login" className="hover:text-primary">
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
    <div>
      <p className="text-lg font-semibold text-primary md:text-xl">{value}</p>
      <p className="mt-1 text-xs text-zinc-500 md:text-sm">{label}</p>
    </div>
  );
}

function MiniCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-primary/5 p-4">
      {icon}
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-zinc-500">{body}</p>
      </div>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-primary/10 bg-[#f6f6f3] p-6">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-primary shadow-sm">{icon}</span>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{body}</p>
    </article>
  );
}
