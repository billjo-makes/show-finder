import type { AuthUser } from "@show-finder/shared";
import { apiFetch } from "./client";

export function register(email: string, password: string) {
  return apiFetch<{ user: AuthUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return apiFetch<{ user: AuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return apiFetch<void>("/api/auth/logout", { method: "POST" });
}

export function fetchMe() {
  return apiFetch<{ user: AuthUser }>("/api/auth/me");
}
