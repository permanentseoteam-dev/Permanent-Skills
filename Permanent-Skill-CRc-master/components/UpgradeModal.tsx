"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "./AppProvider";
import { GoldButton, Modal, PrimaryButton } from "./ui";

export function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, upgrade } = useApp();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setBusy(true);
    setError("");
    const result = await upgrade();
    setBusy(false);
    if (!result.ok) {
      setError(result.error || "Could not upgrade.");
      return;
    }
    setDone(true);
  }

  return (
    <Modal open={open} onClose={onClose} title="👑 Upgrade to VIP">
      {user?.isPremium || done ? (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">👑 VIP Membership is active. Masterminds, live calls, and member perks are unlocked.</p>
          <PrimaryButton onClick={onClose} className="w-full">Continue</PrimaryButton>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-bold text-zinc-900">
              $9<span className="text-base font-medium text-zinc-500">/month</span>
            </p>
            <Link
              href="/about?plan=vip"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-bold text-primary hover:border-primary/40 hover:bg-primary/5 transition shadow-2xs"
            >
              See About →
            </Link>
          </div>
          <ul className="space-y-2 text-sm text-zinc-700">
            <li>✓ Unlock VIP mastermind calls</li>
            <li>✓ Full classroom across all courses</li>
            <li>✓ Templates and exclusive member perks</li>
            <li>✓ Cancel anytime</li>
          </ul>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <GoldButton className="w-full cursor-pointer" disabled={busy} onClick={confirm}>
            {busy ? "Processing..." : "👑 Confirm VIP Access ($9/month)"}
          </GoldButton>
        </div>
      )}
    </Modal>
  );
}
