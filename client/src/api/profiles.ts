import type { ProfileDTO } from "@show-finder/shared";
import { apiFetch } from "./client";

export interface ProfileInput {
  name: string;
  avatarColor?: string | null;
  defaultWatchProviderIds?: number[];
}

export function listProfiles() {
  return apiFetch<{ profiles: ProfileDTO[] }>("/api/profiles");
}

export function createProfile(input: ProfileInput) {
  return apiFetch<{ profile: ProfileDTO }>("/api/profiles", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProfile(id: string, input: Partial<ProfileInput>) {
  return apiFetch<{ profile: ProfileDTO }>(`/api/profiles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteProfile(id: string) {
  return apiFetch<void>(`/api/profiles/${id}`, { method: "DELETE" });
}

export function selectProfile(id: string) {
  return apiFetch<{ activeProfile: ProfileDTO }>(`/api/profiles/${id}/select`, {
    method: "POST",
  });
}
