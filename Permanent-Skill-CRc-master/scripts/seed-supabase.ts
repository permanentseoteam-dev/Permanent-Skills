import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { createSeed } from "../lib/seed";

// Load .env.local if present
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function seed() {
  console.log("Seeding Supabase database...");
  const data = createSeed();

  // 1. Users
  console.log(`Seeding ${data.users.length} users...`);
  const usersToInsert = data.users.map((u) => ({
    id: u.id,
    email: u.email,
    password_hash: u.passwordHash,
    name: u.name,
    username: u.username,
    bio: u.bio || "",
    role: u.role || "user",
    status: u.status || "approved",
    points: u.points || 0,
    points7d: u.points7d || 0,
    points30d: u.points30d || 0,
    avatar_color: u.avatarColor || "#f59e0b",
    location: u.location || "",
    lat: u.lat || 0,
    lng: u.lng || 0,
    joined_at: u.joinedAt || new Date().toISOString(),
    last_seen_at: u.lastSeenAt || new Date().toISOString(),
    login_count: u.loginCount || 1,
    is_premium: !!u.isPremium,
    language: u.language || "en",
    ip_address: u.ipAddress || null,
    purchased_course_ids: u.purchasedCourseIds || [],
    phone: u.phone || null,
    notes: u.notes || null,
    application: u.application || null,
    affiliate_code: u.affiliateCode || `PSS-${u.id}`,
    affiliate_clicks: u.affiliateClicks || 0,
    affiliate_signups: u.affiliateSignups || 0,
    affiliate_earnings: u.affiliateEarnings || 0,
    referred_by: u.referredBy || null,
  }));
  const { error: userErr } = await supabase.from("users").upsert(usersToInsert, { onConflict: "id" });
  if (userErr) console.error("Error seeding users:", userErr.message);

  // 2. Communities
  console.log(`Seeding ${data.communities.length} communities...`);
  const commsToInsert = data.communities.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description || "",
    slug: c.slug,
    icon: c.icon || null,
    banner: c.banner || null,
    is_private: !!c.isPrivate,
    member_count: c.memberCount || 0,
    online_count: c.onlineCount || 0,
    admin_count: c.adminCount || 1,
    type: c.type || "general",
    created_at: c.createdAt || new Date().toISOString(),
    created_by: c.createdBy || "u-admin",
  }));
  const { error: commErr } = await supabase.from("communities").upsert(commsToInsert, { onConflict: "id" });
  if (commErr) console.error("Error seeding communities:", commErr.message);

  // 3. Courses
  console.log(`Seeding ${data.courses.length} courses...`);
  const coursesToInsert = data.courses.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description || "",
    accent: c.accent || "",
    badge: c.badge || "",
    unlock_level: c.unlockLevel || 1,
    price: c.price || 0,
    lessons: c.lessons || [],
    banner_brand: c.bannerBrand || null,
    banner_subtitle: c.bannerSubtitle || null,
    banner_title: c.bannerTitle || null,
    thumbnail: c.thumbnail || null,
    watermark: c.watermark || null,
    is_premium_only: !!c.isPremiumOnly,
    glow_color: c.glowColor || "yellow",
  }));
  const { error: courseErr } = await supabase.from("courses").upsert(coursesToInsert, { onConflict: "id" });
  if (courseErr) console.error("Error seeding courses:", courseErr.message);

  // 4. Progress
  if (data.progress.length > 0) {
    console.log(`Seeding ${data.progress.length} progress rows...`);
    const progressToInsert = data.progress.map((p) => ({
      user_id: p.userId,
      course_id: p.courseId,
      completed_lesson_ids: p.completedLessonIds || [],
    }));
    const { error: progErr } = await supabase.from("progress").upsert(progressToInsert, { onConflict: "user_id,course_id" });
    if (progErr) console.error("Error seeding progress:", progErr.message);
  }

  // 5. Posts
  if (data.posts.length > 0) {
    console.log(`Seeding ${data.posts.length} posts...`);
    const postsToInsert = data.posts.map((p) => ({
      id: p.id,
      author_id: p.authorId,
      category: p.category,
      title: p.title,
      body: p.body,
      pinned: !!p.pinned,
      likes: p.likes || [],
      created_at: p.createdAt || new Date().toISOString(),
      thumbnail: p.thumbnail || null,
      community_id: p.communityId || null,
    }));
    const { error: postErr } = await supabase.from("posts").upsert(postsToInsert, { onConflict: "id" });
    if (postErr) console.error("Error seeding posts:", postErr.message);
  }

  // 6. Comments (filter to valid posts)
  const validPostIds = new Set(data.posts.map((p) => p.id));
  const validComments = data.comments.filter((c) => validPostIds.has(c.postId));
  if (validComments.length > 0) {
    console.log(`Seeding ${validComments.length} comments...`);
    const commentsToInsert = validComments.map((c) => ({
      id: c.id,
      post_id: c.postId,
      author_id: c.authorId,
      body: c.body,
      created_at: c.createdAt || new Date().toISOString(),
      status: c.status || "approved",
    }));
    const { error: commsErr } = await supabase.from("comments").upsert(commentsToInsert, { onConflict: "id" });
    if (commsErr) console.error("Error seeding comments:", commsErr.message);
  }

  // 7. Projects
  if (data.projects.length > 0) {
    console.log(`Seeding ${data.projects.length} projects...`);
    const projectsToInsert = data.projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description || "",
      version: p.version || null,
      lead_id: p.leadId,
      lead_name: p.leadName || null,
      member_ids: p.memberIds || [],
      mentioned_usernames: p.mentionedUsernames || [],
      progress: p.progress || 0,
      tasks: p.tasks || [],
      status: p.status || "active",
      thumbnail: p.thumbnail || null,
      meet_sync_time: p.meetSyncTime || null,
      meet_room: p.meetRoom || null,
      meet_url: p.meetUrl || null,
      created_at: p.createdAt || new Date().toISOString(),
      created_by: p.createdBy || "u-admin",
    }));
    const { error: projErr } = await supabase.from("projects").upsert(projectsToInsert, { onConflict: "id" });
    if (projErr) console.error("Error seeding projects:", projErr.message);
  }

  // 8. Events
  if (data.events.length > 0) {
    console.log(`Seeding ${data.events.length} events...`);
    const eventsToInsert = data.events.map((e) => ({
      id: e.id,
      title: e.title,
      start_time: e.start,
      end_time: e.end,
      type: e.type || "live",
      description: e.description || "",
    }));
    const { error: evErr } = await supabase.from("events").upsert(eventsToInsert, { onConflict: "id" });
    if (evErr) console.error("Error seeding events:", evErr.message);
  }

  // 9. Messages
  if (data.messages.length > 0) {
    console.log(`Seeding ${data.messages.length} messages...`);
    const messagesToInsert = data.messages.map((m) => ({
      id: m.id,
      sender_id: m.senderId,
      receiver_id: m.receiverId,
      body: m.body,
      read: !!m.read,
      created_at: m.createdAt || new Date().toISOString(),
    }));
    const { error: msgErr } = await supabase.from("messages").upsert(messagesToInsert, { onConflict: "id" });
    if (msgErr) console.error("Error seeding messages:", msgErr.message);
  }

  // 10. Notifications
  if (data.notifications.length > 0) {
    console.log(`Seeding ${data.notifications.length} notifications...`);
    const notifsToInsert = data.notifications.map((n) => ({
      id: n.id,
      user_id: n.userId,
      actor_id: n.actorId || null,
      title: n.title,
      body: n.body,
      link: n.link || "",
      read: !!n.read,
      created_at: n.createdAt || new Date().toISOString(),
    }));
    const { error: notifErr } = await supabase.from("notifications").upsert(notifsToInsert, { onConflict: "id" });
    if (notifErr) console.error("Error seeding notifications:", notifErr.message);
  }

  // 11. Reviews
  if (data.reviews.length > 0) {
    console.log(`Seeding ${data.reviews.length} reviews...`);
    const reviewsToInsert = data.reviews.map((r) => ({
      id: r.id,
      user_id: r.userId,
      rating: r.rating,
      body: r.body,
      created_at: r.createdAt || new Date().toISOString(),
    }));
    const { error: revErr } = await supabase.from("reviews").upsert(reviewsToInsert, { onConflict: "id" });
    if (revErr) console.error("Error seeding reviews:", revErr.message);
  }

  // 12. Sales
  if (data.sales.length > 0) {
    console.log(`Seeding ${data.sales.length} sales...`);
    const salesToInsert = data.sales.map((s) => ({
      id: s.id,
      user_id: s.userId,
      amount: s.amount,
      plan: s.plan,
      created_at: s.createdAt || new Date().toISOString(),
    }));
    const { error: saleErr } = await supabase.from("sales").upsert(salesToInsert, { onConflict: "id" });
    if (saleErr) console.error("Error seeding sales:", saleErr.message);
  }

  console.log("Database seeded successfully!");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
