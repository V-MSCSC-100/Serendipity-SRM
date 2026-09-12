"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import NavBar from "@/components/NavBar";

export default function GroupChatPage() {
  const { id } = useParams();
  const supabase = createClient();

  const [userId, setUserId] = useState(null);
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [notAMember, setNotAMember] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    let channel;

    async function init() {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      const { data: membership } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", id)
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!membership) {
        setNotAMember(true);
        setLoading(false);
        return;
      }

      const { data: groupData } = await supabase
        .from("groups")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      setGroup(groupData);

      const { data: memberRows } = await supabase
        .from("group_members")
        .select("user_id, profiles(id, name)")
        .eq("group_id", id);

      const profileMap = {};
      (memberRows || []).forEach((m) => {
        profileMap[m.user_id] = m.profiles?.name || "Member";
      });
      setProfilesById(profileMap);

      const { data: messageRows, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("group_id", id)
        .order("created_at", { ascending: true });

      if (messagesError) {
        setError(messagesError.message);
        setLoading(false);
        return;
      }

      setMessages(messageRows || []);
      setLoading(false);

      channel = supabase
        .channel(`messages-${id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${id}` },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();
    }

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    setError("");

    const { error: sendError } = await supabase.from("messages").insert({
      group_id: id,
      sender_id: userId,
      content: newMessage.trim(),
    });

    setSending(false);

    if (sendError) {
      setError(sendError.message);
      return;
    }

    setNewMessage("");
  }

  if (loading) {
    return (
      <div className="page-shell">
        <div className="container-narrow">
          <NavBar />
          <p className="loading-blink">Connecting to chat…</p>
        </div>
      </div>
    );
  }

  if (notAMember) {
    return (
      <div className="page-shell">
        <div className="container-narrow">
          <NavBar />
          <div className="alert-error">You need to join this quest before you can chat.</div>
          <Link href={`/groups/${id}`} className="btn">
            Back to quest
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="container-narrow">
        <NavBar />
        <div className="win">
          <div className="title-bar">
            <span>{group?.title || "Group Chat"}</span>
            <div className="title-bar-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="win-body">
            {error && <div className="alert-error">{error}</div>}
            <div className="chat-window">
              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="empty-state">No messages yet. Say hi!</div>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`chat-msg ${m.sender_id === userId ? "own" : ""}`}
                  >
                    <span className="sender">
                      {profilesById[m.sender_id] || "Member"}:
                    </span>{" "}
                    {m.content}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form className="chat-input-row" onSubmit={handleSend}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message…"
                  maxLength={500}
                />
                <button className="btn btn-primary" type="submit" disabled={sending}>
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
