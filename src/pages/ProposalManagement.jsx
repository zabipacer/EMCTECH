import React, { useState, useEffect, useMemo } from "react";
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
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaTimes,
  FaUsers,
  FaSpinner,
  FaInbox
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

/**
 * Enhanced ProposalManagement component
 * - Based on your original code, with many UI features added:
 *   Bulk actions, pagination, preview modal, send modal, duplicate, inline status change,
 *   quick-add client modal, export CSV, confirm dialogs, toasts.
 *
 * Replace mock behaviors with real API calls where indicated.
 */

/* ----------------------------- Mock Data ----------------------------- */
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
    lastUpdated: "2 hours ago",
    number: "PROP-2024-001"
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
    lastUpdated: "1 day ago",
    number: "PROP-2024-002"
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
    lastUpdated: "3 days ago",
    number: "PROP-2024-003"
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
    lastUpdated: "1 week ago",
    number: "PROP-2024-004"
  },
  {
    id: 5,
    client: "Client E",
    company: "Alpha Trading",
    total: 22000,
    status: "draft",
    created: "2024-02-01",
    expires: "2024-03-01",
    items: 3,
    lastUpdated: "5 hours ago",
    number: "PROP-2024-005"
  }
];

const defaultClients = [
  { id: "c1", name: "Client A", email: "a@client.com" },
  { id: "c2", name: "Client B", email: "b@client.com" },
  { id: "c3", name: "Client C", email: "c@client.com" }
];

const statusConfig = {
  draft: { color: "bg-yellow-100 text-yellow-800", icon: FaClock },
  sent: { color: "bg-blue-100 text-blue-800", icon: FaPaperPlane },
  accepted: { color: "bg-green-100 text-green-800", icon: FaCheck },
  expired: { color: "bg-red-100 text-red-800", icon: FaExclamationTriangle }
};

/* --------------------------- Helper Components ------------------------ */

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      <Icon className="mr-1" size={12} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const Toast = ({ message, type = "info", onClose }) => {
  const color = type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-gray-800";
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`text-white ${color} px-4 py-2 rounded shadow`}>
      {message}
    </motion.div>
  );
};

