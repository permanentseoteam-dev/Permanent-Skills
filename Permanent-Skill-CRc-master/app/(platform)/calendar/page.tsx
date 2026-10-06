"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Layers,
  Link2,
  ListTodo,
  Lock,
  Minus,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Avatar, Card, Field, Modal, PrimaryButton, ProgressBar, inputClass } from "@/components/ui";
import { eventTimeLabel, formatDateTime } from "@/lib/format";
import {
  checkMeetingStatus,
  createGoogleCalendarUrl,
  downloadIcsCalendarFile,
  parseMeetingStartTime,
} from "@/lib/calendar-utils";
import type { CalendarEvent, EventType, Project, ProjectTask, PublicUser } from "@/lib/types";

function toLocalDatetimeInputString(dateStrOrDate?: string | Date): string {
  if (!dateStrOrDate) return "";
  let d = new Date(dateStrOrDate);
  if (isNaN(d.getTime())) {
    if (typeof dateStrOrDate === "string") {
      d = parseMeetingStartTime(undefined, dateStrOrDate);
    }
  }
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
}

function formatSkoolMeetingTime(startStr: string, endStr?: string) {
  try {
    const startDate = new Date(startStr);
    if (isNaN(startDate.getTime())) return startStr;
    const endDate = endStr ? new Date(endStr) : null;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfTomorrow = startOfToday + 24 * 60 * 60 * 1000;
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

    const eventDayStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();

    let dayPrefix = "";
    if (eventDayStart === startOfToday) {
      dayPrefix = "Today";
    } else if (eventDayStart === startOfTomorrow) {
      dayPrefix = "Tomorrow";
    } else if (eventDayStart === startOfYesterday) {
      dayPrefix = "Yesterday";
    } else {
      const weekday = startDate.toLocaleDateString("en-US", { weekday: "short" });
      const month = startDate.toLocaleDateString("en-US", { month: "short" });
      const day = startDate.getDate();
      dayPrefix = `${weekday}, ${month} ${day}`;
    }

    const formatTime = (d: Date) => {
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? "pm" : "am";
      const h12 = hours % 12 || 12;
      return minutes === 0 ? `${h12}${ampm}` : `${h12}:${String(minutes).padStart(2, "0")}${ampm}`;
    };

    const startTime = formatTime(startDate);
    const endTime = endDate && !isNaN(endDate.getTime()) ? ` - ${formatTime(endDate)}` : "";

    return `${dayPrefix} @ ${startTime}${endTime}`;
  } catch {
    return startStr;
  }
}

function getTimezoneCityName(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return "Local time";
    const parts = tz.split("/");
    const city = parts[parts.length - 1].replace(/_/g, " ");
    return `${city} time`;
  } catch {
    return "Local time";
  }
}

