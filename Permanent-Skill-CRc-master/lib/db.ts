import fs from "fs";
import os from "os";
import path from "path";
import { COURSE_CATALOG_IDS, OLD_COURSE_IDS, createClassroomCourses, createSeed } from "./seed";
import type { Database, Lesson, User } from "./types";

const legacyFile = path.join(process.cwd(), "data", "db.json");
const dir = path.join(process.env.VERCEL ? os.tmpdir() : os.homedir(), ".permanent-skill-strategy");
const file = path.join(dir, "db.json");
const DEMO_VIDEO = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";

let cache: Database | null = null;

function persist(db: Database) {
  cache = db;
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db), "utf8");
    fs.renameSync(tmp, file);
  } catch {
    // Memory-only fallback when the filesystem is read-only (Vercel).
  }
}

function normalizeLesson(raw: Lesson & { content?: string }): Lesson {
  const notes = raw.notes || raw.content || "";
  return {
    id: raw.id,
    module: raw.module || "",
    title: raw.title,
    duration: raw.duration || "",
    notes,
    videoUrl: raw.videoUrl || DEMO_VIDEO,
    videoTitle: raw.videoTitle || raw.title,
  };
}

function migrate(db: Database) {
  let changed = false;
  if (!db.communities || db.communities.length === 0) {
    db.communities = createSeed().communities;
    changed = true;
  }
  const seedUsers = createSeed().users;
  for (const user of db.users) {
    if (!user.ipAddress) {
      const match = seedUsers.find((s) => s.id === user.id);
      user.ipAddress = match?.ipAddress || "192.168.1.50";
      changed = true;
    }
  }
  const catalogIds = COURSE_CATALOG_IDS as readonly string[];
  const hasOld = db.courses.some((course) => OLD_COURSE_IDS.includes(course.id));
  const missingNew = catalogIds.some((id) => !db.courses.some((course) => course.id === id));
  if (hasOld || missingNew) {
    const kept = new Map(db.courses.filter((course) => catalogIds.includes(course.id)).map((course) => [course.id, course]));
    db.courses = createClassroomCourses().map((course) => kept.get(course.id) || course);
    db.progress = db.progress.filter((row) => catalogIds.includes(row.courseId));
    changed = true;
  }
  for (const course of db.courses) {
    const next = course.lessons.map((item) => normalizeLesson(item as Lesson & { content?: string }));
    if (JSON.stringify(next) !== JSON.stringify(course.lessons)) {
      course.lessons = next;
      changed = true;
    }
  }
  for (const comment of db.comments || []) {
    if (!comment.status) {
      comment.status = "approved";
      changed = true;
    }
  }
  if (!db.projects || db.projects.length === 0) {
    db.projects = createSeed().projects;
    changed = true;
  }
  if (changed) persist(db);
}

function loadFromDisk(): Database | null {
  try {
    if (fs.existsSync(legacyFile) && !fs.existsSync(file)) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(legacyFile, file);
    }
    if (!fs.existsSync(file)) return null;
    const db = JSON.parse(fs.readFileSync(file, "utf8")) as Database;
    migrate(db);
    return db;
  } catch {
    return null;
  }
}

export function readDb(): Database {
  if (cache) return cache;
  const disk = loadFromDisk();
  cache = disk ?? createSeed();
  if (!disk) persist(cache);
  return cache;
}

export function writeDb(db: Database) {
  persist(db);
}

export function updateDb<T>(mutator: (db: Database) => T): Promise<T> {
  const db = readDb();
  const result = mutator(db);
  persist(db);
  return Promise.resolve(result);
}

export function upsertUser(user: User) {
  const db = readDb();
  const index = db.users.findIndex((row) => row.id === user.id || row.email.toLowerCase() === user.email.toLowerCase());
  if (index >= 0) db.users[index] = { ...db.users[index], ...user };
  else db.users.push(user);
  persist(db);
  return db.users.find((row) => row.id === user.id) ?? user;
}
