// src/pages/UserDashboard.jsx
import React from "react";
import { useAuth } from "../contexts/AuthContext";

export default function UserDashboard() {
  const { userProfile } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Dashboard</h1>
      <p>Welcome, {userProfile?.firstName}!</p>
      <p>This is your user dashboard.</p>
    </div>
  );
}