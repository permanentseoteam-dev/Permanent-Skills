"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  MessageSquare,
  Send,
  ShieldCheck,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Avatar, PrimaryButton, StaffRoleFavicon } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import type { Comment } from "@/lib/types";

interface LessonCommentsProps {
  lessonId: string;
  lessonTitle: string;
}

export function LessonComments({ lessonId, lessonTitle }: LessonCommentsProps) {
  const { user, users, comments, addComment, approveComment, deleteComment } = useApp();

  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "pending"; text: string } | null>(
    null
  );
  const [modFilter, setModFilter] = useState<"all" | "approved" | "pending">("all");

  const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

  // Filter comments for this lesson
  const lessonComments = useMemo(() => {
    return comments.filter((c) => c.postId === lessonId);
  }, [comments, lessonId]);

  const approvedComments = useMemo(() => {
    return lessonComments.filter((c) => c.status === "approved" || !c.status);
  }, [lessonComments]);

  const pendingComments = useMemo(() => {
    return lessonComments.filter((c) => c.status === "pending");
  }, [lessonComments]);

  const displayedComments = useMemo(() => {
    if (isAdminOrManager) {
      if (modFilter === "approved") return approvedComments;
      if (modFilter === "pending") return pendingComments;
      return lessonComments;
    }
    // For regular members: show approved comments + user's own pending comments
    return lessonComments.filter(
      (c) => c.status === "approved" || !c.status || (user && c.authorId === user.id)
    );
  }, [isAdminOrManager, modFilter, approvedComments, pendingComments, lessonComments, user]);

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) {
      setFeedbackMsg({ type: "pending", text: "Please log in to leave a comment." });
      return;
    }

    setSubmitting(true);
    setFeedbackMsg(null);

    const res = await addComment(lessonId, commentText.trim());
    setSubmitting(false);

    if (res.ok) {
      setCommentText("");
      if (isAdminOrManager) {
        setFeedbackMsg({
          type: "success",
          text: "Comment posted and approved automatically!",
        });
      } else {
        setFeedbackMsg({
          type: "pending",
          text: "✓ Comment submitted! It is currently pending approval by an admin or manager before becoming visible to all members.",
        });
      }
      setTimeout(() => setFeedbackMsg(null), 5000);
    } else {
      setFeedbackMsg({
        type: "pending",
        text: res.error || "Could not submit comment.",
      });
    }
  }

  async function handleApprove(commentId: string) {
    await approveComment(commentId);
  }

  async function handleDelete(commentId: string) {
    if (!confirm("Are you sure you want to delete/reject this comment?")) return;
    await deleteComment(commentId);
  }

  return (
    <div className="space-y-5 rounded-2xl border border-zinc-200/90 bg-white p-5 sm:p-7 shadow-xs">
      {/* Comments Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5051f9]/10 text-primary">
            <MessageSquare size={17} />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              Lesson Discussion & Questions
            </h2>
            <p className="text-xs text-zinc-500">
              {approvedComments.length} approved discussion {approvedComments.length === 1 ? "post" : "posts"}
            </p>
          </div>
        </div>

        {/* Admin / Manager Moderation Filter Tabs */}
        {isAdminOrManager && (
          <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1">
            <button
              type="button"
              onClick={() => setModFilter("all")}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                modFilter === "all" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              All ({lessonComments.length})
            </button>
            <button
              type="button"
              onClick={() => setModFilter("approved")}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                modFilter === "approved"
                  ? "bg-white text-zinc-900 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Approved ({approvedComments.length})
            </button>
            <button
              type="button"
              onClick={() => setModFilter("pending")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                modFilter === "pending"
                  ? "bg-amber-50 text-amber-900 shadow-2xs border border-amber-200"
                  : "text-amber-700 hover:bg-amber-100/50"
              }`}
            >
              <Clock size={11} />
              <span>Pending ({pendingComments.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Submission Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`flex items-start gap-2.5 rounded-xl p-3.5 text-xs font-medium border ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-amber-50 text-amber-900 border-amber-200"
          }`}
        >
          {feedbackMsg.type === "success" ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Post Comment Input Form */}
      <form onSubmit={handleSubmitComment} className="space-y-3">
        <div className="flex items-start gap-3">
          {user ? (
            <Avatar user={user} size={36} className="shrink-0 ring-1 ring-zinc-200" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-zinc-200 shrink-0" />
          )}

          <div className="flex-1 space-y-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Ask a question or share a takeaway from this lesson..."
              rows={2}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs md:text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary transition resize-none"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">
                {isAdminOrManager
                  ? "✓ Admin/Manager posting (auto-approved)"
                  : "ℹ️ Comments require approval by admin/manager before public display"}
              </span>

              <PrimaryButton
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Send size={13} /> {submitting ? "Posting..." : "Post Comment"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3 pt-2">
        {displayedComments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 p-6 text-center text-xs text-zinc-500">
            <MessageSquare size={24} className="mx-auto text-zinc-400 mb-1.5 opacity-60" />
            <p className="font-medium text-zinc-700">No comments on this lesson yet</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Be the first to share an insight or question!
            </p>
          </div>
        ) : (
          displayedComments.map((comment) => {
            const author = users.find((u) => u.id === comment.authorId);
            const isStaffAuthor = author?.role === "admin" || author?.role === "manager";
            const isPending = comment.status === "pending";

            return (
              <div
                key={comment.id}
                className={`rounded-xl border p-4 transition ${
                  isPending
                    ? "border-amber-200 bg-amber-50/40 shadow-2xs"
                    : isStaffAuthor
                      ? author?.role === "admin"
                        ? "border-amber-200/70 bg-amber-50/30"
                        : "border-blue-200/70 bg-blue-50/30"
                      : "border-zinc-100 bg-zinc-50/40 hover:bg-zinc-50/80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {author ? (
                      <Avatar user={author} size={32} />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-zinc-300" />
                    )}

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-zinc-900">
                          {author?.name || "Community Member"}
                        </span>

                        <StaffRoleFavicon role={author?.role} size="xs" />

                        {isPending && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.2 text-[10px] font-bold text-amber-800 border border-amber-200">
                            <Clock size={10} /> Pending Approval
                          </span>
                        )}
                      </div>

                      <span className="text-[10.5px] text-zinc-400">
                        {timeAgo(comment.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Moderation Actions (for Admin / Manager) */}
                  <div className="flex items-center gap-1.5">
                    {isAdminOrManager && isPending && (
                      <button
                        type="button"
                        onClick={() => handleApprove(comment.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs transition cursor-pointer"
                        title="Approve Comment"
                      >
                        <Check size={12} strokeWidth={3} /> Approve
                      </button>
                    )}

                    {(isAdminOrManager || user?.id === comment.authorId) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                        title="Delete Comment"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment Body */}
                <p className="mt-2.5 pl-10 text-xs md:text-[13.5px] leading-relaxed text-zinc-800 whitespace-pre-line">
                  {comment.body}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
