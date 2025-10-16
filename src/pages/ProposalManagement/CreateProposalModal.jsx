import React, { useState, useEffect, useRef } from "react";
import { 
  FaPlus, FaTrashAlt, FaSearch, FaTimes, FaFilePdf, 
  FaCalendarAlt, FaUser, FaDollarSign, FaShoppingCart,
  FaChevronDown, FaChevronUp, FaEdit, FaCopy, FaSave,
  FaPaperPlane, FaHistory, FaBuilding, FaFileAlt,
  FaCheck, FaExclamationTriangle, FaPercent, FaReceipt,
  FaSpinner, FaIndustry, FaFileInvoice, FaSignature,
  FaDownload
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import ProductSelectionModal from "./ProductSelectionModal";
import { downloadProposalPdf } from "./DownloadProposal"; // Make sure this import is present

const CreateProposalModal = ({ 
  open, 
  onClose,
  onAddClient,
  onSave,
  clients = [],
  availableProducts = []
}) => {
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
    status: "draft",
    templateType: "simple", // ADDED: Template type
    documentNumber: "", // ADDED: For Technical RFQ
    companyDetails: { // ADDED: For Technical RFQ
      name: "",
      address: "",
      phone: "",
      email: "",
      bankAccount: "",
      mfo: "",
      taxId: "",
      oked: ""
    },
    deliveryTerms: { // ADDED: For Technical RFQ
      paymentTerms: "50% prepayment",
      deliveryTime: "6-8 weeks",
      incoterms: "DDP"
    },
    authorizedSignatory: { // ADDED: For Technical RFQ
      title: "General manager",
      name: ""
    }
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
  const [toast, setToast] = useState(null);

  // ADDED: Technical RFQ specific state
  const [rfqItems, setRfqItems] = useState([]);
  const [currentRfqItem, setCurrentRfqItem] = useState({
    description: "",
    technicalDescription: "",
    manufacturer: "",
    partNumber: "",
    unit: "each",
    quantity: 1,
    willBeSupplied: "",
    specifications: [""],
    imageUrl: ""
  });

  const autoSaveTimeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  // Initialize data
  useEffect(() => {
    if (open) {
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
        status: "draft",
        templateType: "simple",
        documentNumber: "",
        companyDetails: {
          name: "LLC «ELECTRO-MECHANICAL CONSTRUCTION TECHNOLOGY»",
          address: "",
          phone: "",
          email: "",
          bankAccount: "",
          mfo: "",
          taxId: "",
          oked: ""
        },
        deliveryTerms: {
          paymentTerms: "50% prepayment",
          deliveryTime: "6-8 weeks",
          incoterms: "DDP"
        },
        authorizedSignatory: {
          title: "General manager",
          name: ""
        }
      });
      setSelectedProducts([]);
      setRfqItems([]);
      setActivityLog([{ 
        id: 1, 
        action: "Created", 
        user: "You", 
        timestamp: new Date().toISOString(), 
        details: "Proposal created" 
      }]);
    }
  }, [open]);

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
  }, [proposal, selectedProducts, rfqItems, open]);

  // Toast cleanup
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleAutoSave = () => {
    setAutoSaveStatus("saved");
    addActivityLog("Auto-saved", "System");
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  useEffect(() => {
    if (open) {
      console.log('Available products in modal:', availableProducts);
      console.log('Available products count:', availableProducts.length);
    }
  }, [open, availableProducts]);

  const filteredProducts = availableProducts.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle proposal input changes
  const handleProposalChange = (e) => {
    const { name, value } = e.target;
    setProposal(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ADDED: Handle nested object changes for Technical RFQ
  const handleNestedChange = (section, field, value) => {
    setProposal(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Handle client selection
  const handleClientSelect = (clientId) => {
    const client = clients.find(c => c.id === clientId || c.id === parseInt(clientId));
    if (client) {
      setProposal(prev => ({
        ...prev,
        clientId: client.id.toString(),
        clientName: client.name || client.company || "",
        clientEmail: client.email || ""
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
    const unitPrice = parseFloat(priceInputs[product.id]) || product.price || 0;
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
    
    showToast(`Added ${product.name} to proposal`, 'success');
  };

  // ADDED: Handle Technical RFQ item changes
  const handleRfqItemChange = (field, value) => {
    setCurrentRfqItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ADDED: Handle RFQ specification changes
  const handleRfqSpecificationChange = (index, value) => {
    const updatedSpecs = [...currentRfqItem.specifications];
    updatedSpecs[index] = value;
    setCurrentRfqItem(prev => ({
      ...prev,
      specifications: updatedSpecs
    }));
  };

  // ADDED: Add RFQ specification field
  const addRfqSpecification = () => {
    setCurrentRfqItem(prev => ({
      ...prev,
      specifications: [...prev.specifications, ""]
    }));
  };

  // ADDED: Remove RFQ specification field
  const removeRfqSpecification = (index) => {
    if (currentRfqItem.specifications.length > 1) {
      const updatedSpecs = currentRfqItem.specifications.filter((_, i) => i !== index);
      setCurrentRfqItem(prev => ({
        ...prev,
        specifications: updatedSpecs
      }));
    }
  };

  // ADDED: Add RFQ item
  const addRfqItem = () => {
    if (!currentRfqItem.description) {
      showToast('Item description is required', 'error');
      return;
    }

    const newItem = {
      ...currentRfqItem,
      id: Date.now(),
      itemNumber: rfqItems.length + 1
    };

    setRfqItems(prev => [...prev, newItem]);
    
    // Reset current item
    setCurrentRfqItem({
      description: "",
      technicalDescription: "",
      manufacturer: "",
      partNumber: "",
      unit: "each",
      quantity: 1,
      willBeSupplied: "",
      specifications: [""],
      imageUrl: ""
    });

    showToast('Technical item added successfully', 'success');
  };

  // ADDED: Remove RFQ item
  const removeRfqItem = (itemId) => {
    setRfqItems(prev => prev.filter(item => item.id !== itemId));
    showToast('Technical item removed', 'info');
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
    showToast('Product removed from proposal', 'info');
  };

  // Duplicate a product
  const handleDuplicateProduct = (product) => {
    const newProduct = {
      ...product,
      id: Date.now()
    };
    setSelectedProducts(prev => [...prev, newProduct]);
    showToast('Product duplicated', 'success');
  };

  // Add new client
  const handleAddClient = async () => {
    if (!newClient.name) {
      showToast('Client name is required', 'error');
      return;
    }

    try {
      const newClientId = await onAddClient(newClient);
      
      setProposal(prev => ({
        ...prev,
        clientId: newClientId,
        clientName: newClient.name,
        clientEmail: newClient.email
      }));
      
      setNewClient({ name: "", email: "", phone: "", company: "" });
      setIsClientModalOpen(false);
      addActivityLog("Client added", "You");
      showToast('Client added successfully', 'success');
    } catch (error) {
      console.error('Error adding client:', error);
      showToast('Error adding client: ' + error.message, 'error');
    }
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
    if (proposal.templateType === 'technical-rfq' && rfqItems.length === 0) {
      showToast('Please add technical items before generating PDF', 'error');
      return;
    }
    if (proposal.templateType === 'simple' && selectedProducts.length === 0) {
      showToast('Please add products before generating PDF', 'error');
      return;
    }
    setIsPdfPreviewOpen(true);
    addActivityLog("PDF preview generated", "You");
    showToast('PDF preview generated', 'success');
  };

  // Save proposal
  const handleSaveProposal = async (status = 'draft') => {
    // Validate based on template type
    if (proposal.templateType === 'simple' && selectedProducts.length === 0) {
      showToast('Please add at least one product to the proposal', 'error');
      return;
    }

    if (proposal.templateType === 'technical-rfq' && rfqItems.length === 0) {
      showToast('Please add at least one technical item to the proposal', 'error');
      return;
    }

    if (!proposal.clientId) {
      showToast('Please select a client for the proposal', 'error');
      return;
    }

    try {
      let proposalData;

      if (proposal.templateType === 'technical-rfq') {
        // Technical RFQ data structure
        proposalData = {
          ...proposal,
          status: status,
          items: rfqItems,
          // Include simple products as fallback if needed
          products: selectedProducts,
          subtotal: subtotal,
          totalDiscount: totalDiscount,
          taxAmount: taxAmount,
          grandTotal: grandTotal
        };
      } else {
        // Simple proposal data structure
        proposalData = {
          proposalNumber: proposal.proposalNumber,
          clientId: proposal.clientId,
          client: proposal.clientName,
          company: proposal.company,
          proposalTitle: proposal.proposalTitle,
          proposalDate: proposal.proposalDate,
          validUntil: proposal.validUntil,
          terms: proposal.terms,
          notes: proposal.notes,
          taxRate: proposal.taxRate,
          status: status,
          templateType: proposal.templateType,
          products: selectedProducts.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            discount: p.discount,
            taxable: p.taxable,
            lineTotal: p.lineTotal
          })),
          subtotal: subtotal,
          totalDiscount: totalDiscount,
          taxAmount: taxAmount,
          grandTotal: grandTotal
        };
      }

      await onSave(proposalData);
      showToast(`Proposal ${status === 'draft' ? 'saved as draft' : 'saved'} successfully!`, 'success');
      
      if (status === 'sent') {
        onClose();
      }
    } catch (error) {
      showToast('Error saving proposal: ' + error.message, 'error');
    }
  };

  // Send proposal via email
  const handleSendProposal = () => {
    if (!emailData.to && !proposal.clientEmail) {
      showToast('Please enter an email address', 'error');
      return;
    }
    
    setIsEmailModalOpen(false);
    addActivityLog("Proposal sent via email", "You", `To: ${emailData.to || proposal.clientEmail}`);
    handleSaveProposal("sent");
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
        status: "draft",
        templateType: "simple",
        documentNumber: "",
        companyDetails: {
          name: "LLC «ELECTRO-MECHANICAL CONSTRUCTION TECHNOLOGY»",
          address: "",
          phone: "",
          email: "",
          bankAccount: "",
          mfo: "",
          taxId: "",
          oked: ""
        },
        deliveryTerms: {
          paymentTerms: "50% prepayment",
          deliveryTime: "6-8 weeks",
          incoterms: "DDP"
        },
        authorizedSignatory: {
          title: "General manager",
          name: ""
        }
      });
      setSelectedProducts([]);
      setRfqItems([]);
      addActivityLog("Form reset", "You");
      showToast('Form reset successfully', 'info');
    }
  };

  // Toggle section collapse
  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!open) return null;

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
            <h3 className="text-2xl font-bold text-gray-900">Create New Proposal</h3>
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
              {/* Template Selection */}
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <FaFileAlt className="mr-2 text-blue-500" /> Proposal Template
                  </h2>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Type
                  </label>
                  <select
                    value={proposal.templateType || 'simple'}
                    onChange={(e) => handleProposalChange(e)}
                    name="templateType"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="simple">Simple Proposal</option>
                    <option value="technical-rfq">Technical RFQ</option>
                  </select>
                </div>

                {/* Technical RFQ Fields */}
                {proposal.templateType === 'technical-rfq' && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                      <FaIndustry className="mr-2" /> Technical RFQ Details
                    </h4>
                    
                    {/* Document Number */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Document Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={proposal.documentNumber || ''}
                          onChange={(e) => handleProposalChange(e)}
                          name="documentNumber"
                          placeholder="e.g., 50/63440"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Legal Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={proposal.companyDetails?.name || ''}
                          onChange={(e) => handleNestedChange('companyDetails', 'name', e.target.value)}
                          placeholder="LLC «COMPANY NAME»"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    {/* Company Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Address
                        </label>
                        <input
                          type="text"
                          value={proposal.companyDetails?.address || ''}
                          onChange={(e) => handleNestedChange('companyDetails', 'address', e.target.value)}
                          placeholder="Full company address"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="text"
                          value={proposal.companyDetails?.phone || ''}
                          onChange={(e) => handleNestedChange('companyDetails', 'phone', e.target.value)}
                          placeholder="+998 90 122 55 16"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    {/* Bank Details */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bank Account
                        </label>
                        <input
                          type="text"
                          value={proposal.companyDetails?.bankAccount || ''}
                          onChange={(e) => handleNestedChange('companyDetails', 'bankAccount', e.target.value)}
                          placeholder="2020 8000 0052 8367 7001"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          MFO
                        </label>
                        <input
                          type="text"
                          value={proposal.companyDetails?.mfo || ''}
                          onChange={(e) => handleNestedChange('companyDetails', 'mfo', e.target.value)}
                          placeholder="00419"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tax ID
                        </label>
                        <input
                          type="text"
                          value={proposal.companyDetails?.taxId || ''}
                          onChange={(e) => handleNestedChange('companyDetails', 'taxId', e.target.value)}
                          placeholder="307 738 207"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    {/* Delivery Terms */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Terms
                        </label>
                        <input
                          type="text"
                          value={proposal.deliveryTerms?.paymentTerms || ''}
                          onChange={(e) => handleNestedChange('deliveryTerms', 'paymentTerms', e.target.value)}
                          placeholder="50% prepayment"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delivery Time
                        </label>
                        <input
                          type="text"
                          value={proposal.deliveryTerms?.deliveryTime || ''}
                          onChange={(e) => handleNestedChange('deliveryTerms', 'deliveryTime', e.target.value)}
                          placeholder="6-8 weeks"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Incoterms
                        </label>
                        <select
                          value={proposal.deliveryTerms?.incoterms || 'DDP'}
                          onChange={(e) => handleNestedChange('deliveryTerms', 'incoterms', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="DDP">DDP</option>
                          <option value="FOB">FOB</option>
                          <option value="CIF">CIF</option>
                          <option value="EXW">EXW</option>
                        </select>
                      </div>
                    </div>

                    {/* Authorized Signatory */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Signatory Title
                        </label>
                        <input
                          type="text"
                          value={proposal.authorizedSignatory?.title || ''}
                          onChange={(e) => handleNestedChange('authorizedSignatory', 'title', e.target.value)}
                          placeholder="General manager"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Signatory Name
                        </label>
                        <input
                          type="text"
                          value={proposal.authorizedSignatory?.name || ''}
                          onChange={(e) => handleNestedChange('authorizedSignatory', 'name', e.target.value)}
                          placeholder="S.S. Abdushukurov"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

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
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                      <div className="flex gap-2">
                        <select
                          value={proposal.clientId}
                          onChange={(e) => handleClientSelect(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select a client</option>
                          {clients.map(client => (
                            <option key={client.id} value={client.id}>
                              {client.name || client.company} - {client.email}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setIsClientModalOpen(true)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
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
                      />
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Product/Item Selection based on Template Type */}
              {proposal.templateType === 'simple' ? (
                // Simple Proposal Product Selection
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
                      <button
                        onClick={() => setIsProductModalOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center"
                      >
                        <FaPlus className="mr-2" /> Add Products
                      </button>
                    </div>
                  </div>
                  
                  {!collapsedSections.products && (
                    <>
                      {selectedProducts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FaShoppingCart className="text-4xl mx-auto mb-3 text-gray-300" />
                          <p>No products added to the proposal yet.</p>
                          <button
                            onClick={() => setIsProductModalOpen(true)}
                            className="text-blue-600 hover:text-blue-800 mt-2"
                          >
                            Click here to add products
                          </button>
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
                                <th className="text-left p-3 text-sm font-medium text-gray-600">Actions</th>
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
                                      <input
                                        type="number"
                                        min="1"
                                        value={product.quantity}
                                        onChange={(e) => handleUpdateProduct(product.id, 'quantity', parseInt(e.target.value) || 1)}
                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                      />
                                    </td>
                                    <td className="p-3">
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={product.unitPrice}
                                        onChange={(e) => handleUpdateProduct(product.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                        className="w-24 px-2 py-1 border border-gray-300 rounded"
                                      />
                                    </td>
                                    <td className="p-3">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={product.discount}
                                        onChange={(e) => handleUpdateProduct(product.id, 'discount', parseFloat(e.target.value) || 0)}
                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                      />
                                    </td>
                                    <td className="p-3">
                                      <label className="flex items-center">
                                        <input
                                          type="checkbox"
                                          checked={product.taxable}
                                          onChange={() => handleUpdateProduct(product.id, 'taxable', !product.taxable)}
                                          className="mr-2"
                                        />
                                        Taxable
                                      </label>
                                    </td>
                                    <td className="p-3 font-semibold">{formatCurrency(product.lineTotal)}</td>
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
              ) : (
                // Technical RFQ Item Selection
                <motion.div
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                      <FaIndustry className="mr-2 text-blue-500" /> Technical Items
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleSection('rfqItems')}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {collapsedSections.rfqItems ? <FaChevronDown /> : <FaChevronUp />}
                      </button>
                    </div>
                  </div>
                  
                  {!collapsedSections.rfqItems && (
                    <>
                      {/* Add New Technical Item Form */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <h4 className="font-semibold text-gray-800 mb-3">Add Technical Item</h4>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description (CAPS) *
                            </label>
                            <input
                              type="text"
                              value={currentRfqItem.description}
                              onChange={(e) => handleRfqItemChange('description', e.target.value.toUpperCase())}
                              placeholder="CERABAR PMP51B - PRESSURE TRANSMITTER"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Technical Description
                            </label>
                            <input
                              type="text"
                              value={currentRfqItem.technicalDescription}
                              onChange={(e) => handleRfqItemChange('technicalDescription', e.target.value)}
                              placeholder="Cerabar PMP51B - pressure transmitter PMP51B-AABADBH6AA3PCA1VNJA1+VDZ1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Manufacturer/OEM
                            </label>
                            <input
                              type="text"
                              value={currentRfqItem.manufacturer}
                              onChange={(e) => handleRfqItemChange('manufacturer', e.target.value)}
                              placeholder="Endress+ Hauser"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Part Number
                            </label>
                            <input
                              type="text"
                              value={currentRfqItem.partNumber}
                              onChange={(e) => handleRfqItemChange('partNumber', e.target.value)}
                              placeholder="PMP51B-AABADBH6AA3PCA1VNJA1+VDZ1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Unit
                            </label>
                            <select
                              value={currentRfqItem.unit}
                              onChange={(e) => handleRfqItemChange('unit', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="each">each</option>
                              <option value="set">set</option>
                              <option value="piece">piece</option>
                              <option value="meter">meter</option>
                              <option value="kg">kg</option>
                              <option value="liter">liter</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={currentRfqItem.quantity}
                              onChange={(e) => handleRfqItemChange('quantity', parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Will be Supplied
                            </label>
                            <input
                              type="text"
                              value={currentRfqItem.willBeSupplied}
                              onChange={(e) => handleRfqItemChange('willBeSupplied', e.target.value)}
                              placeholder="Alternative description"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>

                        {/* Specifications */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Technical Specifications
                          </label>
                          {currentRfqItem.specifications.map((spec, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={spec}
                                onChange={(e) => handleRfqSpecificationChange(index, e.target.value)}
                                placeholder="e.g., Pressure: 1.6MPa"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                              />
                              <button
                                onClick={() => removeRfqSpecification(index)}
                                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                disabled={currentRfqItem.specifications.length === 1}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={addRfqSpecification}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            Add Specification
                          </button>
                        </div>

                        <button
                          onClick={addRfqItem}
                          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                          disabled={!currentRfqItem.description}
                        >
                          Add Technical Item
                        </button>
                      </div>

                      {/* Technical Items List */}
                      {rfqItems.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FaFileInvoice className="text-4xl mx-auto mb-3 text-gray-300" />
                          <p>No technical items added yet.</p>
                          <p className="text-sm">Use the form above to add technical items</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-800">Added Items ({rfqItems.length})</h4>
                          {rfqItems.map((item, index) => (
                            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h5 className="font-semibold text-gray-900">{item.description}</h5>
                                  <p className="text-sm text-gray-600">{item.technicalDescription}</p>
                                </div>
                                <button
                                  onClick={() => removeRfqItem(item.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <FaTrashAlt />
                                </button>
                              </div>
                              <div className="grid grid-cols-4 gap-4 text-sm">
                                <div><strong>Manufacturer:</strong> {item.manufacturer}</div>
                                <div><strong>Part No:</strong> {item.partNumber}</div>
                                <div><strong>Qty:</strong> {item.quantity} {item.unit}</div>
                                <div><strong>Will Supply:</strong> {item.willBeSupplied}</div>
                              </div>
                              {item.specifications.some(spec => spec.trim()) && (
                                <div className="mt-2">
                                  <strong className="text-sm">Specifications:</strong>
                                  <ul className="text-sm text-gray-600 list-disc list-inside">
                                    {item.specifications.filter(spec => spec.trim()).map((spec, idx) => (
                                      <li key={idx}>{spec}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

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
                
                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleGeneratePDF}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center font-medium"
                    disabled={
                      (proposal.templateType === 'simple' && selectedProducts.length === 0) ||
                      (proposal.templateType === 'technical-rfq' && rfqItems.length === 0)
                    }
                  >
                    <FaFilePdf className="mr-2" /> Preview PDF
                  </button>

                  <button
                    onClick={() => handleSaveProposal("draft")}
                    className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition duration-200 flex items-center justify-center font-medium"
                    disabled={
                      (proposal.templateType === 'simple' && selectedProducts.length === 0) ||
                      (proposal.templateType === 'technical-rfq' && rfqItems.length === 0)
                    }
                  >
                    <FaSave className="mr-2" /> Save Draft
                  </button>

                  <button
                    onClick={() => {
                      if ((proposal.templateType === 'simple' && selectedProducts.length === 0) ||
                          (proposal.templateType === 'technical-rfq' && rfqItems.length === 0)) {
                        showToast(`Please add ${proposal.templateType === 'simple' ? 'products' : 'technical items'} before sending`, 'error');
                        return;
                      }
                      if (!proposal.clientEmail && !proposal.clientId) {
                        showToast('Please select a client before sending', 'error');
                        return;
                      }
                      setIsEmailModalOpen(true);
                    }}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition duration-200 flex items-center justify-center font-medium"
                  >
                    <FaPaperPlane className="mr-2" /> Send Proposal
                  </button>
                  
                  <button
                    onClick={handleResetForm}
                    className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition duration-200 font-medium"
                  >
                    Reset Form
                  </button>
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
            <button
              onClick={() => handleSaveProposal("draft")}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200 font-medium"
              disabled={
                (proposal.templateType === 'simple' && selectedProducts.length === 0) ||
                (proposal.templateType === 'technical-rfq' && rfqItems.length === 0)
              }
            >
              Save Draft
            </button>
            <button
              onClick={() => handleSaveProposal("sent")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
              disabled={
                (proposal.templateType === 'simple' && selectedProducts.length === 0) ||
                (proposal.templateType === 'technical-rfq' && rfqItems.length === 0)
              }
            >
              Save & Send
            </button>
          </div>
        </div>
      </motion.div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-60 ${
              toast.type === 'error' ? 'bg-red-500 text-white' :
              toast.type === 'success' ? 'bg-green-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            <div className="flex items-center">
              {toast.type === 'error' && <FaExclamationTriangle className="mr-2" />}
              {toast.type === 'success' && <FaCheck className="mr-2" />}
              <span>{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Selection Modal */}
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

      {/* Add Client Modal */}
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

      {/* PDF Preview Modal */}
      <AnimatePresence>
        {isPdfPreviewOpen && (
          <PDFPreviewModal
            open={isPdfPreviewOpen}
            onClose={() => setIsPdfPreviewOpen(false)}
            proposal={proposal}
            selectedProducts={selectedProducts}
            rfqItems={rfqItems}
            subtotal={subtotal}
            totalDiscount={totalDiscount}
            taxAmount={taxAmount}
            grandTotal={grandTotal}
            formatCurrency={formatCurrency}
          />
        )}
      </AnimatePresence>

      {/* Email Modal */}
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

// Sub-components (ClientModal, PDFPreviewModal, EmailModal) remain the same
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

export default CreateProposalModal;