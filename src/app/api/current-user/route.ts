export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyTokenEdge } from "@/lib/auth/jwt-edge";
import { COOKIE_NAME } from "@/lib/auth/jwt";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return NextResponse.json({ user: null });

    const user = verifyTokenEdge(token);

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}


