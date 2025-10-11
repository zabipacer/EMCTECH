// src/components/RoleGuard.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function RoleGuard({ role, children }) {
  const { userDoc, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!userDoc) return <Navigate to="/login" replace state={{ from: location }} />;

  // pick active company
  const preferred = userDoc.preferredCompanyId;
  const rolesMap = userDoc.roles || {};
  let activeCompanyId = preferred || null;
  if (!activeCompanyId) {
    const ids = Object.keys(rolesMap);
    if (ids.length === 1) activeCompanyId = ids[0];
  }

  if (!activeCompanyId) return <Navigate to="/onboarding" replace />;
  const assignedRole = rolesMap[activeCompanyId];
  if (!assignedRole) return <Navigate to="/no-access" replace />;

  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(assignedRole)) return <Navigate to="/" replace />;
  }

  return children;
}
