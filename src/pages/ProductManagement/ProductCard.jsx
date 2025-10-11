import React from "react";
import { motion } from "framer-motion";
import { FaImage, FaEdit, FaCopy, FaTrash } from "react-icons/fa";
import { Badge } from './Uicomponens';
import { STATUS_OPTIONS } from './constants';
import { formatCurrency } from './Storageutils';

const ProductCard = React.memo(({ product, selected, onSelect, onEdit, onDuplicate, onDelete }) => {
  const isLowStock = typeof product.lowStockThreshold === "number" && product.stock <= product.lowStockThreshold;
  const isOutOfStock = product.stock <= 0;
  const statusConfig = STATUS_OPTIONS.find(s => s.value === product.status) || STATUS_OPTIONS[1];
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 ${
        selected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
      } hover:shadow-md`}
    >
      <div className="p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <input 
              type="checkbox" 
              checked={selected} 
              onChange={onSelect}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate" title={product.name?.EN}>
                {product.name?.EN || "Untitled Product"}
              </h3>
              <p className="text-sm text-gray-500 truncate">{product.category || "Uncategorized"}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase tracking-wide">SKU</div>
            <div className="font-mono font-semibold text-sm">{product.sku}</div>
          </div>
        </div>

        {/* Thumbnail */}
        <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
          {product.thumbnail ? (
            <img 
              src={product.thumbnail} 
              alt={product.name?.EN} 
              className="object-cover w-full h-full" 
            />
          ) : (
            <FaImage className="text-gray-300 text-2xl" />
          )}
        </div>

        {/* Status & Stock */}
        <div className="flex items-center justify-between mb-3">
          <Badge color={statusConfig.color} className="capitalize">
            {statusConfig.label}
          </Badge>
          <div className="flex gap-1">
            {isOutOfStock && (
              <Badge color="bg-red-100 text-red-800">Out of Stock</Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge color="bg-yellow-100 text-yellow-800">Low Stock</Badge>
            )}
          </div>
        </div>

        {/* Price & Stock */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-gray-500">Price</div>
            <div className="font-bold text-gray-900">{formatCurrency(product.price)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Stock</div>
            <div className={`font-semibold ${
              isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-gray-900'
            }`}>
              {product.stock}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 truncate flex-1" title={product.company}>
            {product.company}
          </div>
          <div className="flex items-center gap-1">
            <button 
              title="Edit" 
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              onClick={onEdit}
            >
              <FaEdit size={14} />
            </button>
            <button 
              title="Duplicate" 
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              onClick={onDuplicate}
            >
              <FaCopy size={14} />
            </button>
            <button 
              title="Delete" 
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              onClick={onDelete}
            >
              <FaTrash size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default ProductCard;