// CaseDetailsModal.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiFolder, FiX, FiUserPlus, FiActivity, 
  FiDollarSign, FiUsers, FiFileText, FiFile, 
  FiTarget, FiMapPin, FiClock, FiCalendar, 
  FiCheckCircle, FiCircle 
} from "react-icons/fi";
import { getPriorityColor, getStatusColor } from "./Utils";

export default function CaseDetailsModal({ 
  detailsPopupOpen, 
  setDetailsPopupOpen, 
  selectedCase, 
  handleOpenAssignPopup 
}) {
  if (!selectedCase) return null;
  
  const getAssignedUsersCount = (caseItem) => {
    return caseItem.assignedTo?.length || 0;
  };

  return (
    <AnimatePresence>
      {detailsPopupOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setDetailsPopupOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <FiFolder className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedCase.caseTitle}</h2>
                    <p className="text-blue-100 text-sm">Detailed Case Information</p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailsPopupOpen(false)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
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
                    <FiUsers className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-purple-700">Assigned To</p>
                      <p className="text-2xl font-bold text-purple-900">{getAssignedUsersCount(selectedCase)}</p>
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

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Case Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <FiFile className="h-5 w-5 text-gray-400 mt-0.5" />
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

                    <div className="flex items-center space-x-3">
                      <FiClock className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Billable Hours</p>
                        <p className="text-gray-600 text-sm">{selectedCase.billableHours || 0} hours</p>
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

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => {
                  setDetailsPopupOpen(false);
                  handleOpenAssignPopup(selectedCase);
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
              >
                <FiUserPlus className="h-4 w-4" />
                <span>Assign Case</span>
              </button>
              <button
                onClick={() => setDetailsPopupOpen(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}