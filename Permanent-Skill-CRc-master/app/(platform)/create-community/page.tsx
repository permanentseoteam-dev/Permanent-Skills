"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Card, Field, PrimaryButton, inputClass } from "@/components/ui";
import { Lock, Globe, Users } from "lucide-react";

export default function CreateCommunityPage() {
  const router = useRouter();
  const { createCommunity, user } = useApp();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      const result = await createCommunity({
        name,
        description,
        isPrivate,
      });

      if (!result.ok) {
        setError(result.error || "Could not create community.");
        return;
      }

      router.push("/community");
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-2 text-2xl font-bold">Create a community</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Launch a new dedicated group for collaboration, exclusive trainings, or masterminds.
      </p>

      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Community name">
            <input
              className={inputClass}
              placeholder="e.g. AI Automation & Web Hub"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={3}
            />
          </Field>

          <Field label="Description">
            <textarea
              className={`${inputClass} min-h-[90px]`}
              placeholder="What is the mission and focus of this community?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <div>
            <span className="mb-2 block text-sm font-medium text-zinc-700">Privacy & Access</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition ${
                  isPrivate
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  <Lock size={15} /> Private
                </div>
                <span className="text-xs opacity-75">Only approved members can access</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition ${
                  !isPrivate
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  <Globe size={15} /> Public
                </div>
                <span className="text-xs opacity-75">Open to all platform members</span>
              </button>
            </div>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <div className="pt-2">
            <PrimaryButton type="submit" disabled={busy} className="w-full">
              {busy ? "Creating community..." : "Create community"}
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
