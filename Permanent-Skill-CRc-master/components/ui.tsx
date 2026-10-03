"use client";

import { initials } from "@/lib/format";
import { X } from "lucide-react";
import type { PublicUser } from "@/lib/types";

export function Avatar({
  user,
  size = 40,
  className = "",
  showOnline = false,
}: {
  user?: Pick<PublicUser, "name" | "avatarColor" | "isOnline"> | null;
  size?: number;
  className?: string;
  showOnline?: boolean;
}) {
  const color = user?.avatarColor || "#5051F9";
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className}`}
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
    >
      {user ? initials(user.name) : "?"}
      {showOnline && user?.isOnline && (
        <span
          className="absolute rounded-full border-2 border-white bg-emerald-500"
          style={{ width: size * 0.28, height: size * 0.28, right: 0, bottom: 0 }}
        />
      )}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
      <div className={`relative z-10 w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl bg-white p-5 shadow-2xl`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function GoldButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-lg bg-[#f0c14b] px-4 py-2.5 text-sm font-bold tracking-wide text-zinc-900 transition hover:bg-[#e3b33a] disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</span>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-zinc-200/80 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  variant = "gradient",
  showLabel = false,
  interactive = false,
  onChange,
  className = "",
}: {
  value: number;
  max?: number;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "gradient" | "emerald" | "indigo" | "primary" | "amber";
  showLabel?: boolean;
  interactive?: boolean;
  onChange?: (val: number) => void;
  className?: string;
}) {
  const percentage = Math.max(0, Math.min(100, Math.round((value / max) * 100)));

  const heightClass =
    size === "xs"
      ? "h-1.5"
      : size === "sm"
        ? "h-2"
        : size === "lg"
          ? "h-3.5"
          : "h-2.5";

  const colorClass =
    percentage === 100
      ? "bg-emerald-500"
      : variant === "emerald"
        ? "bg-emerald-500"
        : variant === "indigo"
          ? "bg-[#5051F9]"
          : variant === "amber"
            ? "bg-amber-500"
            : variant === "primary"
              ? "bg-primary"
              : "bg-gradient-to-r from-[#5051F9] to-indigo-500";

  return (
    <div className={`w-full ${className}`}>
      <div
        onClick={(e) => {
          if (!interactive || !onChange) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const newPct = Math.round((clickX / rect.width) * max);
          onChange(Math.max(0, Math.min(max, newPct)));
        }}
        className={`relative w-full overflow-hidden rounded-full bg-zinc-200/80 shadow-inner ${heightClass} ${
          interactive ? "cursor-pointer transition hover:bg-zinc-300/80" : ""
        }`}
        title={interactive ? "Click to set progress" : `${percentage}%`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-zinc-500">
          <span>Progress</span>
          <span>{percentage}%</span>
        </div>
      )}
    </div>
  );
}

export function AdminShieldFavicon({
  size = 14,
  className = "",
  title = "Administrator",
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id="adminThemeShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#5051F9" />
          <stop offset="100%" stopColor="#3F40DC" />
        </linearGradient>
      </defs>
      {/* Outer Shield with Theme Gradient */}
      <path
        d="M50 6 L88 20 C88 56 68 83 50 95 C32 83 12 56 12 20 Z"
        fill="url(#adminThemeShieldGrad)"
      />
      {/* Inner White Contour Border */}
      <path
        d="M50 14 L80 26 C80 54 63 76 50 86 C37 76 20 54 20 26 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* User Silhouette: Head */}
      <circle cx="50" cy="40" r="13" fill="none" stroke="#FFFFFF" strokeWidth="4.5" />
      {/* User Silhouette: Body Arc */}
      <path
        d="M28 72 C28 58 38 56 50 56 C62 56 72 58 72 72"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ManagerAvatarFavicon({
  size = 14,
  className = "",
  title = "Community Manager",
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {title && <title>{title}</title>}
      {/* Soft sticker contour */}
      <circle cx="50" cy="50" r="48" fill="#FFFFFF" fillOpacity="0.2" />

      {/* Hair (Dark Navy) */}
      <path
        d="M25 42 C25 20 36 10 52 10 C68 10 75 18 75 36 C75 42 72 48 68 50 C68 36 62 25 50 25 C38 25 32 34 29 44 Z"
        fill="#1E293B"
      />
      
      {/* Ears & Face */}
      <circle cx="30" cy="44" r="5.5" fill="#FBCFB0" />
      <circle cx="70" cy="44" r="5.5" fill="#FBCFB0" />
      <path
        d="M32 36 C32 25 42 22 50 22 C58 22 68 25 68 36 C68 50 62 60 50 60 C38 60 32 50 32 36 Z"
        fill="#FDD9BD"
      />
      {/* Neck */}
      <path d="M43 56 L43 68 L57 68 L57 56 Z" fill="#E8B99A" />

      {/* Navy Suit Jacket */}
      <path
        d="M18 92 C18 74 30 66 40 64 L50 78 L60 64 C70 66 82 74 82 92 Z"
        fill="#1E3A8A"
      />

      {/* Light Blue Shirt Collar */}
      <path d="M40 64 L50 78 L60 64 L50 61 Z" fill="#E0F2FE" />

      {/* Purple-Lavender Tie */}
      <path d="M47 67 L53 67 L55 86 L50 90 L45 86 Z" fill="#6366F1" />
    </svg>
  );
}

export function UserRoleBadge({
  role,
  isPremium,
  size = "sm",
  className = "",
}: {
  role?: string;
  isPremium?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isTeam = role === "team_member";
  const isOnlyVip = isPremium && !isAdmin && !isManager;

  if (!isAdmin && !isManager && !isTeam && !isOnlyVip) return null;

  const sizeClass =
    size === "xs"
      ? "text-[10px] px-1.5 py-0.2"
      : size === "sm"
        ? "text-[11px] px-2 py-0.5"
        : "text-xs px-2.5 py-1";

  const iconPx = size === "xs" ? 12 : size === "sm" ? 14 : 16;

  return (
    <span className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      {isAdmin && (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-extrabold uppercase tracking-wide bg-zinc-950 text-indigo-200 border border-[#5051F9]/50 shadow-2xs ${sizeClass}`}
          title="Verified Administrator"
        >
          <AdminShieldFavicon size={iconPx} />
          <span>Admin</span>
        </span>
      )}
      {isManager && (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-extrabold uppercase tracking-wide bg-[#0F172A] text-blue-200 border border-blue-400/50 shadow-2xs ${sizeClass}`}
          title="Community Manager"
        >
          <ManagerAvatarFavicon size={iconPx} />
          <span>Manager</span>
        </span>
      )}
      {isTeam && (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-bold uppercase tracking-wide bg-purple-900/90 text-purple-100 border border-purple-400/40 shadow-2xs ${sizeClass}`}
          title="Team Specialist"
        >
          <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-xs bg-white/20 text-[8px] font-black">
            👥
          </span>
          <span>Team</span>
        </span>
      )}
      {isOnlyVip && (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-bold uppercase tracking-wide bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 border border-amber-400 shadow-2xs ${sizeClass}`}
          title="VIP Member"
        >
          <span>💎</span>
          <span>VIP</span>
        </span>
      )}
    </span>
  );
}

export function StaffRoleFavicon({
  role,
  size = "sm",
  showLabel = true,
  className = "",
}: {
  role?: string;
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
  className?: string;
}) {
  if (!showLabel) {
    const iconPx = size === "xs" ? 13 : size === "sm" ? 15 : 18;
    if (role === "admin") return <AdminShieldFavicon size={iconPx} className={className} />;
    if (role === "manager") return <ManagerAvatarFavicon size={iconPx} className={className} />;
    return null;
  }
  return <UserRoleBadge role={role} size={size} className={className} />;
}



