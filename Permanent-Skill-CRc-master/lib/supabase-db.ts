import { getAdminSupabase } from "./supabase";
import type {
  CalendarEvent,
  Comment,
  Community,
  Course,
  Database,
  Message,
  Notification,
  Post,
  Progress,
  Project,
  Review,
  Sale,
  Session,
  User,
} from "./types";

export async function fetchDatabaseFromSupabase(): Promise<Database | null> {
  try {
    const supabase = getAdminSupabase();

    const [
      { data: users, error: uErr },
      { data: communities, error: cErr },
      { data: courses, error: coErr },
      { data: progress, error: prErr },
      { data: posts, error: poErr },
      { data: comments, error: comErr },
      { data: projects, error: projErr },
      { data: events, error: evErr },
      { data: messages, error: mErr },
      { data: notifications, error: nErr },
      { data: reviews, error: rErr },
      { data: sales, error: sErr },
      { data: sessions, error: sessErr },
    ] = await Promise.all([
      supabase.from("users").select("*"),
      supabase.from("communities").select("*"),
      supabase.from("courses").select("*"),
      supabase.from("progress").select("*"),
      supabase.from("posts").select("*").order("created_at", { ascending: false }),
      supabase.from("comments").select("*"),
      supabase.from("projects").select("*"),
      supabase.from("events").select("*"),
      supabase.from("messages").select("*"),
      supabase.from("notifications").select("*"),
      supabase.from("reviews").select("*"),
      supabase.from("sales").select("*"),
      supabase.from("sessions").select("*"),
    ]);

    if (uErr) console.error("Error fetching users from Supabase:", uErr);
    if (poErr) console.error("Error fetching posts from Supabase:", poErr);

    if (uErr || !users || users.length === 0) {
      return null;
    }

    const mappedUsers: User[] = (users || []).map((u) => ({
      id: u.id,
      email: u.email,
      passwordHash: u.password_hash,
      name: u.name,
      username: u.username,
      bio: u.bio || "",
      role: u.role,
      status: u.status,
      points: Number(u.points || 0),
      points7d: Number(u.points7d || 0),
      points30d: Number(u.points30d || 0),
      avatarColor: u.avatar_color || "#f59e0b",
      location: u.location || "",
      lat: Number(u.lat || 0),
      lng: Number(u.lng || 0),
      joinedAt: u.joined_at,
      lastSeenAt: u.last_seen_at,
      loginCount: Number(u.login_count || 1),
      isPremium: !!u.is_premium,
      language: u.language || "en",
      ipAddress: u.ip_address || undefined,
      purchasedCourseIds: u.purchased_course_ids || [],
      phone: u.phone || undefined,
      notes: u.notes || undefined,
      application: u.application || undefined,
      affiliateCode: u.affiliate_code,
      affiliateClicks: Number(u.affiliate_clicks || 0),
      affiliateSignups: Number(u.affiliate_signups || 0),
      affiliateEarnings: Number(u.affiliate_earnings || 0),
      referredBy: u.referred_by || undefined,
    }));

    const mappedCommunities: Community[] = (communities || []).map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description || "",
      slug: c.slug,
      icon: c.icon || undefined,
      banner: c.banner || undefined,
      isPrivate: !!c.is_private,
      memberCount: Number(c.member_count || 0),
      onlineCount: Number(c.online_count || 0),
      adminCount: Number(c.admin_count || 1),
      type: c.type || "general",
      createdAt: c.created_at,
      createdBy: c.created_by || "u-admin",
    }));

    const mappedCourses: Course[] = (courses || []).map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description || "",
      accent: c.accent || "",
      badge: c.badge || "",
      unlockLevel: Number(c.unlock_level || 1),
      price: Number(c.price || 0),
      lessons: Array.isArray(c.lessons) ? c.lessons : [],
      bannerBrand: c.banner_brand || undefined,
      bannerSubtitle: c.banner_subtitle || undefined,
      bannerTitle: c.banner_title || undefined,
      thumbnail: c.thumbnail || undefined,
      watermark: c.watermark || undefined,
      isPremiumOnly: !!c.is_premium_only,
      glowColor: c.glow_color || "yellow",
    }));

    const mappedProgress: Progress[] = (progress || []).map((p) => ({
      userId: p.user_id,
      courseId: p.course_id,
      completedLessonIds: p.completed_lesson_ids || [],
    }));

    const mappedPosts: Post[] = (posts || []).map((p) => ({
      id: p.id,
      authorId: p.author_id,
      category: p.category,
      title: p.title,
      body: p.body,
      pinned: !!p.pinned,
      likes: p.likes || [],
      createdAt: p.created_at,
      thumbnail: p.thumbnail || undefined,
      communityId: p.community_id || undefined,
    }));

    const mappedComments: Comment[] = (comments || []).map((c) => ({
      id: c.id,
      postId: c.post_id,
      authorId: c.author_id,
      body: c.body,
      createdAt: c.created_at,
      status: c.status || "approved",
    }));

    const mappedProjects: Project[] = (projects || []).map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description || "",
      version: p.version || undefined,
      leadId: p.lead_id,
      leadName: p.lead_name || undefined,
      memberIds: p.member_ids || [],
      mentionedUsernames: p.mentioned_usernames || [],
      progress: Number(p.progress || 0),
      tasks: Array.isArray(p.tasks) ? p.tasks : [],
      status: p.status || "active",
      thumbnail: p.thumbnail || undefined,
      meetSyncTime: p.meet_sync_time || undefined,
      meetRoom: p.meet_room || undefined,
      meetUrl: p.meet_url || undefined,
      createdAt: p.created_at,
      createdBy: p.created_by || "u-admin",
    }));

    const mappedEvents: CalendarEvent[] = (events || []).map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start_time,
      end: e.end_time,
      type: e.type || "live",
      description: e.description || "",
    }));

    const mappedMessages: Message[] = (messages || []).map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      receiverId: m.receiver_id,
      body: m.body,
      read: !!m.read,
      createdAt: m.created_at,
    }));

    const mappedNotifications: Notification[] = (notifications || []).map((n) => ({
      id: n.id,
      userId: n.user_id,
      actorId: n.actor_id || undefined,
      title: n.title,
      body: n.body,
      link: n.link || "",
      read: !!n.read,
      createdAt: n.created_at,
    }));

    const mappedReviews: Review[] = (reviews || []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      rating: Number(r.rating || 5),
      body: r.body,
      createdAt: r.created_at,
    }));

    const mappedSales: Sale[] = (sales || []).map((s) => ({
      id: s.id,
      userId: s.user_id,
      amount: Number(s.amount || 0),
      plan: s.plan,
      createdAt: s.created_at,
    }));

    const mappedSessions: Session[] = (sessions || []).map((s) => ({
      token: s.token,
      userId: s.user_id,
      deviceId: s.device_id || undefined,
      createdAt: s.created_at,
    }));

    return {
      users: mappedUsers,
      communities: mappedCommunities,
      courses: mappedCourses,
      progress: mappedProgress,
      posts: mappedPosts,
      comments: mappedComments,
      projects: mappedProjects,
      events: mappedEvents,
      messages: mappedMessages,
      notifications: mappedNotifications,
      reviews: mappedReviews,
      sales: mappedSales,
      sessions: mappedSessions,
    };
  } catch (err) {
    console.error("Failed to load from Supabase:", err);
    return null;
  }
}

