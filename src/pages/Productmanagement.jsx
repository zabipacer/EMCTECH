import React, { useState, useEffect } from "react";
import { FaEdit, FaTrashAlt, FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const ProductManagement = () => {
  // State management
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ name: "", price: "", category: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Categories for dropdown
  const categories = ["Tiles", "Furniture", "Bathroom", "Kitchen", "Lighting", "Decor"];

  // Initialize with sample data (simulating API call)
  useEffect(() => {
    // Simulate API call delay
    setTimeout(() => {
      setProducts([
        { id: 1, name: "Ceramic Tile X", price: 12000, category: "Tiles" },
        { id: 2, name: "Wooden Table", price: 15000, category: "Furniture" },
        { id: 3, name: "Modern LED Lamp", price: 8500, category: "Lighting" },
        { id: 4, name: "Marble Countertop", price: 25000, category: "Kitchen" },
      ]);
      setIsLoading(false);
    }, 800);
  }, []);

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }
    
    if (!formData.price || isNaN(formData.price) || formData.price <= 0) {
      newErrors.price = "Valid price is required";
    }
    
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Reset form and modal state
  const resetForm = () => {
    setFormData({ name: "", price: "", category: "" });
    setEditingProduct(null);
    setErrors({});
  };

  // Open modal for adding new product
  const handleAddProduct = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open modal for editing existing product
  const handleEditProduct = (product) => {
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category
    });
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  // Handle form submission (add or update)
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (editingProduct) {
      // Update existing product
      setProducts(prev => prev.map(product =>
        product.id === editingProduct.id
          ? { ...product, ...formData }
          : product
      ));
    } else {
      // Add new product
      const newProduct = {
        id: Math.max(0, ...products.map(p => p.id)) + 1,
        ...formData,
        price: parseFloat(formData.price)
      };
      setProducts(prev => [...prev, newProduct]);
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  // Delete product with confirmation
  const handleDeleteProduct = (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setProducts(prev => prev.filter(product => product.id !== productId));
    }
  };

  // Format price with commas for better readability
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US').format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Title */}
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-gray-900"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Product Management
        </motion.h1>

        {/* Stats and Actions Section */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Stats Card */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold">Total Products</h3>
            <p className="text-3xl font-bold mt-2">{products.length}</p>
            <p className="text-blue-100 text-sm mt-1">Manage your inventory</p>
          </div>

          {/* Search Box */}
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Search Products</h3>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or category..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchTerm("")}
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>

          {/* Add Product Button */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 shadow-lg rounded-xl p-6 flex flex-col justify-center">
            <button
              onClick={handleAddProduct}
              className="text-white px-4 py-3 rounded-lg text-lg font-medium hover:bg-green-700 transition duration-300 flex items-center justify-center"
            >
              <FaPlus className="mr-2" /> Add New Product
            </button>
          </div>
        </motion.div>

        {/* Product List */}
        <motion.div
          className="bg-white shadow-xl rounded-xl overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Product List</h2>
            <p className="text-gray-600 mt-1">
              {searchTerm 
                ? `Found ${filteredProducts.length} product(s) matching "${searchTerm}"`
                : `Showing all ${products.length} product(s)`
              }
            </p>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No products found.</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                    <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredProducts.map((product) => (
                      <motion.tr
                        key={product.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                        className="transition-colors duration-150"
                      >
                        <td className="p-4 text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="p-4 text-sm text-gray-700">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.category}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-700 font-semibold">${formatPrice(product.price)}</td>
                        <td className="p-4 text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-blue-600 hover:text-blue-800 transition duration-300 flex items-center px-3 py-1 rounded-md hover:bg-blue-50"
                            >
                              <FaEdit className="mr-1" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-800 transition duration-300 flex items-center px-3 py-1 rounded-md hover:bg-red-50"
                            >
                              <FaTrashAlt className="mr-1" /> Delete
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition duration-200"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                    }`}
                    placeholder="Enter product name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.price ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                    }`}
                    placeholder="Enter price"
                  />
                  {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.category ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                    }`}
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                  >
                    {editingProduct ? "Update Product" : "Add Product"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductManagement;