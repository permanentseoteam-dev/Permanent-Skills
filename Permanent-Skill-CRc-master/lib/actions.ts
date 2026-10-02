"use server";

import { cookies, headers } from "next/headers";
import { randomBytes } from "crypto";
import { readDb, updateDb, upsertUser } from "./db";
import { hashPassword, verifyPassword } from "./password";
import { nextPathFor, signPayload, verifyPayload } from "./session";
import { slugify } from "./format";
import { getLevel } from "./levels";
import type {
  ActionResult,
  AppState,
  Application,
  Community,
  Lesson,
  PostCategory,
  PublicUser,
  Role,
  Status,
  User,
} from "./types";

const COOKIE = "pss_session";
const PROFILE_COOKIE = "pss_profile";
const ONLINE_MS = 8 * 60 * 1000;
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

type SessionPayload = { userId: string };

function token() {
  return randomBytes(24).toString("hex");
}

function affiliateCode(name: string) {
  return `PSS-${slugify(name).replace(/-/g, "").slice(0, 8).toUpperCase()}${Math.floor(10 + Math.random() * 89)}`;
}

function isOnline(lastSeenAt: string) {
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_MS;
}

async function getClientIp(): Promise<string> {
  try {
    const jar = await headers();
    const forwarded = jar.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    const real = jar.get("x-real-ip");
    if (real) return real.trim();
  } catch {}
  return "127.0.0.1";
}

function publicUser(user: User, viewer?: User | null, activeUserIds?: Set<string>): PublicUser {
  const base: PublicUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    bio: user.bio,
    role: user.role,
    points: user.points,
    points7d: user.points7d,
    points30d: user.points30d,
    avatarColor: user.avatarColor,
    location: user.location,
    lat: user.lat,
    lng: user.lng,
    joinedAt: user.joinedAt,
    lastSeenAt: user.lastSeenAt,
    isOnline: isOnline(user.lastSeenAt),
    isPremium: user.isPremium,
    language: user.language,
  };
  if (viewer?.id === user.id || viewer?.role === "admin") {
    base.email = user.email;
    base.status = user.status;
    base.application = user.application;
    base.phone = user.phone;
    base.notes = user.notes;
    base.loginCount = user.loginCount;
    base.affiliateCode = user.affiliateCode;
    base.affiliateClicks = user.affiliateClicks;
    base.affiliateSignups = user.affiliateSignups;
    base.affiliateEarnings = user.affiliateEarnings;
    base.ipAddress = user.ipAddress || "127.0.0.1";
  }
  if (viewer?.role === "admin") {
    base.hasActiveSession = activeUserIds?.has(user.id) ?? false;
  }
  return base;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    secure: process.env.VERCEL === "1",
  };
}

async function writeAuthCookies(user: User) {
  const jar = await cookies();
  jar.set(COOKIE, signPayload({ userId: user.id } satisfies SessionPayload), cookieOptions(SESSION_MAX_AGE));
  jar.set(PROFILE_COOKIE, signPayload(user), cookieOptions(SESSION_MAX_AGE));
}

async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const session = verifyPayload<SessionPayload>(jar.get(COOKIE)?.value);
  if (!session?.userId) return null;

  const db = readDb();
  const existing = db.users.find((u) => u.id === session.userId);
  if (existing) return existing;

  const profile = verifyPayload<User>(jar.get(PROFILE_COOKIE)?.value);
  if (!profile || profile.id !== session.userId) return null;
  return upsertUser(profile);
}

async function setSession(userId: string) {
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return;
  await writeAuthCookies(user);
  await updateDb((d) => {
    d.sessions = d.sessions.filter((s) => s.userId !== userId);
    d.sessions.push({ token: `cookie:${userId}`, userId, createdAt: new Date().toISOString() });
  }).catch(() => undefined);
}

function uniqueUsername(users: User[], name: string, excludeId?: string) {
  const base = slugify(name) || "member";
  let username = `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
  while (users.some((u) => u.username === username && u.id !== excludeId)) {
    username = `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return username;
}

function award(user: User, amount: number) {
  user.points += amount;
  user.points7d += amount;
  user.points30d += amount;
}

