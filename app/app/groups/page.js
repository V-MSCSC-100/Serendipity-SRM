"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import NavBar from "@/components/NavBar";

export default function GroupDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState(null);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    loadGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadGroup() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id || null);

    const { data: groupData, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (groupError || !groupData) {
      setError(groupError?.message || "This quest doesn't exist anymore.");
      setLoading(false);
      return;
    }

    const { data: memberRows, error: memberError } = await supabase
      .from("group_members")
      .select("user_id, joined_at, profiles(id, name, photo_url, bio, contact)")
      .eq("group_id", id);

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    setGroup(groupData);
    setMembers(memberRows);
    setIsMember(memberRows.some((m) => m.user_id === user?.id));
    setLoading(false);
  }

  async function handleBlock(targetId) {
    setActionMsg("");
    const { error: blockError } = await supabase
      .from("blocked_users")
      .insert({ blocker_id: userId, blocked_id: targetId });

    if (blockError) {
      setActionMsg(blockError.message);
    } else {
      setActionMsg("User blocked. You won't be matched with them again.");
    }
  }

  async function handleReport(targetId) {
    const reason = window.prompt("Briefly describe why you're reporting this user:");
    if (!reason || !reason.trim()) return;

    setActionMsg("");
    const { error: reportError } = await supabase
      .from("reports")
      .insert({ reporter_id: userId, target_id: targetId, reason: reason.trim() });

    if (reportError) {
      setActionMsg(reportError.message);
    } else {
      setActionMsg("Report submitted. Thanks for flagging this.");
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <div className="container-wide">
          <NavBar />
          <p className="loading-blink">Loading quest…</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="page-shell">
        <div className="container-wide">
          <NavBar />
          <div className="alert-error">{error}</div>
          <Link href="/groups" className="btn">
            Back to quests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="container-wide">
        <NavBar />
        <div className="win" style={{ marginBottom: 14 }}>
          <div className="title-bar">
            <span>{group.title}</span>
            <div className="title-bar-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="win-body">
            <p>{group.description}</p>
            <span className="tag">{group.activity_type}</span>
            <span className="tag">
              {members.length}/{group.spots_needed} joined
            </span>
            {group.gender_preference !== "any" && (
              <span className="tag">prefers {group.gender_preference}</span>
            )}
            {isMember && (
              <div style={{ marginTop: 12 }}>
                <Link href={`/groups/${group.id}/chat`} className="btn btn-primary">
                  Open Group Chat
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="win">
          <div className="title-bar">
            <span>Members</span>
            <div className="title-bar-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="win-body">
            {actionMsg && <div className="alert-error" style={{ background: "#fff7d6", borderColor: "var(--away-yellow)", color: "#5c4a00" }}>{actionMsg}</div>}
            <div className="buddy-list">
              {members.map((m) => (
                <div className="buddy-item" key={m.user_id}>
                  <div style={{ display: "flex", gap: 10 }}>
                    {m.profiles?.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.profiles.photo_url}
                        alt={`${m.profiles?.name || "Member"} photo`}
                        className="pixel-avatar"
                      />
                    ) : (
                      <div className="pixel-avatar" />
                    )}
                    <div>
                      <strong>{m.profiles?.name || "Unknown user"}</strong>
                      <p style={{ margin: "4px 0", fontSize: 12 }}>{m.profiles?.bio}</p>
                      {m.profiles?.contact && (
                        <p style={{ margin: 0, fontSize: 11, color: "#333" }}>
                          Contact: {m.profiles.contact}
                        </p>
                      )}
                    </div>
                  </div>
                  {m.user_id !== userId && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn" onClick={() => handleReport(m.user_id)}>
                        Report
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleBlock(m.user_id)}
                      >
                        Block
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
