import React from "react";
import { motion } from "framer-motion";

export const Stats = ({ stats }) => {
  const statItems = [
    { label: "Total Proposals", value: stats.total, color: "border-blue-500" },
    { label: "Draft", value: stats.draft, color: "border-yellow-400" },
    { label: "Sent", value: stats.sent, color: "border-blue-500" },
    { label: "Accepted", value: stats.accepted, color: "border-green-500" },
    { label: "Total Value", value: `$${stats.totalValue.toLocaleString()}`, color: "border-purple-500" }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {statItems.map((stat, index) => (
        <motion.div 
          key={stat.label}
          className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${stat.color}`}
        >
          <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
          <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
};