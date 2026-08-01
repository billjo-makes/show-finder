import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function ProtectedRoute({
  children,
  requireProfile = true,
}: {
  children: ReactNode;
  requireProfile?: boolean;
}) {
  const { user, activeProfile, isLoading } = useAuth();

  if (isLoading) return <p className="page-loading">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireProfile && !activeProfile) return <Navigate to="/profiles/select" replace />;
  return <>{children}</>;
}
