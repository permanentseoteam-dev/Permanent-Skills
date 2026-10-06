-- ==============================================================================
-- Supabase Schema for Permanent Skills Platform
-- ==============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  bio TEXT DEFAULT '',
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'pending',
  points INTEGER DEFAULT 0,
  points7d INTEGER DEFAULT 0,
  points30d INTEGER DEFAULT 0,
  avatar_color TEXT DEFAULT '#f59e0b',
  location TEXT DEFAULT '',
  lat NUMERIC DEFAULT 0,
  lng NUMERIC DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  login_count INTEGER DEFAULT 1,
  is_premium BOOLEAN DEFAULT FALSE,
  language TEXT DEFAULT 'en',
  ip_address TEXT,
  purchased_course_ids TEXT[] DEFAULT '{}',
  phone TEXT,
  notes TEXT,
  application JSONB,
  affiliate_code TEXT UNIQUE,
  affiliate_clicks INTEGER DEFAULT 0,
  affiliate_signups INTEGER DEFAULT 0,
  affiliate_earnings NUMERIC DEFAULT 0,
  referred_by TEXT
);

-- 2. COMMUNITIES TABLE
CREATE TABLE IF NOT EXISTS public.communities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  banner TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  member_count INTEGER DEFAULT 0,
  online_count INTEGER DEFAULT 0,
  admin_count INTEGER DEFAULT 1,
  type TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- 3. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  accent TEXT DEFAULT '',
  badge TEXT DEFAULT '',
  unlock_level INTEGER DEFAULT 1,
  price NUMERIC DEFAULT 0,
  lessons JSONB DEFAULT '[]'::jsonb,
  banner_brand TEXT,
  banner_subtitle TEXT,
  banner_title TEXT,
  thumbnail TEXT,
  watermark TEXT,
  is_premium_only BOOLEAN DEFAULT FALSE,
  glow_color TEXT DEFAULT 'yellow'
);

-- 4. PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.progress (
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  completed_lesson_ids TEXT[] DEFAULT '{}',
  PRIMARY KEY (user_id, course_id)
);

-- 5. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  author_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  pinned BOOLEAN DEFAULT FALSE,
  likes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  thumbnail TEXT,
  community_id TEXT
);

-- 6. COMMENTS TABLE (Supports both community posts and classroom lessons)
CREATE TABLE IF NOT EXISTS public.comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  author_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'approved'
);
-- Migration helper for existing databases with strict foreign key constraint:
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;


-- 7. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  version TEXT,
  lead_id TEXT,
  lead_name TEXT,
  member_ids TEXT[] DEFAULT '{}',
  mentioned_usernames TEXT[] DEFAULT '{}',
  progress INTEGER DEFAULT 0,
  tasks JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  thumbnail TEXT,
  meet_sync_time TEXT,
  meet_room TEXT,
  meet_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- 8. CALENDAR EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  type TEXT DEFAULT 'live',
  description TEXT DEFAULT '',
  banner_text TEXT DEFAULT 'Q & A',
  banner_subtitle TEXT,
  banner_image TEXT,
  meet_url TEXT DEFAULT 'https://meet.google.com/new',
  is_locked BOOLEAN DEFAULT FALSE,
  host_name TEXT
);
-- Migration helper for existing databases:
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS price_note TEXT;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS about_headline TEXT;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS about_description TEXT;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS about_features JSONB;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS about_pain_points JSONB;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS about_closing_text TEXT;

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner_text TEXT DEFAULT 'Q & A';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner_subtitle TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner_image TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS meet_url TEXT DEFAULT 'https://meet.google.com/new';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS host_name TEXT;

-- 9. DIRECT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  actor_id TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT DEFAULT '',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SALES TABLE
CREATE TABLE IF NOT EXISTS public.sales (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  plan TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. VIDEO RESOURCES TABLE (URLs, full video uploads, replays, and overviews)
CREATE TABLE IF NOT EXISTS public.video_resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  video_url TEXT,
  video_file_url TEXT,
  video_file_data TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  category TEXT DEFAULT 'overview',
  course_id TEXT REFERENCES public.courses(id) ON DELETE SET NULL,
  community_id TEXT,
  author_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON public.posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_video_resources_category ON public.video_resources(category);
CREATE INDEX IF NOT EXISTS idx_video_resources_course_id ON public.video_resources(course_id);
CREATE INDEX IF NOT EXISTS idx_video_resources_author_id ON public.video_resources(author_id);
CREATE INDEX IF NOT EXISTS idx_video_resources_is_featured ON public.video_resources(is_featured);

-- ==============================================================================
-- PERMISSIONS & ROLES
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;