const COLORS = ["#5051F9", "#0ea5e9", "#db2777", "#16a34a", "#ea580c", "#7c3aed", "#0891b2"];

export async function getAppState(): Promise<AppState> {
  const me = await currentUser();
  const empty: AppState = {
    user: null,
    users: [],
    posts: [],
    comments: [],
    courses: [],
    progress: [],
    events: [],
    messages: [],
    notifications: [],
    reviews: [],
    stats: null,
    sales: [],
    limited: false,
    communities: [],
    activeCommunityId: "comm-pss",
  };
  if (!me) return empty;

  const db = readDb();
  const activeUserIds = new Set(db.sessions.map((s) => s.userId));
  const approved = db.users.filter((u) => u.status === "approved" || u.role === "admin");
  const limited = me.role !== "admin" && me.status !== "approved";

  if (limited) {
    return {
      ...empty,
      user: publicUser(me, me, activeUserIds),
      limited: true,
      communities: db.communities || [],
      activeCommunityId: db.communities?.[0]?.id || "comm-pss",
    };
  }

  const visibleUsers = me.role === "admin" ? db.users : approved;
  const stats =
    me.role === "admin"
      ? {
          totalUsers: db.users.length,
          totalSales: db.sales.reduce((sum, s) => sum + s.amount, 0),
          totalLogins: db.users.reduce((sum, u) => sum + u.loginCount, 0),
          pendingCount: db.users.filter((u) => u.status === "pending").length,
        }
      : null;

  return {
    user: publicUser(me, me, activeUserIds),
    users: visibleUsers.map((u) => publicUser(u, me, activeUserIds)),
    posts: db.posts,
    comments: db.comments,
    courses: db.courses,
    progress: db.progress.filter((p) => p.userId === me.id || me.role === "admin"),
    events: db.events,
    messages: db.messages.filter((m) => m.senderId === me.id || m.receiverId === me.id),
    notifications: db.notifications.filter((n) => n.userId === me.id),
    reviews: db.reviews,
    stats,
    sales: me.role === "admin" ? db.sales : [],
    limited: false,
    communities: db.communities || [],
    activeCommunityId: db.communities?.[0]?.id || "comm-pss",
  };
}

