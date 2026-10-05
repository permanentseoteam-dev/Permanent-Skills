"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Card, Field, PrimaryButton, PasswordInput, inputClass } from "@/components/ui";

export default function SettingsPage() {
  const { user, updateProfile, changePassword } = useApp();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [language, setLanguage] = useState(user?.language || "English");

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setBio(user.bio);
    setLocation(user.location);
    setLanguage(user.language || "English");
  }, [user]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card className="space-y-3 p-6">
        <h2 className="font-semibold">Profile</h2>
        <Field label="Name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Bio">
          <textarea className={`${inputClass} min-h-[90px]`} value={bio} onChange={(e) => setBio(e.target.value)} />
        </Field>
        <Field label="Location">
          <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} />
        </Field>
        <Field label="Language">
          <select className={inputClass} value={language} onChange={(e) => setLanguage(e.target.value)}>
            {["English", "Arabic", "Spanish", "French"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
        <PrimaryButton
          onClick={async () => {
            const r = await updateProfile({ name, bio, location, language });
            setMsg(r.ok ? "Profile saved." : r.error || "Error");
          }}
        >
          Save profile
        </PrimaryButton>
      </Card>
      <Card className="space-y-3 p-6">
        <h2 className="font-semibold">Password</h2>
        <Field label="Current password">
          <PasswordInput value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="New password">
          <PasswordInput value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
        <PrimaryButton
          onClick={async () => {
            const r = await changePassword(current, next);
            setMsg(r.ok ? "Password updated." : r.error || "Error");
            if (r.ok) {
              setCurrent("");
              setNext("");
            }
          }}
        >
          Update password
        </PrimaryButton>
      </Card>
      {msg && <p className="text-sm text-primary">{msg}</p>}
    </div>
  );
}
