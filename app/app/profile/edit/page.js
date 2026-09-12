"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import NavBar from "@/components/NavBar";

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [contact, setContact] = useState("");
  const [gender, setGender] = useState("unspecified");
  const [interests, setInterests] = useState("");
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setName(profile.name || "");
        setBio(profile.bio || "");
        setContact(profile.contact || "");
        setGender(profile.gender || "unspecified");
        setInterests((profile.interests || []).join(", "));
        setPhotoUrl(profile.photo_url || null);
      }
      setInitialLoading(false);
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);

    if (!name.trim()) {
      setError("Your name can't be empty.");
      return;
    }
    if (!bio.trim()) {
      setError("Write a short bio so others know who you are.");
      return;
    }

    setSaving(true);

    let finalPhotoUrl = photoUrl;

    if (photoFile) {
      const fileExt = photoFile.name.split(".").pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, photoFile, { upsert: true });

      if (uploadError) {
        setSaving(false);
        setError(`Photo upload failed: ${uploadError.message}`);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      finalPhotoUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
    }

    const interestsArray = interests
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: userId,
      name: name.trim(),
      bio: bio.trim(),
      contact: contact.trim(),
      gender,
      interests: interestsArray,
      photo_url: finalPhotoUrl,
    });

    setSaving(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    setPhotoUrl(finalPhotoUrl);
    setSaved(true);
  }

  if (initialLoading) {
    return (
      <div className="page-shell">
        <div className="container-narrow">
          <p className="loading-blink">Loading profile…</p>
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
            <span>My Profile</span>
            <div className="title-bar-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="win-body">
            {error && <div className="alert-error">{error}</div>}
            {saved && !error && (
              <div
                className="alert-error"
                style={{
                  background: "#e0ffe0",
                  borderColor: "var(--online-green)",
                  color: "#0a5c0a",
                }}
              >
                Profile saved.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={`${name || "Your"} profile photo`}
                  className="pixel-avatar"
                  style={{ width: 72, height: 72, marginBottom: 12 }}
                />
              )}

              <div className="field">
                <label htmlFor="photo">Profile photo</label>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="field">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people a bit about yourself…"
                />
              </div>

              <div className="field">
                <label htmlFor="contact">Contact details</label>
                <input
                  id="contact"
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Instagram handle, phone, etc."
                />
              </div>

              <div className="field">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="unspecified">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="interests">Interests (comma separated)</label>
                <input
                  id="interests"
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="movies, badminton, anime, hiking"
                />
              </div>

              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save Profile"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
