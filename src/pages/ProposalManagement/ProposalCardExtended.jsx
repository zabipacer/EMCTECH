import React from "react";
import { motion } from "framer-motion";
import { FaEye, FaEdit, FaDownload, FaCopy, FaPaperPlane, FaTrash } from "react-icons/fa";
import { StatusBadge } from "./StatusBadge";
import { IconButton } from "./IconButton";

export const ProposalCardExtended = ({ proposal, onAction, selected, onSelect }) => {
  return (
    <motion.div layout className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <input 
              aria-label={`Select proposal ${proposal.number || proposal.client}`} 
              checked={selected} 
              onChange={onSelect} 
              type="checkbox" 
              className="mt-2" 
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {proposal.client} <span className="text-xs text-gray-400 ml-2">{proposal.number}</span>
              </h3>
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
            <IconButton title="View" onClick={() => onAction("view", proposal)}>
              <FaEye />
            </IconButton>
            <IconButton title="Edit" onClick={() => onAction("edit", proposal)}>
              <FaEdit />
            </IconButton>
            <IconButton title="Download" onClick={() => onAction("download", proposal)}>
              <FaDownload />
            </IconButton>
            <IconButton title="Duplicate" onClick={() => onAction("duplicate", proposal)}>
              <FaCopy />
            </IconButton>
            <IconButton title="Send" onClick={() => onAction("send", proposal)}>
              <FaPaperPlane />
            </IconButton>
            <IconButton title="Delete" onClick={() => onAction("delete", proposal)} danger>
              <FaTrash />
            </IconButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
};