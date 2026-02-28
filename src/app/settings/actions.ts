"use server";

import { auth } from "@clerk/nextjs/server";
import { updateProfile } from "@/lib/db/profiles";
import { revalidatePath } from "next/cache";

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
  if (!payload.displayName.trim()) return { error: "Display name is required" };

  await updateProfile(userId, payload);
  revalidatePath(`/seller/${userId}`);
  revalidatePath("/dashboard");
  return { success: true };
}
