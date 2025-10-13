import React from "react";
import { motion } from "framer-motion";

export const ConfirmDialog = ({ 
  open, 
  title, 
  message, 
  onCancel, 
  onConfirm, 
  confirmLabel = "Confirm", 
  cancelLabel = "Cancel" 
}) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onCancel} />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white rounded-lg p-6 z-10 w-full max-w-md shadow-lg"
      >
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded border border-gray-200">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white">
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
};