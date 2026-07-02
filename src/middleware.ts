import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

/** Only auth-related routes — public merchant pages live at /{slug} without middleware. */
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/setup", "/login", "/auth/:path*", "/subscribe/:path*"],
};
