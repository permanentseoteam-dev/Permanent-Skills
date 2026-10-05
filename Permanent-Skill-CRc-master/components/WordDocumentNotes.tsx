"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bold,
  Check,
  Clock,
  Copy,
  Download,
  FileText,
  Heading,
  Italic,
  List,
  ListOrdered,
  Plus,
  Save,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Underline,
  Strikethrough,
  Code,
  Quote,
  Eye,
  SlidersHorizontal,
} from "lucide-react";

export interface LessonNote {
  id: string;
  title: string;
  body: string;
  tag: string;
  createdAt: string;
  updatedAt: string;
}

interface WordDocumentNotesProps {
  lessonId: string;
  lessonTitle: string;
}

export const AVAILABLE_TAGS = [
  { name: "Architecture", bg: "bg-blue-50 text-blue-600 border-blue-200/80 hover:bg-blue-100/70", dot: "bg-blue-500" },
  { name: "Sprint Review", bg: "bg-emerald-50 text-emerald-600 border-emerald-200/80 hover:bg-emerald-100/70", dot: "bg-emerald-500" },
  { name: "Design System", bg: "bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100/70", dot: "bg-amber-500" },
  { name: "Action Items", bg: "bg-purple-50 text-purple-600 border-purple-200/80 hover:bg-purple-100/70", dot: "bg-purple-500" },
  { name: "Research", bg: "bg-rose-50 text-rose-600 border-rose-200/80 hover:bg-rose-100/70", dot: "bg-rose-500" },
  { name: "General", bg: "bg-zinc-100 text-zinc-700 border-zinc-200/80 hover:bg-zinc-200/70", dot: "bg-zinc-400" },
];

function getTagStyle(tagName: string) {
  const found = AVAILABLE_TAGS.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
  if (found) return found;
  return {
    name: tagName,
    bg: "bg-indigo-50 text-indigo-600 border-indigo-200/80 hover:bg-indigo-100/70",
    dot: "bg-indigo-500",
  };
}

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

function getInitialDemoNotes(lessonTitle: string): LessonNote[] {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: "note-1",
      title: "Micro-frontend state synchronization",
      tag: "Architecture",
      body: "Investigating shared event buses across isolated React DOM trees to prevent multi-tab race conditions during high frequency..",
      createdAt: twoHoursAgo,
      updatedAt: twoHoursAgo,
    },
    {
      id: "note-2",
      title: "Q3 Milestone Retrospective & Velocity",
      tag: "Sprint Review",
      body: "Team velocity increased by 14% following the migration to Tailwind CSS tokens and standardized component slots. Bottlenecks..",
      createdAt: yesterday,
      updatedAt: yesterday,
    },
    {
      id: "note-3",
      title: "Color token harmonization audit",
      tag: "Design System",
      body: "Reviewing contrast ratios across surface variants to ensure WCAG AAA compliance on data-dense dashboards and modal..",
      createdAt: threeDaysAgo,
      updatedAt: threeDaysAgo,
    },
  ];
}

