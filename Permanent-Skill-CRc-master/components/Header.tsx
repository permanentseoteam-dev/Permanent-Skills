"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
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
import { ChatDrawer } from "./ChatDrawer";

const NAV = [
  { href: "/community", label: "Community" },
  { href: "/classroom", label: "Classroom" },
  { href: "/calendar", label: "Calendar" },
  { href: "/members", label: "Members" },
  { href: "/leaderboards", label: "Leaderboards" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const {
    user,
    users,
    posts,
    notifications,
    messages,
    logout,
    markNotificationsRead,
    communities,
    activeCommunity,
    switchCommunity,
  } = useApp();
  const [open, setOpen] = useState<null | "community" | "user" | "chat" | "bell" | "search">(null);
  const [query, setQuery] = useState("");
  const [communitySearch, setCommunitySearch] = useState("");
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

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
      <header ref={headerRef} className="sticky top-0 z-50 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-4 py-2.5">
          <button
            onClick={() => setOpen(open === "community" ? null : "community")}
            className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-1 hover:bg-zinc-50"
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
            <div className="absolute left-4 top-[58px] z-50 w-[320px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
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
              </div>
              <div className="border-t border-zinc-100 p-2 space-y-1 max-h-[220px] overflow-y-auto">
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

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setOpen(open === "chat" ? null : "chat")}
              className="relative rounded-full p-2 hover:bg-zinc-100"
              aria-label="Chats"
            >
              <MessageCircle size={22} className="text-zinc-600" />
              {unreadChats > 0 && (
                <span className="absolute right-0.5 top-0.5 min-w-[18px] rounded-full bg-red-500 px-1 text-center text-[10px] font-bold text-white">
                  {unreadChats}
                </span>
              )}
            </button>
            <button
              onClick={() => setOpen(open === "bell" ? null : "bell")}
              className="relative rounded-full p-2 hover:bg-zinc-100"
              aria-label="Notifications"
            >
              <Bell size={22} className="text-zinc-600" />
              {unreadNotes > 0 && (
                <span className="absolute right-0.5 top-0.5 min-w-[18px] rounded-full bg-red-500 px-1 text-center text-[10px] font-bold text-white">
                  {unreadNotes > 99 ? "99+" : unreadNotes}
                </span>
              )}
            </button>
            <button onClick={() => setOpen(open === "user" ? null : "user")} className="ml-1">
              <Avatar user={user} size={36} />
            </button>
          </div>

          {open === "chat" && (
            <div className="absolute right-16 top-[58px] z-50 w-[380px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
              <div className="flex items-center justify-between px-4 py-3">
                <h3 className="font-semibold">Chats</h3>
                <Link href="/messages" onClick={() => setOpen(null)} className="text-sm text-primary">
                  All
                </Link>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {threads.length === 0 && <p className="px-4 py-8 text-center text-sm text-zinc-500">No messages yet</p>}
                {threads.map(([otherId, last]) => {
                  const person = users.find((u) => u.id === otherId);
                  const unread = messages.some((m) => m.senderId === otherId && m.receiverId === user?.id && !m.read);
                  return (
                    <button
                      key={otherId}
                      onClick={() => {
                        setChatUserId(otherId);
                        setOpen(null);
                      }}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50"
                    >
                      <Avatar user={person} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold">
                            {person?.name}
                            {unread && <span className="ml-1 text-primary">({messages.filter((m) => m.senderId === otherId && !m.read && m.receiverId === user?.id).length})</span>}
                          </p>
                          <span className="text-xs text-zinc-400">{timeAgo(last.createdAt)}</span>
                        </div>
                        <p className="truncate text-sm text-zinc-500">{last.body}</p>
                      </div>
                      {unread && <span className="mt-2 h-2.5 w-2.5 rounded-full bg-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {open === "bell" && (
            <div className="absolute right-12 top-[58px] z-50 w-[380px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
              <div className="flex items-center justify-between px-4 py-3">
                <h3 className="font-semibold">Notifications</h3>
                <button onClick={() => markNotificationsRead()} className="text-sm text-primary">
                  Mark all as read
                </button>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {notifications.length === 0 && <p className="px-4 py-8 text-center text-sm text-zinc-500">You are all caught up</p>}
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link}
                    onClick={() => setOpen(null)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50"
                  >
                    <Avatar user={users.find((u) => u.id === n.actorId) || user} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="truncate text-sm text-zinc-500">{n.body}</p>
                      <p className="text-xs text-zinc-400">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="mt-2 h-2.5 w-2.5 rounded-full bg-primary" />}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {open === "user" && user && (
            <UserMenu
              onClose={() => setOpen(null)}
              onLogout={logout}
            />
          )}
        </div>

        <nav className="mx-auto flex max-w-[1180px] items-center gap-1 overflow-x-auto px-3">
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

  return (
    <div className="absolute right-4 top-[58px] z-50 w-[260px] overflow-hidden rounded-xl border border-zinc-200 bg-white py-2 shadow-xl">
      <p className="truncate px-4 py-2 text-sm font-medium text-zinc-700">{user?.email}</p>
      <button onClick={() => go(`/profile/${user?.id}`)} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-zinc-50">
        <UserRound size={16} /> Profile
      </button>
      <button onClick={() => go("/settings")} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-zinc-50">
        <Settings size={16} /> Settings
      </button>
      <button onClick={() => go("/affiliates")} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-zinc-50">
        <Sparkles size={16} /> Affiliates
      </button>
      <button onClick={() => setLangOpen(!langOpen)} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-zinc-50">
        <Globe size={16} /> Language
      </button>
      {langOpen && (
        <div className="px-3 pb-2">
          {["English", "Arabic", "Spanish", "French"].map((lang) => (
            <button
              key={lang}
              onClick={() => {
                updateProfile({ language: lang });
                setLangOpen(false);
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              {lang}
              {user?.language === lang && <Check size={14} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
      <button onClick={() => go("/help")} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-zinc-50">
        <HelpCircle size={16} /> Help center
      </button>
      <button onClick={() => go("/create-community")} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-zinc-50">
        <Plus size={16} /> Create a community
      </button>
      <button onClick={() => go("/discover")} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-zinc-50">
        <Compass size={16} /> Discover communities
      </button>
      {user?.role === "admin" && (
        <button onClick={() => go("/admin")} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-zinc-50">
          <Shield size={16} /> Admin
        </button>
      )}
      <button
        onClick={async () => {
          onClose();
          await onLogout();
          router.push("/login");
        }}
        className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-zinc-50"
      >
        <LogOut size={16} /> Log out
      </button>
    </div>
  );
}
