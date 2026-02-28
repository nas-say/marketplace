import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CreateForm } from "./create-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "List Your Project — SideFlip" };

export default async function CreatePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <CreateForm />;
}
