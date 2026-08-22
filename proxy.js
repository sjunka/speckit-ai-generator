import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/capture(.*)",
  "/result(.*)",
  "/dashboard(.*)",
  "/gallery(.*)",
  // "/wall" is deliberately absent: the wall is public, like the landing route.
]);

export const proxy = clerkMiddleware(async (authContext, request) => {
  if (isProtectedRoute(request)) {
    await authContext.protect();
    return;
  }

  if (new URL(request.url).pathname === "/") {
    const { userId } = await authContext();
    if (!userId) return;
    return NextResponse.redirect(new URL("/capture", request.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

export default proxy;
