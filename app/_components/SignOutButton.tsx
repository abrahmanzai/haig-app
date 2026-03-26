"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors"
      style={{ color: "var(--text-secondary)" }}
    >
      Sign Out
    </button>
  );
}
