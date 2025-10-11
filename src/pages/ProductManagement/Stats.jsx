import React from "react";

const Stats = ({ stats }) => {
  const statConfigs = [
    { label: "Total Products", value: stats.total, color: "bg-blue-50 text-blue-700" },
    { label: "Published", value: stats.published, color: "bg-green-50 text-green-700" },
    { label: "Draft", value: stats.draft, color: "bg-gray-100 text-gray-700" },
    { label: "Low Stock", value: stats.lowStock, color: "bg-yellow-50 text-yellow-700" }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statConfigs.map((stat, index) => (
        <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</span>
          <span className={`text-2xl font-bold mt-1 block ${stat.color}`}>{stat.value}</span>
        </div>
      ))}
    </div>
  );
};

export default Stats;