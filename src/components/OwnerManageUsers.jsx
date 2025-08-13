import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function OwnerManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyPending, setShowOnlyPending] = useState(true);
  const navigate = useNavigate();

  // Fetch all "user" role accounts
  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "Users"), where("role", "==", "user"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setUsers(list);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  // Toggle approval in Firestore
  const handleToggleApproval = async (userId, current) => {
    try {
      await updateDoc(doc(db, "Users", userId), { approved: !current });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, approved: !current } : u))
      );
    } catch (err) {
      console.error("Error updating approval:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Filtered view based on toggle
  const filteredUsers = showOnlyPending
    ? users.filter((user) => !user.approved) // false OR undefined
    : users;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600 animate-pulse">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-6 px-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Controls */}
      <main className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            {showOnlyPending ? "Pending Approval" : "All Users"}
          </h2>
          <button
            onClick={() => setShowOnlyPending((prev) => !prev)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            {showOnlyPending ? "Show All" : "Show Only Pending"}
          </button>
        </div>

        {/* User Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.length === 0 ? (
            <p className="text-gray-600 col-span-full text-center">
              No users found.
            </p>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-xl font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-gray-600 mt-1">{user.email}</p>
                  <p className="mt-2">
                    Status:{" "}
                    <span
                      className={`font-semibold ${
                        user.approved ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {user.approved ? "Approved" : "Pending"}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleToggleApproval(user.id, user.approved || false)
                  }
                  className={`mt-4 px-4 py-2 rounded-xl text-white font-medium transition 
                    ${
                      user.approved
                        ? "bg-yellow-500 hover:bg-yellow-600"
                        : "bg-green-500 hover:bg-green-600"
                    }`}
                >
                  {user.approved ? "Disapprove" : "Approve"}
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
