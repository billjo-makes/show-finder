import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { createProfile } from "../api/profiles";
import { ApiError } from "../api/client";

export function ProfilePickerPage() {
  const { profiles, switchProfile, refreshProfiles } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSelect(profileId: string) {
    await switchProfile(profileId);
    navigate("/");
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { profile } = await createProfile({ name });
      await refreshProfiles();
      await switchProfile(profile.id);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page profile-picker">
      <h1>Who's watching?</h1>
      <div className="profile-grid">
        {profiles.map((profile) => (
          <button key={profile.id} className="profile-tile" onClick={() => handleSelect(profile.id)}>
            <span className="profile-avatar" style={{ backgroundColor: profile.avatarColor ?? undefined }}>
              {profile.name.charAt(0).toUpperCase()}
            </span>
            {profile.name}
          </button>
        ))}

        {isCreating ? (
          <form className="profile-tile profile-tile-form" onSubmit={handleCreate}>
            <input
              autoFocus
              placeholder="Profile name"
              value={name}
              maxLength={50}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding…" : "Add"}
            </button>
          </form>
        ) : (
          <button className="profile-tile profile-tile-add" onClick={() => setIsCreating(true)}>
            + Add Profile
          </button>
        )}
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
