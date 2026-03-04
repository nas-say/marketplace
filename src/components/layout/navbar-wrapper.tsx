import { auth } from "@clerk/nextjs/server";
import { getConnectsBalance } from "@/lib/db/connects";
import { getUnreadUserNotificationCount, getUserNotifications } from "@/lib/db/notifications";
import { Navbar } from "./navbar";

export async function NavbarWrapper() {
  const { userId } = await auth();
  if (!userId) return <Navbar connectsBalance={null} unreadNotifications={0} notifications={[]} />;

  const [connectsBalance, unreadNotifications, notifications] = await Promise.all([
    getConnectsBalance(userId),
    getUnreadUserNotificationCount(userId),
    getUserNotifications(userId, 12),
  ]);

  return (
    <Navbar
      connectsBalance={connectsBalance}
      unreadNotifications={unreadNotifications}
      notifications={notifications}
    />
  );
}
