import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilePdf, FaSpinner, FaInbox, FaExclamationTriangle } from 'react-icons/fa';

// Hooks
import { useProposals, useClients, useProducts } from './hooks/useFirebase';

// Components
import { Header } from './Header';
import { Stats } from './Stats';
import { Controls } from './Controls';
import { Pagination } from './Paginaton';
import { ProposalCardExtended } from './ProposalCardExtended';
import { ProposalTableRowExtended } from './ProposalTableRowExtended';
import { PreviewModal } from './PreviewModel';
import { SendModal } from './SendModal';
import { QuickClientModal } from './QuickClientModal';
import CreateProposalModal from './CreateProposalModal';
import EditProposalModal from './EditProposal';
import { ConfirmDialog } from './ConfirmDialog';
import { Toast } from './Toast';
import DebugInfo from './DebugInfo';

// Utility for PDF download
import { downloadProposalPdf } from './DownloadProposal';

const ProposalManagement = ({ user }) => {
  // Error handling state
  const [errors, setErrors] = useState({
    proposals: null,
    clients: null,
    products: null
  });

  // Firebase hooks with error handling
  const { 
    proposals, 
    loading: proposalsLoading, 
    error: proposalsError,
    addProposal, 
    updateProposal, 
    deleteProposal, 
    bulkDeleteProposals 
  } = useProposals(user);

  const { 
    clients, 
    loading: clientsLoading, 
    error: clientsError,
    addClient 
  } = useClients(user);

  const { 
    products, 
    loading: productsLoading, 
    error: productsError
  } = useProducts(user);

  // Update error state when Firebase errors occur
  useEffect(() => {
    setErrors({
      proposals: proposalsError,
      clients: clientsError,
      products: productsError
    });
  }, [proposalsError, clientsError, productsError]);

  // Local UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAllPage, setSelectAllPage] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 6;

  // Modals / UI state
  const [previewProposal, setPreviewProposal] = useState(null);
  const [sendProposal, setSendProposal] = useState(null);
  const [createProposalModalOpen, setCreateProposalModalOpen] = useState(false);
  const [editProposalModalOpen, setEditProposalModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const [toast, setToast] = useState(null);
  const [quickClientModalOpen, setQuickClientModalOpen] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Combined loading state
  const loading = proposalsLoading || clientsLoading || productsLoading;

  /* ---------------------- Filtering & Sorting ---------------------- */
  const filteredProposals = useMemo(() => {
    const list = proposals || [];
    return list.filter((proposal) => {
      const matchesSearch =
        proposal.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (proposal.proposalNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (proposal.proposalTitle || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [proposals, searchTerm, statusFilter]);

  const sortedProposals = useMemo(() => {
    const arr = [...filteredProposals];
    arr.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'amount-high':
          return (b.grandTotal || 0) - (a.grandTotal || 0);
        case 'amount-low':
          return (a.grandTotal || 0) - (b.grandTotal || 0);
        default:
          return 0;
      }
    });
    return arr;
  }, [filteredProposals, sortBy]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(sortedProposals.length / perPage));
  const currentPageData = useMemo(() => 
    sortedProposals.slice((page - 1) * perPage, page * perPage),
    [sortedProposals, page, perPage]
  );

  /* ---------------------- Selection Helpers ----------------------- */
  // Fix: Handle select all for current page
  const handleSelectAllPage = (checked) => {
    setSelectAllPage(checked);
    if (checked) {
      setSelectedIds(prev => {
        const ids = new Set(prev);
        currentPageData.forEach((p) => ids.add(p.id));
        return ids;
      });
    } else {
      setSelectedIds(prev => {
        const ids = new Set(prev);
        currentPageData.forEach((p) => ids.delete(p.id));
        return ids;
      });
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const ids = new Set(prev);
      if (ids.has(id)) ids.delete(id);
      else ids.add(id);
      return ids;
    });
  };

  // Fix: Reset selectAllPage when data changes
  useEffect(() => {
    setSelectAllPage(false);
  }, [currentPageData]);

  /* ---------------------- Actions ----------------------- */
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const findClientEmail = (clientId) => {
    const client = (clients || []).find((c) => c.id === clientId);
    return client?.email || '';
  };

  // Updated PDF download handler
  const downloadProposalPdfHandler = async (proposal) => {
    try {
      await downloadProposalPdf(proposal);
      showToast('Proposal PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showToast('Failed to download PDF', 'error');
    }
  };

  const duplicateProposal = async (proposal) => {
    try {
      const { id, createdAt, updatedAt, ...proposalData } = proposal;
      const newProposal = {
        ...proposalData,
        proposalNumber: `DUP-${proposal.proposalNumber || 'PROP'}-${Date.now()}`,
        status: 'draft'
      };

      // Remove undefined fields (especially expires)
      Object.keys(newProposal).forEach(
        (key) => newProposal[key] === undefined && delete newProposal[key]
      );

      await addProposal(newProposal);
      showToast('Proposal duplicated successfully', 'success');
    } catch (error) {
      console.error('Error duplicating proposal:', error);
      showToast(`Error duplicating proposal: ${error.message}`, 'error');
      throw error;
    }
  };

  const handleAction = async (action, proposal) => {
    try {
      switch (action) {
        case 'view':
          setPreviewProposal(proposal);
          break;
        case 'edit':
          setEditingProposal(proposal);
          setEditProposalModalOpen(true);
          break;
        case 'download':
          await downloadProposalPdfHandler(proposal);
          break;
        case 'delete':
          setConfirmDialog({
            open: true,
            title: 'Delete proposal',
            message: `Delete proposal ${proposal.proposalNumber || proposal.client}? This cannot be undone.`,
            onConfirm: async () => {
              try {
                await deleteProposal(proposal.id);
                setConfirmDialog({ open: false });
                showToast('Proposal deleted', 'success');
              } catch (error) {
                console.error('Error deleting proposal:', error);
                showToast(`Error deleting proposal: ${error.message}`, 'error');
              }
            },
            onCancel: () => setConfirmDialog({ open: false })
          });
          break;
        case 'duplicate':
          await duplicateProposal(proposal);
          break;
        case 'send':
          setSendProposal({ 
            ...proposal, 
            to: findClientEmail(proposal.clientId) || '' 
          });
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error in handleAction (${action}):`, error);
      showToast(`Error performing action: ${error.message}`, 'error');
    }
  };

  /* ---------------------- Bulk Actions ----------------------- */
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      showToast('Select at least one proposal', 'error');
      return;
    }
    
    setConfirmDialog({
      open: true,
      title: 'Delete selected proposals',
      message: `Delete ${ids.length} proposals? This action is permanent.`,
      onConfirm: async () => {
        try {
          setBulkProcessing(true);
          await bulkDeleteProposals(ids);
          setSelectedIds(new Set());
          setConfirmDialog({ open: false });
          showToast(`${ids.length} proposals deleted successfully`, 'success');
        } catch (error) {
          console.error('Error bulk deleting proposals:', error);
          showToast(`Error deleting proposals: ${error.message}`, 'error');
        } finally {
          setBulkProcessing(false);
        }
      },
      onCancel: () => setConfirmDialog({ open: false })
    });
  };

  const toCSV = (rows) => {
    if (rows.length === 0) return '';
    const keys = Object.keys(rows[0]);
    const lines = [keys.join(',')];
    for (const r of rows) {
      const vals = keys.map((k) => {
        const v = r[k];
        if (typeof v === 'string') {
          return `"${v.replace(/"/g, '""')}"`;
        }
        return v;
      });
      lines.push(vals.join(','));
    }
    return lines.join('\n');
  };

  const handleBulkExportCSV = async (all = false) => {
    try {
      const rows = (all ? sortedProposals : sortedProposals.filter((p) => selectedIds.has(p.id))).map((p) => ({
        number: p.proposalNumber || '',
        client: p.client || '',
        company: p.company || '',
        total: p.grandTotal || 0,
        status: p.status || '',
        items: p.products?.length || 0,
        created: p.createdAt?.toLocaleDateString() || '',
        expires: p.expires?.toLocaleDateString() || ''
      }));
      
      if (rows.length === 0) {
        showToast('No proposals to export', 'error');
        return;
      }
      
      // CSV export implementation
      const csv = toCSV(rows);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposals-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      
      showToast('CSV exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      showToast(`Error exporting CSV: ${error.message}`, 'error');
    }
  };

  const handleBulkSend = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      showToast('Select at least one proposal to send', 'error');
      return;
    }
    
    try {
      setBulkProcessing(true);
      const updatePromises = ids.map(id => 
        updateProposal(id, { status: 'sent', lastUpdated: 'just now' })
      );
      await Promise.all(updatePromises);
      setSelectedIds(new Set());
      showToast(`${ids.length} proposals sent successfully`, 'success');
    } catch (error) {
      console.error('Error sending proposals:', error);
      showToast(`Error sending proposals: ${error.message}`, 'error');
    } finally {
      setBulkProcessing(false);
    }
  };

  /* ---------------------- Create/Edit Proposal Handlers ----------------------- */
  const handleSaveNewProposal = async (newProposal) => {
    try {
      await addProposal(newProposal);
      setCreateProposalModalOpen(false);
      showToast('Proposal created successfully', 'success');
    } catch (error) {
      console.error('Error creating proposal:', error);
      showToast(`Error creating proposal: ${error.message}`, 'error');
    }
  };

  const handleSaveEditedProposal = async (updatedProposal) => {
    try {
      const { id, ...updates } = updatedProposal;
      await updateProposal(id, updates);
      setEditProposalModalOpen(false);
      setEditingProposal(null);
      showToast('Proposal updated successfully', 'success');
    } catch (error) {
      console.error('Error updating proposal:', error);
      showToast(`Error updating proposal: ${error.message}`, 'error');
    }
  };

  /* ---------------------- Quick Client Add ----------------------- */
  const handleInviteClient = async (clientData) => {
    try {
      await addClient(clientData);
      setQuickClientModalOpen(false);
      showToast('Client added successfully', 'success');
    } catch (error) {
      console.error('Error adding client:', error);
      showToast(`Error adding client: ${error.message}`, 'error');
    }
  };

  /* ---------------------- Inline status update ----------------------- */
  const changeStatus = (proposalId, nextStatus) => {
    const proposal = (proposals || []).find((p) => p.id === proposalId);
    if (!proposal) return;
    
    setConfirmDialog({
      open: true,
      title: `Change status to ${nextStatus}`,
      message: `Change status of ${proposal.client} to ${nextStatus}?`,
      onConfirm: async () => {
        try {
          await updateProposal(proposalId, { status: nextStatus });
          setConfirmDialog({ open: false });
          showToast('Status updated successfully', 'success');
        } catch (error) {
          console.error('Error updating status:', error);
          showToast(`Error updating status: ${error.message}`, 'error');
        }
      },
      onCancel: () => setConfirmDialog({ open: false })
    });
  };

  /* ---------------------- Send Proposal Handler ----------------------- */
  const handleSendProposal = async (emailData) => {
    try {
      await updateProposal(emailData.proposalId, { 
        status: 'sent',
        lastUpdated: 'just now'
      });
      setSendProposal(null);
      showToast('Proposal sent successfully', 'success');
    } catch (error) {
      console.error('Error sending proposal:', error);
      showToast(`Error sending proposal: ${error.message}`, 'error');
    }
  };

  /* ---------------------- Stats ----------------------- */
  const stats = {
    total: (proposals || []).length,
    draft: (proposals || []).filter((p) => p.status === 'draft').length,
    sent: (proposals || []).filter((p) => p.status === 'sent').length,
    accepted: (proposals || []).filter((p) => p.status === 'accepted').length,
    totalValue: (proposals || []).reduce((sum, p) => sum + (p.grandTotal || 0), 0)
  };

  /* ---------------------- Render ----------------------- */
  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-8">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading proposal data...</p>
            <div className="mt-2 text-sm text-gray-500">
              <div>Proposals: {proposalsLoading ? 'Loading...' : 'Ready'}</div>
              <div>Clients: {clientsLoading ? 'Loading...' : 'Ready'}</div>
              <div>Products: {productsLoading ? 'Loading...' : 'Ready'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {(errors.proposals || errors.clients || errors.products) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-2" />
            <h3 className="text-red-800 font-semibold">Data Loading Issues</h3>
          </div>
          <div className="mt-2 text-sm text-red-700">
            {errors.proposals && <div>Proposals: {errors.proposals}</div>}
            {errors.clients && <div>Clients: {errors.clients}</div>}
            {errors.products && <div>Products: {errors.products}</div>}
          </div>
        </motion.div>
      )}

      {!loading && (
        <>
          <Header 
            onQuickAddClient={() => setQuickClientModalOpen(true)} 
            onCreateProposal={() => setCreateProposalModalOpen(true)}
            user={user}
          />
          
          <Stats stats={stats} />

          <Controls
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onBulkExport={handleBulkExportCSV}
            onBulkSend={handleBulkSend}
            onBulkDelete={handleBulkDelete}
            bulkProcessing={bulkProcessing}
            selectedCount={selectedIds.size}
          />

          {/* List / Grid */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                  {currentPageData.length ? (
                    currentPageData.map((proposal) => (
                      <ProposalCardExtended 
                        key={proposal.id} 
                        proposal={proposal}
                        onAction={handleAction} 
                        selected={selectedIds.has(proposal.id)} 
                        onSelect={() => toggleSelect(proposal.id)} 
                      />
                    ))
                  ) : (
                    <motion.div className="col-span-full text-center py-12 bg-white rounded-xl shadow">
                      <FaFilePdf className="text-6xl text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600">No proposals found</h3>
                      <p className="text-gray-500 mt-2">
                        {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Get started by creating your first proposal'}
                      </p>
                      {errors.proposals && (
                        <p className="text-red-500 mt-2">
                          There was an issue loading proposals. Please refresh the page.
                        </p>
                      )}
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
                        <input 
                          type="checkbox" 
                          aria-label="Select page" 
                          checked={selectAllPage} 
                          onChange={(e) => handleSelectAllPage(e.target.checked)} 
                        />
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
                      {currentPageData.length ? (
                        currentPageData.map((proposal) => (
                          <ProposalTableRowExtended 
                            key={proposal.id} 
                            proposal={proposal} 
                            onAction={handleAction} 
                            selected={selectedIds.has(proposal.id)} 
                            onSelect={() => toggleSelect(proposal.id)} 
                            changeStatus={changeStatus} 
                          />
                        ))
                      ) : (
                        <tr>
                          <td className="p-6 text-center" colSpan={7}>
                            <div className="text-gray-500">No proposals to show</div>
                            {errors.proposals && (
                              <div className="text-red-500 mt-2">
                                Error loading proposals
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              currentPage={page}
              totalItems={sortedProposals.length}
              perPage={perPage}
              onPageChange={setPage}
            />
          </motion.div>

          {/* Modals */}
          <PreviewModal proposal={previewProposal} onClose={() => setPreviewProposal(null)} />
          
          <SendModal 
            open={!!sendProposal} 
            data={sendProposal} 
            onClose={() => setSendProposal(null)} 
            onSend={handleSendProposal}
          />
          
          <CreateProposalModal
            open={createProposalModalOpen}
            onClose={() => setCreateProposalModalOpen(false)}
            onSave={handleSaveNewProposal}
            clients={clients || []}
            availableProducts={products || []}
            loading={productsLoading}
            onAddClient={addClient}
          />

          <EditProposalModal
            open={editProposalModalOpen}
            onClose={() => {
              setEditProposalModalOpen(false);
              setEditingProposal(null);
            }}
            onSave={handleSaveEditedProposal}
            proposal={editingProposal}
            clients={clients || []}
            availableProducts={products || []}
            loading={productsLoading}
          />
          
          <QuickClientModal
            open={quickClientModalOpen}
            onClose={() => setQuickClientModalOpen(false)}
            onAddClient={handleInviteClient}
            clients={clients || []}
          />

          <ConfirmDialog {...confirmDialog} />

          {/* Toast */}
          {toast && (
            <div className="fixed right-6 bottom-6 z-50">
              <AnimatePresence>
                <Toast 
                  key={toast.message} 
                  message={toast.message} 
                  type={toast.type} 
                  onClose={() => setToast(null)} 
                />
              </AnimatePresence>
            </div>
          )}

          {/* Debug Info - Remove in production */}
          <DebugInfo 
            proposals={proposals}
            clients={clients}
            products={products}
            errors={errors}
          />
        </>
      )}
    </div>
  );
};

export default ProposalManagement;