export async function login(
  email: string,
  password: string,
  memberType?: "team" | "premium"
): Promise<ActionResult> {
  try {
    const normalized = email.trim().toLowerCase();
    const db = readDb();
    const user = db.users.find((u) => u.email.toLowerCase() === normalized);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return { ok: false, error: "Invalid email or password." };
    }
    if (user.status === "rejected") {
      return { ok: false, error: "This application was not approved. Contact support." };
    }

    const ip = await getClientIp();
    await updateDb((d) => {
      const u = d.users.find((x) => x.id === user.id);
      if (!u) return;
      u.loginCount += 1;
      u.lastSeenAt = new Date().toISOString();
      u.ipAddress = ip;
      if (memberType === "premium") {
        u.isPremium = true;
      } else if (memberType === "team") {
        u.isPremium = false;
      }
    });
    await setSession(user.id);
    return { ok: true, next: nextPathFor(user) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not log in.";
    return { ok: false, error: message };
  }
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  phone: string;
  notes: string;
  ref?: string;
}): Promise<ActionResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const notes = input.notes.trim();
  if (name.length < 2) return { ok: false, error: "Please enter your full name." };
  if (!email.includes("@")) return { ok: false, error: "Enter a valid email address." };
  if (phone.length < 7) return { ok: false, error: "Please enter a valid phone number." };
  if (notes.length < 10) return { ok: false, error: "Please tell us a little about yourself and your previous knowledge." };
  if (notes.length > 800) return { ok: false, error: "Please keep the note under 800 characters." };
  if (input.password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  try {

  const existing = readDb().users.find((u) => u.email.toLowerCase() === email);
  if (existing) {
    return { ok: false, error: "An account with this email already exists. Log in instead." };
  }

  const id = `u-${token().slice(0, 10)}`;
  const now = new Date().toISOString();
  const username = uniqueUsername(readDb().users, name);
  const ip = await getClientIp();

  await updateDb((db) => {
    let referredBy: string | undefined;
    if (input.ref) {
      const referrer = db.users.find((u) => u.affiliateCode.toLowerCase() === input.ref!.toLowerCase());
      if (referrer) {
        referredBy = referrer.id;
        referrer.affiliateSignups += 1;
      }
    }
    db.users.push({
      id,
      email,
      passwordHash: hashPassword(input.password),
      name,
      username,
      bio: notes.slice(0, 180),
      phone,
      notes,
      role: "member",
      status: "pending",
      points: 0,
      points7d: 0,
      points30d: 0,
      avatarColor: COLORS[db.users.length % COLORS.length],
      location: "",
      lat: 25.2,
      lng: 55.27,
      joinedAt: now,
      lastSeenAt: now,
      loginCount: 1,
      isPremium: false,
      language: "English",
      ipAddress: ip,
      affiliateCode: affiliateCode(name),
      affiliateClicks: 0,
      affiliateSignups: 0,
      affiliateEarnings: 0,
      referredBy,
    });
    const admins = db.users.filter((u) => u.role === "admin");
    for (const admin of admins) {
      db.notifications.unshift({
        id: `n-${token().slice(0, 8)}`,
        userId: admin.id,
        actorId: id,
        title: "New member registered",
        body: `${name} created an account and still needs to submit an application.`,
        link: "/admin",
        read: false,
        createdAt: now,
      });
    }
  });
  await setSession(id);
  return { ok: true, id, next: "/apply" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create account.";
    return { ok: false, error: message };
  }
}

export async function logout(): Promise<ActionResult> {
  const jar = await cookies();
  const session = verifyPayload<SessionPayload>(jar.get(COOKIE)?.value);
  if (session?.userId) {
    await updateDb((db) => {
      db.sessions = db.sessions.filter((s) => s.userId !== session.userId);
    }).catch(() => undefined);
  }
  jar.set(COOKIE, "", cookieOptions(0));
  jar.set(PROFILE_COOKIE, "", cookieOptions(0));
  return { ok: true };
}

export async function submitApplication(form: Application): Promise<ActionResult> {
  const me = await currentUser();
  if (!me) return { ok: false, error: "Please log in first." };
  if (!form.fullName || !form.phone || !form.country || !form.city || !form.goals) {
    return { ok: false, error: "Please complete all required fields." };
  }
  const now = new Date().toISOString();
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === me.id);
    if (!user) return;
    const notes = (form.notes || user.notes || "").trim();
    user.application = { ...form, notes };
    user.name = form.fullName.trim();
    user.phone = form.phone.trim();
    user.notes = notes;
    user.location = `${form.city}, ${form.country}`;
    user.bio = form.goals.trim().slice(0, 180);
    user.status = "pending";
    for (const admin of db.users.filter((u) => u.role === "admin")) {
      db.notifications.unshift({
        id: `n-${token().slice(0, 8)}`,
        userId: admin.id,
        actorId: user.id,
        title: "New application pending",
        body: `${user.name} requested to join Permanent Skill Strategy`,
        link: "/admin",
        read: false,
        createdAt: now,
      });
    }
  });
  const updated = readDb().users.find((u) => u.id === me.id);
  if (updated) await writeAuthCookies(updated);
  return { ok: true, next: "/pending" };
}

export async function approveUser(userId: string): Promise<ActionResult> {
  const me = await currentUser();
  if (me?.role !== "admin") return { ok: false, error: "Admin only." };
  const now = new Date().toISOString();
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return;
    user.status = "approved";
    db.notifications.unshift({
      id: `n-${token().slice(0, 8)}`,
      userId: user.id,
      actorId: me.id,
      title: "You are approved",
      body: "Welcome in — you now have full access to Permanent Skill Strategy.",
      link: "/community",
      read: false,
      createdAt: now,
    });
  });
  return { ok: true };
}

export async function rejectUser(userId: string): Promise<ActionResult> {
  const me = await currentUser();
  if (me?.role !== "admin") return { ok: false, error: "Admin only." };
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return;
    user.status = "rejected";
    db.sessions = db.sessions.filter((s) => s.userId !== userId);
  });
  return { ok: true };
}

