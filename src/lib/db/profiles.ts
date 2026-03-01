import { createServerClient, createServiceClient } from "@/lib/supabase";
import { User } from "@/types/user";

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.clerk_user_id as string,
    displayName: (row.display_name as string) ?? "Anonymous",
    avatar: "/images/placeholder-avatar.png",
    bio: (row.bio as string) ?? "",
    location: (row.location as string) ?? "",
    website: (row.website as string) ?? "",
    social: {
      twitter: (row.twitter as string) ?? undefined,
      github: (row.github as string) ?? undefined,
    },
    stats: {
      totalSales: Number(row.total_sales ?? 0),
      totalEarnings: Number(row.total_earnings ?? 0),
      listingsCount: 0,
      betaTestsCompleted: Number(row.beta_tests_completed ?? 0),
      feedbackGiven: Number(row.feedback_given ?? 0),
      memberSince: row.created_at as string,
    },
    verified: Boolean(row.verified),
  };
}

export async function getProfile(clerkUserId: string): Promise<User | null> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .single();
  if (error || !data) return null;
  return rowToUser(data);
}

export async function getTopTesters(limit = 5): Promise<User[]> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .gt("feedback_given", 0)
    .order("feedback_given", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map(rowToUser);
}

export async function updateProfile(
  clerkUserId: string,
  payload: {
    displayName: string;
    bio: string;
    location: string;
    website: string;
    twitter: string;
    github: string;
  }
): Promise<boolean> {
  const client = createServiceClient();
  const { error } = await client.from("profiles").update({
    display_name: payload.displayName || null,
    bio: payload.bio || null,
    location: payload.location || null,
    website: payload.website || null,
    twitter: payload.twitter || null,
    github: payload.github || null,
  }).eq("clerk_user_id", clerkUserId);
  return !error;
}

export async function getSavedUpiId(clerkUserId: string): Promise<string | null> {
  const client = await createServerClient();
  const { data } = await client
    .from("profiles")
    .select("upi_id")
    .eq("clerk_user_id", clerkUserId)
    .single();
  return (data?.upi_id as string | null) ?? null;
}

export async function saveUpiId(clerkUserId: string, upiId: string): Promise<void> {
  const client = createServiceClient();
  await client.from("profiles").update({ upi_id: upiId }).eq("clerk_user_id", clerkUserId);
}

// Called by Clerk webhook on user.created
export async function upsertProfile(payload: {
  clerkUserId: string;
  displayName: string;
  email?: string;
}): Promise<void> {
  const client = createServiceClient();
  await client.from("profiles").upsert(
    {
      clerk_user_id: payload.clerkUserId,
      display_name: payload.displayName,
    },
    { onConflict: "clerk_user_id" }
  );
}
