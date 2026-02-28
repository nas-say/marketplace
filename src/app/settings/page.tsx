import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/db/profiles";
import { ProfileForm } from "./profile-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings — SideFlip" };

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await getProfile(userId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-50">Profile Settings</h1>
        <p className="mt-2 text-zinc-400">Your public seller profile shown to buyers.</p>
      </div>
      <ProfileForm
        initialValues={{
          displayName: profile?.displayName ?? "",
          bio: profile?.bio ?? "",
          location: profile?.location ?? "",
          website: profile?.website ?? "",
          twitter: profile?.social.twitter ?? "",
          github: profile?.social.github ?? "",
        }}
      />
    </div>
  );
}
