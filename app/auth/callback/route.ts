import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase auth callback — exchanges the PKCE code from the confirmation
 * email link for a live session, then redirects to /dashboard.
 *
 * Supabase redirects here after:
 *   • Email confirmation on sign-up
 *   • Magic-link login (if used later)
 *   • Password-reset emails
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Allow a custom post-auth destination, default to /dashboard
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Code missing or exchange failed — send back to login with an error flag
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
