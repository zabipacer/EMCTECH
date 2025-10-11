import React from "react";
import { FaSearch, FaTimes, FaThLarge, FaList } from "react-icons/fa";
import { STATUS_OPTIONS } from './constants';

const Filters = ({ 
  filters, 
  companies, 
  categories, 
  viewMode, 
  onFilterChange, 
  onResetFilters, 
  onViewModeChange,
  hasActiveFilters 
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search products, SKU, category..." 
              value={filters.search}
              onChange={(e) => onFilterChange("search", e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select 
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.company}
              onChange={(e) => onFilterChange("company", e.target.value)}
            >
              <option value="all">All Companies</option>
              {companies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select 
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.category}
              onChange={(e) => onFilterChange("category", e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select 
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.status}
              onChange={(e) => onFilterChange("status", e.target.value)}
            >
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>

            <select 
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.stock}
              onChange={(e) => onFilterChange("stock", e.target.value)}
            >
              <option value="all">All Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 inline-flex items-center gap-1"
              >
                <FaTimes /> Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <select 
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.sortBy}
            onChange={(e) => onFilterChange("sortBy", e.target.value)}
          >
            <option value="updatedAt-desc">Last Updated</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="price-asc">Price Low-High</option>
            <option value="price-desc">Price High-Low</option>
            <option value="stock-asc">Stock Low-High</option>
            <option value="stock-desc">Stock High-Low</option>
          </select>

          {/* View Toggle */}
          <div className="border border-gray-300 rounded-lg overflow-hidden flex">
            <button 
              className={`px-3 py-2 transition-colors ${viewMode === "grid" ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-50"}`} 
              onClick={() => onViewModeChange("grid")}
              aria-label="Grid view"
            >
              <FaThLarge />
            </button>
            <button 
              className={`px-3 py-2 transition-colors ${viewMode === "table" ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-50"}`} 
              onClick={() => onViewModeChange("table")}
              aria-label="Table view"
            >
              <FaList />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filters;