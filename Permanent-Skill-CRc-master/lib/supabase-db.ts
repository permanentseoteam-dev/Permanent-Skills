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
  VideoResource,
} from "./types";

function parsePgArray(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "{}" || trimmed === "[]") return [];
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
      } catch {}
    }
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      return trimmed
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    }
    return [trimmed].filter(Boolean);
  }
  return [];
}

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
      { data: videoResources, error: vidErr },
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
      supabase.from("video_resources").select("*").order("created_at", { ascending: false }),
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
      purchasedCourseIds: parsePgArray(u.purchased_course_ids),
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
      price: c.price ? Number(c.price) : undefined,
      priceNote: c.price_note || undefined,
      headline: c.headline || undefined,
      aboutHeadline: c.about_headline || undefined,
      aboutDescription: c.about_description || undefined,
      aboutFeatures: Array.isArray(c.about_features)
        ? c.about_features
        : c.about_features
        ? typeof c.about_features === "string"
          ? JSON.parse(c.about_features)
          : c.about_features
        : undefined,
      aboutPainPoints: Array.isArray(c.about_pain_points)
        ? c.about_pain_points
        : c.about_pain_points
        ? typeof c.about_pain_points === "string"
          ? JSON.parse(c.about_pain_points)
          : c.about_pain_points
        : undefined,
      aboutClosingText: c.about_closing_text || undefined,
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

    const progressMap = new Map<string, Progress>();
    for (const p of progress || []) {
      const key = `${p.user_id}:${p.course_id}`;
      progressMap.set(key, {
        userId: p.user_id,
        courseId: p.course_id,
        completedLessonIds: parsePgArray(p.completed_lesson_ids),
      });
    }
    const mappedProgress: Progress[] = Array.from(progressMap.values());

    const mappedPosts: Post[] = (posts || [])
      .filter((p) => p.category !== "lesson_anchor" && p.category !== "lesson" && !p.id.startsWith("l-"))
      .map((p) => ({
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
      isMeetActive: !!p.is_meet_active,
      createdAt: p.created_at,
      createdBy: p.created_by || "u-admin",
    }));

    const mappedEvents: CalendarEvent[] = (events || []).map((e) => {
      const isCancelled = e.type === "cancelled" || (typeof e.description === "string" && e.description.startsWith("[CANCELLED]")) || !!e.is_cancelled;
      return {
        id: e.id,
        title: e.title,
        start: e.start_time || e.start,
        end: e.end_time || e.end,
        type: e.type || "live",
        description: e.description || "",
        bannerText: e.banner_text || e.bannerText || "Q & A",
        bannerSubtitle: e.banner_subtitle || e.bannerSubtitle || undefined,
        bannerImage: e.banner_image || e.bannerImage || undefined,
        meetUrl: e.meet_url || e.meetUrl || "https://meet.google.com/new",
        isLocked: e.is_locked !== undefined ? !!e.is_locked : (e.isLocked !== undefined ? !!e.isLocked : (e.type === "premium")),
        hostName: e.host_name || e.hostName || undefined,
        status: isCancelled ? "cancelled" : (e.status || "scheduled"),
        isCancelled,
        deletedAt: e.deleted_at || undefined,
      };
    });


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

    const mappedVideoResources: VideoResource[] = (videoResources || []).map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description || "",
      videoUrl: v.video_url || undefined,
      videoFileUrl: v.video_file_url || undefined,
      videoFileData: v.video_file_data || undefined,
      thumbnailUrl: v.thumbnail_url || undefined,
      duration: v.duration || undefined,
      category: v.category || "overview",
      courseId: v.course_id || undefined,
      communityId: v.community_id || undefined,
      authorId: v.author_id || undefined,
      isPublic: v.is_public ?? true,
      isFeatured: !!v.is_featured,
      viewCount: Number(v.view_count || 0),
      metadata: v.metadata || {},
      createdAt: v.created_at || new Date().toISOString(),
      updatedAt: v.updated_at || undefined,
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
      videoResources: mappedVideoResources,
    };
  } catch (err) {
    console.error("Failed to load from Supabase:", err);
    return null;
  }
}

