import React from 'react';
import { motion } from 'framer-motion';
import {
  FiX,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiAlertCircle,
  FiCheckCircle,
  FiArchive,
  FiClock as FiTime,
  FiUser,
  FiLayers,
  FiCheck,
  FiSquare,
} from 'react-icons/fi';

// Updated CaseDetailModal
// - Replaces single "Billable Hours" row with a detailed "Entries" column that shows
//   the fields you pasted (caseValue, caseType, clientId, documentsCount, scheduleTime, etc.)
// - Makes progress handling robust (accepts number or string like '27' or '27%')
// - Safely reads documentsCount whether top-level or nested in evidence
// - Shows tasks list with completed state

const CaseDetailModal = ({ caseItem, onClose }) => {
  if (!caseItem) return null;

  const createdDate = caseItem.createdAt
    ? new Date(caseItem.createdAt).toLocaleString()
    : 'N/A';
  const updatedDate = caseItem.updatedAt
    ? new Date(caseItem.updatedAt).toLocaleString()
    : 'N/A';

  const parseProgress = raw => {
    if (raw === undefined || raw === null) return 0;
    if (typeof raw === 'number') return Math.max(0, Math.min(100, raw));
    const asNum = parseFloat(String(raw).replace('%', '').trim());
    return Number.isFinite(asNum) ? Math.max(0, Math.min(100, asNum)) : 0;
  };

  const progressPercent = parseProgress(caseItem.progress);

  const documentsCount =
    caseItem.documentsCount ?? caseItem.evidence?.documentsCount ?? 0;

  const tasks = Array.isArray(caseItem.tasks) ? caseItem.tasks : [];
  const totalTasks = caseItem.totalTasks ?? tasks.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-800 text-white px-6 py-4 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold">{caseItem.caseTitle || 'Untitled Case'}</h2>
            <p className="text-sm text-slate-300 mt-1">Updated: {updatedDate}</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            <FiX size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-8 space-y-6">
          <p className="text-slate-700">{caseItem.caseDescription || '—'}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column - core timeline / status */}
            <div className="space-y-4">
              <DetailRow icon={<FiCalendar />} label="Date">
                {caseItem.caseDate || '—'}
              </DetailRow>

              <DetailRow icon={<FiClock />} label="Time">
                {caseItem.caseTime || caseItem.scheduleTime || '—'}
              </DetailRow>

              <DetailRow icon={<FiMapPin />} label="Location">
                {caseItem.location || '—'}
              </DetailRow>

              <DetailRow icon={<FiAlertCircle />} label="Status">
                <Badge text={caseItem.status || '—'} type="status" />
              </DetailRow>

              <DetailRow icon={<FiCheckCircle />} label="Priority">
                <Badge text={caseItem.priority || '—'} type="priority" />
              </DetailRow>

              <DetailRow icon={<FiTime />} label="Progress">
                <ProgressBar percent={progressPercent} />
                <div className="text-xs text-slate-500 mt-1">{progressPercent}%</div>
              </DetailRow>

              <DetailRow icon={<FiClock />} label="Created At">
                {createdDate}
              </DetailRow>
            </div>

            {/* Right column - the requested "entries" shown here */}
            <div className="space-y-4">
              <SectionTitle>Entries</SectionTitle>

              <DetailRow icon={<FiArchive />} label="Case Value">
                {caseItem.caseValue ?? '—'}
              </DetailRow>

              <DetailRow icon={<FiLayers />} label="Case Type">
                {caseItem.caseType ?? '—'}
              </DetailRow>

              <DetailRow icon={<FiUser />} label="Client ID">
                {caseItem.clientId ?? '—'}
              </DetailRow>

              <DetailRow icon={<FiArchive />} label="Documents Count">
                {documentsCount}
              </DetailRow>

              <DetailRow icon={<FiClock />} label="Schedule Time">
                {caseItem.scheduleTime ?? caseItem.caseTime ?? '—'}
              </DetailRow>

              <DetailRow icon={<FiArchive />} label="Completed Tasks / Total">
                {(caseItem.completedTasks ?? 0) + ' / ' + (totalTasks ?? 0)}
              </DetailRow>

              <DetailRow icon={<FiSquare />} label="Total Tasks">
                {totalTasks}
              </DetailRow>

              <DetailRow icon={<FiCalendar />} label="Updated At">
                {updatedDate}
              </DetailRow>

              {/* Tasks preview */}
              <div>
                <div className="text-xs text-slate-500">Tasks</div>
                <div className="mt-2 space-y-2">
                  {tasks.length === 0 ? (
                    <div className="text-sm text-slate-600">No tasks</div>
                  ) : (
                    tasks.map(t => (
                      <div key={t.id} className="flex items-center gap-3">
                        <div className="mt-1">
                          {t.completed ? <FiCheck size={16} /> : <FiSquare size={16} />}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{t.text}</div>
                          <div className="text-xs text-slate-500">ID: {t.id}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Subcomponents ---
const DetailRow = ({ icon, label, children }) => (
  <div className="flex items-start">
    <div className="text-slate-500 mt-1 mr-3">{icon}</div>
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium text-slate-800">{children}</div>
    </div>
  </div>
);

const SectionTitle = ({ children }) => (
  <div className="text-sm font-semibold text-slate-700">{children}</div>
);

const Badge = ({ text, type }) => {
  const colors = {
    status: {
      Discovery: 'bg-blue-100 text-blue-800',
      Investigation: 'bg-yellow-100 text-yellow-800',
      Negotiation: 'bg-indigo-100 text-indigo-800',
      Litigation: 'bg-red-100 text-red-800',
      Settlement: 'bg-green-100 text-green-800',
      Closed: 'bg-slate-100 text-slate-800',
    },
    priority: {
      'High Priority': 'bg-orange-100 text-orange-800',
      Urgent: 'bg-red-100 text-red-800',
      'Medium Priority': 'bg-yellow-100 text-yellow-800',
      'Low Priority': 'bg-green-100 text-green-800',
    },
  };

  const style = (colors[type] && colors[type][text]) || 'bg-slate-100 text-slate-800';
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${style}`}>
      {text}
    </span>
  );
};

const ProgressBar = ({ percent = 0 }) => (
  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
    <div className="h-full" style={{ width: `${percent}%`, backgroundColor: undefined }} />
  </div>
);

export default CaseDetailModal;
