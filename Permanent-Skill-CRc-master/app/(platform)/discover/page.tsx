"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, PrimaryButton } from "@/components/ui";

export default function DiscoverPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold">Discover communities</h1>
      <Card className="flex items-center gap-4 p-5">
        <Image src="/logo.png" alt="" width={56} height={56} className="h-14 w-14 object-contain" />
        <div className="flex-1">
          <p className="font-semibold">Permanent Skill Strategy</p>
          <p className="text-sm text-zinc-500">Private community for durable SEO and skill systems.</p>
        </div>
        <Link href="/community">
          <PrimaryButton>Open</PrimaryButton>
        </Link>
      </Card>
    </div>
  );
}
