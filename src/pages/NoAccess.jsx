// src/pages/NoAccess.jsx
import React from "react";
import { useAuth } from "../contexts/AuthContext";

export default function NoAccess() {
  const { userDoc } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow text-center max-w-md">
        <h3 className="text-xl font-semibold mb-2">You don't have access</h3>
        <p className="text-gray-600 mb-4">You don't have a role for any company yet. Ask an admin to invite you or create a new company.</p>
        <div className="text-sm text-gray-500">
          {userDoc?.email && <>Signed in as <strong>{userDoc.email}</strong></>}
        </div>
      </div>
    </div>
  );
}
