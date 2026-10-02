"use client";

import { useMemo, useRef, useState } from "react";
import {
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  MoreVertical,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Avatar, Card, Field, Modal, PrimaryButton, ProgressBar, inputClass } from "@/components/ui";
import { eventTimeLabel, formatDateTime } from "@/lib/format";
import type { CalendarEvent, Project, PublicUser } from "@/lib/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

type ProjectForm = {
  id?: string;
  title: string;
  description: string;
  version: string;
  leadId: string;
  leadName: string;
  memberIds: string[];
  mentionedUsernames: string[];
  progress: number;
  status: "active" | "completed" | "paused";
  meetSyncTime: string;
  meetRoom: string;
  meetUrl: string;
};

const emptyProjectForm: ProjectForm = {
  title: "",
  description: "",
  version: "v2.4.0",
  leadId: "",
  leadName: "",
  memberIds: [],
  mentionedUsernames: [],
  progress: 75,
  status: "active",
  meetSyncTime: "Sprint Sync: Today, 3:00 PM",
  meetRoom: "Nexus Meet #room-design",
  meetUrl: "https://meet.google.com/new",
};

export default function MeetPage() {
  const { events, projects, users, user, saveProject, deleteProject, userById } = useApp();
  const [cursor, setCursor] = useState(new Date(2026, 8, 1));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Project Modal State
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectForm>(emptyProjectForm);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // @ Mention state
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionCursorIndex, setMentionCursorIndex] = useState<number | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const grid = useMemo(() => {
    const start = startOfMonth(cursor);
    const firstMondayOffset = (start.getDay() + 6) % 7;
    const begin = new Date(start);
    begin.setDate(start.getDate() - firstMondayOffset);
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(begin);
      d.setDate(begin.getDate() + i);
      cells.push(d);
    }
    return cells;
  }, [cursor]);

  const today = new Date();

  // Filtered members for @ mentions
  const mentionCandidates = useMemo(() => {
    const q = mentionQuery.toLowerCase().trim();
    if (!q) return users.slice(0, 6);
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [users, mentionQuery]);

  function openCreateProject() {
    setForm({
      ...emptyProjectForm,
      leadId: user?.id || users[0]?.id || "",
      leadName: user?.name || users[0]?.name || "Sarah K.",
      memberIds: user?.id ? [user.id] : [],
    });
    setEditingProjectId(null);
    setErrorMsg("");
    setProjectModalOpen(true);
  }

  function openEditProject(proj: Project) {
    setForm({
      id: proj.id,
      title: proj.title,
      description: proj.description,
      version: proj.version || "v1.0.0",
      leadId: proj.leadId,
      leadName: proj.leadName || "",
      memberIds: proj.memberIds || [],
      mentionedUsernames: proj.mentionedUsernames || [],
      progress: proj.progress || 0,
      status: proj.status || "active",
      meetSyncTime: proj.meetSyncTime || "Sprint Sync: Today, 3:00 PM",
      meetRoom: proj.meetRoom || "Nexus Meet #room-design",
      meetUrl: proj.meetUrl || "https://meet.google.com/new",
    });
    setEditingProjectId(proj.id);
    setErrorMsg("");
    setProjectModalOpen(true);
  }

  // Handle typing in description to detect `@`
  function handleDescriptionChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    const cursorPos = e.target.selectionStart;
    setForm((f) => ({ ...f, description: text }));

    // Check if there is an `@` right before or around the cursor
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf("@");

    if (lastAtPos !== -1 && lastAtPos < cursorPos) {
      const queryPart = textBeforeCursor.slice(lastAtPos + 1);
      // Valid mention query if no spaces or short query
      if (!queryPart.includes(" ") && queryPart.length <= 20) {
        setMentionQuery(queryPart);
        setMentionCursorIndex(lastAtPos);
        setShowMentionMenu(true);
        return;
      }
    }
    setShowMentionMenu(false);
  }

  // Insert mention into description and automatically add member to team
  function selectMentionMember(member: PublicUser) {
    if (mentionCursorIndex === null) return;
    const desc = form.description;
    const beforeAt = desc.slice(0, mentionCursorIndex);
    const textAfterCursor = desc.slice(mentionCursorIndex + 1 + mentionQuery.length);
    const newDesc = `${beforeAt}@${member.username} ${textAfterCursor}`;

    const newMemberIds = Array.from(new Set([...form.memberIds, member.id]));
    const newMentioned = Array.from(new Set([...form.mentionedUsernames, member.username]));

    setForm((f) => ({
      ...f,
      description: newDesc,
      memberIds: newMemberIds,
      mentionedUsernames: newMentioned,
    }));

    setShowMentionMenu(false);
    setMentionQuery("");

    // Restore focus to textarea
    setTimeout(() => {
      if (descriptionRef.current) {
        const nextPos = mentionCursorIndex + member.username.length + 2;
        descriptionRef.current.focus();
        descriptionRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 50);
  }

  function toggleTeamMember(memberId: string) {
    setForm((f) => {
      const exists = f.memberIds.includes(memberId);
      const nextIds = exists ? f.memberIds.filter((id) => id !== memberId) : [...f.memberIds, memberId];
      return { ...f, memberIds: nextIds };
    });
  }

  async function onSaveProject() {
    if (!form.title.trim()) {
      setErrorMsg("Please enter a project title.");
      return;
    }
    setBusy(true);
    setErrorMsg("");
    const res = await saveProject({
      ...form,
      id: editingProjectId || undefined,
    });
    setBusy(false);
    if (!res.ok) {
      setErrorMsg(res.error || "Could not save project.");
      return;
    }
    setProjectModalOpen(false);
  }

  async function onDeleteProject(id: string) {
    if (!confirm("Are you sure you want to delete this project?")) return;
    await deleteProject(id);
  }

  return (
    <div className="space-y-6">
      {/* 1. Active Projects Section (Matching Reference Image 1) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <span>Active Projects</span>
              <span className="h-2.5 w-2.5 rounded-full bg-[#5051F9]" />
            </h2>
          </div>
          <p className="text-xs text-zinc-500">
            Showing active initiatives synced with Meet Calendar
          </p>
        </div>

        {projects.length === 0 ? (
          <Card className="p-8 text-center bg-zinc-50/50 border-dashed">
            <Layers size={32} className="mx-auto text-zinc-400 mb-2" />
            <p className="text-sm font-semibold text-zinc-700">No active projects yet</p>
            <p className="text-xs text-zinc-500 mt-1">
              Click &ldquo;+ Add Project&rdquo; on the calendar toolbar to create your first team initiative.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {projects.map((proj) => {
              const lead = users.find((u) => u.id === proj.leadId);
              const teamMembers = proj.memberIds
                .map((id) => users.find((u) => u.id === id))
                .filter(Boolean) as PublicUser[];

              return (
                <Card
                  key={proj.id}
                  className="overflow-hidden border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: UI Mockup / Thumbnail Box */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 flex-1 min-w-0">
                      <div className="relative h-32 w-full sm:w-56 shrink-0 overflow-hidden rounded-xl border border-zinc-200/80 bg-gradient-to-br from-zinc-50 via-zinc-100 to-indigo-50/40 p-3 shadow-inner">
                        {/* Mock UI window layout */}
                        <div className="flex items-center justify-between border-b border-zinc-200/60 pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-zinc-700">Active</span>
                          </div>
                          <span className="text-[9px] font-mono text-zinc-400">#meet-sync</span>
                        </div>
                        <div className="mt-2.5 space-y-1.5">
                          <div className="h-2.5 w-3/4 rounded bg-indigo-200/70" />
                          <div className="h-2 w-1/2 rounded bg-zinc-200" />
                          <div className="grid grid-cols-3 gap-1 pt-1.5">
                            <div className="h-6 rounded bg-white shadow-xs border border-zinc-100" />
                            <div className="h-6 rounded bg-indigo-500/10 border border-indigo-100" />
                            <div className="h-6 rounded bg-white shadow-xs border border-zinc-100" />
                          </div>
                        </div>
                        <span className="absolute bottom-2 right-2 rounded bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-bold font-mono text-white backdrop-blur-xs">
                          {proj.version || "v2.4.0"}
                        </span>
                      </div>

                      {/* Middle: Details & Team */}
                      <div className="min-w-0 flex-1 space-y-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-zinc-900">{proj.title}</h3>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 capitalize border border-emerald-200/60">
                              ● {proj.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                            {proj.description.split(" ").map((word, i) => {
                              if (word.startsWith("@")) {
                                return (
                                  <span key={i} className="font-semibold text-primary bg-primary/10 px-1 py-0.5 rounded mx-0.5">
                                    {word}{" "}
                                  </span>
                                );
                              }
                              return word + " ";
                            })}
                          </p>
                        </div>

                        {/* Metadata row: Avatars, Lead, Progress */}
                        <div className="flex items-center gap-4 flex-wrap pt-1">
                          {/* Member Avatars */}
                          <div className="flex items-center -space-x-2">
                            {teamMembers.slice(0, 4).map((m) => (
                              <Avatar
                                key={m.id}
                                user={m}
                                size={28}
                                className="ring-2 ring-white"
                              />
                            ))}
                            {teamMembers.length > 4 && (
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700 ring-2 ring-white">
                                +{teamMembers.length - 4}
                              </span>
                            )}
                          </div>

                          {/* Lead Badge */}
                          <div className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                            <Users size={13} className="text-zinc-500" />
                            <span>Lead: <strong className="font-semibold">{proj.leadName || lead?.name || "Admin"}</strong></span>
                          </div>

                          {/* Progress bar */}
                          <div className="flex items-center gap-2 min-w-[140px] max-w-[180px] flex-1">
                            <div className="flex-1">
                              <ProgressBar value={proj.progress} />
                            </div>
                            <span className="text-xs font-bold text-zinc-700">{proj.progress}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: MEET SYNC STATUS Box (Matching Image 1) */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 border-t lg:border-t-0 lg:border-l border-zinc-100 pt-3 lg:pt-0 lg:pl-6 shrink-0">
                      <div className="w-full lg:w-[260px] rounded-xl bg-[#5051F9]/5 border border-[#5051F9]/15 p-3.5 space-y-2">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-[#5051F9]/80 font-mono">
                          MEET SYNC STATUS
                        </span>
                        <div className="flex items-start gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#5051F9] text-white shadow-xs">
                            <CalendarIcon size={15} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-zinc-900 truncate">
                              {proj.meetSyncTime || "Sprint Sync: Today, 3:00 PM"}
                            </p>
                            <p className="text-[11px] text-zinc-500 truncate">
                              {proj.meetRoom || "Nexus Meet #room-design"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Project actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {proj.meetUrl && (
                          <a
                            href={proj.meetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition"
                          >
                            <Video size={13} className="text-[#5051F9]" /> Join Meet
                          </a>
                        )}
                        <button
                          onClick={() => openEditProject(proj)}
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition"
                          title="Edit Project"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => onDeleteProject(proj.id)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
                          title="Delete Project"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Calendar Grid Toolbar & Grid (Matching Image 2 with Add Project button) */}
      <Card className="p-5">
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            onClick={() => setCursor(new Date())}
            className="rounded-full border border-zinc-200 bg-white px-3.5 py-1 text-sm font-medium hover:bg-zinc-50 shadow-xs"
          >
            Today
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-600 transition"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <h1 className="text-lg font-bold text-zinc-900">
                {cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h1>
              <p className="text-xs text-zinc-500">
                {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} Karachi time
              </p>
            </div>
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-600 transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Right Toolbar Action: + Add Project (Where the red arrow pointed) */}
          <div>
            <PrimaryButton
              onClick={openCreateProject}
              className="inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3.5 shadow-sm"
            >
              <Plus size={15} /> Add Project
            </PrimaryButton>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-bold uppercase tracking-wider text-zinc-400">
          {DAYS.map((d) => (
            <div key={d} className="py-2.5">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 border-t border-zinc-100">
          {grid.map((date) => {
            const key = date.toDateString();
            const inMonth = date.getMonth() === cursor.getMonth();
            const isToday = date.toDateString() === today.toDateString();
            const dayEvents = events.filter((e) => new Date(e.start).toDateString() === key);
            return (
              <div
                key={key}
                className={`min-h-[110px] border-b border-r border-zinc-100 p-2 transition ${
                  inMonth ? "bg-white" : "bg-zinc-50/50"
                }`}
              >
                <div
                  className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isToday
                      ? "bg-red-500 text-white"
                      : inMonth
                        ? "text-zinc-800"
                        : "text-zinc-400"
                  }`}
                >
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setSelectedEvent(e)}
                      className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium transition ${
                        e.type === "premium"
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      {eventTimeLabel(e.start)} - {e.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 3. Event Detail Modal */}
      <Modal
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title || "Meet Session"}
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-zinc-600 bg-zinc-50 p-2.5 rounded-lg">
              <CalendarIcon size={16} className="text-primary" />
              <span>{formatDateTime(selectedEvent.start)}</span>
            </div>
            <p className="text-sm text-zinc-700 leading-relaxed">{selectedEvent.description}</p>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="rounded bg-primary/10 px-2 py-1 text-primary uppercase tracking-wider">
                {selectedEvent.type} session
              </span>
            </div>
            <PrimaryButton className="w-full" onClick={() => setSelectedEvent(null)}>
              Add to my schedule
            </PrimaryButton>
          </div>
        )}
      </Modal>

      {/* 4. Add / Edit Project Modal with @ Mentions Autocomplete */}
      <Modal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        title={editingProjectId ? "Edit Project" : "Add Project"}
        wide
      >
        <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Project Title *">
              <input
                className={inputClass}
                placeholder="e.g. Nexus Design System 2.0"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </Field>

            <Field label="Version Tag">
              <input
                className={inputClass}
                placeholder="e.g. v2.4.0"
                value={form.version}
                onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
              />
            </Field>

            <Field label="Project Lead">
              <select
                className={inputClass}
                value={form.leadId}
                onChange={(e) => {
                  const selUser = users.find((u) => u.id === e.target.value);
                  setForm((f) => ({
                    ...f,
                    leadId: e.target.value,
                    leadName: selUser?.name || f.leadName,
                  }));
                }}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (@{u.username})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectForm["status"] }))}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
              </select>
            </Field>
          </div>

          {/* Description field with interactive @ mentions */}
          <div className="relative">
            <Field label="Description & Notes (Type @ to mention and add members)">
              <textarea
                ref={descriptionRef}
                className="min-h-[90px] w-full rounded-lg border border-zinc-200 p-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Describe project goals. Type @ to mention community members and auto-assign them to the team..."
                value={form.description}
                onChange={handleDescriptionChange}
              />
            </Field>

            {/* Floating @ Mention Autocomplete Popover */}
            {showMentionMenu && (
              <div className="absolute left-2 top-[72px] z-50 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
                <div className="bg-zinc-50 px-3 py-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Mention & Add Member
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-zinc-50">
                  {mentionCandidates.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-zinc-500">No members found</p>
                  ) : (
                    mentionCandidates.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => selectMentionMember(m)}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-indigo-50/70 transition"
                      >
                        <Avatar user={m} size={28} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-zinc-900 truncate">{m.name}</p>
                          <p className="text-[11px] text-primary truncate">@{m.username}</p>
                        </div>
                        <Plus size={13} className="text-zinc-400" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Team Members Assignment Chips */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Assigned Team Members ({form.memberIds.length})
            </label>
            <div className="flex flex-wrap gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50/50 p-2 min-h-[44px]">
              {form.memberIds.map((id) => {
                const mem = users.find((u) => u.id === id);
                if (!mem) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 shadow-xs border border-zinc-200"
                  >
                    <Avatar user={mem} size={18} />
                    <span>{mem.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleTeamMember(id)}
                      className="text-zinc-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                );
              })}

              {/* Quick Add Member Picker */}
              <div className="relative inline-block">
                <select
                  className="rounded-full bg-zinc-200/80 px-2.5 py-1 text-xs font-semibold text-zinc-700 outline-none hover:bg-zinc-300 transition cursor-pointer"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) toggleTeamMember(e.target.value);
                  }}
                >
                  <option value="">+ Add Member (@)</option>
                  {users
                    .filter((u) => !form.memberIds.includes(u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (@{u.username})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={`Progress (${form.progress}%)`}>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.progress}
                  onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))}
                  className="flex-1 accent-primary"
                />
                <span className="w-10 text-right text-xs font-bold text-zinc-700">{form.progress}%</span>
              </div>
            </Field>

            <Field label="Meet Sync Schedule">
              <input
                className={inputClass}
                placeholder="e.g. Sprint Sync: Today, 3:00 PM"
                value={form.meetSyncTime}
                onChange={(e) => setForm((f) => ({ ...f, meetSyncTime: e.target.value }))}
              />
            </Field>

            <Field label="Meet Room / Channel">
              <input
                className={inputClass}
                placeholder="e.g. Nexus Meet #room-design"
                value={form.meetRoom}
                onChange={(e) => setForm((f) => ({ ...f, meetRoom: e.target.value }))}
              />
            </Field>

            <Field label="Meet Video URL">
              <input
                className={inputClass}
                placeholder="e.g. https://meet.google.com/xyz-abc"
                value={form.meetUrl}
                onChange={(e) => setForm((f) => ({ ...f, meetUrl: e.target.value }))}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setProjectModalOpen(false)}
              className="rounded-lg px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100"
            >
              Cancel
            </button>
            <PrimaryButton disabled={busy} onClick={onSaveProject}>
              {busy ? "Saving..." : editingProjectId ? "Save Changes" : "Create Project"}
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
