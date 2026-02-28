import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CreateBetaForm } from "./create-beta-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create Beta Test — SideFlip" };

export default async function CreateBetaPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <CreateBetaForm />;
}
