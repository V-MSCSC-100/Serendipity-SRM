"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function NavBar() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="navbar">
      <span className="brand">◆ SIDE QUEST</span>
      <div className="navlinks">
        <Link href="/groups" className="btn">
          Quests
        </Link>
        <Link href="/groups/new" className="btn">
          + New Quest
        </Link>
        <Link href="/profile/edit" className="btn">
          My Profile
        </Link>
        <button className="btn" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
