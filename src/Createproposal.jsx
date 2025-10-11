import React, { useState, useEffect, useRef } from "react";
import { 
  FaPlus, FaTrashAlt, FaSearch, FaTimes, FaFilePdf, 
  FaCalendarAlt, FaUser, FaDollarSign, FaShoppingCart,
  FaChevronDown, FaChevronUp, FaEdit, FaCopy, FaSave,
  FaPaperPlane, FaHistory, FaBuilding, FaFileAlt,
  FaCheck, FaExclamationTriangle, FaPercent, FaReceipt
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const CreateProposal = () => {
  // State management
  const [proposal, setProposal] = useState({
    proposalNumber: `PROP-${Date.now()}`,
    clientId: "",
    clientName: "",
    clientEmail: "",
    company: "Your Company Name",
    proposalTitle: "",
    proposalDate: new Date().toISOString().split('T')[0],
    validUntil: "",
    terms: "",
    notes: "",
    discount: 0,
    taxRate: 10,
    status: "draft"
  });
  
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [clients, setClients] = useState([]);
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
  const [isLoading, setIsLoading] = useState(true);
  const [savedProposals, setSavedProposals] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [viewMode, setViewMode] = useState("create");
  const [autoSaveStatus, setAutoSaveStatus] = useState("saved");
  const [activityLog, setActivityLog] = useState([]);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", company: "" });
  const [emailData, setEmailData] = useState({ subject: "", body: "", to: "" });
  const [collapsedSections, setCollapsedSections] = useState({});

  const autoSaveTimeoutRef = useRef(null);

  // Sample data initialization
  useEffect(() => {
    // Simulate API calls
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

      setClients([
        { id: 1, name: "John Smith", email: "john@example.com", phone: "+1-555-0101", company: "Smith Corp" },
        { id: 2, name: "Sarah Johnson", email: "sarah@example.com", phone: "+1-555-0102", company: "Johnson LLC" },
        { id: 3, name: "Mike Wilson", email: "mike@example.com", phone: "+1-555-0103", company: "Wilson Industries" }
      ]);

      setTemplates([
        { id: 1, name: "Standard Proposal", terms: "Payment due within 30 days. 50% deposit required." },
        { id: 2, name: "Contractor Agreement", terms: "Milestone-based payments. Materials included." },
        { id: 3, name: "Quick Quote", terms: "Valid for 15 days. Simple terms and conditions." }
      ]);

      setActivityLog([
        { id: 1, action: "Created", user: "You", timestamp: new Date().toISOString(), details: "Proposal created" }
      ]);

      setIsLoading(false);
    }, 800);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (viewMode === "create") {
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
  }, [proposal, selectedProducts]);

  const handleAutoSave = () => {
    // Simulate auto-save
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
    const taxable = taxToggle[product.id] !== false; // Default to true
    
    if (quantity <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    const existingProductIndex = selectedProducts.findIndex(p => p.id === product.id);
    
    if (existingProductIndex >= 0) {
      // Update quantity if product already exists
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingProductIndex].quantity += quantity;
      setSelectedProducts(updatedProducts);
    } else {
      // Add new product
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
    setClients(prev => [...prev, newClientWithId]);
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

  // Apply template
  const handleApplyTemplate = (template) => {
    setProposal(prev => ({
      ...prev,
      terms: template.terms
    }));
    setIsTemplateModalOpen(false);
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
    const newProposal = {
      id: Date.now(),
      ...proposal,
      status,
      products: [...selectedProducts],
      subtotal,
      totalDiscount,
      taxAmount,
      grandTotal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setSavedProposals(prev => [newProposal, ...prev]);
    setAutoSaveStatus("saved");
    addActivityLog(`Proposal ${status === "draft" ? "saved as draft" : "saved"}`, "You");
    alert(`Proposal ${status === "draft" ? "saved as draft" : "saved"} successfully!`);
  };

  // Send proposal via email
  const handleSendProposal = () => {
    // Simulate email sending
    setIsEmailModalOpen(false);
    addActivityLog("Proposal sent via email", "You", `To: ${emailData.to}`);
    alert(`Proposal sent to ${emailData.to}`);
  };

  // Save as template
  const handleSaveAsTemplate = () => {
    const newTemplate = {
      id: Date.now(),
      name: `${proposal.proposalTitle || "Untitled"} Template`,
      terms: proposal.terms,
      notes: proposal.notes
    };
    setTemplates(prev => [...prev, newTemplate]);
    setIsTemplateModalOpen(false);
    addActivityLog("Template saved", "You");
    alert("Template saved successfully!");
  };

  // Convert to invoice
  const handleConvertToInvoice = () => {
    addActivityLog("Converted to invoice", "You");
    alert("Proposal converted to invoice successfully!");
  };

  // Load a saved proposal
  const handleLoadProposal = (savedProposal) => {
    setProposal({
      proposalNumber: savedProposal.proposalNumber,
      clientId: savedProposal.clientId,
      clientName: savedProposal.clientName,
      clientEmail: savedProposal.clientEmail,
      company: savedProposal.company,
      proposalTitle: savedProposal.proposalTitle,
      proposalDate: savedProposal.proposalDate,
      validUntil: savedProposal.validUntil,
      terms: savedProposal.terms,
      notes: savedProposal.notes,
      discount: savedProposal.discount,
      taxRate: savedProposal.taxRate,
      status: savedProposal.status
    });
    setSelectedProducts([...savedProposal.products]);
    setViewMode("create");
    addActivityLog("Proposal loaded", "You");
  };

  // Reset form
  const handleResetForm = () => {
    if (window.confirm("Are you sure you want to reset the form? All unsaved changes will be lost.")) {
      setProposal({
        proposalNumber: `PROP-${Date.now()}`,
        clientId: "",
        clientName: "",
        clientEmail: "",
        company: "Your Company Name",
        proposalTitle: "",
        proposalDate: new Date().toISOString().split('T')[0],
        validUntil: "",
        terms: "",
        notes: "",
        discount: 0,
        taxRate: 10,
        status: "draft"
      });
      setSelectedProducts([]);
      addActivityLog("Form reset", "You");
    }
  };

  // Toggle section collapse
  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {viewMode === "create" ? "Create Proposal" : "Preview Proposal"}
            </h1>
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
            </div>
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
              onClick={() => handleSaveProposal("draft")}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition duration-200 flex items-center"
              disabled={selectedProducts.length === 0}
            >
              <FaSave className="mr-2" /> Save Draft
            </button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Proposal Details */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header Section */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6"
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
                      <button
                        onClick={() => setIsClientModalOpen(true)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                        disabled={viewMode === "preview"}
                      >
                        <FaPlus />
                      </button>
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
                </div>
              )}
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
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleSection('products')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {collapsedSections.products ? <FaChevronDown /> : <FaChevronUp />}
                  </button>
                  {viewMode === "create" && (
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
                            <th className="text-left p-3 text-sm font-medium text-gray-600">Item Name</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-600">Qty</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-600">Unit Price</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-600">Discount %</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-600">Tax</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-600">Line Total</th>
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
                                  {viewMode === "create" ? (
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
                                  {viewMode === "create" ? (
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
                                  {viewMode === "create" ? (
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
                </>
              )}
            </motion.div>

            {/* Terms and Notes */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Terms & Notes</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleSection('terms')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {collapsedSections.terms ? <FaChevronDown /> : <FaChevronUp />}
                  </button>
                  {viewMode === "create" && (
                    <button
                      onClick={() => setIsTemplateModalOpen(true)}
                      className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition duration-200 flex items-center"
                    >
                      <FaFileAlt className="mr-1" /> Templates
                    </button>
                  )}
                </div>
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
              
              {viewMode === "create" && (
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

                {viewMode === "create" && (
                  <>
                    <button
                      onClick={() => setIsEmailModalOpen(true)}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition duration-200 flex items-center justify-center font-medium"
                      disabled={selectedProducts.length === 0 || !proposal.clientEmail}
                    >
                      <FaPaperPlane className="mr-2" /> Send Proposal
                    </button>
                    
                    <button
                      onClick={() => handleSaveAsTemplate()}
                      className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition duration-200 flex items-center justify-center font-medium"
                    >
                      <FaSave className="mr-2" /> Save as Template
                    </button>
                    
                    <button
                      onClick={handleConvertToInvoice}
                      className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition duration-200 flex items-center justify-center font-medium"
                      disabled={selectedProducts.length === 0}
                    >
                      <FaReceipt className="mr-2" /> Convert to Invoice
                    </button>
                    
                    <button
                      onClick={handleResetForm}
                      className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition duration-200 font-medium"
                    >
                      Reset Form
                    </button>
                  </>
                )}
              </div>
            </motion.div>

            {/* Activity / History */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6"
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

            {/* Saved Proposals */}
            {savedProposals.length > 0 && (
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Saved Proposals</h2>
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {savedProposals.map((saved) => (
                    <div key={saved.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="font-medium text-gray-900 truncate">
                        {saved.proposalTitle || "Untitled Proposal"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {saved.clientName} • {formatCurrency(saved.grandTotal)}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          saved.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {saved.status}
                        </span>
                        <button
                          onClick={() => handleLoadProposal(saved)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Load
                        </button>
                      </div>
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
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div>
                            <label className="text-xs text-gray-700">Qty:</label>
                            <input
                              type="number"
                              min="1"
                              value={quantityInputs[product.id] || 1}
                              onChange={(e) => handleQuantityChange(product.id, e.target.value)}
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
                              onChange={(e) => handlePriceChange(product.id, e.target.value)}
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
                              onChange={(e) => handleDiscountChange(product.id, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                            />
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center text-xs">
                              <input
                                type="checkbox"
                                checked={taxToggle[product.id] !== false}
                                onChange={() => handleTaxToggle(product.id)}
                                className="mr-1"
                              />
                              Taxable
                            </label>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddProduct(product)}
                          className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                        >
                          <FaPlus className="mr-1" /> Add to Proposal
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 flex justify-between items-center">
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

      {/* Add Client Modal */}
      <AnimatePresence>
        {isClientModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsClientModalOpen(false)}
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
                    onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Client name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="client@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={newClient.company}
                    onChange={(e) => setNewClient(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Company name"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddClient}
                  disabled={!newClient.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add Client
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Preview Modal */}
      <AnimatePresence>
        {isPdfPreviewOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsPdfPreviewOpen(false)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-screen overflow-hidden flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">PDF Preview</h3>
                <button
                  onClick={() => setIsPdfPreviewOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition duration-200"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {/* PDF Preview Content */}
                <div className="bg-white border border-gray-300 p-8 max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{proposal.company}</h1>
                    <p className="text-gray-600">PROPOSAL</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <h2 className="text-lg font-semibold mb-2">From:</h2>
                      <p>{proposal.company}</p>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold mb-2">To:</h2>
                      <p>{proposal.clientName}</p>
                      <p>{proposal.clientEmail}</p>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">{proposal.proposalTitle}</h2>
                      <div className="text-right">
                        <p><strong>Proposal #:</strong> {proposal.proposalNumber}</p>
                        <p><strong>Date:</strong> {proposal.proposalDate}</p>
                        <p><strong>Valid Until:</strong> {proposal.validUntil}</p>
                      </div>
                    </div>
                  </div>
                  
                  <table className="w-full mb-8">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left py-2">Item</th>
                        <th className="text-right py-2">Qty</th>
                        <th className="text-right py-2">Price</th>
                        <th className="text-right py-2">Discount</th>
                        <th className="text-right py-2">Tax</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProducts.map((product) => (
                        <tr key={product.id} className="border-b border-gray-200">
                          <td className="py-3">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-600">{product.category}</div>
                          </td>
                          <td className="text-right py-3">{product.quantity}</td>
                          <td className="text-right py-3">{formatCurrency(product.unitPrice)}</td>
                          <td className="text-right py-3">{product.discount}%</td>
                          <td className="text-right py-3">{product.taxable ? "Yes" : "No"}</td>
                          <td className="text-right py-3 font-medium">{formatCurrency(product.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="flex justify-end mb-8">
                    <div className="w-64">
                      <div className="flex justify-between py-2">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between py-2 text-red-600">
                        <span>Discounts:</span>
                        <span>-{formatCurrency(totalDiscount)}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span>Tax ({proposal.taxRate}%):</span>
                        <span>{formatCurrency(taxAmount)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-t border-gray-300 font-bold text-lg">
                        <span>Grand Total:</span>
                        <span>{formatCurrency(grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {proposal.terms && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Terms & Conditions</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{proposal.terms}</p>
                    </div>
                  )}
                  
                  {proposal.notes && (
                    <div>
                      <h3 className="font-semibold mb-2">Notes</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{proposal.notes}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setIsPdfPreviewOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-200 mr-3"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // In a real app, this would generate and download the PDF
                    alert("PDF generated and downloaded successfully!");
                    setIsPdfPreviewOpen(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Download PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Modal */}
      <AnimatePresence>
        {isEmailModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsEmailModalOpen(false)}
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
                    onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailData.subject || `Proposal: ${proposal.proposalTitle}`}
                    onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    rows="6"
                    value={emailData.body || `Dear ${proposal.clientName},\n\nPlease find attached the proposal for your review.\n\nBest regards,\n${proposal.company}`}
                    onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendProposal}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                >
                  Send Proposal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template Modal */}
      <AnimatePresence>
        {isTemplateModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsTemplateModalOpen(false)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Select Template</h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{template.terms}</p>
                        </div>
                        <button
                          onClick={() => handleApplyTemplate(template)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition duration-200"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-200"
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