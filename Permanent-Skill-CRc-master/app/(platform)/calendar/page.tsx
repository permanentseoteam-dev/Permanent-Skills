"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
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

  const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

  const [cursor, setCursor] = useState(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpEventIds, setRsvpEventIds] = useState<string[]>([]);

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
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

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

  const activeProject = useMemo(() => {
    if (selectedProjectId) {
      const found = projects.find((p) => p.id === selectedProjectId);
      if (found) return found;
    }
    return currentProjects[0] || projects[0] || null;
  }, [selectedProjectId, projects, currentProjects]);

  return (
    <div className="space-y-6">
      {/* 1. Projects Section: Single Selected Project Card */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <span>Projects & Initiatives</span>
              <span className="h-2.5 w-2.5 rounded-full bg-[#5051F9]" />
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Comprehensive overview of your initiatives synced with Meet Calendar
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isAdminOrManager && (
              <button
                onClick={openCreateProject}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#5051F9] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#4041d8] transition cursor-pointer"
              >
                <Plus size={14} /> Add Project
              </button>
            )}
          </div>
        </div>

        {!activeProject ? (
          <Card className="p-8 text-center bg-zinc-50/50 border-dashed">
            <Layers size={32} className="mx-auto text-zinc-400 mb-2" />
            <p className="text-sm font-semibold text-zinc-700">
              No projects created yet
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Click &ldquo;+ Add Project&rdquo; to create a new initiative.
            </p>
          </Card>
        ) : (() => {
          const lead = users.find((u) => u.id === activeProject.leadId);
          const teamMembers = (activeProject.memberIds || [])
            .map((id) => users.find((u) => u.id === id))
            .filter(Boolean) as PublicUser[];

          return (
            <Card
              key={activeProject.id}
              className="overflow-hidden border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              {isAdminOrManager ? (
                /* Admin & Manager View */
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: UI Mockup / Thumbnail Box */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 flex-1 min-w-0">
                    <div className="relative h-28 w-full sm:w-48 shrink-0 overflow-hidden rounded-xl border border-zinc-200/80 bg-gradient-to-br from-zinc-50 via-zinc-100 to-indigo-50/40 p-3 shadow-inner">
                      <div className="flex items-center justify-between border-b border-zinc-200/60 pb-1.5">
                        <span className="text-[10px] font-bold text-zinc-700 truncate max-w-[110px]">
                          {activeProject.title}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400">#meet-sync</span>
                      </div>
                      <div className="mt-2 space-y-1.5">
                        <div className="h-2 w-3/4 rounded bg-indigo-200/70" />
                        <div className="h-2 w-1/2 rounded bg-zinc-200" />
                        <div className="grid grid-cols-3 gap-1 pt-1">
                          <div className="h-5 rounded bg-white shadow-xs border border-zinc-100" />
                          <div className="h-5 rounded bg-indigo-500/10 border border-indigo-100" />
                          <div className="h-5 rounded bg-white shadow-xs border border-zinc-100" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 rounded bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-bold font-mono text-white backdrop-blur-xs">
                        {activeProject.version || "v1.0.0"}
                      </span>
                    </div>

                    {/* Middle: Details, Host, Team & Time of Meeting in Square Box */}
                    <div className="min-w-0 flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900">{activeProject.title}</h3>
                        <p className="mt-1 text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                          {activeProject.description.split(" ").map((word, i) => {
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

                      {/* Metadata row: Avatars, Host, and Time of Meeting in Square Box */}
                      <div className="flex items-center gap-3.5 flex-wrap pt-0.5">
                        {/* Member Avatars */}
                        <div className="flex items-center -space-x-2">
                          {teamMembers.slice(0, 4).map((m) => (
                            <Avatar
                              key={m.id}
                              user={m}
                              size={28}
                              className="ring-2 ring-white shadow-2xs"
                            />
                          ))}
                          {teamMembers.length > 4 && (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700 ring-2 ring-white">
                              +{teamMembers.length - 4}
                            </span>
                          )}
                        </div>

                        {/* Host Badge */}
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100/90 border border-zinc-200/60 px-2.5 py-1.5 text-xs font-medium text-zinc-800 shadow-2xs">
                          <Users size={13} className="text-[#5051F9]" />
                          <span>Host: <strong className="font-semibold text-zinc-900">{activeProject.leadName || lead?.name || "Permanent Skills Admin"}</strong></span>
                        </div>

                        {/* Time of Meeting in Square Box */}
                        <div className="inline-flex items-center gap-2.5 rounded-xl border border-red-200/80 bg-red-50/70 px-3.5 py-1.5 text-zinc-900 shadow-2xs">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-100 text-red-600 shrink-0">
                            <Clock size={14} />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-red-600 font-mono leading-none mb-0.5">
                              Time of Meeting
                            </span>
                            <span className="text-sm font-bold text-zinc-900 truncate block leading-tight">
                              {activeProject.meetSyncTime || "Sprint Sync: Today, 3:00 PM"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Join now Box with Single Project Selector Dropdown & Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 border-t lg:border-t-0 lg:border-l border-zinc-100 pt-3 lg:pt-0 lg:pl-6 shrink-0">
                    <div className="w-full lg:w-[280px] rounded-xl bg-[#5051F9]/5 border border-[#5051F9]/15 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-[#5051F9]/80 font-mono">
                          Join now
                        </span>
                      </div>

                      {/* Single Dropdown showing current projects */}
                      <div className="relative">
                        <select
                          value={activeProject.id}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "__CREATE_NEW_PROJECT__") {
                              openCreateProject();
                              return;
                            }
                            setSelectedProjectId(val);
                          }}
                          className="w-full cursor-pointer appearance-none rounded-lg border border-[#5051F9]/20 bg-white px-2.5 py-1.5 pr-7 text-xs font-semibold text-zinc-800 shadow-2xs outline-none hover:border-[#5051F9]/40 focus:border-[#5051F9] transition"
                        >
                          {currentProjects.length > 0 ? (
                            currentProjects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title}
                              </option>
                            ))
                          ) : (
                            projects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title}
                              </option>
                            ))
                          )}
                          <option value="__CREATE_NEW_PROJECT__">+ Create New Project...</option>
                        </select>
                        <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400" />
                      </div>

                      {/* Fallback button if no projects exist */}
                      {projects.length === 0 && (
                        <button
                          type="button"
                          onClick={openCreateProject}
                          className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-[#5051F9] hover:bg-[#4041d8] text-white text-xs font-bold py-1.5 shadow-xs transition cursor-pointer"
                        >
                          <Plus size={13} /> Create Project
                        </button>
                      )}
                    </div>

                    {/* Project actions (Join Meet, Edit, Delete) */}
                    <div className="flex items-center gap-2 shrink-0">
                      {activeProject.meetUrl && (() => {
                        const matchedEvent = events.find(
                          (ev) =>
                            `${ev.title} (${formatDateTime(ev.start)})` === activeProject.meetSyncTime ||
                            ev.title === activeProject.meetSyncTime ||
                            ev.id === activeProject.meetSyncTime
                        );
                        const isProjMeetOlder = matchedEvent ? isMeetingOlder(matchedEvent) : false;
                        const targetUrl = isProjMeetOlder && matchedEvent
                          ? `/meeting-ended?title=${encodeURIComponent(matchedEvent.title)}&start=${encodeURIComponent(matchedEvent.start)}&end=${encodeURIComponent(matchedEvent.end)}&type=${matchedEvent.type}&desc=${encodeURIComponent(matchedEvent.description)}`
                          : activeProject.meetUrl;

                        return (
                          <a
                            href={targetUrl}
                            target={isProjMeetOlder ? "_self" : "_blank"}
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-xs transition cursor-pointer ${
                              isProjMeetOlder
                                ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                                : "bg-[#5051F9] hover:bg-[#4041d8] text-white"
                            }`}
                          >
                            {isProjMeetOlder ? <VideoOff size={13} /> : <Video size={13} />}
                            <span>{isProjMeetOlder ? "Meet Ended" : "Join Meet"}</span>
                          </a>
                        );
                      })()}

                      <button
                        onClick={() => openEditProject(activeProject)}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition cursor-pointer"
                        title="Edit Project"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => onDeleteProject(activeProject.id)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Regular User View: Only title, profile icons, host along name, dropdown block with Join now button and time in red below it */
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  {/* Left: Title, Profile Icons, Host Name */}
                  <div className="min-w-0 flex-1 space-y-3">
                    <h3 className="text-lg font-bold text-zinc-900">{activeProject.title}</h3>

                    <div className="flex items-center gap-3.5 flex-wrap">
                      {/* Profile Icons */}
                      <div className="flex items-center -space-x-2">
                        {teamMembers.slice(0, 4).map((m) => (
                          <Avatar
                            key={m.id}
                            user={m}
                            size={28}
                            className="ring-2 ring-white shadow-2xs"
                          />
                        ))}
                        {teamMembers.length > 4 && (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700 ring-2 ring-white">
                            +{teamMembers.length - 4}
                          </span>
                        )}
                      </div>

                      {/* Host Name Badge */}
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100/90 border border-zinc-200/60 px-2.5 py-1.5 text-xs font-medium text-zinc-800 shadow-2xs">
                        <Users size={13} className="text-[#5051F9]" />
                        <span>Host: <strong className="font-semibold text-zinc-900">{activeProject.leadName || lead?.name || "Permanent Skills Admin"}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Dropdown block with Join now button and time of meeting in red below it */}
                  <div className="flex flex-col items-start sm:items-end gap-2.5 border-t sm:border-t-0 sm:border-l border-zinc-100 pt-3 sm:pt-0 sm:pl-6 shrink-0 w-full sm:w-auto">
                    <div className="w-full sm:w-[280px] rounded-xl bg-[#5051F9]/5 border border-[#5051F9]/15 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-[#5051F9]/80 font-mono">
                          Join now
                        </span>
                      </div>

                      {/* Dropdown showing current projects */}
                      <div className="relative">
                        <select
                          value={activeProject.id}
                          onChange={(e) => setSelectedProjectId(e.target.value)}
                          className="w-full cursor-pointer appearance-none rounded-lg border border-[#5051F9]/20 bg-white px-2.5 py-1.5 pr-7 text-xs font-semibold text-zinc-800 shadow-2xs outline-none hover:border-[#5051F9]/40 focus:border-[#5051F9] transition"
                        >
                          {currentProjects.length > 0 ? (
                            currentProjects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title}
                              </option>
                            ))
                          ) : (
                            projects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title}
                              </option>
                            ))
                          )}
                        </select>
                        <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400" />
                      </div>
                    </div>

                    {/* Only Join now button and below it Time of Meeting in red */}
                    <div className="flex flex-col items-start sm:items-end gap-1.5 w-full sm:w-auto">
                      {activeProject.meetUrl && (() => {
                        const matchedEvent = events.find(
                          (ev) =>
                            `${ev.title} (${formatDateTime(ev.start)})` === activeProject.meetSyncTime ||
                            ev.title === activeProject.meetSyncTime ||
                            ev.id === activeProject.meetSyncTime
                        );
                        const isProjMeetOlder = matchedEvent ? isMeetingOlder(matchedEvent) : false;
                        const targetUrl = isProjMeetOlder && matchedEvent
                          ? `/meeting-ended?title=${encodeURIComponent(matchedEvent.title)}&start=${encodeURIComponent(matchedEvent.start)}&end=${encodeURIComponent(matchedEvent.end)}&type=${matchedEvent.type}&desc=${encodeURIComponent(matchedEvent.description)}`
                          : activeProject.meetUrl;

                        return (
                          <a
                            href={targetUrl}
                            target={isProjMeetOlder ? "_self" : "_blank"}
                            rel="noopener noreferrer"
                            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold shadow-xs transition cursor-pointer w-full sm:w-auto ${
                              isProjMeetOlder
                                ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                                : "bg-[#5051F9] hover:bg-[#4041d8] text-white"
                            }`}
                          >
                            {isProjMeetOlder ? <VideoOff size={13} /> : <Video size={13} />}
                            <span>{isProjMeetOlder ? "Meet Ended" : "Join Meet"}</span>
                          </a>
                        );
                      })()}

                      {/* Time of the meeting in red colored below the button */}
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                        <Clock size={13} className="text-red-500 shrink-0" />
                        <span>{activeProject.meetSyncTime || "Sprint Sync: Today, 3:00 PM"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })()}
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
          {isAdminOrManager && (
            <div>
              <PrimaryButton
                onClick={openCreateProject}
                className="inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3.5 shadow-sm cursor-pointer"
              >
                <Plus size={15} /> Add Project
              </PrimaryButton>
            </div>
          )}
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
          const endedUrl = `/meeting-ended?title=${encodeURIComponent(selectedEvent.title)}&start=${encodeURIComponent(selectedEvent.start)}&end=${encodeURIComponent(selectedEvent.end)}&type=${selectedEvent.type}&desc=${encodeURIComponent(selectedEvent.description)}`;

          return (
            <div className="pt-2">
              {isEventOver ? (
                <a
                  href={endedUrl}
                  onClick={() => setSelectedEvent(null)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 px-4 py-3 font-bold text-white shadow-md transition text-sm cursor-pointer"
                >
                  <VideoOff size={16} className="text-amber-400" />
                  <span>Meeting Ended — View Session Recap</span>
                </a>
              ) : (
                <a
                  href="https://meet.google.com/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5051F9] hover:bg-[#4041d8] px-4 py-3 font-bold text-white shadow-md transition text-sm cursor-pointer"
                >
                  <Video size={16} />
                  <span>Join Video Room</span>
                </a>
              )}
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
