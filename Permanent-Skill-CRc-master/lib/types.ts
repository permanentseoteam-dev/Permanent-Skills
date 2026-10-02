export type Role = "admin" | "manager" | "member" | "student" | "team_member" | "user";
export type Status = "pending" | "approved" | "rejected";
export type PostCategory = "chat" | "wins" | "recorded" | "reviews";
export type EventType = "live" | "premium";

export interface Application {
  fullName: string;
  phone: string;
  country: string;
  city: string;
  profession: string;
  experience: string;
  website: string;
  goals: string;
  howHeard: string;
  notes: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  username: string;
  bio: string;
  role: Role;
  status: Status;
  points: number;
  points7d: number;
  points30d: number;
  avatarColor: string;
  location: string;
  lat: number;
  lng: number;
  joinedAt: string;
  lastSeenAt: string;
  loginCount: number;
  isPremium: boolean;
  language: string;
  ipAddress?: string;
  purchasedCourseIds?: string[];
  phone?: string;
  notes?: string;
  application?: Application;
  affiliateCode: string;
  affiliateClicks: number;
  affiliateSignups: number;
  affiliateEarnings: number;
  referredBy?: string;
}

export interface PublicUser {
  id: string;
  email?: string;
  name: string;
  username: string;
  bio: string;
  role: Role;
  status?: Status;
  points: number;
  points7d: number;
  points30d: number;
  avatarColor: string;
  location: string;
  lat: number;
  lng: number;
  joinedAt: string;
  lastSeenAt: string;
  isOnline: boolean;
  isPremium: boolean;
  language?: string;
  ipAddress?: string;
  purchasedCourseIds?: string[];
  phone?: string;
  notes?: string;
  loginCount?: number;
  application?: Application;
  affiliateCode?: string;
  affiliateClicks?: number;
  affiliateSignups?: number;
  affiliateEarnings?: number;
  hasActiveSession?: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  category: PostCategory;
  title: string;
  body: string;
  pinned: boolean;
  likes: string[];
  createdAt: string;
  thumbnail?: string;
  communityId?: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
  status?: Status;
}

export interface Lesson {
  id: string;
  module: string;
  title: string;
  duration: string;
  notes: string;
  videoUrl?: string;
  videoTitle?: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  accent: string;
  badge: string;
  unlockLevel: number;
  price?: number;
  lessons: Lesson[];
  bannerBrand?: string;
  bannerSubtitle?: string;
  bannerTitle?: string;
  thumbnail?: string;
}

export interface Progress {
  userId: string;
  courseId: string;
  completedLessonIds: string[];
}

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  version?: string;
  leadId: string;
  leadName?: string;
  memberIds: string[];
  mentionedUsernames?: string[];
  progress: number;
  tasks?: ProjectTask[];
  status: "active" | "completed" | "paused";
  thumbnail?: string;
  meetSyncTime?: string;
  meetRoom?: string;
  meetUrl?: string;
  createdAt: string;
  createdBy: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: EventType;
  description: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  actorId?: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  rating: number;
  body: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  userId: string;
  amount: number;
  plan: string;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  deviceId?: string;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  slug: string;
  icon?: string;
  banner?: string;
  isPrivate?: boolean;
  memberCount?: number;
  onlineCount?: number;
  adminCount?: number;
  type?: "students" | "team" | "general";
  createdAt: string;
  createdBy: string;
}

export interface AdminStats {
  totalUsers: number;
  totalSales: number;
  totalLogins: number;
  pendingCount: number;
}

export interface Database {
  users: User[];
  posts: Post[];
  comments: Comment[];
  courses: Course[];
  progress: Progress[];
  events: CalendarEvent[];
  projects: Project[];
  messages: Message[];
  notifications: Notification[];
  reviews: Review[];
  sales: Sale[];
  sessions: Session[];
  communities: Community[];
}

export interface AppState {
  user: PublicUser | null;
  users: PublicUser[];
  posts: Post[];
  comments: Comment[];
  courses: Course[];
  progress: Progress[];
  events: CalendarEvent[];
  projects: Project[];
  messages: Message[];
  notifications: Notification[];
  reviews: Review[];
  stats: AdminStats | null;
  sales: Sale[];
  limited: boolean;
  communities: Community[];
  activeCommunityId: string;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
  id?: string;
  next?: string;
}