export async function createMember(input: {
  name: string;
  email: string;
  password: string;
  username?: string;
  bio?: string;
  location?: string;
  status: Status;
  role?: Role;
  isPremium?: boolean;
  language?: string;
}): Promise<ActionResult> {
  const me = await currentUser();
  if (me?.role !== "admin") return { ok: false, error: "Admin only." };

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 2) return { ok: false, error: "Please enter the member's name." };
  if (!email.includes("@")) return { ok: false, error: "Enter a valid email." };
  if (input.password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const db = readDb();
  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const wantedUsername = slugify(input.username || "") || "";
  if (wantedUsername && db.users.some((u) => u.username === wantedUsername)) {
    return { ok: false, error: "That username is already taken." };
  }

  const id = `u-${token().slice(0, 10)}`;
  const now = new Date().toISOString();
  const username = wantedUsername || uniqueUsername(db.users, name);
  const status: Status = input.status || "approved";
  const role: Role = input.role === "admin" ? "admin" : "member";

  await updateDb((d) => {
    d.users.push({
      id,
      email,
      passwordHash: hashPassword(input.password),
      name,
      username,
      bio: input.bio?.trim() || "Community member",
      role,
      status,
      points: 0,
      points7d: 0,
      points30d: 0,
      avatarColor: COLORS[d.users.length % COLORS.length],
      location: input.location?.trim() || "",
      lat: 25.2,
      lng: 55.27,
      joinedAt: now,
      lastSeenAt: now,
      loginCount: 0,
      isPremium: Boolean(input.isPremium),
      language: input.language?.trim() || "English",
      affiliateCode: affiliateCode(name),
      affiliateClicks: 0,
      affiliateSignups: 0,
      affiliateEarnings: 0,
    });
  });
  return { ok: true, id };
}

export async function updateMember(input: {
  userId: string;
  name: string;
  email: string;
  username: string;
  bio: string;
  location: string;
  status: Status;
  role: Role;
  isPremium: boolean;
  language: string;
  password?: string;
}): Promise<ActionResult> {
  const me = await currentUser();
  if (me?.role !== "admin") return { ok: false, error: "Admin only." };

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const username = slugify(input.username.trim()) || slugify(name);
  if (name.length < 2) return { ok: false, error: "Please enter the member's name." };
  if (!email.includes("@")) return { ok: false, error: "Enter a valid email." };
  if (input.password && input.password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (!["pending", "approved", "rejected"].includes(input.status)) {
    return { ok: false, error: "Choose a valid status." };
  }
  if (input.role !== "admin" && input.role !== "member") {
    return { ok: false, error: "Choose a valid role." };
  }

  const db = readDb();
  const target = db.users.find((u) => u.id === input.userId);
  if (!target) return { ok: false, error: "Member not found." };
  if (db.users.some((u) => u.email.toLowerCase() === email && u.id !== input.userId)) {
    return { ok: false, error: "An account with this email already exists." };
  }
  if (db.users.some((u) => u.username === username && u.id !== input.userId)) {
    return { ok: false, error: "That username is already taken." };
  }

  const admins = db.users.filter((u) => u.role === "admin");
  if (target.role === "admin" && input.role !== "admin" && admins.length < 2) {
    return { ok: false, error: "Keep at least one admin account." };
  }
  if (target.id === me.id && input.role !== "admin") {
    return { ok: false, error: "You cannot remove your own admin role." };
  }

  await updateDb((d) => {
    const user = d.users.find((u) => u.id === input.userId);
    if (!user) return;
    user.name = name;
    user.email = email;
    user.username = username;
    user.bio = input.bio.trim();
    user.location = input.location.trim();
    user.status = input.status;
    user.role = input.role;
    user.isPremium = Boolean(input.isPremium);
    user.language = input.language.trim() || "English";
    if (input.password) user.passwordHash = hashPassword(input.password);
    if (input.status === "rejected") {
      d.sessions = d.sessions.filter((s) => s.userId !== user.id);
    }
  });
  return { ok: true };
}

export async function releaseMemberLogin(userId: string): Promise<ActionResult> {
  const me = await currentUser();
  if (me?.role !== "admin") return { ok: false, error: "Admin only." };
  await updateDb((db) => {
    db.sessions = db.sessions.filter((s) => s.userId !== userId);
  });
  return { ok: true };
}

export async function heartbeat(): Promise<ActionResult> {
  const me = await currentUser();
  if (!me) return { ok: false };
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === me.id);
    if (user) user.lastSeenAt = new Date().toISOString();
  });
  return { ok: true };
}

