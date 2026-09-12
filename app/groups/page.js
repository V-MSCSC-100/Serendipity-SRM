"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import NavBar from "@/components/NavBar";

export default function GroupsPage() {
  const supabase = createClient();

  const [userId, setUserId] = useState(null);
  const [groups, setGroups] = useState([]);
  const [memberCounts, setMemberCounts] = useState({});
  const [myMemberships, setMyMemberships] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joiningId, setJoiningId] = useState(null);

  const [genderFilter, setGenderFilter] = useState("any");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id || null);

    const { data: groupsData, error: groupsError } = await supabase
      .from("groups")
      .select("*")
      .order("created_at", { ascending: false });

    if (groupsError) {
      setError(groupsError.message);
      setLoading(false);
      return;
    }

    const { data: membersData, error: membersError } = await supabase
      .from("group_members")
      .select("group_id, user_id");

    if (membersError) {
      setError(membersError.message);
      setLoading(false);
      return;
    }

    const counts = {};
    const mine = new Set();
    for (const row of membersData) {
      counts[row.group_id] = (counts[row.group_id] || 0) + 1;
      if (row.user_id === user?.id) mine.add(row.group_id);
    }

    setGroups(groupsData);
    setMemberCounts(counts);
    setMyMemberships(mine);
    setLoading(false);
  }

  async function handleJoin(groupId) {
    setJoiningId(groupId);
    setError("");

    const { error: joinError } = await supabase
      .from("group_members")
      .insert({ group_id: groupId, user_id: userId });

    setJoiningId(null);

    if (joinError) {
      setError(joinError.message);
      return;
    }

    setMemberCounts((prev) => ({ ...prev, [groupId]: (prev[groupId] || 0) + 1 }));
    setMyMemberships((prev) => new Set(prev).add(groupId));
  }

  const filteredGroups = groups.filter((g) => {
    if (genderFilter !== "any" && g.gender_preference !== "any" && g.gender_preference !== genderFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      const haystack = `${g.title} ${g.description} ${g.activity_type}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  return (
    <div className="page-shell">
      <div className="container-wide">
        <NavBar />

        <div className="win" style={{ marginBottom: 14 }}>
          <div className="title-bar">
            <span>Filter Quests</span>
            <div className="title-bar-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="win-body">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div className="field" style={{ flex: "1 1 160px", marginBottom: 0 }}>
                <label htmlFor="genderFilter">Looking for</label>
                <select
                  id="genderFilter"
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                >
                  <option value="any">Any group</option>
                  <option value="male">Male-preferred groups</option>
                  <option value="female">Female-preferred groups</option>
                </select>
              </div>
              <div className="field" style={{ flex: "2 1 220px", marginBottom: 0 }}>
                <label htmlFor="search">Search</label>
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="movies, badminton, study group…"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="win">
          <div className="title-bar">
            <span>Open Quests</span>
            <div className="title-bar-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="win-body">
            {error && <div className="alert-error">{error}</div>}

            {loading && <p className="loading-blink">Loading quests…</p>}

            {!loading && filteredGroups.length === 0 && (
              <div className="empty-state">
                No quests match yet.
                <br />
                <Link href="/groups/new">Start one</Link> and find your crew.
              </div>
            )}

            {!loading && filteredGroups.length > 0 && (
              <div className="buddy-list">
                {filteredGroups.map((g) => {
                  const count = memberCounts[g.id] || 0;
                  const isFull = count >= g.spots_needed;
                  const alreadyIn = myMemberships.has(g.id);

                  return (
                    <div className="buddy-item" key={g.id}>
                      <div style={{ flex: 1 }}>
                        <div>
                          <span
                            className={`status-dot ${isFull ? "status-full" : "status-open"}`}
                          />
                          <Link href={`/groups/${g.id}`}>
                            <strong>{g.title}</strong>
                          </Link>
                        </div>
                        <p style={{ margin: "4px 0", fontSize: 12 }}>{g.description}</p>
                        <span className="tag">{g.activity_type}</span>
                        <span className="tag">
                          {count}/{g.spots_needed} joined
                        </span>
                        {g.gender_preference !== "any" && (
                          <span className="tag">prefers {g.gender_preference}</span>
                        )}
                      </div>
                      <div>
                        {alreadyIn ? (
                          <Link href={`/groups/${g.id}/chat`} className="btn">
                            Chat
                          </Link>
                        ) : (
                          <button
                            className="btn btn-primary"
                            disabled={isFull || joiningId === g.id}
                            onClick={() => handleJoin(g.id)}
                          >
                            {isFull ? "Full" : joiningId === g.id ? "Joining…" : "Join"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
