import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export const Pagination = ({ 
  currentPage, 
  totalItems, 
  perPage, 
  onPageChange 
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  return (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-gray-600">
        Showing {startItem} - {endItem} of {totalItems} proposals
      </div>
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => onPageChange(Math.max(1, currentPage - 1))} 
          className="p-2 rounded border"
        >
          <FaChevronLeft />
        </button>
        <div className="px-3 py-1 border rounded">
          {currentPage} / {totalPages}
        </div>
        <button 
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} 
          className="p-2 rounded border"
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};