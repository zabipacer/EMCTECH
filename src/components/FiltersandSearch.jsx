// FiltersAndSearch.jsx
import React from "react";
import { FiFolder, FiFilter, FiSearch } from "react-icons/fi";

export default function FiltersAndSearch({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  filteredCases,
  cases
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="grid md:grid-cols-4 gap-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="on hold">On Hold</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        <div className="flex items-center justify-end space-x-2 text-sm text-gray-600">
          <FiFolder className="h-4 w-4" />
          <span>{filteredCases.length} of {cases.length} cases</span>
        </div>
      </div>
    </div>
  );
}