"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Download,
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
  VideoOff,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Avatar, Card, Field, Modal, PrimaryButton, ProgressBar, inputClass } from "@/components/ui";
import { eventTimeLabel, formatDateTime } from "@/lib/format";
import type { CalendarEvent, Project, ProjectTask, PublicUser } from "@/lib/types";

function formatGoogleDate(d: string | Date) {
  const date = new Date(d);
  return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
}

function getGoogleCalendarUrl(event: CalendarEvent) {
  const start = formatGoogleDate(event.start);
  const end = formatGoogleDate(event.end);
  const title = encodeURIComponent(event.title);
  const details = encodeURIComponent(`${event.description}\n\nSession Type: ${event.type.toUpperCase()}\nPlatform: Permanent Skills Nexus`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=Nexus%20Meet`;
}

function downloadIcsFile(event: CalendarEvent) {
  const start = formatGoogleDate(event.start);
  const end = formatGoogleDate(event.end);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Permanent Skills//Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@permanentskills.com`,
    `DTSTAMP:${formatGoogleDate(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, " ")}`,
    `LOCATION:Nexus Meet`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function isMeetingOlder(event?: CalendarEvent | null): boolean {
  if (!event) return false;
  try {
    const now = new Date();
    // Normalize today's start of day in local time
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    
    const eventDate = new Date(event.start || event.end);
    const startOfEventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), 0, 0, 0, 0).getTime();

    // 1. Any date strictly before today is an older ended meeting
    if (startOfEventDay < startOfToday) {
      return true;
    }

    // 2. Future dates are upcoming meetings (not older)
    if (startOfEventDay > startOfToday) {
      return false;
    }

    // 3. Current date meeting (today): older only if its end time has already elapsed
    const eventEnd = new Date(event.end || event.start);
    return eventEnd.getTime() < now.getTime();
  } catch {
    return false;
  }
}

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
  version: "v1.0.0",
  leadId: "",
  leadName: "",
  memberIds: [],
  mentionedUsernames: [],
  progress: 0,
  tasks: [],
  status: "active",
  meetSyncTime: "Sprint Sync: Today, 3:00 PM",
  meetRoom: "Nexus Meet #room-general",
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
    updateProjectStatus,
    updateProjectMeetSync,
    updateProjectProgress,
    toggleProjectTask,
    addProjectTask,
  } = useApp();

  const [cursor, setCursor] = useState(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpEventIds, setRsvpEventIds] = useState<string[]>([]);
  const [calendarFilter, setCalendarFilter] = useState<"all" | "my_schedule">("all");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ps_calendar_rsvps");
      if (saved) {
        setRsvpEventIds(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  function toggleRsvp(eventId: string) {
    setRsvpEventIds((prev) => {
      const exists = prev.includes(eventId);
      const next = exists ? prev.filter((id) => id !== eventId) : [...prev, eventId];
      try {
        localStorage.setItem("ps_calendar_rsvps", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }

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

  const userTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, " ");
    } catch {
      return "Local time";
    }
  }, []);

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
      leadName: user?.name || users[0]?.name || "Admin",
      memberIds: user?.id ? [user.id] : [],
      tasks: [],
      progress: 0,
      status: "active",
    });
    setEditingProjectId(null);
    setErrorMsg("");
    setNewModalTaskTitle("");
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
    const computedProgress = nextTasks.length ? Math.round((completed / nextTasks.length) * 100) : 0;

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
    const computedProgress = nextTasks.length ? Math.round((completed / nextTasks.length) * 100) : 0;

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

  // Project Tabs: 'all' | 'current' | 'previous'
  const [projectTab, setProjectTab] = useState<"all" | "current" | "previous">("current");

  const currentProjects = useMemo(
    () => projects.filter((p) => p.status === "active" || p.status === "paused" || p.progress < 100),
    [projects]
  );
  const previousProjects = useMemo(
    () => projects.filter((p) => p.status === "completed" || p.progress === 100),
    [projects]
  );

  const displayedProjects = useMemo(() => {
    if (projectTab === "current") return currentProjects;
    if (projectTab === "previous") return previousProjects;
    return projects;
  }, [projectTab, currentProjects, previousProjects, projects]);

  return (
    <div className="space-y-6">
      {/* 1. Projects Section: Previous and Current Projects */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <span>Projects & Initiatives</span>
              <span className="h-2.5 w-2.5 rounded-full bg-[#5051F9]" />
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Comprehensive overview of your current initiatives and previous completed projects synced with Meet Calendar
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1">
              <button
                onClick={() => setProjectTab("current")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  projectTab === "current"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Current Projects ({currentProjects.length})
              </button>
              <button
                onClick={() => setProjectTab("previous")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  projectTab === "previous"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Previous Projects ({previousProjects.length})
              </button>
              <button
                onClick={() => setProjectTab("all")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  projectTab === "all"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                All ({projects.length})
              </button>
            </div>

            <button
              onClick={openCreateProject}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#5051F9] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#4041d8] transition"
            >
              <Plus size={14} /> Add Project
            </button>
          </div>
        </div>

        {displayedProjects.length === 0 ? (
          <Card className="p-8 text-center bg-zinc-50/50 border-dashed">
            <Layers size={32} className="mx-auto text-zinc-400 mb-2" />
            <p className="text-sm font-semibold text-zinc-700">
              {projectTab === "previous"
                ? "No previous completed projects yet"
                : projectTab === "current"
                ? "No current active projects"
                : "No projects created yet"}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Click &ldquo;+ Add Project&rdquo; to create a new initiative.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {displayedProjects.map((proj) => {
              const lead = users.find((u) => u.id === proj.leadId);
              const teamMembers = proj.memberIds
                .map((id) => users.find((u) => u.id === id))
                .filter(Boolean) as PublicUser[];

              const currentStatus: "active" | "completed" | "paused" =
                proj.status || (proj.progress === 100 ? "completed" : "active");
              const isCompleted = currentStatus === "completed";
              const isPaused = currentStatus === "paused";

              const otherProjects = projects.filter((p) => p.id !== proj.id);

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
                                isCompleted
                                  ? "bg-emerald-500"
                                  : isPaused
                                  ? "bg-amber-500"
                                  : "bg-[#5051F9]"
                              }`}
                            />
                            <span className="text-[10px] font-bold text-zinc-700 capitalize">
                              {currentStatus}
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
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="text-lg font-bold text-zinc-900">{proj.title}</h3>
                            
                            {/* Interactive Status Selector Dropdown on Card */}
                            <div className="relative inline-flex items-center">
                              <select
                                value={currentStatus}
                                onChange={(e) =>
                                  updateProjectStatus(
                                    proj.id,
                                    e.target.value as "active" | "completed" | "paused"
                                  )
                                }
                                className={`cursor-pointer appearance-none rounded-full px-2.5 py-0.5 pr-5 text-[11px] font-bold capitalize border outline-none transition shadow-2xs ${
                                  isCompleted
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                    : isPaused
                                    ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                    : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                                }`}
                                title="Click to change project status"
                              >
                                <option value="active">● Active</option>
                                <option value="paused">⏸ Paused</option>
                                <option value="completed">✓ Completed</option>
                              </select>
                              <ChevronDown size={11} className="pointer-events-none absolute right-1.5 opacity-60" />
                            </div>
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

                        {/* Metadata row: Avatars, Lead, and Sleek Progress Bar (Matching 3rd Image) */}
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

                          {/* Progress Bar (Matching Reference Image 3: Sleek rounded horizontal track with right percentage) */}
                          <div className="flex items-center gap-2.5 min-w-[170px] max-w-[260px] flex-1">
                            <div
                              className="relative h-2 flex-1 rounded-full bg-zinc-200/80 overflow-hidden cursor-pointer group"
                              title={`Progress: ${proj.progress}% (click anywhere to adjust)`}
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
                                const pct = Math.round((x / rect.width) * 100);
                                updateProjectProgress(proj.id, pct);
                              }}
                            >
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isCompleted ? "bg-emerald-500" : isPaused ? "bg-amber-500" : "bg-[#5051F9]"
                                }`}
                                style={{ width: `${proj.progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-zinc-500 shrink-0 w-8 text-right">
                              {proj.progress}%
                            </span>
                          </div>
                        </div>

                        {/* Expandable Milestones / Deliverables Checklist */}
                        <div className="mt-3 border-t border-zinc-100 pt-3">
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedTasks((prev) => ({
                                  ...prev,
                                  [proj.id]: !prev[proj.id],
                                }))
                              }
                              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-[#5051F9] transition cursor-pointer"
                            >
                              <ListTodo size={14} className="text-primary" />
                              <span>
                                Deliverables & Milestones (
                                {proj.tasks?.filter((t) => t.completed).length || 0}/
                                {proj.tasks?.length || 0})
                              </span>
                              {expandedTasks[proj.id] ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                            </button>

                            <span className="text-[11px] font-medium text-zinc-400">
                              {proj.tasks && proj.tasks.length > 0
                                ? `${Math.round(
                                    ((proj.tasks.filter((t) => t.completed).length) /
                                      proj.tasks.length) *
                                      100
                                  )}% milestones done`
                                : "No milestones added"}
                            </span>
                          </div>

                          {expandedTasks[proj.id] && (
                            <div className="mt-2.5 space-y-2 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3">
                              {proj.tasks && proj.tasks.length > 0 ? (
                                <div className="space-y-1.5">
                                  {proj.tasks.map((task) => (
                                    <label
                                      key={task.id}
                                      className="flex items-center gap-2.5 text-xs text-zinc-700 hover:text-zinc-900 cursor-pointer select-none"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={task.completed}
                                        onChange={() => toggleProjectTask(proj.id, task.id)}
                                        className="h-4 w-4 rounded border-zinc-300 text-[#5051F9] focus:ring-[#5051F9]"
                                      />
                                      <span
                                        className={
                                          task.completed
                                            ? "line-through text-zinc-400 font-normal"
                                            : "font-medium text-zinc-800"
                                        }
                                      >
                                        {task.title}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-zinc-400 italic">
                                  No milestones defined yet.
                                </p>
                              )}

                              {/* Inline Add Task Input */}
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const val = (cardNewTask[proj.id] || "").trim();
                                  if (!val) return;
                                  addProjectTask(proj.id, val);
                                  setCardNewTask((prev) => ({ ...prev, [proj.id]: "" }));
                                }}
                                className="flex items-center gap-2 pt-2 border-t border-zinc-200/60"
                              >
                                <input
                                  value={cardNewTask[proj.id] || ""}
                                  onChange={(e) =>
                                    setCardNewTask((prev) => ({
                                      ...prev,
                                      [proj.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Add new milestone..."
                                  className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#5051F9]"
                                />
                                <button
                                  type="submit"
                                  className="rounded-lg bg-[#5051F9] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4041d8] transition shadow-xs cursor-pointer"
                                >
                                  Add
                                </button>
                              </form>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: MEET SYNC STATUS Box with Dropdown & Fallback Button */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 border-t lg:border-t-0 lg:border-l border-zinc-100 pt-3 lg:pt-0 lg:pl-6 shrink-0">
                      <div className="w-full lg:w-[275px] rounded-xl bg-[#5051F9]/5 border border-[#5051F9]/15 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-[#5051F9]/80 font-mono">
                            MEET SYNC STATUS
                          </span>
                          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                            Live Synced
                          </span>
                        </div>

                        {events.length > 0 || otherProjects.length > 0 ? (
                          <div className="space-y-2">
                            {/* Dropdown showing upcoming meeting or project */}
                            <div className="relative">
                              <select
                                value={proj.meetSyncTime || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const matchedEvent = events.find(
                                    (ev) =>
                                      `${ev.title} (${formatDateTime(ev.start)})` === val ||
                                      ev.id === val ||
                                      ev.title === val
                                  );
                                  const matchedProj = projects.find(
                                    (p) => p.title === val || `Sync with ${p.title}` === val
                                  );

                                  let nextTime = val;
                                  let nextRoom = proj.meetRoom || "Nexus Meet #room-general";
                                  let nextUrl = proj.meetUrl || "https://meet.google.com/new";

                                  if (matchedEvent) {
                                    nextTime = `${matchedEvent.title} (${formatDateTime(matchedEvent.start)})`;
                                    nextRoom = matchedEvent.type === "live" ? "Live Stream Room" : "VIP Mastermind Room";
                                  } else if (matchedProj) {
                                    nextTime = `Sync with ${matchedProj.title}`;
                                    nextRoom = matchedProj.meetRoom || "Nexus Meet #room-sync";
                                  }

                                  updateProjectMeetSync(proj.id, nextTime, nextRoom, nextUrl);
                                }}
                                className="w-full cursor-pointer appearance-none rounded-lg border border-[#5051F9]/20 bg-white px-2.5 py-1.5 pr-7 text-xs font-semibold text-zinc-800 shadow-2xs outline-none hover:border-[#5051F9]/40 focus:border-[#5051F9] transition"
                              >
                                <option value={proj.meetSyncTime || "Sprint Sync: Today, 3:00 PM"}>
                                  {proj.meetSyncTime || "Select meeting or project..."}
                                </option>

                                {events.length > 0 && (
                                  <optgroup label="Upcoming Calendar Meetings">
                                    {events.map((ev) => (
                                      <option key={ev.id} value={`${ev.title} (${formatDateTime(ev.start)})`}>
                                        📅 {ev.title} • {formatDateTime(ev.start)}
                                      </option>
                                    ))}
                                  </optgroup>
                                )}

                                {otherProjects.length > 0 && (
                                  <optgroup label="Other Projects">
                                    {otherProjects.map((p) => (
                                      <option key={p.id} value={`Sync with ${p.title}`}>
                                        🚀 {p.title} ({p.version || "v1.0"})
                                      </option>
                                    ))}
                                  </optgroup>
                                )}

                                <optgroup label="Custom Sprint Syncs">
                                  <option value="Sprint Sync: Today, 3:00 PM">Sprint Sync: Today, 3:00 PM</option>
                                  <option value="Weekly Strategy: Tomorrow, 4:00 PM">Weekly Strategy: Tomorrow, 4:00 PM</option>
                                  <option value="Deliverable Review: Friday, 2:00 PM">Deliverable Review: Friday, 2:00 PM</option>
                                </optgroup>
                              </select>
                              <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400" />
                            </div>

                            <div className="flex items-start gap-2.5 pt-0.5">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#5051F9] text-white shadow-xs">
                                <CalendarIcon size={14} />
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
                        ) : (
                          /* Fallback when NO meeting or project: shows button to Add Project */
                          <div className="space-y-2 text-center py-1">
                            <p className="text-xs text-zinc-500 font-medium">
                              No upcoming meeting or project
                            </p>
                            <button
                              type="button"
                              onClick={openCreateProject}
                              className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-[#5051F9] hover:bg-[#4041d8] text-white text-xs font-bold py-1.5 shadow-xs transition cursor-pointer"
                            >
                              <Plus size={13} /> Add Project
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Project actions (Join Meet, Edit, Delete) */}
                      <div className="flex items-center gap-2 shrink-0">
                        {proj.meetUrl && (() => {
                          const matchedEvent = events.find(
                            (ev) =>
                              `${ev.title} (${formatDateTime(ev.start)})` === proj.meetSyncTime ||
                              ev.title === proj.meetSyncTime ||
                              ev.id === proj.meetSyncTime
                          );
                          const isProjMeetOlder = matchedEvent ? isMeetingOlder(matchedEvent) : false;
                          const targetUrl = isProjMeetOlder && matchedEvent
                            ? `/meeting-ended?title=${encodeURIComponent(matchedEvent.title)}&start=${encodeURIComponent(matchedEvent.start)}&end=${encodeURIComponent(matchedEvent.end)}&type=${matchedEvent.type}&desc=${encodeURIComponent(matchedEvent.description)}`
                            : proj.meetUrl;

                          return (
                            <a
                              href={targetUrl}
                              target={isProjMeetOlder ? "_self" : "_blank"}
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                                isProjMeetOlder
                                  ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                                  : "bg-[#5051F9]/10 hover:bg-[#5051F9]/20 text-primary"
                              }`}
                            >
                              {isProjMeetOlder ? <VideoOff size={13} /> : <Video size={13} />}
                              <span>{isProjMeetOlder ? "Meet Ended" : "Join Meet"}</span>
                            </a>
                          );
                        })()}

                        <button
                          onClick={() => openEditProject(proj)}
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition cursor-pointer"
                          title="Edit Project"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => onDeleteProject(proj.id)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
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

      {/* 2. Calendar Grid Toolbar & Grid */}
      <Card className="p-5">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCursor(new Date())}
              className="rounded-full border border-zinc-200 bg-white px-3.5 py-1 text-sm font-medium hover:bg-zinc-50 shadow-xs cursor-pointer"
            >
              Today
            </button>

            {/* Schedule View Filter */}
            <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50/80 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCalendarFilter("all")}
                className={`rounded-full px-3 py-1 transition cursor-pointer ${
                  calendarFilter === "all"
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                All Sessions
              </button>
              <button
                type="button"
                onClick={() => setCalendarFilter("my_schedule")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition cursor-pointer ${
                  calendarFilter === "my_schedule"
                    ? "bg-[#5051F9] text-white shadow-2xs font-bold"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Check size={12} />
                <span>My Schedule</span>
                {rsvpEventIds.length > 0 && (
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    calendarFilter === "my_schedule" ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"
                  }`}>
                    {rsvpEventIds.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-600 transition cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <h1 className="text-lg font-bold text-zinc-900">
                {cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h1>
              <p className="text-xs text-zinc-500">
                {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} ({userTz})
              </p>
            </div>
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-600 transition cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Right Toolbar Action: + Add Project */}
          <div>
            <PrimaryButton
              onClick={openCreateProject}
              className="inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3.5 shadow-sm cursor-pointer"
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
            let dayEvents = events.filter((e) => new Date(e.start).toDateString() === key);
            
            if (calendarFilter === "my_schedule") {
              dayEvents = dayEvents.filter((e) => rsvpEventIds.includes(e.id));
            }

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
                  {dayEvents.map((e) => {
                    const isRsvped = rsvpEventIds.includes(e.id);
                    const isOlder = isMeetingOlder(e);

                    return (
                      <button
                        key={e.id}
                        onClick={() => {
                          setSelectedEvent(e);
                          setRsvpSuccess(false);
                        }}
                        className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium transition cursor-pointer ${
                          isRsvped
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                            : isOlder
                              ? "bg-zinc-100 text-zinc-600 border border-zinc-200/80 hover:bg-zinc-200/60"
                              : e.type === "premium"
                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        }`}
                        title={`${e.title} (${formatDateTime(e.start)})${isRsvped ? " • In My Schedule" : ""}${isOlder ? " • Meeting Ended" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-1 truncate">
                          <span className="flex items-center gap-1 truncate min-w-0 flex-1">
                            {isRsvped && <span className="text-emerald-600 font-bold shrink-0">✓</span>}
                            <span className={`truncate ${isOlder ? "line-through text-zinc-400 font-normal" : ""}`}>
                              {eventTimeLabel(e.start)} - {e.title}
                            </span>
                          </span>
                          {isOlder && (
                            <span className="shrink-0 rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-800">
                              Ended
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 3. Event Detail Modal */}
      <Modal
        open={!!selectedEvent}
        onClose={() => {
          setSelectedEvent(null);
          setRsvpSuccess(false);
        }}
        title={selectedEvent?.title || "Meet Session"}
      >
        {selectedEvent && (() => {
          const isEventOver = isMeetingOlder(selectedEvent);
          const isRsvped = rsvpEventIds.includes(selectedEvent.id);
          const endedUrl = `/meeting-ended?title=${encodeURIComponent(selectedEvent.title)}&start=${encodeURIComponent(selectedEvent.start)}&end=${encodeURIComponent(selectedEvent.end)}&type=${selectedEvent.type}&desc=${encodeURIComponent(selectedEvent.description)}`;

          const now = new Date();
          const eventDate = new Date(selectedEvent.start || selectedEvent.end);
          const isToday = eventDate.toDateString() === now.toDateString();

          return (
            <div className="space-y-4">
              {/* Meeting date and status banner */}
              <div className="flex items-center justify-between gap-2 text-sm text-zinc-600 bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={16} className="text-primary shrink-0" />
                  <span>{formatDateTime(selectedEvent.start)} - {eventTimeLabel(selectedEvent.end)}</span>
                </div>
                {isEventOver ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200 shrink-0">
                    <VideoOff size={12} /> Meeting Ended
                  </span>
                ) : isToday ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" /> Live Today
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200 shrink-0">
                    <CalendarIcon size={12} /> Upcoming Session
                  </span>
                )}
              </div>

              <p className="text-sm text-zinc-700 leading-relaxed">{selectedEvent.description}</p>
              
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className={`rounded px-2.5 py-1 uppercase tracking-wider ${
                  selectedEvent.type === "premium"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}>
                  {selectedEvent.type} session
                </span>
                <span className="text-zinc-500 font-medium">{userTz}</span>
              </div>

              <div className="pt-2 space-y-2.5">
                {/* Join Video Room Button (directs to /meeting-ended for older meetings) */}
                {isEventOver ? (
                  <div className="space-y-2">
                    <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3 text-left">
                      <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <VideoOff size={14} className="text-amber-600" />
                        This Meeting Has Concluded
                      </p>
                      <p className="text-[11px] text-amber-700 mt-0.5 leading-normal">
                        This session took place before today. Click below to view the post-meeting interface, recap, notes, and recording details.
                      </p>
                    </div>

                    <a
                      href={endedUrl}
                      onClick={() => setSelectedEvent(null)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 px-4 py-2.5 font-bold text-white shadow-md transition text-sm cursor-pointer"
                    >
                      <VideoOff size={16} className="text-amber-400" />
                      <span>Meeting Ended — View Session Recap</span>
                    </a>
                  </div>
                ) : (
                  <a
                    href="https://meet.google.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5051F9] hover:bg-[#4041d8] px-4 py-2.5 font-bold text-white shadow-md transition text-sm cursor-pointer"
                  >
                    <Video size={16} />
                    <span>Join Video Room</span>
                  </a>
                )}

                {/* Add to my schedule / RSVP with sync options */}
                <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        toggleRsvp(selectedEvent.id);
                        setRsvpSuccess(true);
                      }}
                      className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                        isRsvped
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                          : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      {isRsvped ? (
                        <>
                          <CheckCircle2 size={15} className="text-emerald-600" />
                          <span>Added to My Schedule (Click to remove)</span>
                        </>
                      ) : (
                        <>
                          <CalendarIcon size={15} />
                          <span>Add to my schedule / RSVP</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* External Calendar Sync Options */}
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={getGoogleCalendarUrl(selectedEvent)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700 shadow-2xs transition cursor-pointer"
                    >
                      <ExternalLink size={12} className="text-blue-500" /> Google Calendar
                    </a>
                    <button
                      type="button"
                      onClick={() => downloadIcsFile(selectedEvent)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700 shadow-2xs transition cursor-pointer"
                    >
                      <Download size={12} className="text-purple-500" /> Apple / Outlook (.ics)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
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
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </Field>

            <div className="sm:col-span-2">
              <Field label="Meet Sync Status (Linked Meeting or Project)">
                {events.length > 0 || projects.length > 0 ? (
                  <select
                    className={inputClass}
                    value={form.meetSyncTime}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matchedEvent = events.find(
                        (ev) =>
                          `${ev.title} (${formatDateTime(ev.start)})` === val ||
                          ev.id === val ||
                          ev.title === val
                      );
                      let nextRoom = form.meetRoom || "Nexus Meet #room-general";
                      let nextUrl = form.meetUrl || "https://meet.google.com/new";
                      if (matchedEvent) {
                        nextRoom = matchedEvent.type === "live" ? "Live Stream Room" : "VIP Mastermind Room";
                      }
                      setForm((f) => ({
                        ...f,
                        meetSyncTime: val,
                        meetRoom: nextRoom,
                        meetUrl: nextUrl,
                      }));
                    }}
                  >
                    <option value={form.meetSyncTime || "Sprint Sync: Today, 3:00 PM"}>
                      {form.meetSyncTime || "Select upcoming meeting or project..."}
                    </option>

                    {events.length > 0 && (
                      <optgroup label="Upcoming Calendar Meetings">
                        {events.map((ev) => (
                          <option key={ev.id} value={`${ev.title} (${formatDateTime(ev.start)})`}>
                            📅 {ev.title} • {formatDateTime(ev.start)}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {projects.length > 0 && (
                      <optgroup label="Projects">
                        {projects.map((p) => (
                          <option key={p.id} value={`Sync with ${p.title}`}>
                            🚀 {p.title} ({p.version || "v1.0"})
                          </option>
                        ))}
                      </optgroup>
                    )}

                    <optgroup label="Custom Sprint Syncs">
                      <option value="Sprint Sync: Today, 3:00 PM">Sprint Sync: Today, 3:00 PM</option>
                      <option value="Weekly Strategy: Tomorrow, 4:00 PM">Weekly Strategy: Tomorrow, 4:00 PM</option>
                      <option value="Deliverable Review: Friday, 2:00 PM">Deliverable Review: Friday, 2:00 PM</option>
                    </optgroup>
                  </select>
                ) : (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                    <span className="text-xs text-zinc-500">No upcoming meetings or projects</span>
                    <button
                      type="button"
                      onClick={() => {
                        setProjectModalOpen(false);
                        openCreateProject();
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      <Plus size={12} /> Add Project
                    </button>
                  </div>
                )}
              </Field>
            </div>
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
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-indigo-50/70 transition cursor-pointer"
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

          {/* Milestones / Deliverables Builder in Modal */}
          {(() => {
            const modalDoneCount = form.tasks.filter((t) => t.completed).length;
            const modalTotalCount = form.tasks.length;
            const modalProgressPct = modalTotalCount > 0 ? Math.round((modalDoneCount / modalTotalCount) * 100) : 0;

            return (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Project Deliverables & Milestones ({modalDoneCount}/{modalTotalCount})
                  </label>
                  <span className="text-[11px] font-bold text-primary">
                    {modalProgressPct}% progress
                  </span>
                </div>

                <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
                  {form.tasks.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic py-2 text-center">
                      No milestones added yet. Add a deliverable below to track project progress.
                    </p>
                  ) : (
                    form.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-zinc-200 shadow-2xs">
                        <label className="flex items-center gap-2.5 text-xs flex-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleModalTask(task.id)}
                            className="rounded border-zinc-300 text-primary focus:ring-primary h-4 w-4"
                          />
                          <span className={task.completed ? "line-through text-zinc-400" : "font-medium text-zinc-800"}>
                            {task.title}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeModalTask(task.id)}
                          className="text-zinc-400 hover:text-red-500 transition p-1 cursor-pointer"
                          title="Remove milestone"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  value={newModalTaskTitle}
                  onChange={(e) => setNewModalTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddModalTask();
                    }
                  }}
                  placeholder="e.g. Complete responsive Figma token review"
                  className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleAddModalTask}
                  className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 hover:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition shadow-xs cursor-pointer"
                >
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
                      className="text-zinc-400 hover:text-red-500 cursor-pointer"
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
              className="rounded-lg px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100 cursor-pointer"
            >
              Cancel
            </button>
            <PrimaryButton disabled={busy} onClick={onSaveProject} className="cursor-pointer">
              {busy ? "Saving..." : editingProjectId ? "Save Changes" : "Create Project"}
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
