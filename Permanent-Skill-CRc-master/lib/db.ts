import fs from "fs";
import os from "os";
import path from "path";
import { COURSE_CATALOG_IDS, OLD_COURSE_IDS, createClassroomCourses, createSeed } from "./seed";
import {
  fetchDatabaseFromSupabase,
  syncUserToSupabase,
  deleteUserFromSupabase,
  syncPostToSupabase,
  deletePostFromSupabase,
  syncCommentToSupabase,
  deleteCommentFromSupabase,
  syncCourseToSupabase,
  deleteCourseFromSupabase,
  syncProjectToSupabase,
  deleteProjectFromSupabase,
  syncProgressToSupabase,
  syncMessageToSupabase,
  syncNotificationToSupabase,
  syncReviewToSupabase,
  syncSaleToSupabase,
  syncSessionToSupabase,
  deleteSessionFromSupabase,
  syncVideoResourceToSupabase,
  deleteVideoResourceFromSupabase,
} from "./supabase-db";
import type { Database, Lesson, User } from "./types";

const legacyFile = path.join(process.cwd(), "data", "db.json");
const dir = path.join(process.env.VERCEL ? os.tmpdir() : os.homedir(), ".permanent-skill-strategy");
const file = path.join(dir, "db.json");
const DEMO_VIDEO = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";

let cache: Database | null = null;
let isInitialFetchDone = false;

