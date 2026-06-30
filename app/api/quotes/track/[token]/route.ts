import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _request: Request,
  { params }: { params: { token: string } },
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("track_quote_open", {
    p_token: params.token,
  });

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
