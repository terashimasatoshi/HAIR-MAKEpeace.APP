import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/csrf";

export async function GET() {
  const token = await generateCsrfToken();
  if (!token) {
    return NextResponse.json({ error: "CSRF token generation failed" }, { status: 500 });
  }
  return NextResponse.json({ token });
}
