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
import { Avatar } from "./ui";
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
  const menuContainerRef = useRef<HTMLDivElement>(null);

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

  // Handle mousedown outside menu container
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (open && menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
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
      {/* Invisible backdrop to guarantee clicking anywhere on any white area / background dismisses open popups */}
      {open !== null && (
        <div
          className="fixed inset-0 z-40 bg-transparent cursor-default select-none"
          onClick={() => setOpen(null)}
          aria-hidden="true"
        />
      )}

      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white isolate">
        <div ref={menuContainerRef} className="relative mx-auto flex h-14 max-w-[1180px] items-center gap-3 px-4">
          {/* Community Switcher Dropdown */}
          <button
            onClick={() => setOpen(open === "community" ? null : "community")}
            className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-zinc-50 shrink-0"
          >
            {activeCommunity?.icon ? (
              <Image
                src={activeCommunity.icon}
                alt={activeCommunity.name}
                width={190}
                height={48}
                className="h-10 w-auto shrink-0 object-contain"
                priority
              />
            ) : (
              <span className="flex h-10 items-center gap-2 font-bold text-zinc-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
                  {activeCommunity?.name?.slice(0, 2).toUpperCase() || "PS"}
                </span>
                <span className="truncate max-w-[180px]">{activeCommunity?.name || "Permanent Skill Strategy"}</span>
              </span>
            )}
            <ChevronDown size={16} className="shrink-0 text-zinc-500" />
          </button>

          {open === "community" && (
            <div className="absolute left-4 top-[58px] z-50 w-[330px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
              <div className="p-2">
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={communitySearch}
                    onChange={(e) => setCommunitySearch(e.target.value)}
                    className="w-full rounded-lg bg-zinc-100 py-2 pl-8 pr-3 text-sm outline-none"
                    placeholder="Search"
                  />
                </div>
                <Link
                  href="/create-community"
                  onClick={() => setOpen(null)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-zinc-50"
                >
                  <Plus size={16} /> Create a community
                </Link>
                <Link
                  href="/discover"
                  onClick={() => setOpen(null)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-zinc-50"
                >
                  <Compass size={16} /> Discover communities
                </Link>
                <Link
                  href="/all-courses"
                  onClick={() => setOpen(null)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-zinc-50 text-primary font-medium"
                >
                  <BookOpen size={16} /> All Courses (Catalog)
                </Link>
              </div>

              {/* User's Purchased Courses Section */}
              <div className="border-t border-zinc-100 p-2">
                <div className="mb-1.5 flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  <span>My Purchased Courses</span>
                  <Link href="/all-courses" onClick={() => setOpen(null)} className="text-primary hover:underline lowercase font-normal">
                    browse
                  </Link>
                </div>
                {myPurchasedCourses.length > 0 ? (
                  <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                    {myPurchasedCourses.map((c) => (
                      <Link
                        key={c.id}
                        href={`/classroom/${c.slug}`}
                        onClick={() => setOpen(null)}
                        className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 transition"
                      >
                        <span className="truncate font-medium">{c.title}</span>
                        <span className="ml-2 shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600">
                          {c.badge}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-zinc-50 p-2.5 text-center">
                    <p className="text-xs text-zinc-500">No courses purchased yet.</p>
                    <Link
                      href="/all-courses"
                      onClick={() => setOpen(null)}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <Plus size={13} /> Purchase a course
                    </Link>
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-100 p-2 space-y-1 max-h-[160px] overflow-y-auto">
                <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Communities
                </div>
                {filteredCommunities.map((c) => {
                  const isCurrent = (activeCommunity?.id || "comm-pss") === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        switchCommunity(c.id);
                        setOpen(null);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                        isCurrent
                          ? "bg-[#5051F9]/10 text-primary"
                          : "text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {c.icon ? (
                          <Image src={c.icon} alt="" width={22} height={22} className="h-6 w-6 object-contain" />
                        ) : (
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-200 text-xs font-bold text-zinc-700">
                            {c.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <span className="truncate">{c.name}</span>
                      </div>
                      {isCurrent && <Check size={16} className="text-primary shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative mx-auto hidden w-full max-w-xl md:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen("search");
              }}
              onFocus={() => setOpen("search")}
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

            {/* 2. Notifications / Bell Icon */}
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

            {/* 3. User Profile Avatar */}
            <button
              onClick={() => setOpen(open === "user" ? null : "user")}
              className={`ml-1 rounded-full p-0.5 ring-2 transition-colors ${
                open === "user" ? "ring-primary" : "ring-transparent hover:ring-zinc-300"
              }`}
              aria-label="User Profile Menu"
            >
              <Avatar user={user} size={36} />
            </button>
          </div>

          {/* Chat Dropdown Menu */}
          {open === "chat" && (
            <div className="absolute right-16 top-[58px] z-50 w-[380px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-100">
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

          {/* Notifications Dropdown Menu */}
          {open === "bell" && (
            <div className="absolute right-12 top-[58px] z-50 w-[380px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-100">
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

          {/* User Profile Dropdown Menu */}
          {open === "user" && user && (
            <UserMenu
              onClose={() => setOpen(null)}
              onLogout={logout}
            />
          )}
        </div>

        {/* Main Navigation Row */}
        <nav className="mx-auto flex h-11 max-w-[1180px] items-center gap-1 overflow-x-auto px-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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

  const roleLabel = user?.role === "admin" ? "Admin" : user?.isPremium ? "Premium Member" : "Team Member";

  return (
    <div className="absolute right-4 top-[58px] z-50 w-[270px] overflow-hidden rounded-xl border border-zinc-200 bg-white py-2 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
      <div className="border-b border-zinc-100 px-4 py-2.5">
        <p className="truncate text-sm font-semibold text-zinc-900">{user?.name}</p>
        <p className="truncate text-xs text-zinc-500">{user?.email}</p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            {roleLabel}
          </span>
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
        {user?.role === "admin" && (
          <button onClick={() => go("/admin")} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5">
            <Shield size={16} /> Admin panel
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

