import React from "react";
import { FaImage } from "react-icons/fa";
import ProductTableRow from './ProductTableRow';

const ProductsTable = ({ 
  products, 
  loading, 
  selectedIds, 
  onToggleSelect, 
  onEdit, 
  onDuplicate, 
  onDelete,
  hasActiveFilters,
  onResetFilters,
  selectAllPage,
  onSelectAllPage 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-left w-12">
                <input 
                  type="checkbox" 
                  aria-label="Select all products on this page"
                  checked={selectAllPage} 
                  onChange={(e) => onSelectAllPage(e.target.checked)} 
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="p-4 text-left font-semibold text-gray-900">Product</th>
              <th className="p-4 text-left font-semibold text-gray-900">SKU</th>
              <th className="p-4 text-left font-semibold text-gray-900">Price</th>
              <th className="p-4 text-left font-semibold text-gray-900">Stock</th>
              <th className="p-4 text-left font-semibold text-gray-900">Status</th>
              <th className="p-4 text-left font-semibold text-gray-900">Updated</th>
              <th className="p-4 text-left font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              Array.from({ length: 9 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-4"><div className="w-4 h-4 bg-gray-200 rounded" /></td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                  <td className="p-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                  <td className="p-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                  <td className="p-4"><div className="h-6 bg-gray-200 rounded w-20"></div></td>
                  <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                  <td className="p-4"><div className="h-8 bg-gray-200 rounded w-24"></div></td>
                </tr>
              ))
            ) : products.length ? (
              products.map((product) => (
                <ProductTableRow
                  key={product.id}
                  product={product}
                  selected={selectedIds.has(product.id)}
                  onSelect={() => onToggleSelect(product.id)}
                  onEdit={() => onEdit(product)}
                  onDuplicate={() => onDuplicate(product)}
                  onDelete={() => onDelete(product)}
                />
              ))
            ) : (
              <tr>
                <td className="p-8 text-center" colSpan={8}>
                  <div className="text-gray-500 flex flex-col items-center">
                    <FaImage className="text-gray-300 text-3xl mb-2" />
                    <p>No products found</p>
                    {hasActiveFilters && (
                      <button 
                        onClick={onResetFilters}
                        className="text-blue-600 hover:text-blue-800 mt-2"
                      >
                        Clear filters to see all products
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductsTable;