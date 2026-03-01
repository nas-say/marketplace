import { createServerClient as _createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server component client (respects RLS via cookies/session)
export async function createServerClient() {
  const cookieStore = await cookies();
  return _createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server component — ignore
        }
      },
    },
  });
}

// Browser client for client components
export function createBrowserClient() {
  return createClient(url, anon);
}

// Service role client — bypasses RLS, only use in server actions / API routes
export function createServiceClient() {
  if (typeof window !== "undefined") {
    throw new Error("createServiceClient must only be used on the server.");
  }

  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!service) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return createClient(url, service);
}
