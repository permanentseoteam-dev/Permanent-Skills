"use client";

import { initials } from "@/lib/format";
import { X } from "lucide-react";
import type { PublicUser } from "@/lib/types";

export function Avatar({
  user,
  size = 40,
  className = "",
}: {
  user?: Pick<PublicUser, "name" | "avatarColor" | "isOnline"> | null;
  size?: number;
  className?: string;
}) {
  const color = user?.avatarColor || "#5051F9";
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className}`}
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
    >
      {user ? initials(user.name) : "?"}
      {user?.isOnline && (
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

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
      <div
        className="h-full rounded-full bg-emerald-500 transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
