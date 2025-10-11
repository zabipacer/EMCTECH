import React from "react";
import { motion } from "framer-motion";
import { FaImage, FaEdit, FaCopy, FaTrash } from "react-icons/fa";
import { Badge } from './Uicomponens';
import { STATUS_OPTIONS } from './constants';
import { formatCurrency, formatDate } from './Storageutils';

const ProductTableRow = React.memo(({ product, selected, onSelect, onEdit, onDuplicate, onDelete }) => {
  const isLowStock = typeof product.lowStockThreshold === "number" && product.stock <= product.lowStockThreshold;
  const isOutOfStock = product.stock <= 0;
  const statusConfig = STATUS_OPTIONS.find(s => s.value === product.status) || STATUS_OPTIONS[1];
  
  return (
    <motion.tr 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`border-b border-gray-200 hover:bg-gray-50 ${
        selected ? 'bg-blue-50' : ''
      }`}
    >
      <td className="p-4">
        <input 
          type="checkbox" 
          checked={selected} 
          onChange={onSelect}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
        />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
            {product.thumbnail ? (
              <img 
                src={product.thumbnail} 
                alt={product.name?.EN} 
                className="object-cover w-full h-full" 
              />
            ) : (
              <FaImage className="text-gray-300" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 truncate" title={product.name?.EN}>
              {product.name?.EN || "Untitled Product"}
            </div>
            <div className="text-sm text-gray-500 truncate">{product.category}</div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <code className="text-sm font-mono text-gray-600">{product.sku}</code>
      </td>
      <td className="p-4 font-semibold text-gray-900">{formatCurrency(product.price)}</td>
      <td className="p-4">
        <div className={`font-semibold ${
          isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-gray-900'
        }`}>
          {product.stock}
        </div>
      </td>
      <td className="p-4">
        <Badge color={statusConfig.color} className="capitalize">
          {statusConfig.label}
        </Badge>
      </td>
      <td className="p-4 text-sm text-gray-500">
        {formatDate(product.updatedAt)}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded transition-colors"
            title="Edit"
          >
            <FaEdit size={14} />
          </button>
          <button 
            onClick={onDuplicate}
            className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded transition-colors"
            title="Duplicate"
          >
            <FaCopy size={14} />
          </button>
          <button 
            onClick={onDelete}
            className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <FaTrash size={14} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
});

export default ProductTableRow;