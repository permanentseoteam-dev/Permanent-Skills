"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { Card, PrimaryButton } from "@/components/ui";
import { Lock, Globe, Users, Plus, Check } from "lucide-react";

export default function DiscoverPage() {
  const router = useRouter();
  const { communities, activeCommunity, switchCommunity } = useApp();

  const list = communities && communities.length > 0 ? communities : [
    {
      id: "comm-pss",
      name: "Permanent Skill Strategy",
      slug: "permanent-skill-strategy",
      description: "Private community for durable SEO and skill systems.",
      icon: "/logo.png",
      isPrivate: true,
      memberCount: 12,
      createdAt: "",
      createdBy: "u-admin",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discover communities</h1>
          <p className="text-sm text-zinc-500">Explore and switch between active communities and special interest groups.</p>
        </div>
        <Link href="/create-community">
          <PrimaryButton className="inline-flex items-center gap-1">
            <Plus size={16} /> Create community
          </PrimaryButton>
        </Link>
      </div>

      <div className="grid gap-4">
        {list.map((c) => {
          const isCurrent = (activeCommunity?.id || "comm-pss") === c.id;
          return (
            <Card key={c.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5">
              {c.icon ? (
                <Image src={c.icon} alt="" width={56} height={56} className="h-14 w-14 object-contain shrink-0" />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#5051F9]/10 text-xl font-bold text-primary">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-zinc-900 truncate">{c.name}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                    {c.isPrivate ? <Lock size={11} /> : <Globe size={11} />}
                    {c.isPrivate ? "Private" : "Public"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{c.description}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {c.memberCount || 1} members
                  </span>
                </div>
              </div>
              <div className="shrink-0 pt-2 sm:pt-0">
                {isCurrent ? (
                  <button
                    onClick={() => router.push("/community")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                  >
                    <Check size={16} /> Active (Open)
                  </button>
                ) : (
                  <PrimaryButton
                    onClick={() => {
                      switchCommunity(c.id);
                      router.push("/community");
                    }}
                  >
                    Switch & Open
                  </PrimaryButton>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
