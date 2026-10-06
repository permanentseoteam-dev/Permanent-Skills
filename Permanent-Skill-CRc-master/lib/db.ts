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
  deleteReviewFromSupabase,
  syncSaleToSupabase,
  syncSessionToSupabase,
  deleteSessionFromSupabase,
  syncVideoResourceToSupabase,
  deleteVideoResourceFromSupabase,
  syncCommunityToSupabase,
  deleteCommunityFromSupabase,
} from "./supabase-db";
import type { Database, Lesson, User } from "./types";

const legacyFile = path.join(process.cwd(), "data", "db.json");
const dir = path.join(process.env.VERCEL ? os.tmpdir() : os.homedir(), ".permanent-skill-strategy");
const file = path.join(dir, "db.json");
const DEMO_VIDEO = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";

// Graceful lifecycle and shutdown handler for Node.js process managers (Hostinger, PM2, Vercel)
if (typeof process !== "undefined" && typeof process.on === "function") {
  const isBenignShutdown = (err: any) => {
    const msg = String(err?.message || "");
    const code = String(err?.code || "");
    const stack = String(err?.stack || "");
    return (
      msg.includes("Server is not running") ||
      msg.includes("ERR_SERVER_NOT_RUNNING") ||
      stack.includes("Server is not running") ||
      code === "ERR_SERVER_NOT_RUNNING" ||
      code === "ECONNRESET" ||
      code === "EPIPE" ||
      code === "UND_ERR_SOCKET"
    );
  };

  process.on("uncaughtException", (err: any) => {
    if (isBenignShutdown(err)) return;
    console.error("Uncaught server exception:", err);
  });

  process.on("unhandledRejection", (reason: any) => {
    if (isBenignShutdown(reason)) return;
    console.error("Unhandled server rejection:", reason);
  });
}

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
  const managerUser = db.users.find((u) => u.id === "u-manager" || u.email === "manager@permanentseo.com");
  if (managerUser && managerUser.role !== "manager") {
    managerUser.role = "manager";
    changed = true;
  }
  const jackUser = db.users.find((u) => u.email?.toLowerCase().trim() === "jack212321@gmail.com");
  if (jackUser && jackUser.role !== "admin") {
    jackUser.role = "admin";
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
  if (!db.users || db.users.length === 0) {
    db.users = createSeed().users;
    changed = true;
  } else {
    // Only guarantee root admin exists
    const rootAdmin = createSeed().users.find((u) => u.id === "u-admin");
    if (rootAdmin && !db.users.some((u) => u.id === rootAdmin.id)) {
      db.users.unshift(rootAdmin);
      changed = true;
    }
    // Deduplicate users by ID and email (preserving approved status and most complete profiles)
    const seenUserIds = new Set<string>();
    const seenUserEmails = new Set<string>();
    const uniqueUsers: User[] = [];
    for (const u of db.users) {
      const emailKey = u.email?.trim().toLowerCase();
      if (seenUserIds.has(u.id) || (emailKey && seenUserEmails.has(emailKey))) {
        changed = true;
        continue;
      }
      seenUserIds.add(u.id);
      if (emailKey) seenUserEmails.add(emailKey);
      uniqueUsers.push(u);
    }
    db.users = uniqueUsers;

    // Transition any legacy mock pending seed users to approved
    const legacyMockPendingIds = new Set([
      "u-omar",
      "u-alex",
      "u-elena",
      "u-tariq",
      "u-lucas",
      "u-maya",
      "u-carlos",
    ]);
    for (const u of db.users) {
      if (legacyMockPendingIds.has(u.id) && u.status === "pending") {
        u.status = "approved";
        changed = true;
      }
      if (u.id === "u-ayaan" && u.role !== "team_member") {
        u.role = "team_member";
        changed = true;
      }
      if (u.id === "u-manager" && u.role === "manager") {
        u.role = "member";
        changed = true;
      }
      if (!u.joinedCommunityIds || u.joinedCommunityIds.length === 0) {
        if (u.role === "team_member") {
          u.joinedCommunityIds = ["comm-ai-architects", "comm-team"];
        } else if (u.role === "admin" || u.role === "manager") {
          u.joinedCommunityIds = ["comm-ai-architects", "comm-students", "comm-team"];
        } else {
          u.joinedCommunityIds = ["comm-ai-architects"];
        }
        changed = true;
      }
      if (!u.purchasedCommunityIds) {
        u.purchasedCommunityIds = [];
        changed = true;
      }
    }
  }
  if (!db.comments || db.comments.length === 0) {
    db.comments = createSeed().comments;
    changed = true;
  } else {
    const seedComments = createSeed().comments;
    for (const sc of seedComments) {
      if (!db.comments.some((c) => c.id === sc.id)) {
        db.comments.push(sc);
        changed = true;
      }
    }
    for (const comment of db.comments) {
      if (!comment.status) {
        comment.status = "approved";
        changed = true;
      }
      // If legacy seeded mock comments are still marked pending, transition them to approved
      if (
        (comment.id.startsWith("c-pending-") ||
          comment.id === "c-vercel-user-pending" ||
          comment.id === "c-les-4") &&
        comment.status === "pending"
      ) {
        comment.status = "approved";
        changed = true;
      }
    }
  }
  for (const post of db.posts || []) {
    if (!post.status) {
      post.status = "approved";
      changed = true;
    }
    if (post.id === "p-team-welcome" && post.category !== "team") {
      post.category = "team";
      post.communityId = "comm-team";
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
  if (!db.events) {
    db.events = [];
    changed = true;
  }
  if (!db.videoResources || db.videoResources.length === 0) {
    db.videoResources = createSeed().videoResources || [];
    changed = true;
  }
  if (!db.sales || db.sales.length === 0) {
    db.sales = createSeed().sales;
    changed = true;
  } else {
    for (const s of db.sales) {
      if (s.amount === 9) {
        if (s.userId === "u-ayaan" || s.userId === "u-daniel") {
          s.amount = 99;
          s.plan = "Business Clarity Course ($99)";
          changed = true;
        } else if (s.userId === "u-priya") {
          s.amount = 149;
          s.plan = "Learn to Build Apps ($149)";
          changed = true;
        } else if (s.userId === "u-james") {
          s.amount = 199;
          s.plan = "The Daily Pulse 🔥 VIP Mastermind ($199)";
          changed = true;
        } else if (s.userId === "u-wei") {
          s.amount = 89;
          s.plan = "n8n Course + Templates ($89)";
          changed = true;
        } else if (s.userId === "u-amira") {
          s.amount = 129;
          s.plan = "Make.com Course + Templates ($129)";
          changed = true;
        }
      }
    }
  }
  if (!db.notifications || db.notifications.length === 0) {
    db.notifications = createSeed().notifications;
    changed = true;
  } else {
    const seedNotifs = createSeed().notifications;
    for (const sn of seedNotifs) {
      const existing = db.notifications.find((n) => n.id === sn.id);
      if (!existing) {
        db.notifications.push(sn);
        changed = true;
      } else if (existing.link === "/community" && sn.link !== "/community") {
        existing.link = sn.link;
        changed = true;
      }
    }
  }
  if (db.progress && db.progress.length > 0) {
    for (const prog of db.progress) {
      if (prog.completedLessonIds && prog.completedLessonIds.length === 1 && prog.completedLessonIds[0] === "l-eem-1-1") {
        prog.completedLessonIds = [];
        changed = true;
      }
    }
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

let inFlightFetch: Promise<Database | null> | null = null;

export async function ensureDbLoaded(): Promise<Database> {
  if (isInitialFetchDone && cache) return cache;
  if (!inFlightFetch) {
    inFlightFetch = fetchDatabaseFromSupabase()
      .then((remoteDb) => {
        if (remoteDb && remoteDb.users.length > 0) {
          migrate(remoteDb);
          cache = remoteDb;
          persist(remoteDb);
          isInitialFetchDone = true;
          return remoteDb;
        }
        return null;
      })
      .catch((err) => {
        console.error("Error in ensureDbLoaded:", err);
        return null;
      })
      .finally(() => {
        inFlightFetch = null;
      });
  }
  const remote = await inFlightFetch;
  if (remote) return remote;
  return readDb();
}

// Background async loader from Supabase
export async function refreshFromSupabase(): Promise<Database> {
  const remoteDb = await fetchDatabaseFromSupabase();
  if (remoteDb && remoteDb.users.length > 0) {
    const prevCommentIds = new Set(remoteDb.comments.map((c) => c.id));
    migrate(remoteDb);
    cache = remoteDb;
    persist(remoteDb);
    isInitialFetchDone = true;

    // Sync newly migrated comments and mock users to Supabase in background
    for (const comment of remoteDb.comments) {
      if (!prevCommentIds.has(comment.id)) {
        syncCommentToSupabase(comment).catch(() => {});
      }
    }
    const legacyMockPendingIds = new Set([
      "u-omar",
      "u-alex",
      "u-elena",
      "u-tariq",
      "u-lucas",
      "u-maya",
      "u-carlos",
    ]);
    for (const u of remoteDb.users) {
      if (legacyMockPendingIds.has(u.id)) {
        syncUserToSupabase(u).catch(() => {});
      }
    }

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
  if (!isInitialFetchDone) {
    await ensureDbLoaded().catch(() => {});
  }
  const db = readDb();
  const prevUsers = new Map(db.users.map((u) => [u.id, JSON.stringify(u)]));
  const prevPosts = new Map(db.posts.map((p) => [p.id, JSON.stringify(p)]));
  const prevComments = new Map(db.comments.map((c) => [c.id, JSON.stringify(c)]));
  const prevCourses = new Map(db.courses.map((c) => [c.id, JSON.stringify(c)]));
  const prevProjects = new Map(db.projects.map((p) => [p.id, JSON.stringify(p)]));
  const prevReviews = new Map((db.reviews || []).map((r) => [r.id, JSON.stringify(r)]));
  const prevVideoResources = new Map((db.videoResources || []).map((v) => [v.id, JSON.stringify(v)]));
  const prevCommunities = new Map((db.communities || []).map((c) => [c.id, JSON.stringify(c)]));
  const prevNotifications = new Map((db.notifications || []).map((n) => [n.id, JSON.stringify(n)]));
  const prevMessages = new Map((db.messages || []).map((m) => [m.id, JSON.stringify(m)]));
  const prevSales = new Map((db.sales || []).map((s) => [s.id, JSON.stringify(s)]));

  const result = mutator(db);
  persist(db);

  // Sync mutations reliably to Supabase
  try {
    const promises: Promise<unknown>[] = [];

    // 1. Sync updated / new users
    const currentUserIds = new Set(db.users.map((u) => u.id));
    for (const user of db.users) {
      const prevJson = prevUsers.get(user.id);
      if (!prevJson || prevJson !== JSON.stringify(user)) {
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
      const prevJson = prevPosts.get(post.id);
      if (!prevJson || prevJson !== JSON.stringify(post)) {
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
      const prevJson = prevComments.get(comment.id);
      if (!prevJson || prevJson !== JSON.stringify(comment)) {
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
      const prevJson = prevCourses.get(course.id);
      if (!prevJson || prevJson !== JSON.stringify(course)) {
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
      const prevJson = prevProjects.get(project.id);
      if (!prevJson || prevJson !== JSON.stringify(project)) {
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
    const currentReviewIds = new Set((db.reviews || []).map((r) => r.id));
    for (const rev of db.reviews || []) {
      const prevJson = prevReviews.get(rev.id);
      if (!prevJson || prevJson !== JSON.stringify(rev)) {
        promises.push(syncReviewToSupabase(rev));
      }
    }
    for (const [prevId] of prevReviews) {
      if (!currentReviewIds.has(prevId)) {
        promises.push(deleteReviewFromSupabase(prevId));
      }
    }

    // 8. Video Resources
    const currentVideoIds = new Set((db.videoResources || []).map((v) => v.id));
    for (const vid of db.videoResources || []) {
      const prevJson = prevVideoResources.get(vid.id);
      if (!prevJson || prevJson !== JSON.stringify(vid)) {
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
      const prevJson = prevSales.get(sale.id);
      if (!prevJson || prevJson !== JSON.stringify(sale)) {
        promises.push(syncSaleToSupabase(sale));
      }
    }

    // 10. Communities
    const currentCommunityIds = new Set((db.communities || []).map((c) => c.id));
    for (const comm of db.communities || []) {
      const prevJson = prevCommunities.get(comm.id);
      if (!prevJson || prevJson !== JSON.stringify(comm)) {
        promises.push(syncCommunityToSupabase(comm));
      }
    }
    for (const [prevId] of prevCommunities) {
      if (!currentCommunityIds.has(prevId)) {
        promises.push(deleteCommunityFromSupabase(prevId));
      }
    }

    // 11. Notifications
    for (const notif of db.notifications || []) {
      const prevJson = prevNotifications.get(notif.id);
      if (!prevJson || prevJson !== JSON.stringify(notif)) {
        promises.push(syncNotificationToSupabase(notif));
      }
    }

    // 12. Messages
    for (const msg of db.messages || []) {
      const prevJson = prevMessages.get(msg.id);
      if (!prevJson || prevJson !== JSON.stringify(msg)) {
        promises.push(syncMessageToSupabase(msg));
      }
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
