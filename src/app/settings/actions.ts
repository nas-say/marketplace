"use server";

import { auth } from "@clerk/nextjs/server";
import { updateProfile } from "@/lib/db/profiles";
import { revalidatePath } from "next/cache";
import {
  normalizeGithubHandle,
  normalizeTwitterHandle,
  normalizeWebsiteUrl,
} from "@/lib/validation/profile";

export async function updateProfileAction(payload: {
  displayName: string;
  bio: string;
  location: string;
  website: string;
  twitter: string;
  github: string;
}): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };
  const displayName = payload.displayName.trim();
  if (!displayName) return { error: "Display name is required" };
  if (displayName.length > 80) return { error: "Display name must be 80 characters or fewer." };

  const bio = payload.bio.trim();
  if (bio.length > 500) return { error: "Bio must be 500 characters or fewer." };
  const location = payload.location.trim();

  const websiteResult = normalizeWebsiteUrl(payload.website);
  if (websiteResult.error) {
    return { error: websiteResult.error };
  }

  const twitterResult = normalizeTwitterHandle(payload.twitter);
  if (twitterResult.error) {
    return { error: twitterResult.error };
  }

  const githubResult = normalizeGithubHandle(payload.github);
  if (githubResult.error) {
    return { error: githubResult.error };
  }

  const updated = await updateProfile(userId, {
    displayName,
    bio,
    location,
    website: websiteResult.value,
    twitter: twitterResult.value,
    github: githubResult.value,
  });
  if (!updated) return { error: "Could not update your profile right now." };
  revalidatePath(`/seller/${userId}`);
  revalidatePath("/dashboard");
  return { success: true };
}
