import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import {
  FiFolder,
  FiClock,
  FiUser,
  FiMapPin,
  FiFileText,
  FiCheckCircle,
  FiCircle,
  FiX,
  FiAlertCircle,
  FiTrendingUp,
  FiCalendar,
  FiDollarSign,
  FiTarget,
  FiActivity
} from "react-icons/fi";

export default function AssignedCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [userId, setUserId] = useState(null);

  // Track logged-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      }
    });
    return unsubscribe;
  }, []);

  // Fetch only assigned cases
  useEffect(() => {
    if (!userId) return;

    const fetchCases = async () => {
      try {
        const q = query(
          collection(db, "cases"),
          where("assignedTo", "array-contains", userId)
        );
        const querySnapshot = await getDocs(q);
        const casesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCases(casesData);
      } catch (error) {
        console.error("Error fetching cases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [userId]);

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'on hold':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Loading your cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FiFolder className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Cases Assigned to You</h1>
          </div>
          <p className="text-gray-600 ml-11">Manage and track your assigned legal cases</p>
        </div>

        {cases.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <FiFolder className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No cases assigned yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              You don't have any cases assigned to you at the moment. Check back later or contact your supervisor.
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cases.map((caseItem, index) => (
              <motion.div
                key={caseItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer group"
                onClick={() => setSelectedCase(caseItem)}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {caseItem.caseTitle}
                      </h3>
                      <p className="text-gray-600 mt-1 text-sm line-clamp-2">
                        {caseItem.caseDescription}
                      </p>
                    </div>
                    <FiAlertCircle className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(caseItem.priority)}`}>
                      {caseItem.priority || 'Medium'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(caseItem.status)}`}>
                      {caseItem.status || 'Active'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm font-medium text-gray-900">{caseItem.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(caseItem.progress || 0)}`}
                        style={{ width: `${caseItem.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <FiDollarSign className="h-4 w-4" />
                      <span>${caseItem.caseValue || '0'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <FiClock className="h-4 w-4" />
                      <span>{caseItem.billableHours || 0}h</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <FiFileText className="h-4 w-4" />
                      <span>{caseItem.documentsCount || 0} docs</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <FiTarget className="h-4 w-4" />
                      <span>{caseItem.totalTasks || 0} tasks</span>
                    </div>
                  </div>
                </div>

                {/* Hover indicator */}
                <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-100 group-hover:bg-blue-50 transition-colors">
                  <p className="text-xs text-gray-500 group-hover:text-blue-600">Click to view details</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Case Details Modal */}
        <AnimatePresence>
          {selectedCase && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedCase(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                        <FiFolder className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{selectedCase.caseTitle}</h2>
                        <p className="text-blue-100 text-sm">Case Details & Information</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCase(null)}
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                      <FiX className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                  {/* Overview Cards */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <FiActivity className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-700">Progress</p>
                          <p className="text-2xl font-bold text-blue-900">{selectedCase.progress || 0}%</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                      <div className="flex items-center space-x-3">
                        <FiDollarSign className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-700">Case Value</p>
                          <p className="text-2xl font-bold text-green-900">${selectedCase.caseValue || '0'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <FiClock className="h-8 w-8 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-purple-700">Billable Hours</p>
                          <p className="text-2xl font-bold text-purple-900">{selectedCase.billableHours || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                      <div className="flex items-center space-x-3">
                        <FiFileText className="h-8 w-8 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium text-orange-700">Documents</p>
                          <p className="text-2xl font-bold text-orange-900">{selectedCase.documentsCount || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Case Information */}
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Case Information</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <FiFileText className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">Description</p>
                            <p className="text-gray-600 text-sm">{selectedCase.caseDescription}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <FiTarget className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">Type</p>
                            <p className="text-gray-600 text-sm">{selectedCase.caseType}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <FiMapPin className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">Location</p>
                            <p className="text-gray-600 text-sm">{selectedCase.location}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Status & Priority</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">Priority</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(selectedCase.priority)}`}>
                            {selectedCase.priority || 'Medium'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">Status</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedCase.status)}`}>
                            {selectedCase.status || 'Active'}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <FiCalendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">Hearing Time</p>
                            <p className="text-gray-600 text-sm">{selectedCase.scheduleTime || 'Not scheduled'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tasks Section */}
                  {selectedCase.tasks && selectedCase.tasks.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <FiCheckCircle className="h-5 w-5 text-green-500" />
                        <span>Tasks ({selectedCase.tasks.length})</span>
                      </h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedCase.tasks.map((task, idx) => (
                          <div key={idx} className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200">
                            {task.completed ? (
                              <FiCheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                            ) : (
                              <FiCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            )}
                            <span className={`text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {task.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setSelectedCase(null)}
                      className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}