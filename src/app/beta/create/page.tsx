import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CreateBetaForm } from "./create-beta-form";
import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata("Create Beta Test");

export default async function CreateBetaPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <CreateBetaForm />;
}