export async function trackAffiliateClick(code: string): Promise<ActionResult> {
  if (!code) return { ok: true };
  await updateDb((db) => {
    const user = db.users.find((u) => u.affiliateCode.toLowerCase() === code.toLowerCase());
    if (user) user.affiliateClicks += 1;
  });
  return { ok: true };
}

export async function createPost(input: {
  title: string;
  body: string;
  category: PostCategory;
}): Promise<ActionResult> {
  const me = await currentUser();
  if (!me || (me.status !== "approved" && me.role !== "admin")) {
    return { ok: false, error: "You need approval before posting." };
  }
  if (!input.body.trim()) return { ok: false, error: "Write something first." };
  const id = `p-${token().slice(0, 8)}`;
  const now = new Date().toISOString();
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === me.id);
    if (user) award(user, 5);
    db.posts.unshift({
      id,
      authorId: me.id,
      category: input.category,
      title: input.title.trim() || input.body.trim().slice(0, 72),
      body: input.body.trim(),
      pinned: false,
      likes: [],
      createdAt: now,
    });
    if (input.category === "reviews") {
      db.reviews.unshift({
        id: `r-${token().slice(0, 8)}`,
        userId: me.id,
        rating: 5,
        body: input.body.trim(),
        createdAt: now,
      });
    }
  });
  return { ok: true, id };
}

export async function toggleLike(postId: string): Promise<ActionResult> {
  const me = await currentUser();
  if (!me) return { ok: false, error: "Please log in." };
  await updateDb((db) => {
    const post = db.posts.find((p) => p.id === postId);
    if (!post) return;
    if (post.likes.includes(me.id)) {
      post.likes = post.likes.filter((id) => id !== me.id);
    } else {
      post.likes.push(me.id);
      const author = db.users.find((u) => u.id === post.authorId);
      if (author && author.id !== me.id) award(author, 1);
    }
  });
  return { ok: true };
}

export async function addComment(postId: string, body: string): Promise<ActionResult> {
  const me = await currentUser();
  if (!me) return { ok: false, error: "Please log in." };
  if (!body.trim()) return { ok: false, error: "Comment cannot be empty." };
  const now = new Date().toISOString();
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === me.id);
    if (user) award(user, 2);
    db.comments.push({
      id: `c-${token().slice(0, 8)}`,
      postId,
      authorId: me.id,
      body: body.trim(),
      createdAt: now,
    });
    const post = db.posts.find((p) => p.id === postId);
    if (post && post.authorId !== me.id) {
      db.notifications.unshift({
        id: `n-${token().slice(0, 8)}`,
        userId: post.authorId,
        actorId: me.id,
        title: `${me.name} commented`,
        body: body.trim().slice(0, 80),
        link: "/community",
        read: false,
        createdAt: now,
      });
    }
  });
  return { ok: true };
}

export async function togglePin(postId: string): Promise<ActionResult> {
  const me = await currentUser();
  if (me?.role !== "admin") return { ok: false, error: "Admin only." };
  await updateDb((db) => {
    const post = db.posts.find((p) => p.id === postId);
    if (post) post.pinned = !post.pinned;
  });
  return { ok: true };
}

export async function completeLesson(courseId: string, lessonId: string): Promise<ActionResult> {
  const me = await currentUser();
  if (!me) return { ok: false, error: "Please log in." };
  await updateDb((db) => {
    const course = db.courses.find((c) => c.id === courseId);
    if (!course) return;
    const user = db.users.find((u) => u.id === me.id);
    if (!user) return;
    if (course.unlockLevel > 1) {
      const level = getLevel(user.points).level;
      if (level < course.unlockLevel && !user.isPremium && user.role !== "admin") return;
    }
    let row = db.progress.find((p) => p.userId === me.id && p.courseId === courseId);
    if (!row) {
      row = { userId: me.id, courseId, completedLessonIds: [] };
      db.progress.push(row);
    }
    if (row.completedLessonIds.includes(lessonId)) {
      row.completedLessonIds = row.completedLessonIds.filter((id) => id !== lessonId);
    } else {
      row.completedLessonIds.push(lessonId);
      award(user, 3);
    }
  });
  return { ok: true };
}

