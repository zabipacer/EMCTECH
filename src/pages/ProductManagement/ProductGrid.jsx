import React from "react";
import { FaImage, FaPlus } from "react-icons/fa";
import ProductCard from './ProductCard';

const ProductsGrid = ({ 
  products, 
  loading, 
  selectedIds, 
  onToggleSelect, 
  onEdit, 
  onDuplicate, 
  onDelete,
  hasActiveFilters,
  onResetFilters,
  onAddProduct 
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 animate-pulse h-64">
            <div className="flex gap-3 mb-4">
              <div className="w-4 h-4 bg-gray-200 rounded mt-1"></div>
              <div className="w-24 h-24 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="col-span-full bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
        <FaImage className="text-gray-300 text-4xl mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-500 mb-4">
          {hasActiveFilters 
            ? "Try adjusting your filters or search terms" 
            : "Get started by adding your first product"
          }
        </p>
        {hasActiveFilters ? (
          <button 
            onClick={onResetFilters}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Clear Filters
          </button>
        ) : (
          <button 
            onClick={onAddProduct}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <FaPlus /> Add Product
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          selected={selectedIds.has(product.id)}
          onSelect={() => onToggleSelect(product.id)}
          onEdit={() => onEdit(product)}
          onDuplicate={() => onDuplicate(product)}
          onDelete={() => onDelete(product)}
        />
      ))}
    </div>
  );
};

export default ProductsGrid;