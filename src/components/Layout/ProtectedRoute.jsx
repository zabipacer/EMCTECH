// auth/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallbackPath = "/unauthorized" 
}) {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check approval for non-owner users
  if (userRole !== "owner" && userRole !== "store_owner" && !userProfile?.approved) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Account Pending Approval
          </h2>
          <p className="text-gray-600">
            Your account is waiting for admin approval. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // If no specific role required, allow access
  if (!requiredRole) return children;

  // Check if user has required role
  if (userRole !== requiredRole) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}