// ProductSelectionModal.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaPlus, FaSpinner, FaShoppingCart } from 'react-icons/fa';

const ProductSelectionModal = ({
  open,
  onClose,
  products = [],
  onAddProduct,
  searchTerm,
  onSearchChange,
  quantityInputs,
  onQuantityChange,
  priceInputs,
  onPriceChange,
  discountInputs,
  onDiscountChange,
  taxToggle,
  onTaxToggle,
  isLoading,
  selectedProductsCount
}) => {
  if (!open) return null;

  // Debug products
  console.log('ProductSelectionModal - Products received:', products);
  console.log('ProductSelectionModal - Products count:', products.length);

  // Handle product search functionality
  const filteredProducts = products.filter(product => {
    const matches = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matches;
  });

  console.log('ProductSelectionModal - Filtered products:', filteredProducts);

  const handleProductSelect = (product) => {
    const quantity = quantityInputs[product.id] || 1;
    const unitPrice = priceInputs[product.id] || product.price || 0;
    const discount = discountInputs[product.id] || 0;
    const taxable = taxToggle[product.id] !== false;

    onAddProduct({
      ...product,
      quantity,
      unitPrice,
      discount,
      taxable
    });
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-screen overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Add debug info temporarily */}
        <div className="absolute top-2 left-2 bg-yellow-500 text-white p-2 rounded text-xs z-70">
          Debug: {products.length} total, {filteredProducts.length} filtered
        </div>
        
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">Select Products</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition duration-200 p-2">
            <FaSearch size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {isLoading ? (
            <div className="text-center text-gray-500 py-8">
              <FaSpinner className="animate-spin mx-auto mb-2 text-2xl" />
              <span>Loading products...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {searchTerm ? (
                <>
                  <FaSearch className="mx-auto mb-2 text-2xl" />
                  <p>No products found for "{searchTerm}"</p>
                  <p className="text-sm">Try a different search term</p>
                </>
              ) : products.length === 0 ? (
                <>
                  <FaShoppingCart className="mx-auto mb-2 text-2xl" />
                  <p>No products available in database</p>
                  <p className="text-sm">Check Firebase console for products</p>
                  <div className="mt-2 p-2 bg-red-100 text-red-800 rounded text-xs">
                    Products in DB: {products.length}
                  </div>
                </>
              ) : (
                <>
                  <FaSearch className="mx-auto mb-2 text-2xl" />
                  <p>No products match your current filters</p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3 text-sm font-medium text-gray-600">Product</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-600">Category</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-600">Unit Price</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-600">Qty</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-600">Discount</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-600">Tax</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-gray-100">
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          ID: {product.id} | Category: {product.category} | Price: ${product.price}
                        </div>
                      </td>
                      <td className="p-3">{product.category}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={priceInputs[product.id] || product.price}
                          onChange={(e) => onPriceChange(product.id, parseFloat(e.target.value))}
                          className="w-24 px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={quantityInputs[product.id] || 1}
                          onChange={(e) => onQuantityChange(product.id, parseInt(e.target.value) || 1)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={discountInputs[product.id] || 0}
                          onChange={(e) => onDiscountChange(product.id, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      </td>
                      <td className="p-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={taxToggle[product.id] !== false}
                            onChange={() => onTaxToggle(product.id)}
                            className="mr-2"
                          />
                          Taxable
                        </label>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleProductSelect(product)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center"
                        >
                          <FaPlus className="mr-2" /> Add
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProductSelectionModal;