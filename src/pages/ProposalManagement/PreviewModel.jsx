import React from "react";
import { motion } from "framer-motion";
import { downloadProposalPdf } from "./DownloadProposal";

export const PreviewModal = ({ proposal, onClose }) => {
  if (!proposal) return null;

  const computePayload = () => {
    const selectedProducts = proposal.products || proposal.items || [];
    const rfqItems = proposal.rfqItems || [];
    const subtotal = (selectedProducts || []).reduce((s, p) => s + ((p.unitPrice ?? p.price ?? 0) * (p.quantity ?? 1)), 0);
    const totalDiscount = (selectedProducts || []).reduce((s, p) => s + ((p.unitPrice ?? p.price ?? 0) * (p.quantity ?? 1) * ((p.discount ?? 0) / 100)), 0);
    const taxableSubtotal = (selectedProducts || []).filter(p => p.taxable).reduce((s, p) => s + ((p.unitPrice ?? p.price ?? 0) * (p.quantity ?? 1)), 0);
    const taxAmount = taxableSubtotal * ((proposal.taxRate ?? 0) / 100);
    const grandTotal = typeof proposal.grandTotal === 'number' ? proposal.grandTotal : (subtotal - totalDiscount + taxAmount);
    const formatCurrency = (amt) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt || 0);

    return { proposal, selectedProducts, rfqItems, subtotal, totalDiscount, taxAmount, grandTotal, formatCurrency };
  };

  const handleDownload = async () => {
    try {
      const payload = computePayload();
      await downloadProposalPdf(payload);
    } catch (error) {
      console.error('Preview download failed:', error);
      alert('Error generating PDF. Check console.');
    }
  };

  const modalHtml = `
    <div style="font-family: Arial, Helvetica, sans-serif; padding: 20px;">
      <h1>Proposal ${proposal.proposalNumber || proposal.number || proposal.client}</h1>
      <p><strong>Client:</strong> ${proposal.client || proposal.clientName || 'N/A'}</p>
      <p><strong>Company:</strong> ${proposal.company || proposal.companyDetails?.name || 'N/A'}</p>
      <p><strong>Total:</strong> ${(proposal.grandTotal ?? proposal.total ?? 0)}</p>
      <hr/>
      <p>Items: ${(proposal.products || proposal.items || []).length}</p>
    </div>
  `;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="z-10 w-[90%] md:w-3/4 lg:w-2/3 bg-white rounded-lg shadow-lg overflow-hidden"
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Proposal Preview</h3>
            <p className="text-sm text-gray-500">{proposal.client} • {proposal.proposalNumber || proposal.number}</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownload} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Download PDF
            </button>
            <button 
              onClick={onClose} 
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div 
            className="bg-white p-6 border rounded-lg"
            dangerouslySetInnerHTML={{ __html: modalHtml }} 
          />
        </div>
      </motion.div>
    </div>
  );
};