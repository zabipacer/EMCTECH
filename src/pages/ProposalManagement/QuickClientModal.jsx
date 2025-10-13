import React, { useState } from "react";
import { motion } from "framer-motion";

export const QuickClientModal = ({ 
  open, 
  onClose, 
  onAddClient, 
  clients 
}) => {
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientName, setNewClientName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newClientEmail || !newClientName) {
      return;
    }
    if (clients.some((c) => c.email === newClientEmail)) {
      return;
    }
    onAddClient(newClientName, newClientEmail);
    setNewClientEmail("");
    setNewClientName("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="bg-white rounded-lg p-6 z-10 w-full max-w-md"
      >
        <h3 className="text-lg font-semibold mb-2">Quick Add Client</h3>
        <p className="text-sm text-gray-600 mb-4">Add a client quickly to link while creating proposals.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input 
            placeholder="Client name" 
            value={newClientName} 
            onChange={(e) => setNewClientName(e.target.value)} 
            className="w-full border rounded px-3 py-2"
            required
          />
          <input 
            type="email"
            placeholder="Client email" 
            value={newClientEmail} 
            onChange={(e) => setNewClientEmail(e.target.value)} 
            className="w-full border rounded px-3 py-2"
            required
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">
              Add Client
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};