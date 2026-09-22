import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";

export async function requireAdmin() {
  const ok = await isAdminAuthed();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
