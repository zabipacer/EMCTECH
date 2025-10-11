// src/pages/ClientManagement.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  FaUserPlus,
  FaEdit,
  FaTrashAlt,
  FaSearch,
  FaTimes,
  FaPhone,
  FaMapMarkerAlt,
  FaBuilding,
  FaCalendarAlt,
  FaStar,
  FaFilter,
  FaEye,
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaFileExport
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ClientManagement (improved)
 * - Persistence via localStorage
 * - Pagination + bulk actions (delete, export CSV)
 * - Add / Edit modal + View detail modal
 * - Toast + Confirm dialog
 * - Better status badge handling (Tailwind-safe)
 *
 * Replace localStorage hooks with API calls when ready.
 */

const STORAGE_KEY = "__mvp_clients_v1";

/* ----------------------------- Helpers ----------------------------- */

const sampleClients = [
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
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active", colorClass: "bg-green-100 text-green-800" },
  { value: "inactive", label: "Inactive", colorClass: "bg-gray-100 text-gray-800" },
  { value: "premium", label: "Premium", colorClass: "bg-purple-100 text-purple-800" },
  { value: "prospect", label: "Prospect", colorClass: "bg-blue-100 text-blue-800" }
];

const loadClients = () => {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    if (!r) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleClients));
      return sampleClients;
    }
    return JSON.parse(r);
  } catch (e) {
    console.error("loadClients:", e);
    return sampleClients;
  }
};

const saveClients = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

/* -------------------------- Reusable UI ---------------------------- */

function Toast({ message, type = "info", onClose }) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);
  const bg = type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-gray-800";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`${bg} text-white px-4 py-2 rounded shadow`}>
      {message}
    </motion.div>
  );
}