const ConfirmDialog = ({ open, title, message, onCancel, onConfirm, confirmLabel = "Confirm", cancelLabel = "Cancel" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onCancel} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-lg p-6 z-10 w-full max-w-md shadow-lg">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded border border-gray-200"> {cancelLabel} </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white"> {confirmLabel} </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ----------------------------- Main Component ------------------------ */

const ProposalManagement = () => {
  const [proposals, setProposals] = useState([]);
  const [clients, setClients] = useState(defaultClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'
  const [sortBy, setSortBy] = useState("newest");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAllPage, setSelectAllPage] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 6;

  // Modals / UI
  const [previewProposal, setPreviewProposal] = useState(null);
  const [sendProposal, setSendProposal] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const [toast, setToast] = useState(null);
  const [quickClientModalOpen, setQuickClientModalOpen] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setProposals(mockProposals);
      setLoading(false);
    }, 600);
  }, []);

  /* ---------------------- Filtering & Sorting ---------------------- */
  const filteredProposals = useMemo(() => {
    return proposals.filter((proposal) => {
      const matchesSearch =
        proposal.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (proposal.number || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || proposal.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [proposals, searchTerm, statusFilter]);

  const sortedProposals = useMemo(() => {
    const arr = [...filteredProposals];
    arr.sort((a, b) => {
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
    return arr;
  }, [filteredProposals, sortBy]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(sortedProposals.length / perPage));
  const currentPageData = sortedProposals.slice((page - 1) * perPage, page * perPage);

  /* ---------------------- Selection Helpers ----------------------- */
  useEffect(() => {
    // if selectAllPage toggled, select/deselect all items on current page
    if (selectAllPage) {
      const ids = new Set(selectedIds);
      currentPageData.forEach((p) => ids.add(p.id));
      setSelectedIds(ids);
    } else {
      // if unchecking selectAllPage, remove current page ids
      const ids = new Set(selectedIds);
      currentPageData.forEach((p) => ids.delete(p.id));
      setSelectedIds(ids);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectAllPage, page]);

  const toggleSelect = (id) => {
    const ids = new Set(selectedIds);
    if (ids.has(id)) ids.delete(id);
    else ids.add(id);
    setSelectedIds(ids);
  };

  /* ---------------------- Actions ----------------------- */

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const handleAction = (action, proposal) => {
    switch (action) {
      case "view":
        setPreviewProposal(proposal);
        break;
      case "edit":
        // TODO: navigate to edit page: /proposals/:id/edit
        showToast(`Open editor for ${proposal.client}`, "info");
        break;
      case "download":
        // Simulate PDF download
        downloadProposalPdf(proposal);
        break;
      case "delete":
        setConfirmDialog({
          open: true,
          title: "Delete proposal",
          message: `Delete proposal ${proposal.number || proposal.client}? This cannot be undone.`,
          onConfirm: () => {
            setProposals((prev) => prev.filter((p) => p.id !== proposal.id));
            setConfirmDialog({ open: false });
            showToast("Proposal deleted", "success");
          },
          onCancel: () => setConfirmDialog({ open: false })
        });
        break;
      case "duplicate":
        duplicateProposal(proposal);
        break;
      case "send":
        // open send modal
        setSendProposal({ ...proposal, to: findClientEmail(proposal.client) || "" });
        break;
      case "status":
        // open small confirm dialog for status change handled elsewhere
        break;
      default:
        break;
    }
  };

  function findClientEmail(clientName) {
    const client = clients.find((c) => c.name === clientName);
    return client?.email || "";
  }

  function duplicateProposal(proposal) {
    const newId = Date.now();
    const dup = {
      ...proposal,
      id: newId,
      number: `DUP-${proposal.number || newId}`,
      created: new Date().toISOString(),
      status: "draft"
    };
    setProposals((prev) => [dup, ...prev]);
    showToast("Proposal duplicated", "success");
  }

  function downloadProposalPdf(proposal) {
    // Simple HTML to blob -> download (simulation)
    const html = renderProposalHtml(proposal);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${proposal.number || proposal.client}-proposal.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Proposal downloaded (HTML)", "success");
  }

  function renderProposalHtml(proposal) {
    return `
      <html><body>
      <h1>Proposal: ${proposal.number || proposal.client}</h1>
      <p>Client: ${proposal.client} (${proposal.company})</p>
      <p>Total: $${proposal.total.toLocaleString()}</p>
      <p>Status: ${proposal.status}</p>
      <hr/>
      <p>Items: ${proposal.items}</p>
      </body></html>
    `;
  }

  /* ---------------------- Bulk Actions ----------------------- */

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      showToast("Select at least one proposal", "error");
      return;
    }
    setConfirmDialog({
      open: true,
      title: "Delete selected proposals",
      message: `Delete ${ids.length} proposals? This action is permanent.`,
      onConfirm: () => {
        setProposals((prev) => prev.filter((p) => !ids.includes(p.id)));
        setSelectedIds(new Set());
        setConfirmDialog({ open: false });
        showToast(`${ids.length} proposals deleted`, "success");
      },
      onCancel: () => setConfirmDialog({ open: false })
    });
  }

  async function handleBulkExportCSV(all = false) {
    const rows = (all ? sortedProposals : sortedProposals.filter((p) => selectedIds.has(p.id))).map((p) => ({
      number: p.number || "",
      client: p.client,
      company: p.company,
      total: p.total,
      status: p.status,
      items: p.items,
      created: p.created,
      expires: p.expires
    }));
    if (rows.length === 0) {
      showToast("No proposals to export", "error");
      return;
    }
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proposals-export-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("CSV exported", "success");
  }

  function toCSV(rows) {
    const keys = Object.keys(rows[0]);
    const lines = [keys.join(",")];
    for (const r of rows) {
      const vals = keys.map((k) => {
        const v = r[k];
        if (typeof v === "string") {
          return `"${v.replace(/"/g, '""')}"`;
        }
        return v;
      });
      lines.push(vals.join(","));
    }
    return lines.join("\n");
  }

  async function handleBulkSend() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      showToast("Select at least one proposal to send", "error");
      return;
    }
    setBulkProcessing(true);
    // Simulate send sequence
    for (const id of ids) {
      await new Promise((r) => setTimeout(r, 400));
      setProposals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "sent", lastUpdated: "just now" } : p))
      );
    }
    setBulkProcessing(false);
    setSelectedIds(new Set());
    showToast(`${ids.length} proposals sent`, "success");
  }

  /* ---------------------- Send Modal Handlers ----------------------- */

  function handleSendNow(payload) {
    // payload: { proposalId, to, subject, body }
    // TODO: replace with real API call to send email / track activity
    setProposals((prev) => prev.map((p) => (p.id === payload.proposalId ? { ...p, status: "sent" } : p)));
    setSendProposal(null);
    showToast("Proposal sent (simulated)", "success");
  }

  /* ---------------------- Quick Client Add ----------------------- */

  function handleInviteClient() {
    if (!newClientEmail || !newClientName) {
      showToast("Provide name & email", "error");
      return;
    }
    if (clients.some((c) => c.email === newClientEmail)) {
      showToast("Client already exists", "error");
      return;
    }
    const newClient = { id: `c${Date.now()}`, name: newClientName, email: newClientEmail };
    setClients((c) => [newClient, ...c]);
    setQuickClientModalOpen(false);
    setNewClientEmail("");
    setNewClientName("");
    showToast("Client added", "success");
  }

  /* ---------------------- Inline status update ----------------------- */

  function changeStatus(proposalId, nextStatus) {
    const old = proposals.find((p) => p.id === proposalId);
    if (!old) return;
    // Confirm if changing to expired (destructive) or accepted (important)
    setConfirmDialog({
      open: true,
      title: `Change status to ${nextStatus}`,
      message: `Change status of ${old.client} to ${nextStatus}?`,
      onConfirm: () => {
        setProposals((prev) => prev.map((p) => (p.id === proposalId ? { ...p, status: nextStatus } : p)));
        setConfirmDialog({ open: false });
        showToast("Status updated", "success");
      },
      onCancel: () => setConfirmDialog({ open: false })
    });
  }

  /* ---------------------- Small helpers ----------------------- */
  const stats = {
    total: proposals.length,
    draft: proposals.filter((p) => p.status === "draft").length,
    sent: proposals.filter((p) => p.status === "sent").length,
    accepted: proposals.filter((p) => p.status === "accepted").length,
    totalValue: proposals.reduce((sum, p) => sum + p.total, 0)
  };

  /* ---------------------- Render ----------------------- */

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-8">
      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Proposal Management</h1>
            <p className="text-gray-600 mt-2">Create, manage, and track your business proposals.</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setQuickClientModalOpen(true)}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm hover:shadow-md"
            >
              <FaUsers /> Quick Add Client
            </button>

            <Link
              to="/proposals/create"
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow"
            >
              <FaPlus />
              <span>Create New Proposal</span>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500">Total Proposals</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </motion.div>

        <motion.div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-yellow-400">
          <h3 className="text-sm font-medium text-gray-500">Draft</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.draft}</p>
        </motion.div>

        <motion.div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500">Sent</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.sent}</p>
        </motion.div>

        <motion.div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-500">Accepted</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.accepted}</p>
        </motion.div>

        <motion.div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
          <p className="text-3xl font-bold text-gray-900">${stats.totalValue.toLocaleString()}</p>
        </motion.div>
      </div>

      {/* Controls */}
      <motion.div className="bg-white rounded-xl shadow p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full lg:w-1/3">
            <div className="relative w-full">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                aria-label="Search proposals"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search proposals, client, company or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="expired">Expired</option>
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount-high">Amount: High → Low</option>
              <option value="amount-low">Amount: Low → High</option>
            </select>

            <div className="flex items-center border rounded-lg overflow-hidden">
              <button className={`px-4 py-2 ${viewMode === "grid" ? "bg-blue-600 text-white" : "bg-white"}`} onClick={() => setViewMode("grid")}>Grid</button>
              <button className={`px-4 py-2 ${viewMode === "table" ? "bg-blue-600 text-white" : "bg-white"}`} onClick={() => setViewMode("table")}>Table</button>
            </div>

            {/* Bulk actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkExportCSV(false)}
                className="px-3 py-2 bg-white border rounded hover:shadow-sm flex items-center gap-2"
                title="Export selected to CSV"
              >
                <FaFilePdf /> Export CSV
              </button>
              <button
                onClick={handleBulkSend}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                disabled={bulkProcessing}
                title="Send selected"
              >
                {bulkProcessing ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                Send Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                title="Delete selected"
              >
                <FaTrash /> Delete Selected
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* List / Grid */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {loading ? (
                // Loading placeholders
                Array.from({ length: 6 }).map((_, i) => (
                  <motion.div key={i} className="bg-white rounded-xl p-6 shadow animate-pulse h-48" />
                ))
              ) : currentPageData.length ? (
                currentPageData.map((proposal) => (
                  <ProposalCardExtended key={proposal.id} proposal={proposal} onAction={handleAction} selected={selectedIds.has(proposal.id)} onSelect={() => toggleSelect(proposal.id)} />
                ))
              ) : (
                <motion.div className="col-span-full text-center py-12 bg-white rounded-xl shadow">
                  <FaFilePdf className="text-6xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600">No proposals found</h3>
                  <p className="text-gray-500 mt-2">
                    {searchTerm || statusFilter !== "all" ? "Try adjusting your search or filters" : "Get started by creating your first proposal"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-gray-900">
                    <input type="checkbox" aria-label="Select page" checked={selectAllPage} onChange={(e) => setSelectAllPage(e.target.checked)} />
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-900">Client</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-900">Total</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-900">Items</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-900">Expires</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {loading ? (
                    Array.from({ length: perPage }).map((_, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-4"><div className="w-4 h-4 bg-gray-200 rounded" /></td>
                        <td className="p-4"><div className="h-4 bg-gray-200 w-48 rounded" /></td>
                        <td className="p-4"><div className="h-4 bg-gray-200 w-24 rounded" /></td>
                        <td className="p-4"><div className="h-4 bg-gray-200 w-20 rounded" /></td>
                        <td className="p-4"><div className="h-4 bg-gray-200 w-12 rounded" /></td>
                        <td className="p-4"><div className="h-4 bg-gray-200 w-28 rounded" /></td>
                        <td className="p-4"><div className="h-4 bg-gray-200 w-28 rounded" /></td>
                      </tr>
                    ))
                  ) : currentPageData.length ? (
                    currentPageData.map((proposal) => (
                      <ProposalTableRowExtended key={proposal.id} proposal={proposal} onAction={handleAction} selected={selectedIds.has(proposal.id)} onSelect={() => toggleSelect(proposal.id)} changeStatus={changeStatus} />
                    ))
                  ) : (
                    <tr>
                      <td className="p-6 text-center" colSpan={7}>
                        <div className="text-gray-500">No proposals to show</div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Showing {(page - 1) * perPage + 1} - {Math.min(page * perPage, sortedProposals.length)} of {sortedProposals.length} proposals
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="p-2 rounded border"><FaChevronLeft /></button>
            <div className="px-3 py-1 border rounded">{page} / {totalPages}</div>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="p-2 rounded border"><FaChevronRight /></button>
          </div>
        </div>
      </motion.div>

      {/* Preview Modal */}
      <PreviewModal proposal={previewProposal} onClose={() => setPreviewProposal(null)} />

      {/* Send Modal */}
      <SendModal open={!!sendProposal} data={sendProposal} onClose={() => setSendProposal(null)} onSend={handleSendNow} />

      {/* Quick Client Modal */}
      {quickClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setQuickClientModalOpen(false)} />
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-lg p-6 z-10 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Quick Add Client</h3>
            <p className="text-sm text-gray-600 mb-4">Add a client quickly to link while creating proposals.</p>
            <div className="space-y-3">
              <input placeholder="Client name" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} className="w-full border rounded px-3 py-2" />
              <input placeholder="Client email" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} className="w-full border rounded px-3 py-2" />
              <div className="flex justify-end gap-3">
                <button onClick={() => setQuickClientModalOpen(false)} className="px-4 py-2 rounded border">Cancel</button>
                <button onClick={handleInviteClient} className="px-4 py-2 rounded bg-blue-600 text-white">Add Client</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog {...confirmDialog} />

      {/* Toast */}
      {toast && (
        <div className="fixed right-6 bottom-6 z-50">
          <AnimatePresence>
            <Toast key={toast.message} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

/* ---------------------- Extended Card & Row Components ---------------------- */

const ProposalCardExtended = ({ proposal, onAction, selected, onSelect }) => {
  return (
    <motion.div layout className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <input aria-label={`Select proposal ${proposal.number || proposal.client}`} checked={selected} onChange={onSelect} type="checkbox" className="mt-2" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{proposal.client} <span className="text-xs text-gray-400 ml-2">{proposal.number}</span></h3>
              <p className="text-sm text-gray-500">{proposal.company}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <StatusBadge status={proposal.status} />
            <div className="text-right text-sm text-gray-500">
              <div>Updated {proposal.lastUpdated}</div>
              <div className="mt-1">Expires {new Date(proposal.expires).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-xl font-bold text-gray-900">${proposal.total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Items</p>
            <p className="text-lg font-semibold text-gray-900">{proposal.items}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">Created {new Date(proposal.created).toLocaleDateString()}</div>
          <div className="flex items-center gap-2">
            <IconButton title="View" onClick={() => onAction("view", proposal)}><FaEye /></IconButton>
            <IconButton title="Edit" onClick={() => onAction("edit", proposal)}><FaEdit /></IconButton>
            <IconButton title="Download" onClick={() => onAction("download", proposal)}><FaDownload /></IconButton>
            <IconButton title="Duplicate" onClick={() => onAction("duplicate", proposal)}><FaCopy /></IconButton>
            <IconButton title="Send" onClick={() => onAction("send", proposal)}><FaPaperPlane /></IconButton>
            <IconButton title="Delete" onClick={() => onAction("delete", proposal)} danger><FaTrash /></IconButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ProposalTableRowExtended = ({ proposal, onAction, selected, onSelect, changeStatus }) => {
  const [statusOpen, setStatusOpen] = useState(false);
  return (
    <motion.tr layout className="border-b hover:bg-gray-50">
      <td className="p-4">
        <input type="checkbox" checked={selected} onChange={onSelect} aria-label={`Select proposal ${proposal.number}`} />
      </td>
      <td className="p-4">
        <div>
          <p className="font-medium text-gray-900">{proposal.client}</p>
          <p className="text-sm text-gray-500">{proposal.company} • <span className="text-xs text-gray-400">{proposal.number}</span></p>
        </div>
      </td>
      <td className="p-4"><span className="font-semibold">${proposal.total.toLocaleString()}</span></td>
      <td className="p-4">
        <div className="relative inline-block text-left">
          <div>
            <button onClick={() => setStatusOpen((s) => !s)} className="inline-flex justify-center w-full px-3 py-1 border rounded bg-white">
              <StatusBadge status={proposal.status} />
              <FaChevronDown className="ml-2 mt-1 text-gray-500" />
            </button>
          </div>

          {statusOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-44 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
              <div className="py-1">
                {["draft", "sent", "accepted", "expired"].map((s) => (
                  <button key={s} onClick={() => { setStatusOpen(false); changeStatus(proposal.id, s); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </td>
      <td className="p-4"><span className="text-sm text-gray-600">{proposal.items} items</span></td>
      <td className="p-4"><span className="text-sm text-gray-600">{new Date(proposal.expires).toLocaleDateString()}</span></td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => onAction("view", proposal)} className="text-blue-600 hover:text-blue-800"><FaEye /></button>
          <button onClick={() => onAction("edit", proposal)} className="text-green-600 hover:text-green-800"><FaEdit /></button>
          <button onClick={() => onAction("download", proposal)} className="text-purple-600 hover:text-purple-800"><FaDownload /></button>
          <button onClick={() => onAction("duplicate", proposal)} className="text-gray-600 hover:text-gray-800"><FaCopy /></button>
          <button onClick={() => onAction("delete", proposal)} className="text-red-600 hover:text-red-800"><FaTrash /></button>
        </div>
      </td>
    </motion.tr>
  );
};

/* ---------------------- Small UI helpers ----------------------- */

const IconButton = ({ children, title, onClick, danger }) => (
  <button title={title} onClick={onClick} className={`p-2 rounded-md ${danger ? "text-red-600 hover:bg-red-50" : "text-gray-600 hover:bg-gray-50"} transition-colors`}>
    {children}
  </button>
);

/* ---------------------- Preview Modal ----------------------- */

const PreviewModal = ({ proposal, onClose }) => {
  if (!proposal) return null;
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; padding: 20px;">
      <h1>Proposal ${proposal.number || proposal.client}</h1>
      <p><strong>Client:</strong> ${proposal.client}</p>
      <p><strong>Company:</strong> ${proposal.company}</p>
      <p><strong>Total:</strong> $${proposal.total.toLocaleString()}</p>
      <hr/>
      <p>Items: ${proposal.items}</p>
    </div>
  `;
  const handleDownload = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${proposal.number || proposal.client}-preview.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="z-10 w-[90%] md:w-3/4 lg:w-2/3 bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Proposal Preview</h3>
            <p className="text-sm text-gray-500">{proposal.client} • {proposal.number}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload} className="px-3 py-2 rounded border">Download</button>
            <button onClick={onClose} className="px-3 py-2 rounded bg-gray-200">Close</button>
          </div>
        </div>

        <div className="p-6">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </motion.div>
    </div>
  );
};

/* ---------------------- Send Modal ----------------------- */

const SendModal = ({ open, data, onClose, onSend }) => {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  useEffect(() => {
    if (data) {
      setTo(data.to || "");
      setSubject(`Proposal ${data.number || data.client} from Innova`);
      setBody(`Hi ${data.client},\n\nPlease find attached the proposal.\n\nRegards,\nInnova`);
    }
  }, [data]);

  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-lg p-6 z-10 w-full max-w-2xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Send Proposal</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100"><FaTimes /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">To</label>
            <input value={to} onChange={(e) => setTo(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="w-full border rounded px-3 py-2" />
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
            <button onClick={() => onSend({ proposalId: data.id, to, subject, body })} className="px-4 py-2 rounded bg-blue-600 text-white">Send</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProposalManagement;
