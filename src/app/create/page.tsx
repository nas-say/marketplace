import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CreateForm } from "./create-form";
import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata("List Your Project");

export default async function CreatePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <CreateForm />;
}
