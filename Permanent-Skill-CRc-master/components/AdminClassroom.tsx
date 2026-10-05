"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Crown,
  Eye,
  Film,
  Layers,
  Lock,
  Pencil,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Card, Field, Modal, PrimaryButton, inputClass } from "@/components/ui";
import { toEmbed } from "@/lib/video";
import type { Course, Lesson } from "@/lib/types";

const emptyLesson = {
  module: "",
  title: "",
  videoTitle: "",
  videoUrl: "",
  duration: "",
  notes: "",
};

export function AdminClassroom() {
  const { courses, saveCourse, deleteCourse, saveLesson, deleteLesson } = useApp();
  const [courseId, setCourseId] = useState(courses[0]?.id || "");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyLesson);

  // Course creation / edit state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [courseImageUploading, setCourseImageUploading] = useState(false);
  const [courseForm, setCourseForm] = useState<{
    title: string;
    description: string;
    unlockLevel: number | string;
    badge: string;
    price: number | string;
    isPremiumOnly: boolean;
    thumbnail: string;
    watermark: string;
    glowColor: "yellow" | "green" | "blue" | "orange" | "red" | "purple";
  }>({
    title: "",
    description: "",
    unlockLevel: "",
    badge: "",
    price: "",
    isPremiumOnly: false,
    thumbnail: "",
    watermark: "",
    glowColor: "yellow",
  });

  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const course = courses.find((c) => c.id === courseId) || courses[0];

  const modules = useMemo(() => {
    if (!course) return [];
    return [...new Set(course.lessons.map((l) => l.module).filter(Boolean))];
  }, [course]);

  // Group lessons by module
  const lessonsByModule = useMemo(() => {
    if (!course) return {};
    const grouped: Record<string, Lesson[]> = {};
    for (const l of course.lessons) {
      const mod = l.module || "General Lessons";
      if (!grouped[mod]) grouped[mod] = [];
      grouped[mod].push(l);
    }
    return grouped;
  }, [course]);

  useEffect(() => {
    if (!courses.length) return;
    if (!courses.some((c) => c.id === courseId)) {
      setCourseId(courses[0].id);
    }
  }, [courses, courseId]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [message]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startEditLesson(lesson: Lesson) {
    setEditingId(lesson.id);
    setForm({
      module: lesson.module,
      title: lesson.title,
      videoTitle: lesson.videoTitle || lesson.title,
      videoUrl: lesson.videoUrl || "",
      duration: lesson.duration,
      notes: lesson.notes,
    });
    setFileName("");
    setMessage(null);
  }

  function resetLessonForm() {
    setEditingId(null);
    setForm(emptyLesson);
    setFileName("");
  }

  function openCreateCourse() {
    setIsEditingCourse(false);
    setCourseForm({
      title: "",
      description: "",
      unlockLevel: "",
      badge: "",
      price: "",
      isPremiumOnly: false,
      thumbnail: "",
      watermark: "",
      glowColor: "yellow",
    });
    setShowCourseModal(true);
  }

  function openEditCourse() {
    if (!course) return;
    setIsEditingCourse(true);
    setCourseForm({
      title: course.title,
      description: course.description,
      unlockLevel: course.unlockLevel || 1,
      badge: course.badge || "",
      price: course.price !== undefined ? course.price : "",
      isPremiumOnly: Boolean(course.isPremiumOnly),
      thumbnail: course.thumbnail || "",
      watermark: course.watermark || "",
      glowColor: course.glowColor || "yellow",
    });
    setShowCourseModal(true);
  }

  async function onUploadCourseImage(file: File) {
    setCourseImageUploading(true);
    const data = new FormData();
    data.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      setCourseImageUploading(false);
      if (!json.ok) {
        setMessage({ type: "error", text: json.error || "Image upload failed." });
        return;
      }
      setCourseForm((f) => ({ ...f, thumbnail: json.url }));
      setMessage({ type: "success", text: "✓ Background image uploaded!" });
    } catch {
      setCourseImageUploading(false);
      setMessage({ type: "error", text: "Upload request failed. Check server connection." });
    }
  }

  async function onUpload(file: File) {
    setBusy(true);
    setMessage({ type: "success", text: "Uploading video file..." });
    const data = new FormData();
    data.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      setBusy(false);
      if (!json.ok) {
        setMessage({ type: "error", text: json.error || "Upload failed." });
        return;
      }
      set("videoUrl", json.url);
      setFileName(file.name);
      setMessage({ type: "success", text: "✓ Video uploaded! Save the lesson to publish." });
    } catch {
      setBusy(false);
      setMessage({ type: "error", text: "Upload request failed. Check server connection." });
    }
  }

  async function onSaveLesson() {
    if (!course) return;
    if (!form.title.trim()) {
      setMessage({ type: "error", text: "Lesson title is required." });
      return;
    }

    setBusy(true);
    setMessage(null);
    const result = await saveLesson({
      courseId: course.id,
      lessonId: editingId || undefined,
      module: form.module.trim() || "Module 1",
      title: form.title.trim(),
      videoTitle: form.videoTitle.trim() || form.title.trim(),
      videoUrl: form.videoUrl.trim(),
      duration: form.duration.trim(),
      notes: form.notes.trim(),
    });
    setBusy(false);
    if (result.ok) {
      setMessage({
        type: "success",
        text: editingId ? "✓ Lesson updated successfully." : "✓ New lesson added to course.",
      });
      resetLessonForm();
    } else {
      setMessage({ type: "error", text: result.error || "Could not save lesson." });
    }
  }

  async function onSaveCourse() {
    if (!courseForm.title.trim()) {
      setMessage({ type: "error", text: "Course title is required." });
      return;
    }
    setBusy(true);
    const result = await saveCourse({
      id: isEditingCourse && course ? course.id : undefined,
      title: courseForm.title.trim(),
      description: courseForm.description.trim(),
      unlockLevel: courseForm.unlockLevel !== "" ? Number(courseForm.unlockLevel) : 1,
      badge: courseForm.badge.trim().toUpperCase() || undefined,
      price: courseForm.price !== "" ? Number(courseForm.price) : 0,
      isPremiumOnly: courseForm.isPremiumOnly,
      thumbnail: courseForm.thumbnail.trim() || undefined,
      watermark: courseForm.watermark.trim() || undefined,
      glowColor: courseForm.glowColor,
    });
    setBusy(false);
    if (result.ok) {
      setShowCourseModal(false);
      if (result.id) setCourseId(result.id);
      setMessage({
        type: "success",
        text: isEditingCourse ? "✓ Course settings updated." : "✓ New course created.",
      });
    } else {
      setMessage({ type: "error", text: result.error || "Could not save course." });
    }
  }

  async function handleDeleteCourse() {
    if (!course) return;
    if (confirm(`Are you sure you want to delete "${course.title}" and all its lessons? This cannot be undone.`)) {
      setBusy(true);
      const res = await deleteCourse(course.id);
      setBusy(false);
      if (res.ok) {
        setMessage({ type: "success", text: "✓ Course deleted." });
      } else {
        setMessage({ type: "error", text: res.error || "Could not delete course." });
      }
    }
  }

  const videoEmbed = form.videoUrl ? toEmbed(form.videoUrl) : null;

  return (
    <div className="space-y-6">
      {/* SECTION 1: COURSE SELECTOR & MANAGEMENT BAR */}
      <Card className="p-4 sm:p-5 border border-zinc-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen size={20} />
            </div>

            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Active Course
              </label>
              <select
                className="w-full rounded-xl border border-zinc-200 bg-white py-2 px-3 text-xs sm:text-sm font-bold text-zinc-900 outline-none focus:border-zinc-900 cursor-pointer shadow-2xs"
                value={course?.id || ""}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  resetLessonForm();
                }}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.lessons.length} lessons) — Level {c.unlockLevel || 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center flex-wrap w-full sm:w-auto justify-end">
            {course && (
              <>
                <button
                  type="button"
                  onClick={openEditCourse}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition cursor-pointer"
                  title="Edit course title, description, or level"
                >
                  <Pencil size={13} /> Edit Course
                </button>

                <button
                  type="button"
                  onClick={handleDeleteCourse}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/60 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100/80 shadow-2xs transition cursor-pointer"
                  title="Delete Course"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </>
            )}

            <PrimaryButton onClick={openCreateCourse} className="rounded-xl px-3.5 py-2 text-xs font-bold gap-1.5 shadow-sm cursor-pointer">
              <Plus size={14} /> New Course
            </PrimaryButton>
          </div>
        </div>

        {course && (
          <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-3 text-xs text-zinc-600">
            <span className="rounded-md bg-zinc-900 text-white px-2 py-0.5 text-[10px] font-black uppercase">
              {course.badge || "COURSE"}
            </span>
            <span>Level {course.unlockLevel || 1} Requirement</span>
            <span>•</span>
            <span>{course.lessons.length} Total Lessons</span>
            <span>•</span>
            <span>{course.isPremiumOnly ? "👑 VIP Only" : "🌐 All Members"}</span>
            {course.price && <span>• ${course.price} standalone price</span>}
          </div>
        )}
      </Card>

      {/* Global Action Feedback Message */}
      {message && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-zinc-400 hover:text-zinc-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* SECTION 2: LESSON EDITOR FORM */}
      <Card className="p-4 sm:p-6 space-y-4 border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Video size={16} />
            </span>
            <h3 className="text-base font-black text-zinc-900">
              {editingId ? "Edit Video Lesson" : `Add Lesson to ${course?.title || "Course"}`}
            </h3>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetLessonForm}
              className="text-xs font-bold text-zinc-500 hover:text-zinc-800"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Module Selector & Quick Pills */}
          <Field label="Module / Section Name *">
            <input
              className={inputClass}
              placeholder="e.g. Module 1: Foundations"
              value={form.module}
              onChange={(e) => set("module", e.target.value)}
            />
            {modules.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-zinc-400">Existing:</span>
                {modules.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => set("module", name)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
                      form.module === name
                        ? "bg-zinc-900 text-white shadow-2xs"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </Field>

          <Field label="Lesson Duration">
            <input
              className={inputClass}
              placeholder="e.g. 14 min or 22:45"
              value={form.duration}
              onChange={(e) => set("duration", e.target.value)}
            />
          </Field>

          <Field label="Lesson Title *">
            <input
              className={inputClass}
              placeholder="e.g. Setting Up High-Yield Topic Clusters"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>

          <Field label="Display Title (Optional header label)">
            <input
              className={inputClass}
              placeholder="e.g. Part 1: Strategic Architecture"
              value={form.videoTitle}
              onChange={(e) => set("videoTitle", e.target.value)}
            />
          </Field>
        </div>

        {/* Video Source Configuration */}
        <div className="grid gap-4 sm:grid-cols-2 pt-1">
          <Field label="Video URL (YouTube, Vimeo, or MP4 URL)">
            <input
              className={inputClass}
              placeholder="https://www.youtube.com/watch?v=..."
              value={form.videoUrl}
              onChange={(e) => set("videoUrl", e.target.value)}
            />
          </Field>

          <Field label="Or Upload Direct Video File">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-2.5 text-xs font-semibold text-zinc-600 hover:border-primary hover:bg-primary/5 hover:text-primary transition min-h-[44px]">
              <Upload size={15} className="shrink-0" />
              {fileName ? <span className="truncate max-w-[220px]">{fileName}</span> : "Upload MP4 / WebM / MOV File"}
              <input
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(file);
                }}
              />
            </label>
          </Field>
        </div>

        {/* Live Video Preview Box */}
        {videoEmbed && (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-950 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-300 px-1">
              <span className="font-bold flex items-center gap-1 text-amber-400">
                <Play size={12} fill="currentColor" /> Live Video Preview
              </span>
              <span className="text-[11px] font-mono text-zinc-400">{form.videoUrl}</span>
            </div>
            <div className="relative aspect-video w-full max-w-lg mx-auto overflow-hidden rounded-xl bg-black shadow-md">
              <iframe
                src={videoEmbed.src}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Lesson Preview"
              />
            </div>
          </div>
        )}

        {/* Lesson Notes Textarea */}
        <Field label="Lesson Notes, Resources & Downloads">
          <textarea
            className={`${inputClass} min-h-[120px] font-mono text-xs`}
            placeholder={
              "Detailed notes shown under the video player.\n\nUse:\n• Bullet items starting with '- '\n• Clickable links: [Resource Link](https://...)\n• PASSWORD: secret-access-code\n• IMPORTANT: Actionable notice text"
            }
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>

        {/* Form Action Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
          {editingId && (
            <button
              type="button"
              onClick={resetLessonForm}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition"
            >
              Cancel
            </button>
          )}

          <PrimaryButton disabled={busy} onClick={onSaveLesson} className="rounded-xl px-5 py-2.5 text-xs font-bold gap-1.5 shadow-sm">
            {busy ? "Saving Lesson..." : editingId ? "Save Lesson Changes" : "Publish Lesson (+3 pts)"}
          </PrimaryButton>
        </div>
      </Card>

      {/* SECTION 3: COURSE LESSONS DIRECTORY & MODULE BREAKDOWN */}
      <Card className="p-4 sm:p-6 space-y-4 border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-base font-black text-zinc-900">
              Curriculum in {course?.title}
            </h3>
            <p className="text-xs text-zinc-500">
              {course?.lessons.length || 0} total lessons across {Object.keys(lessonsByModule).length} modules
            </p>
          </div>
        </div>

        {!course?.lessons || course.lessons.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 border border-dashed border-zinc-200 rounded-2xl">
            <Film size={28} className="mx-auto text-zinc-300 mb-2" />
            <p className="text-sm font-bold text-zinc-700">No lessons added yet</p>
            <p className="text-xs text-zinc-500 mt-0.5">Use the lesson editor above to publish your first video.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(lessonsByModule).map(([modName, modLessons]) => (
              <div key={modName} className="rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                    <Layers size={13} className="text-primary" /> {modName}
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-500">
                    {modLessons.length} {modLessons.length === 1 ? "lesson" : "lessons"}
                  </span>
                </div>

                <div className="divide-y divide-zinc-100">
                  {modLessons.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 px-2 hover:bg-white rounded-xl transition gap-2 sm:gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-zinc-900">
                            {idx + 1}. {lesson.title}
                          </span>
                          {lesson.duration && (
                            <span className="rounded-full bg-zinc-100 px-2 py-0.2 text-[10px] font-semibold text-zinc-600 border border-zinc-200">
                              {lesson.duration}
                            </span>
                          )}
                          {lesson.videoUrl ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.2 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              Video Ready
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-50 px-2 py-0.2 text-[10px] font-bold text-amber-700 border border-amber-200">
                              Draft
                            </span>
                          )}
                        </div>
                        {lesson.notes && (
                          <p className="mt-0.5 text-[11px] text-zinc-500 line-clamp-1 truncate">
                            {lesson.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => startEditLesson(lesson)}
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition cursor-pointer"
                          title="Edit Lesson"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (course && confirm(`Delete "${lesson.title}"?`)) {
                              deleteLesson(course.id, lesson.id);
                            }
                          }}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                          title="Delete Lesson"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* CREATE / EDIT COURSE MODAL */}
      <Modal
        open={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        title={isEditingCourse ? "Edit Course Settings" : "Create New Course"}
        wide
      >
        <div className="space-y-4">
          <Field label="Course Title *">
            <input
              className={inputClass}
              placeholder="e.g. AI Autonomous Agents Architecture"
              value={courseForm.title}
              onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))}
            />
          </Field>

          <Field label="Course Description">
            <textarea
              className={inputClass}
              rows={3}
              placeholder="Summary of skills and modules taught in this course..."
              value={courseForm.description}
              onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Unlock Level (1-9)">
              <input
                type="number"
                min={1}
                max={9}
                className={inputClass}
                placeholder="1"
                value={courseForm.unlockLevel}
                onChange={(e) => setCourseForm((f) => ({ ...f, unlockLevel: e.target.value }))}
              />
            </Field>

            <Field label="Category Badge">
              <input
                className={inputClass}
                placeholder="e.g. MASTERCLASS"
                value={courseForm.badge}
                onChange={(e) => setCourseForm((f) => ({ ...f, badge: e.target.value }))}
              />
            </Field>

            <Field label="Standalone Price ($)">
              <input
                type="number"
                min={0}
                className={inputClass}
                placeholder="0"
                value={courseForm.price}
                onChange={(e) => setCourseForm((f) => ({ ...f, price: e.target.value }))}
              />
            </Field>
          </div>

          {/* Background / Cover Image & Theme Customization */}
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
                  value={courseForm.thumbnail}
                  onChange={(e) => setCourseForm((f) => ({ ...f, thumbnail: e.target.value }))}
                />
              </Field>

              <Field label="Or Upload Image Directly">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white p-2.5 text-xs font-semibold text-zinc-600 hover:border-primary hover:bg-primary/5 hover:text-primary transition min-h-[42px] shadow-2xs">
                  <Upload size={14} className="shrink-0" />
                  {courseImageUploading ? (
                    <span className="text-primary font-bold">Uploading Image...</span>
                  ) : courseForm.thumbnail ? (
                    <span className="truncate max-w-[200px] text-zinc-700">Change Image File</span>
                  ) : (
                    "Upload PNG / JPG / WebP"
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={courseImageUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onUploadCourseImage(file);
                    }}
                  />
                </label>
              </Field>
            </div>

            {courseForm.thumbnail && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-emerald-700 font-medium">✓ Custom background cover image active</span>
                <button
                  type="button"
                  onClick={() => setCourseForm((f) => ({ ...f, thumbnail: "" }))}
                  className="text-[11px] font-bold text-red-500 hover:text-red-700 hover:underline"
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
                  value={courseForm.watermark}
                  onChange={(e) => setCourseForm((f) => ({ ...f, watermark: e.target.value }))}
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
                    const isSelected = courseForm.glowColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCourseForm((f) => ({ ...f, glowColor: color }))}
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
                {courseForm.thumbnail ? (
                  <div
                    className="relative h-36 w-full overflow-hidden p-4 flex flex-col items-center justify-center select-none bg-cover bg-center"
                    style={{ backgroundImage: `url(${courseForm.thumbnail})` }}
                  >
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px]" />
                    {courseForm.watermark && (
                      <div className="absolute inset-x-0 bottom-2 text-center font-mono text-xl font-black text-white/30 tracking-tight select-none">
                        {courseForm.watermark}
                      </div>
                    )}
                    <div className="relative z-10 flex flex-col items-center justify-center text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/85 text-white shadow-xl border border-white/25">
                        <Lock size={16} />
                      </div>
                      <span className="mt-1 text-xs font-extrabold text-white drop-shadow-md">
                        {courseForm.isPremiumOnly
                          ? "👑 Unlock with VIP"
                          : `Unlock at Level ${courseForm.unlockLevel || 1}`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-36 w-full overflow-hidden bg-black p-4 flex flex-col items-center justify-center select-none">
                    <div
                      className={`absolute h-24 w-24 rounded-full blur-2xl pointer-events-none ${
                        courseForm.glowColor === "green"
                          ? "bg-emerald-500/30"
                          : courseForm.glowColor === "blue"
                          ? "bg-sky-500/30"
                          : courseForm.glowColor === "orange"
                          ? "bg-orange-500/35"
                          : courseForm.glowColor === "red"
                          ? "bg-rose-500/30"
                          : courseForm.glowColor === "purple"
                          ? "bg-purple-500/35"
                          : "bg-amber-400/25"
                      }`}
                    />
                    <div className="absolute inset-x-0 bottom-2 text-center font-mono text-xl font-black text-white/15 tracking-tight select-none">
                      {courseForm.watermark || `> ${courseForm.title ? courseForm.title.toLowerCase().replace(/\\s+/g, "-") : "course"}_`}
                    </div>
                    <div className="relative z-10 flex flex-col items-center justify-center text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950/90 border-2 border-white/40 text-white shadow-xl">
                        <Lock size={16} />
                      </div>
                      <span className="mt-1 text-xs font-extrabold text-white drop-shadow-md">
                        {courseForm.isPremiumOnly
                          ? "👑 Unlock with VIP"
                          : `Unlock at Level ${courseForm.unlockLevel || 1}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={courseForm.isPremiumOnly}
                onChange={(e) => setCourseForm((f) => ({ ...f, isPremiumOnly: e.target.checked }))}
                className="h-4 w-4 rounded-md border-zinc-300 text-primary"
              />
              <div className="flex items-center gap-1.5">
                <Crown size={14} className="text-amber-500" />
                <span className="text-xs font-bold text-zinc-900">👑 VIP Only Course</span>
              </div>
            </label>
            <p className="text-[11px] text-zinc-500 mt-1 pl-6.5">
              Requires active VIP membership or individual purchase to watch lessons.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
            <button
              type="button"
              onClick={() => setShowCourseModal(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition"
            >
              Cancel
            </button>
            <PrimaryButton disabled={busy || courseImageUploading} onClick={onSaveCourse} className="rounded-xl px-5 py-2.5 text-xs font-bold">
              {busy ? "Saving..." : isEditingCourse ? "Save Course Changes" : "Create Course"}
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
