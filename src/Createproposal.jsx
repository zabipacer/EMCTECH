import React, { useState, useEffect } from "react";
import { 
  FaPlus, FaTrashAlt, FaSearch, FaTimes, FaFilePdf, 
  FaCalendarAlt, FaUser, FaDollarSign, FaShoppingCart,
  FaChevronDown, FaChevronUp, FaEdit, FaCopy
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const CreateProposal = () => {
  // State management
  const [proposal, setProposal] = useState({
    clientName: "",
    clientEmail: "",
    proposalTitle: "",
    proposalDate: new Date().toISOString().split('T')[0],
    validUntil: "",
    terms: "",
    notes: "",
    discount: 0,
    taxRate: 10
  });
  
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantityInputs, setQuantityInputs] = useState({});
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedProposals, setSavedProposals] = useState([]);
  const [viewMode, setViewMode] = useState("create"); // "create" or "preview"

  // Sample product data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAvailableProducts([
        { id: 1, name: "Ceramic Tile X", price: 12000, category: "Tiles", description: "High-quality ceramic tiles for interior use" },
        { id: 2, name: "Wooden Table", price: 15000, category: "Furniture", description: "Solid wood dining table" },
        { id: 3, name: "Marble Countertop", price: 25000, category: "Kitchen", description: "Premium marble countertop" },
        { id: 4, name: "Modern LED Lamp", price: 8500, category: "Lighting", description: "Energy-efficient LED lighting" },
        { id: 5, name: "Bathroom Vanity", price: 18000, category: "Bathroom", description: "Modern bathroom vanity unit" },
        { id: 6, name: "Outdoor Pavers", price: 9500, category: "Outdoor", description: "Durable outdoor paving stones" },
        { id: 7, name: "Glass Shower Door", price: 22000, category: "Bathroom", description: "Frameless glass shower enclosure" },
        { id: 8, name: "Kitchen Cabinetry", price: 35000, category: "Kitchen", description: "Custom kitchen cabinetry" }
      ]);
      setIsLoading(false);
    }, 800);
  }, []);

  // Filter products based on search
  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle proposal input changes
  const handleProposalChange = (e) => {
    const { name, value } = e.target;
    setProposal(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle quantity input changes
  const handleQuantityChange = (productId, value) => {
    setQuantityInputs(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  // Add product to proposal
  const handleAddProduct = (product) => {
    const quantity = quantityInputs[product.id] || 1;
    const existingProductIndex = selectedProducts.findIndex(p => p.id === product.id);
    
    if (existingProductIndex >= 0) {
      // Update quantity if product already exists
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingProductIndex].quantity += parseInt(quantity);
      setSelectedProducts(updatedProducts);
    } else {
      // Add new product
      setSelectedProducts(prev => [...prev, {
        ...product,
        quantity: parseInt(quantity)
      }]);
    }
    
    // Reset quantity input for this product
    setQuantityInputs(prev => ({
      ...prev,
      [product.id]: 1
    }));
  };

  // Remove product from proposal
  const handleRemoveProduct = (productId) => {
    setSelectedProducts(prev => prev.filter(product => product.id !== productId));
  };

  // Update product quantity
  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setSelectedProducts(prev => 
      prev.map(product => 
        product.id === productId 
          ? { ...product, quantity: parseInt(newQuantity) }
          : product
      )
    );
  };

  // Calculate subtotal
  const subtotal = selectedProducts.reduce((sum, product) => 
    sum + (product.price * product.quantity), 0
  );

  // Calculate tax amount
  const taxAmount = subtotal * (proposal.taxRate / 100);

  // Calculate discount amount
  const discountAmount = subtotal * (proposal.discount / 100);

  // Calculate total
  const total = subtotal + taxAmount - discountAmount;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Generate PDF (simulated)
  const handleGeneratePDF = () => {
    // In a real application, this would generate an actual PDF
    alert(`PDF generated for proposal: ${proposal.proposalTitle || "Untitled Proposal"}`);
    setViewMode("preview");
  };

  // Save proposal
  const handleSaveProposal = () => {
    const newProposal = {
      id: Date.now(),
      ...proposal,
      products: [...selectedProducts],
      subtotal,
      taxAmount,
      discountAmount,
      total,
      createdAt: new Date().toISOString()
    };
    
    setSavedProposals(prev => [newProposal, ...prev]);
    alert("Proposal saved successfully!");
  };

  // Load a saved proposal
  const handleLoadProposal = (savedProposal) => {
    setProposal({
      clientName: savedProposal.clientName,
      clientEmail: savedProposal.clientEmail,
      proposalTitle: savedProposal.proposalTitle,
      proposalDate: savedProposal.proposalDate,
      validUntil: savedProposal.validUntil,
      terms: savedProposal.terms,
      notes: savedProposal.notes,
      discount: savedProposal.discount,
      taxRate: savedProposal.taxRate
    });
    setSelectedProducts([...savedProposal.products]);
    setViewMode("create");
  };

  // Duplicate a product
  const handleDuplicateProduct = (product) => {
    const newProduct = {
      ...product,
      id: Date.now() // Generate a new ID
    };
    setSelectedProducts(prev => [...prev, newProduct]);
  };

  // Reset form
  const handleResetForm = () => {
    if (window.confirm("Are you sure you want to reset the form? All unsaved changes will be lost.")) {
      setProposal({
        clientName: "",
        clientEmail: "",
        proposalTitle: "",
        proposalDate: new Date().toISOString().split('T')[0],
        validUntil: "",
        terms: "",
        notes: "",
        discount: 0,
        taxRate: 10
      });
      setSelectedProducts([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Create Proposal</h1>
            <p className="text-gray-600 mt-2">Create professional proposals for your clients</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setViewMode("create")}
              className={`px-4 py-2 rounded-lg font-medium ${
                viewMode === "create" 
                  ? "bg-blue-600 text-white" 
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              Edit Proposal
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`px-4 py-2 rounded-lg font-medium ${
                viewMode === "preview" 
                  ? "bg-blue-600 text-white" 
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              Preview
            </button>
            <button
              onClick={handleSaveProposal}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition duration-200"
              disabled={selectedProducts.length === 0}
            >
              Save Proposal
            </button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Proposal Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FaUser className="mr-2 text-blue-500" /> Client Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
                  <input
                    type="text"
                    name="clientName"
                    value={proposal.clientName}
                    onChange={handleProposalChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter client name"
                    disabled={viewMode === "preview"}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
                  <input
                    type="email"
                    name="clientEmail"
                    value={proposal.clientEmail}
                    onChange={handleProposalChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter client email"
                    disabled={viewMode === "preview"}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Title</label>
                  <input
                    type="text"
                    name="proposalTitle"
                    value={proposal.proposalTitle}
                    onChange={handleProposalChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter proposal title"
                    disabled={viewMode === "preview"}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Date</label>
                  <input
                    type="date"
                    name="proposalDate"
                    value={proposal.proposalDate}
                    onChange={handleProposalChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={viewMode === "preview"}
                  />
                </div>
              </div>
            </motion.div>

            {/* Product Selection */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FaShoppingCart className="mr-2 text-blue-500" /> Product Selection
                </h2>
                
                {viewMode === "create" && (
                  <button
                    onClick={() => setIsProductModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center"
                  >
                    <FaPlus className="mr-2" /> Add Products
                  </button>
                )}
              </div>
              
              {selectedProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FaShoppingCart className="text-4xl mx-auto mb-3 text-gray-300" />
                  <p>No products added to the proposal yet.</p>
                  {viewMode === "create" && (
                    <button
                      onClick={() => setIsProductModalOpen(true)}
                      className="text-blue-600 hover:text-blue-800 mt-2"
                    >
                      Click here to add products
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-3 text-sm font-medium text-gray-600">Product</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-600">Quantity</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-600">Price</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-600">Total</th>
                        {viewMode === "create" && <th className="text-left p-3 text-sm font-medium text-gray-600">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {selectedProducts.map((product) => (
                          <motion.tr
                            key={product.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="border-b border-gray-100"
                          >
                            <td className="p-3">
                              <div>
                                <div className="font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.category}</div>
                              </div>
                            </td>
                            <td className="p-3">
                              {viewMode === "create" ? (
                                <div className="flex items-center">
                                  <button
                                    onClick={() => handleUpdateQuantity(product.id, product.quantity - 1)}
                                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={product.quantity}
                                    onChange={(e) => handleUpdateQuantity(product.id, e.target.value)}
                                    className="w-16 h-8 text-center border-t border-b border-gray-300"
                                  />
                                  <button
                                    onClick={() => handleUpdateQuantity(product.id, product.quantity + 1)}
                                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <span>{product.quantity}</span>
                              )}
                            </td>
                            <td className="p-3 font-medium">{formatCurrency(product.price)}</td>
                            <td className="p-3 font-semibold">{formatCurrency(product.price * product.quantity)}</td>
                            {viewMode === "create" && (
                              <td className="p-3">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleDuplicateProduct(product)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Duplicate"
                                  >
                                    <FaCopy size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveProduct(product.id)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Remove"
                                  >
                                    <FaTrashAlt size={14} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Terms and Notes */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Terms & Notes</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Terms</label>
                  <textarea
                    name="terms"
                    value={proposal.terms}
                    onChange={handleProposalChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the terms of this proposal..."
                    disabled={viewMode === "preview"}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea
                    name="notes"
                    value={proposal.notes}
                    onChange={handleProposalChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any additional notes for the client..."
                    disabled={viewMode === "preview"}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                    <input
                      type="date"
                      name="validUntil"
                      value={proposal.validUntil}
                      onChange={handleProposalChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={viewMode === "preview"}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Pricing & Actions */}
          <div className="space-y-6">
            {/* Pricing Summary */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6 sticky top-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FaDollarSign className="mr-2 text-green-500" /> Pricing Summary
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({proposal.taxRate}%)</span>
                  <span className="font-medium">{formatCurrency(taxAmount)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount ({proposal.discount}%)</span>
                  <span className="font-medium text-red-600">-{formatCurrency(discountAmount)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
              
              {viewMode === "create" && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      name="taxRate"
                      value={proposal.taxRate}
                      onChange={handleProposalChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      name="discount"
                      value={proposal.discount}
                      onChange={handleProposalChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
              
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleGeneratePDF}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center font-medium"
                  disabled={selectedProducts.length === 0}
                >
                  <FaFilePdf className="mr-2" /> Generate PDF Proposal
                </button>
                
                {viewMode === "create" && (
                  <button
                    onClick={handleResetForm}
                    className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition duration-200 font-medium"
                  >
                    Reset Form
                  </button>
                )}
              </div>
            </motion.div>

            {/* Saved Proposals */}
            {savedProposals.length > 0 && (
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Saved Proposals</h2>
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {savedProposals.map((saved) => (
                    <div key={saved.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="font-medium text-gray-900 truncate">
                        {saved.proposalTitle || "Untitled Proposal"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {saved.clientName} • {formatCurrency(saved.total)}
                      </div>
                      <button
                        onClick={() => handleLoadProposal(saved)}
                        className="text-blue-600 hover:text-blue-800 text-sm mt-1"
                      >
                        Load Proposal
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Product Selection Modal */}
      <AnimatePresence>
        {isProductModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsProductModalOpen(false)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-screen overflow-hidden flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Select Products</h3>
                <button
                  onClick={() => setIsProductModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition duration-200"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products by name or category..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Product List */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-gray-600">Loading products...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No products found.</p>
                  </div>
                ) : (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{product.name}</h4>
                            <span className="text-sm text-gray-500">{product.category}</span>
                          </div>
                          <span className="font-semibold text-blue-600">{formatCurrency(product.price)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-700 mr-2">Qty:</span>
                            <input
                              type="number"
                              min="1"
                              value={quantityInputs[product.id] || 1}
                              onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                            />
                          </div>
                          <button
                            onClick={() => handleAddProduct(product)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition duration-200 flex items-center"
                          >
                            <FaPlus className="mr-1" /> Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 flex justify-between">
                <div className="text-sm text-gray-600">
                  {selectedProducts.length} product(s) in proposal
                </div>
                <button
                  onClick={() => setIsProductModalOpen(false)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-200"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateProposal;