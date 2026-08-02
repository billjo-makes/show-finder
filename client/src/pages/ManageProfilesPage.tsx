import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { createProfile, deleteProfile, updateProfile } from "../api/profiles";
import { ApiError } from "../api/client";

export function ManageProfilesPage() {
  const { profiles, activeProfile, refreshProfiles } = useAuth();
  const [newName, setNewName] = useState("");
  const [newIsUnder18, setNewIsUnder18] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createProfile({ name: newName, isUnder18: newIsUnder18 });
      setNewName("");
      setNewIsUnder18(false);
      await refreshProfiles();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleUnder18(id: string, isUnder18: boolean) {
    setError(null);
    try {
      await updateProfile(id, { isUnder18 });
      await refreshProfiles();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  async function handleSetPrimary(id: string) {
    setError(null);
    try {
      await updateProfile(id, { isPrimary: true });
      await refreshProfiles();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  async function handleRename(e: FormEvent, id: string) {
    e.preventDefault();
    setError(null);
    try {
      await updateProfile(id, { name: editingName });
      setEditingId(null);
      await refreshProfiles();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await deleteProfile(id);
      await refreshProfiles();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="page">
      <h1>Manage Profiles</h1>
      {error && <p className="form-error">{error}</p>}

      <ul className="profile-manage-list">
        {profiles.map((profile) => (
          <li key={profile.id} className="profile-manage-item">
            {editingId === profile.id ? (
              <form onSubmit={(e) => handleRename(e, profile.id)}>
                <input
                  autoFocus
                  value={editingName}
                  maxLength={50}
                  onChange={(e) => setEditingName(e.target.value)}
                  required
                />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <span>
                  {profile.name}
                  {profile.id === activeProfile?.id && " (active)"}
                  {profile.isPrimary && " (primary)"}
                </span>
                <label className="profile-under18-toggle">
                  <input
                    type="checkbox"
                    checked={profile.isUnder18}
                    onChange={(e) => handleToggleUnder18(profile.id, e.target.checked)}
                  />
                  Under 18
                </label>
                {!profile.isPrimary && (
                  <button onClick={() => handleSetPrimary(profile.id)}>Set as primary</button>
                )}
                <button
                  onClick={() => {
                    setEditingId(profile.id);
                    setEditingName(profile.name);
                  }}
                >
                  Rename
                </button>
                <button onClick={() => handleDelete(profile.id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>

      <form className="profile-create-form" onSubmit={handleCreate}>
        <input
          placeholder="New profile name"
          value={newName}
          maxLength={50}
          onChange={(e) => setNewName(e.target.value)}
          required
        />
        <label className="profile-under18-toggle">
          <input
            type="checkbox"
            checked={newIsUnder18}
            onChange={(e) => setNewIsUnder18(e.target.checked)}
          />
          Under 18
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding…" : "Add Profile"}
        </button>
      </form>
    </div>
  );
}