function persist(db: Database) {
  cache = db;
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db), "utf8");
    fs.renameSync(tmp, file);
  } catch {
    // Memory-only fallback
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
  const seedCommunities = createSeed().communities;
  for (const sc of seedCommunities) {
    if (!db.communities.some((c) => c.id === sc.id || c.slug === sc.slug)) {
      db.communities.push(sc);
      changed = true;
    }
  }
  for (const comm of db.communities || []) {
    const match = seedCommunities.find((c) => c.id === comm.id || c.slug === comm.slug);
    if (match && comm.description?.includes("ecommerce")) {
      comm.description = match.description;
      comm.name = match.name;
      changed = true;
    }
  }
  const adminUser = db.users.find((u) => u.id === "u-admin");
  if (adminUser && adminUser.bio?.includes("Ecommerce Email Marketing")) {
    adminUser.bio = "Founder of Permanent Skills Academy. Helping builders, founders, and students master high-value digital systems.";
    adminUser.name = "Permanent Skills Admin";
    adminUser.username = "pss-admin";
    changed = true;
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
  const seedCourses = createClassroomCourses();
  for (const course of db.courses) {
    const match = seedCourses.find((c) => c.id === course.id);
    if (match) {
      if (
        course.title !== match.title ||
        course.description !== match.description ||
        course.unlockLevel !== match.unlockLevel ||
        course.watermark !== match.watermark ||
        course.glowColor !== match.glowColor ||
        course.isPremiumOnly !== match.isPremiumOnly
      ) {
        course.title = match.title;
        course.slug = match.slug;
        course.description = match.description;
        course.unlockLevel = match.unlockLevel;
        course.isPremiumOnly = match.isPremiumOnly;
        course.watermark = match.watermark;
        course.glowColor = match.glowColor;
        course.accent = match.accent;
        course.badge = match.badge;
        course.bannerBrand = match.bannerBrand;
        course.bannerSubtitle = match.bannerSubtitle;
        course.bannerTitle = match.bannerTitle;
        course.price = match.price;
        changed = true;
      }
      if (!course.lessons || course.lessons.length === 0 || course.lessons.length < match.lessons.length) {
        course.lessons = match.lessons;
        changed = true;
      }
    }
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
  } else {
    const seedProjects = createSeed().projects;
    for (const sp of seedProjects) {
      if (!db.projects.some((p) => p.id === sp.id)) {
        db.projects.push(sp);
        changed = true;
      }
    }
  }
  if (!db.videoResources || db.videoResources.length === 0) {
    db.videoResources = createSeed().videoResources || [];
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

// Background async loader from Supabase
export async function refreshFromSupabase(): Promise<Database> {
  const remoteDb = await fetchDatabaseFromSupabase();
  if (remoteDb && remoteDb.users.length > 0) {
    cache = remoteDb;
    persist(remoteDb);
    isInitialFetchDone = true;
    return remoteDb;
  }
  return readDb();
}

export function readDb(): Database {
  if (cache) return cache;
  const disk = loadFromDisk();
  cache = disk ?? createSeed();
  if (!disk) persist(cache);

  // Trigger Supabase sync if not yet loaded from remote
  if (!isInitialFetchDone) {
    refreshFromSupabase().catch(() => {});
  }

  return cache;
}

export function writeDb(db: Database) {
  persist(db);
}

export async function updateDb<T>(mutator: (db: Database) => T): Promise<T> {
  const db = readDb();
  const prevUsers = new Map(db.users.map((u) => [u.id, u]));
  const prevPosts = new Map(db.posts.map((p) => [p.id, p]));
  const prevComments = new Map(db.comments.map((c) => [c.id, c]));
  const prevCourses = new Map(db.courses.map((c) => [c.id, c]));
  const prevProjects = new Map(db.projects.map((p) => [p.id, p]));
  const prevVideoResources = new Map((db.videoResources || []).map((v) => [v.id, v]));

  const result = mutator(db);
  persist(db);

  // Sync mutations reliably to Supabase
  try {
    const promises: Promise<unknown>[] = [];

    // 1. Sync updated / new users
    const currentUserIds = new Set(db.users.map((u) => u.id));
    for (const user of db.users) {
      const prev = prevUsers.get(user.id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(user)) {
        promises.push(syncUserToSupabase(user));
      }
    }
    // Check deleted users
    for (const [prevId] of prevUsers) {
      if (!currentUserIds.has(prevId)) {
        promises.push(deleteUserFromSupabase(prevId));
      }
    }

    // 2. Sync updated / new posts
    const currentPostIds = new Set(db.posts.map((p) => p.id));
    for (const post of db.posts) {
      const prev = prevPosts.get(post.id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(post)) {
        promises.push(syncPostToSupabase(post));
      }
    }
    // Check deleted posts
    for (const [prevId] of prevPosts) {
      if (!currentPostIds.has(prevId)) {
        promises.push(deletePostFromSupabase(prevId));
      }
    }

    // 3. Sync updated / new comments
    const currentCommentIds = new Set(db.comments.map((c) => c.id));
    for (const comment of db.comments) {
      const prev = prevComments.get(comment.id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(comment)) {
        promises.push(syncCommentToSupabase(comment));
      }
    }
    // Check deleted comments
    for (const [prevId] of prevComments) {
      if (!currentCommentIds.has(prevId)) {
        promises.push(deleteCommentFromSupabase(prevId));
      }
    }

    // 4. Sync courses
    const currentCourseIds = new Set(db.courses.map((c) => c.id));
    for (const course of db.courses) {
      const prev = prevCourses.get(course.id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(course)) {
        promises.push(syncCourseToSupabase(course));
      }
    }
    for (const [prevId] of prevCourses) {
      if (!currentCourseIds.has(prevId)) {
        promises.push(deleteCourseFromSupabase(prevId));
      }
    }

    // 5. Sync projects
    const currentProjectIds = new Set(db.projects.map((p) => p.id));
    for (const project of db.projects) {
      const prev = prevProjects.get(project.id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(project)) {
        promises.push(syncProjectToSupabase(project));
      }
    }
    for (const [prevId] of prevProjects) {
      if (!currentProjectIds.has(prevId)) {
        promises.push(deleteProjectFromSupabase(prevId));
      }
    }

    // 6. Progress
    for (const prog of db.progress) {
      promises.push(syncProgressToSupabase(prog));
    }

    // 7. Reviews
    for (const rev of db.reviews) {
      promises.push(syncReviewToSupabase(rev));
    }

    // 8. Video Resources
    const currentVideoIds = new Set((db.videoResources || []).map((v) => v.id));
    for (const vid of db.videoResources || []) {
      const prev = prevVideoResources.get(vid.id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(vid)) {
        promises.push(syncVideoResourceToSupabase(vid));
      }
    }
    for (const [prevId] of prevVideoResources) {
      if (!currentVideoIds.has(prevId)) {
        promises.push(deleteVideoResourceFromSupabase(prevId));
      }
    }

    // 9. Sales
    for (const sale of db.sales || []) {
      promises.push(syncSaleToSupabase(sale));
    }

    // Await all Supabase database mutations
    await Promise.allSettled(promises);
  } catch (err) {
    console.error("Supabase sync error in updateDb:", err);
  }

  return result;
}

export function upsertUser(user: User) {
  const db = readDb();
  const index = db.users.findIndex((row) => row.id === user.id || row.email.toLowerCase() === user.email.toLowerCase());
  if (index >= 0) db.users[index] = { ...db.users[index], ...user };
  else db.users.push(user);
  persist(db);

  // Sync to Supabase
  syncUserToSupabase(user).catch(() => {});

  return db.users.find((row) => row.id === user.id) ?? user;
}
