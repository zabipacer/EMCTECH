import React, { useState, useEffect } from "react";
import { 
  FaUserPlus, FaEdit, FaTrashAlt, FaSearch, FaTimes, 
  FaPhone, FaMapMarkerAlt, FaBuilding, FaCalendarAlt,
  FaStar, FaFilter, FaEye, FaArrowLeft 
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const ClientManagement = () => {
  // State management
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    company: "", 
    address: "", 
    status: "active" 
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Client status options
  const statusOptions = [
    { value: "active", label: "Active", color: "green" },
    { value: "inactive", label: "Inactive", color: "gray" },
    { value: "premium", label: "Premium", color: "purple" },
    { value: "prospect", label: "Prospect", color: "blue" }
  ];

  // Initialize with sample data (simulating API call)
  useEffect(() => {
    // Simulate API call delay
    setTimeout(() => {
      setClients([
        { 
          id: 1, 
          name: "Client A", 
          email: "clientA@example.com", 
          phone: "+1 (555) 123-4567",
          company: "ABC Corporation",
          address: "123 Main St, New York, NY 10001",
          status: "premium",
          joinDate: "2023-01-15",
          projects: 12,
          revenue: 125000,
          notes: "Long-term client with consistent orders."
        },
        { 
          id: 2, 
          name: "Client B", 
          email: "clientB@example.com", 
          phone: "+1 (555) 987-6543",
          company: "XYZ Industries",
          address: "456 Oak Ave, Los Angeles, CA 90210",
          status: "active",
          joinDate: "2023-03-22",
          projects: 5,
          revenue: 45000,
          notes: "New client with high potential for growth."
        },
        { 
          id: 3, 
          name: "Client C", 
          email: "clientC@example.com", 
          phone: "+1 (555) 246-8102",
          company: "Smith & Sons",
          address: "789 Pine Rd, Chicago, IL 60601",
          status: "prospect",
          joinDate: "2023-05-10",
          projects: 0,
          revenue: 0,
          notes: "Currently in negotiation phase."
        },
        { 
          id: 4, 
          name: "Client D", 
          email: "clientD@example.com", 
          phone: "+1 (555) 369-1215",
          company: "Johnson Enterprises",
          address: "321 Elm St, Houston, TX 77002",
          status: "inactive",
          joinDate: "2022-11-05",
          projects: 3,
          revenue: 28000,
          notes: "No recent activity. Follow up required."
        }
      ]);
      setIsLoading(false);
    }, 800);
  }, []);

  // Filter and sort clients
  const filteredClients = clients
    .filter(client => {
      const matchesSearch = 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "joinDate") return new Date(b.joinDate) - new Date(a.joinDate);
      if (sortBy === "revenue") return b.revenue - a.revenue;
      if (sortBy === "projects") return b.projects - a.projects;
      return 0;
    });

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Client name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
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
    setFormData({ 
      name: "", 
      email: "", 
      phone: "", 
      company: "", 
      address: "", 
      status: "active" 
    });
    setEditingClient(null);
    setErrors({});
  };

  // Open modal for adding new client
  const handleAddClient = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open modal for editing existing client
  const handleEditClient = (client) => {
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      address: client.address,
      status: client.status
    });
    setEditingClient(client);
    setIsModalOpen(true);
  };

  // View client details
  const handleViewClient = (client) => {
    setViewingClient(client);
  };

  // Close client details view
  const handleCloseView = () => {
    setViewingClient(null);
  };

  // Handle form submission (add or update)
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (editingClient) {
      // Update existing client
      setClients(prev => prev.map(client =>
        client.id === editingClient.id
          ? { ...client, ...formData }
          : client
      ));
    } else {
      // Add new client
      const newClient = {
        id: Math.max(0, ...clients.map(c => c.id)) + 1,
        ...formData,
        joinDate: new Date().toISOString().split('T')[0],
        projects: 0,
        revenue: 0,
        notes: ""
      };
      setClients(prev => [...prev, newClient]);
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  // Delete client with confirmation
  const handleDeleteClient = (clientId) => {
    if (window.confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      setClients(prev => prev.filter(client => client.id !== clientId));
      if (viewingClient && viewingClient.id === clientId) {
        setViewingClient(null);
      }
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status color and icon
  const getStatusInfo = (status) => {
    return statusOptions.find(opt => opt.value === status) || statusOptions[0];
  };

  // Stats calculations
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === "active" || c.status === "premium").length;
  const totalRevenue = clients.reduce((sum, client) => sum + client.revenue, 0);
  const premiumClients = clients.filter(c => c.status === "premium").length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Title and Stats */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Client Management</h1>
            <p className="text-gray-600 mt-2">Manage your client relationships and interactions</p>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
              <p className="text-sm text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{activeClients}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
              <p className="text-sm text-gray-600">Premium</p>
              <p className="text-2xl font-bold text-gray-900">{premiumClients}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-indigo-500">
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </motion.div>

        {/* Controls Section */}
        <motion.div
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients by name, email, or company..."
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

            {/* Filters and Sort */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <FaFilter className="text-gray-500" />
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="joinDate">Sort by Join Date</option>
                <option value="revenue">Sort by Revenue</option>
                <option value="projects">Sort by Projects</option>
              </select>
            </div>

            {/* Add Client Button */}
            <button
              onClick={handleAddClient}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center font-medium"
            >
              <FaUserPlus className="mr-2" />
              Add New Client
            </button>
          </div>
        </motion.div>

        {/* Client List */}
        <motion.div
          className="bg-white rounded-xl shadow-lg overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Client List</h2>
            <p className="text-gray-600 mt-1">
              {searchTerm || statusFilter !== "all" 
                ? `Found ${filteredClients.length} client(s) matching your criteria`
                : `Showing all ${clients.length} client(s)`
              }
            </p>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Loading clients...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No clients found.</p>
              {(searchTerm || statusFilter !== "all") && (
                <button
                  onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
                    <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredClients.map((client) => (
                      <motion.tr
                        key={client.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                        className="transition-colors duration-150"
                      >
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-800 font-medium">
                                {client.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{client.name}</div>
                              <div className="text-sm text-gray-500">{formatDate(client.joinDate)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-700">
                          <div>{client.email}</div>
                          <div className="text-gray-500">{client.phone}</div>
                        </td>
                        <td className="p-4 text-sm text-gray-700">{client.company}</td>
                        <td className="p-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusInfo(client.status).color}-100 text-${getStatusInfo(client.status).color}-800`}>
                            {client.status === "premium" && <FaStar className="mr-1" />}
                            {getStatusInfo(client.status).label}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-700 font-medium">{client.projects}</td>
                        <td className="p-4 text-sm text-gray-700 font-medium">{formatCurrency(client.revenue)}</td>
                        <td className="p-4 text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewClient(client)}
                              className="text-blue-600 hover:text-blue-800 transition duration-300 flex items-center px-3 py-1 rounded-md hover:bg-blue-50"
                            >
                              <FaEye className="mr-1" /> View
                            </button>
                            <button
                              onClick={() => handleEditClient(client)}
                              className="text-green-600 hover:text-green-800 transition duration-300 flex items-center px-3 py-1 rounded-md hover:bg-green-50"
                            >
                              <FaEdit className="mr-1" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClient(client.id)}
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

      {/* Add/Edit Client Modal */}
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
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-screen overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingClient ? "Edit Client" : "Add New Client"}
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
                    Full Name *
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
                    placeholder="Enter client's full name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                    }`}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full address"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
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
                    {editingClient ? "Update Client" : "Add Client"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client Detail View */}
      <AnimatePresence>
        {viewingClient && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseView}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <button 
                      onClick={handleCloseView}
                      className="flex items-center text-blue-100 hover:text-white mb-4"
                    >
                      <FaArrowLeft className="mr-2" /> Back to list
                    </button>
                    <h2 className="text-2xl font-bold">{viewingClient.name}</h2>
                    <p className="text-blue-100">{viewingClient.company}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20`}>
                      {viewingClient.status === "premium" && <FaStar className="mr-1" />}
                      {getStatusInfo(viewingClient.status).label}
                    </span>
                    <p className="mt-2 text-blue-100">Member since {formatDate(viewingClient.joinDate)}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <FaPhone className="text-gray-400 mr-3" />
                        <span>{viewingClient.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <FaUserPlus className="text-gray-400 mr-3" />
                        <span>{viewingClient.email}</span>
                      </div>
                      <div className="flex items-center">
                        <FaBuilding className="text-gray-400 mr-3" />
                        <span>{viewingClient.company}</span>
                      </div>
                      <div className="flex items-start">
                        <FaMapMarkerAlt className="text-gray-400 mr-3 mt-1" />
                        <span>{viewingClient.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Statistics</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Projects</span>
                        <span className="font-semibold">{viewingClient.projects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Revenue</span>
                        <span className="font-semibold">{formatCurrency(viewingClient.revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Client Since</span>
                        <span className="font-semibold">{formatDate(viewingClient.joinDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{viewingClient.notes || "No notes available for this client."}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => { handleCloseView(); handleEditClient(viewingClient); }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center"
                  >
                    <FaEdit className="mr-2" /> Edit Client
                  </button>
                  <button
                    onClick={() => handleDeleteClient(viewingClient.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 flex items-center"
                  >
                    <FaTrashAlt className="mr-2" /> Delete Client
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientManagement;