// src/pages/UserApprovalDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/firebase";
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaCheck, 
  FaTimes, 
  FaEnvelope, 
  FaUser, 
  FaClock,
  FaSearch,
  FaFilter,
  FaSync,
  FaExclamationTriangle
} from "react-icons/fa";
import { toast } from "react-toastify";

export default function UserApprovalDashboard() {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [approvingUser, setApprovingUser] = useState(null);
  const [rejectingUser, setRejectingUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user has owner privileges
    if (userProfile?.role !== "store_owner" && userProfile?.role !== "owner") {
      toast.error("Access denied. Owner privileges required.");
      return;
    }
    fetchUsers();
  }, [userProfile]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching users from Firestore...");
      
      const usersRef = collection(db, "Users");
      
      // Try different query approaches
      let querySnapshot;
      try {
        // First try: Get all users and filter client-side (more reliable)
        const q = query(usersRef, orderBy("createdAt", "desc"));
        querySnapshot = await getDocs(q);
      } catch (queryError) {
        console.warn("Index error, trying without orderBy:", queryError);
        // Fallback: Get all users without ordering
        querySnapshot = await getDocs(usersRef);
      }
      
      const usersList = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        console.log("User data:", userData);
        
        // Only include users with role "user" (non-owners)
        if (userData.role === "user") {
          usersList.push({
            id: doc.id,
            ...userData,
            // Ensure these fields exist with defaults
            approved: userData.approved || false,
            status: userData.status || "pending",
            firstName: userData.firstName || "Unknown",
            lastName: userData.lastName || "User",
            email: userData.email || "No email",
            createdAt: userData.createdAt || null
          });
        }
      });
      
      console.log(`Found ${usersList.length} users`);
      setUsers(usersList);
      
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error.message);
      toast.error("Failed to load users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      setApprovingUser(userId);
      
      const userDoc = doc(db, "Users", userId);
      await updateDoc(userDoc, {
        approved: true,
        approvedAt: new Date(),
        approvedBy: userProfile.uid,
        status: "approved"
      });
      
      toast.success("User approved successfully!");
      
      // Update local state immediately for better UX
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                approved: true, 
                status: "approved",
                approvedAt: new Date(),
                approvedBy: userProfile.uid
              }
            : user
        )
      );
      
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("Failed to approve user: " + error.message);
    } finally {
      setApprovingUser(null);
    }
  };

  const handleReject = async (userId) => {
    try {
      setRejectingUser(userId);
      
      const userDoc = doc(db, "Users", userId);
      await updateDoc(userDoc, {
        approved: false,
        rejectedAt: new Date(),
        rejectedBy: userProfile.uid,
        status: "rejected"
      });
      
      toast.success("User rejected successfully!");
      
      // Update local state immediately for better UX
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                approved: false, 
                status: "rejected",
                rejectedAt: new Date(),
                rejectedBy: userProfile.uid
              }
            : user
        )
      );
      
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast.error("Failed to reject user: " + error.message);
    } finally {
      setRejectingUser(null);
    }
  };

  const getStatusBadge = (user) => {
    if (user.status === "rejected") {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Rejected</span>;
    }
    if (user.approved) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Approved</span>;
    }
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    try {
      // Handle both Firestore Timestamp and Date objects
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString();
      } else if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      }
      return 'Invalid date';
    } catch (error) {
      console.warn("Date formatting error:", error);
      return 'Unknown';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === "all" ||
      (filterStatus === "pending" && !user.approved && user.status !== "rejected") ||
      (filterStatus === "approved" && user.approved) ||
      (filterStatus === "rejected" && user.status === "rejected");
    
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const stats = {
    total: users.length,
    pending: users.filter(u => !u.approved && u.status !== "rejected").length,
    approved: users.filter(u => u.approved).length,
    rejected: users.filter(u => u.status === "rejected").length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Users</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchUsers}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Approvals</h1>
              <p className="text-gray-600 mt-2">
                Manage user access and approvals for your platform
              </p>
            </div>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <FaSync className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaUser className="text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <FaClock className="text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <FaCheck className="text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <FaTimes className="text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border p-4 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Filter */}
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Users</option>
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        <FaUser className="mx-auto text-4xl text-gray-300 mb-3" />
                        <p>No users found</p>
                        {searchTerm || filterStatus !== "all" ? (
                          <p className="text-sm mt-1">Try adjusting your search or filters</p>
                        ) : (
                          <p className="text-sm mt-1">No users registered yet</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.role}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                          <div className="text-sm text-gray-500">{user.phone || 'No phone'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {!user.approved && user.status !== "rejected" ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleApprove(user.id)}
                                disabled={approvingUser === user.id}
                                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                              >
                                {approvingUser === user.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    Approving...
                                  </>
                                ) : (
                                  <>
                                    <FaCheck className="text-xs" />
                                    Approve
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(user.id)}
                                disabled={rejectingUser === user.id}
                                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                              >
                                {rejectingUser === user.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    Rejecting...
                                  </>
                                ) : (
                                  <>
                                    <FaTimes className="text-xs" />
                                    Reject
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Processed</span>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}