function SkoolMeetingWaveBanner({
  bannerText = "Q & A",
  bannerSubtitle = "AI Automation Society Plus",
  bannerImage,
}: {
  bannerText?: string;
  bannerSubtitle?: string;
  bannerImage?: string;
}) {
  if (bannerImage) {
    return (
      <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-zinc-950">
        <img src={bannerImage} alt={bannerText} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-black italic tracking-wider text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.9)]">
            {bannerText || "Q & A"}
          </h2>
          {bannerSubtitle && (
            <div className="mt-2.5 inline-flex items-center rounded-full bg-white/95 px-4 py-1 text-[11px] sm:text-xs font-black tracking-tight text-zinc-900 shadow-lg backdrop-blur-xs">
              {bannerSubtitle}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-[#06080E] select-none">
      {/* Background radial luminous aura */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-40 w-80 rounded-full bg-sky-500/25 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 left-1/4 h-28 w-44 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 right-1/4 h-28 w-44 rounded-full bg-blue-500/25 blur-2xl pointer-events-none" />

      {/* High-res Wave Contour Lines SVG */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none"
        viewBox="0 0 500 240"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id="skoolCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#60a5fa" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="skoolBlueGrad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {/* Left flowing contour waves */}
        <path d="M-40,10 C40,40 80,120 40,240" stroke="url(#skoolCyanGrad)" strokeWidth="1.2" opacity="0.65" />
        <path d="M-30,0 C60,30 110,110 70,240" stroke="url(#skoolCyanGrad)" strokeWidth="1.2" opacity="0.7" />
        <path d="M-20,-10 C80,20 140,100 100,240" stroke="url(#skoolCyanGrad)" strokeWidth="1.2" opacity="0.75" />
        <path d="M-10,-20 C100,10 170,90 130,240" stroke="url(#skoolCyanGrad)" strokeWidth="1.2" opacity="0.8" />
        <path d="M0,-30 C120,0 200,80 160,240" stroke="url(#skoolCyanGrad)" strokeWidth="1.2" opacity="0.7" />
        <path d="M10,-40 C140,-10 230,70 190,240" stroke="url(#skoolCyanGrad)" strokeWidth="1.2" opacity="0.6" />

        {/* Right flowing contour waves */}
        <path d="M540,20 C460,50 420,130 460,240" stroke="url(#skoolBlueGrad)" strokeWidth="1.2" opacity="0.65" />
        <path d="M530,10 C440,40 390,120 430,240" stroke="url(#skoolBlueGrad)" strokeWidth="1.2" opacity="0.7" />
        <path d="M520,0 C420,30 360,110 400,240" stroke="url(#skoolBlueGrad)" strokeWidth="1.2" opacity="0.75" />
        <path d="M510,-10 C400,20 330,100 370,240" stroke="url(#skoolBlueGrad)" strokeWidth="1.2" opacity="0.8" />
        <path d="M500,-20 C380,10 300,90 340,240" stroke="url(#skoolBlueGrad)" strokeWidth="1.2" opacity="0.7" />
        <path d="M490,-30 C360,0 270,80 310,240" stroke="url(#skoolBlueGrad)" strokeWidth="1.2" opacity="0.6" />

        {/* Bottom subtle wave curves */}
        <path d="M-20,180 Q125,230 250,190 T520,200" stroke="#38bdf8" strokeWidth="1.2" opacity="0.5" />
        <path d="M-20,195 Q125,245 250,205 T520,215" stroke="#60a5fa" strokeWidth="1.2" opacity="0.45" />
        <path d="M-20,210 Q125,260 250,220 T520,230" stroke="#818cf8" strokeWidth="1.2" opacity="0.4" />
      </svg>

      {/* Centered Typography Matching Reference Screenshot */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center p-4 text-center">
        <h2 className="text-4xl sm:text-5xl font-black italic tracking-wider text-white drop-shadow-[0_0_28px_rgba(56,189,248,0.85)]">
          {bannerText || "Q & A"}
        </h2>
        {bannerSubtitle && (
          <div className="mt-3 inline-flex items-center rounded-full bg-white px-4 py-1 text-[11px] sm:text-xs font-bold tracking-tight text-zinc-900 shadow-md">
            {bannerSubtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function isMeetingOlder(event?: CalendarEvent | null): boolean {
  if (!event) return false;
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const eventDate = new Date(event.start || event.end);
    const startOfEventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), 0, 0, 0, 0).getTime();

    if (startOfEventDay < startOfToday) {
      return true;
    }
    if (startOfEventDay > startOfToday) {
      return false;
    }
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
  thumbnail?: string;
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
  thumbnail: "",
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
    saveCalendarEvent,
    deleteCalendarEvent,
    updateProjectStatus,
    updateProjectMeetSync,
    updateProjectProgress,
    toggleProjectTask,
    addProjectTask,
    selectMeetProject,
    send5MinMeetingReminder,
  } = useApp();

  const isAdminOrManager = user?.role === "admin" || user?.role === "manager";
  const searchParams = useSearchParams();

  // Filter out cancelled/soft-deleted events and remove older/past meetings for non-staff roles
  const visibleEvents = useMemo(() => {
    const nonCancelled = (events || []).filter(
      (e) =>
        e.status !== "cancelled" &&
        !e.isCancelled &&
        (e.type as string) !== "cancelled" &&
        !(typeof e.description === "string" && e.description.startsWith("[CANCELLED]"))
    );
    if (isAdminOrManager) return nonCancelled;
    return nonCancelled.filter((e) => !isMeetingOlder(e));
  }, [events, isAdminOrManager]);


  const [cursor, setCursor] = useState(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [rsvpEventIds, setRsvpEventIds] = useState<string[]>([]);

  // Event CRUD State
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventModalMode, setEventModalMode] = useState<"view" | "edit" | "create">("view");
  const [eventForm, setEventForm] = useState<{
    id?: string;
    title: string;
    start: string;
    end: string;
    type: EventType;
    description: string;
    bannerText?: string;
    bannerSubtitle?: string;
    bannerImage?: string;
    meetUrl?: string;
    isLocked?: boolean;
    hostName?: string;
  }>({
    title: "",
    start: "",
    end: "",
    type: "live",
    description: "",
    bannerText: "Q & A",
    bannerSubtitle: "AI Automation Society Plus",
    bannerImage: "",
    meetUrl: "https://meet.google.com/new",
    isLocked: true,
    hostName: "",
  });
  const [eventBusy, setEventBusy] = useState(false);
  const [eventError, setEventError] = useState("");
  const [calDropdownOpen, setCalDropdownOpen] = useState(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);
  const calDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ps_calendar_rsvps");
      if (saved) {
        setRsvpEventIds(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  // Handle direct navigation / RSVP from "Add to Meet Calendar" button
  useEffect(() => {
    const eventParam = searchParams.get("event") || searchParams.get("eventId");
    if (eventParam && events && events.length > 0) {
      const match = events.find(
        (e) => e.id === eventParam || e.title.toLowerCase().includes(eventParam.toLowerCase())
      );
      if (match) {
        setSelectedEvent(match);
        setEventModalMode("view");
        setEventModalOpen(true);
        setRsvpEventIds((prev) => {
          if (!prev.includes(match.id)) {
            const updated = [...prev, match.id];
            try {
              localStorage.setItem("ps_calendar_rsvps", JSON.stringify(updated));
            } catch {}
            return updated;
          }
          return prev;
        });
        const matchDate = new Date(match.start || match.end);
        if (!isNaN(matchDate.getTime())) {
          setCursor(new Date(matchDate.getFullYear(), matchDate.getMonth(), 1));
        }
      }
    }
  }, [searchParams, events]);

  // Close calendar dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (calDropdownRef.current && !calDropdownRef.current.contains(e.target as Node)) {
        setCalDropdownOpen(false);
      }
    }
    if (calDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [calDropdownOpen]);

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

  // Event CRUD Handlers
  function openViewMeeting(ev: CalendarEvent) {
    setSelectedEvent(ev);
    setEventModalMode("view");
    setEventError("");
    setCalDropdownOpen(false);
    setEventModalOpen(true);
  }

  function openCreateMeeting(defaultDate?: Date) {
    if (!isAdminOrManager) return;
    const baseDate = defaultDate ? new Date(defaultDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    baseDate.setHours(15, 0, 0, 0);
    const endBase = new Date(baseDate.getTime() + 60 * 60 * 1000);

    setEventForm({
      title: "Q&A w/ Nate",
      start: toLocalDatetimeInputString(baseDate),
      end: toLocalDatetimeInputString(endBase),
      type: "live",
      description: "Become a plus member to unlock weekly calls with Nate! (always recorded)",
      bannerText: "Q & A",
      bannerSubtitle: "AI Automation Society Plus",
      bannerImage: "",
      meetUrl: "https://meet.google.com/new",
      isLocked: true,
      hostName: user?.name || "Host",
    });
    setSelectedEvent(null);
    setEventModalMode("create");
    setEventError("");
    setCalDropdownOpen(false);
    setEventModalOpen(true);
  }

  function openEditMeeting(ev: CalendarEvent) {
    if (!isAdminOrManager) return;
    setEventForm({
      id: ev.id,
      title: ev.title,
      start: toLocalDatetimeInputString(ev.start),
      end: toLocalDatetimeInputString(ev.end),
      type: ev.type || "live",
      description: ev.description || "",
      bannerText: ev.bannerText || "Q & A",
      bannerSubtitle: ev.bannerSubtitle || "AI Automation Society Plus",
      bannerImage: ev.bannerImage || "",
      meetUrl: ev.meetUrl || "https://meet.google.com/new",
      isLocked: ev.isLocked ?? true,
      hostName: ev.hostName || "",
    });
    setSelectedEvent(ev);
    setEventModalMode("edit");
    setEventError("");
    setCalDropdownOpen(false);
    setEventModalOpen(true);
  }

  async function onSaveMeeting() {
    if (!isAdminOrManager) {
      setEventError("Access denied. Manager or Admin role required.");
      return;
    }
    if (!eventForm.title.trim()) {
      setEventError("Please enter a meeting title.");
      return;
    }
    if (!eventForm.start || !eventForm.end) {
      setEventError("Please specify start and end dates and times.");
      return;
    }
    setEventBusy(true);
    setEventError("");

    const startDateObj = new Date(eventForm.start);
    const endDateObj = new Date(eventForm.end);
    const isoStart = !isNaN(startDateObj.getTime()) ? startDateObj.toISOString() : eventForm.start;
    const isoEnd = !isNaN(endDateObj.getTime()) ? endDateObj.toISOString() : eventForm.end;

    const res = await saveCalendarEvent({
      ...eventForm,
      start: isoStart,
      end: isoEnd,
    });
    setEventBusy(false);
    if (!res.ok) {
      setEventError(res.error || "Could not save meeting.");
      return;
    }

    // Auto-navigate calendar view to the month of the newly scheduled meeting
    if (!isNaN(startDateObj.getTime())) {
      setCursor(new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1));
    }

    setEventModalOpen(false);
    setSelectedEvent(null);
  }

  async function onDeleteMeeting(id: string) {
    if (!isAdminOrManager) {
      alert("Access denied. Manager or Admin role required.");
      return;
    }
    if (!confirm("Are you sure you want to delete this meeting?")) return;
    setEventBusy(true);
    const res = await deleteCalendarEvent(id);
    setEventBusy(false);
    if (res.ok) {
      setEventModalOpen(false);
      setSelectedEvent(null);
    } else {
      alert(res.error || "Could not delete meeting from database.");
    }
  }


  async function handleCopyMeetingLink(url: string) {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopyLinkSuccess(true);
      setTimeout(() => setCopyLinkSuccess(false), 2200);
    } catch {
      // Fallback
    }
  }

  // Project Modal State
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectForm>(emptyProjectForm);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Thumbnail upload state
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailError, setThumbnailError] = useState("");
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  async function handleThumbnailUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      setThumbnailError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }
    setThumbnailUploading(true);
    setThumbnailError("");
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      setThumbnailUploading(false);
      if (!json.ok) {
        setThumbnailError(json.error || "Image upload failed.");
        return;
      }
      setForm((f) => ({ ...f, thumbnail: json.url }));
    } catch {
      setThumbnailUploading(false);
      setThumbnailError("Failed to upload image. Please check your connection.");
    }
  }

  // New task input state inside modal
  const [newModalTaskTitle, setNewModalTaskTitle] = useState("");

  // Expandable tasks toggle for active project cards
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({
    "proj-nexus": true,
  });
  const [cardNewTask, setCardNewTask] = useState<Record<string, string>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("ps_last_selected_meet_project_id") || null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [copiedProjectId, setCopiedProjectId] = useState<string | null>(null);
  const [broadcastSending, setBroadcastSending] = useState<string | null>(null);
  const [broadcastSent, setBroadcastSent] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedProj = localStorage.getItem("ps_last_selected_meet_project_id");
      if (savedProj && !selectedProjectId) {
        setSelectedProjectId(savedProj);
      }
    } catch {}
  }, []);

  // @ Mention state in Description
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionCursorIndex, setMentionCursorIndex] = useState<number | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Custom Member Picker Dropdown state
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [memberFilterText, setMemberFilterText] = useState("");
  const memberPickerRef = useRef<HTMLDivElement>(null);

  // Close member picker on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (memberPickerRef.current && !memberPickerRef.current.contains(e.target as Node)) {
        setMemberPickerOpen(false);
      }
    }
    if (memberPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [memberPickerOpen]);

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

  // Active community members
  const activeMembers = useMemo(() => {
    return users.filter((u) => u.status !== "pending");
  }, [users]);

  // Check if all active community members are currently assigned
  const allActiveUsersSelected = useMemo(() => {
    return activeMembers.length > 0 && activeMembers.every((u) => form.memberIds.includes(u.id));
  }, [activeMembers, form.memberIds]);

  // Filtered members for custom Member Picker dropdown
  const availableFilteredUsers = useMemo(() => {
    const q = memberFilterText.trim().toLowerCase();
    if (!q || q === "@all" || q === "all") return activeMembers;
    const cleanQ = q.startsWith("@") ? q.slice(1) : q;
    return activeMembers.filter(
      (u) =>
        u.name.toLowerCase().includes(cleanQ) ||
        u.username.toLowerCase().includes(cleanQ) ||
        (u.email && u.email.toLowerCase().includes(cleanQ))
    );
  }, [activeMembers, memberFilterText]);

  // Filtered members for @ mentions in description
  const mentionCandidates = useMemo(() => {
    const q = mentionQuery.toLowerCase().trim();
    if (!q || q === "all" || q === "@all") return activeMembers.slice(0, 8);
    return activeMembers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [activeMembers, mentionQuery]);

  function openCreateProject() {
    setForm({
      ...emptyProjectForm,
      leadId: user?.id || users[0]?.id || "",
      leadName: user?.name || users[0]?.name || "Admin",
      memberIds: user?.id ? [user.id] : [],
      tasks: [],
      progress: 0,
      status: "active",
      thumbnail: "",
    });
    setEditingProjectId(null);
    setErrorMsg("");
    setThumbnailError("");
    setNewModalTaskTitle("");
    setMemberPickerOpen(false);
    setMemberFilterText("");
    setProjectModalOpen(true);
  }

  function openEditProject(proj: Project) {
    setForm({
      id: proj.id,
      title: proj.title,
      description: proj.description,
      version: proj.version || "v1.0.0",
      thumbnail: proj.thumbnail || "",
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
    setThumbnailError("");
    setMemberPickerOpen(false);
    setMemberFilterText("");
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

  // Select @all in description mention menu
  function selectMentionAll() {
    if (mentionCursorIndex === null) return;
    const desc = form.description;
    const beforeAt = desc.slice(0, mentionCursorIndex);
    const textAfterCursor = desc.slice(mentionCursorIndex + 1 + mentionQuery.length);
    const newDesc = `${beforeAt}@all ${textAfterCursor}`;

    const allMemberIds = activeMembers.map((u) => u.id);
    const allUsernames = activeMembers.map((u) => u.username);

    setForm((f) => ({
      ...f,
      description: newDesc,
      memberIds: Array.from(new Set([...f.memberIds, ...allMemberIds])),
      mentionedUsernames: Array.from(new Set([...f.mentionedUsernames, ...allUsernames, "all"])),
    }));

    setShowMentionMenu(false);
    setMentionQuery("");

    setTimeout(() => {
      if (descriptionRef.current) {
        const nextPos = mentionCursorIndex + "@all ".length;
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

  // Toggle all members in team assignment
  function toggleAllTeamMembers() {
    const allIds = activeMembers.map((u) => u.id);
    const shouldSelectAll = !allActiveUsersSelected;

    setForm((f) => ({
      ...f,
      memberIds: shouldSelectAll ? allIds : [],
    }));
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
    if (typeof window !== "undefined") {
      try {
        const savedId = localStorage.getItem("ps_last_selected_meet_project_id");
        if (savedId) {
          const found = projects.find((p) => p.id === savedId);
          if (found) return found;
        }
      } catch {}
    }
    const meetActive = projects.find((p) => p.isMeetActive);
    if (meetActive) return meetActive;
    return currentProjects[0] || projects[0] || null;
  }, [selectedProjectId, projects, currentProjects]);

  useEffect(() => {
    if (activeProject?.id && typeof window !== "undefined") {
      try {
        localStorage.setItem("ps_last_selected_meet_project_id", activeProject.id);
      } catch {}
    }
  }, [activeProject?.id]);

  async function handleCopyMeetLink(url: string, projectId: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedProjectId(projectId);
    setTimeout(() => setCopiedProjectId(null), 2500);
  }

  async function handleBroadcast5MinReminder(projectId: string) {
    setBroadcastSending(projectId);
    const res = await send5MinMeetingReminder(projectId);
    setBroadcastSending(null);
    if (res.ok) {
      setBroadcastSent(projectId);
      setTimeout(() => setBroadcastSent(null), 3500);
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Projects Section: Single Selected Project Card */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 px-1">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <span>Projects & Initiatives</span>
              <span className="h-2.5 w-2.5 rounded-full bg-[#5051F9]" />
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5">
              Comprehensive overview of your initiatives synced with Meet Calendar
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isAdminOrManager && (
              <button
                onClick={openCreateProject}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#5051F9] px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#4041d8] transition cursor-pointer"
              >
                <Plus size={14} /> Add Project
              </button>
            )}
          </div>
        </div>

        {!activeProject ? (
          <Card className="p-6 sm:p-8 text-center bg-zinc-50/50 border-dashed">
            <Layers size={32} className="mx-auto text-zinc-400 mb-2" />
            <p className="text-xs sm:text-sm font-semibold text-zinc-700">
              No projects created yet
            </p>
            <p className="text-[11px] sm:text-xs text-zinc-500 mt-1">
              Click &ldquo;+ Add Project&rdquo; to create a new initiative.
            </p>
          </Card>
        ) : (() => {
          const lead = users.find((u) => u.id === activeProject.leadId);
          const teamMembers = (activeProject.memberIds || [])
            .map((id) => users.find((u) => u.id === id))
            .filter(Boolean) as PublicUser[];

          const matchedEvent = events.find(
            (ev) =>
              `${ev.title} (${formatDateTime(ev.start)})` === activeProject.meetSyncTime ||
              ev.title === activeProject.meetSyncTime ||
              ev.id === activeProject.meetSyncTime ||
              ev.title.toLowerCase().includes(activeProject.title.toLowerCase())
          );

          const timing = checkMeetingStatus(
            matchedEvent?.start,
            matchedEvent?.end,
            activeProject.meetSyncTime
          );

          const isProjMeetEnded = timing.status === "ended";
          const isWaiting = timing.status === "waiting";
          const canJoinLive = timing.status === "can_join";

          const endedUrl = `/meeting-ended?title=${encodeURIComponent(
            matchedEvent?.title || activeProject.title
          )}&start=${encodeURIComponent(
            matchedEvent?.start || timing.startDate.toISOString()
          )}&end=${encodeURIComponent(
            matchedEvent?.end || timing.endDate.toISOString()
          )}&type=${matchedEvent?.type || "live"}&desc=${encodeURIComponent(
            matchedEvent?.description || activeProject.description
          )}`;

          const waitingUrl = `/meeting-waiting?title=${encodeURIComponent(
            matchedEvent?.title || activeProject.title
          )}&start=${encodeURIComponent(
            matchedEvent?.start || timing.startDate.toISOString()
          )}&end=${encodeURIComponent(
            matchedEvent?.end || timing.endDate.toISOString()
          )}&url=${encodeURIComponent(
            activeProject.meetUrl || "https://meet.google.com/new"
          )}&host=${encodeURIComponent(
            activeProject.leadName || lead?.name || "Permanent Skills Admin"
          )}&room=${encodeURIComponent(
            activeProject.meetRoom || "Nexus Meet #room-general"
          )}&type=${matchedEvent?.type || "live"}&desc=${encodeURIComponent(
            matchedEvent?.description || activeProject.description
          )}`;

          const targetUrl = isProjMeetEnded
            ? endedUrl
            : isWaiting
              ? waitingUrl
              : activeProject.meetUrl || "https://meet.google.com/new";

          return (
            <Card
              key={activeProject.id}
              className="overflow-hidden border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-sm transition hover:shadow-md"
            >
              {isAdminOrManager ? (
                /* Admin & Manager View */
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
                  {/* Left: UI Mockup / Thumbnail Box */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 flex-1 min-w-0">
                    {/* Left: UI Mockup / Thumbnail Box (Editable for Admin & Manager) */}
                    {activeProject.thumbnail ? (
                      <div
                        onClick={() => openEditProject(activeProject)}
                        className="relative h-28 w-full sm:w-44 md:w-48 shrink-0 overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-900 shadow-inner group cursor-pointer transition hover:shadow-md"
                        title="Click to edit project & cover image"
                      >
                        <img
                          src={activeProject.thumbnail}
                          alt={activeProject.title}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/60 pointer-events-none" />
                        <div className="relative z-5 flex items-center justify-between p-2.5 border-b border-white/10">
                          <span className="text-[10px] font-bold text-white truncate max-w-[110px] drop-shadow-xs">
                            {activeProject.title}
                          </span>
                          <span className="text-[9px] font-mono text-indigo-300 drop-shadow-xs">#meet-sync</span>
                        </div>
                        <span className="absolute bottom-2 right-2 z-5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold font-mono text-white backdrop-blur-xs border border-white/10">
                          {activeProject.version || "v1.0.0"}
                        </span>
                        {/* Hover & Mobile Edit Overlay */}
                        <div className="absolute inset-0 z-10 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 backdrop-blur-[2px]">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                            <Pencil size={13} className="text-white" />
                          </div>
                          <span className="text-[11px] font-semibold text-white tracking-wide">Edit Card</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => openEditProject(activeProject)}
                        className="relative h-28 w-full sm:w-44 md:w-48 shrink-0 overflow-hidden rounded-xl border border-zinc-200/80 bg-gradient-to-br from-zinc-50 via-zinc-100 to-indigo-50/40 p-3 shadow-inner group cursor-pointer transition hover:shadow-md"
                        title="Click to edit project & cover image"
                      >
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
                        {/* Hover Edit Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 backdrop-blur-[2px] rounded-xl">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                            <Pencil size={13} className="text-white" />
                          </div>
                          <span className="text-[11px] font-semibold text-white tracking-wide">Edit Card</span>
                        </div>
                      </div>
                    )}

                    {/* Middle: Details, Host, Team & Time of Meeting in Square Box */}
                    <div className="min-w-0 flex-1 space-y-2.5 sm:space-y-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-zinc-900 leading-snug">{activeProject.title}</h3>
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
                      <div className="flex items-center gap-2.5 sm:gap-3.5 flex-wrap pt-0.5">
                        {/* Member Avatars */}
                        <div className="flex items-center -space-x-2">
                          {teamMembers.slice(0, 4).map((m) => (
                            <Avatar
                              key={m.id}
                              user={m}
                              size={26}
                              className="ring-2 ring-white shadow-2xs sm:w-7 sm:h-7"
                            />
                          ))}
                          {teamMembers.length > 4 && (
                            <span className="flex h-6.5 w-6.5 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-indigo-100 text-[10px] sm:text-[11px] font-bold text-indigo-700 ring-2 ring-white">
                              +{teamMembers.length - 4}
                            </span>
                          )}
                        </div>

                        {/* Host Badge */}
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100/90 border border-zinc-200/60 px-2.5 py-1 text-xs font-medium text-zinc-800 shadow-2xs">
                          <Users size={12} className="text-[#5051F9] sm:w-3.5 sm:h-3.5" />
                          <span className="text-[11px] sm:text-xs">Host: <strong className="font-semibold text-zinc-900">{activeProject.leadName || lead?.name || "Permanent Skills Admin"}</strong></span>
                        </div>

                        {/* Time of Meeting in Square Box */}
                        <div className="inline-flex items-center gap-2 sm:gap-2.5 rounded-xl border border-red-200/80 bg-red-50/70 px-2.5 sm:px-3.5 py-1 text-zinc-900 shadow-2xs">
                          <div className="flex h-5.5 w-5.5 sm:h-6 sm:w-6 items-center justify-center rounded-lg bg-red-100 text-red-600 shrink-0">
                            <Clock size={13} className="sm:w-3.5 sm:h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider text-red-600 font-mono leading-none mb-0.5">
                              Time of Meeting
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-zinc-900 truncate block leading-tight">
                              {activeProject.meetSyncTime || "Sprint Sync: Today, 3:00 PM"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Meet Link Box with Single Project Selector Dropdown, Copyable Link & Actions */}
                  <div className="flex flex-col items-stretch lg:items-end justify-between gap-3 border-t lg:border-t-0 lg:border-l border-zinc-100 pt-3.5 lg:pt-0 lg:pl-6 shrink-0 w-full lg:w-auto">
                    <div className="w-full lg:w-[320px] rounded-xl bg-[#5051F9]/5 border border-[#5051F9]/15 p-3 sm:p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-[#5051F9]/90 font-mono">
                          Select Project for Meeting
                        </span>
                        {activeProject.isMeetActive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Sync
                          </span>
                        )}
                      </div>

                      {/* Single Dropdown showing current projects */}
                      <div className="relative">
                        <select
                          value={activeProject.id}
                          onChange={async (e) => {
                            const val = e.target.value;
                            if (val === "__CREATE_NEW_PROJECT__") {
                              openCreateProject();
                              return;
                            }
                            setSelectedProjectId(val);
                            try {
                              localStorage.setItem("ps_last_selected_meet_project_id", val);
                            } catch {}
                            if (isAdminOrManager) {
                              await selectMeetProject(val);
                            }
                          }}
                          className="w-full cursor-pointer appearance-none rounded-lg border border-[#5051F9]/20 bg-white px-3 py-1.5 pr-8 text-xs font-semibold text-zinc-800 shadow-2xs outline-none hover:border-[#5051F9]/40 focus:border-[#5051F9] transition"
                        >
                          {currentProjects.length > 0 ? (
                            currentProjects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title} {p.isMeetActive ? "★ (Active Meet)" : ""}
                              </option>
                            ))
                          ) : (
                            projects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title} {p.isMeetActive ? "★ (Active Meet)" : ""}
                              </option>
                            ))
                          )}
                          <option value="__CREATE_NEW_PROJECT__">+ Create New Project...</option>
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      </div>

                      {/* Admin/Manager Copyable Meet Link & Quick Controls */}
                      <div className="space-y-2 pt-2 border-t border-[#5051F9]/10">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono flex items-center gap-1">
                            <Link2 size={12} className="text-[#5051F9]" /> Meeting Room Link
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono font-medium truncate max-w-[130px]">
                            {activeProject.meetRoom || "Nexus Meet"}
                          </span>
                        </div>

                        {/* Copyable Link Input with Copy Button and Open in New Tab */}
                        <div className="flex items-center gap-1.5">
                          <div className="relative flex-1 min-w-0">
                            <input
                              type="text"
                              readOnly
                              value={activeProject.meetUrl || "https://meet.google.com/new"}
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                              className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-mono text-zinc-700 shadow-inner outline-none select-all focus:border-[#5051F9] truncate"
                              title="Click to select meeting URL"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyMeetLink(activeProject.meetUrl || "https://meet.google.com/new", activeProject.id)}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-xs transition cursor-pointer shrink-0 ${
                              copiedProjectId === activeProject.id
                                ? "bg-emerald-600 text-white"
                                : "bg-zinc-900 hover:bg-black text-white"
                            }`}
                            title="Copy Meeting Link to Clipboard"
                          >
                            {copiedProjectId === activeProject.id ? (
                              <>
                                <Check size={13} />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <a
                            href={activeProject.meetUrl || "https://meet.google.com/new"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-lg bg-[#5051F9] hover:bg-[#4041d8] text-white p-1.5 shadow-xs transition cursor-pointer shrink-0"
                            title="Open Meeting in New Tab"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>

                        {/* Broadcast 5-Min Notification Button */}
                        <div className="pt-1 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleBroadcast5MinReminder(activeProject.id)}
                            disabled={broadcastSending === activeProject.id}
                            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold transition cursor-pointer ${
                              broadcastSent === activeProject.id
                                ? "text-emerald-600 font-bold"
                                : "text-[#5051F9] hover:text-[#4041d8] hover:underline"
                            }`}
                            title="Broadcast a 5-minute pre-meeting reminder notification with copyable meet link to all members"
                          >
                            {broadcastSent === activeProject.id ? (
                              <>
                                <CheckCircle2 size={13} />
                                <span>5m Alert Sent to All Members!</span>
                              </>
                            ) : (
                              <>
                                <Bell size={13} />
                                <span>{broadcastSending === activeProject.id ? "Sending Alert..." : "Broadcast 5m Reminder"}</span>
                              </>
                            )}
                          </button>
                        </div>
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

                    {/* Project actions (Edit, Delete) */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openEditProject(activeProject)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition cursor-pointer"
                        title="Edit Project"
                      >
                        <Pencil size={13} />
                        <span>Edit Project</span>
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
                /* Regular User View */
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
                  {/* Left: Thumbnail & Details */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 flex-1 min-w-0">
                    {/* Thumbnail Card (View Only) */}
                    {activeProject.thumbnail ? (
                      <div className="relative h-28 w-full sm:w-44 md:w-48 shrink-0 overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-900 shadow-inner">
                        <img
                          src={activeProject.thumbnail}
                          alt={activeProject.title}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/60 pointer-events-none" />
                        <div className="relative z-5 flex items-center justify-between p-2.5 border-b border-white/10">
                          <span className="text-[10px] font-bold text-white truncate max-w-[110px] drop-shadow-xs">
                            {activeProject.title}
                          </span>
                          <span className="text-[9px] font-mono text-indigo-300 drop-shadow-xs">#meet-sync</span>
                        </div>
                        <span className="absolute bottom-2 right-2 z-5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold font-mono text-white backdrop-blur-xs border border-white/10">
                          {activeProject.version || "v1.0.0"}
                        </span>
                      </div>
                    ) : (
                      <div className="relative h-28 w-full sm:w-44 md:w-48 shrink-0 overflow-hidden rounded-xl border border-zinc-200/80 bg-gradient-to-br from-zinc-50 via-zinc-100 to-indigo-50/40 p-3 shadow-inner">
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
                    )}

                    {/* Middle: Title, Profile Icons, Host Name */}
                    <div className="min-w-0 flex-1 space-y-2.5 sm:space-y-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-zinc-900 leading-snug">{activeProject.title}</h3>
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

                      <div className="flex items-center gap-3 sm:gap-3.5 flex-wrap">
                        {/* Profile Icons */}
                        <div className="flex items-center -space-x-2">
                          {teamMembers.slice(0, 4).map((m) => (
                            <Avatar
                              key={m.id}
                              user={m}
                              size={26}
                              className="ring-2 ring-white shadow-2xs sm:w-7 sm:h-7"
                            />
                          ))}
                          {teamMembers.length > 4 && (
                            <span className="flex h-6.5 w-6.5 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-indigo-100 text-[10px] sm:text-[11px] font-bold text-indigo-700 ring-2 ring-white">
                              +{teamMembers.length - 4}
                            </span>
                          )}
                        </div>

                        {/* Host Name Badge */}
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100/90 border border-zinc-200/60 px-2.5 py-1 text-xs font-medium text-zinc-800 shadow-2xs">
                          <Users size={12} className="text-[#5051F9] sm:w-3.5 sm:h-3.5" />
                          <span className="text-[11px] sm:text-xs">Host: <strong className="font-semibold text-zinc-900">{activeProject.leadName || lead?.name || "Permanent Skills Admin"}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Join now button and below it Time of Meeting in red */}
                  <div className="flex flex-col items-start sm:items-end gap-1.5 border-t lg:border-t-0 lg:border-l border-zinc-100 pt-3 lg:pt-0 lg:pl-6 shrink-0 w-full lg:w-auto">
                    {activeProject.meetUrl && (
                      <a
                        href={targetUrl}
                        target={canJoinLive ? "_blank" : "_self"}
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold shadow-xs transition cursor-pointer w-full sm:w-auto ${
                          isProjMeetEnded
                            ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                            : canJoinLive
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md animate-pulse"
                              : "bg-[#5051F9] hover:bg-[#4041d8] text-white"
                        }`}
                      >
                        {isProjMeetEnded ? (
                          <VideoOff size={13} />
                        ) : isWaiting ? (
                          <Clock size={13} />
                        ) : (
                          <Video size={13} />
                        )}
                        <span>
                          {isProjMeetEnded
                            ? "Meet Ended"
                            : canJoinLive
                              ? "Join Meet (Live Now)"
                              : "Join Meet"}
                        </span>
                      </a>
                    )}

                    {/* Time of the meeting in red colored below the button */}
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                      <Clock size={13} className="text-red-500 shrink-0" />
                      <span>{activeProject.meetSyncTime || "Sprint Sync: Today, 3:00 PM"}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })()}
      </div>

      {/* 2. Calendar Grid Toolbar & Grid */}
      <Card className="p-3.5 sm:p-5">
        <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCursor(new Date())}
              className="rounded-full border border-zinc-200 bg-white px-3 sm:px-3.5 py-1 text-xs sm:text-sm font-medium hover:bg-zinc-50 shadow-xs cursor-pointer"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-600 transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <h1 className="text-base sm:text-lg font-bold text-zinc-900 leading-tight">
                {cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h1>
              <p className="text-[10px] sm:text-xs text-zinc-500">
                {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} ({userTz})
              </p>
            </div>
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-600 transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Right Toolbar Actions: + Add Meeting */}
          {isAdminOrManager && (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <PrimaryButton
                onClick={() => openCreateMeeting()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 sm:px-3.5 shadow-sm cursor-pointer"
              >
                <Plus size={13} className="sm:w-3.5 sm:h-3.5" /> <span>Add Meeting</span>
              </PrimaryButton>
            </div>
          )}
        </div>

        <div className="grid grid-cols-7 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
          {DAYS.map((d) => (
            <div key={d} className="py-1.5 sm:py-2.5">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 border-t border-zinc-100">
          {grid.map((date) => {
            const key = date.toDateString();
            const inMonth = date.getMonth() === cursor.getMonth();
            const isToday = date.toDateString() === today.toDateString();
            
            const dayEvents = visibleEvents.filter((e) => {
              if (!e) return false;
              if (e.start) {
                const sDate = new Date(e.start);
                if (!isNaN(sDate.getTime()) && sDate.toDateString() === key) {
                  return true;
                }
                const parsed = parseMeetingStartTime(undefined, e.start);
                if (!isNaN(parsed.getTime()) && parsed.toDateString() === key) {
                  return true;
                }
              }
              if (e.end) {
                const eDate = new Date(e.end);
                if (!isNaN(eDate.getTime()) && eDate.toDateString() === key) {
                  return true;
                }
              }
              return false;
            });

            return (
              <div
                key={key}
                onClick={(e) => {
                  if (e.target === e.currentTarget && isAdminOrManager) {
                    openCreateMeeting(date);
                  }
                }}
                className={`min-h-[80px] sm:min-h-[110px] border-b border-r border-zinc-100 p-1 sm:p-2 transition ${
                  inMonth ? "bg-white" : "bg-zinc-50/50"
                } ${isAdminOrManager ? "cursor-pointer hover:bg-zinc-50/80" : ""}`}
                title={isAdminOrManager ? `Click to schedule meeting on ${date.toLocaleDateString()}` : undefined}
              >
                <div className="flex items-center justify-between mb-1">
                  <div
                    className={`inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[10px] sm:text-xs font-semibold ${
                      isToday
                        ? "bg-red-500 text-white"
                        : inMonth
                          ? "text-zinc-800"
                          : "text-zinc-400"
                    }`}
                  >
                    {date.getDate()}
                  </div>
                  {isAdminOrManager && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCreateMeeting(date);
                      }}
                      className="opacity-0 hover:opacity-100 focus:opacity-100 group-hover:opacity-100 text-zinc-400 hover:text-primary transition p-0.5"
                      title="Schedule meeting on this day"
                    >
                      <Plus size={12} />
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {dayEvents.map((e) => {
                    const displayTitle = e.title
                      .replace(/^👑\s*/, "")
                      .replace(/VIP Mastermind/, "Premium Mastermind");
                    const isPrem =
                      e.type === "premium" ||
                      e.title.toLowerCase().includes("premium") ||
                      e.title.toLowerCase().includes("vip");

                    return (
                      <button
                        key={e.id}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          openViewMeeting(e);
                        }}
                        className={`block w-full truncate rounded px-1 sm:px-1.5 py-0.5 text-left text-[10px] sm:text-[11px] font-medium transition cursor-pointer ${
                          isPrem
                            ? "bg-[#f3f0ff] text-[#6d28d9] hover:bg-[#eae5ff]"
                            : "bg-[#eef4ff] text-[#1d4ed8] hover:bg-[#e0ecff]"
                        }`}
                        title={`${displayTitle} (${formatDateTime(e.start)})`}
                      >
                        <span className="truncate block">
                          {eventTimeLabel(e.start)} - {displayTitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 3. Skool-Style Meeting View Modal & Admin/Manager Edit Modal */}
      {eventModalOpen && eventModalMode === "view" && selectedEvent && (() => {
        const timing = checkMeetingStatus(selectedEvent.start, selectedEvent.end);
        const isEventOver = timing.status === "ended";
        const canJoinLive = timing.status === "can_join";
        const isRsvpd = rsvpEventIds.includes(selectedEvent.id);

        const gcalUrl = createGoogleCalendarUrl({
          title: selectedEvent.title,
          start: selectedEvent.start,
          end: selectedEvent.end,
          description: selectedEvent.description,
          location: selectedEvent.meetUrl || "https://meet.google.com/new",
        });

        return (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <button
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer transition-opacity"
              onClick={() => {
                setEventModalOpen(false);
                setSelectedEvent(null);
              }}
              aria-label="Close"
            />
            
            {/* Modal Card matching exact Skool UI */}
            <div className="relative z-10 w-full max-w-md rounded-2xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden my-auto border border-zinc-200/80 animate-in fade-in zoom-in-95 duration-150">
              {/* Close Button on top right */}
              <button
                onClick={() => {
                  setEventModalOpen(false);
                  setSelectedEvent(null);
                }}
                className="absolute top-3.5 right-3.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/90 hover:bg-black/80 hover:text-white transition backdrop-blur-xs cursor-pointer active:scale-95"
                aria-label="Close modal"
              >
                <X size={15} />
              </button>

              {/* Top Wave Contour Header */}
              <SkoolMeetingWaveBanner
                bannerText={selectedEvent.bannerText || "Q & A"}
                bannerSubtitle={selectedEvent.bannerSubtitle || "AI Automation Society Plus"}
                bannerImage={selectedEvent.bannerImage}
              />

              {/* Card Body matching screenshot */}
              <div className="p-5 sm:p-6 space-y-4">
                {/* 1. Lock Icon + Title */}
                <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-zinc-900 leading-snug">
                  {selectedEvent.isLocked !== false && (
                    <span className="text-xl shrink-0 leading-none">🔒</span>
                  )}
                  <span className="truncate">{selectedEvent.title || "Q&A w/ Nate"}</span>
                </div>

                {/* 2. Calendar Date & Time + Timezone Subtitle */}
                <div className="flex items-start gap-2.5">
                  <CalendarIcon size={18} className="text-zinc-900 shrink-0 mt-0.5 stroke-[2.2]" />
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-zinc-900 leading-tight">
                      {formatSkoolMeetingTime(selectedEvent.start, selectedEvent.end)}
                    </p>
                    <p className="text-[11px] sm:text-xs text-zinc-400 font-normal mt-0.5">
                      {getTimezoneCityName()}
                    </p>
                  </div>
                </div>

                {/* 3. Link Icon + Meeting URL */}
                <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                  <Link2 size={18} className="text-zinc-900 shrink-0 stroke-[2.2]" />
                  <a
                    href={selectedEvent.meetUrl || "https://meet.google.com/new"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2563eb] hover:underline font-medium truncate max-w-[280px] sm:max-w-[320px]"
                    title={selectedEvent.meetUrl || "https://meet.google.com/new"}
                  >
                    {selectedEvent.meetUrl || "https://meet.google.com/new"}
                  </a>
                </div>

                {/* 4. Description */}
                <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed pt-1">
                  {selectedEvent.description || "Become a plus member to unlock weekly calls with Nate! (always recorded)"}
                </p>

                {/* 5. ADD TO CALENDAR ⌄ Button with Dropdown */}
                <div ref={calDropdownRef} className="relative pt-2">
                  <button
                    type="button"
                    onClick={() => setCalDropdownOpen((prev) => !prev)}
                    className="w-full rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-3.5 px-4 flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wider shadow-md transition active:scale-[0.99] cursor-pointer"
                  >
                    <CalendarIcon size={16} className="stroke-[2.5]" />
                    <span>ADD TO CALENDAR</span>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${calDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {calDropdownOpen && (
                    <div className="absolute left-0 right-0 bottom-full mb-2 z-30 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                      <a
                        href={gcalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setCalDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-blue-50 transition"
                      >
                        <CalendarIcon size={14} className="text-blue-600" />
                        <span>Google Calendar</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          downloadIcsCalendarFile({
                            title: selectedEvent.title,
                            description: selectedEvent.description,
                            start: selectedEvent.start,
                            end: selectedEvent.end,
                          });
                          setCalDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 transition text-left cursor-pointer"
                      >
                        <Download size={14} className="text-zinc-600" />
                        <span>Apple / .ICS File</span>
                      </button>
                      <a
                        href={`https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
                          selectedEvent.title
                        )}&startdt=${encodeURIComponent(selectedEvent.start)}&enddt=${encodeURIComponent(
                          selectedEvent.end
                        )}&body=${encodeURIComponent(selectedEvent.description || "")}&location=${encodeURIComponent(
                          selectedEvent.meetUrl || ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setCalDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-blue-50 transition"
                      >
                        <CalendarIcon size={14} className="text-sky-600" />
                        <span>Outlook Calendar</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          handleCopyMeetingLink(selectedEvent.meetUrl || window.location.href);
                          setCalDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 transition text-left cursor-pointer"
                      >
                        {copyLinkSuccess ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} className="text-zinc-500" />}
                        <span>{copyLinkSuccess ? "Meeting URL Copied!" : "Copy Meeting URL"}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 6. Admin & Manager Management Toolbar */}
                {isAdminOrManager && (
                  <div className="pt-3.5 border-t border-zinc-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Staff Controls (Admin / Manager)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditMeeting(selectedEvent)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-2xs transition cursor-pointer"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteMeeting(selectedEvent.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 transition cursor-pointer"
                        title="Delete Meeting"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Admin/Manager Create & Edit Meeting Modal */}
      {isAdminOrManager && (eventModalMode === "create" || eventModalMode === "edit") && (
        <Modal
          open={eventModalOpen}
          onClose={() => {
            setEventModalOpen(false);
            setSelectedEvent(null);
          }}
          title={eventModalMode === "create" ? "Schedule Upcoming Meeting" : "Edit Meeting Settings"}
          wide
        >
          <div className="space-y-4 pt-1">
            {eventError && (
              <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
                {eventError}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Meeting Title *">
                <input
                  className={inputClass}
                  placeholder="e.g. Q&A w/ Nate"
                  value={eventForm.title}
                  onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
                />
              </Field>

              <Field label="Lock for Members / VIP">
                <label className="flex items-center gap-2.5 rounded-xl border border-zinc-200 p-2.5 bg-zinc-50/50 cursor-pointer h-[42px] mt-0.5">
                  <input
                    type="checkbox"
                    checked={eventForm.isLocked ?? true}
                    onChange={(e) => setEventForm((f) => ({ ...f, isLocked: e.target.checked }))}
                    className="h-4 w-4 rounded text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-zinc-800">
                    🔒 Show Lock Icon (Members Only / Plus)
                  </span>
                </label>
              </Field>

              <Field label="Header Banner Big Text (e.g. Q & A)">
                <input
                  className={inputClass}
                  placeholder="e.g. Q & A"
                  value={eventForm.bannerText || ""}
                  onChange={(e) => setEventForm((f) => ({ ...f, bannerText: e.target.value }))}
                />
              </Field>

              <Field label="Header Banner Pill Badge Subtitle">
                <input
                  className={inputClass}
                  placeholder="e.g. AI Automation Society Plus"
                  value={eventForm.bannerSubtitle || ""}
                  onChange={(e) => setEventForm((f) => ({ ...f, bannerSubtitle: e.target.value }))}
                />
              </Field>

              <Field label="Start Date & Time *">
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={eventForm.start}
                  onChange={(e) => setEventForm((f) => ({ ...f, start: e.target.value }))}
                />
              </Field>

              <Field label="End Date & Time *">
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={eventForm.end}
                  onChange={(e) => setEventForm((f) => ({ ...f, end: e.target.value }))}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Meeting Link URL (Google Meet / Zoom / Skool) *">
                  <input
                    className={inputClass}
                    placeholder="https://www.skool.com/ai-automation-society-plus/... or Google Meet"
                    value={eventForm.meetUrl || ""}
                    onChange={(e) => setEventForm((f) => ({ ...f, meetUrl: e.target.value }))}
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Description & Notes *">
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border border-zinc-200 p-2.5 text-xs sm:text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Become a plus member to unlock weekly calls with Nate! (always recorded)"
                    value={eventForm.description}
                    onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </Field>
              </div>
            </div>

            {/* Modal Footer with "← Back to Details" / "← Back" and Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => {
                  if (eventModalMode === "edit" && selectedEvent) {
                    setEventModalMode("view");
                  } else {
                    setEventModalOpen(false);
                    setSelectedEvent(null);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
              >
                <ArrowLeft size={14} /> {eventModalMode === "edit" ? "Back to Details" : "Back / Cancel"}
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                {eventModalMode === "edit" && selectedEvent && (
                  <button
                    type="button"
                    onClick={() => onDeleteMeeting(selectedEvent.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    <Trash2 size={13} /> Delete Meeting
                  </button>
                )}
                <PrimaryButton disabled={eventBusy} onClick={onSaveMeeting} className="cursor-pointer text-xs">
                  {eventBusy ? "Saving..." : eventModalMode === "edit" ? "Save Changes" : "Schedule Meeting"}
                </PrimaryButton>
              </div>
            </div>
          </div>
        </Modal>
      )}

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
            {/* Initiative Card & Cover Image Customizer */}
            <div className="sm:col-span-2 rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-zinc-50/70 via-white to-indigo-50/25 p-3.5 sm:p-4 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2.5 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5051F9] text-white shadow-2xs shrink-0">
                    <ImageIcon size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900">Initiative Card & Cover Image</h4>
                    <p className="text-[10px] sm:text-[11px] text-zinc-500">Customize card preview or upload a custom cover image</p>
                  </div>
                </div>
                {form.thumbnail && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, thumbnail: "" }))}
                    className="text-[11px] font-semibold text-red-600 hover:text-red-700 underline cursor-pointer"
                  >
                    Reset to UI Mockup
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Live Card Preview */}
                <div className="shrink-0 w-full sm:w-auto">
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 font-mono">
                    Live Card Preview
                  </span>
                  {form.thumbnail ? (
                    <div className="relative h-28 w-full sm:w-44 shrink-0 overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-900 shadow-inner">
                      <img src={form.thumbnail} alt="Preview" className="absolute inset-0 h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/60 pointer-events-none" />
                      <div className="relative z-5 flex items-center justify-between p-2.5 border-b border-white/10">
                        <span className="text-[10px] font-bold text-white truncate max-w-[100px]">
                          {form.title || "Initiative Title"}
                        </span>
                        <span className="text-[9px] font-mono text-indigo-300">#meet-sync</span>
                      </div>
                      <span className="absolute bottom-2 right-2 z-5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold font-mono text-white backdrop-blur-xs border border-white/10">
                        {form.version || "v1.0.0"}
                      </span>
                    </div>
                  ) : (
                    <div className="relative h-28 w-full sm:w-44 shrink-0 overflow-hidden rounded-xl border border-zinc-200/80 bg-gradient-to-br from-zinc-50 via-zinc-100 to-indigo-50/40 p-3 shadow-inner">
                      <div className="flex items-center justify-between border-b border-zinc-200/60 pb-1.5">
                        <span className="text-[10px] font-bold text-zinc-700 truncate max-w-[100px]">
                          {form.title || "Initiative Title"}
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
                        {form.version || "v1.0.0"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1 w-full space-y-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Upload Custom Cover Image
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="file"
                        ref={thumbnailInputRef}
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleThumbnailUpload(file);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => thumbnailInputRef.current?.click()}
                        disabled={thumbnailUploading}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-2xs hover:bg-zinc-50 transition cursor-pointer disabled:opacity-50"
                      >
                        <Upload size={13} className="text-[#5051F9]" />
                        <span>{thumbnailUploading ? "Uploading..." : "Upload Image..."}</span>
                      </button>
                      <span className="text-[11px] text-zinc-500">Supports PNG, JPG, WebP</span>
                    </div>
                    {thumbnailError && (
                      <p className="mt-1 text-xs text-red-600 font-medium">{thumbnailError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Or Image URL
                    </label>
                    <input
                      type="url"
                      className={inputClass}
                      placeholder="https://example.com/cover-image.png"
                      value={form.thumbnail || ""}
                      onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

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

            {/* Zoom-Style Custom Meeting Date & Time Adjuster */}
            <div className="sm:col-span-2 rounded-2xl border border-indigo-100/90 bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/30 p-3.5 sm:p-4 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-indigo-100/70 pb-2.5 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5051F9] text-white shadow-2xs shrink-0">
                    <Video size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900">Meeting Schedule & Room Settings</h4>
                    <p className="text-[10px] sm:text-[11px] text-zinc-500">Manually adjust meeting date, start time, room name, and video URL</p>
                  </div>
                </div>
                <span className="rounded-md bg-indigo-100/80 text-indigo-800 px-2 py-0.5 text-[10px] font-mono font-bold">
                  {userTz}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* 1. Custom Date & Time Picker */}
                <Field label="Meeting Date & Start Time *">
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={toLocalDatetimeInputString(form.meetSyncTime)}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      const dateObj = new Date(val);
                      const formatted = formatDateTime(dateObj.toISOString());
                      setForm((f) => ({
                        ...f,
                        meetSyncTime: formatted,
                      }));
                    }}
                  />
                </Field>

                {/* 2. Custom Time of Meeting Label */}
                <Field label="Meeting Schedule Label / Time">
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Today, 3:00 PM or Oct 6, 2026, 4:00 PM"
                    value={form.meetSyncTime}
                    onChange={(e) => setForm((f) => ({ ...f, meetSyncTime: e.target.value }))}
                  />
                </Field>

                {/* 3. Meeting Room / Topic */}
                <Field label="Meeting Room / Channel Name">
                  <input
                    className={inputClass}
                    placeholder="e.g. Nexus Meet #room-general"
                    value={form.meetRoom}
                    onChange={(e) => setForm((f) => ({ ...f, meetRoom: e.target.value }))}
                  />
                </Field>

                {/* 4. Google Meet / Zoom URL */}
                <Field label="Video Meeting URL (Google Meet / Zoom)">
                  <input
                    className={inputClass}
                    placeholder="e.g. https://meet.google.com/new or Zoom link"
                    value={form.meetUrl}
                    onChange={(e) => setForm((f) => ({ ...f, meetUrl: e.target.value }))}
                  />
                </Field>
              </div>

              {/* Quick Date/Time Shortcuts */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-indigo-100/60 text-xs">
                <span className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 mr-1">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setHours(15, 0, 0, 0);
                    setForm((f) => ({ ...f, meetSyncTime: "Today, 3:00 PM" }));
                  }}
                  className="rounded-lg bg-white border border-zinc-200 px-2 py-1 text-[10px] sm:text-[11px] font-medium text-zinc-700 hover:border-primary hover:text-primary transition shadow-2xs cursor-pointer"
                >
                  Today, 3:00 PM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    d.setHours(16, 0, 0, 0);
                    setForm((f) => ({ ...f, meetSyncTime: "Tomorrow, 4:00 PM" }));
                  }}
                  className="rounded-lg bg-white border border-zinc-200 px-2 py-1 text-[10px] sm:text-[11px] font-medium text-zinc-700 hover:border-primary hover:text-primary transition shadow-2xs cursor-pointer"
                >
                  Tomorrow, 4:00 PM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setHours(d.getHours() + 1, 0, 0, 0);
                    setForm((f) => ({ ...f, meetSyncTime: formatDateTime(d.toISOString()) }));
                  }}
                  className="rounded-lg bg-white border border-zinc-200 px-2 py-1 text-[10px] sm:text-[11px] font-medium text-zinc-700 hover:border-primary hover:text-primary transition shadow-2xs cursor-pointer"
                >
                  +1 Hour
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
                    d.setHours(14, 0, 0, 0);
                    setForm((f) => ({ ...f, meetSyncTime: "Friday, 2:00 PM" }));
                  }}
                  className="rounded-lg bg-white border border-zinc-200 px-2 py-1 text-[10px] sm:text-[11px] font-medium text-zinc-700 hover:border-primary hover:text-primary transition shadow-2xs cursor-pointer"
                >
                  Friday, 2:00 PM
                </button>
              </div>
            </div>
          </div>

          {/* Description field with interactive @ mentions */}
          <div className="relative">
            <Field label="Description & Notes (Type @ to mention and add members)">
              <textarea
                ref={descriptionRef}
                className="min-h-[85px] w-full rounded-lg border border-zinc-200 p-2.5 text-xs sm:text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Describe project goals. Type @ to mention community members and auto-assign them to the team..."
                value={form.description}
                onChange={handleDescriptionChange}
              />
            </Field>

            {/* Floating @ Mention Autocomplete Popover */}
            {showMentionMenu && (
              <div className="absolute left-2 top-[72px] z-50 w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-100">
                <div className="bg-zinc-50 px-3 py-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-between border-b border-zinc-100">
                  <span>Mention & Add Member</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Esc to close</span>
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-zinc-50">
                  {/* @all Option in Mentions */}
                  {(!mentionQuery || "all".includes(mentionQuery.toLowerCase()) || "@all".includes(mentionQuery.toLowerCase())) && (
                    <button
                      type="button"
                      onClick={selectMentionAll}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-emerald-50/70 transition cursor-pointer bg-amber-50/20"
                    >
                      {allActiveUsersSelected ? (
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-emerald-500 text-white shadow-2xs">
                          <Check size={12} className="stroke-[3]" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 shrink-0 rounded border border-zinc-300 bg-white" />
                      )}
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs">
                        <Users size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-zinc-900 truncate">@all</p>
                        <p className="text-[11px] text-zinc-500 truncate">Add all team members ({activeMembers.length})</p>
                      </div>
                    </button>
                  )}

                  {mentionCandidates.length === 0 && !("all".includes(mentionQuery.toLowerCase())) ? (
                    <p className="px-3 py-4 text-center text-xs text-zinc-500">No members found</p>
                  ) : (
                    mentionCandidates.map((m) => {
                      const isAdded = form.memberIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => selectMentionMember(m)}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-indigo-50/70 transition cursor-pointer"
                        >
                          {/* Green checkbox on left if added */}
                          {isAdded ? (
                            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-emerald-500 text-white shadow-2xs">
                              <Check size={12} className="stroke-[3]" />
                            </div>
                          ) : (
                            <div className="h-4 w-4 shrink-0 rounded border border-zinc-300 bg-white" />
                          )}
                          <Avatar user={m} size={28} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-zinc-900 truncate">{m.name}</p>
                            <p className="text-[11px] text-primary truncate">@{m.username}</p>
                          </div>
                          <span className="text-[10px] text-zinc-400">
                            {isAdded ? "Added" : "Add"}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Team Members Assignment Section with Custom Search Dropdown */}
          <div ref={memberPickerRef} className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-700">
                Assigned Team Members ({form.memberIds.length})
              </label>
              {form.memberIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, memberIds: [] }))}
                  className="text-[11px] font-medium text-zinc-400 hover:text-red-500 transition cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50/50 p-2 min-h-[44px]">
              {form.memberIds.map((id) => {
                const mem = users.find((u) => u.id === id);
                if (!mem) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 shadow-xs border border-zinc-200"
                  >
                    <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check size={9} className="stroke-[3]" />
                    </div>
                    <Avatar user={mem} size={18} />
                    <span className="truncate max-w-[120px]">{mem.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleTeamMember(id)}
                      className="text-zinc-400 hover:text-red-500 cursor-pointer p-0.5 ml-0.5"
                      title="Remove member"
                    >
                      <X size={12} />
                    </button>
                  </span>
                );
              })}

              {/* Add Member Dropdown Trigger Button */}
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => {
                    setMemberPickerOpen((prev) => !prev);
                    setMemberFilterText("");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-zinc-200/80 hover:bg-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-700 transition cursor-pointer"
                >
                  <Plus size={13} className="text-zinc-500" />
                  <span>Add Member (@)</span>
                  <ChevronDown size={12} className={`text-zinc-500 transition-transform ${memberPickerOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Floating Member Picker Popover */}
                {memberPickerOpen && (
                  <div className="absolute left-0 bottom-full mb-2 sm:bottom-auto sm:top-full sm:mt-2 z-50 w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-100">
                    {/* Search Input Box */}
                    <div className="p-2 border-b border-zinc-100 bg-zinc-50/50">
                      <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          autoFocus
                          value={memberFilterText}
                          onChange={(e) => setMemberFilterText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const q = memberFilterText.trim().toLowerCase();
                              if (q === "@all" || q === "all") {
                                toggleAllTeamMembers();
                              } else if (availableFilteredUsers.length > 0) {
                                toggleTeamMember(availableFilteredUsers[0].id);
                              }
                            } else if (e.key === "Escape") {
                              setMemberPickerOpen(false);
                            }
                          }}
                          placeholder="Type name, @username, or @all..."
                          className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-7 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                        {memberFilterText && (
                          <button
                            type="button"
                            onClick={() => setMemberFilterText("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Member List with Green Checkbox on Left */}
                    <div className="max-h-60 overflow-y-auto divide-y divide-zinc-50 p-1">
                      {/* @all Option */}
                      {(!memberFilterText || "all".includes(memberFilterText.toLowerCase()) || "@all".includes(memberFilterText.toLowerCase())) && (
                        <button
                          type="button"
                          onClick={toggleAllTeamMembers}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-zinc-100 transition cursor-pointer bg-zinc-50/60"
                        >
                          {allActiveUsersSelected ? (
                            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-emerald-500 text-white shadow-2xs">
                              <Check size={12} className="stroke-[3]" />
                            </div>
                          ) : (
                            <div className="h-4 w-4 shrink-0 rounded border border-zinc-300 bg-white" />
                          )}
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs">
                            <Users size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-900">@all</span>
                              <span className="text-[10px] font-semibold text-primary">
                                {allActiveUsersSelected ? "Deselect All" : "Select All"}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 truncate">
                              All Community Members ({activeMembers.length})
                            </p>
                          </div>
                        </button>
                      )}

                      {availableFilteredUsers.length === 0 && !("all".includes(memberFilterText.toLowerCase())) ? (
                        <p className="px-3 py-6 text-center text-xs text-zinc-500">
                          No matching members found
                        </p>
                      ) : (
                        availableFilteredUsers.map((u) => {
                          const isChecked = form.memberIds.includes(u.id);
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => toggleTeamMember(u.id)}
                              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition cursor-pointer ${
                                isChecked ? "bg-emerald-50/50 hover:bg-emerald-50" : "hover:bg-zinc-100"
                              }`}
                            >
                              {/* Green Checkbox on the left */}
                              {isChecked ? (
                                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-emerald-500 text-white shadow-2xs">
                                  <Check size={12} className="stroke-[3]" />
                                </div>
                              ) : (
                                <div className="h-4 w-4 shrink-0 rounded border border-zinc-300 bg-white" />
                              )}
                              <Avatar user={u} size={28} />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-zinc-900 truncate">{u.name}</p>
                                <p className="text-[11px] text-zinc-400 truncate">@{u.username}</p>
                              </div>
                              {isChecked && (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                                  Added
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setProjectModalOpen(false)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
            >
              <ArrowLeft size={14} /> Back / Cancel
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              {editingProjectId && (
                <button
                  type="button"
                  onClick={() => {
                    setProjectModalOpen(false);
                    onDeleteProject(editingProjectId);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
                >
                  <Trash2 size={13} /> Delete Project
                </button>
              )}
              <PrimaryButton disabled={busy} onClick={onSaveProject} className="cursor-pointer text-xs">
                {busy ? "Saving..." : editingProjectId ? "Save Changes" : "Create Project"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
