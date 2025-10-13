import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";

export const SendModal = ({ open, data, onClose, onSend }) => {
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
      <motion.div 
        initial={{ y: 16, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="bg-white rounded-lg p-6 z-10 w-full max-w-2xl shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Send Proposal</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <FaTimes />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">To</label>
            <input 
              value={to} 
              onChange={(e) => setTo(e.target.value)} 
              className="w-full border rounded px-3 py-2" 
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Subject</label>
            <input 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              className="w-full border rounded px-3 py-2" 
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Message</label>
            <textarea 
              value={body} 
              onChange={(e) => setBody(e.target.value)} 
              rows={6} 
              className="w-full border rounded px-3 py-2" 
            />
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
            <button 
              onClick={() => onSend({ proposalId: data.id, to, subject, body })} 
              className="px-4 py-2 rounded bg-blue-600 text-white"
            >
              Send
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};