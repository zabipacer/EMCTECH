import React, { useState, useEffect } from "react";
import { 
  FaEye, 
  FaEdit, 
  FaDownload, 
  FaPlus, 
  FaSearch, 
  FaFilter,
  FaFilePdf,
  FaFileWord,
  FaTrash,
  FaShare,
  FaCopy,
  FaCheck,
  FaClock,
  FaPaperPlane,
  FaExclamationTriangle
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

// Mock data - in a real app, this would come from an API
const mockProposals = [
  { 
    id: 1, 
    client: "Client A", 
    company: "ABC Corporation",
    total: 30000, 
    status: "draft",
    created: "2024-01-15",
    expires: "2024-02-15",
    items: 5,
    lastUpdated: "2 hours ago"
  },
  { 
    id: 2, 
    client: "Client B", 
    company: "XYZ Industries",
    total: 50000, 
    status: "sent",
    created: "2024-01-10",
    expires: "2024-02-10",
    items: 8,
    lastUpdated: "1 day ago"
  },
  { 
    id: 3, 
    client: "Client C", 
    company: "Global Solutions Ltd",
    total: 75000, 
    status: "accepted",
    created: "2024-01-05",
    expires: "2024-02-05",
    items: 12,
    lastUpdated: "3 days ago"
  },
  { 
    id: 4, 
    client: "Client D", 
    company: "Tech Innovators Inc",
    total: 42000, 
    status: "expired",
    created: "2023-12-20",
    expires: "2024-01-20",
    items: 6,
    lastUpdated: "1 week ago"
  }
];

const statusConfig = {
  draft: { color: "bg-yellow-100 text-yellow-800", icon: FaClock },
  sent: { color: "bg-blue-100 text-blue-800", icon: FaPaperPlane },
  accepted: { color: "bg-green-100 text-green-800", icon: FaCheck },
  expired: { color: "bg-red-100 text-red-800", icon: FaExclamationTriangle }
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      <Icon className="mr-1" size={12} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const ProposalCard = ({ proposal, onAction }) => {
  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{proposal.client}</h3>
            <p className="text-gray-600 text-sm">{proposal.company}</p>
          </div>
          <StatusBadge status={proposal.status} />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-xl font-bold text-gray-900">${proposal.total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Items</p>
            <p className="text-lg font-semibold text-gray-900">{proposal.items}</p>
          </div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-500 mb-4">
          <span>Created: {new Date(proposal.created).toLocaleDateString()}</span>
          <span>Expires: {new Date(proposal.expires).toLocaleDateString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Updated {proposal.lastUpdated}</span>
          <div className="flex space-x-2">
            <motion.button
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onAction('view', proposal)}
            >
              <FaEye size={16} />
            </motion.button>
            <motion.button
              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onAction('edit', proposal)}
            >
              <FaEdit size={16} />
            </motion.button>
            <motion.button
              className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onAction('download', proposal)}
            >
              <FaDownload size={16} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ProposalTableRow = ({ proposal, onAction }) => {
  return (
    <motion.tr
      className="border-b hover:bg-gray-50 transition-colors"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
    >
      <td className="p-4">
        <div>
          <p className="font-medium text-gray-900">{proposal.client}</p>
          <p className="text-sm text-gray-500">{proposal.company}</p>
        </div>
      </td>
      <td className="p-4">
        <span className="font-semibold">${proposal.total.toLocaleString()}</span>
      </td>
      <td className="p-4">
        <StatusBadge status={proposal.status} />
      </td>
      <td className="p-4">
        <span className="text-sm text-gray-600">{proposal.items} items</span>
      </td>
      <td className="p-4">
        <span className="text-sm text-gray-600">{new Date(proposal.expires).toLocaleDateString()}</span>
      </td>
      <td className="p-4">
        <div className="flex space-x-3">
          <motion.button
            className="text-blue-600 hover:text-blue-800 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onAction('view', proposal)}
            title="View Proposal"
          >
            <FaEye size={16} />
          </motion.button>
          <motion.button
            className="text-green-600 hover:text-green-800 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onAction('edit', proposal)}
            title="Edit Proposal"
          >
            <FaEdit size={16} />
          </motion.button>
          <motion.button
            className="text-purple-600 hover:text-purple-800 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onAction('download', proposal)}
            title="Download PDF"
          >
            <FaDownload size={16} />
          </motion.button>
          <motion.button
            className="text-gray-400 hover:text-red-600 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onAction('delete', proposal)}
            title="Delete Proposal"
          >
            <FaTrash size={16} />
          </motion.button>
        </div>
      </td>
    </motion.tr>
  );
};

const ProposalManagement = () => {
  const [proposals, setProposals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProposals(mockProposals);
    }, 500);
  }, []);

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || proposal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedProposals = [...filteredProposals].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created) - new Date(a.created);
      case "oldest":
        return new Date(a.created) - new Date(b.created);
      case "amount-high":
        return b.total - a.total;
      case "amount-low":
        return a.total - b.total;
      default:
        return 0;
    }
  });

  const handleAction = (action, proposal) => {
    switch (action) {
      case 'view':
        alert(`Viewing proposal for ${proposal.client}`);
        break;
      case 'edit':
        alert(`Editing proposal for ${proposal.client}`);
        break;
      case 'download':
        alert(`Downloading PDF for ${proposal.client}`);
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete the proposal for ${proposal.client}?`)) {
          setProposals(proposals.filter(p => p.id !== proposal.id));
        }
        break;
      default:
        break;
    }
  };

  const stats = {
    total: proposals.length,
    draft: proposals.filter(p => p.status === 'draft').length,
    sent: proposals.filter(p => p.status === 'sent').length,
    accepted: proposals.filter(p => p.status === 'accepted').length,
    totalValue: proposals.reduce((sum, p) => sum + p.total, 0)
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-8">
      {/* Header */}
      <motion.header 
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Proposal Management</h1>
          <p className="text-gray-600 mt-2">Create, manage, and track your business proposals</p>
        </div>
        
        <Link
          to="/proposals/create"
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-lg"
        >
          <FaPlus className="text-lg" />
          <span>Create New Proposal</span>
        </Link>
      </motion.header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div
          className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3 className="text-sm font-medium text-gray-500">Total Proposals</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </motion.div>
        
        <motion.div
          className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-yellow-500"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-sm font-medium text-gray-500">Draft</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.draft}</p>
        </motion.div>
        
        <motion.div
          className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-sm font-medium text-gray-500">Sent</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.sent}</p>
        </motion.div>
        
        <motion.div
          className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-sm font-medium text-gray-500">Accepted</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.accepted}</p>
        </motion.div>
        
        <motion.div
          className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
          <p className="text-3xl font-bold text-gray-900">${stats.totalValue.toLocaleString()}</p>
        </motion.div>
      </div>

      {/* Controls Section */}
      <motion.div
        className="bg-white rounded-xl shadow-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative w-full lg:w-64">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search proposals..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="expired">Expired</option>
            </select>

            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount-high">Amount: High to Low</option>
              <option value="amount-low">Amount: Low to High</option>
            </select>

            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                className={`px-4 py-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </button>
              <button
                className={`px-4 py-2 ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                onClick={() => setViewMode('table')}
              >
                Table
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Proposals List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {sortedProposals.map((proposal, index) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onAction={handleAction}
                  delay={index * 0.1}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-gray-900">Client</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-900">Total Amount</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-900">Items</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-900">Expires</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {sortedProposals.map((proposal, index) => (
                    <ProposalTableRow
                      key={proposal.id}
                      proposal={proposal}
                      onAction={handleAction}
                      delay={index * 0.1}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {sortedProposals.length === 0 && (
          <motion.div
            className="text-center py-12 bg-white rounded-xl shadow-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <FaFilePdf className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600">No proposals found</h3>
            <p className="text-gray-500 mt-2">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Get started by creating your first proposal'
              }
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ProposalManagement;