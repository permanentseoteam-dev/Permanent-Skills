"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  MessageCircle,
  Pin,
  SlidersHorizontal,
  Star,
  ThumbsUp,
  Trash2,
  X,
  Lock,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Avatar, Card, PrimaryButton, StaffRoleFavicon } from "@/components/ui";
import { CATEGORIES, timeAgo } from "@/lib/format";
import { getLevel } from "@/lib/levels";
import type { Comment, Post, PostCategory, PublicUser } from "@/lib/types";

export function AvatarWithLevel({
  user,
  size = 40,
  className = "",
}: {
  user?: PublicUser | null;
  size?: number;
  className?: string;
}) {
  const lvl = getLevel(user?.points || 0).level;
  const isStaff = user?.role === "admin" || user?.role === "manager";
  const isAdmin = user?.role === "admin";

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <Avatar user={user} size={size} />
      {/* Level badge on bottom right */}
      <span
        className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0284c7] text-[10px] font-extrabold text-white ring-2 ring-white shadow-xs"
        title={`Level ${lvl}`}
      >
        {lvl}
      </span>
      {/* Staff favicon on top left */}
      {isStaff && (
        <span
          className={`absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black text-white ring-2 ring-white shadow-xs ${
            isAdmin ? "bg-black text-amber-300 border border-amber-400/50" : "bg-blue-700 text-blue-100 border border-blue-300/50"
          }`}
          title={isAdmin ? "Admin Verified" : "Manager Verified"}
        >
          {isAdmin ? "⚡" : "★"}
        </span>
      )}
    </div>
  );
}