function ConfirmDialog({ open, title, message, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onCancel} />
      <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-6 rounded-lg shadow-lg z-10 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-3 py-2 rounded border">Cancel</button>
          <button onClick={onConfirm} className="px-3 py-2 rounded bg-red-600 text-white">Confirm</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ----------------------- Main Component ---------------------------- */

export default function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    status: "active"
  });

  const [isLoading, setIsLoading] = useState(true);

  // Pagination & selection
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [selectedIds, setSelectedIds] = useState(new Set());

  // UI helpers
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState({ open: false });
  const modalRef = useRef(null);

  // Load clients from storage (simulate API)
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const loaded = loadClients();
      setClients(loaded);
      setIsLoading(false);
    }, 350);
  }, []);

  // Persist whenever clients change
  useEffect(() => {
    saveClients(clients);
  }, [clients]);

  // Reset form when modal closed
  useEffect(() => {
    if (!isModalOpen) {
      setEditingClient(null);
      setFormData({ name: "", email: "", phone: "", company: "", address: "", status: "active" });
      setErrors({});
    } else if (editingClient) {
      setFormData({
        name: editingClient.name || "",
        email: editingClient.email || "",
        phone: editingClient.phone || "",
        company: editingClient.company || "",
        address: editingClient.address || "",
        status: editingClient.status || "active"
      });
    }
  }, [isModalOpen, editingClient]);

  // Filter & sort
  const filtered = clients
    .filter((c) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesQ = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.company || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesQ && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "joinDate") return new Date(b.joinDate) - new Date(a.joinDate);
      if (sortBy === "revenue") return b.revenue - a.revenue;
      if (sortBy === "projects") return b.projects - a.projects;
      return 0;
    });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  // Stats
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === "active" || c.status === "premium").length;
  const premiumClients = clients.filter((c) => c.status === "premium").length;
  const totalRevenue = clients.reduce((s, c) => s + (c.revenue || 0), 0);

  /* ---------------------- Form helpers ---------------------- */

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Client name is required";
    if (!formData.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = "Email is invalid";
    if (!formData.phone.trim()) errs.phone = "Phone number is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const openAddModal = () => {
    setEditingClient(null);
    setFormData({ name: "", email: "", phone: "", company: "", address: "", status: "active" });
    setIsModalOpen(true);
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (editingClient) {
      setClients((prev) => prev.map((c) => (c.id === editingClient.id ? { ...c, ...formData } : c)));
      setIsModalOpen(false);
      setToast({ message: "Client updated", type: "success" });
    } else {
      const newId = clients.length ? Math.max(...clients.map((c) => c.id)) + 1 : 1;
      const newClient = {
        id: newId,
        ...formData,
        joinDate: new Date().toISOString().split("T")[0],
        projects: 0,
        revenue: 0,
        notes: ""
      };
      setClients((prev) => [...prev, newClient]);
      setIsModalOpen(false);
      setToast({ message: "Client added", type: "success" });
    }
  };

  /* ---------------------- Actions ---------------------- */

  const handleViewClient = (client) => {
    setViewingClient(client);
    // ensure modals closed
    setIsModalOpen(false);
  };

  const handleDeleteClient = (clientId) => {
    setConfirm({
      open: true,
      title: "Delete client",
      message: "Are you sure you want to delete this client? This action cannot be undone.",
      onConfirm: () => {
        setClients((prev) => prev.filter((c) => c.id !== clientId));
        setViewingClient((v) => (v && v.id === clientId ? null : v));
        setConfirm({ open: false });
        setToast({ message: "Client deleted", type: "success" });
      },
      onCancel: () => setConfirm({ open: false })
    });
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const selectAllPage = (checked) => {
    if (checked) {
      setSelectedIds((prev) => {
        const s = new Set(prev);
        pageData.forEach((p) => s.add(p.id));
        return s;
      });
    } else {
      setSelectedIds((prev) => {
        const s = new Set(prev);
        pageData.forEach((p) => s.delete(p.id));
        return s;
      });
    }
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return setToast({ message: "Select at least one client", type: "error" });
    setConfirm({
      open: true,
      title: `Delete ${ids.length} clients`,
      message: "This action cannot be undone. Are you sure?",
      onConfirm: () => {
        setClients((prev) => prev.filter((c) => !ids.includes(c.id)));
        setSelectedIds(new Set());
        setConfirm({ open: false });
        setToast({ message: `${ids.length} clients deleted`, type: "success" });
      },
      onCancel: () => setConfirm({ open: false })
    });
  };

  const exportSelectedCSV = () => {
    const ids = Array.from(selectedIds);
    const rows = (ids.length ? clients.filter((c) => ids.includes(c.id)) : filtered).map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      status: c.status,
      projects: c.projects,
      revenue: c.revenue
    }));
    if (rows.length === 0) return setToast({ message: "No clients to export", type: "error" });
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setToast({ message: "CSV exported", type: "success" });
  };

  const toCSV = (rows) => {
    const keys = Object.keys(rows[0]);
    const lines = [keys.join(",")];
    for (const r of rows) {
      const vals = keys.map((k) => {
        const v = r[k] ?? "";
        if (typeof v === "string") return `"${v.replace(/"/g, '""')}"`;
        return v;
      });
      lines.push(vals.join(","));
    }
    return lines.join("\n");
  };

  /* ---------------------- Keyboard / Modal Close ---------------------- */

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
        setViewingClient(null);
        setConfirm({ open: false });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---------------------- Render ---------------------- */

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header + Stats */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Client Management</h1>
            <p className="text-gray-600 mt-2">Manage your client relationships, proposals and revenue.</p>
          </div>

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

        {/* Controls */}
        <motion.div className="bg-white rounded-xl shadow-lg p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full md:w-1/3">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                aria-label="Search clients"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search clients by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button aria-label="Clear search" className="absolute right-3 top-3 text-gray-400" onClick={() => setSearchTerm("")}>
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <FaFilter className="text-gray-500" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Statuses</option>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="name">Sort by Name</option>
                <option value="joinDate">Sort by Join Date</option>
                <option value="revenue">Sort by Revenue</option>
                <option value="projects">Sort by Projects</option>
              </select>

              <button onClick={openAddModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <FaUserPlus /> Add New Client
              </button>
            </div>
          </div>
        </motion.div>

        {/* Client list */}
        <motion.div className="bg-white rounded-xl shadow-lg overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Client List</h2>
            <p className="text-gray-600 mt-1">{searchTerm || statusFilter !== "all" ? `Found ${filtered.length} client(s)` : `Showing all ${clients.length} client(s)`}</p>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
              <p className="mt-2 text-gray-600">Loading clients...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No clients found.</p>
              {(searchTerm || statusFilter !== "all") && (
                <button onClick={() => { setSearchTerm(""); setStatusFilter("all"); }} className="mt-2 text-blue-600 hover:text-blue-800">Clear filters</button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        aria-label="Select all on page"
                        onChange={(e) => selectAllPage(e.target.checked)}
                      />
                    </th>
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
                    {pageData.map((client) => {
                      const statusInfo = STATUS_OPTIONS.find((s) => s.value === client.status) || STATUS_OPTIONS[0];
                      return (
                        <motion.tr key={client.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                          <td className="p-4">
                            <input
                              aria-label={`Select ${client.name}`}
                              type="checkbox"
                              checked={selectedIds.has(client.id)}
                              onChange={() => toggleSelect(client.id)}
                            />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-800 font-medium">{client.name.split(" ").map((n) => n[0]).join("")}</span>
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
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.colorClass}`}>
                              {client.status === "premium" && <FaStar className="mr-1" />}
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-700 font-medium">{client.projects}</td>
                          <td className="p-4 text-sm text-gray-700 font-medium">{formatCurrency(client.revenue)}</td>
                          <td className="p-4 text-sm">
                            <div className="flex space-x-2">
                              <button onClick={() => handleViewClient(client)} className="text-blue-600 hover:text-blue-800 flex items-center px-3 py-1 rounded-md hover:bg-blue-50">
                                <FaEye className="mr-1" /> View
                              </button>
                              <button onClick={() => openEditModal(client)} className="text-green-600 hover:text-green-800 flex items-center px-3 py-1 rounded-md hover:bg-green-50">
                                <FaEdit className="mr-1" /> Edit
                              </button>
                              <button onClick={() => handleDeleteClient(client.id)} className="text-red-600 hover:text-red-800 flex items-center px-3 py-1 rounded-md hover:bg-red-50">
                                <FaTrashAlt className="mr-1" /> Delete
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Bulk toolbar & pagination */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={handleBulkDelete} className="px-3 py-2 bg-red-600 text-white rounded flex items-center gap-2">
              <FaTrashAlt /> Delete Selected
            </button>
            <button onClick={exportSelectedCSV} className="px-3 py-2 bg-white border rounded flex items-center gap-2">
              <FaFileExport /> Export CSV
            </button>
            <div className="text-sm text-gray-600">Selected: {selectedIds.size}</div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="p-2 border rounded"><FaChevronLeft /></button>
            <div className="px-3 py-1 border rounded">{page} / {totalPages}</div>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="p-2 border rounded"><FaChevronRight /></button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)}>
            <motion.div ref={modalRef} onClick={(e) => e.stopPropagation()} initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{editingClient ? "Edit Client" : "Add New Client"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><FaTimes size={18} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input name="name" value={formData.name} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`} placeholder="Enter client's full name" />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input name="email" value={formData.email} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`} placeholder="Enter email address" />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input name="phone" value={formData.phone} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`} placeholder="Enter phone number" />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input name="company" value={formData.company} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none border-gray-300 focus:ring-blue-500" placeholder="Enter company name" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2" className="w-full px-3 py-2 border rounded-lg focus:outline-none border-gray-300 focus:ring-blue-500" placeholder="Enter full address" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none border-gray-300 focus:ring-blue-500">
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 border rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editingClient ? "Update Client" : "Add Client"}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail View */}
      <AnimatePresence>
        {viewingClient && (
          <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingClient(null)}>
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <button onClick={() => setViewingClient(null)} className="flex items-center text-blue-100 hover:text-white mb-3">
                      <FaArrowLeft className="mr-2" /> Back to list
                    </button>
                    <h2 className="text-2xl font-bold">{viewingClient.name}</h2>
                    <p className="text-blue-100">{viewingClient.company}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20">
                      {viewingClient.status === "premium" && <FaStar className="mr-1" />}
                      {STATUS_OPTIONS.find((s) => s.value === viewingClient.status)?.label}
                    </span>
                    <p className="mt-2 text-blue-100">Member since {formatDate(viewingClient.joinDate)}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center"><FaPhone className="text-gray-400 mr-3" /><span>{viewingClient.phone}</span></div>
                      <div className="flex items-center"><FaUserPlus className="text-gray-400 mr-3" /><span>{viewingClient.email}</span></div>
                      <div className="flex items-center"><FaBuilding className="text-gray-400 mr-3" /><span>{viewingClient.company}</span></div>
                      <div className="flex items-start"><FaMapMarkerAlt className="text-gray-400 mr-3 mt-1" /><span>{viewingClient.address}</span></div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Statistics</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div className="flex justify-between"><span className="text-gray-600">Total Projects</span><span className="font-semibold">{viewingClient.projects}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Total Revenue</span><span className="font-semibold">{formatCurrency(viewingClient.revenue)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Client Since</span><span className="font-semibold">{formatDate(viewingClient.joinDate)}</span></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{viewingClient.notes || "No notes available for this client."}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button onClick={() => { setViewingClient(null); openEditModal(viewingClient); }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"><FaEdit className="mr-2" /> Edit Client</button>
                  <button onClick={() => handleDeleteClient(viewingClient.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"><FaTrashAlt className="mr-2" /> Delete Client</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm dialog */}
      <ConfirmDialog open={confirm.open} title={confirm.title} message={confirm.message} onCancel={() => setConfirm({ open: false })} onConfirm={confirm.onConfirm} />

      {/* Toast */}
      {toast && <div className="fixed right-6 bottom-6 z-50"><AnimatePresence><Toast key={toast.message} message={toast.message} type={toast.type} onClose={() => setToast(null)} /></AnimatePresence></div>}
    </div>
  );
}