export async function syncUserToSupabase(u: User) {
  try {
    const supabase = getAdminSupabase();
    const payload = {
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
    };

    // 1. Try updating existing user by ID directly
    const { error: updateErr, data: updated } = await supabase
      .from("users")
      .update(payload)
      .eq("id", u.id)
      .select("id");

    if (updated && updated.length > 0) {
      return;
    }

    // 2. If ID wasn't matched, try updating by email if available
    if (u.email) {
      const { data: updatedEmail } = await supabase
        .from("users")
        .update(payload)
        .eq("email", u.email.trim().toLowerCase())
        .select("id");
      if (updatedEmail && updatedEmail.length > 0) {
        return;
      }
    }

    // 3. If user doesn't exist yet, insert / upsert
    const { error: upsertErr } = await supabase.from("users").upsert(payload, { onConflict: "id" });
    if (upsertErr) console.error("Error upserting user to Supabase:", upsertErr);
  } catch (err) {
    console.error("Error syncing user to Supabase:", err);
  }
}

export async function deleteUserFromSupabase(userId: string) {
  try {
    const supabase = getAdminSupabase();
    // 1. Delete associated dependent child records first to satisfy foreign key constraints
    await Promise.allSettled([
      supabase.from("comments").delete().eq("author_id", userId),
      supabase.from("posts").delete().eq("author_id", userId),
      supabase.from("reviews").delete().eq("user_id", userId),
      supabase.from("sales").delete().eq("user_id", userId),
      supabase.from("sessions").delete().eq("user_id", userId),
      supabase.from("progress").delete().eq("user_id", userId),
      supabase.from("notifications").delete().eq("user_id", userId),
    ]);

    // 2. Delete the user
    const { error } = await supabase.from("users").delete().eq("id", userId);
    if (error) console.error("Error deleting user from Supabase:", error);
  } catch (err) {
    console.error("Error deleting user from Supabase:", err);
  }
}

export async function syncPostToSupabase(p: Post) {
  try {
    const supabase = getAdminSupabase();
    const payload = {
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
    };

    // 1. Try direct update first by ID
    const { error: updateErr, data: updated } = await supabase
      .from("posts")
      .update(payload)
      .eq("id", p.id)
      .select("id");

    // 2. If row doesn't exist yet, insert/upsert
    if (updateErr || !updated || updated.length === 0) {
      const { error: upsertErr } = await supabase.from("posts").upsert(payload, { onConflict: "id" });
      if (upsertErr) console.error("Error upserting post to Supabase:", upsertErr);
    }
  } catch (err) {
    console.error("Error syncing post to Supabase:", err);
  }
}

export async function deletePostFromSupabase(postId: string) {
  try {
    const supabase = getAdminSupabase();
    // 1. Delete all comments associated with this post to satisfy foreign key constraints
    await supabase.from("comments").delete().eq("post_id", postId);

    // 2. Delete the post
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) console.error("Error deleting post from Supabase:", error);
  } catch (err) {
    console.error("Error deleting post from Supabase:", err);
  }
}