export async function syncUserToSupabase(u: User) {
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.from("users").upsert(
      {
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
      },
      { onConflict: "id" }
    );
    if (error) console.error("Error upserting user to Supabase:", error);
  } catch (err) {
    console.error("Error syncing user to Supabase:", err);
  }
}

export async function syncPostToSupabase(p: Post) {
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.from("posts").upsert(
      {
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
      },
      { onConflict: "id" }
    );
    if (error) console.error("Error upserting post to Supabase:", error);
  } catch (err) {
    console.error("Error syncing post to Supabase:", err);
  }
}

export async function deletePostFromSupabase(postId: string) {
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) console.error("Error deleting post from Supabase:", error);
  } catch (err) {
    console.error("Error deleting post from Supabase:", err);
  }
}

export async function syncCommentToSupabase(c: Comment) {
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.from("comments").upsert(
      {
        id: c.id,
        post_id: c.postId,
        author_id: c.authorId,
        body: c.body,
        created_at: c.createdAt || new Date().toISOString(),
        status: c.status || "approved",
      },
      { onConflict: "id" }
    );
    if (error) console.error("Error upserting comment to Supabase:", error);
  } catch (err) {
    console.error("Error syncing comment to Supabase:", err);
  }
}

export async function deleteCommentFromSupabase(commentId: string) {
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) console.error("Error deleting comment from Supabase:", error);
  } catch (err) {
    console.error("Error deleting comment from Supabase:", err);
  }
}