export function PostComposer({ defaultCategory }: { defaultCategory?: PostCategory } = {}) {
  const { createPost, user, activeCommunity } = useApp();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<PostCategory>(defaultCategory || "chat");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (composerRef.current && !composerRef.current.contains(target)) {
        if (!busy) {
          setOpen(false);
        }
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, busy]);

  useEffect(() => {
    if (defaultCategory) {
      setCategory(defaultCategory);
    }
  }, [defaultCategory]);

  const isTeamCommunity = activeCommunity?.type === "team" || activeCommunity?.id === "comm-team";
  const isTeamMemberRestricted =
    isTeamCommunity && user?.role !== "admin" && user?.role !== "manager";

  function handleOpen() {
    if (isTeamMemberRestricted) return;
    setError(null);
    setSuccess(null);
    setOpen(true);
  }

  async function submit() {
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const targetComm = category === "team" ? "comm-team" : activeCommunity?.id;
      const res = await createPost(title, body, category, targetComm);
      if (!res.ok) {
        setError(res.error || "Failed to create post. Please try again.");
        return;
      }
      setTitle("");
      setBody("");
      if (res.pendingApproval || res.message) {
        setSuccess(res.message || "Your post is sent to admin for approval.");
        setTimeout(() => {
          setSuccess(null);
          setOpen(false);
        }, 3000);
      } else {
        setOpen(false);
      }
    } finally {
      setBusy(false);
    }
  }

  // If in Team Members community and user is a regular team member (watch, comment, take notes only)
  if (isTeamMemberRestricted) {
    return (
      <div className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 px-4 py-3 text-left shadow-xs">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-600">
          <Lock size={16} />
        </div>
        <div>
          <p className="text-xs font-semibold text-zinc-800">
            Team Member Access (Watch, Comment & Notes)
          </p>
          <p className="text-[11px] text-zinc-500">
            You have full access to watch lessons, leave comments, and record Word notes. Top-level posts are managed by Admins & Managers.
          </p>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200/90 bg-white px-3.5 sm:px-4 py-2.5 sm:py-3 text-left shadow-xs hover:border-zinc-300 hover:shadow-sm transition cursor-pointer active:scale-[0.99]"
      >
        <AvatarWithLevel user={user} size={36} />
        <span className="text-xs sm:text-sm font-medium text-zinc-400">Write something...</span>
      </button>
    );
  }

  const canSeeTeam = user?.role === "admin" || user?.role === "manager" || user?.role === "team_member";
  const postCategories: PostCategory[] = canSeeTeam
    ? ["chat", "wins", "recorded", "reviews", "team"]
    : ["chat", "wins", "recorded", "reviews"];

  return (
    <Card ref={composerRef} className="p-3.5 sm:p-5">
      {error && (
        <div className="mb-3 rounded-xl bg-red-50 p-2.5 text-xs font-semibold text-red-700 border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-3 rounded-xl bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
          <Check size={14} className="text-emerald-600" />
          <span>{success}</span>
        </div>
      )}
      <div className="mb-3 flex gap-1.5 sm:gap-2 flex-wrap">
        {postCategories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize transition cursor-pointer ${
              category === c
                ? "bg-zinc-900 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80"
            }`}
          >
            {c === "team" && (
              <img src="/team-icon.png" alt="" className="h-3.5 w-3.5 rounded object-cover shrink-0" />
            )}
            <span>{c === "chat" ? "General discussion" : c === "recorded" ? "Replays" : c === "team" ? "Team" : c}</span>
          </button>
        ))}
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="mb-2 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-base sm:text-sm text-zinc-900 outline-none focus:border-zinc-900 shadow-2xs"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share a question, win, or discussion..."
        className="min-h-[105px] sm:min-h-[115px] w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-base sm:text-sm text-zinc-900 outline-none focus:border-zinc-900 shadow-2xs resize-y"
      />
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={() => setOpen(false)} className="rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-800 transition cursor-pointer">
          Cancel
        </button>
        <PrimaryButton disabled={busy || !body.trim()} onClick={submit} className="py-2 sm:py-2.5 px-4 text-xs sm:text-sm font-bold">
          {busy ? "Posting..." : "Post"}
        </PrimaryButton>
      </div>
    </Card>
  );
}

export function Feed({
  category,
  targetPostId,
}: {
  category: "all" | PostCategory;
  targetPostId?: string | null;
}) {
  const {
    posts,
    comments,
    userById,
    user,
    activeCommunity,
    toggleLike,
    addComment,
    togglePin,
    deletePost,
    approvePost,
    rejectPost,
    approveComment,
    rejectComment,
    deleteComment,
  } = useApp();

  const [selectedPostId, setSelectedPostId] = useState<string | null>(targetPostId || null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, { text: string; isError?: boolean }>>({});
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Auto-open modal or highlight target post from notification deep link
  useEffect(() => {
    if (targetPostId) {
      setSelectedPostId(targetPostId);
      setHighlightedId(targetPostId);

      const timer = setTimeout(() => {
        const el = document.getElementById(`post-${targetPostId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 200);

      const clearTimer = setTimeout(() => {
        setHighlightedId(null);
      }, 4500);

      return () => {
        clearTimeout(timer);
        clearTimeout(clearTimer);
      };
    }
  }, [targetPostId]);

  const isStaff = user?.role === "admin" || user?.role === "manager";

  const list = useMemo(() => {
    const communityId = activeCommunity?.id || "comm-students";
    const canSeeTeam = user?.role === "admin" || user?.role === "manager" || user?.role === "team_member";

    const scoped = posts.filter((p) => {
      const isTeamPost = p.category === "team" || p.communityId === "comm-team";

      // If user cannot see team, strictly exclude all team posts
      if (isTeamPost && !canSeeTeam) return false;

      // When specifically selecting the "Team" tab: show all team posts
      if (category === "team") {
        return isTeamPost;
      }

      // When inside the "Team Members" community hub ("comm-team"):
      if (communityId === "comm-team") {
        return isTeamPost;
      }

      // For standard communities (AI Architects, Students, etc.):
      const matchesCommunity =
        !p.communityId ||
        p.communityId === communityId ||
        (communityId === "comm-students" && (!p.communityId || p.communityId === "comm-pss"));

      // On "All" tab: show community posts AND team posts for authorized staff / team members
      if (category === "all") {
        return matchesCommunity || (isTeamPost && canSeeTeam);
      }

      return matchesCommunity;
    });

    // Visibility filter: Approved posts or posts created by the current user or viewed by staff
    const visible = scoped.filter(
      (p) => p.status === "approved" || !p.status || p.authorId === user?.id || isStaff
    );

    const filtered = visible.filter((p) => {
      if (category === "all") return true;
      if (category === "team") return p.category === "team" || p.communityId === "comm-team";
      return p.category === category;
    });

    return [...filtered].sort((a, b) => {
      const aPinned = Boolean(a.pinned);
      const bPinned = Boolean(b.pinned);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
  }, [posts, category, activeCommunity?.id, user?.id, isStaff, user?.role]);

  function handleOpenPost(postId: string) {
    setSelectedPostId(postId);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("post", postId);
      window.history.pushState({}, "", url.toString());
    } catch {
      // Ignore
    }
  }

  function handleClosePost() {
    setSelectedPostId(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("post");
      url.searchParams.delete("postId");
      window.history.replaceState({}, "", url.toString());
    } catch {
      // Ignore
    }
  }

  const selectedPost = selectedPostId ? posts.find((p) => p.id === selectedPostId) : null;

  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 mb-3">
          <MessageCircle size={26} />
        </div>
        <h3 className="text-lg font-bold text-zinc-900">No posts in this category yet</h3>
        <p className="mt-1 text-sm text-zinc-500 max-w-md mx-auto">
          Be the first to share an insight, ask a question, or start a discussion in this community!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {list.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isHighlighted={highlightedId === post.id}
            onOpen={() => handleOpenPost(post.id)}
            onLike={() => toggleLike(post.id)}
            onPin={() => togglePin(post.id)}
            onApprovePost={() => approvePost(post.id)}
            onRejectPost={() => rejectPost(post.id)}
            onDeletePost={() => {
              if (confirm("Are you sure you want to delete this post?")) {
                deletePost(post.id);
              }
            }}
            comments={comments.filter((c) => c.postId === post.id)}
            author={userById(post.authorId)}
            isStaff={isStaff}
            currentUserId={user?.id}
            liked={!!user && post.likes.includes(user.id)}
            userById={userById}
          />
        ))}
      </div>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          author={userById(selectedPost.authorId)}
          comments={comments.filter((c) => c.postId === selectedPost.id)}
          onClose={handleClosePost}
          onLike={() => toggleLike(selectedPost.id)}
          onPin={() => togglePin(selectedPost.id)}
          onApprovePost={() => approvePost(selectedPost.id)}
          onRejectPost={() => rejectPost(selectedPost.id)}
          onDeletePost={() => {
            if (confirm("Are you sure you want to delete this post?")) {
              deletePost(selectedPost.id);
              handleClosePost();
            }
          }}
          draft={drafts[selectedPost.id] || ""}
          setDraft={(v) => setDrafts((s) => ({ ...s, [selectedPost.id]: v }))}
          feedback={feedback[selectedPost.id]?.text || ""}
          feedbackIsError={feedback[selectedPost.id]?.isError}
          onComment={async (textToSubmit?: string) => {
            const text = textToSubmit || drafts[selectedPost.id];
            if (!text?.trim()) return;
            const res = await addComment(selectedPost.id, text);
            setDrafts((s) => ({ ...s, [selectedPost.id]: "" }));
            if (res.message) {
              setFeedback((s) => ({ ...s, [selectedPost.id]: { text: res.message!, isError: false } }));
              setTimeout(() => setFeedback((s) => ({ ...s, [selectedPost.id]: { text: "" } })), 4000);
            } else if (res.error) {
              setFeedback((s) => ({ ...s, [selectedPost.id]: { text: res.error!, isError: true } }));
              setTimeout(() => setFeedback((s) => ({ ...s, [selectedPost.id]: { text: "" } })), 4000);
            }
          }}
          onApproveComment={(id) => approveComment(id)}
          onRejectComment={(id) => rejectComment(id)}
          onDeleteComment={(id) => deleteComment(id)}
          isStaff={isStaff}
          currentUserId={user?.id}
          currentUser={user}
          liked={!!user && selectedPost.likes.includes(user.id)}
          userById={userById}
        />
      )}
    </>
  );
}

