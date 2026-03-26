export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated", authError }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    auth_user: {
      id:             user.id,
      email:          user.email,
      user_metadata:  user.user_metadata,
      app_metadata:   user.app_metadata,
    },
    profile,
    profile_error: profileError,
  });
}
