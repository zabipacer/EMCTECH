import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  FaUser,
  FaSignOutAlt,
  FaEdit,
  FaCalendarAlt,
  FaShieldAlt,
  FaBriefcase,
  FaUsers
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { FiActivity, FiTrendingUp, FiStar } from "react-icons/fi";
import { auth, db } from "../firebase/firebase";

// Helper component for loading skeleton
const SkeletonLoader = ({ className }) => (
  <div className={`bg-gray-200 animate-pulse rounded-md ${className}`}></div>
);

const AssociateDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    completedCases: 0,
    clients: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [recentCases, setRecentCases] = useState([]);
  const [error, setError] = useState(null);

  const quickActions = [
    { icon: MdDashboard, title: "Go to Dashboard", path: "/insidedashboard", color: "from-blue-500 to-purple-500" },
    { icon: FaBriefcase, title: "My Cases", path: "/assignedcases", color: "from-green-500 to-emerald-500" },
    { icon: FaShieldAlt, title: "Documents", path: "/documents", color: "from-purple-500 to-indigo-500" }
  ];

  const user = auth.currentUser;

  // Format Firestore timestamps to readable dates
  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "N/A";
    }
  }, []);

  // Check user permissions
  const getUserPerms = useCallback((permissions = {}) => 
    user ? permissions[user.uid] || null : null
  , [user]);

  const canEditCase = useCallback((c) => 
    !!(getUserPerms(c.permissions)?.canEdit)
  , [getUserPerms]);

  useEffect(() => {
    if (!user) return;

    setLoadingStats(true);
    setError(null);
    
    const q = query(
      collection(db, "cases"), 
      where("assignedTo", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        try {
          let total = 0, active = 0, completed = 0;
          const clientSet = new Set();
          const cases = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data() || {};
            total++;
            
            if (data.status?.toLowerCase() === "completed") {
              completed++;
            } else {
              active++;
            }
            
            if (data.clientId) clientSet.add(data.clientId);
            
            cases.push({ 
              id: doc.id, 
              ...data,
              // Add formatted dates for display
              formattedCreatedAt: formatDate(data.createdAt),
              formattedUpdatedAt: formatDate(data.updatedAt)
            });
          });
          
          // Sort by last updated date (newest first)
          cases.sort((a, b) => 
            (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)
          );
          
          setStats({ 
            totalCases: total, 
            activeCases: active, 
            completedCases: completed, 
            clients: clientSet.size 
          });
          
          setRecentCases(cases.slice(0, 8));
          setLoadingStats(false);
        } catch (err) {
          console.error("Error processing cases:", err);
          setError("Failed to load case data");
          setLoadingStats(false);
        }
      },
      (err) => {
        console.error("Firestore error:", err);
        setError("Error connecting to database");
        setLoadingStats(false);
      }
    );
    
    return () => unsubscribe();
  }, [user, formatDate]);

  // Stat Card Component
  const StatCard = ({ icon: Icon, title, value, gradient }) => (
    <motion.div
      whileHover={{ y: -4 }}
      className={`p-6 rounded-2xl shadow-lg bg-gradient-to-br ${gradient} text-white backdrop-blur-md bg-opacity-80`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white bg-opacity-20 rounded-full">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <FiTrendingUp className="text-white opacity-80" />
      </div>
      <h3 className="text-3xl font-bold">
        {loadingStats ? <SkeletonLoader className="w-16 h-8" /> : value}
      </h3>
      <p className="opacity-90 text-sm">{title}</p>
    </motion.div>
  );

  // Quick Action Button
  const ActionButton = ({ action }) => (
    <Link to={action.path}>
      <motion.div 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center space-x-3 p-4 rounded-xl shadow-md text-white bg-gradient-to-r ${action.color} cursor-pointer transition-all`}
      >
        <action.icon className="w-5 h-5" />
        <span className="font-medium">{action.title}</span>
      </motion.div>
    </Link>
  );

  // Case Item Component
  const CaseItem = ({ c }) => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white shadow-sm rounded-lg p-4 border-l-4 border-blue-500 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-gray-800">
            {c.caseTitle || "Untitled Case"}
          </h4>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
            <span>Client: {c.clientId || "—"}</span>
            <span className={`px-2 py-0.5 rounded-full ${
              c.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {c.status || "—"}
            </span>
            <div className="flex items-center">
              <div className="w-16 h-1.5 bg-gray-200 rounded-full mr-2">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${c.progress ?? 0}%` }}
                ></div>
              </div>
              <span>{c.progress ?? "0"}%</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Last updated: {c.formattedUpdatedAt || c.formattedCreatedAt || "N/A"}
          </div>
        </div>
        <div className="flex space-x-2">
    
        
          
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-xl border-r border-gray-100 flex flex-col">
        <div className="p-6 flex items-center space-x-3 border-b border-gray-100">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <FaUser className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800 truncate max-w-[140px]">
              {user?.displayName || "Associate"}
            </h2>
            <p className="text-xs text-gray-500 truncate max-w-[140px]">
              {user?.email}
            </p>
          </div>
        </div>
        <div className="p-4 flex-1 space-y-2">
          {["overview", "activity"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === tab 
                  ? "bg-blue-100 text-blue-700" 
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              aria-label={`${tab} tab`}
            >
              {tab === "overview" && <MdDashboard aria-hidden="true" />}
              {tab === "activity" && <FiActivity aria-hidden="true" />}
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            aria-label="Logout"
          >
            <FaSignOutAlt aria-hidden="true" /> 
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                icon={FaBriefcase} 
                title="Total Cases" 
                value={stats.totalCases} 
                gradient="from-green-500 to-blue-500" 
              />
              <StatCard 
                icon={FiActivity} 
                title="Active Cases" 
                value={stats.activeCases} 
                gradient="from-blue-500 to-indigo-500" 
              />
              <StatCard 
                icon={FiStar} 
                title="Completed Cases" 
                value={stats.completedCases} 
                gradient="from-purple-500 to-pink-500" 
              />
              <StatCard 
                icon={FaUsers} 
                title="Clients" 
                value={stats.clients} 
                gradient="from-yellow-500 to-orange-500" 
              />
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="font-semibold mb-4 text-gray-700">Quick Actions</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <ActionButton key={index} action={action} />
                ))}
              </div>
            </div>

            {/* Recent Cases */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700">Recent Assigned Cases</h3>
                <Link 
                  to="/assignedcases" 
                  className="text-sm text-blue-600 hover:underline"
                >
                  View All
                </Link>
              </div>
              
              {loadingStats ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <SkeletonLoader key={i} className="w-full h-20" />
                  ))}
                </div>
              ) : recentCases.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg shadow-sm">
                  <p className="text-gray-500">No cases assigned yet</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {recentCases.map((caseItem) => (
                    <CaseItem key={caseItem.id} c={caseItem} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div>
            <h3 className="font-semibold mb-4 text-gray-700">Recent Activity</h3>
            
            {loadingStats ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <SkeletonLoader key={i} className="w-full h-16" />
                ))}
              </div>
            ) : recentCases.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg shadow-sm">
                <p className="text-gray-500">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCases.map((c) => (
                  <div 
                    key={c.id} 
                    className="bg-white p-3 rounded-lg shadow-sm flex items-center space-x-3 border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="p-2 bg-blue-100 rounded-full">
                      <FiActivity className="text-blue-600" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {c.caseTitle || "Untitled Case"}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                        <span className={`px-1.5 py-0.5 rounded ${
                          c.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {c.status || "—"}
                        </span>
                        <span>Updated: {c.formattedUpdatedAt || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaSignOutAlt className="w-8 h-8 text-red-600" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h3>
                <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => auth.signOut()}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssociateDashboard;