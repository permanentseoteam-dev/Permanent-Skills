import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const DEFAULT_URL = "https://cunsuntblrlcrhbdjdor.supabase.co";
const DEFAULT_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1bnN1bnRibHJsY3JoYmRqZG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMTAwNzIsImV4cCI6MjEwNjU4NjA3Mn0.qoMRJbOxhFpxULBqAvXYkEPRU28KmMSNZ7QtHYkdyTE";
const DEFAULT_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1bnN1bnRibHJsY3JoYmRqZG9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTAxMDA3MiwiZXhwIjoyMTA2NTg2MDcyfQ.dXg7_1pG_wEt-rXrXKVhY1IzgMlCSu_QH55KIqXHD-g";

function loadEnvFileIfNeeded() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const idx = trimmed.indexOf("=");
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim();
          if (!process.env[k]) {
            process.env[k] = v;
          }
        }
      }
    }
  } catch {}
}

function getCredentials() {
  loadEnvFileIfNeeded();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_KEY;

  return { url, anonKey, serviceKey };
}

// Resilient fetch wrapper with automatic retry for transient network drops / pool reconnects
const resilientFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  let attempts = 0;
  const maxAttempts = 3;
  while (attempts < maxAttempts) {
    try {
      const res = await fetch(input, init);
      // If server returned a 502/503/504 temporary gateway/restart error, retry once or twice
      if ((res.status === 502 || res.status === 503 || res.status === 504) && attempts < maxAttempts - 1) {
        attempts++;
        await new Promise((r) => setTimeout(r, attempts * 500));
        continue;
      }
      return res;
    } catch (err: any) {
      attempts++;
      if (attempts >= maxAttempts) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, attempts * 500));
    }
  }
  return fetch(input, init);
};

// Client for public / frontend browser usage
export const getSupabase = () => {
  const { url, anonKey } = getCredentials();
  return createClient(url, anonKey, {
    global: {
      fetch: resilientFetch,
    },
  });
};

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY,
  {
    global: {
      fetch: resilientFetch,
    },
  }
);

// Admin client with service_role key for backend server actions & full database access
export const getAdminSupabase = () => {
  const { url, serviceKey } = getCredentials();
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: resilientFetch,
    },
  });
};