export function WordDocumentNotes({ lessonId, lessonTitle }: WordDocumentNotesProps) {
  const storageKey = `pss_lesson_notes_v2_${lessonId}`;
  const oldStorageKey = `pss_word_notes_${lessonId}`;
  const autoSaveSettingKey = "pss_notes_autosave_enabled";

  const [notesList, setNotesList] = useState<LessonNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Auto-save toggle state
  const [autoSave, setAutoSave] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [copied, setCopied] = useState(false);
  const [exported, setExported] = useState(false);

  // Active Note Editing Buffers
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editTag, setEditTag] = useState("Architecture");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load notes and auto-save setting
  useEffect(() => {
    try {
      // Auto-save preference
      const savedAutoSave = localStorage.getItem(autoSaveSettingKey);
      if (savedAutoSave !== null) {
        setAutoSave(savedAutoSave === "true");
      }

      // Notes list
      const savedRaw = localStorage.getItem(storageKey);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotesList(parsed);
          return;
        }
      }

      // Fallback migration from single old note if exists
      const oldNote = localStorage.getItem(oldStorageKey);
      if (oldNote && oldNote.trim()) {
        const migrated: LessonNote[] = [
          {
            id: `note-${Date.now()}`,
            title: `${lessonTitle} Notes`,
            body: oldNote,
            tag: "General",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        setNotesList(migrated);
        localStorage.setItem(storageKey, JSON.stringify(migrated));
        return;
      }

      // Initial realistic demo notes matching reference
      const initial = getInitialDemoNotes(lessonTitle);
      setNotesList(initial);
      localStorage.setItem(storageKey, JSON.stringify(initial));
    } catch {
      setNotesList(getInitialDemoNotes(lessonTitle));
    }
  }, [lessonId, lessonTitle, storageKey, oldStorageKey]);

  // When activeNoteId changes, populate editing buffers
  useEffect(() => {
    if (activeNoteId) {
      const active = notesList.find((n) => n.id === activeNoteId);
      if (active) {
        setEditTitle(active.title);
        setEditBody(active.body);
        setEditTag(active.tag || "General");
        setSaveStatus("saved");
      }
    }
  }, [activeNoteId]);

  // Save notesList to localStorage helper
  function persistNotes(updated: LessonNote[]) {
    setNotesList(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  // Toggle Auto-save setting
  function handleToggleAutoSave() {
    const nextVal = !autoSave;
    setAutoSave(nextVal);
    try {
      localStorage.setItem(autoSaveSettingKey, String(nextVal));
    } catch {
      // ignore
    }
    if (nextVal && activeNoteId && saveStatus === "unsaved") {
      performSave(editTitle, editBody, editTag);
    }
  }

  // Perform Save logic
  function performSave(title: string, body: string, tag: string) {
    if (!activeNoteId) return;
    setSaveStatus("saving");

    const updated = notesList.map((n) => {
      if (n.id === activeNoteId) {
        return {
          ...n,
          title: title.trim() || "Untitled Note",
          body,
          tag,
          updatedAt: new Date().toISOString(),
        };
      }
      return n;
    });

    persistNotes(updated);
    setTimeout(() => {
      setSaveStatus("saved");
    }, 300);
  }

  // Auto-save debounce trigger on content edits
  function triggerAutoSave(newTitle: string, newBody: string, newTag: string) {
    if (autoSave) {
      setSaveStatus("saving");
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        performSave(newTitle, newBody, newTag);
      }, 500);
    } else {
      setSaveStatus("unsaved");
    }
  }

  // Create new note
  function handleCreateNewNote() {
    const newNote: LessonNote = {
      id: `note-${Date.now()}`,
      title: "Untitled Note",
      body: "",
      tag: "Architecture",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newNote, ...notesList];
    persistNotes(updated);
    setActiveNoteId(newNote.id);
    setEditTitle(newNote.title);
    setEditBody(newNote.body);
    setEditTag(newNote.tag);
    setSaveStatus("saved");
  }

  // Delete note
  function handleDeleteNote(noteId: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (confirm("Are you sure you want to delete this note?")) {
      const updated = notesList.filter((n) => n.id !== noteId);
      persistNotes(updated);
      if (activeNoteId === noteId) {
        setActiveNoteId(null);
      }
    }
  }

  // Copy Note to Clipboard
  function handleCopyCurrentNote() {
    const fullText = `${editTitle}\n[Tag: ${editTag}]\n\n${editBody}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Quick Copy from Card
  function handleQuickCopyCard(note: LessonNote, e: React.MouseEvent) {
    e.stopPropagation();
    const fullText = `${note.title}\n[Tag: ${note.tag}]\n\n${note.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Export Note as file (.txt / .doc)
  function handleExportNote(noteToExport?: LessonNote) {
    const title = noteToExport ? noteToExport.title : editTitle;
    const tag = noteToExport ? noteToExport.tag : editTag;
    const body = noteToExport ? noteToExport.body : editBody;

    const fileContent = `=====================================================
${title.toUpperCase()}
Lesson: ${lessonTitle}
Category / Tag: ${tag}
Last Updated: ${new Date().toLocaleString()}
=====================================================

${body}
`;

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(title || "Lesson_Note").replace(/[^a-z0-9]/gi, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }

  // Quick Formatting Helpers for Textarea
  function insertFormatting(prefix: string, suffix: string = "") {
    if (!textareaRef.current) return;
    const ta = textareaRef.current;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = editBody.substring(start, end);
    const newText =
      editBody.substring(0, start) +
      prefix +
      (selected || "text") +
      suffix +
      editBody.substring(end);
    setEditBody(newText);
    triggerAutoSave(editTitle, newText, editTag);

    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 50);
  }

  // Filter notes for grid
  const filteredNotes = notesList.filter((note) => {
    const matchesTag =
      selectedTagFilter === "All" ||
      note.tag.toLowerCase() === selectedTagFilter.toLowerCase();
    const matchesQuery =
      searchQuery.trim() === "" ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesQuery;
  });

  const activeNote = notesList.find((n) => n.id === activeNoteId);

  // -------------------------------------------------------------
  // VIEW 1: NOTE EDITOR (When a note is open)
  // -------------------------------------------------------------
  if (activeNoteId && activeNote) {
    const currentTagStyle = getTagStyle(editTag);
    const wordCount = editBody.trim() ? editBody.trim().split(/\s+/).length : 0;
    const charCount = editBody.length;

    return (
      <div className="space-y-4">
        {/* Top Clean Action Bar (No Word Ribbon / Ruler) */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs">
          {/* Left: Back button & Tag Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (autoSave || saveStatus === "unsaved") {
                  performSave(editTitle, editBody, editTag);
                }
                setActiveNoteId(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Notes</span>
            </button>

            {/* Tag Selector Pill */}
            <div className="relative inline-flex items-center">
              <select
                value={editTag}
                onChange={(e) => {
                  const newTag = e.target.value;
                  setEditTag(newTag);
                  triggerAutoSave(editTitle, editBody, newTag);
                }}
                className={`cursor-pointer appearance-none rounded-lg border px-2.5 py-1 text-xs font-semibold pr-7 outline-none transition ${currentTagStyle.bg}`}
              >
                {AVAILABLE_TAGS.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
              <Tag size={12} className="pointer-events-none absolute right-2 opacity-60" />
            </div>

            {/* Auto-save Status indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-500 pl-1">
              {saveStatus === "saving" && (
                <span className="flex items-center gap-1 text-amber-600 font-medium">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                  Saving...
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <Check size={12} className="text-emerald-600" />
                  {autoSave ? "Auto-saved" : "Saved"}
                </span>
              )}
              {saveStatus === "unsaved" && (
                <span className="flex items-center gap-1 text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-zinc-300" />
                  Unsaved changes
                </span>
              )}
            </div>
          </div>

          {/* Right Action Buttons: Auto-save Toggle, Save, Export, Copy, Delete */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Auto-save Switch */}
            <button
              type="button"
              onClick={handleToggleAutoSave}
              className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer shadow-2xs ${
                autoSave
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
              }`}
              title="Toggle Auto-save mode"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  autoSave ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                }`}
              />
              <span>Auto-save: {autoSave ? "ON" : "OFF"}</span>
            </button>

            {/* Save Button */}
            <button
              type="button"
              onClick={() => performSave(editTitle, editBody, editTag)}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-800 transition cursor-pointer shadow-2xs"
              title="Save Note Now"
            >
              {saveStatus === "saved" ? (
                <Check size={13} className="text-emerald-600" />
              ) : (
                <Save size={13} className="text-zinc-600" />
              )}
              <span>{saveStatus === "saved" ? "Saved" : "Save"}</span>
            </button>

            {/* Export Button */}
            <button
              type="button"
              onClick={() => handleExportNote()}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition cursor-pointer shadow-2xs"
              title="Download / Export Note as Text file"
            >
              {exported ? (
                <Check size={13} className="text-emerald-600" />
              ) : (
                <Download size={13} />
              )}
              <span>{exported ? "Exported" : "Export"}</span>
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyCurrentNote}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition cursor-pointer shadow-2xs"
              title="Copy note text to clipboard"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => handleDeleteNote(activeNoteId)}
              className="flex items-center gap-1 rounded-xl border border-rose-200/80 bg-rose-50/50 hover:bg-rose-100/80 p-1.5 text-xs font-semibold text-rose-600 transition cursor-pointer shadow-2xs"
              title="Delete this note"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Editor Main Canvas */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm">
          {/* Note Title Input */}
          <div className="border-b border-zinc-100 px-4 sm:px-6 pt-4 sm:pt-5 pb-3">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => {
                const nextTitle = e.target.value;
                setEditTitle(nextTitle);
                triggerAutoSave(nextTitle, editBody, editTag);
              }}
              placeholder="Note Title..."
              className="w-full text-base sm:text-lg md:text-xl font-bold text-zinc-900 placeholder:text-zinc-300 outline-none bg-transparent"
            />
          </div>

          {/* Clean Markdown/Formatting Toolbar */}
          <div className="flex flex-wrap items-center gap-1 bg-zinc-50/70 px-3 sm:px-4 py-2 border-b border-zinc-100 text-zinc-600 text-xs">
            <button
              type="button"
              onClick={() => insertFormatting("**", "**")}
              className="rounded-lg p-1.5 hover:bg-zinc-200/70 hover:text-zinc-900 transition cursor-pointer"
              title="Bold (**text**)"
            >
              <Bold size={14} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("*", "*")}
              className="rounded-lg p-1.5 hover:bg-zinc-200/70 hover:text-zinc-900 transition cursor-pointer"
              title="Italic (*text*)"
            >
              <Italic size={14} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("__", "__")}
              className="rounded-lg p-1.5 hover:bg-zinc-200/70 hover:text-zinc-900 transition cursor-pointer"
              title="Underline"
            >
              <Underline size={14} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("~~", "~~")}
              className="rounded-lg p-1.5 hover:bg-zinc-200/70 hover:text-zinc-900 transition cursor-pointer"
              title="Strikethrough"
            >
              <Strikethrough size={14} />
            </button>

            <span className="mx-1 h-3.5 w-px bg-zinc-200" />

            <button
              type="button"
              onClick={() => insertFormatting("### ")}
              className="rounded-lg p-1.5 hover:bg-zinc-200/70 hover:text-zinc-900 transition cursor-pointer"
              title="Heading (### )"
            >
              <Heading size={14} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("- ")}
              className="rounded-lg p-1.5 hover:bg-zinc-200/70 hover:text-zinc-900 transition cursor-pointer"
              title="Bullet List (- item)"
            >
              <List size={14} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("1. ")}
              className="rounded-lg p-1.5 hover:bg-zinc-200/70 hover:text-zinc-900 transition cursor-pointer"
              title="Numbered List (1. item)"
            >
              <ListOrdered size={14} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("`", "`")}
              className="rounded-lg p-1.5 hover:bg-zinc-200/70 hover:text-zinc-900 transition cursor-pointer"
              title="Inline Code (`code`)"
            >
              <Code size={14} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("> ")}
              className="rounded-lg p-1.5 hover:bg-zinc-200/70 hover:text-zinc-900 transition cursor-pointer"
              title="Quote (> quote)"
            >
              <Quote size={14} />
            </button>

            <div className="ml-auto text-[10px] sm:text-[11px] text-zinc-400 font-medium">
              Markdown Supported
            </div>
          </div>

          {/* Note Body Textarea */}
          <div className="p-4 sm:p-6">
            <textarea
              ref={textareaRef}
              value={editBody}
              onChange={(e) => {
                const nextBody = e.target.value;
                setEditBody(nextBody);
                triggerAutoSave(editTitle, nextBody, editTag);
              }}
              placeholder="Start typing your notes, key takeaways, code snippets, or sprint points here... (Auto-saves continuously)"
              className="w-full min-h-[260px] sm:min-h-[340px] md:min-h-[380px] resize-none bg-transparent outline-none text-zinc-800 placeholder:text-zinc-400 text-xs sm:text-sm leading-relaxed"
            />
          </div>

          {/* Bottom Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-50/80 px-4 sm:px-6 py-2.5 text-[10px] sm:text-[11px] text-zinc-500 border-t border-zinc-100">
            <div className="flex items-center gap-3 sm:gap-4">
              <span>{wordCount} words</span>
              <span>{charCount} characters</span>
              <span className="hidden sm:inline">
                Last updated: {formatRelativeTime(activeNote.updatedAt)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 font-medium text-zinc-600 truncate max-w-[180px] sm:max-w-none">
                <FileText size={12} /> {lessonTitle}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: MULTI-NOTE CARD GRID VIEW (Matching Reference Image 2)
  // -------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Top Header & Toolbar: Filter pills, Search, + New Note */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-xs">
        {/* Left: Title + Tag filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <h3 className="text-sm font-bold text-zinc-900">Lesson Notes</h3>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
              {notesList.length}
            </span>
          </div>

          {/* Tag filter selector chips */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-0.5">
            {["All", ...AVAILABLE_TAGS.map((t) => t.name)].map((tag) => {
              const isSelected = selectedTagFilter === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTagFilter(tag)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? "bg-zinc-900 text-white shadow-2xs"
                      : "bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Search box & "+ New Note" button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 pl-8 pr-3 py-1.5 text-xs text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-primary focus:bg-white transition"
            />
          </div>

          <button
            type="button"
            onClick={handleCreateNewNote}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary-dark px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer shrink-0"
          >
            <Plus size={14} />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Grid of Note Cards matching Image 2 */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const tagStyle = getTagStyle(note.tag);
            return (
              <div
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-2xs hover:border-zinc-300 hover:shadow-md transition-all duration-200 cursor-pointer min-h-[160px]"
              >
                <div>
                  {/* Top Row: Tag Pill (Left) & Relative Timestamp (Right) */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-tight transition ${tagStyle.bg}`}
                    >
                      {note.tag}
                    </span>
                    <span className="text-[11px] font-medium text-zinc-400 shrink-0">
                      {formatRelativeTime(note.updatedAt)}
                    </span>
                  </div>

                  {/* Card Title (Bold, crisp) */}
                  <h4 className="mt-3.5 mb-1.5 text-[15px] font-bold text-zinc-900 group-hover:text-primary transition-colors line-clamp-1">
                    {note.title || "Untitled Note"}
                  </h4>

                  {/* Card Body Snippet (2-3 lines clean preview) */}
                  <p className="text-xs sm:text-[12.5px] leading-relaxed text-zinc-500 line-clamp-3">
                    {note.body || "Empty note. Click to start writing..."}
                  </p>
                </div>

                {/* Subtle Hover Action Footer (Copy, Export, Delete) */}
                <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-2.5 text-zinc-400 opacity-80 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-medium text-zinc-400">
                    {note.body.trim() ? `${note.body.trim().split(/\s+/).length} words` : "Empty"}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleQuickCopyCard(note, e)}
                      className="rounded-lg p-1 hover:bg-zinc-100 hover:text-zinc-800 transition cursor-pointer"
                      title="Copy note content"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportNote(note);
                      }}
                      className="rounded-lg p-1 hover:bg-zinc-100 hover:text-zinc-800 transition cursor-pointer"
                      title="Export note"
                    >
                      <Download size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="rounded-lg p-1 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                      title="Delete note"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* "+ Add Note" Dashed Card */}
          <button
            type="button"
            onClick={handleCreateNewNote}
            className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-zinc-400 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-200 cursor-pointer group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-xs group-hover:scale-110 transition-transform">
              <Plus size={20} className="text-zinc-500 group-hover:text-primary" />
            </div>
            <span className="mt-2 text-xs font-bold text-zinc-600 group-hover:text-primary">
              Create New Note
            </span>
            <span className="text-[11px] text-zinc-400 mt-0.5">
              Add takeaways or action items
            </span>
          </button>
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 mb-3">
            <FileText size={24} />
          </div>
          <h4 className="text-base font-bold text-zinc-900">No notes found</h4>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery
              ? `No notes matched "${searchQuery}". Try searching for another keyword.`
              : "You don't have any notes with the selected filter yet."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Clear Search
              </button>
            )}
            <button
              type="button"
              onClick={handleCreateNewNote}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-dark"
            >
              <Plus size={14} /> Create Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
