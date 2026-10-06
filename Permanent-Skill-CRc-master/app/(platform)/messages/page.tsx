"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Crown,
  ExternalLink,
  Lock,
  MessageCircle,
  MessageSquare,
  Plus,
  Search,
  Send,
  Shield,
  Smile,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Avatar, Card, Modal, StaffRoleFavicon, UserRoleBadge } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import type { PublicUser } from "@/lib/types";

const QUICK_EMOJIS = ["👋", "🔥", "🚀", "💡", "🙌", "👍", "❤️", "🎯"];

function MessagesContent() {
  const { user, users, messages, sendMessage, markThreadRead } = useApp();
  const searchParams = useSearchParams();
  const userParam = searchParams.get("user");

  const canChat = user?.role === "admin" || user?.role === "manager";
  const [lockedChatModalOpen, setLockedChatModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(userParam || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newMemberSearch, setNewMemberSearch] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync query param with active conversation
  useEffect(() => {
    if (userParam && users.some((u) => u.id === userParam)) {
      setActiveId(userParam);
    }
  }, [userParam, users]);

  // Mark thread read when active thread changes
  useEffect(() => {
    if (activeId && user) {
      void markThreadRead(activeId);
    }
  }, [activeId, user, markThreadRead]);

  // Compute all unique conversation threads sorted by newest message
  const threads = useMemo(() => {
    if (!user) return [];
    const map = new Map<string, (typeof messages)[number]>();
    for (const m of [...messages].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))) {
      const other = m.senderId === user.id ? m.receiverId : m.senderId;
      if (!map.has(other)) map.set(other, m);
    }
    return [...map.entries()];
  }, [messages, user]);

  // Filtered threads based on search query and unread toggle
  const filteredThreads = useMemo(() => {
    return threads.filter(([otherId, last]) => {
      const person = users.find((u) => u.id === otherId);
      const isUnread = messages.some((m) => m.senderId === otherId && m.receiverId === user?.id && !m.read);

      if (filterUnreadOnly && !isUnread) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = person?.name.toLowerCase().includes(q);
      const userMatch = person?.username.toLowerCase().includes(q);
      const bodyMatch = last.body.toLowerCase().includes(q);
      return Boolean(nameMatch || userMatch || bodyMatch);
    });
  }, [threads, users, messages, user, filterUnreadOnly, searchQuery]);

  // Active recipient details
  const activePerson = useMemo(() => {
    if (!activeId) return null;
    return users.find((u) => u.id === activeId) || null;
  }, [activeId, users]);

  // Active thread message stream
  const activeThreadMessages = useMemo(() => {
    if (!user || !activeId) return [];
    return messages
      .filter(
        (m) =>
          (m.senderId === user.id && m.receiverId === activeId) ||
          (m.senderId === activeId && m.receiverId === user.id)
      )
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  }, [messages, user, activeId]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (activeId) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeId, activeThreadMessages.length]);

  // Candidates for "New Message" modal
  const eligibleNewMembers = useMemo(() => {
    if (!user) return [];
    const q = newMemberSearch.trim().toLowerCase();
    return users
      .filter((u) => u.id !== user.id && (u.status === "approved" || !u.status || u.role === "admin" || u.role === "manager"))
      .filter((u) => {
        if (!q) return true;
        return (
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q)
        );
      })
      .slice(0, 15);
  }, [users, user, newMemberSearch]);

  // Send message handler
  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeId || sending) return;

    setSending(true);
    const body = inputText.trim();
    setInputText("");
    await sendMessage(activeId, body);
    setSending(false);

    // Re-focus input after send
    inputRef.current?.focus();
  }

  function handleAddEmoji(emoji: string) {
    setInputText((prev) => prev + emoji);
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-4">
      {/* Page Title & Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900">Direct Messages</h1>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-bold">
              {threads.length} {threads.length === 1 ? "Conversation" : "Conversations"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            Real-time peer-to-peer messaging, study group questions, and staff support.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canChat ? (
            <button
              type="button"
              onClick={() => {
                setNewMemberSearch("");
                setShowNewModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Plus size={14} /> New Message
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setLockedChatModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#e4e6eb] border border-zinc-200/60 px-4 py-2 text-xs font-bold text-zinc-400 cursor-not-allowed select-none shadow-2xs hover:opacity-90 transition"
              title="Direct messaging is locked for members and team members. Only Managers and Admins can start chats."
            >
              <Lock size={14} /> New Message (Locked)
            </button>
          )}
        </div>
      </div>

      {/* Main Messenger Layout Card */}
      <Card className="overflow-hidden border border-zinc-200 shadow-sm min-h-[560px] lg:min-h-[640px] flex flex-col md:flex-row bg-white">
        {/* Left Column: Conversations List (Hidden on mobile when conversation is active) */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-zinc-100 flex flex-col shrink-0 ${
            activeId ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Search & Filter Header */}
          <div className="p-3.5 border-b border-zinc-100 bg-zinc-50/50 space-y-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-8.5 pr-3 text-xs outline-none focus:border-zinc-900 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilterUnreadOnly(false)}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer text-[11px] ${
                    !filterUnreadOnly
                      ? "bg-zinc-900 text-white shadow-2xs"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                >
                  All ({threads.length})
                </button>
                <button
                  onClick={() => setFilterUnreadOnly(true)}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer text-[11px] flex items-center gap-1 ${
                    filterUnreadOnly
                      ? "bg-primary text-white shadow-2xs"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                >
                  <span>Unread</span>
                  {messages.filter((m) => m.receiverId === user?.id && !m.read).length > 0 && (
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </button>
              </div>

              <span className="text-[11px] font-medium text-zinc-400">
                {filteredThreads.length} listed
              </span>
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-50 max-h-[500px] md:max-h-[600px]">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 space-y-2">
                <MessageSquare size={32} className="mx-auto text-zinc-300" />
                <p className="text-xs font-bold text-zinc-700">No conversations found</p>
                <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                  {searchQuery
                    ? "No messages match your search filter."
                    : "Start a new conversation with any community member!"}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => {
                      setNewMemberSearch("");
                      setShowNewModal(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline pt-1 cursor-pointer"
                  >
                    <Plus size={12} /> Find a member
                  </button>
                )}
              </div>
            ) : (
              filteredThreads.map(([otherId, last]) => {
                const person = users.find((u) => u.id === otherId);
                const unread = messages.some((m) => m.senderId === otherId && m.receiverId === user?.id && !m.read);
                const unreadCount = messages.filter((m) => m.senderId === otherId && !m.read && m.receiverId === user?.id).length;
                const isSelected = activeId === otherId;
                const isMine = last.senderId === user?.id;

                return (
                  <button
                    key={otherId}
                    type="button"
                    onClick={() => {
                      setActiveId(otherId);
                      void markThreadRead(otherId);
                    }}
                    className={`flex w-full items-start gap-3 p-3.5 text-left transition cursor-pointer relative ${
                      isSelected
                        ? "bg-primary/5 border-l-4 border-primary"
                        : unread
                        ? "bg-amber-50/40 hover:bg-amber-50/80 border-l-4 border-amber-400"
                        : "hover:bg-zinc-50/80 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar user={person} size={42} />
                      {person?.isOnline && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"
                          title="Online now"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`text-xs font-bold truncate ${unread ? "text-zinc-950 font-black" : "text-zinc-800"}`}>
                            {person?.name || "Member"}
                          </span>
                          {person && <StaffRoleFavicon role={person.role} size="xs" />}
                        </div>
                        <span className="text-[10px] text-zinc-400 shrink-0 font-medium">
                          {timeAgo(last.createdAt)}
                        </span>
                      </div>

                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p
                          className={`truncate text-xs ${
                            unread ? "font-bold text-zinc-900" : "text-zinc-500"
                          }`}
                        >
                          {isMine && <span className="text-zinc-400 font-normal">You: </span>}
                          {last.body}
                        </p>

                        {unreadCount > 0 && (
                          <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.2 text-[10px] font-black text-white">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Pane */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-white ${
            !activeId ? "hidden md:flex" : "flex"
          }`}
        >
          {activePerson ? (
            <>
              {/* Conversation Top Header Bar */}
              <div className="flex items-center justify-between border-b border-zinc-100 p-3 sm:p-4 bg-zinc-50/40">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  {/* Mobile Back Button to list */}
                  <button
                    type="button"
                    onClick={() => setActiveId(null)}
                    className="md:hidden rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900 transition cursor-pointer"
                    title="Back to all conversations"
                    aria-label="Back to all conversations"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div className="relative shrink-0">
                    <Avatar user={activePerson} size={38} />
                    {activePerson.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        href={`/profile/${activePerson.id}`}
                        className="text-xs sm:text-sm font-black text-zinc-950 hover:text-primary transition truncate"
                      >
                        {activePerson.name}
                      </Link>
                      <UserRoleBadge role={activePerson.role} isPremium={activePerson.isPremium} size="xs" />
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <span className="font-mono text-zinc-400">@{activePerson.username}</span>
                      <span>•</span>
                      <span className={activePerson.isOnline ? "text-emerald-600 font-semibold" : "text-zinc-400"}>
                        {activePerson.isOnline ? "Active now" : "Offline"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/profile/${activePerson.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
                    title="View Member Profile"
                  >
                    <User size={13} /> Profile
                  </Link>
                </div>
              </div>

              {/* Message Stream Area */}
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 bg-zinc-50/20">
                {activeThreadMessages.length === 0 ? (
                  <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center text-zinc-400 space-y-2 p-6">
                    <Avatar user={activePerson} size={56} className="border-2 border-zinc-200" />
                    <h3 className="text-sm font-bold text-zinc-800">
                      This is the beginning of your direct chat with {activePerson.name}
                    </h3>
                    <p className="text-xs text-zinc-500 max-w-sm">
                      Send a message below to discuss projects, ask questions, or connect!
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                      {QUICK_EMOJIS.slice(0, 4).map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleAddEmoji(emoji)}
                          className="rounded-full bg-white border border-zinc-200 px-3 py-1 text-sm hover:bg-zinc-50 hover:border-zinc-300 transition shadow-2xs cursor-pointer active:scale-95"
                        >
                          {emoji} Say Hello
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  activeThreadMessages.map((m, idx) => {
                    const isMine = m.senderId === user?.id;
                    const prevMsg = activeThreadMessages[idx - 1];
                    const isSameSender = prevMsg && prevMsg.senderId === m.senderId;

                    return (
                      <div
                        key={m.id}
                        className={`flex gap-2.5 ${isMine ? "justify-end" : "justify-start"} ${
                          isSameSender ? "mt-1" : "mt-3"
                        }`}
                      >
                        {!isMine && (
                          <div className="shrink-0 pt-0.5">
                            {!isSameSender ? (
                              <Avatar user={activePerson} size={28} />
                            ) : (
                              <div className="w-7" />
                            )}
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-2xs ${
                            isMine
                              ? "bg-primary text-white rounded-tr-xs"
                              : "bg-white border border-zinc-200 text-zinc-800 rounded-tl-xs"
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap break-words">{m.body}</p>
                          <div
                            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                              isMine ? "text-white/75" : "text-zinc-400"
                            }`}
                          >
                            <span>{timeAgo(m.createdAt)}</span>
                            {isMine && (
                              <span>
                                {m.read ? <CheckCheck size={12} className="text-white" /> : <Check size={12} />}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Emojis Bar */}
              <div className="px-3 py-1.5 bg-zinc-50 border-t border-zinc-100 flex items-center gap-1 overflow-x-auto scrollbar-none">
                <span className="text-[10px] font-bold uppercase text-zinc-400 mr-1 shrink-0">Quick:</span>
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleAddEmoji(emoji)}
                    className="rounded-lg p-1 text-sm hover:bg-white transition cursor-pointer shrink-0"
                    title={`Add ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Message Composer Form */}
              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 border-t border-zinc-100 p-3 bg-white"
              >
                <input
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`Message ${activePerson.name}...`}
                  className="flex-1 rounded-xl bg-zinc-100 px-3.5 sm:px-4 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:ring-1 focus:ring-primary border border-transparent focus:border-zinc-200 transition shadow-2xs"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="inline-flex items-center justify-center rounded-xl bg-primary p-2.5 sm:px-4 sm:py-2.5 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition active:scale-95 cursor-pointer shrink-0 gap-1.5"
                >
                  <Send size={15} />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            /* Empty State when no conversation is selected on desktop */
            <div className="flex h-full min-h-[500px] flex-col items-center justify-center p-8 text-center text-zinc-400 space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MessageCircle size={32} />
              </div>
              <h2 className="text-base font-black text-zinc-900">Your Direct Messages</h2>
              <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
                Select an existing conversation from the left menu or start a new direct chat with any student or staff member.
              </p>
              <div className="pt-2">
                {canChat ? (
                  <button
                    type="button"
                    onClick={() => {
                      setNewMemberSearch("");
                      setShowNewModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition shadow-sm cursor-pointer"
                  >
                    <Plus size={13} /> Start New Conversation
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setLockedChatModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#e4e6eb] border border-zinc-200/60 px-4 py-2 text-xs font-bold text-zinc-400 cursor-not-allowed select-none shadow-2xs hover:opacity-90 transition"
                  >
                    <Lock size={13} /> Direct Chat Locked
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* NEW CONVERSATION MEMBER SELECTOR MODAL */}
      {showNewModal && canChat && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowNewModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white border border-zinc-200 p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-primary" />
                <h3 className="text-base font-black text-zinc-900">Start New Conversation</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={newMemberSearch}
                onChange={(e) => setNewMemberSearch(e.target.value)}
                placeholder="Search member by name, @username, or role..."
                autoFocus
                className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-zinc-900 shadow-2xs"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-50 pr-1">
              {eligibleNewMembers.length === 0 ? (
                <p className="py-6 text-center text-xs text-zinc-400">No matching members found.</p>
              ) : (
                eligibleNewMembers.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setActiveId(m.id);
                      setShowNewModal(false);
                      void markThreadRead(m.id);
                    }}
                    className="flex w-full items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50 transition cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar user={m} size={36} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-zinc-900 truncate">{m.name}</span>
                          <StaffRoleFavicon role={m.role} size="xs" />
                        </div>
                        <span className="text-[11px] font-mono text-zinc-400">@{m.username}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <UserRoleBadge role={m.role} isPremium={m.isPremium} size="xs" />
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="flex items-center justify-end border-t border-zinc-100 pt-3">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Locked Direct Chat Modal for Members & Team Members */}
      <Modal
        open={lockedChatModalOpen}
        onClose={() => setLockedChatModalOpen(false)}
        title="Direct Messaging Locked"
      >
        <div className="space-y-4 text-center py-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 shadow-xs">
            <Lock size={22} />
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-900">
              Chat Access is Restricted
            </h3>
            <p className="mt-1.5 text-xs text-zinc-600 leading-relaxed max-w-sm mx-auto">
              Direct messaging is currently locked for members and team members. Only <strong>Managers</strong> and <strong>Admins</strong> can initiate direct chats.
            </p>
          </div>

          <div className="rounded-xl bg-zinc-50 p-3.5 border border-zinc-200 text-xs text-zinc-600 text-left space-y-1.5">
            <div className="font-bold text-zinc-900">How to connect with peers:</div>
            <p className="text-[11px] text-zinc-500 leading-normal">
              • Post your questions or wins in the <strong>Community</strong> feed to discuss with peers & coaches.<br />
              • Reach out to an Admin or Community Manager if you need dedicated support.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setLockedChatModalOpen(false)}
              className="w-full sm:w-auto rounded-xl bg-zinc-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 transition cursor-pointer shadow-sm"
            >
              Understood
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-400">Loading messages...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