function EcomMailGraphic() {
  return (
    <div className="hidden sm:flex h-24 w-28 shrink-0 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-200/80 p-3 shadow-xs">
      <div className="relative flex flex-col items-center">
        {/* White envelope */}
        <div className="relative h-12 w-16 rounded-md bg-white border border-zinc-300 shadow-sm flex items-center justify-center overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-5 border-b border-red-500/80 bg-red-50/50 transform -skew-y-6" />
          <div className="absolute top-0 left-0 right-0 h-5 border-b border-red-500/80 bg-red-50/50 transform skew-y-6" />
          {/* Cool sunglasses */}
          <div className="relative z-10 flex items-center gap-0.5 mt-2">
            <div className="h-3 w-4 bg-zinc-950 rounded-b-sm" />
            <div className="h-0.5 w-1 bg-zinc-950" />
            <div className="h-3 w-4 bg-zinc-950 rounded-b-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PostCard({
  post,
  author,
  comments,
  onOpen,
  onLike,
  onPin,
  onApprovePost,
  onRejectPost,
  onDeletePost,
  isStaff,
  currentUserId,
  liked,
  userById,
  isHighlighted,
}: {
  post: Post;
  author: ReturnType<ReturnType<typeof useApp>["userById"]>;
  comments: Comment[];
  onOpen: () => void;
  onLike: () => void;
  onPin: () => void;
  onApprovePost?: () => void;
  onRejectPost?: () => void;
  onDeletePost?: () => void;
  isStaff: boolean;
  currentUserId?: string;
  liked: boolean;
  userById: ReturnType<typeof useApp>["userById"];
  isHighlighted?: boolean;
}) {
  const visibleComments = comments.filter(
    (c) => c.status === "approved" || !c.status || c.authorId === currentUserId || isStaff
  );

  const lastComment = visibleComments[visibleComments.length - 1];

  const categoryLabel =
    post.category === "chat"
      ? "General discussion"
      : post.category === "wins"
      ? "Wins"
      : post.category === "recorded"
      ? "Replay"
      : post.category === "team"
      ? "Team"
      : "Review";

  const isPending = post.status === "pending";

  return (
    <Card
      id={`post-${post.id}`}
      onClick={onOpen}
      className={`p-3.5 sm:p-5 transition-all duration-200 cursor-pointer hover:border-zinc-300 hover:shadow-md active:scale-[0.998] ${
        isHighlighted
          ? "ring-2 ring-[#5051F9] ring-offset-2 shadow-lg bg-indigo-50/15"
          : isPending
          ? "border-amber-300/80 bg-amber-50/15"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2.5 sm:gap-3">
        <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
          <Link
            href={`/profile/${author?.id || ""}`}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 transition hover:opacity-90"
          >
            <AvatarWithLevel user={author} size={38} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Link
                href={`/profile/${author?.id || ""}`}
                onClick={(e) => e.stopPropagation()}
                className="font-bold text-xs sm:text-sm text-zinc-950 hover:underline truncate"
              >
                {author?.name || "Vex Media Group Admin"}
              </Link>
              <StaffRoleFavicon role={author?.role} size="xs" />
              {isPending && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-amber-800 border border-amber-300">
                  <Clock size={10} /> ⏳ Pending Approval
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-500 font-normal flex items-center gap-1 sm:gap-1.5 flex-wrap">
              <span>{timeAgo(post.createdAt)}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                {post.category === "team" && (
                  <img src="/team-icon.png" alt="" className="h-3 w-3 rounded object-cover inline-block shrink-0" />
                )}
                <span>{categoryLabel}</span>
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-wrap justify-end">
          {isStaff && isPending && (
            <div className="flex items-center gap-1 mr-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApprovePost?.();
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs transition cursor-pointer active:scale-95"
                title="Approve post"
              >
                <Check size={12} /> <span className="hidden sm:inline">Approve</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRejectPost?.();
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold text-red-700 hover:bg-red-200 transition cursor-pointer active:scale-95"
                title="Reject post"
              >
                <X size={12} /> <span className="hidden sm:inline">Reject</span>
              </button>
            </div>
          )}
          {post.pinned && (
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-zinc-700 bg-transparent px-1 py-0.5">
              <Pin size={12} className="fill-zinc-700" /> <span className="hidden sm:inline">Pinned</span>
            </span>
          )}
          {isStaff && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPin();
              }}
              className="text-xs font-medium text-zinc-400 hover:text-zinc-800 transition cursor-pointer px-1"
            >
              {post.pinned ? "Unpin" : "Pin"}
            </button>
          )}
          {(isStaff || post.authorId === currentUserId) && onDeletePost && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeletePost();
              }}
              className="text-xs text-zinc-400 hover:text-red-500 transition p-1 rounded cursor-pointer"
              title="Delete post"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 sm:mt-3.5 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-bold text-zinc-950 flex items-center gap-2 break-words group-hover:text-primary transition-colors">
            {post.title.includes("Entrepreneurship") && !post.title.includes("🔵") ? (
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500 shrink-0" />
            ) : null}
            <span>{post.title}</span>
          </h3>
          <p className="mt-1.5 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-zinc-600 line-clamp-3 break-words">
            {post.body}
          </p>
        </div>

        {post.thumbnail === "ecom-mail" && <EcomMailGraphic />}
      </div>

      {post.thumbnail === "replay" && (
        <div className="group block mt-3.5 sm:mt-4 overflow-hidden rounded-xl bg-gradient-to-br from-[#0b1b4a] to-[#5051F9] p-4 sm:p-6 text-white transition">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-white/70">Replay Session</p>
          <p className="mt-1 sm:mt-1.5 text-lg sm:text-xl font-black break-words">{post.title.replace("Replay: ", "")}</p>
          <p className="mt-1 text-xs text-white/80">Watch full recording & discussion →</p>
        </div>
      )}

      {/* Skool Segmented Reaction Bar */}
      <div className="mt-3.5 sm:mt-4 pt-2.5 flex items-center justify-between gap-3 text-xs text-zinc-500 border-t border-zinc-100/80">
        <div className="flex items-center gap-3">
          {/* Segmented Like Button */}
          <div className="inline-flex items-center rounded-lg border border-zinc-200 overflow-hidden font-semibold shadow-2xs">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 transition cursor-pointer active:scale-95 ${
                liked
                  ? "bg-[#5051F9]/10 text-primary font-bold"
                  : "bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              <ThumbsUp size={13} fill={liked ? "currentColor" : "none"} />
              <span className="text-[11px] sm:text-xs">Like</span>
            </button>
            <span className="bg-zinc-50 px-2 sm:px-2.5 py-1 sm:py-1.5 text-zinc-500 border-l border-zinc-200 font-bold min-w-[24px] text-center text-[11px] sm:text-xs">
              {post.likes.length || 0}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="inline-flex items-center gap-1.5 font-medium text-zinc-600 hover:text-zinc-900 transition cursor-pointer"
          >
            <MessageCircle size={15} />
            <span>{visibleComments.length} {visibleComments.length === 1 ? "comment" : "comments"}</span>
          </button>

          {/* Commenters avatars stack */}
          {visibleComments.length > 0 && (
            <div className="hidden sm:flex items-center -space-x-1.5 pl-0.5">
              {visibleComments.slice(0, 4).map((c) => (
                <Avatar key={c.id} user={userById(c.authorId)} size={20} className="border border-white shadow-xs" />
              ))}
            </div>
          )}
        </div>

        {lastComment && (
          <span className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
            Last comment {timeAgo(lastComment.createdAt)}
          </span>
        )}
      </div>
    </Card>
  );
}

function PostModal({
  post,
  author,
  comments,
  onClose,
  onLike,
  onPin,
  onApprovePost,
  onRejectPost,
  onDeletePost,
  draft,
  setDraft,
  feedback,
  feedbackIsError,
  onComment,
  onApproveComment,
  onRejectComment,
  onDeleteComment,
  isStaff,
  currentUserId,
  currentUser,
  liked,
  userById,
}: {
  post: Post;
  author: ReturnType<ReturnType<typeof useApp>["userById"]>;
  comments: Comment[];
  onClose: () => void;
  onLike: () => void;
  onPin: () => void;
  onApprovePost?: () => void;
  onRejectPost?: () => void;
  onDeletePost?: () => void;
  draft: string;
  setDraft: (v: string) => void;
  feedback?: string;
  feedbackIsError?: boolean;
  onComment: (textToSubmit?: string) => Promise<void>;
  onApproveComment: (id: string) => void;
  onRejectComment: (id: string) => void;
  onDeleteComment: (id: string) => void;
  isStaff: boolean;
  currentUserId?: string;
  currentUser?: PublicUser | null;
  liked: boolean;
  userById: ReturnType<typeof useApp>["userById"];
}) {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Handle Escape key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function scrollToBottom() {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleReply(authorName?: string) {
    if (!authorName) return;
    setDraft(`@${authorName} `);
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  }

  const visibleComments = comments.filter(
    (c) => c.status === "approved" || !c.status || c.authorId === currentUserId || isStaff
  );

  const categoryLabel =
    post.category === "chat"
      ? "General discussion"
      : post.category === "wins"
      ? "Wins"
      : post.category === "recorded"
      ? "Replay"
      : post.category === "team"
      ? "Team"
      : "Review";

  const isPending = post.status === "pending";

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Screen Close Button (Skool top-left round close button) */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-3 left-3 sm:top-5 sm:left-5 z-[100] flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-zinc-900/85 hover:bg-zinc-900 text-white shadow-2xl transition cursor-pointer backdrop-blur-md active:scale-95 border border-white/10"
        title="Close (Esc)"
        aria-label="Close"
      >
        <X size={18} />
      </button>

      {/* Main Post Modal Card */}
      <div
        ref={modalContentRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[680px] max-h-[92vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-zinc-200/90 flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 p-4 sm:p-6 pb-3 border-b border-zinc-100 shrink-0">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <Link href={`/profile/${author?.id || ""}`} onClick={onClose} className="shrink-0">
              <AvatarWithLevel user={author} size={42} />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <Link
                  href={`/profile/${author?.id || ""}`}
                  onClick={onClose}
                  className="font-bold text-sm sm:text-base text-zinc-950 hover:underline truncate"
                >
                  {author?.name || "Vex Media Group Admin"}
                </Link>
                <StaffRoleFavicon role={author?.role} size="xs" />
                {isPending && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-amber-800 border border-amber-300">
                    <Clock size={10} /> ⏳ Pending Approval
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 font-normal flex items-center gap-1 sm:gap-1.5 flex-wrap mt-0.5">
                <span>{timeAgo(post.createdAt)}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  {post.category === "team" && (
                    <img src="/team-icon.png" alt="" className="h-3.5 w-3.5 rounded object-cover inline-block shrink-0" />
                  )}
                  <span>{categoryLabel}</span>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isStaff && isPending && (
              <div className="flex items-center gap-1 mr-1">
                <button
                  onClick={onApprovePost}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs transition cursor-pointer active:scale-95"
                >
                  <Check size={12} /> <span className="hidden sm:inline">Approve</span>
                </button>
                <button
                  onClick={onRejectPost}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-200 transition cursor-pointer active:scale-95"
                >
                  <X size={12} /> <span className="hidden sm:inline">Reject</span>
                </button>
              </div>
            )}
            {post.pinned && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-700 bg-zinc-100 rounded-lg px-2 py-1">
                <Pin size={12} className="fill-zinc-700" /> <span className="hidden sm:inline">Pinned</span>
              </span>
            )}
            {isStaff && (
              <button
                onClick={onPin}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 rounded-lg px-2 py-1 hover:bg-zinc-100 transition cursor-pointer"
              >
                {post.pinned ? "Unpin" : "Pin"}
              </button>
            )}
            {(isStaff || post.authorId === currentUserId) && onDeletePost && (
              <button
                onClick={onDeletePost}
                className="text-xs text-zinc-400 hover:text-red-500 transition p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                title="Delete post"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition cursor-pointer ml-1"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Post Title */}
          <h2 className="text-lg sm:text-2xl font-black text-zinc-950 tracking-tight leading-snug break-words">
            {post.title.includes("Entrepreneurship") && !post.title.includes("🔵") ? (
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500 mr-2 shrink-0" />
            ) : null}
            <span>{post.title}</span>
          </h2>

          {/* Post Body */}
          <div className="text-sm sm:text-base text-zinc-800 leading-relaxed whitespace-pre-wrap break-words">
            {post.body}
          </div>

          {post.thumbnail === "ecom-mail" && (
            <div className="pt-2">
              <EcomMailGraphic />
            </div>
          )}

          {post.thumbnail === "replay" && (
            <Link
              href="/calendar"
              onClick={onClose}
              className="group block overflow-hidden rounded-xl bg-gradient-to-br from-[#0b1b4a] to-[#5051F9] p-5 sm:p-7 text-white hover:shadow-md transition mt-3"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-white/70">Replay Session</p>
              <p className="mt-1.5 text-xl sm:text-2xl font-black group-hover:underline break-words">{post.title.replace("Replay: ", "")}</p>
              <p className="mt-1.5 text-xs sm:text-sm text-white/80">Watch full recording inside Classroom & Meet →</p>
            </Link>
          )}

          {/* Reaction & Engagement Bar */}
          <div className="flex items-center justify-between border-t border-b border-zinc-100 py-3 mt-4 text-xs">
            <div className="flex items-center gap-3">
              {/* Segmented Like Button matching Skool */}
              <div className="inline-flex items-center rounded-lg border border-zinc-200 overflow-hidden font-semibold shadow-2xs">
                <button
                  onClick={onLike}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 transition cursor-pointer active:scale-95 ${
                    liked
                      ? "bg-[#5051F9]/10 text-primary font-bold"
                      : "bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <ThumbsUp size={14} fill={liked ? "currentColor" : "none"} />
                  <span>Like</span>
                </button>
                <span className="bg-zinc-50 px-2.5 py-1.5 text-zinc-600 border-l border-zinc-200 font-bold min-w-[28px] text-center">
                  {post.likes.length || 0}
                </span>
              </div>

              <span className="text-zinc-500 font-medium flex items-center gap-1.5">
                <MessageCircle size={15} />
                <span>{visibleComments.length} {visibleComments.length === 1 ? "comment" : "comments"}</span>
              </span>
            </div>
          </div>

          {/* Comments Thread Section */}
          <div className="space-y-3 pt-2">
            {visibleComments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 p-6 text-center text-xs text-zinc-500">
                <MessageCircle size={22} className="mx-auto text-zinc-400 mb-1 opacity-70" />
                <p className="font-semibold text-zinc-700">No comments yet</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Be the first to join this discussion!</p>
              </div>
            ) : (
              visibleComments.map((c) => {
                const isPendingComment = c.status === "pending";
                const commentAuthor = userById(c.authorId);
                const isCommentStaff = commentAuthor?.role === "admin" || commentAuthor?.role === "manager";
                const canDelete = isStaff || c.authorId === currentUserId;

                return (
                  <div key={c.id} className="flex items-start gap-2.5 sm:gap-3 group">
                    <Link href={`/profile/${commentAuthor?.id || ""}`} onClick={onClose} className="shrink-0 mt-1">
                      <AvatarWithLevel user={commentAuthor} size={32} />
                    </Link>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div
                        className={`rounded-2xl p-3 sm:p-3.5 border ${
                          isCommentStaff
                            ? commentAuthor?.role === "admin"
                              ? "bg-amber-50/40 border-amber-200/80"
                              : "bg-blue-50/40 border-blue-200/80"
                            : "bg-zinc-50/90 border-zinc-100"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            href={`/profile/${commentAuthor?.id || ""}`}
                            onClick={onClose}
                            className="text-xs sm:text-sm font-bold text-zinc-950 hover:underline truncate"
                          >
                            {commentAuthor?.name || "Community Member"}
                          </Link>
                          <StaffRoleFavicon role={commentAuthor?.role} size="xs" />
                          <span className="text-[11px] text-zinc-400">· {timeAgo(c.createdAt)}</span>
                          {isPendingComment && (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                              <Clock size={10} /> Pending Approval
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-zinc-800 mt-1 whitespace-pre-wrap leading-relaxed break-words">
                          {c.body}
                        </p>
                      </div>

                      {/* Comment Action Links */}
                      <div className="flex items-center gap-3 pl-2 text-xs font-semibold text-zinc-500">
                        <button
                          type="button"
                          onClick={() => handleReply(commentAuthor?.name)}
                          className="hover:text-primary transition cursor-pointer"
                        >
                          Reply
                        </button>

                        {isStaff && isPendingComment && (
                          <>
                            <button
                              onClick={() => onApproveComment(c.id)}
                              className="text-emerald-600 hover:text-emerald-700 transition cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onRejectComment(c.id)}
                              className="text-red-600 hover:text-red-700 transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this comment?")) {
                                onDeleteComment(c.id);
                              }
                            }}
                            className="text-zinc-400 hover:text-red-500 transition cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Jump to latest comment button */}
            {visibleComments.length > 3 && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white border border-zinc-200/90 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition cursor-pointer active:scale-95"
                >
                  <ChevronDown size={14} />
                  <span>Jump to latest comment</span>
                </button>
              </div>
            )}

            <div ref={commentsEndRef} />
          </div>
        </div>

        {/* Sticky Bottom Comment Form */}
        <div className="border-t border-zinc-100 bg-white p-3.5 sm:p-4 shrink-0">
          {feedback && (
            <div
              className={`mb-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold border ${
                feedbackIsError
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              {feedback}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onComment();
            }}
            className="space-y-1.5"
          >
            <div className="flex gap-2.5 items-center">
              <AvatarWithLevel user={currentUser} size={34} />
              <input
                ref={commentInputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 rounded-full bg-zinc-100 px-4 py-2 text-base sm:text-sm outline-none focus:bg-white focus:ring-1 focus:ring-zinc-900 border border-transparent focus:border-zinc-200 shadow-2xs"
              />
              <PrimaryButton
                type="submit"
                disabled={!draft.trim()}
                className="py-2 px-4 text-xs sm:text-sm font-bold shrink-0"
              >
                Send
              </PrimaryButton>
            </div>
            {!isStaff && (
              <p className="px-3 text-[10px] sm:text-[11px] text-zinc-400 flex items-center gap-1">
                <Clock size={11} /> Comments require manager or admin approval before becoming visible to all members.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export function LiveBanner() {
  const { events } = useApp();
  const next = [...events]
    .filter((e) => new Date(e.start).getTime() > Date.now() - 60 * 60 * 1000)
    .sort((a, b) => +new Date(a.start) - +new Date(b.start))[0];
  if (!next) return null;

  const eventDate = new Date(next.start);
  const today = new Date();
  const isToday = eventDate.toDateString() === today.toDateString();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const isTomorrow = eventDate.toDateString() === tomorrow.toDateString();
  const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / 86400000);
  const label = isToday ? "today" : isTomorrow ? "tomorrow" : `in ${Math.max(2, diffDays)} days`;
  return (
    <Link
      href="/calendar"
      className="group flex items-center justify-between gap-2 rounded-2xl border border-zinc-200/90 bg-gradient-to-r from-zinc-50 via-zinc-100/60 to-transparent px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm transition hover:border-zinc-300 shadow-xs"
    >
      <div className="flex items-center gap-2 sm:gap-2.5 font-medium text-zinc-900 min-w-0">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-zinc-200 text-zinc-800">
          <CalendarDays size={15} />
        </span>
        <span className="truncate">
          <strong className="font-bold text-zinc-900">{next.title}</strong> is happening{" "}
          <span className="font-extrabold underline decoration-zinc-400">{label}</span>
        </span>
      </div>
      <span className="text-xs font-bold text-zinc-900 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 shrink-0">
        Join Call →
      </span>
    </Link>
  );
}

export function ReviewPrompt({
  onDismiss,
  onSelect,
}: {
  onDismiss: () => void;
  onSelect?: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className="flex items-center justify-between gap-2.5 rounded-2xl border border-amber-200/90 bg-amber-50 px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm cursor-pointer hover:bg-amber-100/70 transition shadow-2xs group"
    >
      <div className="flex items-center gap-2 font-medium text-amber-900 group-hover:text-amber-950 transition min-w-0">
        <Star size={16} className="text-amber-500 fill-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
        <span className="group-hover:underline truncate">Enjoying this group? Leave a review</span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md transition cursor-pointer shrink-0"
        title="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function CategoryPills({
  value,
  onChange,
}: {
  value: "all" | PostCategory;
  onChange: (v: "all" | PostCategory) => void;
}) {
  const { user } = useApp();
  const canSeeTeam = user?.role === "admin" || user?.role === "manager" || user?.role === "team_member";

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 scrollbar-none max-w-full">
        <button
          onClick={() => onChange("all")}
          className={`shrink-0 whitespace-nowrap rounded-full px-3.5 sm:px-4 py-1.5 text-xs font-semibold transition cursor-pointer active:scale-95 ${
            value === "all"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-white sm:bg-zinc-100 text-zinc-600 border border-zinc-200/70 sm:border-transparent hover:bg-zinc-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => onChange("chat")}
          className={`shrink-0 whitespace-nowrap rounded-full px-3.5 sm:px-4 py-1.5 text-xs font-semibold transition cursor-pointer active:scale-95 ${
            value === "chat"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-white sm:bg-zinc-100 text-zinc-600 border border-zinc-200/70 sm:border-transparent hover:bg-zinc-200"
          }`}
        >
          General discussion
        </button>
        <button
          onClick={() => onChange("wins")}
          className={`shrink-0 whitespace-nowrap rounded-full px-3.5 sm:px-4 py-1.5 text-xs font-semibold transition cursor-pointer active:scale-95 ${
            value === "wins"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-white sm:bg-zinc-100 text-zinc-600 border border-zinc-200/70 sm:border-transparent hover:bg-zinc-200"
          }`}
        >
          Wins
        </button>
        <button
          onClick={() => onChange("recorded")}
          className={`shrink-0 whitespace-nowrap rounded-full px-3.5 sm:px-4 py-1.5 text-xs font-semibold transition cursor-pointer active:scale-95 ${
            value === "recorded"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-white sm:bg-zinc-100 text-zinc-600 border border-zinc-200/70 sm:border-transparent hover:bg-zinc-200"
          }`}
        >
          Replays
        </button>
        <button
          onClick={() => onChange("reviews")}
          className={`shrink-0 whitespace-nowrap rounded-full px-3.5 sm:px-4 py-1.5 text-xs font-semibold transition cursor-pointer active:scale-95 ${
            value === "reviews"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-white sm:bg-zinc-100 text-zinc-600 border border-zinc-200/70 sm:border-transparent hover:bg-zinc-200"
          }`}
        >
          Reviews
        </button>
        {canSeeTeam && (
          <button
            onClick={() => onChange("team")}
            className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-full px-3.5 sm:px-4 py-1.5 text-xs font-semibold transition cursor-pointer active:scale-95 ${
              value === "team"
                ? "bg-zinc-900 text-white shadow-xs"
                : "bg-white sm:bg-zinc-100 text-zinc-600 border border-zinc-200/70 sm:border-transparent hover:bg-zinc-200"
            }`}
          >
            <img src="/team-icon.png" alt="" className="h-3.5 w-3.5 rounded object-cover shrink-0" />
            <span>Team</span>
          </button>
        )}
      </div>

      <button
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200/90 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition shadow-xs cursor-pointer active:scale-95"
        title="Filter & sort options"
      >
        <SlidersHorizontal size={14} />
      </button>
    </div>
  );
}
