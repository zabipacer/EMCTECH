import React from "react";
import { motion } from "framer-motion";

export const PreviewModal = ({ proposal, onClose }) => {
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
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="z-10 w-[90%] md:w-3/4 lg:w-2/3 bg-white rounded-lg shadow-lg overflow-hidden"
      >
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