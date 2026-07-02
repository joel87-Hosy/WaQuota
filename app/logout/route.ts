import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function logout(request: NextRequest) {
  const supabase = createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", request.url));
}

export async function GET(request: NextRequest) {
  return logout(request);
}

export async function POST(request: NextRequest) {
  return logout(request);
}
