"use client";

import React, { useState } from "react";
import { Play, X, Film, Globe, Lock, Users, Tag, Sparkles, Pencil } from "lucide-react";
import { toEmbed } from "@/lib/video";

export interface AboutSlide {
  id: string;
  title: string;
  type: "image" | "video";
  videoUrl?: string;
  customImageUrl?: string;
  renderGraphic?: () => React.ReactNode;
  thumbLabel?: string;
}

interface AboutHeroCardProps {
  title: string;
  privacy?: "Public" | "Private" | "VIP";
  memberCountText?: string;
  priceText?: string;
  creatorName?: string;
  creatorAvatarUrl?: string;
  creatorBadge?: string;
  defaultVideoUrl?: string;
  customThumbnailUrl?: string;
  slides?: AboutSlide[];
  onUpgradeClick?: () => void;
  isAdminOrManager?: boolean;
  onEditVideo?: () => void;
  onEditCreator?: () => void;
}

export function AboutHeroCard({
  title,
  privacy = "Public",
  memberCountText = "466.9k members",
  priceText = "Free",
  creatorName = "Nate Herk",
  creatorAvatarUrl,
  creatorBadge = "💎",
  defaultVideoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  customThumbnailUrl,
  slides,
  onUpgradeClick,
  isAdminOrManager,
  onEditVideo,
  onEditCreator,
}: AboutHeroCardProps) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Default 6 slides matching the exact user screenshot
  const defaultSlides: AboutSlide[] = [
    {
      id: "slide-1",
      title: "AIS 400,000 People Mastering AI Automation",
      type: "image",
      thumbLabel: "AIS Overview",
      renderGraphic: () => (
        <svg
          viewBox="0 0 1200 675"
          className="h-full w-full object-cover select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bgGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#080e1e" />
              <stop offset="45%" stopColor="#0d1b3e" />
              <stop offset="100%" stopColor="#040711" />
            </linearGradient>
            <radialGradient id="cyanGlow" cx="30%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="softLight" cx="80%" cy="30%" r="45%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
            <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#000" floodOpacity="0.5" />
            </filter>
            <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#f1f5f9" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Background */}
          <rect width="1200" height="675" fill="url(#bgGrad1)" />
          <rect width="1200" height="675" fill="url(#cyanGlow)" />
          <rect width="1200" height="675" fill="url(#softLight)" />

          {/* Large Bold Typography Left Side */}
          <g transform="translate(90, 110)">
            <text
              x="0"
              y="130"
              fill="#ffffff"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="160"
              letterSpacing="-4px"
              style={{ textShadow: "0 10px 40px rgba(0,0,0,0.6)" }}
            >
              AIS
            </text>

            <text
              x="0"
              y="270"
              fill="#ffffff"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="86"
              letterSpacing="-2px"
            >
              400,000
            </text>

            <text
              x="0"
              y="350"
              fill="#ffffff"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="800"
              fontSize="48"
              letterSpacing="-1px"
            >
              People Mastering
            </text>

            <text
              x="0"
              y="420"
              fill="#ffffff"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="800"
              fontSize="48"
              letterSpacing="-1px"
            >
              AI Automation
            </text>
          </g>

          {/* Instructor Silhouette & Laptop Visual Right Side */}
          <g transform="translate(680, 80)">
            {/* Ambient desk glow */}
            <ellipse cx="250" cy="520" rx="280" ry="40" fill="#38bdf8" opacity="0.25" filter="blur(20px)" />

            {/* Laptop Base */}
            <path
              d="M 60 500 L 440 500 L 410 525 L 90 525 Z"
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="2"
            />
            {/* Laptop Screen */}
            <rect
              x="130"
              y="310"
              width="240"
              height="185"
              rx="12"
              fill="#0f172a"
              stroke="#64748b"
              strokeWidth="3"
            />
            <rect x="145" y="325" width="210" height="155" rx="6" fill="#0284c7" opacity="0.85" />
            {/* Laptop glow Apple logo */}
            <circle cx="250" cy="402" r="14" fill="#ffffff" opacity="0.9" />

            {/* Instructor Portrait Avatar Mockup */}
            <g transform="translate(200, 20)">
              {/* Head / Hair */}
              <circle cx="120" cy="110" r="85" fill="#f8cbb0" />
              <path
                d="M 40 100 C 40 30, 200 30, 200 100 C 200 65, 170 45, 120 45 C 70 45, 40 65, 40 100 Z"
                fill="#18181b"
              />
              {/* Eyes & Smile */}
              <circle cx="95" cy="105" r="7" fill="#27272a" />
              <circle cx="145" cy="105" r="7" fill="#27272a" />
              <path d="M 95 135 Q 120 160 145 135" stroke="#27272a" strokeWidth="5" fill="none" strokeLinecap="round" />
              {/* Cheerful glow */}
              <circle cx="78" cy="120" r="10" fill="#fda4af" opacity="0.4" />
              <circle cx="162" cy="120" r="10" fill="#fda4af" opacity="0.4" />
              {/* Polo Shirt with AIS Badge */}
              <path
                d="M 30 190 C 30 150, 210 150, 210 190 L 250 310 L -10 310 Z"
                fill="#0f172a"
                stroke="#1e293b"
                strokeWidth="2"
              />
              <rect x="65" y="195" width="40" height="20" rx="4" fill="#2563eb" />
              <text x="85" y="210" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">AIS</text>
            </g>
          </g>

          {/* Floating AI Agent Cards (Matching Reference Screenshot) */}
          {/* 1. Content Creator Agent */}
          <g transform="translate(540, 130)" filter="url(#cardShadow)">
            <rect width="190" height="68" rx="14" fill="url(#badgeGrad)" stroke="#c7d2fe" strokeWidth="2" />
            <circle cx="34" cy="34" r="22" fill="#818cf8" />
            <text x="34" y="42" fill="#ffffff" fontSize="22" textAnchor="middle">🤖</text>
            <text x="70" y="32" fill="#1e1b4b" fontSize="13" fontWeight="800">Content</text>
            <text x="70" y="48" fill="#4338ca" fontSize="12" fontWeight="700">Creator Agent</text>
          </g>

          {/* 2. Research Agent */}
          <g transform="translate(500, 260)" filter="url(#cardShadow)">
            <rect width="175" height="68" rx="14" fill="url(#badgeGrad)" stroke="#bae6fd" strokeWidth="2" />
            <circle cx="34" cy="34" r="22" fill="#38bdf8" />
            <text x="34" y="42" fill="#ffffff" fontSize="22" textAnchor="middle">🔍</text>
            <text x="70" y="32" fill="#082f49" fontSize="13" fontWeight="800">Research</text>
            <text x="70" y="48" fill="#0284c7" fontSize="12" fontWeight="700">Agent</text>
          </g>

          {/* 3. Email Agent */}
          <g transform="translate(480, 395)" filter="url(#cardShadow)">
            <rect width="170" height="68" rx="14" fill="url(#badgeGrad)" stroke="#a7f3d0" strokeWidth="2" />
            <circle cx="34" cy="34" r="22" fill="#34d399" />
            <text x="34" y="42" fill="#ffffff" fontSize="22" textAnchor="middle">✉️</text>
            <text x="70" y="32" fill="#064e3b" fontSize="13" fontWeight="800">Email</text>
            <text x="70" y="48" fill="#059669" fontSize="12" fontWeight="700">Agent</text>
          </g>

          {/* 4. Lead Gen Agent */}
          <g transform="translate(860, 360)" filter="url(#cardShadow)">
            <rect width="180" height="68" rx="14" fill="url(#badgeGrad)" stroke="#e9d5ff" strokeWidth="2" />
            <circle cx="34" cy="34" r="22" fill="#c084fc" />
            <text x="34" y="42" fill="#ffffff" fontSize="22" textAnchor="middle">👔</text>
            <text x="70" y="32" fill="#3b0764" fontSize="13" fontWeight="800">Lead Gen</text>
            <text x="70" y="48" fill="#7e22ce" fontSize="12" fontWeight="700">Agent</text>
          </g>

          {/* 5. Data Analyst Agent */}
          <g transform="translate(800, 480)" filter="url(#cardShadow)">
            <rect width="195" height="68" rx="14" fill="url(#badgeGrad)" stroke="#fed7aa" strokeWidth="2" />
            <circle cx="34" cy="34" r="22" fill="#fb923c" />
            <text x="34" y="42" fill="#ffffff" fontSize="22" textAnchor="middle">📊</text>
            <text x="70" y="32" fill="#7c2d12" fontSize="13" fontWeight="800">Data Analyst</text>
            <text x="70" y="48" fill="#ea580c" fontSize="12" fontWeight="700">Agent</text>
          </g>

          {/* Center AI Badge */}
          <g transform="translate(710, 395)" filter="url(#cardShadow)">
            <rect width="78" height="78" rx="18" fill="#1e40af" stroke="#60a5fa" strokeWidth="3" />
            <text x="39" y="52" fill="#ffffff" fontSize="34" fontWeight="900" textAnchor="middle">AI</text>
          </g>
        </svg>
      ),
    },
    {
      id: "slide-2",
      title: "Ready to Build?",
      type: "image",
      thumbLabel: "Ready to Build?",
      renderGraphic: () => (
        <svg viewBox="0 0 1200 675" className="h-full w-full object-cover select-none" xmlns="http://www.w3.org/2000/svg">
          <rect width="1200" height="675" fill="#0f172a" />
          <radialGradient id="studioGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#020617" stopOpacity="1" />
          </radialGradient>
          <rect width="1200" height="675" fill="url(#studioGlow)" />
          {/* Dual Monitors Wireframe */}
          <rect x="180" y="160" width="380" height="260" rx="10" fill="#1e293b" stroke="#64748b" strokeWidth="3" />
          <rect x="200" y="180" width="340" height="220" rx="6" fill="#090d16" />
          {/* Code lines */}
          <rect x="220" y="210" width="120" height="8" rx="4" fill="#38bdf8" />
          <rect x="220" y="235" width="240" height="8" rx="4" fill="#a7f3d0" />
          <rect x="220" y="260" width="180" height="8" rx="4" fill="#c084fc" />
          <rect x="220" y="285" width="210" height="8" rx="4" fill="#cbd5e1" />
          <rect x="220" y="310" width="90" height="8" rx="4" fill="#fb923c" />

          {/* Right Monitor */}
          <rect x="620" y="160" width="400" height="260" rx="10" fill="#1e293b" stroke="#64748b" strokeWidth="3" />
          <rect x="640" y="180" width="360" height="220" rx="6" fill="#090d16" />
          <circle cx="740" cy="290" r="40" fill="#6366f1" opacity="0.7" />
          <circle cx="860" cy="290" r="30" fill="#06b6d4" opacity="0.7" />
          <path d="M 780 290 L 830 290" stroke="#ffffff" strokeWidth="4" strokeDasharray="6 4" />

          {/* Giant Bottom Headline Banner */}
          <rect x="0" y="520" width="1200" height="155" fill="#000000" opacity="0.85" />
          <text
            x="600"
            y="615"
            fill="#ffffff"
            fontFamily="system-ui, sans-serif"
            fontWeight="900"
            fontSize="64"
            textAnchor="middle"
            letterSpacing="-1px"
          >
            Ready to Build?
          </text>
        </svg>
      ),
    },
    {
      id: "slide-3",
      title: "AI OS - Build Your Own",
      type: "image",
      thumbLabel: "AI OS",
      renderGraphic: () => (
        <svg viewBox="0 0 1200 675" className="h-full w-full object-cover select-none" xmlns="http://www.w3.org/2000/svg">
          <rect width="1200" height="675" fill="#050814" />
          {/* Cyberpunk Grid */}
          <g opacity="0.2" stroke="#38bdf8" strokeWidth="1">
            {Array.from({ length: 15 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 80} y1="0" x2={i * 80} y2="675" />
            ))}
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 80} x2="1200" y2={i * 80} />
            ))}
          </g>
          {/* Header Title */}
          <text x="600" y="160" fill="#60a5fa" fontSize="90" fontWeight="900" textAnchor="middle" letterSpacing="-2px">
            AI OS
          </text>
          <text x="600" y="240" fill="#e2e8f0" fontSize="42" fontWeight="700" textAnchor="middle">
            Build Your Own Autonomous Operating System
          </text>

          {/* Architecture Blocks */}
          <g transform="translate(180, 310)">
            <rect width="240" height="140" rx="14" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
            <text x="120" y="65" fill="#ffffff" fontSize="20" fontWeight="800" textAnchor="middle">Inbound Webhooks</text>
            <text x="120" y="95" fill="#93c5fd" fontSize="14" textAnchor="middle">CRMs & Form Captures</text>
          </g>
          <path d="M 420 380 L 480 380" stroke="#38bdf8" strokeWidth="4" markerEnd="url(#arrow)" />

          <g transform="translate(480, 310)">
            <rect width="240" height="140" rx="14" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
            <text x="120" y="65" fill="#ffffff" fontSize="20" fontWeight="800" textAnchor="middle">Multi-LLM Router</text>
            <text x="120" y="95" fill="#c7d2fe" fontSize="14" textAnchor="middle">Claude 3.5 & GPT-4o</text>
          </g>
          <path d="M 720 380 L 780 380" stroke="#38bdf8" strokeWidth="4" />

          <g transform="translate(780, 310)">
            <rect width="240" height="140" rx="14" fill="#064e3b" stroke="#34d399" strokeWidth="2" />
            <text x="120" y="65" fill="#ffffff" fontSize="20" fontWeight="800" textAnchor="middle">Autonomous Action</text>
            <text x="120" y="95" fill="#a7f3d0" fontSize="14" textAnchor="middle">Email, Notion, WhatsApp</text>
          </g>

          <rect x="420" y="550" width="360" height="54" rx="27" fill="#2563eb" />
          <text x="600" y="585" fill="#ffffff" fontSize="20" fontWeight="800" textAnchor="middle">
            Build Your Own →
          </text>
        </svg>
      ),
    },
    {
      id: "slide-4",
      title: "Video Lesson & Community Walkthrough",
      type: "video",
      videoUrl: defaultVideoUrl,
      thumbLabel: "Watch Video",
      renderGraphic: () => (
        <svg viewBox="0 0 1200 675" className="h-full w-full object-cover select-none" xmlns="http://www.w3.org/2000/svg">
          <rect width="1200" height="675" fill="#0b0f19" />
          <radialGradient id="vidGlow" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0b0f19" stopOpacity="1" />
          </radialGradient>
          <rect width="1200" height="675" fill="url(#vidGlow)" />

          {/* YouTube Style Badge in center of preview */}
          <g transform="translate(540, 280)">
            <rect width="120" height="84" rx="24" fill="#ff0000" />
            <polygon points="50,26 80,42 50,58" fill="#ffffff" />
          </g>
          <text x="600" y="430" fill="#ffffff" fontSize="32" fontWeight="800" textAnchor="middle">
            Click to Watch Full Overview
          </text>
          <text x="600" y="475" fill="#94a3b8" fontSize="20" textAnchor="middle">
            12-minute community & curriculum walkthrough with Nate Herk
          </text>
        </svg>
      ),
    },
    {
      id: "slide-5",
      title: "100+ N8N TEMPLATES",
      type: "image",
      thumbLabel: "100+ N8N Templates",
      renderGraphic: () => (
        <svg viewBox="0 0 1200 675" className="h-full w-full object-cover select-none" xmlns="http://www.w3.org/2000/svg">
          <rect width="1200" height="675" fill="#090d16" />
          {/* Subtle node matrix */}
          <g opacity="0.3">
            {Array.from({ length: 60 }).map((_, i) => (
              <circle key={i} cx={(i % 10) * 125 + 40} cy={Math.floor(i / 10) * 110 + 40} r="2" fill="#38bdf8" />
            ))}
          </g>
          {/* Bold Central Typography */}
          <g transform="translate(600, 310)">
            <text x="0" y="0" fill="#ffffff" fontSize="120" fontWeight="900" textAnchor="middle" letterSpacing="-2px">
              100+ N8N
            </text>
            <text x="0" y="100" fill="#38bdf8" fontSize="100" fontWeight="900" textAnchor="middle" letterSpacing="-2px">
              TEMPLATES
            </text>
          </g>
          <rect x="400" y="480" width="400" height="50" rx="12" fill="#ea580c" />
          <text x="600" y="513" fill="#ffffff" fontSize="20" fontWeight="800" textAnchor="middle">
            Plug-and-play workflow JSONs included
          </text>
        </svg>
      ),
    },
    {
      id: "slide-6",
      title: "MISSION",
      type: "image",
      thumbLabel: "Mission",
      renderGraphic: () => (
        <svg viewBox="0 0 1200 675" className="h-full w-full object-cover select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="missionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#03102d" />
              <stop offset="100%" stopColor="#010512" />
            </linearGradient>
          </defs>
          <rect width="1200" height="675" fill="url(#missionGrad)" />
          <g transform="translate(600, 190)">
            <text x="0" y="0" fill="#3b82f6" fontSize="110" fontWeight="900" textAnchor="middle" letterSpacing="4px">
              MISSION
            </text>
            <text x="0" y="80" fill="#93c5fd" fontSize="26" fontWeight="800" textAnchor="middle" letterSpacing="2px">
              CREATING THE NEXT GENERATION
            </text>
            <text x="0" y="125" fill="#ffffff" fontSize="32" fontWeight="900" textAnchor="middle">
              OF PROBLEM SOLVERS
            </text>
            <text x="0" y="180" fill="#cbd5e1" fontSize="22" fontWeight="600" textAnchor="middle">
              BY PREPARING ADULTS, REGARDLESS OF BACKGROUND,
            </text>
            <text x="0" y="225" fill="#cbd5e1" fontSize="22" fontWeight="600" textAnchor="middle">
              FOR THE NEXT TYPE OF WORK.
            </text>
          </g>
        </svg>
      ),
    },
  ];

  const activeSlides = slides && slides.length > 0 ? slides : defaultSlides;
  const currentSlide = activeSlides[activeSlideIndex] || activeSlides[0];

  const videoEmbed = currentSlide.type === "video" || isVideoPlaying
    ? toEmbed(currentSlide.videoUrl || defaultVideoUrl)
    : null;

  function handleThumbnailClick(index: number) {
    setActiveSlideIndex(index);
    if (activeSlides[index].type === "video") {
      setIsVideoPlaying(true);
    } else {
      setIsVideoPlaying(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 sm:p-6 shadow-xs">
      {/* Top Header Title */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
          {title}
        </h1>

        {isAdminOrManager && onEditVideo && (
          <button
            type="button"
            onClick={onEditVideo}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition cursor-pointer"
          >
            <span>Edit Video</span>
          </button>
        )}
      </div>

      {/* Main 16:9 Featured Hero Media Container */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl sm:rounded-2xl bg-zinc-950 border border-zinc-200 shadow-inner group">
        {isVideoPlaying && videoEmbed ? (
          <div className="relative h-full w-full bg-black">
            {videoEmbed.type === "file" ? (
              <video
                src={videoEmbed.src}
                controls
                autoPlay
                className="h-full w-full object-contain"
              />
            ) : (
              <iframe
                src={`${videoEmbed.src}${videoEmbed.src.includes("?") ? "&" : "?"}autoplay=1`}
                title={title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
            <button
              type="button"
              onClick={() => setIsVideoPlaying(false)}
              className="absolute top-3 right-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-black/80 text-white hover:bg-black transition cursor-pointer shadow-md"
              title="Close Video"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => {
              if (currentSlide.type === "video") {
                setIsVideoPlaying(true);
              }
            }}
            className={`relative h-full w-full overflow-hidden ${
              currentSlide.type === "video" ? "cursor-pointer" : ""
            }`}
          >
            {/* Custom Image override if user uploaded one */}
            {customThumbnailUrl && activeSlideIndex === 0 ? (
              <img
                src={customThumbnailUrl}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : currentSlide.customImageUrl ? (
              <img
                src={currentSlide.customImageUrl}
                alt={currentSlide.title}
                className="h-full w-full object-cover"
              />
            ) : currentSlide.renderGraphic ? (
              currentSlide.renderGraphic()
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-white font-bold">
                {currentSlide.title}
              </div>
            )}

            {/* Play Button Overlay for Video Slides */}
            {currentSlide.type === "video" && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center transition-all group-hover:bg-black/30">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-white text-zinc-900 shadow-2xl transition-transform duration-300 group-hover:scale-110">
                  <Play fill="currentColor" size={28} className="ml-1 text-primary" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thumbnails Row (Exactly 6 thumbnails matching reference image) */}
      <div className="mt-3.5 sm:mt-4 grid grid-cols-6 gap-2 sm:gap-3">
        {activeSlides.map((slide, idx) => {
          const isActive = idx === activeSlideIndex;
          const isVideo = slide.type === "video";

          return (
            <button
              key={slide.id || idx}
              type="button"
              onClick={() => handleThumbnailClick(idx)}
              className={`relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden rounded-lg sm:rounded-xl border transition-all cursor-pointer select-none bg-zinc-900 shadow-2xs ${
                isActive
                  ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-white scale-[1.02]"
                  : "border-zinc-200/90 hover:border-zinc-400 opacity-90 hover:opacity-100"
              }`}
              title={slide.title}
            >
              {slide.customImageUrl ? (
                <img
                  src={slide.customImageUrl}
                  alt={slide.title}
                  className="h-full w-full object-cover"
                />
              ) : slide.renderGraphic ? (
                <div className="h-full w-full scale-100 pointer-events-none">
                  {slide.renderGraphic()}
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-[10px] text-zinc-300 font-bold p-1 text-center">
                  {slide.thumbLabel || `Slide ${idx + 1}`}
                </div>
              )}

              {/* YouTube Play Icon Badge Overlay on Video Thumbnail (Identical to reference screenshot) */}
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                  <div className="flex h-6 w-9 sm:h-7 sm:w-10 items-center justify-center rounded-lg bg-zinc-950/90 text-white shadow-md">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Metadata Row: 🌐 Public | 👥 466.9k members | 🏷️ Free | [Avatar] By Nate Herk 💎 */}
      <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-between gap-y-2.5 gap-x-4 border-t border-zinc-100 pt-3.5 sm:pt-4 text-xs sm:text-sm text-zinc-700">
        <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2">
          {/* Privacy Status */}
          <div className="inline-flex items-center gap-1.5 font-medium text-zinc-800">
            {privacy === "Public" ? (
              <>
                <Globe size={16} className="text-zinc-500" />
                <span>Public</span>
              </>
            ) : (
              <>
                <Lock size={16} className="text-amber-500" />
                <span>{privacy}</span>
              </>
            )}
          </div>

          {/* Members Count */}
          <div className="inline-flex items-center gap-1.5 font-medium text-zinc-800">
            <Users size={16} className="text-zinc-500" />
            <span>{memberCountText}</span>
          </div>

          {/* Price */}
          <div className="inline-flex items-center gap-1.5 font-medium text-zinc-800">
            <Tag size={16} className="text-zinc-500" />
            <span className={priceText.includes("$") ? "font-bold text-primary" : ""}>
              {priceText}
            </span>
          </div>
        </div>

        {/* Creator Info: [Avatar] By Creator 💎 (Editable for Admin / Manager) */}
        <div className="inline-flex items-center gap-2 font-medium text-zinc-800">
          <div className="flex items-center gap-2">
            {creatorAvatarUrl ? (
              <img
                src={creatorAvatarUrl}
                alt={creatorName}
                className="h-6 w-6 rounded-full object-cover border border-zinc-200"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-indigo-600 text-[10px] font-black text-white">
                {creatorName.charAt(0)}
              </div>
            )}
            <span>By {creatorName}</span>
            <span className="text-xs">{creatorBadge || "💎"}</span>
          </div>

          {isAdminOrManager && onEditCreator && (
            <button
              type="button"
              onClick={onEditCreator}
              className="inline-flex items-center gap-1 rounded-md bg-zinc-100 hover:bg-zinc-200/80 px-2 py-0.5 text-[11px] font-bold text-zinc-700 transition cursor-pointer border border-zinc-200/80 shadow-2xs"
              title="Edit Creator Name, Badge & Avatar"
            >
              <Pencil size={11} className="text-primary" />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
