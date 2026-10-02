"use client";

import { useMemo, useRef, useState } from "react";
import {
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  Layers,
  ListTodo,
  Minus,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Avatar, Card, Field, Modal, PrimaryButton, ProgressBar, inputClass } from "@/components/ui";
import { eventTimeLabel, formatDateTime } from "@/lib/format";
import type { CalendarEvent, Project, ProjectTask, PublicUser } from "@/lib/types";

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
  tasks: ProjectTask[];
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
  tasks: [
    { id: "t-1", title: "Consolidate token architecture & variables", completed: true },
    { id: "t-2", title: "Accessible Figma token sync pipeline", completed: true },
    { id: "t-3", title: "Cross-team design documentation review", completed: false },
  ],
  status: "active",
  meetSyncTime: "Sprint Sync: Today, 3:00 PM",
  meetRoom: "Nexus Meet #room-design",
  meetUrl: "https://meet.google.com/new",
};

export default function MeetPage() {
  const {
    events,
    projects,
    users,
    user,
    saveProject,
    deleteProject,
    updateProjectProgress,
    toggleProjectTask,
    addProjectTask,
  } = useApp();

  const [cursor, setCursor] = useState(new Date(2026, 8, 1));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Project Modal State
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectForm>(emptyProjectForm);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // New task input state inside modal
  const [newModalTaskTitle, setNewModalTaskTitle] = useState("");

  // Expandable tasks toggle for active project cards
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({
    "proj-nexus": true,
  });
  const [cardNewTask, setCardNewTask] = useState<Record<string, string>>({});

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
      tasks: [
        { id: "t-1", title: "Project kickoff & goal alignment", completed: true },
        { id: "t-2", title: "Core deliverables & milestone sync", completed: false },
      ],
      progress: 50,
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
      tasks: proj.tasks || [],
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

    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf("@");

    if (lastAtPos !== -1 && lastAtPos < cursorPos) {
      const queryPart = textBeforeCursor.slice(lastAtPos + 1);
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

  // Add / toggle tasks in modal
  function handleAddModalTask() {
    if (!newModalTaskTitle.trim()) return;
    const newTask: ProjectTask = {
      id: `t-${Date.now()}`,
      title: newModalTaskTitle.trim(),
      completed: false,
    };
    const nextTasks = [...form.tasks, newTask];
    const completed = nextTasks.filter((t) => t.completed).length;
    const computedProgress = Math.round((completed / nextTasks.length) * 100);

    setForm((f) => ({
      ...f,
      tasks: nextTasks,
      progress: computedProgress,
    }));
    setNewModalTaskTitle("");
  }

  function toggleModalTask(taskId: string) {
    const nextTasks = form.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    const completed = nextTasks.filter((t) => t.completed).length;
    const computedProgress = nextTasks.length ? Math.round((completed / nextTasks.length) * 100) : form.progress;

    setForm((f) => ({
      ...f,
      tasks: nextTasks,
      progress: computedProgress,
      status: computedProgress === 100 ? "completed" : f.status,
    }));
  }

  function removeModalTask(taskId: string) {
    const nextTasks = form.tasks.filter((t) => t.id !== taskId);
    const completed = nextTasks.filter((t) => t.completed).length;
    const computedProgress = nextTasks.length ? Math.round((completed / nextTasks.length) * 100) : form.progress;

    setForm((f) => ({
      ...f,
      tasks: nextTasks,
      progress: computedProgress,
    }));
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

  // Quick progress increment / decrement on card
  async function stepProgress(projectId: string, currentPct: number, delta: number) {
    const next = Math.max(0, Math.min(100, currentPct + delta));
    await updateProjectProgress(projectId, next);
  }

  async function handleAddCardTask(projectId: string) {
    const title = cardNewTask[projectId]?.trim();
    if (!title) return;
    await addProjectTask(projectId, title);
    setCardNewTask((s) => ({ ...s, [projectId]: "" }));
  }

  return (
    <div className="space-y-6">
      {/* 1. Active Projects Section (Matching Reference Image 1 with Fully Functional Progress Bar & Tasks) */}
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

              const isCompleted = proj.progress === 100 || proj.status === "completed";
              const tasksOpen = !!expandedTasks[proj.id];
              const projectTasks = proj.tasks || [];
              const completedTasksCount = projectTasks.filter((t) => t.completed).length;

              return (
                <Card
                  key={proj.id}
                  className="overflow-hidden border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: UI Mockup / Thumbnail Box */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 flex-1 min-w-0">
                      <div className="relative h-32 w-full sm:w-56 shrink-0 overflow-hidden rounded-xl border border-zinc-200/80 bg-gradient-to-br from-zinc-50 via-zinc-100 to-indigo-50/40 p-3 shadow-inner">
                        <div className="flex items-center justify-between border-b border-zinc-200/60 pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                isCompleted ? "bg-emerald-500" : "bg-[#5051F9]"
                              }`}
                            />
                            <span className="text-[10px] font-bold text-zinc-700">
                              {isCompleted ? "Completed" : "Active"}
                            </span>
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
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize border ${
                                isCompleted
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-indigo-50 text-indigo-700 border-indigo-200"
                              }`}
                            >
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

                        {/* Metadata row: Avatars, Lead, Interactive Progress Bar & Steppers */}
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

                          {/* Fully Functional Interactive Progress Bar */}
                          <div className="flex items-center gap-2 min-w-[200px] max-w-[260px] flex-1 bg-zinc-50/80 px-2.5 py-1 rounded-lg border border-zinc-200/60">
                            <button
                              onClick={() => stepProgress(proj.id, proj.progress, -10)}
                              className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded"
                              title="Decrease 10%"
                            >
                              <Minus size={11} />
                            </button>

                            <div className="flex-1">
                              <ProgressBar
                                value={proj.progress}
                                interactive
                                onChange={(newVal) => updateProjectProgress(proj.id, newVal)}
                              />
                            </div>

                            <button
                              onClick={() => stepProgress(proj.id, proj.progress, 10)}
                              className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded"
                              title="Increase 10%"
                            >
                              <Plus size={11} />
                            </button>

                            <span className="text-xs font-bold text-zinc-800 w-9 text-right">
                              {proj.progress}%
                            </span>
                          </div>

                          {/* Quick Toggle Milestones / Checklist */}
                          <button
                            onClick={() =>
                              setExpandedTasks((s) => ({ ...s, [proj.id]: !s[proj.id] }))
                            }
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            <ListTodo size={13} />
                            <span>
                              {projectTasks.length > 0
                                ? `${completedTasksCount}/${projectTasks.length} Milestones`
                                : "Add Milestones"}
                            </span>
                            {tasksOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
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
                        {isCompleted ? (
                          <button
                            onClick={() => updateProjectProgress(proj.id, 90)}
                            className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition"
                            title="Reopen initiative"
                          >
                            <RotateCcw size={12} /> Reopen
                          </button>
                        ) : (
                          <button
                            onClick={() => updateProjectProgress(proj.id, 100)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition"
                            title="Mark 100% Complete"
                          >
                            <CheckCircle2 size={12} /> Mark 100%
                          </button>
                        )}

                        {proj.meetUrl && (
                          <a
                            href={proj.meetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-[#5051F9]/10 hover:bg-[#5051F9]/20 px-2.5 py-1.5 text-xs font-semibold text-primary transition"
                          >
                            <Video size={13} /> Join Meet
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

                  {/* Expandable Milestones & Checklist Drawer */}
                  {tasksOpen && (
                    <div className="mt-4 pt-4 border-t border-zinc-100 space-y-3 bg-zinc-50/60 rounded-xl p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                          <ListTodo size={14} className="text-primary" />
                          <span>Project Milestones & Key Tasks</span>
                        </span>
                        <span className="text-xs font-medium text-zinc-500">
                          {completedTasksCount} of {projectTasks.length} tasks completed ({proj.progress}%)
                        </span>
                      </div>

                      {projectTasks.length === 0 ? (
                        <p className="text-xs text-zinc-500 py-1">No milestones added yet. Add tasks below to track initiative progress.</p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {projectTasks.map((t) => (
                            <label
                              key={t.id}
                              className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs transition cursor-pointer ${
                                t.completed
                                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-900 line-through"
                                  : "bg-white border-zinc-200/80 text-zinc-800 hover:border-primary/40 shadow-xs"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={t.completed}
                                onChange={() => toggleProjectTask(proj.id, t.id)}
                                className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"
                              />
                              <span className="flex-1 select-none font-medium leading-relaxed">{t.title}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Add new milestone inline */}
                      <div className="flex gap-2 pt-1">
                        <input
                          value={cardNewTask[proj.id] || ""}
                          onChange={(e) =>
                            setCardNewTask((s) => ({ ...s, [proj.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCardTask(proj.id);
                            }
                          }}
                          placeholder="Add milestone / deliverable (press Enter)..."
                          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                        <PrimaryButton
                          onClick={() => handleAddCardTask(proj.id)}
                          className="text-xs py-1.5 px-3"
                        >
                          <Plus size={13} /> Add
                        </PrimaryButton>
                      </div>
                    </div>
                  )}
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

      {/* 4. Add / Edit Project Modal with Tasks Builder & @ Mentions Autocomplete */}
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
                className="min-h-[85px] w-full rounded-lg border border-zinc-200 p-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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
