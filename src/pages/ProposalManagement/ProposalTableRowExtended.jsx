import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaEye, FaEdit, FaDownload, FaCopy, FaTrash, FaChevronDown } from "react-icons/fa";
import { StatusBadge } from "./StatusBadge";

export const ProposalTableRowExtended = ({ proposal, onAction, selected, onSelect, changeStatus }) => {
  const [statusOpen, setStatusOpen] = useState(false);
  
  return (
    <motion.tr layout className="border-b hover:bg-gray-50">
      <td className="p-4">
        <input 
          type="checkbox" 
          checked={selected} 
          onChange={onSelect} 
          aria-label={`Select proposal ${proposal.number}`} 
        />
      </td>
      <td className="p-4">
        <div>
          <p className="font-medium text-gray-900">{proposal.client}</p>
          <p className="text-sm text-gray-500">
            {proposal.company} • <span className="text-xs text-gray-400">{proposal.number}</span>
          </p>
        </div>
      </td>
      <td className="p-4">
        <span className="font-semibold">${proposal.total.toLocaleString()}</span>
      </td>
      <td className="p-4">
        <div className="relative inline-block text-left">
          <div>
            <button 
              onClick={() => setStatusOpen((s) => !s)} 
              className="inline-flex justify-center w-full px-3 py-1 border rounded bg-white"
            >
              <StatusBadge status={proposal.status} />
              <FaChevronDown className="ml-2 mt-1 text-gray-500" />
            </button>
          </div>

          {statusOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-44 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
              <div className="py-1">
                {["draft", "sent", "accepted", "expired"].map((s) => (
                  <button 
                    key={s} 
                    onClick={() => { 
                      setStatusOpen(false); 
                      changeStatus(proposal.id, s); 
                    }} 
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </td>
      <td className="p-4">
        <span className="text-sm text-gray-600">{proposal.items} items</span>
      </td>
      <td className="p-4">
        <span className="text-sm text-gray-600">{new Date(proposal.expires).toLocaleDateString()}</span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => onAction("view", proposal)} className="text-blue-600 hover:text-blue-800">
            <FaEye />
          </button>
          <button onClick={() => onAction("edit", proposal)} className="text-green-600 hover:text-green-800">
            <FaEdit />
          </button>
          <button onClick={() => onAction("download", proposal)} className="text-purple-600 hover:text-purple-800">
            <FaDownload />
          </button>
          <button onClick={() => onAction("duplicate", proposal)} className="text-gray-600 hover:text-gray-800">
            <FaCopy />
          </button>
          <button onClick={() => onAction("delete", proposal)} className="text-red-600 hover:text-red-800">
            <FaTrash />
          </button>
        </div>
      </td>
    </motion.tr>
  );
};