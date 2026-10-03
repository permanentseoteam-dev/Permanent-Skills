"use client";

import { Card } from "@/components/ui";

const FAQS = [
  {
    q: "How do I get access to the classroom?",
    a: "Create an account, submit the application form, and wait for an admin to approve you. After approval every section unlocks.",
  },
  {
    q: "Who can see sales and login totals?",
    a: "Only admins. Members see community counts (members, online, admins) but never revenue or login totals.",
  },
  {
    q: "How do levels work?",
    a: "You earn points by posting, commenting, completing lessons, and staying active. Higher levels unlock extra perks.",
  },
  {
    q: "How do I upgrade?",
    a: "Use the Upgrade button in the sidebar. VIP is $9/month and unlocks mastermind calls plus member perks.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Help center</h1>
      {FAQS.map((item) => (
        <Card key={item.q} className="p-5">
          <h2 className="font-semibold">{item.q}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{item.a}</p>
        </Card>
      ))}
    </div>
  );
}
