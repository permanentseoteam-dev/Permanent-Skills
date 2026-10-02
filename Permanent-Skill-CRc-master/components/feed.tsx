"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, MessageCircle, Pin, Star, ThumbsUp, X } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Avatar, Card, PrimaryButton } from "@/components/ui";
import { CATEGORIES, timeAgo } from "@/lib/format";
import type { Post, PostCategory } from "@/lib/types";

export function PostComposer() {
  const { createPost, user } = useApp();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<PostCategory>("chat");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    await createPost(title, body, category);
    setBusy(false);
    setTitle("");
    setBody("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left shadow-sm hover:border-zinc-300"
      >
        <Avatar user={user} size={40} />
        <span className="text-zinc-400">Write something</span>
      </button>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex gap-2">
        {(["chat", "wins", "recorded", "reviews"] as PostCategory[]).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${category === c ? "bg-primary text-white" : "bg-zinc-100 text-zinc-600"}`}
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
  const { posts, comments, userById, user, toggleLike, addComment, togglePin } = useApp();
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const list = useMemo(() => {
    const filtered = posts.filter((p) => category === "all" || p.category === category);
    return [...filtered].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
  }, [posts, category]);

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
          onLike={() => toggleLike(post.id)}
          onPin={() => togglePin(post.id)}
          onComment={async () => {
            const text = drafts[post.id];
            if (!text?.trim()) return;
            await addComment(post.id, text);
            setDrafts((s) => ({ ...s, [post.id]: "" }));
          }}
          comments={comments.filter((c) => c.postId === post.id)}
          author={userById(post.authorId)}
          isAdmin={user?.role === "admin"}
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
  onLike,
  onPin,
  onComment,
  isAdmin,
  liked,
  userById,
}: {
  post: Post;
  author: ReturnType<ReturnType<typeof useApp>["userById"]>;
  comments: { id: string; authorId: string; body: string; createdAt: string }[];
  commentsOpen: boolean;
  onToggleComments: () => void;
  draft: string;
  setDraft: (v: string) => void;
  onLike: () => void;
  onPin: () => void;
  onComment: () => void;
  isAdmin: boolean;
  liked: boolean;
  userById: ReturnType<typeof useApp>["userById"];
}) {
  const cat = CATEGORIES.find((c) => c.id === post.category);
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
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500">
              <Pin size={12} /> Pinned
            </span>
          )}
          {isAdmin && (
            <button onClick={onPin} className="text-xs text-zinc-400 hover:text-primary">
              {post.pinned ? "Unpin" : "Pin"}
            </button>
          )}
        </div>
      </div>
      <h3 className="mt-3 text-lg font-semibold">{post.title}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{post.body}</p>
      {post.thumbnail && (
        <div className="mt-4 overflow-hidden rounded-xl bg-gradient-to-br from-[#0b1b4a] to-[#5051F9] p-8 text-white">
          <p className="text-xs uppercase tracking-[0.25em] text-white/70">PSS Replay</p>
          <p className="mt-2 text-2xl font-black">{post.title.replace("Replay: ", "")}</p>
          <p className="mt-2 text-sm text-white/80">Watch the recording inside Archived Calls.</p>
        </div>
      )}
      <div className="mt-4 flex items-center gap-4 text-sm text-zinc-500">
        <button onClick={onLike} className={`inline-flex items-center gap-1.5 ${liked ? "text-primary" : ""}`}>
          <ThumbsUp size={16} fill={liked ? "currentColor" : "none"} /> {post.likes.length}
        </button>
        <button onClick={onToggleComments} className="inline-flex items-center gap-1.5">
          <MessageCircle size={16} /> {comments.length}
        </button>
        <div className="flex -space-x-2">
          {post.likes.slice(0, 5).map((id) => (
            <Avatar key={id} user={userById(id)} size={22} className="border border-white" />
          ))}
        </div>
        {comments[0] && (
          <span className="text-xs text-primary">New comment {timeAgo(comments[comments.length - 1].createdAt)}</span>
        )}
      </div>
      {commentsOpen && (
        <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <Avatar user={userById(c.authorId)} size={28} />
              <div className="rounded-xl bg-zinc-50 px-3 py-2">
                <p className="text-xs font-semibold">{userById(c.authorId)?.name}</p>
                <p className="text-sm">{c.body}</p>
              </div>
            </div>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onComment();
            }}
            className="flex gap-2"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 rounded-full bg-zinc-100 px-4 py-2 text-sm outline-none"
            />
            <PrimaryButton type="submit">Send</PrimaryButton>
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
  const diff = new Date(next.start).getTime() - Date.now();
  const days = Math.max(0, Math.round(diff / 86400000));
  const label = days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
  return (
    <Link href="/calendar" className="flex items-center justify-center gap-2 py-2 text-sm text-zinc-600">
      <CalendarDays size={16} /> {next.title} is happening {label}
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
          className={`rounded-full px-3 py-1.5 text-sm ${
            value === c.id ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200"
          }`}
        >
          {"emoji" in c && c.emoji ? `${c.emoji} ` : ""}
          {c.label}
        </button>
      ))}
    </div>
  );
}
