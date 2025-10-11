// src/pages/DashboardRouter.jsx
import React from "react";
import { useAuth } from "../contexts/AuthContext";
import OwnerDashboard from "./OwnerDashboard";
import UserDashboard from "./UserDashboard";

export default function DashboardRouter() {
  const { userProfile } = useAuth();
  
  if (!userProfile) {
    return <div>Please log in</div>;
  }

  // Route to appropriate dashboard based on role
  if (userProfile.role === "store_owner" || userProfile.role === "owner") {
    return <OwnerDashboard />;
  } else if (userProfile.role === "user" && userProfile.approved) {
    return <UserDashboard />;
  } else {
    // This should not happen due to our redirect logic, but as fallback
    return (
      <div className="p-6">
        <h1>Access Denied</h1>
        <p>Your account is pending approval.</p>
      </div>
    );
  }
}