"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Card, Field, PrimaryButton, inputClass } from "@/components/ui";
import type { Lesson } from "@/lib/types";

const emptyLesson = {
  module: "",
  title: "",
  videoTitle: "",
  videoUrl: "",
  duration: "",
  notes: "",
};

export function AdminClassroom() {
  const { courses, saveCourse, saveLesson, deleteLesson } = useApp();
  const [courseId, setCourseId] = useState(courses[0]?.id || "");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyLesson);
  const [courseForm, setCourseForm] = useState({ title: "", description: "", unlockLevel: 1 });
  const [showCourse, setShowCourse] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");

  const course = courses.find((c) => c.id === courseId) || courses[0];
  const modules = useMemo(() => {
    if (!course) return [];
    return [...new Set(course.lessons.map((l) => l.module).filter(Boolean))];
  }, [course]);

  useEffect(() => {
    if (!courses.length) return;
    if (!courses.some((c) => c.id === courseId)) {
      setCourseId(courses[0].id);
    }
  }, [courses, courseId]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startEdit(lesson: Lesson) {
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
    setMessage("");
  }

  function resetLessonForm() {
    setEditingId(null);
    setForm(emptyLesson);
    setFileName("");
  }

  async function onUpload(file: File) {
    setBusy(true);
    setMessage("Uploading video...");
    const data = new FormData();
    data.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: data });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      setMessage(json.error || "Upload failed.");
      return;
    }
    set("videoUrl", json.url);
    setFileName(file.name);
    setMessage("Video uploaded. Save the lesson to publish it.");
  }

  async function onSaveLesson() {
    if (!course) return;
    setBusy(true);
    const result = await saveLesson({
      courseId: course.id,
      lessonId: editingId || undefined,
      module: form.module,
      title: form.title,
      videoTitle: form.videoTitle || form.title,
      videoUrl: form.videoUrl,
      duration: form.duration,
      notes: form.notes,
    });
    setBusy(false);
    setMessage(result.ok ? "Lesson saved. Members can watch it in Classroom." : result.error || "Could not save.");
    if (result.ok) resetLessonForm();
  }

  async function onSaveCourse() {
    setBusy(true);
    const result = await saveCourse({
      title: courseForm.title,
      description: courseForm.description,
      unlockLevel: Number(courseForm.unlockLevel) || 1,
    });
    setBusy(false);
    if (result.ok) {
      setMessage("Course created. Add a video below.");
      setShowCourse(false);
      setCourseForm({ title: "", description: "", unlockLevel: 1 });
      if (result.id) setCourseId(result.id);
    } else {
      setMessage(result.error || "Could not create course.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className={`${inputClass} relative z-10 max-w-sm`}
          value={course?.id || ""}
          onChange={(e) => {
            setCourseId(e.target.value);
            resetLessonForm();
          }}
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowCourse(!showCourse)}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
        >
          <Plus size={16} /> New course
        </button>
      </div>

      {showCourse && (
        <Card className="space-y-3 p-5">
          <h3 className="font-semibold">New course</h3>
          <Field label="Course title">
            <input className={inputClass} value={courseForm.title} onChange={(e) => setCourseForm((s) => ({ ...s, title: e.target.value }))} />
          </Field>
          <Field label="Description">
            <textarea className={`${inputClass} min-h-[70px]`} value={courseForm.description} onChange={(e) => setCourseForm((s) => ({ ...s, description: e.target.value }))} />
          </Field>
          <Field label="Unlock at level">
            <input
              type="number"
              min={1}
              max={9}
              className={inputClass}
              value={courseForm.unlockLevel}
              onChange={(e) => setCourseForm((s) => ({ ...s, unlockLevel: Number(e.target.value) }))}
            />
          </Field>
          <PrimaryButton disabled={busy} onClick={onSaveCourse}>
            Create course
          </PrimaryButton>
        </Card>
      )}

      <Card className="relative overflow-visible p-5">
        <h3 className="mb-4 text-lg font-semibold">{editingId ? "Edit video lesson" : "Add video lesson"}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Module / section">
            <input
              className={inputClass}
              placeholder="e.g. Foundations"
              value={form.module}
              onChange={(e) => set("module", e.target.value)}
              autoComplete="off"
            />
            {modules.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {modules.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => set("module", name)}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      form.module === name ? "bg-primary text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </Field>
          <Field label="Duration">
            <input className={inputClass} placeholder="e.g. 12 min" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
          </Field>
          <Field label="Video title">
            <input className={inputClass} placeholder="Part 1: Research" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Display title (optional)">
            <input className={inputClass} placeholder="Shown above the player" value={form.videoTitle} onChange={(e) => set("videoTitle", e.target.value)} />
          </Field>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Video URL (YouTube, Vimeo, or MP4 link)">
            <input
              className={inputClass}
              placeholder="https://youtube.com/watch?v=..."
              value={form.videoUrl}
              onChange={(e) => set("videoUrl", e.target.value)}
              autoComplete="off"
            />
          </Field>
          <Field label="Or upload a video file">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 px-3 py-2.5 text-sm text-zinc-600 hover:border-primary hover:text-primary">
              <Upload size={16} />
              {fileName || "Choose MP4 / WebM / MOV"}
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
        <div className="mt-3">
          <Field label="Video notes">
            <textarea
              className={`${inputClass} min-h-[140px]`}
              placeholder={"Lesson notes members will see under the video.\nUse - for bullets and [label](https://link) for links."}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-4 flex gap-2">
          <PrimaryButton disabled={busy} onClick={onSaveLesson}>
            {busy ? "Saving..." : editingId ? "Update lesson" : "Add lesson"}
          </PrimaryButton>
          {editingId && (
            <button type="button" onClick={resetLessonForm} className="rounded-lg px-4 py-2 text-sm text-zinc-500">
              Cancel
            </button>
          )}
        </div>
        {message && <p className="mt-3 text-sm text-primary">{message}</p>}
      </Card>

      <Card>
        <div className="border-b border-zinc-100 px-5 py-3 font-semibold">Lessons in {course?.title}</div>
        {course?.lessons.length === 0 && <p className="p-5 text-sm text-zinc-500">No lessons yet. Add a video above.</p>}
        {course?.lessons.map((lesson) => (
          <div key={lesson.id} className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-3 last:border-0">
            <div>
              {lesson.module ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{lesson.module}</p>
              ) : null}
              <p className="font-medium">{lesson.title}</p>
              <p className="text-xs text-zinc-500">{lesson.duration || "No duration"} · {lesson.videoUrl ? "Video attached" : "No video"}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => startEdit(lesson)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100" title="Edit">
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (course && confirm("Delete this lesson?")) deleteLesson(course.id, lesson.id);
                }}
                className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