export async function syncCourseToSupabase(c: Course) {
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.from("courses").upsert(
      {
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
      },
      { onConflict: "id" }
    );
    if (error) console.error("Error upserting course to Supabase:", error);
  } catch (err) {
    console.error("Error syncing course to Supabase:", err);
  }
}

export async function deleteCourseFromSupabase(courseId: string) {
  try {
    const supabase = getAdminSupabase();
    await supabase.from("courses").delete().eq("id", courseId);
  } catch (err) {
    console.error("Error deleting course from Supabase:", err);
  }
}

export async function syncProjectToSupabase(p: Project) {
  try {
    const supabase = getAdminSupabase();
    await supabase.from("projects").upsert(
      {
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
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.error("Error syncing project to Supabase:", err);
  }
}

export async function deleteProjectFromSupabase(projectId: string) {
  try {
    const supabase = getAdminSupabase();
    await supabase.from("projects").delete().eq("id", projectId);
  } catch (err) {
    console.error("Error deleting project from Supabase:", err);
  }
}

export async function syncProgressToSupabase(p: Progress) {
  try {
    const supabase = getAdminSupabase();
    await supabase.from("progress").upsert(
      {
        user_id: p.userId,
        course_id: p.courseId,
        completed_lesson_ids: p.completedLessonIds || [],
      },
      { onConflict: "user_id,course_id" }
    );
  } catch (err) {
    console.error("Error syncing progress to Supabase:", err);
  }
}

export async function syncMessageToSupabase(m: Message) {
  try {
    const supabase = getAdminSupabase();
    await supabase.from("messages").upsert(
      {
        id: m.id,
        sender_id: m.senderId,
        receiver_id: m.receiverId,
        body: m.body,
        read: !!m.read,
        created_at: m.createdAt || new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.error("Error syncing message to Supabase:", err);
  }
}

export async function syncNotificationToSupabase(n: Notification) {
  try {
    const supabase = getAdminSupabase();
    await supabase.from("notifications").upsert(
      {
        id: n.id,
        user_id: n.userId,
        actor_id: n.actorId || null,
        title: n.title,
        body: n.body,
        link: n.link || "",
        read: !!n.read,
        created_at: n.createdAt || new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.error("Error syncing notification to Supabase:", err);
  }
}

export async function syncReviewToSupabase(r: Review) {
  try {
    const supabase = getAdminSupabase();
    await supabase.from("reviews").upsert(
      {
        id: r.id,
        user_id: r.userId,
        rating: r.rating,
        body: r.body,
        created_at: r.createdAt || new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.error("Error syncing review to Supabase:", err);
  }
}

export async function syncSaleToSupabase(s: Sale) {
  try {
    const supabase = getAdminSupabase();
    await supabase.from("sales").upsert(
      {
        id: s.id,
        user_id: s.userId,
        amount: s.amount,
        plan: s.plan,
        created_at: s.createdAt || new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.error("Error syncing sale to Supabase:", err);
  }
}

export async function syncSessionToSupabase(s: Session) {
  try {
    const supabase = getAdminSupabase();
    await supabase.from("sessions").upsert(
      {
        token: s.token,
        user_id: s.userId,
        device_id: s.deviceId || null,
        created_at: s.createdAt || new Date().toISOString(),
      },
      { onConflict: "token" }
    );
  } catch (err) {
    console.error("Error syncing session to Supabase:", err);
  }
}

export async function deleteSessionFromSupabase(token: string) {
  try {
    const supabase = getAdminSupabase();
    await supabase.from("sessions").delete().eq("token", token);
  } catch (err) {
    console.error("Error deleting session from Supabase:", err);
  }
}
