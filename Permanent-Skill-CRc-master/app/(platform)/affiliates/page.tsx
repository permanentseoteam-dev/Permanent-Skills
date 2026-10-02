"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Card, PrimaryButton } from "@/components/ui";
import { formatMoney } from "@/lib/format";

export default function AffiliatesPage() {
  const { user } = useApp();
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState("");

  useEffect(() => {
    if (user?.affiliateCode) {
      setLink(`${window.location.origin}/register?ref=${user.affiliateCode}`);
    }
  }, [user?.affiliateCode]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold">Affiliates</h1>
      <Card className="p-6">
        <p className="text-sm text-zinc-600">Share Permanent Skill Strategy. You earn $9 when someone you refer upgrades to Premium.</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">Your link</p>
        <div className="mt-2 flex gap-2">
          <input readOnly value={link} className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          <PrimaryButton
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              setCopied(true);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </PrimaryButton>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-zinc-50 p-3">
            <p className="text-2xl font-bold">{user?.affiliateClicks ?? 0}</p>
            <p className="text-xs text-zinc-500">Clicks</p>
          </div>
          <div className="rounded-xl bg-zinc-50 p-3">
            <p className="text-2xl font-bold">{user?.affiliateSignups ?? 0}</p>
            <p className="text-xs text-zinc-500">Signups</p>
          </div>
          <div className="rounded-xl bg-zinc-50 p-3">
            <p className="text-2xl font-bold">{formatMoney(user?.affiliateEarnings ?? 0)}</p>
            <p className="text-xs text-zinc-500">Earnings</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