export async function sendMessage(receiverId: string, body: string): Promise<ActionResult> {
  const me = await currentUser();
  if (!me) return { ok: false, error: "Please log in." };
  if (!body.trim()) return { ok: false, error: "Message cannot be empty." };
  const now = new Date().toISOString();
  await updateDb((db) => {
    db.messages.push({
      id: `msg-${token().slice(0, 8)}`,
      senderId: me.id,
      receiverId,
      body: body.trim(),
      read: false,
      createdAt: now,
    });
    db.notifications.unshift({
      id: `n-${token().slice(0, 8)}`,
      userId: receiverId,
      actorId: me.id,
      title: `${me.name} sent a message`,
      body: body.trim().slice(0, 80),
      link: "/messages",
      read: false,
      createdAt: now,
    });
  });
  return { ok: true };
}

export async function markThreadRead(otherId: string): Promise<ActionResult> {
  const me = await currentUser();
  if (!me) return { ok: false };
  await updateDb((db) => {
    for (const m of db.messages) {
      if (m.receiverId === me.id && m.senderId === otherId) m.read = true;
    }
  });
  return { ok: true };
}

export async function markNotificationsRead(): Promise<ActionResult> {
  const me = await currentUser();
  if (!me) return { ok: false };
  await updateDb((db) => {
    for (const n of db.notifications) {
      if (n.userId === me.id) n.read = true;
    }
  });
  return { ok: true };
}

export async function addReview(rating: number, body: string): Promise<ActionResult> {
  const me = await currentUser();
  if (!me) return { ok: false, error: "Please log in." };
  if (!body.trim()) return { ok: false, error: "Write a short review." };
  const now = new Date().toISOString();
  await updateDb((db) => {
    db.reviews.unshift({
      id: `r-${token().slice(0, 8)}`,
      userId: me.id,
      rating: Math.min(5, Math.max(1, rating)),
      body: body.trim(),
      createdAt: now,
    });
  });
  return { ok: true };
}

export async function updateProfile(input: {
  name?: string;
  bio?: string;
  location?: string;
  language?: string;
}): Promise<ActionResult> {
  const me = await currentUser();
  if (!me) return { ok: false, error: "Please log in." };
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === me.id);
    if (!user) return;
    if (input.name?.trim()) user.name = input.name.trim();
    if (input.bio !== undefined) user.bio = input.bio.trim();
    if (input.location !== undefined) user.location = input.location.trim();
    if (input.language) user.language = input.language;
  });
  return { ok: true };
}

export async function changePassword(current: string, next: string): Promise<ActionResult> {
  const me = await currentUser();
  if (!me) return { ok: false, error: "Please log in." };
  if (!verifyPassword(current, me.passwordHash)) return { ok: false, error: "Current password is incorrect." };
  if (next.length < 8) return { ok: false, error: "New password must be at least 8 characters." };
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === me.id);
    if (user) user.passwordHash = hashPassword(next);
  });
  return { ok: true };
}

export async function upgrade(): Promise<ActionResult> {
  const me = await currentUser();
  if (!me) return { ok: false, error: "Please log in." };
  if (me.isPremium) return { ok: false, error: "You already have Premium." };
  const now = new Date().toISOString();
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === me.id);
    if (!user) return;
    user.isPremium = true;
    db.sales.push({
      id: `sale-${token().slice(0, 8)}`,
      userId: user.id,
      amount: 9,
      plan: "Premium monthly",
      createdAt: now,
    });
    if (user.referredBy) {
      const referrer = db.users.find((u) => u.id === user.referredBy);
      if (referrer) referrer.affiliateEarnings += 9;
    }
    db.notifications.unshift({
      id: `n-${token().slice(0, 8)}`,
      userId: user.id,
      title: "Premium unlocked",
      body: "Premium masterminds and member perks are now available.",
      link: "/classroom",
      read: false,
      createdAt: now,
    });
  });
  return { ok: true };
}

