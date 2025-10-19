// components/ProductSelectionModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaSearch, FaTimes, FaImage } from 'react-icons/fa';

const ProductSelectionModal = ({
  open,
  onClose,
  products = [],
  searchTerm,
  onSearchChange,
  quantityInputs = {},
  onQuantityChange,
  priceInputs = {},
  onPriceChange,
  discountInputs = {},
  onDiscountChange,
  taxToggle = {},
  onTaxToggle,
  onAddProduct,
  isLoading = false,
  selectedProductsCount = 0
}) => {
  if (!open) return null;

  // DEBUG: remove or comment out after verifying
  // console.log('ProductSelectionModal props:', { productsLength: products.length, searchTerm, isLoading });

  // Insert near top of component (before rendering) to compute filtered list defensively
  const normalizeProductName = (product) => {
    const n = product?.name;
    if (!n) return "";
    if (typeof n === "string") return n;
    if (typeof n === "object") {
      return n.EN || n.en || Object.values(n)[0] || "";
    }
    return String(n);
  };

  const normalizedSearch = (searchTerm || "").toString().trim().toLowerCase();

  const displayedProducts = (products || []).filter(product => {
    if (!normalizedSearch) return true;
    const name = normalizeProductName(product).toString().toLowerCase();
    const category = (product?.category || "").toString().toLowerCase();
    const desc = (product?.description || "").toString().toLowerCase();
    return name.includes(normalizedSearch) || category.includes(normalizedSearch) || desc.includes(normalizedSearch);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Add Products to Proposal</h3>
            <p className="text-gray-600 mt-1">
              {selectedProductsCount} product(s) selected • {displayedProducts.length} available
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200 p-2"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name, category, or description..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-3">Loading products...</p>
              </div>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FaSearch className="text-4xl mx-auto mb-3 text-gray-300" />
              <p>No products found matching your search.</p>
              <p className="text-sm mt-1">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {displayedProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow duration-200"
                  >
                    {/* Product Image */}
                    <div className="mb-4">
                      {product.imageUrl || product.thumbnail ? (
                        <img
                          src={product.imageUrl || product.thumbnail}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center ${(product.imageUrl || product.thumbnail) ? 'hidden' : 'flex'}`}
                      >
                        <FaImage className="text-3xl text-gray-400" />
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">{product.name}</h4>
                        <p className="text-sm text-gray-600">{product.category}</p>
                        {product.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-blue-600">
                          ${(product.price || 0).toFixed(2)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          product.stock > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                      </div>

                      {/* Input Controls */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Qty
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={quantityInputs[product.id] || 1}
                              onChange={(e) => onQuantityChange(product.id, parseInt(e.target.value) || 1)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Price
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={priceInputs[product.id] || product.price || ''}
                              onChange={(e) => onPriceChange(product.id, parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Discount %
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={discountInputs[product.id] || 0}
                              onChange={(e) => onDiscountChange(product.id, parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center text-xs">
                              <input
                                type="checkbox"
                                checked={taxToggle[product.id] !== false}
                                onChange={() => onTaxToggle(product.id)}
                                className="mr-1"
                              />
                              Taxable
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Add Button */}
                      <button
                        onClick={() => onAddProduct(product)}
                        disabled={product.stock <= 0}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center font-medium"
                      >
                        <FaPlus className="mr-2" />
                        Add to Proposal
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">
              {displayedProducts.length} products found
            </span>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductSelectionModal;