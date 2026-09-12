"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import NavBar from "@/components/NavBar";

export default function NewGroupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [activityType, setActivityType] = useState("movies");
  const [description, setDescription] = useState("");
  const [spotsNeeded, setSpotsNeeded] = useState(1);
  const [genderPreference, setGenderPreference] = useState("any");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Give your quest a title.");
      return;
    }
    if (!description.trim()) {
      setError("Add a short description so people know what this is.");
      return;
    }
    if (spotsNeeded < 1) {
      setError("You need at least 1 spot.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      router.push("/login");
      return;
    }

    const { data: group, error: insertError } = await supabase
      .from("groups")
      .insert({
        creator_id: user.id,
        title: title.trim(),
        activity_type: activityType,
        description: description.trim(),
        spots_needed: Number(spotsNeeded),
        gender_preference: genderPreference,
      })
      .select()
      .single();

    if (insertError) {
      setSaving(false);
      setError(insertError.message);
      return;
    }

    // Creator automatically joins their own quest.
    const { error: joinError } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: user.id });

    setSaving(false);

    if (joinError) {
      setError(joinError.message);
      return;
    }

    router.push("/groups");
    router.refresh();
  }

  return (
    <div className="page-shell">
      <div className="container-narrow">
        <NavBar />
        <div className="win">
          <div className="title-bar">
            <span>New Quest</span>
            <div className="title-bar-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="win-body">
            {error && <div className="alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Need 1 more for movie night!"
                />
              </div>

              <div className="field">
                <label htmlFor="activityType">Activity type</label>
                <select
                  id="activityType"
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                >
                  <option value="movies">Movies</option>
                  <option value="study">Study group</option>
                  <option value="sports">Sports</option>
                  <option value="food">Food / hangout</option>
                  <option value="gaming">Gaming</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="We're 4 people going to watch a movie Friday at Phoenix Mall, need 1 more…"
                />
              </div>

              <div className="field">
                <label htmlFor="spots">Spots needed</label>
                <input
                  id="spots"
                  type="text"
                  inputMode="numeric"
                  value={spotsNeeded}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setSpotsNeeded(val === "" ? "" : Number(val));
                  }}
                />
              </div>

              <div className="field">
                <label htmlFor="genderPreference">Preferred to join</label>
                <select
                  id="genderPreference"
                  value={genderPreference}
                  onChange={(e) => setGenderPreference(e.target.value)}
                >
                  <option value="any">No preference</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Posting…" : "Post Quest"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
