"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, Clock, MessageCircle, Pin, Star, ThumbsUp, Trash2, X } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Avatar, Card, PrimaryButton } from "@/components/ui";
import { CATEGORIES, timeAgo } from "@/lib/format";
import type { Comment, Post, PostCategory } from "@/lib/types";

export function PostComposer() {
  const { createPost, user } = useApp();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<PostCategory>("chat");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpen() {
    setError(null);
    setOpen(true);
  }

  async function submit() {
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await createPost(title, body, category);
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

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left shadow-sm hover:border-zinc-300 transition"
      >
        <Avatar user={user} size={40} />
        <span className="text-zinc-400">Write something</span>
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
      <div className="mb-3 flex gap-2">
        {(["chat", "wins", "recorded", "reviews"] as PostCategory[]).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
              category === c ? "bg-[#5051f9] text-white shadow-xs" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="mb-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share a question, win, or lesson..."
        className="min-h-[110px] w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-zinc-500">
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
  const { posts, comments, userById, user, activeCommunity, toggleLike, addComment, togglePin, deletePost, approveComment, rejectComment, deleteComment } = useApp();
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, { text: string; isError?: boolean }>>({});

  const list = useMemo(() => {
    const communityId = activeCommunity?.id || "comm-pss";
    const scoped = posts.filter(
      (p) => !p.communityId || p.communityId === communityId || (communityId === "comm-pss" && !p.communityId)
    );
    const filtered = scoped.filter((p) => category === "all" || p.category === category);
    return [...filtered].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
  }, [posts, category, activeCommunity?.id]);

  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5051f9]/10 text-[#5051f9] mb-3">
          <MessageCircle size={26} />
        </div>
        <h3 className="text-lg font-bold text-zinc-900">No posts in this category yet</h3>
        <p className="mt-1 text-sm text-zinc-500 max-w-md mx-auto">
          Be the first to share an insight, ask a question, or celebrate a milestone with the community!
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
          isAdmin={user?.role === "admin"}
          currentUserId={user?.id}
          liked={!!user && post.likes.includes(user.id)}
          userById={userById}
        />
      ))}
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
  isAdmin,
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
  isAdmin: boolean;
  currentUserId?: string;
  liked: boolean;
  userById: ReturnType<typeof useApp>["userById"];
}) {
  const cat = CATEGORIES.find((c) => c.id === post.category);
  const visibleComments = comments.filter((c) => c.status === "approved" || !c.status || c.authorId === currentUserId || isAdmin);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${author?.id || ""}`}>
            <Avatar user={author} size={42} />
          </Link>
          <div>
            <Link href={`/profile/${author?.id || ""}`} className="font-semibold hover:underline">
              {author?.name || "Member"}
            </Link>
            <p className="text-xs text-zinc-500">
              {timeAgo(post.createdAt)} · {cat?.emoji} {cat?.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.pinned && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
              <Pin size={12} /> Pinned
            </span>
          )}
          {isAdmin && (
            <button onClick={onPin} className="text-xs font-medium text-zinc-500 hover:text-primary transition">
              {post.pinned ? "Unpin" : "Pin"}
            </button>
          )}
          {(isAdmin || post.authorId === currentUserId) && onDeletePost && (
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
      <h3 className="mt-3 text-lg font-semibold">{post.title}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{post.body}</p>
      {post.thumbnail && (
        <Link
          href="/calendar"
          className="group block mt-4 overflow-hidden rounded-xl bg-gradient-to-br from-[#0b1b4a] to-[#5051F9] p-8 text-white hover:shadow-md transition"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-white/70">PSS Replay</p>
          <p className="mt-2 text-2xl font-black group-hover:underline">{post.title.replace("Replay: ", "")}</p>
          <p className="mt-2 text-sm text-white/80">Watch the recording inside Archived Calls →</p>
        </Link>
      )}
      <div className="mt-4 flex items-center gap-4 text-sm text-zinc-500">
        <button onClick={onLike} className={`inline-flex items-center gap-1.5 ${liked ? "text-primary" : ""}`}>
          <ThumbsUp size={16} fill={liked ? "currentColor" : "none"} /> {post.likes.length}
        </button>
        <button onClick={onToggleComments} className="inline-flex items-center gap-1.5">
          <MessageCircle size={16} /> {visibleComments.length}
        </button>
        <div className="flex -space-x-2">
          {post.likes.slice(0, 5).map((id) => (
            <Avatar key={id} user={userById(id)} size={22} className="border border-white" />
          ))}
        </div>
        {visibleComments[0] && (
          <span className="text-xs text-primary">New comment {timeAgo(visibleComments[visibleComments.length - 1].createdAt)}</span>
        )}
      </div>
      {commentsOpen && (
        <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
          {visibleComments.map((c) => {
            const isPending = c.status === "pending";
            const canDelete = isAdmin || c.authorId === currentUserId;
            return (
              <div key={c.id} className="flex items-start justify-between gap-2 rounded-xl p-1.5 hover:bg-zinc-50/70 transition">
                <div className="flex gap-2 min-w-0 flex-1">
                  <Avatar user={userById(c.authorId)} size={28} />
                  <div className="rounded-xl bg-zinc-50 px-3 py-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold">{userById(c.authorId)?.name}</p>
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
                  {isAdmin && isPending && (
                    <>
                      <button
                        onClick={() => onApproveComment(c.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 shadow-sm"
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
            className="space-y-1.5"
          >
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 rounded-full bg-zinc-100 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary"
              />
              <PrimaryButton type="submit">Send</PrimaryButton>
            </div>
            {!isAdmin && (
              <p className="px-3 text-[11px] text-zinc-400 flex items-center gap-1">
                <Clock size={11} /> Comments require admin approval before becoming visible to all members.
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
      className="group flex items-center justify-between rounded-2xl border border-[#5051f9]/20 bg-gradient-to-r from-[#5051f9]/5 via-[#5051f9]/10 to-transparent px-4 py-3 text-sm transition hover:border-[#5051f9]/40 hover:bg-[#5051f9]/10 shadow-xs"
    >
      <div className="flex items-center gap-2.5 font-medium text-zinc-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#5051f9]/15 text-[#5051f9]">
          <CalendarDays size={16} />
        </span>
        <span>
          <strong className="font-bold text-[#5051f9]">{next.title}</strong> is happening{" "}
          <span className="font-extrabold underline decoration-[#5051f9]/30">{label}</span>
        </span>
      </div>
      <span className="text-xs font-bold text-[#5051f9] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
        Join Call →
      </span>
    </Link>
  );
}

export function ReviewPrompt({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
      <Link href="/about" className="flex items-center gap-2 font-medium text-amber-900">
        <Star size={16} className="text-amber-500" fill="currentColor" /> Enjoying this group? Leave a review
      </Link>
      <button onClick={onDismiss} className="text-zinc-400">
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
    <div className="flex flex-wrap items-center gap-2">
      {CATEGORIES.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id as "all" | PostCategory)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            value === c.id
              ? "bg-[#5051f9] text-white shadow-xs ring-1 ring-[#5051f9]"
              : "bg-white text-zinc-700 hover:text-[#5051f9] hover:bg-zinc-50 border border-zinc-200/80 shadow-xs"
          }`}
        >
          {"emoji" in c && c.emoji ? `${c.emoji} ` : ""}
          {c.label}
        </button>
      ))}
    </div>
  );
}