export async function syncCommentToSupabase(c: Comment) {
  try {
    const supabase = getAdminSupabase();
    if (!c || !c.id || !c.postId) return;

    // 1. If this comment is attached to a lesson (or any non-post), ensure an anchor exists in `posts` table
    // to satisfy the PostgreSQL foreign key constraint (comments_post_id_fkey).
    if (c.postId.startsWith("l-") || !c.postId.startsWith("p-")) {
      try {
        await supabase.from("posts").upsert(
          {
            id: c.postId,
            author_id: c.authorId || "u-admin",
            category: "lesson_anchor",
            title: `Lesson Discussion Anchor (${c.postId})`,
            body: "Internal anchor for lesson discussions and comments",
            pinned: false,
            likes: [],
            created_at: c.createdAt || new Date().toISOString(),
            thumbnail: null,
            community_id: null,
          },
          { onConflict: "id" }
        );
      } catch {}
    }

    // 2. Perform the comment upsert
    const { error } = await supabase.from("comments").upsert(
      {
        id: c.id,
        post_id: c.postId,
        author_id: c.authorId || "u-admin",
        body: c.body || "",
        created_at: c.createdAt || new Date().toISOString(),
        status: c.status || "approved",
      },
      { onConflict: "id" }
    );

    // 3. If a foreign key violation still occurs (e.g. legacy/unexpected postId or authorId), self-heal and retry
    if (error) {
      if (error.code === "23503") {
        try {
          await supabase.from("posts").upsert(
            {
              id: c.postId,
              author_id: "u-admin",
              category: "lesson_anchor",
              title: `Discussion Anchor (${c.postId})`,
              body: "Internal anchor for comments",
              pinned: false,
              likes: [],
              created_at: c.createdAt || new Date().toISOString(),
              thumbnail: null,
              community_id: null,
            },
            { onConflict: "id" }
          );
        } catch {}

        const retry = await supabase.from("comments").upsert(
          {
            id: c.id,
            post_id: c.postId,
            author_id: c.authorId || "u-admin",
            body: c.body || "",
            created_at: c.createdAt || new Date().toISOString(),
            status: c.status || "approved",
          },
          { onConflict: "id" }
        );
        if (retry.error) {
          console.error("Error upserting comment to Supabase on retry:", retry.error);
        }
      } else {
        console.error("Error upserting comment to Supabase:", error);
      }
    }
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
        is_meet_active: !!p.isMeetActive,
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
    const payload = {
      user_id: p.userId,
      course_id: p.courseId,
      completed_lesson_ids: p.completedLessonIds || [],
    };

    // 1. Direct update by user_id and course_id (never triggers PostgREST onConflict 'id' check)
    const { data: updated } = await supabase
      .from("progress")
      .update({ completed_lesson_ids: payload.completed_lesson_ids })
      .eq("user_id", p.userId)
      .eq("course_id", p.courseId)
      .select("user_id, course_id");

    if (updated && updated.length > 0) {
      return;
    }

    // 2. If row did not exist yet, insert directly
    await supabase.from("progress").insert(payload);
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

export async function deleteReviewFromSupabase(reviewId: string) {
  try {
    const supabase = getAdminSupabase();
    await supabase.from("reviews").delete().eq("id", reviewId);
  } catch (err) {
    console.error("Error deleting review from Supabase:", err);
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
    const payload = {
      token: s.token,
      user_id: s.userId,
      device_id: s.deviceId || null,
      created_at: s.createdAt || new Date().toISOString(),
    };
    const { data: updated } = await supabase
      .from("sessions")
      .update(payload)
      .eq("token", s.token)
      .select("token");

    if (updated && updated.length > 0) {
      return;
    }

    await supabase.from("sessions").insert(payload);
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

export async function syncVideoResourceToSupabase(v: VideoResource) {
  try {
    const supabase = getAdminSupabase();
    await supabase.from("video_resources").upsert(
      {
        id: v.id,
        title: v.title,
        description: v.description || "",
        video_url: v.videoUrl || null,
        video_file_url: v.videoFileUrl || null,
        video_file_data: v.videoFileData || null,
        thumbnail_url: v.thumbnailUrl || null,
        duration: v.duration || null,
        category: v.category || "overview",
        course_id: v.courseId || null,
        community_id: v.communityId || null,
        author_id: v.authorId || null,
        is_public: v.isPublic ?? true,
        is_featured: !!v.isFeatured,
        view_count: v.viewCount || 0,
        metadata: v.metadata || {},
        created_at: v.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.error("Error syncing video resource to Supabase:", err);
  }
}

export async function deleteVideoResourceFromSupabase(id: string) {
  try {
    const supabase = getAdminSupabase();
    await supabase.from("video_resources").delete().eq("id", id);
  } catch (err) {
    console.error("Error deleting video resource from Supabase:", err);
  }
}

export async function syncCommunityToSupabase(c: Community) {
  try {
    const supabase = getAdminSupabase();
    const fullPayload = {
      id: c.id,
      name: c.name,
      description: c.description,
      slug: c.slug,
      icon: c.icon || null,
      banner: c.banner || null,
      is_private: Boolean(c.isPrivate),
      member_count: c.memberCount || 0,
      online_count: c.onlineCount || 0,
      admin_count: c.adminCount || 1,
      type: c.type || "general",
      price: c.price || null,
      price_note: c.priceNote || null,
      headline: c.headline || null,
      about_headline: c.aboutHeadline || c.headline || null,
      about_description: c.aboutDescription || c.description || null,
      about_features: c.aboutFeatures ? JSON.stringify(c.aboutFeatures) : null,
      about_pain_points: c.aboutPainPoints ? JSON.stringify(c.aboutPainPoints) : null,
      about_closing_text: c.aboutClosingText || null,
      created_at: c.createdAt,
      created_by: c.createdBy || "u-admin",
    };

    const { error } = await supabase.from("communities").upsert(fullPayload, { onConflict: "id" });
    if (error) {
      const basePayload = {
        id: c.id,
        name: c.name,
        description: c.description,
        slug: c.slug,
        icon: c.icon || null,
        banner: c.banner || null,
        is_private: Boolean(c.isPrivate),
        member_count: c.memberCount || 0,
        online_count: c.onlineCount || 0,
        admin_count: c.adminCount || 1,
        type: c.type || "general",
        created_at: c.createdAt,
        created_by: c.createdBy || "u-admin",
      };
      await supabase.from("communities").upsert(basePayload, { onConflict: "id" });
    }
  } catch (err) {
    console.error("Error syncing community to Supabase:", err);
  }
}

export async function deleteCommunityFromSupabase(id: string) {
  try {
    const supabase = getAdminSupabase();
    await supabase.from("communities").delete().eq("id", id);
  } catch (err) {
    console.error("Error deleting community from Supabase:", err);
  }
}

export async function syncCalendarEventToSupabase(ev: CalendarEvent): Promise<boolean> {
  try {
    const supabase = getAdminSupabase();
    const isCancelled = ev.status === "cancelled" || !!ev.isCancelled;
    const basePayload = {
      id: ev.id,
      title: ev.title,
      start_time: ev.start,
      end_time: ev.end,
      type: isCancelled ? "cancelled" : (ev.type || "live"),
      description: isCancelled && !ev.description?.startsWith("[CANCELLED]")
        ? `[CANCELLED] ${ev.description || ""}`.trim()
        : (ev.description || ""),
    };

    const { error } = await supabase.from("events").upsert(basePayload, { onConflict: "id" });
    if (error) {
      console.error(`Error syncing calendar event (${ev.id}) to Supabase:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Exception syncing calendar event to Supabase:", err);
    return false;
  }
}

export async function softDeleteCalendarEventInSupabase(id: string): Promise<boolean> {
  try {
    const supabase = getAdminSupabase();
    const { data: existing } = await supabase.from("events").select("*").eq("id", id).single();
    if (existing) {
      const updatedDesc = existing.description?.startsWith("[CANCELLED]")
        ? existing.description
        : `[CANCELLED] ${existing.description || ""}`.trim();
      const { error } = await supabase.from("events").update({
        type: "cancelled",
        description: updatedDesc,
      }).eq("id", id);
      if (error) {
        console.error(`Error soft-deleting calendar event (${id}) in Supabase:`, error);
        return false;
      }
      return true;
    }
    return true;
  } catch (err) {
    console.error(`Exception soft-deleting calendar event (${id}) in Supabase:`, err);
    return false;
  }
}

export async function deleteCalendarEventFromSupabase(id: string): Promise<boolean> {
  return softDeleteCalendarEventInSupabase(id);
}



