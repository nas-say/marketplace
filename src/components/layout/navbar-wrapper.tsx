import { Navbar } from "./navbar";

export async function NavbarWrapper() {
  return <Navbar connectsBalance={null} unreadNotifications={0} notifications={[]} />;
}
