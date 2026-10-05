import React from "react";
import type { Course } from "@/lib/types";
import type { AboutSlide } from "@/components/AboutHeroCard";

export function generateCourseSlides(course: Course, defaultVideoUrl?: string): AboutSlide[] {
  const glow = course.glowColor || "blue";
  const glowHex =
    glow === "green"
      ? "#10b981"
      : glow === "yellow"
      ? "#eab308"
      : glow === "orange"
      ? "#f97316"
      : glow === "red"
      ? "#ef4444"
      : glow === "purple"
      ? "#a855f7"
      : "#3b82f6";

  const videoUrl =
    course.lessons.find((l) => l.videoUrl)?.videoUrl ||
    defaultVideoUrl ||
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

  return [
    {
      id: `${course.id}-slide-1`,
      title: `${course.title} - Complete Masterclass`,
      type: "image",
      thumbLabel: "Hero",
      renderGraphic: () => (
        <svg viewBox="0 0 1200 675" className="h-full w-full object-cover select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`grad1-${course.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#080c16" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020408" />
            </linearGradient>
            <radialGradient id={`glow-${course.id}`} cx="30%" cy="40%" r="50%">
              <stop offset="0%" stopColor={glowHex} stopOpacity="0.45" />
              <stop offset="100%" stopColor={glowHex} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1200" height="675" fill={`url(#grad1-${course.id})`} />
          <rect width="1200" height="675" fill={`url(#glow-${course.id})`} />

          {/* Watermark in background */}
          <text
            x="600"
            y="540"
            fill={glowHex}
            opacity="0.12"
            fontFamily="monospace"
            fontSize="72"
            fontWeight="900"
            textAnchor="middle"
          >
            {course.watermark || `> ${course.slug}_`}
          </text>

          {/* Badge */}
          <g transform="translate(100, 100)">
            <rect width="180" height="42" rx="21" fill={glowHex} opacity="0.2" stroke={glowHex} strokeWidth="2" />
            <text x="90" y="27" fill="#ffffff" fontSize="16" fontWeight="900" textAnchor="middle">
              {course.badge || "FEATURED COURSE"}
            </text>
          </g>

          {/* Title */}
          <g transform="translate(100, 220)">
            <text
              x="0"
              y="60"
              fill="#ffffff"
              fontSize="68"
              fontWeight="900"
              letterSpacing="-2px"
              style={{ textShadow: "0 10px 30px rgba(0,0,0,0.8)" }}
            >
              {course.title.length > 28 ? course.title.slice(0, 28) + "..." : course.title}
            </text>
            <text x="0" y="130" fill="#94a3b8" fontSize="28" fontWeight="600">
              {course.description.length > 55 ? course.description.slice(0, 55) + "..." : course.description}
            </text>
          </g>

          {/* Stats Bar */}
          <g transform="translate(100, 480)">
            <rect width="1000" height="90" rx="16" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            <text x="50" y="55" fill="#f8fafc" fontSize="22" fontWeight="800">
              📚 {course.lessons.length} In-depth Lessons
            </text>
            <text x="400" y="55" fill="#f8fafc" fontSize="22" fontWeight="800">
              ⚡ Level {course.unlockLevel || 1} Requirement
            </text>
            <text x="760" y="55" fill={glowHex} fontSize="22" fontWeight="900">
              {course.isPremiumOnly ? "👑 VIP Mastermind" : course.price ? `$${course.price} Lifetime` : "✨ Free Access"}
            </text>
          </g>
        </svg>
      ),
    },
    {
      id: `${course.id}-slide-2`,
      title: "Complete Curriculum & Architecture",
      type: "image",
      thumbLabel: "Curriculum",
      renderGraphic: () => (
        <svg viewBox="0 0 1200 675" className="h-full w-full object-cover select-none" xmlns="http://www.w3.org/2000/svg">
          <rect width="1200" height="675" fill="#0b0f19" />
          <text x="600" y="110" fill="#ffffff" fontSize="48" fontWeight="900" textAnchor="middle">
            Curriculum Roadmap
          </text>
          <text x="600" y="160" fill="#94a3b8" fontSize="22" textAnchor="middle">
            Structured modules engineered for immediate implementation
          </text>

          {/* Module Cards */}
          <g transform="translate(150, 210)">
            <rect width="420" height="180" rx="14" fill="#1e293b" stroke={glowHex} strokeWidth="2" />
            <rect x="25" y="25" width="100" height="32" rx="6" fill={glowHex} />
            <text x="75" y="46" fill="#ffffff" fontSize="13" fontWeight="800" textAnchor="middle">MODULE 01</text>
            <text x="25" y="95" fill="#ffffff" fontSize="22" fontWeight="800">Foundations & Setup</text>
            <text x="25" y="130" fill="#94a3b8" fontSize="15">Architecture, credentials, and prerequisites</text>
          </g>

          <g transform="translate(630, 210)">
            <rect width="420" height="180" rx="14" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <rect x="25" y="25" width="100" height="32" rx="6" fill="#334155" />
            <text x="75" y="46" fill="#cbd5e1" fontSize="13" fontWeight="800" textAnchor="middle">MODULE 02</text>
            <text x="25" y="95" fill="#ffffff" fontSize="22" fontWeight="800">Core Systems & Workflows</text>
            <text x="25" y="130" fill="#94a3b8" fontSize="15">Step-by-step logic, routing, and error recovery</text>
          </g>

          <g transform="translate(150, 420)">
            <rect width="420" height="180" rx="14" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <rect x="25" y="25" width="100" height="32" rx="6" fill="#334155" />
            <text x="75" y="46" fill="#cbd5e1" fontSize="13" fontWeight="800" textAnchor="middle">MODULE 03</text>
            <text x="25" y="95" fill="#ffffff" fontSize="22" fontWeight="800">Scaling & Optimization</text>
            <text x="25" y="130" fill="#94a3b8" fontSize="15">High-volume pipelines and production security</text>
          </g>

          <g transform="translate(630, 420)">
            <rect width="420" height="180" rx="14" fill="#1e293b" stroke={glowHex} strokeWidth="2" />
            <rect x="25" y="25" width="100" height="32" rx="6" fill={glowHex} />
            <text x="75" y="46" fill="#ffffff" fontSize="13" fontWeight="800" textAnchor="middle">MODULE 04</text>
            <text x="25" y="95" fill="#ffffff" fontSize="22" fontWeight="800">Client Delivery & Monetization</text>
            <text x="25" y="130" fill="#94a3b8" fontSize="15">Proposals, contracts, and recurring retainers</text>
          </g>
        </svg>
      ),
    },
    {
      id: `${course.id}-slide-3`,
      title: "Pre-Built Templates & Swipe Files",
      type: "image",
      thumbLabel: "Templates",
      renderGraphic: () => (
        <svg viewBox="0 0 1200 675" className="h-full w-full object-cover select-none" xmlns="http://www.w3.org/2000/svg">
          <rect width="1200" height="675" fill="#060913" />
          <text x="600" y="130" fill={glowHex} fontSize="72" fontWeight="900" textAnchor="middle" letterSpacing="-1px">
            PLUG & PLAY ASSETS
          </text>
          <text x="600" y="190" fill="#cbd5e1" fontSize="26" textAnchor="middle">
            Instant downloads included with this course
          </text>

          <g transform="translate(200, 260)">
            <rect width="240" height="260" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <text x="120" y="80" fill={glowHex} fontSize="44" textAnchor="middle">📄</text>
            <text x="120" y="140" fill="#ffffff" fontSize="18" fontWeight="800" textAnchor="middle">Downloadable Notes</text>
            <text x="120" y="180" fill="#94a3b8" fontSize="13" textAnchor="middle">Formatted Word doc</text>
            <text x="120" y="200" fill="#94a3b8" fontSize="13" textAnchor="middle">and cheat sheets</text>
          </g>

          <g transform="translate(480, 260)">
            <rect width="240" height="260" rx="16" fill="#0f172a" stroke={glowHex} strokeWidth="2" />
            <text x="120" y="80" fill={glowHex} fontSize="44" textAnchor="middle">⚡</text>
            <text x="120" y="140" fill="#ffffff" fontSize="18" fontWeight="800" textAnchor="middle">Workflow JSONs</text>
            <text x="120" y="180" fill="#94a3b8" fontSize="13" textAnchor="middle">Import directly</text>
            <text x="120" y="200" fill="#94a3b8" fontSize="13" textAnchor="middle">into your canvas</text>
          </g>

          <g transform="translate(760, 260)">
            <rect width="240" height="260" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <text x="120" y="80" fill={glowHex} fontSize="44" textAnchor="middle">💼</text>
            <text x="120" y="140" fill="#ffffff" fontSize="18" fontWeight="800" textAnchor="middle">Client SOPs</text>
            <text x="120" y="180" fill="#94a3b8" fontSize="13" textAnchor="middle">Tested agreements,</text>
            <text x="120" y="200" fill="#94a3b8" fontSize="13" textAnchor="middle">pricing and pitch decks</text>
          </g>
        </svg>
      ),
    },
    {
      id: `${course.id}-slide-4`,
      title: "Featured Video Lesson Preview",
      type: "video",
      videoUrl: videoUrl,
      thumbLabel: "Watch Lesson",
      renderGraphic: () => (
        <svg viewBox="0 0 1200 675" className="h-full w-full object-cover select-none" xmlns="http://www.w3.org/2000/svg">
          <rect width="1200" height="675" fill="#0b0f19" />
          <radialGradient id={`vidCourseGlow-${course.id}`} cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor={glowHex} stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0b0f19" stopOpacity="1" />
          </radialGradient>
          <rect width="1200" height="675" fill={`url(#vidCourseGlow-${course.id})`} />

          {/* YouTube Play Icon */}
          <g transform="translate(540, 270)">
            <rect width="120" height="84" rx="24" fill="#ff0000" />
            <polygon points="50,26 80,42 50,58" fill="#ffffff" />
          </g>

          <text x="600" y="420" fill="#ffffff" fontSize="34" fontWeight="900" textAnchor="middle">
            Watch Lesson 1.1 Preview
          </text>
          <text x="600" y="470" fill="#cbd5e1" fontSize="20" textAnchor="middle">
            Click to watch the full first walkthrough of {course.title}
          </text>
        </svg>
      ),
    },
    {
      id: `${course.id}-slide-5`,
      title: "Verified Student Case Studies",
      type: "image",
      thumbLabel: "Case Studies",
      renderGraphic: () => (
        <svg viewBox="0 0 1200 675" className="h-full w-full object-cover select-none" xmlns="http://www.w3.org/2000/svg">
          <rect width="1200" height="675" fill="#020617" />
          <text x="600" y="120" fill="#ffffff" fontSize="52" fontWeight="900" textAnchor="middle">
            Real Student Outcomes
          </text>
          <text x="600" y="170" fill="#94a3b8" fontSize="22" textAnchor="middle">
            Built by operators for operators who ship real work
          </text>

          <g transform="translate(180, 240)">
            <rect width="380" height="280" rx="16" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
            <text x="40" y="70" fill="#fbbf24" fontSize="20">★★★★★</text>
            <text x="40" y="120" fill="#ffffff" fontSize="18" fontWeight="800">
              &quot;Landed my first retainer in 2 weeks&quot;
            </text>
            <text x="40" y="165" fill="#94a3b8" fontSize="14">
              &quot;The templates alone saved me 50 hours of trial and error. Everything is plug and play.&quot;
            </text>
            <text x="40" y="240" fill={glowHex} fontSize="14" fontWeight="800">
              — Daniel K., Agency Operator
            </text>
          </g>

          <g transform="translate(640, 240)">
            <rect width="380" height="280" rx="16" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
            <text x="40" y="70" fill="#fbbf24" fontSize="20">★★★★★</text>
            <text x="40" y="120" fill="#ffffff" fontSize="18" fontWeight="800">
              &quot;Clear, dense, and no wasted fluff&quot;
            </text>
            <text x="40" y="165" fill="#94a3b8" fontSize="14">
              &quot;Most courses drag on for 40 hours. This got straight to the architecture and execution.&quot;
            </text>
            <text x="40" y="240" fill={glowHex} fontSize="14" fontWeight="800">
              — Sarah L., Automation Consultant
            </text>
          </g>
        </svg>
      ),
    },
    {
      id: `${course.id}-slide-6`,
      title: "Certification & Community Access",
      type: "image",
      thumbLabel: "Certificate",
      renderGraphic: () => (
        <svg viewBox="0 0 1200 675" className="h-full w-full object-cover select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`certGrad-${course.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#080e1e" />
              <stop offset="100%" stopColor="#02040a" />
            </linearGradient>
          </defs>
          <rect width="1200" height="675" fill={`url(#certGrad-${course.id})`} />
          <g transform="translate(600, 200)">
            <text x="0" y="0" fill={glowHex} fontSize="90" fontWeight="900" textAnchor="middle" letterSpacing="2px">
              LIFETIME ACCESS
            </text>
            <text x="0" y="80" fill="#ffffff" fontSize="36" fontWeight="800" textAnchor="middle">
              {course.title}
            </text>
            <text x="0" y="140" fill="#94a3b8" fontSize="22" textAnchor="middle">
              Includes all future lesson updates, downloadable files & community Q&A
            </text>
            <text x="0" y="210" fill="#f8fafc" fontSize="24" fontWeight="900" textAnchor="middle">
              💎 Permanent Skills Academy Verified Completion
            </text>
          </g>
        </svg>
      ),
    },
  ];
}
