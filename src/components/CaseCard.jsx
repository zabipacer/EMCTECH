// CaseCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { 
  FiAlertCircle, FiUserPlus, FiEye, FiDollarSign, 
  FiClock, FiFileText, FiTarget 
} from "react-icons/fi";
import { 
  getPriorityColor, 
  getStatusColor, 
  getProgressColor 
} from "./Utils";

export default function CaseCard({ 
  caseItem, 
  handleOpenDetailsPopup, 
  handleOpenAssignPopup 
}) {
  const getAssignedUsersCount = (caseItem) => {
    return caseItem.assignedTo?.length || 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 group"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {caseItem.caseTitle || "Untitled Case"}
            </h3>
            <p className="text-gray-600 mt-1 text-sm line-clamp-2">
              {caseItem.caseDescription || "No description"}
            </p>
          </div>
          <FiAlertCircle className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(caseItem.priority)}`}>
            {caseItem.priority || 'Medium'}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(caseItem.status)}`}>
            {caseItem.status || 'Active'}
          </span>
          {getAssignedUsersCount(caseItem) > 0 && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
              {getAssignedUsersCount(caseItem)} assigned
            </span>
          )}
        </div>

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

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
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

        <div className="flex space-x-2">
          <button
            onClick={() => handleOpenDetailsPopup(caseItem)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <FiEye className="h-4 w-4" />
            <span>View Details</span>
          </button>
          <button
            onClick={() => handleOpenAssignPopup(caseItem)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <FiUserPlus className="h-4 w-4" />
            <span>Assign</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}