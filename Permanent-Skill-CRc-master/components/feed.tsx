"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
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
    setOpen(true);
  }

  async function submit() {
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await createPost(title, body, category, activeCommunity?.id);
      if (!res.ok) {
        setError(res.error || "Failed to create post. Please try again.");
        return;
      }
      setTitle("");
      setBody("");
      setOpen(false);
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
        className="flex w-full items-center gap-3.5 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left shadow-xs hover:border-zinc-300 hover:shadow-sm transition"
      >
        <AvatarWithLevel user={user} size={38} />
        <span className="text-sm font-medium text-zinc-400">Write something</span>
      </button>
    );
  }

  return (
    <Card className="p-4">
      {error && (
        <div className="mb-3 rounded-xl bg-red-50 p-2.5 text-xs font-semibold text-red-700 border border-red-200">
          {error}
        </div>
      )}
      <div className="mb-3 flex gap-2 flex-wrap">
        {(["chat", "wins", "recorded", "reviews", "team"] as PostCategory[]).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
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
        className="mb-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share a question, win, or discussion..."
        className="min-h-[110px] w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900"
      />
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-zinc-500 hover:text-zinc-800">
          Cancel
        </button>
        <PrimaryButton disabled={busy || !body.trim()} onClick={submit}>
          {busy ? "Posting..." : "Post"}
        </PrimaryButton>
      </div>
    </Card>
  );
}

