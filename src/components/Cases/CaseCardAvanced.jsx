import React from 'react';
import { motion } from 'framer-motion';
import {
  FiFileText,
  FiUser,
  FiClock,
  FiDollarSign,
  FiCalendar,
  FiAlertCircle,
  FiTrendingUp
} from 'react-icons/fi';

const CaseCardAdvanced = ({ caseItem }) => {
  return (
    <motion.div
      layout
      className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow"
      whileHover={{ y: -5 }}
    >
      <div className="p-5">
        {/* Card Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <FiFileText className="text-blue-600 text-lg" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 truncate max-w-[160px]">
                  {caseItem.caseTitle}
                </h3>
                <div className="flex items-center mt-1">
                  <FiUser className="text-slate-400 mr-1 text-sm" />
                  <span className="text-slate-500 text-sm truncate max-w-[140px]">
                    {caseItem.clientName}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <PriorityBadge priority={caseItem.priority} />
        </div>

        {/* Case Type & Status */}
        <div className="mt-4 flex justify-between items-center">
          <div className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium">
            {caseItem.caseType}
          </div>
          <StatusBadge status={caseItem.status} />
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-slate-500 mb-1">
            <span>Progress</span>
            <span>{caseItem.progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <motion.div 
              className="h-full bg-blue-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${caseItem.progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center text-slate-500">
              <FiDollarSign className="mr-1" />
              <span className="text-xs">Value</span>
            </div>
            <div className="font-medium mt-1 truncate">
              {caseItem.caseValue || 'N/A'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center text-slate-500">
              <FiClock className="mr-1" />
              <span className="text-xs">Hours</span>
            </div>
            <div className="font-medium mt-1">
              {caseItem.billableHours || '0'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center text-slate-500">
              <FiCalendar className="mr-1" />
              <span className="text-xs">Updated</span>
            </div>
            <div className="font-medium mt-1 text-sm">
              {new Date(caseItem.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Hover Indicator */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center text-blue-600 text-sm font-medium">
            <span>View Details</span>
            <FiTrendingUp className="ml-2" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Badge Components
const PriorityBadge = ({ priority }) => {
  let bgColor, textColor, icon;
  
  switch (priority) {
    case 'Urgent':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      icon = <FiAlertCircle className="mr-1" />;
      break;
    case 'High Priority':
      bgColor = 'bg-orange-100';
      textColor = 'text-orange-800';
      icon = <FiAlertCircle className="mr-1" />;
      break;
    case 'Medium Priority':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      icon = <FiAlertCircle className="mr-1" />;
      break;
    case 'Low Priority':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      icon = null;
      break;
    default:
      bgColor = 'bg-slate-100';
      textColor = 'text-slate-800';
      icon = null;
  }
  
  return (
    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${bgColor} ${textColor}`}>
      {icon}
      {priority}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  let bgColor, textColor;
  
  switch (status) {
    case 'Open':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      break;
    case 'Closed':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      break;
    case 'Pending':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      break;
    case 'In Review':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      break;
    default:
      bgColor = 'bg-slate-100';
      textColor = 'text-slate-800';
  }
  
  return (
    <div className={`px-3 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {status}
    </div>
  );
};

export default CaseCardAdvanced;