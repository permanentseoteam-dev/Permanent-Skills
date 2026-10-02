"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Avatar, Card, PrimaryButton } from "@/components/ui";
import { ChatDrawer } from "@/components/ChatDrawer";
import { getLevel } from "@/lib/levels";

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const { userById, user } = useApp();
  const [chatId, setChatId] = useState<string | null>(null);
  const person = userById(params.id);
  if (!person) return <p className="text-zinc-500">Member not found.</p>;
  const level = getLevel(person.points);

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="p-8 text-center">
        <Avatar user={person} size={96} className="mx-auto" />
        <h1 className="mt-4 text-2xl font-bold">{person.name}</h1>
        <p className="text-sm text-primary">
          Level {level.level} · {level.name}
        </p>
        <p className="mt-1 text-sm text-zinc-500">@{person.username}</p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-700">{person.bio}</p>
        <p className="mt-2 text-sm text-zinc-500">{person.location}</p>
        <p className="mt-1 text-xs text-zinc-400">
          Joined {new Date(person.joinedAt).toLocaleDateString()} · {person.points} points
        </p>
        {person.id !== user?.id && (
          <PrimaryButton className="mt-5" onClick={() => setChatId(person.id)}>
            Message
          </PrimaryButton>
        )}
      </Card>
      <ChatDrawer userId={chatId} onClose={() => setChatId(null)} />
    </div>
  );
}
