"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronsUpDown,
  Compass,
  Globe,
  HelpCircle,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useApp } from "./AppProvider";
import { Avatar, UserRoleBadge } from "./ui";
import { timeAgo } from "@/lib/format";
import { getLevel } from "@/lib/levels";
import { ChatDrawer } from "./ChatDrawer";

const NAV = [
  { href: "/community", label: "Community" },
  { href: "/classroom", label: "Classroom" },
  { href: "/calendar", label: "Meet" },
  { href: "/members", label: "Members" },
  { href: "/leaderboards", label: "Leaderboards" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    users,
    posts,
    notifications,
    messages,
    courses,
    logout,
    markNotificationsRead,
    markThreadRead,
    communities,
    activeCommunity,
    switchCommunity,
  } = useApp();
  const [open, setOpen] = useState<null | "community" | "user" | "chat" | "bell" | "search">(null);
  const [query, setQuery] = useState("");
  const [communitySearch, setCommunitySearch] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [chatUserId, setChatUserId] = useState<string | null>(null);

  const communityRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const userLevel = getLevel(user?.points || 0).level;
  const myPurchasedCourses = useMemo(() => {
    if (!courses || courses.length === 0) return [];
    if (user?.role === "admin" || user?.isPremium) return courses;
    return courses.filter((c) => {
      const isPurchased = user?.purchasedCourseIds?.includes(c.id);
      const isLevelUnlocked = c.unlockLevel <= 1 || userLevel >= c.unlockLevel;
      return isPurchased || isLevelUnlocked;
    });
  }, [courses, user, userLevel]);

  // Close open popups when route changes
  useEffect(() => {
    setOpen(null);
  }, [pathname]);

  // Handle ESC key to dismiss any open popup
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Handle outside clicks/taps for each active dropdown
  useEffect(() => {
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (!open) return;
      const target = e.target as Node | null;
      if (!target) return;

      if (open === "community" && communityRef.current && !communityRef.current.contains(target)) {
        setOpen(null);
      } else if (open === "chat" && chatRef.current && !chatRef.current.contains(target)) {
        setOpen(null);
      } else if (open === "bell" && bellRef.current && !bellRef.current.contains(target)) {
        setOpen(null);
      } else if (open === "user" && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setOpen(null);
      } else if (open === "search" && searchRef.current && !searchRef.current.contains(target)) {
        setOpen(null);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  const unreadNotes = notifications.filter((n) => !n.read).length;
  const unreadChats = new Set(
    messages.filter((m) => m.receiverId === user?.id && !m.read).map((m) => m.senderId),
  ).size;

  const threads = useMemo(() => {
    if (!user) return [];
    const map = new Map<string, (typeof messages)[number]>();
    for (const m of [...messages].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))) {
      const other = m.senderId === user.id ? m.receiverId : m.senderId;
      if (!map.has(other)) map.set(other, m);
    }
    return [...map.entries()];
  }, [messages, user]);

  const availableMembers = useMemo(() => {
    if (!user) return [];
    const q = chatSearch.trim().toLowerCase();
    const otherUsers = users.filter((u) => u.id !== user.id && u.status !== "pending");
    if (!q) return otherUsers;
    return otherUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        Boolean(u.email?.toLowerCase().includes(q))
    );
  }, [users, user, chatSearch]);

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return { people: [] as typeof users, posts: [] as typeof posts };
    return {
      people: users.filter(
        (u) =>
          u.status !== "pending" &&
          (u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.bio.toLowerCase().includes(q)),
      ).slice(0, 5),
      posts: posts.filter((p) => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q)).slice(0, 5),
    };
  }, [query, users, posts]);

  const filteredCommunities = useMemo(() => {
    const q = communitySearch.trim().toLowerCase();
    const list = communities && communities.length > 0 ? communities : [
      {
        id: "comm-pss",
        name: "Permanent Skill Strategy",
        slug: "permanent-skill-strategy",
        description: "Private community",
        createdAt: "",
        createdBy: "u-admin",
      },
    ];
    if (!q) return list;
    return list.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  }, [communities, communitySearch]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white isolate shadow-xs">
        <div className="relative flex h-14 w-full items-center gap-3 px-4 sm:px-6 lg:px-8">
          {/* Community Switcher with Badge & Up/Down indicator */}
          <div ref={communityRef} className="relative shrink-0 flex items-center gap-2">
            <button
              onClick={() => setOpen(open === "community" ? null : "community")}
              className="flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-zinc-100/80 cursor-pointer"
              aria-label="Select community"
            >
              {/* Community Icon Badge */}
              {activeCommunity?.slug === "ai-architects" || activeCommunity?.name.toLowerCase().includes("ai") ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black border border-amber-500/60 font-mono text-xs font-black text-amber-400 shadow-xs">
                  &gt;_
                </span>
              ) : activeCommunity?.type === "team" || activeCommunity?.slug === "team-members" || activeCommunity?.id === "comm-team" ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-xl overflow-hidden shadow-xs border border-blue-500/30 bg-blue-600">
                  <Image src="/team-icon.png" alt="Team" width={32} height={32} className="h-full w-full object-cover" />
                </span>
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-xs font-black text-white shadow-xs">
                  {(activeCommunity?.name || "PS").slice(0, 2).toUpperCase()}
                </span>
              )}

              <span className="truncate max-w-[130px] sm:max-w-[220px] font-bold text-sm text-zinc-950">
                {activeCommunity?.name || "AI Architects"}
              </span>

              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition">
                <ChevronsUpDown size={13} />
              </span>
            </button>

            {open === "community" && (
              <div className="absolute left-0 top-full mt-2 z-50 w-[310px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl p-2.5 animate-in fade-in zoom-in-95 duration-100">
                {/* Search Header with Settings Gear */}
                <div className="relative flex items-center mb-2">
                  <Search size={14} className="absolute left-3 text-zinc-400 pointer-events-none" />
                  <input
                    value={communitySearch}
                    onChange={(e) => setCommunitySearch(e.target.value)}
                    className="w-full rounded-xl bg-zinc-100 py-2 pl-8.5 pr-8 text-xs font-medium outline-none placeholder:text-zinc-400 focus:bg-zinc-100/90"
                    placeholder="Search"
                  />
                  <Link
                    href="/settings"
                    onClick={() => setOpen(null)}
                    className="absolute right-2.5 text-zinc-400 hover:text-zinc-700 p-0.5"
                    title="Community Settings"
                  >
                    <Settings size={14} />
                  </Link>
                </div>

                {/* Create & Discover & All Courses Actions matching Reference Screenshot */}
                <div className="space-y-0.5">
                  <Link
                    href="/create-community"
                    onClick={() => setOpen(null)}
                    className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-50 transition"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                      <Plus size={15} />
                    </div>
                    <span>Create a community</span>
                  </Link>

                  <Link
                    href="/discover"
                    onClick={() => setOpen(null)}
                    className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-50 transition"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                      <Compass size={15} />
                    </div>
                    <span>Discover communities</span>
                  </Link>

                  <Link
                    href="/all-courses"
                    onClick={() => setOpen(null)}
                    className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-50 transition"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                      <BookOpen size={15} />
                    </div>
                    <span>All courses</span>
                  </Link>
                </div>

                {/* Divider */}
                <div className="border-t border-zinc-100 my-1.5" />

                {/* Communities List matching Reference Screenshot */}
                <div className="space-y-1 max-h-[220px] overflow-y-auto pr-0.5">
                  {filteredCommunities.map((c) => {
                    const isCurrent = (activeCommunity?.id || "comm-ai-architects") === c.id;

                    let iconNode = (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black text-white text-[11px] font-black">
                        {c.name.slice(0, 2).toUpperCase()}
                      </span>
                    );

                    if (c.slug === "ai-architects" || c.name.toLowerCase().includes("ai")) {
                      iconNode = (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black border border-amber-500/60 font-mono text-[11px] font-black text-amber-400">
                          &gt;_
                        </span>
                      );
                    } else if (c.type === "team" || c.slug === "team-members" || c.id === "comm-team") {
                      iconNode = (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg overflow-hidden border border-blue-500/30 bg-blue-600">
                          <Image src="/team-icon.png" alt="Team" width={28} height={28} className="h-full w-full object-cover" />
                        </span>
                      );
                    }

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          switchCommunity(c.id);
                          setOpen(null);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-bold transition cursor-pointer ${
                          isCurrent
                            ? "bg-[#fef3c7] text-zinc-950 shadow-2xs border border-amber-200/50"
                            : "text-zinc-850 hover:bg-zinc-100/70"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {iconNode}
                          <span className="truncate">{c.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div ref={searchRef} className="relative mx-auto hidden w-full max-w-xl md:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen("search");
              }}
              onFocus={() => {
                if (query.trim().length >= 2) setOpen("search");
              }}
              placeholder={pathname === "/members" ? "Search members" : "Search"}
              className="w-full rounded-full bg-zinc-100 py-2.5 pl-9 pr-4 text-sm outline-none ring-primary/30 focus:bg-white focus:ring-2"
            />
            {open === "search" && query.trim().length >= 2 && (
              <div className="absolute top-12 z-50 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
                {searchHits.people.length === 0 && searchHits.posts.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-zinc-500">No matches</p>
                )}
                {searchHits.people.map((p) => (
                  <Link key={p.id} href={`/profile/${p.id}`} onClick={() => setOpen(null)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50">
                    <Avatar user={p} size={32} />
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-zinc-500">@{p.username}</p>
                    </div>
                  </Link>
                ))}
                {searchHits.posts.map((p) => (
                  <Link key={p.id} href="/community" onClick={() => setOpen(null)} className="block px-4 py-2.5 hover:bg-zinc-50">
                    <p className="text-sm font-medium">{p.title}</p>
                    <p className="line-clamp-1 text-xs text-zinc-500">{p.body}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Top Right 3 Icons: Chats, Notifications, User Profile */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {/* 1. Chat Icon */}
            <div ref={chatRef} className="relative">
              <button
                onClick={() => setOpen(open === "chat" ? null : "chat")}
                className={`relative rounded-full p-2 transition-colors hover:bg-zinc-100 ${
                  open === "chat" ? "bg-zinc-100 text-primary" : "text-zinc-700"
                }`}
                aria-label="Chats"
              >
                <MessageCircle size={22} className="stroke-[1.8]" />
                {unreadChats > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                    {unreadChats}
                  </span>
                )}
              </button>

              {/* Chat Dropdown Menu */}
              {open === "chat" && (
                <div className="absolute right-0 top-full mt-2 z-50 w-[360px] sm:w-[380px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 bg-zinc-50/50">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-900">Chats</h3>
                      {unreadChats > 0 && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-600">
                          {unreadChats} new
                        </span>
                      )}
                    </div>
                    <Link
                      href="/messages"
                      onClick={() => setOpen(null)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      All Messages
                    </Link>
                  </div>

                  {/* Quick Search Contacts */}
                  <div className="p-2 border-b border-zinc-100">
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        value={chatSearch}
                        onChange={(e) => setChatSearch(e.target.value)}
                        placeholder="Search member to chat..."
                        className="w-full rounded-lg bg-zinc-100 py-1.5 pl-7 pr-3 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-50">
                    {/* Active Threads */}
                    {threads.length > 0 && !chatSearch && (
                      <div>
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-50/80">
                          Recent Conversations
                        </div>
                        {threads.map(([otherId, last]) => {
                          const person = users.find((u) => u.id === otherId);
                          const unread = messages.some((m) => m.senderId === otherId && m.receiverId === user?.id && !m.read);
                          const unreadCount = messages.filter((m) => m.senderId === otherId && !m.read && m.receiverId === user?.id).length;
                          return (
                            <button
                              key={otherId}
                              onClick={() => {
                                setChatUserId(otherId);
                                void markThreadRead(otherId);
                                setOpen(null);
                              }}
                              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                                unread ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-zinc-50"
                              }`}
                            >
                              <Avatar user={person} size={40} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="truncate text-sm font-semibold text-zinc-900">
                                    {person?.name || "Member"}
                                    {unread && (
                                      <span className="ml-1.5 text-xs font-bold text-primary">({unreadCount})</span>
                                    )}
                                  </p>
                                  <span className="text-[11px] text-zinc-400 shrink-0">{timeAgo(last.createdAt)}</span>
                                </div>
                                <p className={`truncate text-xs mt-0.5 ${unread ? "font-semibold text-zinc-900" : "text-zinc-500"}`}>
                                  {last.body}
                                </p>
                              </div>
                              {unread && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* All Members / Search Results */}
                    {availableMembers.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-50/80">
                          {chatSearch ? "Matching Members" : "Start New Chat"}
                        </div>
                        {availableMembers.slice(0, 6).map((member) => (
                          <button
                            key={member.id}
                            onClick={() => {
                              setChatUserId(member.id);
                              void markThreadRead(member.id);
                              setOpen(null);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-zinc-50"
                          >
                            <Avatar user={member} size={34} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-zinc-900">{member.name}</p>
                              <p className="truncate text-xs text-zinc-400">@{member.username}</p>
                            </div>
                            <span className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600">
                              Chat
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {threads.length === 0 && availableMembers.length === 0 && (
                      <div className="px-4 py-8 text-center text-sm text-zinc-500">
                        No members available for chat.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Notifications / Bell Icon */}
            <div ref={bellRef} className="relative">
              <button
                onClick={() => setOpen(open === "bell" ? null : "bell")}
                className={`relative rounded-full p-2 transition-colors hover:bg-zinc-100 ${
                  open === "bell" ? "bg-zinc-100 text-primary" : "text-zinc-700"
                }`}
                aria-label="Notifications"
              >
                <Bell size={22} className="stroke-[1.8]" />
                {unreadNotes > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                    {unreadNotes > 99 ? "99+" : unreadNotes}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Menu */}
              {open === "bell" && (
                <div className="absolute right-0 top-full mt-2 z-50 w-[360px] sm:w-[380px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 bg-zinc-50/50">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-900">Notifications</h3>
                      {unreadNotes > 0 && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-600">
                          {unreadNotes} new
                        </span>
                      )}
                    </div>
                    {unreadNotes > 0 && (
                      <button
                        onClick={() => markNotificationsRead()}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[420px] overflow-y-auto divide-y divide-zinc-50">
                    {notifications.length === 0 && (
                      <div className="px-4 py-10 text-center text-sm text-zinc-500">
                        <Bell size={28} className="mx-auto mb-2 text-zinc-300" />
                        You are all caught up
                      </div>
                    )}
                    {notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.link || "/community"}
                        onClick={async () => {
                          setOpen(null);
                          await markNotificationsRead();
                        }}
                        className={`flex items-start gap-3 px-4 py-3 transition ${
                          !n.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-zinc-50"
                        }`}
                      >
                        <Avatar user={users.find((u) => u.id === n.actorId) || user} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm ${!n.read ? "font-semibold text-zinc-900" : "font-medium text-zinc-800"}`}>
                            {n.title}
                          </p>
                          <p className="truncate text-xs text-zinc-500 mt-0.5">{n.body}</p>
                          <p className="text-[10px] text-zinc-400 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. User Profile Avatar */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setOpen(open === "user" ? null : "user")}
                className={`ml-1 rounded-full p-0.5 ring-2 transition-colors ${
                  open === "user" ? "ring-primary" : "ring-transparent hover:ring-zinc-300"
                }`}
                aria-label="User Profile Menu"
              >
                <Avatar user={user} size={36} />
              </button>

              {/* User Profile Dropdown Menu */}
              {open === "user" && user && (
                <UserMenu
                  onClose={() => setOpen(null)}
                  onLogout={logout}
                />
              )}
            </div>
          </div>
        </div>

        {/* Main Navigation Row - Full Width */}
        <nav className="flex h-11 w-full items-center gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8 border-t border-zinc-100/80 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`skool-nav-link whitespace-nowrap ${pathname.startsWith(item.href) ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link href="/admin" className={`skool-nav-link whitespace-nowrap ${pathname.startsWith("/admin") ? "active" : ""}`}>
              Admin
            </Link>
          )}
          <Link
            href="/all-courses"
            className={`skool-nav-link whitespace-nowrap ${pathname.startsWith("/all-courses") ? "active" : ""}`}
          >
            All Courses
          </Link>
        </nav>
      </header>
      <ChatDrawer userId={chatUserId} onClose={() => setChatUserId(null)} />
    </>
  );
}

function UserMenu({
  onClose,
  onLogout,
}: {
  onClose: () => void;
  onLogout: () => Promise<void>;
}) {
  const { user, updateProfile } = useApp();
  const router = useRouter();
  const [langOpen, setLangOpen] = useState(false);

  async function go(href: string) {
    onClose();
    router.push(href);
  }

  const roleLabel =
    user?.role === "admin"
      ? "Admin"
      : user?.role === "manager"
        ? "★ Manager"
        : user?.isPremium
          ? "💎 VIP Member"
          : "Team Member";

  return (
    <div className="absolute right-0 top-full mt-2 z-50 w-[270px] overflow-hidden rounded-xl border border-zinc-200 bg-white py-2 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
      <div className="border-b border-zinc-100 px-4 py-2.5">
        <p className="truncate text-sm font-semibold text-zinc-900">{user?.name}</p>
        <p className="truncate text-xs text-zinc-500">{user?.email}</p>
        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          <UserRoleBadge role={user?.role} isPremium={user?.isPremium} size="xs" />
          <span className="text-[10px] text-zinc-400">
            {user?.points || 0} pts
          </span>
        </div>
      </div>

      <div className="py-1">
        <button onClick={() => go(`/profile/${user?.id}`)} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
          <UserRound size={16} className="text-zinc-500" /> Profile
        </button>
        <button onClick={() => go("/settings")} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
          <Settings size={16} className="text-zinc-500" /> Settings
        </button>
        <button onClick={() => go("/affiliates")} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
          <Sparkles size={16} className="text-zinc-500" /> Affiliates
        </button>
        <button onClick={() => go("/langOpen")} className="hidden" />
        <button onClick={() => setLangOpen(!langOpen)} className="flex w-full items-center justify-between px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
          <span className="flex items-center gap-2.5">
            <Globe size={16} className="text-zinc-500" /> Language
          </span>
          <span className="text-xs text-zinc-400">{user?.language || "English"}</span>
        </button>
        {langOpen && (
          <div className="bg-zinc-50 px-3 py-1.5 space-y-0.5">
            {["English", "Arabic", "Spanish", "French"].map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  updateProfile({ language: lang });
                  setLangOpen(false);
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-md px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200/60"
              >
                {lang}
                {user?.language === lang && <Check size={13} className="text-primary" />}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => go("/help")} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
          <HelpCircle size={16} className="text-zinc-500" /> Help center
        </button>
        <button onClick={() => go("/create-community")} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
          <Plus size={16} className="text-zinc-500" /> Create a community
        </button>
        <button onClick={() => go("/discover")} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
          <Compass size={16} className="text-zinc-500" /> Discover communities
        </button>
        <button onClick={() => go("/all-courses")} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
          <BookOpen size={16} className="text-zinc-500" /> All courses
        </button>
        {(user?.role === "admin" || user?.role === "manager") && (
          <button onClick={() => go("/admin")} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5">
            <Shield size={16} /> {user?.role === "admin" ? "Admin panel" : "Manager panel"}
          </button>
        )}
      </div>

      <div className="border-t border-zinc-100 pt-1">
        <button
          onClick={async () => {
            onClose();
            await onLogout();
            router.push("/login");
          }}
          className="flex w-full items-center gap-2.5 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
    </div>
  );
}

