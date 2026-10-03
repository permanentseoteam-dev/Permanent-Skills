import { createClient } from "@supabase/supabase-js";

function getCredentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    // If during build time or missing env
    return {
      url: url || "https://placeholder.supabase.co",
      anonKey: anonKey || "placeholder-anon-key",
      serviceKey: serviceKey || "placeholder-service-key",
    };
  }

  return { url, anonKey, serviceKey: serviceKey || anonKey };
}

// Client for public / frontend browser usage
export const getSupabase = () => {
  const { url, anonKey } = getCredentials();
  return createClient(url, anonKey);
};

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
);

// Admin client with service_role key for backend server actions & full database access
export const getAdminSupabase = () => {
  const { url, serviceKey } = getCredentials();
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
