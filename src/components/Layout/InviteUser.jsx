// src/components/InviteUser.jsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { nanoid } from "nanoid";

/**
 * Props:
 * - companyId (string) // current company id
 * - companyName (string) // optional
 */

export default function InviteUser({ companyId, companyName }) {
  const { userDoc } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [error, setError] = useState("");

  const createInvite = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) return setError("Enter an email.");
    setLoading(true);
    try {
      const token = nanoid(12);
      const invitesRef = collection(db, "invites");
      const docRef = await addDoc(invitesRef, {
        email: email.toLowerCase(),
        role,
        companyId,
        companyName: companyName || null,
        invitedBy: userDoc?.id || null,
        token,
        createdAt: serverTimestamp(),
        expiresAt: null // set if you want expiry
      });

      // Create a simple invite link (adjust to your app domain)
      const link = `${window.location.origin}/onboarding?invite=${token}`;
      setInviteLink(link);
      setEmail("");
    } catch (err) {
      console.error(err);
      setError("Failed to create invite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h4 className="font-semibold mb-2">Invite teammate</h4>
      <form onSubmit={createInvite} className="flex gap-2 items-start">
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="rounded border px-3 py-2 w-72" />
        <select value={role} onChange={e => setRole(e.target.value)} className="rounded border px-2 py-2">
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
          <option value="admin">Admin</option>
        </select>
        <button disabled={loading} className="px-3 py-2 rounded bg-blue-600 text-white">{loading ? "..." : "Create"}</button>
      </form>
      {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      {inviteLink && (
        <div className="mt-3 bg-gray-50 p-2 rounded">
          <div className="text-sm">Invite link (copy & share):</div>
          <div className="mt-1 flex gap-2">
            <input readOnly value={inviteLink} className="flex-1 rounded border px-2 py-1 text-sm" />
            <button onClick={() => navigator.clipboard.writeText(inviteLink)} className="px-3 py-1 rounded bg-green-600 text-white text-sm">Copy</button>
          </div>
        </div>
      )}
    </div>
  );
}