export function Feed({ category }: { category: "all" | PostCategory }) {
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
    approveComment,
    rejectComment,
    deleteComment,
  } = useApp();
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, { text: string; isError?: boolean }>>({});

  const list = useMemo(() => {
    const communityId = activeCommunity?.id || "comm-students";
    const scoped = posts.filter(
      (p) =>
        !p.communityId ||
        p.communityId === communityId ||
        (communityId === "comm-students" && (!p.communityId || p.communityId === "comm-pss"))
    );
    const filtered = scoped.filter((p) => category === "all" || p.category === category);
    return [...filtered].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
  }, [posts, category, activeCommunity?.id]);

  const isStaff = user?.role === "admin" || user?.role === "manager";

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
    <div className="space-y-4">
      {list.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          commentsOpen={!!openComments[post.id]}
          onToggleComments={() => setOpenComments((s) => ({ ...s, [post.id]: !s[post.id] }))}
          draft={drafts[post.id] || ""}
          setDraft={(v) => setDrafts((s) => ({ ...s, [post.id]: v }))}
          feedback={feedback[post.id]?.text || ""}
          feedbackIsError={feedback[post.id]?.isError}
          onLike={() => {
            toggleLike(post.id);
          }}
          onPin={() => togglePin(post.id)}
          onDeletePost={() => {
            if (confirm("Are you sure you want to delete this post?")) {
              deletePost(post.id);
            }
          }}
          onComment={async () => {
            const text = drafts[post.id];
            if (!text?.trim()) return;
            const res = await addComment(post.id, text);
            setDrafts((s) => ({ ...s, [post.id]: "" }));
            if (res.message) {
              setFeedback((s) => ({ ...s, [post.id]: { text: res.message!, isError: false } }));
              setTimeout(() => setFeedback((s) => ({ ...s, [post.id]: { text: "" } })), 4000);
            } else if (res.error) {
              setFeedback((s) => ({ ...s, [post.id]: { text: res.error!, isError: true } }));
              setTimeout(() => setFeedback((s) => ({ ...s, [post.id]: { text: "" } })), 4000);
            }
          }}
          onApproveComment={(id) => approveComment(id)}
          onRejectComment={(id) => rejectComment(id)}
          onDeleteComment={(id) => deleteComment(id)}
          comments={comments.filter((c) => c.postId === post.id)}
          author={userById(post.authorId)}
          isStaff={isStaff}
          currentUserId={user?.id}
          liked={!!user && post.likes.includes(user.id)}
          userById={userById}
        />
      ))}
    </div>
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
  commentsOpen,
  onToggleComments,
  draft,
  setDraft,
  feedback,
  feedbackIsError,
  onLike,
  onPin,
  onDeletePost,
  onComment,
  onApproveComment,
  onRejectComment,
  onDeleteComment,
  isStaff,
  currentUserId,
  liked,
  userById,
}: {
  post: Post;
  author: ReturnType<ReturnType<typeof useApp>["userById"]>;
  comments: Comment[];
  commentsOpen: boolean;
  onToggleComments: () => void;
  draft: string;
  setDraft: (v: string) => void;
  feedback?: string;
  feedbackIsError?: boolean;
  onLike: () => void;
  onPin: () => void;
  onDeletePost?: () => void;
  onComment: () => void;
  onApproveComment: (id: string) => void;
  onRejectComment: (id: string) => void;
  onDeleteComment: (id: string) => void;
  isStaff: boolean;
  currentUserId?: string;
  liked: boolean;
  userById: ReturnType<typeof useApp>["userById"];
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
      : "Review";

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${author?.id || ""}`}>
            <AvatarWithLevel user={author} size={40} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/profile/${author?.id || ""}`} className="font-bold text-sm text-zinc-950 hover:underline">
                {author?.name || "Vex Media Group Admin"}
              </Link>
              <StaffRoleFavicon role={author?.role} size="xs" />
            </div>
            <p className="text-xs text-zinc-500 font-normal">
              {timeAgo(post.createdAt)} · {categoryLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.pinned && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-700 bg-transparent px-1 py-0.5">
              <Pin size={12} className="fill-zinc-700" /> Pinned
            </span>
          )}
          {isStaff && (
            <button onClick={onPin} className="text-xs font-medium text-zinc-400 hover:text-zinc-800 transition">
              {post.pinned ? "Unpin" : "Pin"}
            </button>
          )}
          {(isStaff || post.authorId === currentUserId) && onDeletePost && (
            <button
              onClick={onDeletePost}
              className="text-xs text-zinc-400 hover:text-red-500 transition p-1 rounded"
              title="Delete post"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3.5 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
            {post.title.includes("Entrepreneurship") && !post.title.includes("🔵") ? (
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500 shrink-0" />
            ) : null}
            <span>{post.title}</span>
          </h3>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{post.body}</p>
        </div>

        {post.thumbnail === "ecom-mail" && <EcomMailGraphic />}
      </div>

      {post.thumbnail === "replay" && (
        <Link
          href="/calendar"
          className="group block mt-4 overflow-hidden rounded-xl bg-gradient-to-br from-[#0b1b4a] to-[#5051F9] p-8 text-white hover:shadow-md transition"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-white/70">Replay Session</p>
          <p className="mt-2 text-2xl font-black group-hover:underline">{post.title.replace("Replay: ", "")}</p>
          <p className="mt-2 text-sm text-white/80">Watch the recording inside Classroom & Meet →</p>
        </Link>
      )}

      {/* Reaction & comments bar matching Skool format */}
      <div className="mt-4 pt-2 flex items-center justify-between gap-3 text-xs text-zinc-500">
        <div className="flex items-center gap-4">
          <button
            onClick={onLike}
            className={`inline-flex items-center gap-1.5 font-medium transition ${
              liked ? "text-primary font-bold" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <ThumbsUp size={15} fill={liked ? "currentColor" : "none"} /> {post.likes.length || 0}
          </button>
          <button
            onClick={onToggleComments}
            className="inline-flex items-center gap-1.5 font-medium text-zinc-600 hover:text-zinc-900 transition"
          >
            <MessageCircle size={15} /> {visibleComments.length || 0}
          </button>

          {/* Commenters avatars stack */}
          {visibleComments.length > 0 && (
            <div className="flex items-center -space-x-1.5 pl-1">
              {visibleComments.slice(0, 4).map((c) => (
                <Avatar key={c.id} user={userById(c.authorId)} size={20} className="border border-white shadow-xs" />
              ))}
            </div>
          )}
        </div>

        {lastComment && (
          <span className="text-[11px] text-zinc-400">
            Last comment {timeAgo(lastComment.createdAt)}
          </span>
        )}
      </div>

      {commentsOpen && (
        <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
          {visibleComments.map((c) => {
            const isPending = c.status === "pending";
            const commentAuthor = userById(c.authorId);
            const isCommentStaff = commentAuthor?.role === "admin" || commentAuthor?.role === "manager";
            const canDelete = isStaff || c.authorId === currentUserId;
            return (
              <div
                key={c.id}
                className={`flex items-start justify-between gap-2 rounded-xl p-2 transition ${
                  isCommentStaff
                    ? commentAuthor?.role === "admin"
                      ? "border border-amber-200/80 bg-amber-50/30"
                      : "border border-blue-200/80 bg-blue-50/30"
                    : "hover:bg-zinc-50/70"
                }`}
              >
                <div className="flex gap-2.5 min-w-0 flex-1">
                  <AvatarWithLevel user={commentAuthor} size={30} />
                  <div className={`rounded-xl px-3 py-2 flex-1 min-w-0 border ${isCommentStaff ? "bg-white border-zinc-200/80 shadow-2xs" : "bg-zinc-50 border-zinc-100"}`}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold text-zinc-900">{commentAuthor?.name}</p>
                      <StaffRoleFavicon role={commentAuthor?.role} size="xs" />
                      <span className="text-[11px] text-zinc-400">{timeAgo(c.createdAt)}</span>
                      {isPending && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                          <Clock size={10} /> Pending Approval
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-0.5 text-zinc-800 break-words">{c.body}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 pt-1">
                  {isStaff && isPending && (
                    <>
                      <button
                        onClick={() => onApproveComment(c.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 shadow-xs"
                        title="Approve Comment"
                      >
                        <Check size={12} /> Approve
                      </button>
                      <button
                        onClick={() => onRejectComment(c.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-200"
                        title="Reject Comment"
                      >
                        <X size={12} /> Reject
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
                      className="p-1 text-zinc-400 hover:text-red-500 rounded transition"
                      title="Delete Comment"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {feedback && (
            <div
              className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold border ${
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
            className="space-y-1.5 pt-2"
          >
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 rounded-full bg-zinc-100 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-zinc-900 border border-transparent focus:border-zinc-200"
              />
              <PrimaryButton type="submit">Send</PrimaryButton>
            </div>
            {!isStaff && (
              <p className="px-3 text-[11px] text-zinc-400 flex items-center gap-1">
                <Clock size={11} /> Comments require manager or admin approval before becoming visible to all members.
              </p>
            )}
          </form>
        </div>
      )}
    </Card>
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
      className="group flex items-center justify-between rounded-2xl border border-zinc-200 bg-gradient-to-r from-zinc-50 via-zinc-100/60 to-transparent px-4 py-3 text-sm transition hover:border-zinc-300 shadow-xs"
    >
      <div className="flex items-center gap-2.5 font-medium text-zinc-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-zinc-200 text-zinc-800">
          <CalendarDays size={16} />
        </span>
        <span>
          <strong className="font-bold text-zinc-900">{next.title}</strong> is happening{" "}
          <span className="font-extrabold underline decoration-zinc-400">{label}</span>
        </span>
      </div>
      <span className="text-xs font-bold text-zinc-900 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
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
      className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm cursor-pointer hover:bg-amber-100/70 transition shadow-2xs group"
    >
      <div className="flex items-center gap-2 font-medium text-amber-900 group-hover:text-amber-950 transition">
        <Star size={16} className="text-amber-500 fill-amber-500 group-hover:scale-110 transition-transform" />
        <span className="group-hover:underline">Enjoying this group? Leave a review</span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md transition cursor-pointer"
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
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onChange("all")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            value === "all"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => onChange("chat")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            value === "chat"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          General discussion
        </button>
        <button
          onClick={() => onChange("wins")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            value === "wins"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Wins
        </button>
        <button
          onClick={() => onChange("recorded")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            value === "recorded"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Replays
        </button>
        <button
          onClick={() => onChange("reviews")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            value === "reviews"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Reviews
        </button>
        <button
          onClick={() => onChange("team")}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            value === "team"
              ? "bg-zinc-900 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          <img src="/team-icon.png" alt="" className="h-3.5 w-3.5 rounded object-cover shrink-0" />
          <span>Team</span>
        </button>
      </div>

      <button
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition shadow-xs"
        title="Filter & sort options"
      >
        <SlidersHorizontal size={14} />
      </button>
    </div>
  );
}
