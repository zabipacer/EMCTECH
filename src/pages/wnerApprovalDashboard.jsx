import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";

function OwnerApprovalDashboard() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [processingIds, setProcessingIds] = useState(new Set());

  useEffect(() => {
    // Real-time listener for pending users
    const pendingQuery = query(
      collection(db, "Users"),
      where("approved", "==", false),
      where("role", "==", "user")
    );

    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingUsers(users);
      setLoading(false);
    });

    // Real-time listener for approved users
    const approvedQuery = query(
      collection(db, "Users"),
      where("approved", "==", true),
      where("role", "==", "user")
    );

    const unsubscribeApproved = onSnapshot(approvedQuery, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setApprovedUsers(users);
    });

    return () => {
      unsubscribePending();
      unsubscribeApproved();
    };
  }, []);

  const handleApprove = async (userId, userName) => {
    setProcessingIds(prev => new Set(prev).add(userId));
    try {
      await updateDoc(doc(db, "Users", userId), {
        approved: true,
        approvedAt: new Date().toISOString()
      });
      toast.success(`${userName} has been approved!`, {
        position: "top-center"
      });
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("Failed to approve user", {
        position: "bottom-center"
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleDisapprove = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to disapprove ${userName}?`)) {
      return;
    }

    setProcessingIds(prev => new Set(prev).add(userId));
    try {
      await updateDoc(doc(db, "Users", userId), {
        approved: false,
        disapprovedAt: new Date().toISOString()
      });
      toast.info(`${userName} has been disapproved`, {
        position: "top-center"
      });
    } catch (error) {
      console.error("Error disapproving user:", error);
      toast.error("Failed to disapprove user", {
        position: "bottom-center"
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const UserCard = ({ user, showApproveButton, showDisapproveButton }) => {
    const isProcessing = processingIds.has(user.id);
    const fullName = `${user.firstName} ${user.lastName}`;

    return (
      <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">{fullName}</h3>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
          </div>
          {user.approved && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
              </svg>
              Approved
            </span>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Role:</span>
            <span className="text-white font-medium capitalize">{user.role}</span>
          </div>
          {user.createdAt && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Registered:</span>
              <span className="text-white font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
          {user.approvedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Approved:</span>
              <span className="text-white font-medium">
                {new Date(user.approvedAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {showApproveButton && (
            <button
              onClick={() => handleApprove(user.id, fullName)}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isProcessing ? (
                <svg className="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg className="inline-block w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Approve
                </>
              )}
            </button>
          )}
          {showDisapproveButton && (
            <button
              onClick={() => handleDisapprove(user.id, fullName)}
              disabled={isProcessing}
              className="flex-1 bg-gray-600/50 hover:bg-red-600 text-white font-semibold py-2.5 px-4 rounded-lg border border-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <svg className="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg className="inline-block w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  Revoke
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-300">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">User Management</h1>
          <p className="text-gray-400">Approve or manage user access</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-400">{pendingUsers.length}</p>
              </div>
              <div className="w-14 h-14 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Approved Users</p>
                <p className="text-3xl font-bold text-green-400">{approvedUsers.length}</p>
              </div>
              <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Users</p>
                <p className="text-3xl font-bold text-blue-400">
                  {pendingUsers.length + approvedUsers.length}
                </p>
              </div>
              <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
          <div className="flex border-b border-gray-700/50">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors duration-200 ${
                activeTab === "pending"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/30"
              }`}
            >
              <span className="flex items-center justify-center">
                Pending Approval
                {pendingUsers.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-500 text-white rounded-full">
                    {pendingUsers.length}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors duration-200 ${
                activeTab === "approved"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/30"
              }`}
            >
              Approved Users
            </button>
          </div>

          <div className="p-6">
            {activeTab === "pending" && (
              <div>
                {pendingUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No Pending Approvals</h3>
                    <p className="text-gray-500">All users have been reviewed</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingUsers.map(user => (
                      <UserCard
                        key={user.id}
                        user={user}
                        showApproveButton={true}
                        showDisapproveButton={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "approved" && (
              <div>
                {approvedUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No Approved Users</h3>
                    <p className="text-gray-500">Approved users will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {approvedUsers.map(user => (
                      <UserCard
                        key={user.id}
                        user={user}
                        showApproveButton={false}
                        showDisapproveButton={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerApprovalDashboard;