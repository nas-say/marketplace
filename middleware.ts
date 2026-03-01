import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isConfiguredAdminUser } from "@/lib/admin-access-shared";

const isProtected = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
  "/create(.*)",
  "/beta/create(.*)",
  "/settings(.*)",
  "/listing/:id/edit(.*)",
]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    await auth.protect();
  }
  if (isAdminRoute(req)) {
    const { userId } = await auth();
    if (!isConfiguredAdminUser(userId)) {
      return new Response("Not found", { status: 404 });
    }
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
