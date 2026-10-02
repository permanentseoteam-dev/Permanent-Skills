"use client";

import { useRouter } from "next/navigation";
import { Hourglass } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { PrimaryButton } from "@/components/ui";
import { AuthCard } from "@/components/AuthCard";

export default function PendingPage() {
  const { user, logout } = useApp();
  const router = useRouter();

  return (
    <AuthCard title="Application pending" subtitle="You will get full access as soon as an admin approves you">
      <div className="rounded-2xl bg-amber-50 p-4 text-center">
        <Hourglass className="mx-auto mb-2 text-amber-600" />
        <p className="text-sm text-amber-900">
          Thanks {user?.name || "there"}. Your request is in the review queue. This keeps the community high-signal.
        </p>
      </div>
      <PrimaryButton
        className="mt-6 w-full"
        onClick={async () => {
          await logout();
          router.push("/login");
        }}
      >
        Log out
      </PrimaryButton>
    </AuthCard>
  );
}