export async function inviteMember(email: string): Promise<ActionResult> {
  const me = await currentUser();
  if (!me) return { ok: false, error: "Please log in." };
  if (!email.includes("@")) return { ok: false, error: "Enter a valid email." };
  const now = new Date().toISOString();
  await updateDb((db) => {
    db.notifications.unshift({
      id: `n-${token().slice(0, 8)}`,
      userId: me.id,
      title: "Invite ready",
      body: `Share your link with ${email}. They will still need admin approval after applying.`,
      link: "/affiliates",
      read: false,
      createdAt: now,
    });
  });
  return { ok: true };
}

export async function saveCourse(input: {
  id?: string;
  title: string;
  description: string;
  unlockLevel: number;
}): Promise<ActionResult> {
  const me = await currentUser();
  if (me?.role !== "admin") return { ok: false, error: "Admin only." };
  if (!input.title.trim()) return { ok: false, error: "Course title is required." };
  const id = input.id || `course-${token().slice(0, 8)}`;
  await updateDb((db) => {
    const existing = db.courses.find((c) => c.id === id);
    if (existing) {
      existing.title = input.title.trim();
      existing.description = input.description.trim();
      existing.unlockLevel = input.unlockLevel || 1;
      return;
    }
    db.courses.push({
      id,
      slug: slugify(input.title) || id,
      title: input.title.trim(),
      description: input.description.trim(),
      accent: "from-[#0b1b4a] via-[#5051F9] to-[#7c83ff]",
      badge: input.title.trim().slice(0, 18).toUpperCase(),
      unlockLevel: input.unlockLevel || 1,
      lessons: [],
    });
  });
  return { ok: true, id };
}

export async function saveLesson(input: {
  courseId: string;
  lessonId?: string;
  module: string;
  title: string;
  duration: string;
  notes: string;
  videoUrl: string;
  videoTitle: string;
}): Promise<ActionResult> {
  const me = await currentUser();
  if (me?.role !== "admin") return { ok: false, error: "Admin only." };
  if (!input.title.trim()) return { ok: false, error: "Video title is required." };
  if (!input.courseId) return { ok: false, error: "Choose a course." };
  const id = input.lessonId || `l-${token().slice(0, 8)}`;
  const lesson: Lesson = {
    id,
    module: input.module.trim(),
    title: input.title.trim(),
    duration: input.duration.trim() || "",
    notes: input.notes.trim(),
    videoUrl: input.videoUrl.trim(),
    videoTitle: input.videoTitle.trim() || input.title.trim(),
  };
  await updateDb((db) => {
    const course = db.courses.find((c) => c.id === input.courseId);
    if (!course) return;
    const index = course.lessons.findIndex((l) => l.id === id);
    if (index >= 0) course.lessons[index] = lesson;
    else course.lessons.push(lesson);
  });
  return { ok: true, id };
}

export async function deleteLesson(courseId: string, lessonId: string): Promise<ActionResult> {
  const me = await currentUser();
  if (me?.role !== "admin") return { ok: false, error: "Admin only." };
  await updateDb((db) => {
    const course = db.courses.find((c) => c.id === courseId);
    if (!course) return;
    course.lessons = course.lessons.filter((l) => l.id !== lessonId);
  });
  return { ok: true };
}

export async function isAdminSession() {
  const me = await currentUser();
  return me?.role === "admin";
}

export async function createCommunity(input: {
  name: string;
  description: string;
  isPrivate?: boolean;
}): Promise<ActionResult> {
  const me = await currentUser();
  if (!me) return { ok: false, error: "Please log in first." };
  const name = input.name.trim();
  if (name.length < 3) return { ok: false, error: "Community name must be at least 3 characters." };
  const slug = slugify(name);
  const db = readDb();
  if (db.communities?.some((c) => c.slug === slug || c.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: "A community with this name already exists." };
  }
  const id = `comm-${token().slice(0, 8)}`;
  const newCommunity: Community = {
    id,
    name,
    description: input.description.trim() || `${name} community.`,
    slug,
    isPrivate: Boolean(input.isPrivate),
    memberCount: 1,
    createdAt: new Date().toISOString(),
    createdBy: me.id,
  };
  await updateDb((d) => {
    d.communities = d.communities || [];
    d.communities.push(newCommunity);
  });
  return { ok: true, id };
}
