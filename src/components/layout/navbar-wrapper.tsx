import { auth } from "@clerk/nextjs/server";
import { getConnectsBalance } from "@/lib/db/connects";
import { Navbar } from "./navbar";

export async function NavbarWrapper() {
  const { userId } = await auth();
  const connectsBalance = userId ? await getConnectsBalance(userId) : null;
  return <Navbar connectsBalance={connectsBalance} />;
}
