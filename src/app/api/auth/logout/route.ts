export const runtime = "edge";

import { NextResponse } from "next/server";
import { clearSessionCookie, getSessionFromCookie } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getSessionFromCookie();
    if (session) {
      const { logoutUser } = await import("@/lib/auth");
      // Get token from cookie to delete the session
      const { cookies } = await import("next/headers");
      const token = (await cookies()).get("voice_session")?.value;
      if (token) await logoutUser(token);
    }
    await clearSessionCookie();
    return NextResponse.json({ message: "Logged out successfully" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Logout failed" }, { status: 500 });
  }
}
