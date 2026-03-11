import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isConfiguredAdminUser } from "@/lib/admin-access-shared";

const isProtected = createRouteMatcher([
  "/admin(.*)",
  "/dashboard(.*)",
  "/create(.*)",
  "/beta/create(.*)",
  "/connects(.*)",
  "/settings(.*)",
  "/listing/:id/edit(.*)",
  "/listing/:id/verify(.*)",
]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();

  if (isProtected(req)) {
    if (!userId) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }
  }
  if (isAdminRoute(req)) {
    if (!isConfiguredAdminUser(userId)) {
      return new Response("Not found", { status: 404 });
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
