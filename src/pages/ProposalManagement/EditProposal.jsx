import React, { useState, useEffect, useRef } from "react";
import { 
  FaPlus, FaTrashAlt, FaSearch, FaTimes, FaFilePdf, 
  FaCalendarAlt, FaUser, FaDollarSign, FaShoppingCart,
  FaChevronDown, FaChevronUp, FaEdit, FaCopy, FaSave,
  FaPaperPlane, FaHistory, FaBuilding, FaFileAlt,
  FaCheck, FaExclamationTriangle, FaPercent, FaReceipt,
  FaSpinner, FaEye,
  FaDownload
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const EditProposalModal = ({ 
  open, 
  onClose, 
  onSave,
  proposal: initialProposal,
  clients = [],
  availableProducts = []
}) => {
  // State management
  const [proposal, setProposal] = useState({
    proposalNumber: "",
    clientId: "",
    clientName: "",
    clientEmail: "",
    company: "",
    proposalTitle: "",
    proposalDate: "",
    validUntil: "",
    terms: "",
    notes: "",
    discount: 0,
    taxRate: 10,
    status: "draft"
  });
  
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantityInputs, setQuantityInputs] = useState({});
  const [priceInputs, setPriceInputs] = useState({});
  const [discountInputs, setDiscountInputs] = useState({});
  const [taxToggle, setTaxToggle] = useState({});
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState("saved");
  const [activityLog, setActivityLog] = useState([]);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", company: "" });
  const [emailData, setEmailData] = useState({ subject: "", body: "", to: "" });
  const [collapsedSections, setCollapsedSections] = useState({});
  const [viewMode, setViewMode] = useState("edit");

  const autoSaveTimeoutRef = useRef(null);

  // Initialize data from proposal
  useEffect(() => {
    if (open && initialProposal) {
      setProposal({
        proposalNumber: initialProposal.proposalNumber || `PROP-${Date.now()}`,
        clientId: initialProposal.clientId || "",
        clientName: initialProposal.clientName || "",
        clientEmail: initialProposal.clientEmail || "",
        company: initialProposal.company || "Your Company Name",
        proposalTitle: initialProposal.proposalTitle || "",
        proposalDate: initialProposal.proposalDate || new Date().toISOString().split('T')[0],
        validUntil: initialProposal.validUntil || "",
        terms: initialProposal.terms || "",
        notes: initialProposal.notes || "",
        discount: initialProposal.discount || 0,
        taxRate: initialProposal.taxRate || 10,
        status: initialProposal.status || "draft"
      });
      setSelectedProducts(initialProposal.products || []);
      setActivityLog([{ 
        id: 1, 
        action: "Loaded for editing", 
        user: "You", 
        timestamp: new Date().toISOString(), 
        details: "Proposal loaded for editing" 
      }]);
    }
  }, [open, initialProposal]);

  // Auto-save functionality
  useEffect(() => {
    if (open) {
      setAutoSaveStatus("saving");
      
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 2000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [proposal, selectedProducts, open]);

  const handleAutoSave = () => {
    setAutoSaveStatus("saved");
    addActivityLog("Auto-saved", "System");
  };

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

  // Handle client selection
  const handleClientSelect = (clientId) => {
    const client = clients.find(c => c.id === parseInt(clientId));
    if (client) {
      setProposal(prev => ({
        ...prev,
        clientId: client.id.toString(),
        clientName: client.name,
        clientEmail: client.email
      }));
    }
  };

  // Handle quantity input changes
  const handleQuantityChange = (productId, value) => {
    setQuantityInputs(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  // Handle price input changes
  const handlePriceChange = (productId, value) => {
    setPriceInputs(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  // Handle discount input changes
  const handleDiscountChange = (productId, value) => {
    setDiscountInputs(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  // Handle tax toggle
  const handleTaxToggle = (productId) => {
    setTaxToggle(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // Add product to proposal
  const handleAddProduct = (product) => {
    const quantity = parseInt(quantityInputs[product.id]) || 1;
    const unitPrice = parseFloat(priceInputs[product.id]) || product.price;
    const discount = parseFloat(discountInputs[product.id]) || 0;
    const taxable = taxToggle[product.id] !== false;
    
    if (quantity <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    const existingProductIndex = selectedProducts.findIndex(p => p.id === product.id);
    
    if (existingProductIndex >= 0) {
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingProductIndex].quantity += quantity;
      setSelectedProducts(updatedProducts);
    } else {
      setSelectedProducts(prev => [...prev, {
        ...product,
        quantity,
        unitPrice,
        discount,
        taxable,
        lineTotal: calculateLineTotal(unitPrice, quantity, discount, taxable)
      }]);
    }
    
    // Reset inputs for this product
    setQuantityInputs(prev => ({ ...prev, [product.id]: 1 }));
    setPriceInputs(prev => ({ ...prev, [product.id]: "" }));
    setDiscountInputs(prev => ({ ...prev, [product.id]: 0 }));
    setTaxToggle(prev => ({ ...prev, [product.id]: true }));
  };

  // Calculate line total
  const calculateLineTotal = (unitPrice, quantity, discount, taxable) => {
    const subtotal = unitPrice * quantity;
    const discountAmount = subtotal * (discount / 100);
    const lineSubtotal = subtotal - discountAmount;
    const taxAmount = taxable ? lineSubtotal * (proposal.taxRate / 100) : 0;
    return lineSubtotal + taxAmount;
  };

  // Update product in table
  const handleUpdateProduct = (productId, field, value) => {
    setSelectedProducts(prev => 
      prev.map(product => {
        if (product.id === productId) {
          const updatedProduct = { ...product, [field]: value };
          updatedProduct.lineTotal = calculateLineTotal(
            updatedProduct.unitPrice,
            updatedProduct.quantity,
            updatedProduct.discount,
            updatedProduct.taxable
          );
          return updatedProduct;
        }
        return product;
      })
    );
  };

  // Remove product from proposal
  const handleRemoveProduct = (productId) => {
    setSelectedProducts(prev => prev.filter(product => product.id !== productId));
  };

  // Duplicate a product
  const handleDuplicateProduct = (product) => {
    const newProduct = {
      ...product,
      id: Date.now()
    };
    setSelectedProducts(prev => [...prev, newProduct]);
  };

  // Add new client
  const handleAddClient = () => {
    const newClientWithId = {
      ...newClient,
      id: Date.now()
    };
    setProposal(prev => ({
      ...prev,
      clientId: newClientWithId.id.toString(),
      clientName: newClientWithId.name,
      clientEmail: newClientWithId.email
    }));
    setNewClient({ name: "", email: "", phone: "", company: "" });
    setIsClientModalOpen(false);
    addActivityLog("Client added", "You");
  };

  // Calculate totals
  const subtotal = selectedProducts.reduce((sum, product) => 
    sum + (product.unitPrice * product.quantity), 0
  );

  const totalDiscount = selectedProducts.reduce((sum, product) => 
    sum + (product.unitPrice * product.quantity * (product.discount / 100)), 0
  );

  const taxableSubtotal = selectedProducts
    .filter(product => product.taxable)
    .reduce((sum, product) => {
      const productSubtotal = product.unitPrice * product.quantity;
      const productDiscount = productSubtotal * (product.discount / 100);
      return sum + (productSubtotal - productDiscount);
    }, 0);

  const taxAmount = taxableSubtotal * (proposal.taxRate / 100);
  const grandTotal = subtotal - totalDiscount + taxAmount;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Add activity log entry
  const addActivityLog = (action, user, details = "") => {
    const newEntry = {
      id: Date.now(),
      action,
      user,
      timestamp: new Date().toISOString(),
      details
    };
    setActivityLog(prev => [newEntry, ...prev]);
  };

  // Generate PDF (simulated)
  const handleGeneratePDF = () => {
    setIsPdfPreviewOpen(true);
    addActivityLog("PDF preview generated", "You");
  };

  // Save proposal
  const handleSaveProposal = (status = "draft") => {
    const updatedProposal = {
      ...initialProposal,
      ...proposal,
      status,
      products: [...selectedProducts],
      subtotal,
      totalDiscount,
      taxAmount,
      grandTotal,
      updatedAt: new Date().toISOString()
    };
    
    onSave(updatedProposal);
    setAutoSaveStatus("saved");
    addActivityLog(`Proposal ${status === "draft" ? "saved as draft" : "updated"}`, "You");
  };

  // Send proposal via email
  const handleSendProposal = () => {
    setIsEmailModalOpen(false);
    addActivityLog("Proposal sent via email", "You", `To: ${emailData.to}`);
    handleSaveProposal("sent");
    onClose();
  };

  // Reset form
  const handleResetForm = () => {
    if (window.confirm("Are you sure you want to reset all changes?")) {
      setProposal({
        proposalNumber: initialProposal.proposalNumber || `PROP-${Date.now()}`,
        clientId: initialProposal.clientId || "",
        clientName: initialProposal.clientName || "",
        clientEmail: initialProposal.clientEmail || "",
        company: initialProposal.company || "Your Company Name",
        proposalTitle: initialProposal.proposalTitle || "",
        proposalDate: initialProposal.proposalDate || new Date().toISOString().split('T')[0],
        validUntil: initialProposal.validUntil || "",
        terms: initialProposal.terms || "",
        notes: initialProposal.notes || "",
        discount: initialProposal.discount || 0,
        taxRate: initialProposal.taxRate || 10,
        status: initialProposal.status || "draft"
      });
      setSelectedProducts(initialProposal.products || []);
      addActivityLog("Changes reset", "You");
    }
  };

  // Toggle section collapse
  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!open || !initialProposal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-screen overflow-hidden flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Edit Proposal</h3>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-gray-600">Proposal #: {proposal.proposalNumber}</p>
              <div className="flex items-center gap-2 text-sm">
                {autoSaveStatus === "saving" && (
                  <span className="text-orange-500 flex items-center">
                    <FaExclamationTriangle className="mr-1" /> Saving...
                  </span>
                )}
                {autoSaveStatus === "saved" && (
                  <span className="text-green-500 flex items-center">
                    <FaCheck className="mr-1" /> All changes saved
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("edit")}
                  className={`px-3 py-1 rounded text-sm ${
                    viewMode === "edit" 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  <FaEdit className="inline mr-1" /> Edit
                </button>
                <button
                  onClick={() => setViewMode("preview")}
                  className={`px-3 py-1 rounded text-sm ${
                    viewMode === "preview" 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  <FaEye className="inline mr-1" /> Preview
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200 p-2"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column - Proposal Details */}
            <div className="lg:col-span-3 space-y-6">
              {/* Header Section */}
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <FaBuilding className="mr-2 text-blue-500" /> Proposal Header
                  </h2>
                  <button
                    onClick={() => toggleSection('header')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {collapsedSections.header ? <FaChevronDown /> : <FaChevronUp />}
                  </button>
                </div>
                
                {!collapsedSections.header && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <input
                        type="text"
                        name="company"
                        value={proposal.company}
                        onChange={handleProposalChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your company name"
                        disabled={viewMode === "preview"}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                      <div className="flex gap-2">
                        <select
                          value={proposal.clientId}
                          onChange={(e) => handleClientSelect(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={viewMode === "preview"}
                        >
                          <option value="">Select a client</option>
                          {clients.map(client => (
                            <option key={client.id} value={client.id}>
                              {client.name} - {client.company}
                            </option>
                          ))}
                        </select>
                        {viewMode === "edit" && (
                          <button
                            onClick={() => setIsClientModalOpen(true)}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                          >
                            <FaPlus />
                          </button>
                        )}
                      </div>
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        name="status"
                        value={proposal.status}
                        onChange={handleProposalChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={viewMode === "preview"}
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="accepted">Accepted</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Product Selection */}
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <FaShoppingCart className="mr-2 text-blue-500" /> Product Selection
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleSection('products')}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {collapsedSections.products ? <FaChevronDown /> : <FaChevronUp />}
                    </button>
                    {viewMode === "edit" && (
                      <button
                        onClick={() => setIsProductModalOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center"
                      >
                        <FaPlus className="mr-2" /> Add Products
                      </button>
                    )}
                  </div>
                </div>
                
                {!collapsedSections.products && (
                  <>
                    {selectedProducts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FaShoppingCart className="text-4xl mx-auto mb-3 text-gray-300" />
                        <p>No products added to the proposal yet.</p>
                        {viewMode === "edit" && (
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
                              <th className="text-left p-3 text-sm font-medium text-gray-600">Item Name</th>
                              <th className="text-left p-3 text-sm font-medium text-gray-600">Qty</th>
                              <th className="text-left p-3 text-sm font-medium text-gray-600">Unit Price</th>
                              <th className="text-left p-3 text-sm font-medium text-gray-600">Discount %</th>
                              <th className="text-left p-3 text-sm font-medium text-gray-600">Tax</th>
                              <th className="text-left p-3 text-sm font-medium text-gray-600">Line Total</th>
                              {viewMode === "edit" && <th className="text-left p-3 text-sm font-medium text-gray-600">Actions</th>}
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
                                    {viewMode === "edit" ? (
                                      <input
                                        type="number"
                                        min="1"
                                        value={product.quantity}
                                        onChange={(e) => handleUpdateProduct(product.id, 'quantity', parseInt(e.target.value))}
                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                      />
                                    ) : (
                                      <span>{product.quantity}</span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {viewMode === "edit" ? (
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={product.unitPrice}
                                        onChange={(e) => handleUpdateProduct(product.id, 'unitPrice', parseFloat(e.target.value))}
                                        className="w-24 px-2 py-1 border border-gray-300 rounded"
                                      />
                                    ) : (
                                      <span>{formatCurrency(product.unitPrice)}</span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {viewMode === "edit" ? (
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={product.discount}
                                        onChange={(e) => handleUpdateProduct(product.id, 'discount', parseFloat(e.target.value))}
                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                      />
                                    ) : (
                                      <span>{product.discount}%</span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {viewMode === "edit" ? (
                                      <label className="flex items-center">
                                        <input
                                          type="checkbox"
                                          checked={product.taxable}
                                          onChange={() => handleUpdateProduct(product.id, 'taxable', !product.taxable)}
                                          className="mr-2"
                                        />
                                        Taxable
                                      </label>
                                    ) : (
                                      <span>{product.taxable ? "Yes" : "No"}</span>
                                    )}
                                  </td>
                                  <td className="p-3 font-semibold">{formatCurrency(product.lineTotal)}</td>
                                  {viewMode === "edit" && (
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
                  </>
                )}
              </motion.div>

              {/* Terms and Notes */}
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Terms & Notes</h2>
                  <button
                    onClick={() => toggleSection('terms')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {collapsedSections.terms ? <FaChevronDown /> : <FaChevronUp />}
                  </button>
                </div>
                
                {!collapsedSections.terms && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Terms</label>
                      <textarea
                        name="terms"
                        value={proposal.terms}
                        onChange={handleProposalChange}
                        rows="4"
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
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Any additional notes for the client..."
                        disabled={viewMode === "preview"}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right Column - Pricing & Actions */}
            <div className="space-y-6">
              {/* Pricing Summary */}
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
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
                  
                  <div className="flex justify-between text-red-600">
                    <span className="text-gray-600">Discounts</span>
                    <span className="font-medium">-{formatCurrency(totalDiscount)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({proposal.taxRate}%)</span>
                    <span className="font-medium">{formatCurrency(taxAmount)}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-semibold">
                    <span>Grand Total</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
                
                {viewMode === "edit" && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        name="taxRate"
                        value={proposal.taxRate}
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
                    <FaFilePdf className="mr-2" /> Preview PDF
                  </button>

                  {viewMode === "edit" && (
                    <>
                      <button
                        onClick={() => handleSaveProposal("draft")}
                        className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition duration-200 flex items-center justify-center font-medium"
                        disabled={selectedProducts.length === 0}
                      >
                        <FaSave className="mr-2" /> Save Draft
                      </button>

                      <button
                        onClick={() => setIsEmailModalOpen(true)}
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition duration-200 flex items-center justify-center font-medium"
                        disabled={selectedProducts.length === 0 || !proposal.clientEmail}
                      >
                        <FaPaperPlane className="mr-2" /> Send Proposal
                      </button>
                      
                      <button
                        onClick={handleResetForm}
                        className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition duration-200 font-medium"
                      >
                        Reset Changes
                      </button>
                    </>
                  )}
                </div>
              </motion.div>

              {/* Activity Log */}
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <FaHistory className="mr-2 text-blue-500" /> Activity Log
                </h2>
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {activityLog.map((activity) => (
                    <div key={activity.id} className="border-l-2 border-blue-500 pl-3 py-1">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm">{activity.action}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        by {activity.user} {activity.details && `• ${activity.details}`}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition duration-200 font-medium"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            {viewMode === "edit" && (
              <button
                onClick={() => handleSaveProposal("draft")}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200 font-medium"
                disabled={selectedProducts.length === 0}
              >
                Save Draft
              </button>
            )}
            <button
              onClick={() => handleSaveProposal(proposal.status)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
              disabled={selectedProducts.length === 0}
            >
              {viewMode === "edit" ? "Save Changes" : "Close"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* All the same sub-components as CreateProposalModal */}
      <AnimatePresence>
        {isProductModalOpen && (
          <ProductSelectionModal
            open={isProductModalOpen}
            onClose={() => setIsProductModalOpen(false)}
            products={filteredProducts}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            quantityInputs={quantityInputs}
            onQuantityChange={handleQuantityChange}
            priceInputs={priceInputs}
            onPriceChange={handlePriceChange}
            discountInputs={discountInputs}
            onDiscountChange={handleDiscountChange}
            taxToggle={taxToggle}
            onTaxToggle={handleTaxToggle}
            onAddProduct={handleAddProduct}
            isLoading={isLoading}
            selectedProductsCount={selectedProducts.length}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isClientModalOpen && (
          <ClientModal
            open={isClientModalOpen}
            onClose={() => setIsClientModalOpen(false)}
            newClient={newClient}
            onNewClientChange={setNewClient}
            onAddClient={handleAddClient}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPdfPreviewOpen && (
          <PDFPreviewModal
            open={isPdfPreviewOpen}
            onClose={() => setIsPdfPreviewOpen(false)}
            proposal={proposal}
            selectedProducts={selectedProducts}
            subtotal={subtotal}
            totalDiscount={totalDiscount}
            taxAmount={taxAmount}
            grandTotal={grandTotal}
            formatCurrency={formatCurrency}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEmailModalOpen && (
          <EmailModal
            open={isEmailModalOpen}
            onClose={() => setIsEmailModalOpen(false)}
            proposal={proposal}
            emailData={emailData}
            onEmailDataChange={setEmailData}
            onSendProposal={handleSendProposal}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Reuse the same sub-components from CreateProposalModal
// ProductSelectionModal, ClientModal, PDFPreviewModal, EmailModal
const ProductSelectionModal = ({ 
  open, 
  onClose, 
  products, 
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
  onAddProduct,
  isLoading,
  selectedProductsCount
}) => {
  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-screen overflow-hidden flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">Select Products</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name or category..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <FaSpinner className="inline-block animate-spin text-4xl text-blue-500 mb-3" />
              <p className="text-gray-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No products found.</p>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <span className="text-sm text-gray-500">{product.category}</span>
                    </div>
                    <span className="font-semibold text-blue-600">${product.price}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="text-xs text-gray-700">Qty:</label>
                      <input
                        type="number"
                        min="1"
                        value={quantityInputs[product.id] || 1}
                        onChange={(e) => onQuantityChange(product.id, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-700">Price:</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={priceInputs[product.id] || ""}
                        onChange={(e) => onPriceChange(product.id, e.target.value)}
                        placeholder={product.price}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-700">Discount %:</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountInputs[product.id] || 0}
                        onChange={(e) => onDiscountChange(product.id, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center"
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
                  <button
                    onClick={() => onAddProduct(product)}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                  >
                    <FaPlus className="mr-1" /> Add to Proposal
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedProductsCount} product(s) in proposal
          </div>
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-200"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ClientModal = ({ open, onClose, newClient, onNewClientChange, onAddClient }) => {
  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Add New Client</h3>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={newClient.name}
              onChange={(e) => onNewClientChange(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Client name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={newClient.email}
              onChange={(e) => onNewClientChange(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="client@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={newClient.phone}
              onChange={(e) => onNewClientChange(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              type="text"
              value={newClient.company}
              onChange={(e) => onNewClientChange(prev => ({ ...prev, company: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Company name"
            />
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onAddClient}
            disabled={!newClient.name}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Add Client
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const PDFPreviewModal = ({ 
  open, 
  onClose, 
  proposal, 
  selectedProducts, 
  rfqItems,
  subtotal, 
  totalDiscount, 
  taxAmount, 
  grandTotal, 
  formatCurrency 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      
      const pdfData = {
        ...proposal,
        products: selectedProducts,
        rfqItems: rfqItems,
        selectedProducts: selectedProducts,
        items: rfqItems,
        subtotal,
        totalDiscount,
        taxAmount,
        grandTotal,
        templateType: proposal.templateType,
        formatCurrency
      };

      if (proposal.templateType === 'technical-rfq') {
        await downloadTechnicalRFQPdf(pdfData);
      } else {
        await downloadProposalPdf(pdfData);
      }
      
      showToast('PDF downloaded successfully!', 'success');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Error generating PDF. Please try again.', 'error');
      // Fallback to print
      handlePrint();
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('pdf-preview-content');
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${proposal.templateType === 'technical-rfq' ? 'Technical RFQ' : 'Proposal'} ${proposal.proposalNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px;
              color: #333;
              font-size: 12px;
            }
            .header { 
              border-bottom: 2px solid #003366; 
              padding-bottom: 20px; 
              margin-bottom: 20px;
            }
            .company-info h1 { 
              margin: 0; 
              color: #003366;
              font-size: 16px;
              font-weight: bold;
            }
            .proposal-info { 
              background: #f8f8f8; 
              padding: 15px; 
              border-radius: 5px;
              border: 1px solid #ddd;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
              font-size: 10px;
            }
            th, td { 
              border: 1px solid #808080; 
              padding: 6px; 
              text-align: left;
              vertical-align: top;
            }
            th { 
              background-color: #e8e8e8; 
              color: #000;
              font-weight: bold;
              text-align: center;
            }
            .technical-item { 
              border: 1px solid #808080; 
              margin: 10px 0; 
              padding: 10px;
              background: #f9f9f9;
            }
            .technical-item h4 {
              margin: 0 0 8px 0;
              color: #003366;
              font-size: 11px;
              text-transform: uppercase;
            }
            .signature-section {
              margin-top: 40px;
              border-top: 1px solid #808080;
              padding-top: 20px;
            }
            .notes-section {
              margin: 20px 0;
              padding: 10px;
              background: #f8f8f8;
              border-left: 3px solid #003366;
            }
            .summary-table {
              width: 300px;
              margin-left: auto;
              border: 1px solid #ddd;
            }
            .summary-table td {
              padding: 8px;
              border-bottom: 1px solid #eee;
            }
            .summary-table tr:last-child td {
              border-bottom: none;
              font-weight: bold;
              background: #f5f5f5;
            }
            @media print {
              body { margin: 10mm; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };

  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-screen overflow-hidden flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{ minHeight: '90vh' }}
      >
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <FaFilePdf className="mr-2 text-red-500" /> 
            {proposal.templateType === 'technical-rfq' ? 'Technical RFQ Preview' : 'Proposal PDF Preview'}
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 bg-blue-100 px-2 py-1 rounded">
              {proposal.templateType === 'technical-rfq' ? 'Technical RFQ' : 'Simple Proposal'}
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition duration-200"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div id="pdf-preview-content" className="bg-white border border-gray-300 p-8 max-w-6xl mx-auto shadow-lg" style={{ fontSize: '12px' }}>
            {proposal.templateType === 'technical-rfq' ? (
              <TechnicalRFQPreviewContent 
                proposal={proposal}
                rfqItems={rfqItems}
                formatCurrency={formatCurrency}
              />
            ) : (
              <SimpleProposalPreviewContent
                proposal={proposal}
                selectedProducts={selectedProducts}
                subtotal={subtotal}
                totalDiscount={totalDiscount}
                taxAmount={taxAmount}
                grandTotal={grandTotal}
                formatCurrency={formatCurrency}
              />
            )}
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-between items-center bg-white">
          <div className="text-sm text-gray-600 flex items-center">
            <FaExclamationTriangle className="mr-2 text-yellow-500" />
            Preview may differ slightly from actual PDF
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-200 font-medium"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center font-medium"
            >
              <FaFilePdf className="mr-2" /> Print
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <FaSpinner className="mr-2 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <FaDownload className="mr-2" /> Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Technical RFQ Preview Component
const TechnicalRFQPreviewContent = ({ proposal, rfqItems, formatCurrency }) => {
  const formatDisplayDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
      {/* Header */}
      <div className="header">
        <div style={{ marginBottom: '10px' }}>
          <h1 style={{ margin: 0, color: '#003366', fontSize: '14px', fontWeight: 'bold' }}>
            {proposal.companyDetails?.name || proposal.company}
          </h1>
          <div style={{ fontSize: '9px', lineHeight: '1.3' }}>
            <div>{proposal.companyDetails?.address}</div>
            <div>Phone: {proposal.companyDetails?.phone}</div>
            <div>Email: {proposal.companyDetails?.email}</div>
            <div>Bank Account: {proposal.companyDetails?.bankAccount}</div>
            <div>MFO: {proposal.companyDetails?.mfo}</div>
            <div>Tax ID: {proposal.companyDetails?.taxId}</div>
            <div>OKED: {proposal.companyDetails?.oked}</div>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', margin: '15px 0' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#003366' }}>№{proposal.documentNumber}</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#003366', marginTop: '5px' }}>COMMERCIAL OFFER</div>
        </div>
        
        <div style={{ fontSize: '10px' }}>
          <div>Date: {formatDisplayDate(proposal.proposalDate)}</div>
          <div>To: {proposal.clientName}</div>
        </div>
      </div>

      {/* Technical Items Table */}
      {rfqItems.length > 0 && (
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #808080', padding: '4px', width: '5%' }}>№</th>
                <th style={{ border: '1px solid #808080', padding: '4px', width: '20%' }}>Technical Description of Requested Item</th>
                <th style={{ border: '1px solid #808080', padding: '4px', width: '25%' }}>Material PO Text</th>
                <th style={{ border: '1px solid #808080', padding: '4px', width: '8%' }}>Unit</th>
                <th style={{ border: '1px solid #808080', padding: '4px', width: '10%' }}>Quantity Requested</th>
                <th style={{ border: '1px solid #808080', padding: '4px', width: '20%' }}>Technical Description</th>
                <th style={{ border: '1px solid #808080', padding: '4px', width: '20%' }}>Will be Supplied</th>
                <th style={{ border: '1px solid #808080', padding: '4px', width: '20%' }}>Will be Supplied</th>
                <th style={{ border: '1px solid #808080', padding: '4px', width: '15%' }}>PHOTO</th>
              </tr>
            </thead>
            <tbody>
              {rfqItems.map((item, index) => (
                <tr key={item.id}>
                  <td style={{ border: '1px solid #808080', padding: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                    {index + 1}
                  </td>
                  <td style={{ border: '1px solid #808080', padding: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {item.description}
                  </td>
                  <td style={{ border: '1px solid #808080', padding: '4px' }}>
                    {item.technicalDescription}
                    {item.manufacturer && `; OEM/MAKE: ${item.manufacturer}`}
                    {item.partNumber && `; Part No: ${item.partNumber}`}
                  </td>
                  <td style={{ border: '1px solid #808080', padding: '4px', textAlign: 'center' }}>
                    {item.unit}
                  </td>
                  <td style={{ border: '1px solid #808080', padding: '4px', textAlign: 'center' }}>
                    {item.quantity}
                  </td>
                  <td style={{ border: '1px solid #808080', padding: '4px' }}>
                    {item.willBeSupplied}
                  </td>
                  <td style={{ border: '1px solid #808080', padding: '4px', fontSize: '8px' }}>
                    {item.specifications && item.specifications.filter(spec => spec.trim()).map((spec, idx) => (
                      <div key={idx}>{idx + 1}. {spec}</div>
                    ))}
                  </td>
                  <td style={{ border: '1px solid #808080', padding: '4px' }}>
                    {item.willBeSupplied}
                  </td>
                  <td style={{ border: '1px solid #808080', padding: '4px', textAlign: 'center' }}>
                    {item.imageUrl && (
                      <img 
                        src={item.imageUrl} 
                        alt={item.description}
                        style={{ maxWidth: '100%', maxHeight: '50px', objectFit: 'contain' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes Section */}
      <div className="notes-section">
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>NOTES:</div>
        <div style={{ fontSize: '10px' }}>
          <div>1. Terms of payment: {proposal.deliveryTerms?.paymentTerms}</div>
          <div>2. Estimated delivery time: {proposal.deliveryTerms?.deliveryTime}</div>
          <div>3. Terms of delivery: {proposal.deliveryTerms?.incoterms}</div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="signature-section">
        <div style={{ marginBottom: '30px' }}>
          <div>{proposal.authorizedSignatory?.title}</div>
          <div style={{ borderTop: '1px solid #000', width: '200px', marginTop: '20px', paddingTop: '5px' }}>
            {proposal.authorizedSignatory?.name}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '40px', fontSize: '8px', color: '#666', textAlign: 'center', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
        <div>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</div>
        <div>Document ID: {proposal.proposalNumber}</div>
      </div>
    </div>
  );
};

// Simple Proposal Preview Component
const SimpleProposalPreviewContent = ({ proposal, selectedProducts, subtotal, totalDiscount, taxAmount, grandTotal, formatCurrency }) => {
  const formatDisplayDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
      {/* Header */}
      <div style={{ borderBottom: '2px solid #2d5aa0', paddingBottom: '20px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#2d5aa0', color: 'white', padding: '20px', margin: '-32px -32px 20px -32px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', textAlign: 'center' }}>PROPOSAL</h1>
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <div style={{ fontSize: '14px' }}>Proposal #: {proposal.proposalNumber}</div>
            <div style={{ fontSize: '12px' }}>Date: {formatDisplayDate(proposal.proposalDate)}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <div>
            <h3 style={{ margin: '0 0 10px 0', color: '#2d5aa0' }}>From:</h3>
            <div style={{ fontSize: '11px' }}>
              <div><strong>{proposal.company}</strong></div>
              {proposal.companyDetails?.address && <div>{proposal.companyDetails.address}</div>}
              {proposal.companyDetails?.phone && <div>Phone: {proposal.companyDetails.phone}</div>}
              {proposal.companyDetails?.email && <div>Email: {proposal.companyDetails.email}</div>}
            </div>
          </div>
          
          <div>
            <h3 style={{ margin: '0 0 10px 0', color: '#2d5aa0' }}>To:</h3>
            <div style={{ fontSize: '11px' }}>
              <div><strong>{proposal.clientName}</strong></div>
              {proposal.clientEmail && <div>Email: {proposal.clientEmail}</div>}
            </div>
          </div>
        </div>

        {proposal.proposalTitle && (
          <div style={{ textAlign: 'center', marginTop: '20px', padding: '15px', backgroundColor: '#e8f4ff', borderRadius: '5px' }}>
            <h2 style={{ margin: 0, color: '#2d5aa0', fontSize: '18px' }}>{proposal.proposalTitle}</h2>
          </div>
        )}

        {proposal.validUntil && (
          <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '11px', color: '#666' }}>
            Valid Until: {formatDisplayDate(proposal.validUntil)}
          </div>
        )}
      </div>

      {/* Products Table */}
      {selectedProducts.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#2d5aa0', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>PROPOSAL ITEMS</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#2d5aa0', color: 'white' }}>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #1e3d6d' }}>Item Description</th>
                <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #1e3d6d', width: '8%' }}>Qty</th>
                <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #1e3d6d', width: '12%' }}>Unit Price</th>
                <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #1e3d6d', width: '10%' }}>Disc. %</th>
                <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #1e3d6d', width: '8%' }}>Tax</th>
                <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #1e3d6d', width: '12%' }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {selectedProducts.map((product, index) => (
                <tr key={product.id} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                    {product.category && (
                      <div style={{ fontSize: '9px', color: '#666' }}>{product.category}</div>
                    )}
                    {product.imageUrl && (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        style={{ maxWidth: '50px', maxHeight: '50px', marginTop: '5px', objectFit: 'contain' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>{product.quantity}</td>
                  <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>{formatCurrency(product.unitPrice)}</td>
                  <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>{product.discount}%</td>
                  <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>{product.taxable ? 'Yes' : 'No'}</td>
                  <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd', fontWeight: 'bold' }}>
                    {formatCurrency(product.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Section */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
        <table className="summary-table">
          <tbody>
            <tr>
              <td>Subtotal:</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(subtotal)}</td>
            </tr>
            <tr>
              <td>Discounts:</td>
              <td style={{ textAlign: 'right', color: '#d00' }}>-{formatCurrency(totalDiscount)}</td>
            </tr>
            <tr>
              <td>Tax ({proposal.taxRate}%):</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(taxAmount)}</td>
            </tr>
            <tr>
              <td style={{ borderTop: '2px solid #2d5aa0', fontWeight: 'bold' }}>Grand Total:</td>
              <td style={{ borderTop: '2px solid #2d5aa0', textAlign: 'right', fontWeight: 'bold', color: '#2d5aa0' }}>
                {formatCurrency(grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Terms and Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        {proposal.terms && (
          <div>
            <h4 style={{ color: '#2d5aa0', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Terms & Conditions</h4>
            <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
              {proposal.terms.split('\n').map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          </div>
        )}
        
        {proposal.notes && (
          <div>
            <h4 style={{ color: '#2d5aa0', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Additional Notes</h4>
            <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
              {proposal.notes.split('\n').map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '40px', fontSize: '8px', color: '#666', textAlign: 'center', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
        <div>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</div>
        <div>Proposal ID: {proposal.proposalNumber} | Status: {proposal.status}</div>
      </div>
    </div>
  );
};
const EmailModal = ({ open, onClose, proposal, emailData, onEmailDataChange, onSendProposal }) => {
  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Send Proposal</h3>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="email"
              value={emailData.to || proposal.clientEmail}
              onChange={(e) => onEmailDataChange(prev => ({ ...prev, to: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={emailData.subject || `Proposal: ${proposal.proposalTitle}`}
              onChange={(e) => onEmailDataChange(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              rows="6"
              value={emailData.body || `Dear ${proposal.clientName},\n\nPlease find attached the proposal for your review.\n\nBest regards,\n${proposal.company}`}
              onChange={(e) => onEmailDataChange(prev => ({ ...prev, body: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onSendProposal}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
          >
            Send Proposal
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
export default EditProposalModal;