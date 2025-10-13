import React from "react";
import { FaClock, FaPaperPlane, FaCheck, FaExclamationTriangle } from "react-icons/fa";
import { statusConfig } from "./Constants";

const iconMap = {
  FaClock,
  FaPaperPlane,
  FaCheck,
  FaExclamationTriangle
};

export const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = iconMap[config.icon];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      <Icon className="mr-1" size={12} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};