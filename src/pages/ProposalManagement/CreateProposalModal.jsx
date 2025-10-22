import React, { useState, useEffect, useRef } from "react";
import { 
  FaPlus, FaTrashAlt, FaSearch, FaTimes, FaFilePdf, 
  FaCalendarAlt, FaUser, FaDollarSign, FaShoppingCart,
  FaChevronDown, FaChevronUp, FaEdit, FaCopy, FaSave,
  FaPaperPlane, FaHistory, FaBuilding, FaFileAlt,
  FaCheck, FaExclamationTriangle, FaPercent, FaReceipt,
  FaSpinner, FaIndustry, FaFileInvoice, FaSignature,
  FaDownload, FaImage, FaFileContract, FaInfoCircle
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import ProductSelectionModal from "./ProductSelectionModal";
import { downloadProposalPdf } from "./DownloadProposal";

const CreateProposalModal = ({ 
  open, 
  onClose,
  onAddClient,
  onSave,
  clients = [],
  availableProducts = []
}) => {
  // Company configurations
  const companyConfigs = {
    emctech: {
      name: "LLC «ELECTRO-MECHANICAL CONSTRUCTION TECHNOLOGY»",
      shortName: "EMC Technology (emctech.uz)",
      address: "Tashkent city, Yunusabad district, Bogishamol 21B",
      phone: "+998 90 122 55 18",
      email: "info@emctech.uz",
      bankAccount: "2020 8000 0052 8367 7001",
      mfo: "00419",
      taxId: "307 738 207",
      oked: "43299",
      signatory: {
        title: "General manager",
        name: "S.S. Abdushukurov"
      }
    },
    innovamechanics: {
      name: "Innova Mechanics Ltd",
      shortName: "Innova Mechanics Ltd",
      address: "Tashkent, Uzbekistan",
      phone: "+998 90 123 45 67",
      email: "info@innovamechanics.com",
      bankAccount: "To be provided",
      mfo: "To be provided",
      taxId: "To be provided",
      oked: "To be provided",
      signatory: {
        title: "Director",
        name: "Director Name"
      }
    }
  };

  // State management
  const [proposal, setProposal] = useState({
    proposalNumber: `PROP-${Date.now()}`,
    clientId: "",
    clientName: "",
    clientEmail: "",
    company: "emctech", // Default company
    companyName: companyConfigs.emctech.shortName,
    proposalTitle: "",
    proposalDate: new Date().toISOString().split('T')[0],
    validUntil: "",
    terms: "",
    notes: "",
    discount: 0,
    taxRate: 10,
    status: "draft",
    templateType: "simple-commercial",
    documentNumber: "",
    companyDetails: companyConfigs.emctech,
    deliveryTerms: {
      paymentTerms: "50% prepayment",
      deliveryTime: "6-12 weeks",
      incoterms: "DDP"
    },
    authorizedSignatory: companyConfigs.emctech.signatory
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

  // Technical RFQ specific state
  const [rfqItems, setRfqItems] = useState([]);
  const [currentRfqItem, setCurrentRfqItem] = useState({
    description: "",
    technicalDescription: "",
    manufacturer: "",
    partNumber: "",
    unit: "each",
    quantity: 1,
    unitPrice: 0,
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
        company: "emctech",
        companyName: companyConfigs.emctech.shortName,
        proposalTitle: "",
        proposalDate: new Date().toISOString().split('T')[0],
        validUntil: "",
        terms: "",
        notes: "",
        discount: 0,
        taxRate: 10,
        status: "draft",
        templateType: "simple-commercial",
        documentNumber: "",
        companyDetails: companyConfigs.emctech,
        deliveryTerms: {
          paymentTerms: "50% prepayment",
          deliveryTime: "6-12 weeks",
          incoterms: "DDP"
        },
        authorizedSignatory: companyConfigs.emctech.signatory
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

  // Handle company selection
  const handleCompanyChange = (companyKey) => {
    const selectedCompany = companyConfigs[companyKey];
    setProposal(prev => ({
      ...prev,
      company: companyKey,
      companyName: selectedCompany.shortName,
      companyDetails: { ...selectedCompany },
      authorizedSignatory: selectedCompany.signatory
    }));
    showToast(`Switched to ${selectedCompany.shortName}`, 'success');
  };

  // DEBUG: log incoming products (remove after verification)
  useEffect(() => {
    console.log('CreateProposalModal: availableProducts type/length:', Array.isArray(availableProducts) ? availableProducts.length : typeof availableProducts);
    if (Array.isArray(availableProducts) && availableProducts.length > 0) {
      console.log('CreateProposalModal: sample products:', availableProducts.slice(0, 6));
    }
  }, [availableProducts]);

  // After props/state, normalize incoming products once:
  const normalizedAvailableProducts = (availableProducts || []).map(p => ({
    ...p,
    // normalize name map -> string
    name: (typeof p?.name === "string")
      ? p.name
      : (p?.name?.EN || p?.name?.en || Object.values(p?.name || {})[0] || p?.title || p?.slug || ""),
    // normalize image field
    imageUrl: p.imageUrl || p.thumbnail || p.thumbnailUrl || (p.images && p.images[0]) || ""
  }));

  // Defensive searchTerm (if you already have a searchTerm state, keep using it)
  const normalizedSearch = (typeof searchTerm !== 'undefined' ? (searchTerm || '') : '').toString().trim().toLowerCase();

  // Compute filteredProducts defensively (won't throw if fields missing)
  const filteredProducts = normalizedAvailableProducts.filter(product => {
    if (!normalizedSearch) return true;
    const name = (product?.name || '').toString().toLowerCase();
    const category = (product?.category || '').toString().toLowerCase();
    const desc = (product?.description || '').toString().toLowerCase();
    return name.includes(normalizedSearch) || category.includes(normalizedSearch) || desc.includes(normalizedSearch);
  });

  // DEBUG: confirm filteredProducts
  useEffect(() => {
    console.log('CreateProposalModal: filteredProducts length:', filteredProducts.length);
  }, [filteredProducts]);

  // Handle proposal input changes
  const handleProposalChange = (e) => {
    const { name, value } = e.target;
    setProposal(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle nested object changes
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
    
    // Validation
    if (quantity <= 0) {
      showToast("Quantity must be greater than 0", 'error');
      return;
    }
    if (unitPrice < 0) {
      showToast("Unit price cannot be negative", 'error');
      return;
    }
    if (discount < 0 || discount > 100) {
      showToast("Discount must be between 0% and 100%", 'error');
      return;
    }

    const existingProductIndex = selectedProducts.findIndex(p => p.id === product.id);
    if (existingProductIndex >= 0) {
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingProductIndex].quantity += quantity;
      updatedProducts[existingProductIndex].lineTotal = calculateLineTotal(
        updatedProducts[existingProductIndex].unitPrice,
        updatedProducts[existingProductIndex].quantity,
        updatedProducts[existingProductIndex].discount,
        updatedProducts[existingProductIndex].taxable
      );
      setSelectedProducts(updatedProducts);
      showToast(`Product already added. Quantity updated to ${updatedProducts[existingProductIndex].quantity}.`, 'info');
    } else {
      setSelectedProducts(prev => [...prev, {
        ...product,
        imageUrl: product.imageUrl || product.thumbnail || '',
        quantity,
        unitPrice,
        discount,
        taxable,
        lineTotal: calculateLineTotal(unitPrice, quantity, discount, taxable)
      }]);
      showToast(`Added ${product.name} to proposal`, 'success');
    }
    
    // Reset inputs for this product
    setQuantityInputs(prev => ({ ...prev, [product.id]: 1 }));
    setPriceInputs(prev => ({ ...prev, [product.id]: "" }));
    setDiscountInputs(prev => ({ ...prev, [product.id]: 0 }));
    setTaxToggle(prev => ({ ...prev, [product.id]: true }));
  };

  // Handle Technical RFQ item changes
  const handleRfqItemChange = (field, value) => {
    setCurrentRfqItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle RFQ specification changes
  const handleRfqSpecificationChange = (index, value) => {
    const updatedSpecs = [...currentRfqItem.specifications];
    updatedSpecs[index] = value;
    setCurrentRfqItem(prev => ({
      ...prev,
      specifications: updatedSpecs
    }));
  };

  // Add RFQ specification field
  const addRfqSpecification = () => {
    setCurrentRfqItem(prev => ({
      ...prev,
      specifications: [...prev.specifications, ""]
    }));
  };

  // Remove RFQ specification field
  const removeRfqSpecification = (index) => {
    if (currentRfqItem.specifications.length > 1) {
      const updatedSpecs = currentRfqItem.specifications.filter((_, i) => i !== index);
      setCurrentRfqItem(prev => ({
        ...prev,
        specifications: updatedSpecs
      }));
    }
  };

  // Add RFQ item
  const addRfqItem = () => {
    if (!currentRfqItem.description || !currentRfqItem.description.trim()) {
      showToast('Item description is required', 'error');
      return;
    }
    if (currentRfqItem.quantity && currentRfqItem.quantity <= 0) {
      showToast('Quantity must be greater than 0', 'error');
      return;
    }
    if (currentRfqItem.unitPrice != null && currentRfqItem.unitPrice < 0) {
      showToast('Unit price cannot be negative', 'error');
      return;
    }

    const newItem = {
      ...currentRfqItem,
      id: Date.now(),
      itemNumber: rfqItems.length + 1,
      lineTotal: (currentRfqItem.unitPrice || 0) * (currentRfqItem.quantity || 1)
    };

    setRfqItems(prev => [...prev, newItem]);
    
    setCurrentRfqItem({
      description: "",
      technicalDescription: "",
      manufacturer: "",
      partNumber: "",
      unit: "each",
      quantity: 1,
      unitPrice: 0,
      willBeSupplied: "",
      specifications: [""],
      imageUrl: ""
    });

    showToast('Technical item added successfully', 'success');
  };

  // Remove RFQ item
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
    if (!newClient.name || !newClient.name.trim()) {
      showToast('Client name is required', 'error');
      return;
    }
    if (newClient.email && !isValidEmail(newClient.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const newClientId = await onAddClient(newClient);
      
      setProposal(prev => ({
        ...prev,
        clientId: String(newClientId),
        clientName: newClient.name,
        clientEmail: newClient.email || ''
      }));
      
      setNewClient({ name: "", email: "", phone: "", company: "" });
      setIsClientModalOpen(false);
      addActivityLog("Client added", "You");
      showToast('Client added successfully', 'success');
    } catch (error) {
      console.error('Error adding client:', error);
      showToast(`Error adding client: ${error?.message || 'Unknown error'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals based on template type
  const calculateTotals = () => {
    if (proposal.templateType === 'technical-rfq' || proposal.templateType === 'technical-with-images') {
      // Calculate totals for technical RFQ items
      const subtotal = rfqItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      const taxAmount = subtotal * (proposal.taxRate / 100);
      const grandTotal = subtotal + taxAmount;
      
      return {
        subtotal,
        totalDiscount: 0,
        taxAmount,
        grandTotal
      };
    } else {
      // Calculate totals for commercial products
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
      
      return {
        subtotal,
        totalDiscount,
        taxAmount,
        grandTotal
      };
    }
  };

  const { subtotal, totalDiscount, taxAmount, grandTotal } = calculateTotals();

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

  // Generate PDF
  const handleGeneratePDF = async () => {
    const validationErrors = validateProposalEnhanced('generate');
    if (validationErrors.length > 0) {
      showToast(validationErrors[0], 'error');
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        proposal,
        selectedProducts,
        rfqItems,
        subtotal,
        totalDiscount,
        taxAmount,
        grandTotal,
        formatCurrency
      };
      await downloadProposalPdf(payload);
      showToast('PDF generated successfully', 'success');
      addActivityLog('PDF generated', 'You');
    } catch (err) {
      console.error('Error generating PDF:', err);
      const msg = err?.message || String(err) || 'Unknown error';
      showToast(`Failed to generate PDF: ${msg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Save proposal
  const handleSaveProposal = async (status = 'draft') => {
    const action = status === 'sent' ? 'send' : 'save';
    const validationErrors = validateProposalEnhanced(action);
    if (validationErrors.length > 0) {
      showToast(validationErrors[0], 'error');
      return;
    }

    if (typeof onSave !== 'function') {
      showToast('Save handler not available', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        ...proposal,
        status,
        products: selectedProducts,
        rfqItems,
        subtotal,
        totalDiscount,
        taxAmount,
        grandTotal
      };
      await onSave(payload);
      addActivityLog(status === 'sent' ? 'Sent proposal' : 'Saved proposal', 'You');
      showToast(status === 'sent' ? 'Proposal sent successfully' : 'Proposal saved successfully', 'success');
      if (status === 'sent') setIsEmailModalOpen(false);
    } catch (err) {
      console.error('Error saving proposal:', err);
      const msg = err?.message || String(err) || 'Unknown error';
      if (/network/i.test(msg)) {
        showToast('Network error. Please check your connection and try again.', 'error');
      } else {
        showToast(`Error saving proposal: ${msg}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const handleResetForm = () => {
    if (window.confirm("Are you sure you want to reset the form? All unsaved changes will be lost.")) {
      setProposal({
        proposalNumber: `PROP-${Date.now()}`,
        clientId: "",
        clientName: "",
        clientEmail: "",
        company: "emctech",
        companyName: companyConfigs.emctech.shortName,
        proposalTitle: "",
        proposalDate: new Date().toISOString().split('T')[0],
        validUntil: "",
        terms: "",
        notes: "",
        discount: 0,
        taxRate: 10,
        status: "draft",
        templateType: "simple-commercial",
        documentNumber: "",
        companyDetails: companyConfigs.emctech,
        deliveryTerms: {
          paymentTerms: "50% prepayment",
          deliveryTime: "6-12 weeks",
          incoterms: "DDP"
        },
        authorizedSignatory: companyConfigs.emctech.signatory
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

  // Check if current template uses products
  const usesProducts = () => {
    return proposal.templateType.includes('commercial');
  };

  // Check if current template uses technical items
  const usesTechnicalItems = () => {
    return proposal.templateType.includes('technical');
  };

  // Check if current template uses images
  const usesImages = () => {
    return proposal.templateType.includes('with-images');
  };

  // Enhanced email validator
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(String(email || "").trim());
  };

  // Comprehensive validation (used by buttons / tooltips)
  const validateProposalEnhanced = (action = 'save') => {
    const errors = [];

    // Basic required fields
    if (!proposal.clientId) errors.push("Please select a client.");
    if (!proposal.proposalTitle || !proposal.proposalTitle.trim()) errors.push("Proposal title is required.");

    // Template-specific validations
    if (proposal.templateType.includes('commercial')) {
      if (selectedProducts.length === 0) errors.push("Add at least one product for commercial proposals.");
      selectedProducts.forEach((product) => {
        if (!product.quantity || product.quantity <= 0) {
          errors.push(`Product '${product.name}' has invalid quantity.`);
        }
        if (product.unitPrice == null || product.unitPrice < 0) {
          errors.push(`Product '${product.name}' has invalid unit price.`);
        }
        if (product.discount != null && (product.discount < 0 || product.discount > 100)) {
          errors.push(`Product '${product.name}' has invalid discount (0-100%).`);
        }
      });
    }

    if (proposal.templateType.includes('technical')) {
      if (rfqItems.length === 0) errors.push("Add at least one technical item.");
      if (!proposal.documentNumber || !proposal.documentNumber.trim()) {
        errors.push("Document number is required for technical proposals.");
      }
      if (!proposal.companyDetails?.name || !proposal.companyDetails.name.trim()) {
        errors.push("Company legal name is required for technical proposals.");
      }
      rfqItems.forEach((item) => {
        if (!item.description || !item.description.trim()) {
          errors.push("All technical items must have a description.");
        }
        if (item.quantity && item.quantity <= 0) {
          errors.push(`Technical item '${item.description}' has invalid quantity.`);
        }
        if (item.unitPrice != null && item.unitPrice < 0) {
          errors.push(`Technical item '${item.description}' has invalid unit price.`);
        }
      });
    }

    // Send-specific validation
    if (action === 'send') {
      if (!proposal.clientEmail || !proposal.clientEmail.trim()) {
        errors.push("Client email is required to send the proposal.");
      } else if (!isValidEmail(proposal.clientEmail)) {
        errors.push("Please enter a valid client email address.");
      }
    }

    // Date and range validations
    if (proposal.validUntil && proposal.proposalDate) {
      const validUntilDate = new Date(proposal.validUntil);
      const proposalDate = new Date(proposal.proposalDate);
      if (validUntilDate < proposalDate) errors.push("Valid until date must be after proposal date.");
    }
    if (proposal.taxRate != null && (proposal.taxRate < 0 || proposal.taxRate > 100)) {
      errors.push("Tax rate must be between 0% and 100%.");
    }
    if (proposal.discount != null && (proposal.discount < 0 || proposal.discount > 100)) {
      errors.push("Proposal discount must be between 0% and 100%.");
    }

    return errors;
  };

  // Use enhanced validator for tooltip reasons
  const getDisabledReason = (action) => {
    const reason = validateProposalEnhanced(action)[0] || '';
    return reason;
  };

  // Validation helper - returns array of error messages
  const validateProposal = (action = 'save') => {
    const errors = [];

    if (!proposal.clientId) errors.push('Please select a client.');
    if (!proposal.proposalTitle || !proposal.proposalTitle.trim()) errors.push('Proposal title is required.');

    if (proposal.templateType.includes('commercial')) {
      if (selectedProducts.length === 0) errors.push('Add at least one product for commercial proposals.');
      // product-level checks (simple)
      selectedProducts.forEach((p, i) => {
        if (!p.quantity || p.quantity <= 0) errors.push(`Product "${p.name}" has invalid quantity.`);
        if (p.unitPrice == null || p.unitPrice < 0) errors.push(`Product "${p.name}" has invalid unit price.`);
      });
    }

    if (proposal.templateType.includes('technical')) {
      if (rfqItems.length === 0) errors.push('Add at least one technical item.');
      if (!proposal.documentNumber || !proposal.documentNumber.trim()) errors.push('Document number is required for technical proposals.');
      if (!proposal.companyDetails?.name || !proposal.companyDetails.name.trim()) errors.push('Company legal name is required for technical proposals.');
      // rfq item-level checks
      rfqItems.forEach((it) => {
        if (!it.description || !it.description.trim()) errors.push('All technical items must have a description.');
      });
    }

    if (action === 'send') {
      if (!proposal.clientEmail || !proposal.clientEmail.trim()) errors.push('Client email is required to send the proposal.');
    }

    return errors;
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
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  proposal.templateType.includes('commercial') 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {proposal.templateType.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {proposal.company === 'emctech' ? 'EMC Tech' : 'Innovamechanics'}
                </span>
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
                    <FaFileContract className="mr-2 text-blue-500" /> Proposal Template
                  </h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template Type
                    </label>
                    <select
                      value={proposal.templateType}
                      onChange={(e) => handleProposalChange(e)}
                      name="templateType"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="simple-commercial">Simple Commercial Offer</option>
                      <option value="technical-rfq">Technical RFQ</option>
                      <option value="commercial-with-images">Commercial Offer with Images</option>
                      <option value="technical-with-images">Technical Offer with Images</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Selection
                    </label>
                    <select
                      value={proposal.company}
                      onChange={(e) => handleCompanyChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="emctech">EMC Technology (emctech.uz)</option>
                      <option value="innovamechanics">Innovamechanics.com</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Selected: {proposal.companyName}
                    </p>
                  </div>
                </div>

                {/* Technical RFQ Fields */}
                {(proposal.templateType === 'technical-rfq' || proposal.templateType === 'technical-with-images') && (
                  <div className="bg-blue-50 p-4 rounded-lg mt-4">
                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                      <FaIndustry className="mr-2" /> Technical Document Details
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Document Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={proposal.documentNumber}
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
                          value={proposal.companyDetails?.name}
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
                          value={proposal.companyDetails?.address}
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
                          value={proposal.companyDetails?.phone}
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
                          value={proposal.companyDetails?.bankAccount}
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
                          value={proposal.companyDetails?.mfo}
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
                          value={proposal.companyDetails?.taxId}
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
                          value={proposal.deliveryTerms?.paymentTerms}
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
                          value={proposal.deliveryTerms?.deliveryTime}
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
                          value={proposal.deliveryTerms?.incoterms}
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
                          value={proposal.authorizedSignatory?.title}
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
                          value={proposal.authorizedSignatory?.name}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Title *</label>
                      <input
                        type="text"
                        name="proposalTitle"
                        value={proposal.proposalTitle}
                        onChange={handleProposalChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter proposal title"
                        required
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
              {usesProducts() ? (
                // Commercial Templates Product Selection
                <motion.div
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                      <FaShoppingCart className="mr-2 text-blue-500" /> 
                      {usesImages() ? 'Product Catalog with Images' : 'Product Selection'}
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
                                {usesImages() && <th className="text-left p-3 text-sm font-medium text-gray-600">Image</th>}
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
                                    {usesImages() && (
                                      <td className="p-3">
                                        {product.imageUrl ? (
                                          <img 
                                            src={product.imageUrl} 
                                            alt={product.name}
                                            className="w-12 h-12 object-cover rounded border"
                                            onError={(e) => {
                                              e.target.style.display = 'none';
                                            }}
                                          />
                                        ) : (
                                          <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                                            <FaImage className="text-gray-400" />
                                          </div>
                                        )}
                                      </td>
                                    )}
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
                // Technical Templates Item Selection
                <motion.div
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                      <FaIndustry className="mr-2 text-blue-500" /> 
                      {usesImages() ? 'Technical Items with Images' : 'Technical Items'}
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

                        <div className="grid grid-cols-3 gap-4 mb-4">
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
                              Unit Price ($)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={currentRfqItem.unitPrice}
                              onChange={(e) => handleRfqItemChange('unitPrice', parseFloat(e.target.value) || 0)}
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

                        {usesImages() && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Image URL
                            </label>
                            <input
                              type="url"
                              value={currentRfqItem.imageUrl}
                              onChange={(e) => handleRfqItemChange('imageUrl', e.target.value)}
                              placeholder="https://example.com/image.jpg"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                            {currentRfqItem.imageUrl && (
                              <div className="mt-2">
                                <img 
                                  src={currentRfqItem.imageUrl} 
                                  alt="Preview"
                                  className="h-20 object-cover rounded border"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}

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
                                <div className="flex items-start gap-3">
                                  {usesImages() && item.imageUrl && (
                                    <img 
                                      src={item.imageUrl} 
                                      alt={item.description}
                                      className="w-16 h-16 object-cover rounded border"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  )}
                                  <div>
                                    <h5 className="font-semibold text-gray-900">{item.description}</h5>
                                    <p className="text-sm text-gray-600">{item.technicalDescription}</p>
                                    <p className="text-sm font-medium text-green-600">
                                      {formatCurrency(item.unitPrice)} × {item.quantity} = {formatCurrency(item.lineTotal)}
                                    </p>
                                  </div>
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
                  
                  {usesProducts() && (
                    <div className="flex justify-between text-red-600">
                      <span className="text-gray-600">Discounts</span>
                      <span className="font-medium">-{formatCurrency(totalDiscount)}</span>
                    </div>
                  )}
                  
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
                    title={getDisabledReason('generate') || undefined}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center font-medium"
                    disabled={
                      (usesProducts() && selectedProducts.length === 0) ||
                      (usesTechnicalItems() && rfqItems.length === 0)
                    }
                  >
                    <FaFilePdf className="mr-2" /> Generate PDF
                  </button>

                  <button
                    onClick={() => handleSaveProposal("draft")}
                    title={getDisabledReason('save') || undefined}
                    className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition duration-200 flex items-center justify-center font-medium"
                    disabled={
                      (usesProducts() && selectedProducts.length === 0) ||
                      (usesTechnicalItems() && rfqItems.length === 0) ||
                      !proposal.clientId ||
                      !proposal.proposalTitle
                    }
                  >
                    <FaSave className="mr-2" /> Save Draft
                  </button>

                  <button
                    onClick={() => {
                      const validationErrors = validateProposal('send');
                      if (validationErrors.length > 0) {
                        showToast(validationErrors[0], 'error');
                        return;
                      }
                      setIsEmailModalOpen(true);
                    }}
                    title={getDisabledReason('send') || undefined}
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

              {/* Template Info */}
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <FaFileAlt className="mr-2 text-blue-500" /> Template Info
                </h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      usesImages() ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <span>{usesImages() ? 'Includes product images' : 'No product images'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      usesTechnicalItems() ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <span>{usesTechnicalItems() ? 'Technical format' : 'Commercial format'}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-gray-600">
                      {proposal.templateType === 'simple-commercial' && 
                        'Clean, professional commercial proposal without product images. Best for simple quotes.'}
                      {proposal.templateType === 'technical-rfq' && 
                        'Technical request for quotation format with detailed specifications. Best for industrial equipment.'}
                      {proposal.templateType === 'commercial-with-images' && 
                        'Commercial proposal with product images. Best for product catalogs and visual presentations.'}
                      {proposal.templateType === 'technical-with-images' && 
                        'Technical offer with item images and detailed specifications. Best for complex technical proposals.'}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Activity Log */}
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
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
              title={getDisabledReason('save') || undefined}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200 flex items-center"
              disabled={
                (usesProducts() && selectedProducts.length === 0) ||
                (usesTechnicalItems() && rfqItems.length === 0) ||
                !proposal.clientId ||
                !proposal.proposalTitle
              }
            >
              Save Draft
            </button>
            <button
              onClick={() => handleSaveProposal("sent")}
              title={getDisabledReason('send') || undefined}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center"
              disabled={
                (usesProducts() && selectedProducts.length === 0) ||
                (usesTechnicalItems() && rfqItems.length === 0) ||
                !proposal.clientId ||
                !proposal.proposalTitle
              }
            >
              Save & Send
            </button>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Toast Notification System */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y:  20, scale: 0.98 }}
            className={`fixed top-4 right-4 p-4 rounded-lg shadow-xl z-[100] max-w-sm w-auto border-l-4 ${
              toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-500' :
              toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-500' :
              toast.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border-yellow-500' :
              'bg-blue-50 text-blue-800 border-blue-500'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {toast.type === 'error' && <FaExclamationTriangle className="mt-0.5 text-red-500" />}
                {toast.type === 'success' && <FaCheck className="mt-0.5 text-green-500" />}
                {toast.type === 'warning' && <FaExclamationTriangle className="mt-0.5 text-yellow-500" />}
                {toast.type === 'info' && <FaInfoCircle className="mt-0.5 text-blue-500" />}
                <div className="text-sm leading-snug">{toast.message}</div>
              </div>
              <button
                onClick={() => setToast(null)}
                className="opacity-60 hover:opacity-100 ml-2 transition-opacity"
                aria-label="Close toast"
              >
                <FaTimes size={14} />
              </button>
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

      {/* Email Modal */}
      <AnimatePresence>
        {isEmailModalOpen && (
          <EmailModal
            open={isEmailModalOpen}
            onClose={() => setIsEmailModalOpen(false)}
            proposal={proposal}
            emailData={emailData}
            onEmailDataChange={setEmailData}
            onSendProposal={() => handleSaveProposal("sent")}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-components
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
        exit={{ scale: 0.9, opacity:  0 }}
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
              value={emailData.body || `Dear ${proposal.clientName},\n\nPlease find attached the proposal for your review.\n\nBest regards,\n${proposal.companyName}`}
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