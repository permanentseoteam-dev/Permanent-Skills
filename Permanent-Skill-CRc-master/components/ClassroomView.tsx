"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  Crown,
  FileText,
  Film,
  Flame,
  GraduationCap,
  GripVertical,
  Layers,
  Lock,
  MessageSquare,
  Move,
  Pencil,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  Upload,
  Video,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { UpgradeModal } from "@/components/UpgradeModal";
import { LockedCourseModal } from "@/components/LockedCourseModal";
import { WordDocumentNotes } from "@/components/WordDocumentNotes";
import { LessonComments } from "@/components/LessonComments";
import { Card, Field, Modal, PrimaryButton, StaffRoleFavicon, inputClass } from "@/components/ui";
import { getLevel } from "@/lib/levels";
import { formatMoney } from "@/lib/format";
import { getVideoThumbnail, renderNotes, toEmbed } from "@/lib/video";
import { isCourseAccessible } from "@/lib/course-security";
import type { Course, Lesson } from "@/lib/types";

interface ClassroomViewProps {
  initialCourseSlug?: string;
}

const emptyLessonForm = {
  module: "",
  title: "",
  videoTitle: "",
  videoUrl: "",
  duration: "",
  notes: "",
};

export function ClassroomView({ initialCourseSlug }: ClassroomViewProps) {
  const router = useRouter();
  const { courses, progress, user, completeLesson, saveCourse, saveLesson, deleteLesson, reorderCourses } = useApp();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [lockedModalCourse, setLockedModalCourse] = useState<Course | null>(null);
  const [playing, setPlaying] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<"overview" | "word-notes" | "comments">("overview");

  const isAdmin = user?.role === "admin" || user?.role === "manager";

  // Full Page / Course & Lesson Editor State
  const [showFullEditor, setShowFullEditor] = useState(false);
  const [editorTab, setEditorTab] = useState<"course" | "lessons" | "add-lesson">("course");
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorMessage, setEditorMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Course Edit Form State
  const [courseForm, setCourseForm] = useState<{
    id: string;
    title: string;
    description: string;
    unlockLevel: number;
    badge: string;
    price: number | string;
    isPremiumOnly: boolean;
    thumbnail: string;
    watermark: string;
    glowColor: "yellow" | "green" | "blue" | "orange" | "red" | "purple";
  }>({
    id: "",
    title: "",
    description: "",
    unlockLevel: 1,
    badge: "",
    price: 0,
    isPremiumOnly: false,
    thumbnail: "",
    watermark: "",
    glowColor: "yellow",
  });
  const [coverUploading, setCoverUploading] = useState(false);

  // Lesson Edit Form State
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);
  const [videoUploading, setVideoUploading] = useState(false);

  // Cover image modal state (legacy / quick cover edit)
  const [editingCoverCourse, setEditingCoverCourse] = useState<Course | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverWatermark, setCoverWatermark] = useState("");
  const [coverGlow, setCoverGlow] = useState<"yellow" | "green" | "blue" | "orange" | "red" | "purple">("yellow");
  const [coverSaving, setCoverSaving] = useState(false);

  // Add Course Modal State
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [addCourseForm, setAddCourseForm] = useState<{
    title: string;
    description: string;
    unlockLevel: number | string;
    badge: string;
    price: number | string;
    isPremiumOnly: boolean;
    thumbnail: string;
    watermark: string;
    glowColor: "yellow" | "green" | "blue" | "orange" | "red" | "purple";
    initialModule: string;
    initialLessonTitle: string;
    initialVideoUrl: string;
  }>({
    title: "",
    description: "",
    unlockLevel: 1,
    badge: "",
    price: 0,
    isPremiumOnly: false,
    thumbnail: "",
    watermark: "",
    glowColor: "yellow",
    initialModule: "Module 1: Getting Started",
    initialLessonTitle: "",
    initialVideoUrl: "",
  });
  const [addCourseUploading, setAddCourseUploading] = useState(false);
  const [addCourseSaving, setAddCourseSaving] = useState(false);
  const [addCourseMessage, setAddCourseMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Available courses
  const availableCourses = courses.length > 0 ? courses : [];

  // Hold-to-Drag & Reordering State for Course Cards
  const [isDragMode, setIsDragMode] = useState(false);
  const [draggedCourseId, setDraggedCourseId] = useState<string | null>(null);
  const [holdingCardId, setHoldingCardId] = useState<string | null>(null);
  const [localCourseOrder, setLocalCourseOrder] = useState<Course[]>(availableCourses);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pointerStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isHoldingRef = useRef(false);

  // Keep localCourseOrder in sync when availableCourses changes and not currently dragging
  useEffect(() => {
    if (!draggedCourseId) {
      setLocalCourseOrder(availableCourses);
    }
  }, [availableCourses, draggedCourseId]);

  function openAddCourseModal() {
    if (!isAdmin) return;
    setAddCourseForm({
      title: "",
      description: "",
      unlockLevel: 1,
      badge: "",
      price: 0,
      isPremiumOnly: false,
      thumbnail: "",
      watermark: "",
      glowColor: "yellow",
      initialModule: "Module 1: Getting Started",
      initialLessonTitle: "",
      initialVideoUrl: "",
    });
    setAddCourseMessage(null);
    setShowAddCourseModal(true);
  }

  async function handleUploadAddCourseImage(file: File) {
    setAddCourseUploading(true);
    const data = new FormData();
    data.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      setAddCourseUploading(false);
      if (json.ok && json.url) {
        setAddCourseForm((f) => ({ ...f, thumbnail: json.url }));
        setAddCourseMessage({ type: "success", text: "✓ Background image uploaded!" });
      } else {
        setAddCourseMessage({ type: "error", text: json.error || "Image upload failed." });
      }
    } catch {
      setAddCourseUploading(false);
      setAddCourseMessage({ type: "error", text: "Image upload failed. Check connection." });
    }
  }

  async function handleCreateCourse() {
    if (!isAdmin) return;
    if (!addCourseForm.title.trim()) {
      setAddCourseMessage({ type: "error", text: "Course title is required." });
      return;
    }
    setAddCourseSaving(true);
    setAddCourseMessage(null);

    const res = await saveCourse({
      title: addCourseForm.title.trim(),
      description: addCourseForm.description.trim(),
      unlockLevel: addCourseForm.unlockLevel !== "" ? Number(addCourseForm.unlockLevel) : 1,
      badge: addCourseForm.badge.trim().toUpperCase() || undefined,
      price: addCourseForm.price !== "" ? Number(addCourseForm.price) : 0,
      isPremiumOnly: addCourseForm.isPremiumOnly,
      thumbnail: addCourseForm.thumbnail.trim() || undefined,
      watermark: addCourseForm.watermark.trim() || undefined,
      glowColor: addCourseForm.glowColor,
    });

    if (res.ok && res.id) {
      if (addCourseForm.initialLessonTitle.trim()) {
        await saveLesson({
          courseId: res.id,
          module: addCourseForm.initialModule.trim() || "Module 1: Getting Started",
          title: addCourseForm.initialLessonTitle.trim(),
          videoTitle: addCourseForm.initialLessonTitle.trim(),
          videoUrl: addCourseForm.initialVideoUrl.trim(),
          duration: "10m",
          notes: "Welcome to the first lesson!",
        });
      }
      setAddCourseSaving(false);
      setShowAddCourseModal(false);
    } else {
      setAddCourseSaving(false);
      setAddCourseMessage({ type: "error", text: res.error || "Failed to create course." });
    }
  }

  function startCardHold(e: React.PointerEvent, courseId: string) {
    if (!isAdmin) return;
    if ((e.target as HTMLElement).closest("button, a, input, textarea")) {
      return;
    }
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    isHoldingRef.current = true;
    setHoldingCardId(courseId);

    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      if (isHoldingRef.current) {
        setIsDragMode(true);
        setDraggedCourseId(courseId);
        setHoldingCardId(null);
        isHoldingRef.current = false;
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try {
            navigator.vibrate(50);
          } catch {}
        }
      }
    }, 450);
  }

  function moveCardHold(e: React.PointerEvent) {
    if (!isAdmin) return;
    if (isHoldingRef.current && pointerStartPosRef.current) {
      const dist = Math.hypot(
        e.clientX - pointerStartPosRef.current.x,
        e.clientY - pointerStartPosRef.current.y
      );
      if (dist > 8) {
        isHoldingRef.current = false;
        setHoldingCardId(null);
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      }
    }
  }

  function endCardHold(course: Course) {
    if (!isAdmin) {
      handleSelectCourse(course);
      return;
    }
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      setHoldingCardId(null);
      if (!isDragMode) {
        handleSelectCourse(course);
      }
    } else if (draggedCourseId) {
      setDraggedCourseId(null);
      void reorderCourses(localCourseOrder.map((c) => c.id));
    }
  }

  function handleCardDragOver(targetCourseId: string) {
    if (!isAdmin || !draggedCourseId || draggedCourseId === targetCourseId) return;
    setLocalCourseOrder((prev) => {
      const fromIndex = prev.findIndex((c) => c.id === draggedCourseId);
      const toIndex = prev.findIndex((c) => c.id === targetCourseId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  }

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(() => {
    if (initialCourseSlug && availableCourses.length > 0) {
      const found = availableCourses.find((c) => c.slug === initialCourseSlug || c.id === initialCourseSlug);
      if (found) return found.id;
    }
    return null;
  });

  // Sync selected course when initialCourseSlug changes from navigation / browser back
  useEffect(() => {
    if (initialCourseSlug && availableCourses.length > 0) {
      const found = availableCourses.find((c) => c.slug === initialCourseSlug || c.id === initialCourseSlug);
      if (found) {
        setSelectedCourseId(found.id);
      }
    }
  }, [initialCourseSlug, availableCourses]);

  // Active Course resolver: never loses track of the course when state refreshes
  const activeCourse = useMemo(() => {
    if (initialCourseSlug && availableCourses.length > 0) {
      const foundBySlug = availableCourses.find((c) => c.slug === initialCourseSlug || c.id === initialCourseSlug);
      if (foundBySlug) return foundBySlug;
    }
    if (selectedCourseId && availableCourses.length > 0) {
      return availableCourses.find((c) => c.id === selectedCourseId || c.slug === selectedCourseId) || null;
    }
    return null;
  }, [availableCourses, selectedCourseId, initialCourseSlug]);

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const locked = useMemo(() => {
    if (!activeCourse) return false;
    return !isCourseAccessible(activeCourse, user);
  }, [activeCourse, user]);

  // Group lessons by module
  const modules = useMemo(() => {
    if (!activeCourse) return [];
    const order: string[] = [];
    const map = new Map<string, Lesson[]>();
    for (const lesson of activeCourse.lessons) {
      const name = lesson.module || "Module 1: Introduction";
      if (!map.has(name)) {
        map.set(name, []);
        order.push(name);
      }
      map.get(name)!.push(lesson);
    }
    return order.map((name) => ({ name, lessons: map.get(name)! }));
  }, [activeCourse]);

  // Active lesson
  const activeLesson: Lesson | null = useMemo(() => {
    if (!activeCourse || activeCourse.lessons.length === 0) return null;
    if (activeLessonId) {
      const found = activeCourse.lessons.find((l) => l.id === activeLessonId);
      if (found) return found;
    }
    return activeCourse.lessons[0] || null;
  }, [activeCourse, activeLessonId]);

  // Auto-clear message timer
  useEffect(() => {
    if (!editorMessage) return;
    const timer = setTimeout(() => setEditorMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [editorMessage]);

  function isCourseUnlocked(c: Course) {
    return isCourseAccessible(c, user);
  }

  function handleSelectCourse(course: Course) {
    if (!isCourseAccessible(course, user)) {
      setLockedModalCourse(course);
      return;
    }
    setSelectedCourseId(course.id);
    setActiveLessonId(null);
    setPlaying(false);
    router.push(`/classroom/${course.slug}`);
  }

  function handleBackToClassroom() {
    setSelectedCourseId(null);
    setActiveLessonId(null);
    setPlaying(false);
    router.push("/classroom");
  }

  // Progress calculations for active course
  const row = progress.find(
    (p) => p.courseId === activeCourse?.id && (!user?.id || !p.userId || p.userId === user?.id)
  );
  const completedIds = row?.completedLessonIds || [];
  const totalLessons = activeCourse?.lessons.length || 0;
  const completedCount = totalLessons
    ? activeCourse!.lessons.filter((l) => completedIds.includes(l.id)).length
    : 0;
  const pct = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;

  const isCurrentCompleted = activeLesson
    ? completedIds.includes(activeLesson.id)
    : false;

  const currentIndex = activeCourse && activeLesson
    ? activeCourse.lessons.findIndex((l) => l.id === activeLesson.id)
    : -1;

  const embed = activeLesson ? toEmbed(activeLesson.videoUrl) : null;

  function handleSelectLesson(id: string) {
    if (locked) return;
    setActiveLessonId(id);
    setPlaying(false);
  }

  // Robust toggle complete without navigation / jumping back
  function handleToggleComplete(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (locked || !activeCourse || !activeLesson) return;
    completeLesson(activeCourse.id, activeLesson.id);
  }

  function handleToggleLessonComplete(lessonId: string, e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (locked || !activeCourse) return;
    completeLesson(activeCourse.id, lessonId);
  }

  // --- EDITOR FUNCTIONS (Manager & Admin Only) ---
  function openFullCourseEditor(tab: "course" | "lessons" | "add-lesson" = "course") {
    if (!isAdmin || !activeCourse) return;
    setCourseForm({
      id: activeCourse.id,
      title: activeCourse.title,
      description: activeCourse.description || "",
      unlockLevel: activeCourse.unlockLevel || 1,
      badge: activeCourse.badge || "",
      price: activeCourse.price !== undefined ? activeCourse.price : 0,
      isPremiumOnly: Boolean(activeCourse.isPremiumOnly),
      thumbnail: activeCourse.thumbnail || "",
      watermark: activeCourse.watermark || "",
      glowColor: activeCourse.glowColor || "yellow",
    });
    setEditorTab(tab);
    setEditingLessonId(null);
    setLessonForm(emptyLessonForm);
    setEditorMessage(null);
    setShowFullEditor(true);
  }

  function openEditLessonInEditor(lesson: Lesson) {
    if (!isAdmin) return;
    setEditingLessonId(lesson.id);
    setLessonForm({
      module: lesson.module || "Module 1: Introduction",
      title: lesson.title,
      videoTitle: lesson.videoTitle || lesson.title,
      videoUrl: lesson.videoUrl || "",
      duration: lesson.duration || "",
      notes: lesson.notes || "",
    });
    setEditorTab("add-lesson");
    setEditorMessage(null);
    setShowFullEditor(true);
  }

  function openAddNewLessonInEditor() {
    if (!isAdmin) return;
    setEditingLessonId(null);
    const existingMod = modules[0]?.name || "Module 1: Introduction";
    setLessonForm({
      ...emptyLessonForm,
      module: existingMod,
    });
    setEditorTab("add-lesson");
    setEditorMessage(null);
    setShowFullEditor(true);
  }

  async function handleUploadCoverImage(file: File) {
    if (!isAdmin) return;
    setCoverUploading(true);
    const data = new FormData();
    data.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      setCoverUploading(false);
      if (json.ok && json.url) {
        setCourseForm((prev) => ({ ...prev, thumbnail: json.url }));
        setCoverImageUrl(json.url);
        setEditorMessage({ type: "success", text: "✓ Image uploaded successfully!" });
      } else {
        setEditorMessage({ type: "error", text: json.error || "Image upload failed." });
      }
    } catch {
      setCoverUploading(false);
      setEditorMessage({ type: "error", text: "Image upload failed." });
    }
  }

  async function handleUploadLessonVideo(file: File) {
    if (!isAdmin) return;
    setVideoUploading(true);
    setEditorMessage({ type: "success", text: "Uploading video file..." });
    const data = new FormData();
    data.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      setVideoUploading(false);
      if (json.ok && json.url) {
        setLessonForm((prev) => ({
          ...prev,
          videoUrl: json.url,
          videoTitle: prev.videoTitle || file.name.replace(/\.[^/.]+$/, ""),
        }));
        setEditorMessage({ type: "success", text: "✓ Video uploaded! Click Save Lesson to apply." });
      } else {
        setEditorMessage({ type: "error", text: json.error || "Video upload failed." });
      }
    } catch {
      setVideoUploading(false);
      setEditorMessage({ type: "error", text: "Video upload failed." });
    }
  }

  async function handleSaveCourseDetails() {
    if (!isAdmin) return;
    if (!activeCourse && !courseForm.id) return;
    if (!courseForm.title.trim()) {
      setEditorMessage({ type: "error", text: "Course title cannot be empty." });
      return;
    }
    setEditorSaving(true);
    const res = await saveCourse({
      id: courseForm.id || activeCourse?.id,
      title: courseForm.title,
      description: courseForm.description,
      unlockLevel: Number(courseForm.unlockLevel) || 1,
      badge: courseForm.badge,
      price: Number(courseForm.price) || 0,
      isPremiumOnly: courseForm.isPremiumOnly,
      thumbnail: courseForm.thumbnail.trim() || undefined,
      watermark: courseForm.watermark.trim() || undefined,
      glowColor: courseForm.glowColor,
    });
    setEditorSaving(false);
    if (res.ok) {
      setEditorMessage({ type: "success", text: "✓ Course details saved successfully!" });
    } else {
      setEditorMessage({ type: "error", text: res.error || "Failed to update course." });
    }
  }

  async function handleSaveLessonForm() {
    if (!isAdmin || !activeCourse) return;
    if (!lessonForm.title.trim()) {
      setEditorMessage({ type: "error", text: "Lesson title is required." });
      return;
    }
    setEditorSaving(true);
    const res = await saveLesson({
      courseId: activeCourse.id,
      lessonId: editingLessonId || undefined,
      module: lessonForm.module.trim() || "Module 1: Introduction",
      title: lessonForm.title.trim(),
      videoTitle: lessonForm.videoTitle.trim() || lessonForm.title.trim(),
      videoUrl: lessonForm.videoUrl.trim(),
      duration: lessonForm.duration.trim() || "",
      notes: lessonForm.notes.trim(),
    });
    setEditorSaving(false);
    if (res.ok) {
      setEditorMessage({
        type: "success",
        text: editingLessonId ? "✓ Lesson updated successfully!" : "✓ New lesson added to course!",
      });
      if (!editingLessonId && res.id) {
        setActiveLessonId(res.id);
      }
      setEditingLessonId(null);
      setLessonForm(emptyLessonForm);
      setEditorTab("lessons");
    } else {
      setEditorMessage({ type: "error", text: res.error || "Failed to save lesson." });
    }
  }

  async function handleDeleteLesson(lessonId: string, title: string) {
    if (!isAdmin || !activeCourse) return;
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    setEditorSaving(true);
    const res = await deleteLesson(activeCourse.id, lessonId);
    setEditorSaving(false);
    if (res.ok) {
      setEditorMessage({ type: "success", text: `✓ Lesson "${title}" deleted.` });
      if (activeLessonId === lessonId) {
        setActiveLessonId(null);
      }
    } else {
      setEditorMessage({ type: "error", text: res.error || "Failed to delete lesson." });
    }
  }

  function openEditCoverModal(c: Course) {
    if (!isAdmin) return;
    setEditingCoverCourse(c);
    setCoverImageUrl(c.thumbnail || "");
    setCoverWatermark(c.watermark || "");
    setCoverGlow(c.glowColor || "yellow");
  }

  async function handleSaveCover() {
    if (!isAdmin || !editingCoverCourse) return;
    setCoverSaving(true);
    const res = await saveCourse({
      id: editingCoverCourse.id,
      title: editingCoverCourse.title,
      description: editingCoverCourse.description,
      unlockLevel: editingCoverCourse.unlockLevel,
      badge: editingCoverCourse.badge,
      price: editingCoverCourse.price,
      isPremiumOnly: editingCoverCourse.isPremiumOnly,
      thumbnail: coverImageUrl.trim() || undefined,
      watermark: coverWatermark.trim() || undefined,
      glowColor: coverGlow,
    });
    setCoverSaving(false);
    if (res.ok) {
      setEditingCoverCourse(null);
    } else {
      alert(res.error || "Failed to update course cover.");
    }
  }

  // Helper to render course banner matching original design
  function renderCourseBanner(course: Course) {
    const isAccessible = isCourseAccessible(course, user);
    const isLevel1 = course.unlockLevel === 1 && !course.isPremiumOnly;
    const isPremiumOnly = Boolean(
      course.isPremiumOnly ||
      course.badge?.toUpperCase() === "VIP" ||
      course.badge?.toUpperCase() === "PREMIUM"
    );
    const glow = course.glowColor || "yellow";
    const watermark = course.watermark || `> ${course.slug}_`;

    // 1. Custom Background Image if configured by admin/manager
    if (course.thumbnail) {
      return (
        <div
          className="relative h-40 sm:h-44 md:h-48 w-full overflow-hidden p-4 flex flex-col items-center justify-center select-none bg-cover bg-center group/banner"
          style={{
            backgroundImage: `url(${course.thumbnail})`,
          }}
        >
          {/* Subtle contrast overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px]" />

          {/* Admin / Manager Quick Edit Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openEditCoverModal(course);
              }}
              className="absolute top-2.5 right-2.5 z-20 inline-flex items-center gap-1 rounded-lg bg-black/80 hover:bg-black px-2 py-1 text-[11px] font-bold text-white backdrop-blur-xs border border-white/20 shadow-md transition cursor-pointer"
              title="Edit Course Background Cover (Admin/Manager)"
            >
              <Pencil size={11} /> Edit Cover
            </button>
          )}

          {/* Terminal Watermark behind */}
          {watermark && (
            <div className="absolute inset-x-0 bottom-3 sm:bottom-4 text-center font-mono text-xl sm:text-2xl md:text-3xl font-black text-white/25 tracking-tight pointer-events-none select-none">
              {watermark}
            </div>
          )}

          {/* Center Badge */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/85 text-white shadow-xl border border-white/25">
              {isAccessible ? (
                <Unlock size={18} className="sm:w-5 sm:h-5 stroke-[2.5]" />
              ) : (
                <Lock size={18} className="sm:w-5 sm:h-5 stroke-[2.5]" />
              )}
            </div>
            {!isAccessible && (
              <span className="mt-1.5 sm:mt-2 text-xs sm:text-[13px] font-extrabold text-white drop-shadow-md">
                {isPremiumOnly ? "👑 Unlock with VIP" : `Unlock at Level ${course.unlockLevel}`}
              </span>
            )}
          </div>
        </div>
      );
    }

    if (isLevel1 || glow === "yellow") {
      return (
        <div
          className="relative h-40 sm:h-44 md:h-48 w-full overflow-hidden bg-[#786c12] p-4 flex flex-col items-center justify-center select-none group/banner"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(0,0,0,0.22) 1.5px, transparent 1.5px)",
            backgroundSize: "12px 12px",
          }}
        >
          {/* Admin / Manager Quick Edit Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openEditCoverModal(course);
              }}
              className="absolute top-2.5 right-2.5 z-20 inline-flex items-center gap-1 rounded-lg bg-black/80 hover:bg-black px-2 py-1 text-[11px] font-bold text-white backdrop-blur-xs border border-white/20 shadow-md transition cursor-pointer"
              title="Edit Course Background Cover (Admin/Manager)"
            >
              <Pencil size={11} /> Edit Cover
            </button>
          )}

          {/* Terminal Watermark behind */}
          <div className="absolute inset-x-0 bottom-3 sm:bottom-4 text-center font-mono text-xl sm:text-2xl md:text-3xl font-black text-black/35 tracking-tight pointer-events-none select-none">
            {watermark}
          </div>

          {/* Center Badge */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/90 text-white shadow-xl border border-white/20">
              {isAccessible ? (
                <Unlock size={18} className="sm:w-5 sm:h-5 stroke-[2.5]" />
              ) : (
                <Lock size={18} className="sm:w-5 sm:h-5 stroke-[2.5]" />
              )}
            </div>
            {!isAccessible && (
              <span className="mt-1.5 sm:mt-2 text-xs sm:text-[13px] font-extrabold text-white drop-shadow-md">
                Unlock at Level 1
              </span>
            )}
          </div>
        </div>
      );
    }

    // Glow Configurations
    let glowBg = "bg-emerald-500/25";
    let ringBorder = "border-emerald-400/90 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]";

    if (glow === "green") {
      glowBg = "bg-emerald-500/25";
      ringBorder = "border-emerald-400/90 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]";
    } else if (glow === "blue") {
      glowBg = "bg-sky-500/25";
      ringBorder = "border-sky-400/90 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.4)]";
    } else if (glow === "orange") {
      glowBg = "bg-orange-500/30";
      ringBorder = "border-orange-400/90 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.45)]";
    } else if (glow === "red") {
      glowBg = "bg-rose-500/25";
      ringBorder = "border-rose-400/90 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]";
    } else if (glow === "purple") {
      glowBg = "bg-purple-500/30";
      ringBorder = "border-purple-400/90 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.45)]";
    }

    return (
      <div className="relative h-40 sm:h-44 md:h-48 w-full overflow-hidden bg-black p-4 flex flex-col items-center justify-center select-none group/banner">
        {/* Admin / Manager Quick Edit Button */}
        {isAdmin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openEditCoverModal(course);
            }}
            className="absolute top-2.5 right-2.5 z-20 inline-flex items-center gap-1 rounded-lg bg-black/80 hover:bg-black px-2 py-1 text-[11px] font-bold text-white backdrop-blur-xs border border-white/20 shadow-md transition cursor-pointer"
            title="Edit Course Background Cover (Admin/Manager)"
          >
            <Pencil size={11} /> Edit Cover
          </button>
        )}

        {/* Radial Glow */}
        <div className={`absolute h-24 sm:h-28 w-24 sm:w-28 rounded-full ${glowBg} blur-2xl pointer-events-none`} />

        {/* Terminal Watermark behind */}
        <div className="absolute inset-x-0 bottom-3 sm:bottom-4 text-center font-mono text-xl sm:text-2xl md:text-3xl font-black text-white/10 tracking-tight pointer-events-none select-none">
          {watermark}
        </div>

        {/* Center Glowing Badge */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div
            className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-zinc-950/90 border-2 ${ringBorder} transition-transform group-hover:scale-105`}
          >
            {isAccessible ? (
              <Unlock size={18} className="sm:w-5 sm:h-5 stroke-[2.5]" />
            ) : glow === "orange" ? (
              <Flame size={18} className="sm:w-5 sm:h-5 stroke-[2.5]" />
            ) : (
              <Lock size={18} className="sm:w-5 sm:h-5 stroke-[2.5]" />
            )}
          </div>

          {!isAccessible && (
            <>
              <span className="mt-1.5 sm:mt-2 text-xs sm:text-[13px] font-extrabold text-white drop-shadow-md">
                {isPremiumOnly
                  ? "👑 Unlock with VIP"
                  : `Unlock at Level ${course.unlockLevel}`}
              </span>

              {!isPremiumOnly && (
                <span className="text-[10px] sm:text-[10.5px] text-zinc-400 font-medium">
                  or Upgrade to VIP
                </span>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. PRIMARY VIEW: Classroom Course / Module Cards Grid */}
      {!activeCourse ? (
        <div className="space-y-4">
          {/* Top Classroom Action Toolbar with Add Course Button */}
          <div className="flex items-center justify-between gap-3 pb-1 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap size={20} className="stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
                  <span>Classroom Courses</span>
                  <span className="rounded-full bg-zinc-100 border border-zinc-200/80 px-2 py-0.5 text-xs font-bold text-zinc-600">
                    {localCourseOrder.length}
                  </span>
                </h2>
                {isAdmin && (
                  <p className="text-[11px] sm:text-xs text-zinc-500 hidden sm:block">
                    {isDragMode
                      ? "Drag and drop cards to reorder — surrounding cards adjust automatically"
                      : "Hold any module card for 0.5s to enable drag & drop reordering"}
                  </p>
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                {isDragMode ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDragMode(false);
                      setDraggedCourseId(null);
                      void reorderCourses(localCourseOrder.map((c) => c.id));
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 sm:px-4 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer animate-pulse"
                  >
                    <Check size={14} className="stroke-[2.5]" />
                    <span>Done Reordering</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsDragMode(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 shadow-2xs transition active:scale-95 cursor-pointer"
                    title="Enable drag and drop reordering"
                  >
                    <GripVertical size={14} className="text-zinc-500" />
                    <span className="hidden sm:inline">Reorder</span>
                  </button>
                )}

                {/* + Add Course Button matching user screenshot red arrow! */}
                <button
                  type="button"
                  onClick={openAddCourseModal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary-dark px-3.5 sm:px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                  title="Add a new course with custom settings"
                >
                  <Plus size={15} className="stroke-[2.5]" />
                  <span>Add Course</span>
                </button>
              </div>
            )}
          </div>

          {/* Drag Mode Active Notification Banner (Staff Only) */}
          {isAdmin && isDragMode && (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-primary/10 border border-primary/25 px-3.5 py-2 text-xs font-medium text-primary shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Move size={14} className="animate-bounce" />
                <span><strong>Drag & Drop Mode Active:</strong> Drag any card over another to rearrange. Surrounding cards adjust automatically.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDragMode(false);
                  setDraggedCourseId(null);
                  void reorderCourses(localCourseOrder.map((c) => c.id));
                }}
                className="underline font-bold hover:text-primary-dark cursor-pointer text-xs"
              >
                Finish
              </button>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 transition-all">
            {localCourseOrder.map((course) => {
              const cRow = progress.find(
                (p) => p.courseId === course.id && (!user?.id || !p.userId || p.userId === user?.id)
              );
              const cCompleted = cRow?.completedLessonIds || [];
              const cTotal = course.lessons.length;
              const cDone = cTotal
                ? course.lessons.filter((l) => cCompleted.includes(l.id)).length
                : 0;
              const cPct = cTotal ? Math.round((cDone / cTotal) * 100) : 0;

              const isDraggingThis = isAdmin && draggedCourseId === course.id;
              const isHoldingThis = isAdmin && holdingCardId === course.id;

              return (
                <div
                  key={course.id}
                  onClick={() => !isAdmin && handleSelectCourse(course)}
                  onPointerDown={(e) => isAdmin ? startCardHold(e, course.id) : undefined}
                  onPointerMove={isAdmin ? moveCardHold : undefined}
                  onPointerUp={() => isAdmin ? endCardHold(course) : handleSelectCourse(course)}
                  onPointerCancel={() => isAdmin ? endCardHold(course) : undefined}
                  onPointerEnter={() => isAdmin && isDragMode && handleCardDragOver(course.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (isAdmin && isDragMode) handleCardDragOver(course.id);
                  }}
                  draggable={isAdmin && isDragMode}
                  onDragStart={(e) => {
                    if (!isAdmin) return;
                    setDraggedCourseId(course.id);
                    e.dataTransfer.setData("text/plain", course.id);
                  }}
                  onDragEnd={() => {
                    if (!isAdmin) return;
                    setDraggedCourseId(null);
                    void reorderCourses(localCourseOrder.map((c) => c.id));
                  }}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-xs transition-all duration-300 select-none ${
                    isDraggingThis
                      ? "scale-105 shadow-2xl ring-2 ring-primary border-primary z-30 opacity-90 rotate-1 cursor-grabbing"
                      : isHoldingThis
                      ? "scale-[0.98] ring-2 ring-primary/60 border-primary/60 shadow-md cursor-grab"
                      : isAdmin && isDragMode
                      ? "border-primary/30 hover:border-primary hover:shadow-lg cursor-grab hover:scale-[1.01]"
                      : "border-zinc-200/90 hover:-translate-y-1 hover:shadow-xl hover:border-zinc-400 cursor-pointer"
                  }`}
                >
                  {/* Visual Drag Handle Pill when in Drag Mode */}
                  {isAdmin && isDragMode && (
                    <div className="absolute top-2.5 left-2.5 z-20 inline-flex items-center gap-1 rounded-lg bg-black/80 backdrop-blur-xs px-2 py-1 text-[10px] font-bold text-white shadow-md border border-white/20 pointer-events-none">
                      <GripVertical size={12} className="text-primary" />
                      <span>Drag</span>
                    </div>
                  )}

                  {/* Course Banner */}
                  {renderCourseBanner(course)}

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                    <div>
                      <h3 className="text-[15px] sm:text-base font-bold text-zinc-900 group-hover:text-primary transition-colors line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="mt-1 text-xs sm:text-[13px] text-zinc-600 line-clamp-2 leading-relaxed min-h-[34px] sm:min-h-[36px]">
                        {course.description}
                      </p>
                    </div>

                    {/* Clean Pill Progress Bar */}
                    <div className="mt-3.5 sm:mt-4">
                      <div className="relative h-5 w-full overflow-hidden rounded-full bg-[#e5e7eb] flex items-center shadow-inner">
                        {cPct > 0 && (
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary via-[#6366f1] to-[#7c83ff] transition-all duration-500"
                            style={{ width: `${cPct}%` }}
                          />
                        )}
                        <span className="absolute left-3 text-[11px] font-bold text-zinc-700">
                          {cPct}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 text-[11px]">
                      <span className="font-semibold text-zinc-500">
                        {course.isPremiumOnly
                          ? "👑 VIP Plan"
                          : course.price
                          ? formatMoney(course.price)
                          : `Level ${course.unlockLevel}`}
                      </span>
                      <Link
                        href={`/about?course=${course.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-primary hover:underline inline-flex items-center gap-0.5"
                      >
                        See About →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 2. DETAILED MODULE / COURSE LESSON VIEW */
        <div className="space-y-4 sm:space-y-6">
          {/* Navigation Bar: Back to Classroom & Course Title + EDIT BUTTON ON RIGHT */}
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200/90 pb-3 sm:pb-4 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={handleBackToClassroom}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 sm:px-3.5 py-1.5 text-xs font-bold text-zinc-700 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition cursor-pointer shadow-xs shrink-0 active:scale-95"
              >
                <ChevronLeft size={16} /> Back to Classroom
              </button>

              <span className="text-zinc-300 shrink-0">/</span>

              <h1 className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                {activeCourse.title}
              </h1>
            </div>

            {/* SEPARATE EDIT BUTTON (Pointed to by Red Arrow in screenshot) */}
            {isAdmin && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openFullCourseEditor("course")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300/80 bg-white hover:border-primary hover:bg-primary/5 px-3.5 sm:px-4 py-1.5 text-xs font-bold text-zinc-800 hover:text-primary transition shadow-xs cursor-pointer active:scale-95"
                  title="Edit Course Details, Modules, Lessons & Content"
                >
                  <Pencil size={13} className="text-primary stroke-[2.5]" />
                  <span>Edit</span>
                </button>
              </div>
            )}
          </div>

          {locked ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-10 text-center">
              <Lock className="mx-auto mb-3 text-primary" />
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                {activeCourse.isPremiumOnly || activeCourse.badge?.toUpperCase() === "VIP" || activeCourse.badge?.toUpperCase() === "PREMIUM"
                  ? "👑 VIP Mastermind Access Required"
                  : `Unlock at Level ${activeCourse.unlockLevel} or upgrade to VIP`}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                {activeCourse.isPremiumOnly || activeCourse.badge?.toUpperCase() === "VIP" || activeCourse.badge?.toUpperCase() === "PREMIUM"
                  ? "This mastermind is reserved exclusively for active VIP subscribers."
                  : `Course Price: ${formatMoney(activeCourse.price || 49)} or Level ${activeCourse.unlockLevel}`}
              </p>
              <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setUpgradeOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 sm:px-5 py-2.5 font-bold text-xs sm:text-sm text-white shadow-md hover:bg-primary-dark transition cursor-pointer"
                >
                  👑 Upgrade to VIP ($9/mo)
                </button>
                <Link
                  href={`/about?course=${activeCourse.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 sm:px-5 py-2.5 font-bold text-xs sm:text-sm text-zinc-700 shadow-2xs hover:border-primary/40 hover:text-primary transition"
                >
                  See About →
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:gap-7 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
              {/* Left / Secondary Sidebar for Module Lessons */}
              <aside className="order-2 lg:order-1 space-y-4 sm:space-y-6">
                {/* Store Theme Pill Progress Bar */}
                <div
                  className="relative h-7 sm:h-8 w-full overflow-hidden rounded-full bg-[#e2e4e9] flex items-center shadow-inner"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  title={`Course Progress: ${pct}%`}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-[#6366f1] to-[#7c83ff] transition-all duration-400 ease-out shadow-xs"
                    style={{ width: `${pct}%` }}
                  />

                  <span
                    className={`absolute inset-y-0 left-3.5 sm:left-4 flex items-center text-xs font-black tracking-wide transition-colors ${
                      pct > 15 ? "text-white drop-shadow-xs" : "text-zinc-800"
                    }`}
                  >
                    {pct}%
                  </span>
                </div>

                {/* Lesson Navigation List */}
                <div className="space-y-4 sm:space-y-6">
                  {modules.map((mod) => (
                    <div key={mod.name} className="space-y-2 sm:space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-zinc-900">
                          {mod.name}
                        </h2>
                      </div>

                      <div className="space-y-1 sm:space-y-1.5">
                        {mod.lessons.map((item) => {
                          const isActive = activeLesson?.id === item.id;
                          const isDone = completedIds.includes(item.id);

                          return (
                            <div
                              key={item.id}
                              onClick={() => handleSelectLesson(item.id)}
                              className={`group flex w-full items-center justify-between text-left transition-all cursor-pointer select-none ${
                                isActive
                                  ? "rounded-xl bg-primary/10 border border-primary/25 px-3.5 sm:px-4 py-2 sm:py-2.5 font-bold text-primary shadow-2xs"
                                  : "rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-[14.5px] font-medium text-zinc-800 hover:bg-white hover:text-primary hover:shadow-xs border border-transparent hover:border-zinc-200"
                              }`}
                            >
                              <span
                                className={`truncate flex-1 leading-snug ${
                                  isActive
                                    ? "font-bold text-primary text-xs sm:text-[14.5px]"
                                    : "text-zinc-800 group-hover:text-primary"
                                }`}
                                title={item.title}
                              >
                                {item.title}
                              </span>

                              {/* Lesson Item Circular Completion Checkmark Button */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleLessonComplete(item.id, e)}
                                aria-label={isDone ? `Mark ${item.title} as incomplete` : `Mark ${item.title} as complete`}
                                title={isDone ? "Completed! Click to unmark" : "Click to mark as completed"}
                                className={`ml-2 flex h-5 w-5 sm:h-5.5 sm:w-5.5 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer ${
                                  isDone
                                    ? "bg-primary text-white shadow-xs hover:bg-primary-dark hover:scale-105 active:scale-95"
                                    : "border-2 border-zinc-300 text-transparent hover:border-primary hover:text-primary/40 hover:scale-105 active:scale-95"
                                }`}
                              >
                                <Check size={11} className={`sm:w-3 sm:h-3 stroke-[3] ${isDone ? "opacity-100 text-white" : "opacity-0 group-hover:opacity-60"}`} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Admin Quick Add Lesson button at bottom of sidebar */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={openAddNewLessonInEditor}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 hover:border-primary hover:text-primary hover:bg-primary/5 py-2.5 text-xs font-bold text-zinc-600 transition cursor-pointer"
                    >
                      <Plus size={14} /> Add New Lesson
                    </button>
                  )}
                </div>
              </aside>

              {/* Right Main Player & Content Card */}
              <main className="order-1 lg:order-2 rounded-2xl border border-zinc-200/90 bg-white p-4 sm:p-6 md:p-8 shadow-sm space-y-5 sm:space-y-8 min-w-0">
                {activeLesson ? (
                  <div className="space-y-5 sm:space-y-8">
                    {/* Header: Lesson Title + Circular Completion Checkmark Button + Quick Edit */}
                    <div className="flex items-start sm:items-center justify-between gap-3 pb-3.5 sm:pb-5 border-b border-zinc-100">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h1 className="text-base sm:text-xl md:text-2xl font-bold tracking-tight text-zinc-950 leading-snug">
                            {activeLesson.videoTitle || activeLesson.title}
                          </h1>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => openEditLessonInEditor(activeLesson)}
                              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-white hover:border-primary/40 px-2 py-0.5 text-[11px] font-bold text-zinc-600 hover:text-primary transition cursor-pointer"
                              title="Edit current lesson"
                            >
                              <Pencil size={11} /> Edit Lesson
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Circular Completion Toggle Button in Store Brand Theme */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleComplete(e)}
                        aria-label={
                          isCurrentCompleted
                            ? "Mark as uncompleted"
                            : "Mark as completed"
                        }
                        title={
                          isCurrentCompleted
                            ? "Completed! Click to unmark"
                            : "Click to mark as completed"
                        }
                        className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer active:scale-95 ${
                          isCurrentCompleted
                            ? "border-2 border-primary bg-primary text-white shadow-sm hover:bg-primary-dark hover:border-primary-dark hover:scale-105"
                            : "border-2 border-zinc-400 text-zinc-400 hover:border-primary hover:text-primary hover:scale-105"
                        }`}
                      >
                        <Check size={15} className="sm:w-4 sm:h-4 stroke-[3]" />
                      </button>
                    </div>

                    {/* 16:9 Video Player Container */}
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl sm:rounded-2xl bg-zinc-950 border border-zinc-200 shadow-inner group">
                      {playing ? (
                        embed?.type === "file" ? (
                          <video
                            key={embed.src}
                            src={embed.src}
                            controls
                            autoPlay
                            className="h-full w-full object-cover"
                          />
                        ) : embed ? (
                          <iframe
                            key={embed.src}
                            src={`${embed.src}?autoplay=1`}
                            title={activeLesson.videoTitle || activeLesson.title}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs sm:text-sm text-zinc-400">
                            No video source available.
                          </div>
                        )
                      ) : (
                        /* Dynamic Video Preview Overlay */
                        <div
                          onClick={() => setPlaying(true)}
                          className="relative h-full w-full cursor-pointer select-none bg-zinc-950 overflow-hidden"
                        >
                          {getVideoThumbnail(activeLesson.videoUrl) ? (
                            <img
                              src={getVideoThumbnail(activeLesson.videoUrl)!}
                              alt={activeLesson.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-primary/20 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                              <span className="rounded-full bg-primary/20 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold text-primary ring-1 ring-primary/30 mb-2">
                                {activeCourse.badge || "LESSON"}
                              </span>
                              <h2 className="max-w-md text-sm sm:text-lg font-bold text-white line-clamp-2">
                                {activeLesson.title}
                              </h2>
                            </div>
                          )}

                          {/* Subtle Vignette */}
                          <div className="absolute inset-0 bg-black/25 transition group-hover:bg-black/15" />

                          {/* Center Play Button Overlay with Store Blurple Theme */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-black/65 text-white backdrop-blur-xs transition group-hover:scale-110 group-hover:bg-primary shadow-2xl">
                              <Play size={22} className="sm:w-6 sm:h-6 ml-1 fill-current" />
                            </div>
                          </div>

                          {/* Bottom-right Duration Badge */}
                          <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 rounded bg-black/85 px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono text-[10px] sm:text-xs font-bold text-white shadow-xs">
                            {activeLesson.duration || "0:34"}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Section Navigator Tabs - Responsive Horizontal Slider */}
                    <div className="relative w-full border-b border-zinc-200 pb-2.5 sm:pb-3">
                      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
                        <button
                          type="button"
                          onClick={() => setActiveBottomTab("overview")}
                          className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition cursor-pointer active:scale-95 ${
                            activeBottomTab === "overview"
                              ? "bg-primary text-white shadow-xs"
                              : "bg-white text-zinc-700 border border-zinc-200 hover:border-primary/40 hover:text-primary"
                          }`}
                        >
                          <BookOpen size={13} className="sm:w-3.5 sm:h-3.5 shrink-0" /> <span>Lesson Overview</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveBottomTab("word-notes")}
                          className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition cursor-pointer active:scale-95 ${
                            activeBottomTab === "word-notes"
                              ? "bg-primary text-white shadow-xs"
                              : "bg-white text-zinc-700 border border-zinc-200 hover:border-primary/40 hover:text-primary"
                          }`}
                        >
                          <FileText size={13} className="sm:w-3.5 sm:h-3.5 shrink-0" /> <span>Notes</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveBottomTab("comments")}
                          className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition cursor-pointer active:scale-95 ${
                            activeBottomTab === "comments"
                              ? "bg-primary text-white shadow-xs"
                              : "bg-white text-zinc-700 border border-zinc-200 hover:border-primary/40 hover:text-primary"
                          }`}
                        >
                          <MessageSquare size={13} className="sm:w-3.5 sm:h-3.5 shrink-0" /> <span>Discussion</span>
                        </button>
                      </div>
                    </div>

                    {/* 1. SECTION 1: Lesson Description & Notes */}
                    {activeBottomTab === "overview" && (
                      <div className="space-y-3.5 sm:space-y-4 rounded-xl sm:rounded-2xl border border-zinc-200/90 bg-white p-4 sm:p-6 md:p-8 shadow-xs">
                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-black text-[9px] sm:text-[10px] font-black text-white">
                              PSS
                            </span>
                            <span className="text-xs font-bold text-zinc-900">Permanent Skills Academy</span>
                            <StaffRoleFavicon role="admin" size="xs" />
                          </div>
                          <span className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">Official Course Material</span>
                        </div>
                        <div className="prose max-w-none text-xs sm:text-sm md:text-[15px] leading-relaxed text-zinc-800 break-words">
                          {renderNotes(activeLesson.notes || "No notes provided for this lesson.")}
                        </div>
                      </div>
                    )}

                    {/* 2. SECTION 2: Notes Sheet */}
                    {activeBottomTab === "word-notes" && (
                      <div className="space-y-2">
                        <WordDocumentNotes
                          lessonId={activeLesson.id}
                          lessonTitle={activeLesson.title}
                        />
                      </div>
                    )}

                    {/* 3. SECTION 3: Lesson Comments */}
                    {activeBottomTab === "comments" && (
                      <div>
                        <LessonComments
                          lessonId={activeLesson.id}
                          lessonTitle={activeLesson.title}
                        />
                      </div>
                    )}

                    {/* Previous / Next Navigation */}
                    <div className="flex items-center justify-between gap-2 border-t border-zinc-100 pt-4 sm:pt-6 flex-wrap">
                      <button
                        type="button"
                        disabled={currentIndex <= 0}
                        onClick={() => {
                          if (currentIndex > 0) {
                            handleSelectLesson(activeCourse.lessons[currentIndex - 1].id);
                          }
                        }}
                        className="text-xs sm:text-sm font-semibold text-zinc-500 hover:text-zinc-900 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                      >
                        ← Previous Lesson
                      </button>

                      <div className="text-[11px] sm:text-xs font-bold text-zinc-400">
                        Lesson {currentIndex + 1} of {totalLessons}
                      </div>

                      <button
                        type="button"
                        disabled={currentIndex >= totalLessons - 1}
                        onClick={() => {
                          if (currentIndex < totalLessons - 1) {
                            handleSelectLesson(activeCourse.lessons[currentIndex + 1].id);
                          }
                        }}
                        className="text-xs sm:text-sm font-bold text-primary hover:text-primary-dark disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                      >
                        Next Lesson →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-zinc-500 text-xs sm:text-sm space-y-3">
                    <p>No lessons available in this course yet.</p>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={openAddNewLessonInEditor}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-dark transition cursor-pointer"
                      >
                        <Plus size={14} /> Add First Lesson
                      </button>
                    )}
                  </div>
                )}
              </main>
            </div>
          )}
        </div>
      )}

      {/* COMPREHENSIVE COURSE & LESSON PAGE EDITOR MODAL (Admin & Manager Only) */}
      {isAdmin && (
        <Modal
          open={showFullEditor}
          onClose={() => {
            setShowFullEditor(false);
            setEditingLessonId(null);
            setLessonForm(emptyLessonForm);
          }}
          title={`Edit Page: ${activeCourse?.title || "Course & Lessons"}`}
          wide
        >
        <div className="space-y-4">
          {/* Editor Header Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 flex-wrap">
            <button
              type="button"
              onClick={() => setEditorTab("course")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                editorTab === "course"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              <Sparkles size={13} className="text-amber-400" />
              <span>Course Details & Cover</span>
            </button>

            <button
              type="button"
              onClick={() => setEditorTab("lessons")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                editorTab === "lessons"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              <Layers size={13} className="text-primary" />
              <span>All Lessons & Modules ({activeCourse?.lessons.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingLessonId(null);
                setLessonForm(emptyLessonForm);
                setEditorTab("add-lesson");
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                editorTab === "add-lesson"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              }`}
            >
              <Plus size={13} />
              <span>{editingLessonId ? "Edit Lesson" : "Add New Lesson"}</span>
            </button>
          </div>

          {/* Alert Message Banner */}
          {editorMessage && (
            <div
              className={`rounded-xl p-3 text-xs font-semibold flex items-center gap-2 transition-all ${
                editorMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {editorMessage.type === "success" ? <Check size={14} className="text-emerald-600 shrink-0" /> : <AlertCircle size={14} className="text-rose-600 shrink-0" />}
              <span>{editorMessage.text}</span>
            </div>
          )}

          {/* TAB 1: COURSE DETAILS & COVER */}
          {editorTab === "course" && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Course Title">
                  <input
                    className={inputClass}
                    value={courseForm.title}
                    onChange={(e) => setCourseForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Getting Started (Onboarding)"
                  />
                </Field>

                <Field label="Badge Label (Tag)">
                  <input
                    className={inputClass}
                    value={courseForm.badge}
                    onChange={(e) => setCourseForm((prev) => ({ ...prev, badge: e.target.value }))}
                    placeholder="e.g. ONBOARDING, VIP, BASICS"
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Course Description">
                    <textarea
                      rows={2}
                      className={inputClass}
                      value={courseForm.description}
                      onChange={(e) => setCourseForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Summary of what students will learn in this course..."
                    />
                  </Field>
                </div>

                <Field label="Unlock Level (1-10)">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className={inputClass}
                    value={courseForm.unlockLevel}
                    onChange={(e) => setCourseForm((prev) => ({ ...prev, unlockLevel: Number(e.target.value) || 1 }))}
                  />
                </Field>

                <Field label="Price ($ USD, 0 for free with level)">
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={courseForm.price}
                    onChange={(e) => setCourseForm((prev) => ({ ...prev, price: e.target.value }))}
                  />
                </Field>
              </div>

              {/* VIP Exclusivity Toggle */}
              <div className="rounded-xl border border-zinc-200 bg-amber-50/40 p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-900 flex items-center gap-1">
                    <Crown size={14} className="text-amber-500" /> VIP Plan Only Access
                  </span>
                  <p className="text-[11px] text-zinc-500">Only accessible to active VIP Mastermind members.</p>
                </div>
                <input
                  type="checkbox"
                  checked={courseForm.isPremiumOnly}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, isPremiumOnly: e.target.checked }))}
                  className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              {/* Background Cover & Banner Settings */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" /> Background Cover & Watermark
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Cover Image URL">
                    <input
                      className={inputClass}
                      placeholder="https://... or direct image link"
                      value={courseForm.thumbnail}
                      onChange={(e) => setCourseForm((prev) => ({ ...prev, thumbnail: e.target.value }))}
                    />
                  </Field>

                  <Field label="Or Upload Direct Image">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white p-2 text-xs font-semibold text-zinc-600 hover:border-primary hover:bg-primary/5 transition min-h-[42px] shadow-2xs">
                      <Upload size={14} className="shrink-0" />
                      {coverUploading ? (
                        <span className="text-primary font-bold">Uploading...</span>
                      ) : (
                        <span>Upload PNG / JPG / WebP</span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={coverUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadCoverImage(file);
                        }}
                      />
                    </label>
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Terminal Watermark Text">
                    <input
                      className={inputClass}
                      placeholder="e.g. > ONBOARDING_SYSTEM_"
                      value={courseForm.watermark}
                      onChange={(e) => setCourseForm((prev) => ({ ...prev, watermark: e.target.value }))}
                    />
                  </Field>

                  <Field label="Glow Theme">
                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      {(["yellow", "green", "blue", "orange", "red", "purple"] as const).map((color) => {
                        const bgColors: Record<string, string> = {
                          yellow: "bg-amber-400",
                          green: "bg-emerald-500",
                          blue: "bg-sky-500",
                          orange: "bg-orange-500",
                          red: "bg-rose-500",
                          purple: "bg-purple-500",
                        };
                        const isSelected = courseForm.glowColor === color;
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setCourseForm((prev) => ({ ...prev, glowColor: color }))}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold capitalize transition cursor-pointer ${
                              isSelected
                                ? "border-zinc-900 bg-zinc-900 text-white"
                                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                            }`}
                          >
                            <span className={`h-2 w-2 rounded-full ${bgColors[color]}`} />
                            {color}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <PrimaryButton
                  disabled={editorSaving || coverUploading}
                  onClick={handleSaveCourseDetails}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold cursor-pointer"
                >
                  {editorSaving ? "Saving Course..." : "Save Course Details"}
                </PrimaryButton>
              </div>
            </div>
          )}

          {/* TAB 2: ALL LESSONS & MODULES */}
          {editorTab === "lessons" && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500">
                  Total Lessons: {activeCourse?.lessons.length || 0}
                </span>
                <button
                  type="button"
                  onClick={openAddNewLessonInEditor}
                  className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-dark shadow-xs transition cursor-pointer"
                >
                  <Plus size={13} /> Add Lesson
                </button>
              </div>

              {modules.map((mod) => (
                <div key={mod.name} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-zinc-200/80 pb-1.5">
                    <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <Layers size={13} className="text-primary" /> {mod.name}
                    </span>
                    <span className="text-[10px] font-semibold text-zinc-400">{mod.lessons.length} lessons</span>
                  </div>

                  <div className="space-y-1.5">
                    {mod.lessons.map((lesson, idx) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200/80 bg-white p-2.5 text-xs transition hover:border-zinc-300"
                      >
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-zinc-100 font-mono text-[10px] font-bold text-zinc-600">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-zinc-900 truncate">{lesson.title}</h4>
                            <p className="text-[11px] text-zinc-500 truncate flex items-center gap-2">
                              <span>Duration: {lesson.duration || "N/A"}</span>
                              {lesson.videoUrl && <span className="text-emerald-600 font-medium">✓ Video attached</span>}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditLessonInEditor(lesson)}
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white hover:border-primary hover:text-primary px-2 py-1 text-[11px] font-bold text-zinc-700 transition cursor-pointer"
                            title="Edit this lesson"
                          >
                            <Pencil size={11} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white hover:border-rose-400 hover:text-rose-600 p-1 text-zinc-400 transition cursor-pointer"
                            title="Delete this lesson"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: ADD / EDIT LESSON FORM */}
          {editorTab === "add-lesson" && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Film size={14} className="text-primary" />
                  {editingLessonId ? "Edit Lesson Details" : "Create New Lesson"}
                </span>
                {editingLessonId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLessonId(null);
                      setLessonForm(emptyLessonForm);
                    }}
                    className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 cursor-pointer"
                  >
                    Clear to Add New
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Module Name">
                  <input
                    className={inputClass}
                    value={lessonForm.module}
                    onChange={(e) => setLessonForm((prev) => ({ ...prev, module: e.target.value }))}
                    placeholder="e.g. Module 1: Onboarding & Community"
                    list="existing-modules"
                  />
                  <datalist id="existing-modules">
                    {modules.map((m) => (
                      <option key={m.name} value={m.name} />
                    ))}
                  </datalist>
                </Field>

                <Field label="Lesson Title">
                  <input
                    className={inputClass}
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. 1.1 Welcome and Community Overview"
                  />
                </Field>

                <Field label="Video Title (Optional display heading)">
                  <input
                    className={inputClass}
                    value={lessonForm.videoTitle}
                    onChange={(e) => setLessonForm((prev) => ({ ...prev, videoTitle: e.target.value }))}
                    placeholder="e.g. Platform Walkthrough & VIP Access"
                  />
                </Field>

                <Field label="Lesson Duration">
                  <input
                    className={inputClass}
                    value={lessonForm.duration}
                    onChange={(e) => setLessonForm((prev) => ({ ...prev, duration: e.target.value }))}
                    placeholder="e.g. 12:45"
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Video URL (YouTube, Vimeo, MP4, Loom link)">
                    <input
                      className={inputClass}
                      value={lessonForm.videoUrl}
                      onChange={(e) => setLessonForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                      placeholder="https://www.youtube.com/watch?v=... or direct MP4 link"
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Or Upload Direct Video File (.mp4, .mov, .webm)">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/70 p-3 text-xs font-semibold text-zinc-700 hover:border-primary hover:bg-primary/5 transition min-h-[46px] shadow-2xs">
                      <Upload size={14} className="text-primary shrink-0" />
                      {videoUploading ? (
                        <span className="text-primary font-bold">Uploading Video File...</span>
                      ) : lessonForm.videoUrl ? (
                        <span className="truncate max-w-[280px] text-zinc-800">
                          {lessonForm.videoUrl.startsWith("http") ? lessonForm.videoUrl : "Change Video File"}
                        </span>
                      ) : (
                        <span>Upload Video File (.mp4, .mov, .webm)</span>
                      )}
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        disabled={videoUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadLessonVideo(file);
                        }}
                      />
                    </label>
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Lesson Overview / Notes (Rich text & Markdown for Overview tab)">
                    <textarea
                      rows={5}
                      className={inputClass}
                      value={lessonForm.notes}
                      onChange={(e) => setLessonForm((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Write the detailed lesson curriculum, key takeaways, resources, and instructions here..."
                    />
                  </Field>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditorTab("lessons")}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <PrimaryButton
                  disabled={editorSaving || videoUploading}
                  onClick={handleSaveLessonForm}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold cursor-pointer"
                >
                  {editorSaving ? "Saving Lesson..." : editingLessonId ? "Update Lesson" : "Save New Lesson"}
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>
      </Modal>
      )}

      {/* EDIT COURSE BACKGROUND / COVER MODAL (Admin & Manager Only) */}
      {isAdmin && (
        <Modal
          open={Boolean(editingCoverCourse)}
          onClose={() => setEditingCoverCourse(null)}
          title={`Edit Background: ${editingCoverCourse?.title || "Course"}`}
          wide
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3.5 sm:p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" /> Course Cover / Background Image
                </span>
                <span className="text-[10px] font-bold text-zinc-400">Admin & Manager Only</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Background Image URL">
                  <input
                    className={inputClass}
                    placeholder="https://images.unsplash.com/... or CDN link"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                  />
                </Field>

                <Field label="Or Upload Direct Image File">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white p-2.5 text-xs font-semibold text-zinc-600 hover:border-primary hover:bg-primary/5 hover:text-primary transition min-h-[42px] shadow-2xs">
                    <Upload size={14} className="shrink-0" />
                    {coverUploading ? (
                      <span className="text-primary font-bold">Uploading Image...</span>
                    ) : coverImageUrl ? (
                      <span className="truncate max-w-[200px] text-zinc-700">Change Image File</span>
                    ) : (
                      "Upload PNG / JPG / WebP"
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={coverUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadCoverImage(file);
                      }}
                    />
                  </label>
                </Field>
              </div>

              {coverImageUrl && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-emerald-700 font-medium">✓ Custom background cover image active</span>
                  <button
                    type="button"
                    onClick={() => setCoverImageUrl("")}
                    className="text-[11px] font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                  >
                    Remove Custom Image
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <Field label="Terminal Watermark (Optional background text)">
                  <input
                    className={inputClass}
                    placeholder="e.g. > AI_AUTOMATION_"
                    value={coverWatermark}
                    onChange={(e) => setCoverWatermark(e.target.value)}
                  />
                </Field>

                <Field label="Glow Theme (Fallback or Ambient)">
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {(["yellow", "green", "blue", "orange", "red", "purple"] as const).map((color) => {
                      const bgColors: Record<string, string> = {
                        yellow: "bg-amber-400",
                        green: "bg-emerald-500",
                        blue: "bg-sky-500",
                        orange: "bg-orange-500",
                        red: "bg-rose-500",
                        purple: "bg-purple-500",
                      };
                      const isSelected = coverGlow === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setCoverGlow(color)}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold capitalize transition shadow-2xs cursor-pointer ${
                            isSelected
                              ? "border-zinc-900 bg-zinc-900 text-white shadow-xs"
                              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          <span className={`h-2.5 w-2.5 rounded-full ${bgColors[color]}`} />
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>

              {/* Live Banner Preview */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Live Card Banner Preview
                </label>
                <div className="overflow-hidden rounded-2xl border border-zinc-300 shadow-sm max-w-md mx-auto">
                  {coverImageUrl ? (
                    <div
                      className="relative h-36 w-full overflow-hidden p-4 flex flex-col items-center justify-center select-none bg-cover bg-center"
                      style={{ backgroundImage: `url(${coverImageUrl})` }}
                    >
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px]" />
                      {coverWatermark && (
                        <div className="absolute inset-x-0 bottom-2 text-center font-mono text-xl font-black text-white/30 tracking-tight select-none">
                          {coverWatermark}
                        </div>
                      )}
                      <div className="relative z-10 flex flex-col items-center justify-center text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/85 text-white shadow-xl border border-white/25">
                          <Unlock size={16} />
                        </div>
                        <span className="mt-1 text-xs font-extrabold text-white drop-shadow-md">
                          {editingCoverCourse?.title}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-36 w-full overflow-hidden bg-black p-4 flex flex-col items-center justify-center select-none">
                      <div
                        className={`absolute h-24 w-24 rounded-full blur-2xl pointer-events-none ${
                          coverGlow === "green"
                            ? "bg-emerald-500/30"
                            : coverGlow === "blue"
                            ? "bg-sky-500/30"
                            : coverGlow === "orange"
                            ? "bg-orange-500/35"
                            : coverGlow === "red"
                            ? "bg-rose-500/30"
                            : coverGlow === "purple"
                            ? "bg-purple-500/35"
                            : "bg-amber-400/25"
                        }`}
                      />
                      <div className="absolute inset-x-0 bottom-2 text-center font-mono text-xl font-black text-white/15 tracking-tight select-none">
                        {coverWatermark || `> ${editingCoverCourse?.slug || "course"}_`}
                      </div>
                      <div className="relative z-10 flex flex-col items-center justify-center text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950/90 border-2 border-white/40 text-white shadow-xl">
                          <Unlock size={16} />
                        </div>
                        <span className="mt-1 text-xs font-extrabold text-white drop-shadow-md">
                          {editingCoverCourse?.title}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
              <button
                type="button"
                onClick={() => setEditingCoverCourse(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <PrimaryButton
                disabled={coverSaving || coverUploading}
                onClick={handleSaveCover}
                className="rounded-xl px-5 py-2.5 text-xs font-bold cursor-pointer"
              >
                {coverSaving ? "Saving Cover..." : "Save Background Image"}
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Course Modal (Staff Only: Admin & Manager) */}
      {isAdmin && showAddCourseModal && (
        <Modal
          open={showAddCourseModal}
          onClose={() => setShowAddCourseModal(false)}
          title="Add New Course"
          wide
        >
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {addCourseMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  addCourseMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {addCourseMessage.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
                <span>{addCourseMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Course Title *">
                <input
                  type="text"
                  value={addCourseForm.title}
                  onChange={(e) => setAddCourseForm({ ...addCourseForm, title: e.target.value })}
                  placeholder="e.g. AI Prompt Mastery & Workflows"
                  className={inputClass}
                />
              </Field>

              <Field label="Badge / Category Tag">
                <input
                  type="text"
                  value={addCourseForm.badge}
                  onChange={(e) => setAddCourseForm({ ...addCourseForm, badge: e.target.value })}
                  placeholder="e.g. START HERE, FOUNDATIONS, VIP"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                value={addCourseForm.description}
                onChange={(e) => setAddCourseForm({ ...addCourseForm, description: e.target.value })}
                placeholder="Brief summary of what students will learn in this course..."
                rows={2}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Unlock Level">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={addCourseForm.unlockLevel}
                  onChange={(e) => setAddCourseForm({ ...addCourseForm, unlockLevel: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Course Price ($)">
                <input
                  type="number"
                  min={0}
                  value={addCourseForm.price}
                  onChange={(e) => setAddCourseForm({ ...addCourseForm, price: e.target.value })}
                  placeholder="0 for free"
                  className={inputClass}
                />
              </Field>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 rounded-xl border border-zinc-200/90 bg-zinc-50 p-2.5 text-xs font-semibold text-zinc-800 cursor-pointer hover:bg-zinc-100 transition">
                  <input
                    type="checkbox"
                    checked={addCourseForm.isPremiumOnly}
                    onChange={(e) => setAddCourseForm({ ...addCourseForm, isPremiumOnly: e.target.checked })}
                    className="h-4 w-4 rounded text-primary focus:ring-primary"
                  />
                  <span>👑 VIP Plan Only</span>
                </label>
              </div>
            </div>

            {/* Banner Theme & Custom Cover Image */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5 sm:p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                <Sparkles size={13} className="text-primary" />
                <span>Banner Theme & Cover Customization</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Watermark Text">
                  <input
                    type="text"
                    value={addCourseForm.watermark}
                    onChange={(e) => setAddCourseForm({ ...addCourseForm, watermark: e.target.value })}
                    placeholder="e.g. > start_here_ or > build_apps_"
                    className={inputClass}
                  />
                </Field>

                <Field label="Custom Cover Image Upload">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 transition cursor-pointer shadow-xs">
                      <Upload size={13} />
                      <span>{addCourseUploading ? "Uploading..." : "Browse Image"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={addCourseUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadAddCourseImage(file);
                        }}
                      />
                    </label>
                    <input
                      type="text"
                      value={addCourseForm.thumbnail}
                      onChange={(e) => setAddCourseForm({ ...addCourseForm, thumbnail: e.target.value })}
                      placeholder="or paste URL"
                      className={`${inputClass} flex-1 text-xs`}
                    />
                  </div>
                </Field>
              </div>

              {/* Preset Glow Color Selector */}
              <Field label="Preset Glow Color / Accent">
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  {(["yellow", "green", "blue", "orange", "red", "purple"] as const).map((color) => {
                    const dotColors: Record<string, string> = {
                      yellow: "bg-amber-400",
                      green: "bg-emerald-500",
                      blue: "bg-sky-500",
                      orange: "bg-orange-500",
                      red: "bg-rose-500",
                      purple: "bg-purple-500",
                    };
                    const isSelected = addCourseForm.glowColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setAddCourseForm({ ...addCourseForm, glowColor: color })}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold capitalize transition shadow-2xs cursor-pointer ${
                          isSelected
                            ? "border-zinc-900 bg-zinc-900 text-white shadow-xs"
                            : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${dotColors[color]}`} />
                        {color}
                      </button>
                    );
                  })}
                </div>
              </Field>

              {/* Live Preview Card */}
              <div className="pt-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Live Banner Preview
                </label>
                <div className="overflow-hidden rounded-2xl border border-zinc-300 shadow-xs max-w-md mx-auto">
                  {addCourseForm.thumbnail ? (
                    <div
                      className="relative h-36 w-full overflow-hidden p-4 flex flex-col items-center justify-center select-none bg-cover bg-center"
                      style={{ backgroundImage: `url(${addCourseForm.thumbnail})` }}
                    >
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px]" />
                      <div className="absolute inset-x-0 bottom-2 text-center font-mono text-xl font-black text-white/30 tracking-tight select-none">
                        {addCourseForm.watermark || `> ${addCourseForm.title.toLowerCase().replace(/\s+/g, "_") || "new_course"}_`}
                      </div>
                      <div className="relative z-10 flex flex-col items-center justify-center text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/85 text-white shadow-xl border border-white/25">
                          <Unlock size={16} />
                        </div>
                        <span className="mt-1 text-xs font-extrabold text-white drop-shadow-md">
                          {addCourseForm.title || "Course Preview Title"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-36 w-full overflow-hidden bg-black p-4 flex flex-col items-center justify-center select-none">
                      <div
                        className={`absolute h-24 w-24 rounded-full blur-2xl pointer-events-none ${
                          addCourseForm.glowColor === "green"
                            ? "bg-emerald-500/30"
                            : addCourseForm.glowColor === "blue"
                            ? "bg-sky-500/30"
                            : addCourseForm.glowColor === "orange"
                            ? "bg-orange-500/35"
                            : addCourseForm.glowColor === "red"
                            ? "bg-rose-500/30"
                            : addCourseForm.glowColor === "purple"
                            ? "bg-purple-500/35"
                            : "bg-amber-400/25"
                        }`}
                      />
                      <div className="absolute inset-x-0 bottom-2 text-center font-mono text-xl font-black text-white/15 tracking-tight select-none">
                        {addCourseForm.watermark || `> ${addCourseForm.title.toLowerCase().replace(/\s+/g, "_") || "new_course"}_`}
                      </div>
                      <div className="relative z-10 flex flex-col items-center justify-center text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950/90 border-2 border-white/40 text-white shadow-xl">
                          <Unlock size={16} />
                        </div>
                        <span className="mt-1 text-xs font-extrabold text-white drop-shadow-md">
                          {addCourseForm.title || "Course Preview Title"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Optional Initial Lesson Section */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 sm:p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                <Film size={13} className="text-primary" />
                <span>Optional: First Lesson Setup</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Module Name">
                  <input
                    type="text"
                    value={addCourseForm.initialModule}
                    onChange={(e) => setAddCourseForm({ ...addCourseForm, initialModule: e.target.value })}
                    placeholder="e.g. Module 1: Introduction"
                    className={inputClass}
                  />
                </Field>

                <Field label="Lesson Title">
                  <input
                    type="text"
                    value={addCourseForm.initialLessonTitle}
                    onChange={(e) => setAddCourseForm({ ...addCourseForm, initialLessonTitle: e.target.value })}
                    placeholder="e.g. Welcome to the Course"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Video URL (YouTube, Vimeo, MP4, Loom)">
                <input
                  type="url"
                  value={addCourseForm.initialVideoUrl}
                  onChange={(e) => setAddCourseForm({ ...addCourseForm, initialVideoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
              <button
                type="button"
                onClick={() => setShowAddCourseModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <PrimaryButton
                disabled={addCourseSaving || addCourseUploading}
                onClick={handleCreateCourse}
                className="rounded-xl px-5 py-2.5 text-xs font-bold cursor-pointer"
              >
                {addCourseSaving ? "Creating Course..." : "Create Course"}
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}

      <LockedCourseModal
        course={lockedModalCourse}
        open={Boolean(lockedModalCourse)}
        onClose={() => setLockedModalCourse(null)}
        onUpgradeClick={() => {
          setLockedModalCourse(null);
          setUpgradeOpen(true);
        }}
      />

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
