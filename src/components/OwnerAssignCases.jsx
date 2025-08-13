// OwnerAssignCases_Full.jsx
// This file contains two components: OwnerAssignCases (parent) and AssignAssociatesModal (modal UI).
// The modal no longer writes directly to Firestore — the parent performs atomic updates so backend state stays correct.

import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  deleteField,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { FiUsers } from "react-icons/fi";
import { X } from "lucide-react";

import LoadingScreen from "./LoadingSceen";
import FiltersAndSearch from "./FiltersandSearch";
import CaseCard from "./CaseCard";
import CaseDetailsModal from "./CaseDetailsModal";
import NoCasesFound from "./NoCasesFound";

// --------------------
// OwnerAssignCases
// --------------------
export default function OwnerAssignCases() {
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [assignPopupOpen, setAssignPopupOpen] = useState(false);
  const [detailsPopupOpen, setDetailsPopupOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "cases"));
        const casesData = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCases(casesData);
        setFilteredCases(casesData);
      } catch (error) {
        console.error("Error fetching cases:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  useEffect(() => {
    let filtered = cases;
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.caseTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.caseDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.caseType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "all") filtered = filtered.filter((c) => c.status?.toLowerCase() === statusFilter.toLowerCase());
    if (priorityFilter !== "all") filtered = filtered.filter((c) => c.priority?.toLowerCase() === priorityFilter.toLowerCase());
    setFilteredCases(filtered);
  }, [cases, searchTerm, statusFilter, priorityFilter]);

  const fetchAssociates = async () => {
    const q = query(collection(db, "Users"), where("role", "==", "user"), where("approved", "==", true));
    const querySnapshot = await getDocs(q);
    const usersData = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    setUsers(usersData);
  };

  const handleOpenAssignPopup = (caseItem) => {
    setSelectedCaseId(caseItem.id);
    setSelectedCase(caseItem);
    fetchAssociates();
    setAssignPopupOpen(true);
  };

  const handleOpenDetailsPopup = (caseItem) => {
    setSelectedCase(caseItem);
    setDetailsPopupOpen(true);
  };

  // Atomic assign + set permissions in a single update to Firestore
  const handleAssignWithPerms = async (caseId, userId, perms = { canEdit: true, canDelete: false }) => {
    if (!caseId) return;
    setAssignLoading(true);
    const caseRef = doc(db, "cases", caseId);
    try {
      await updateDoc(caseRef, {
        assignedTo: arrayUnion(userId),
        [`permissions.${userId}`]: { canEdit: !!perms.canEdit, canDelete: !!perms.canDelete },
      });

      // update local state
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;
          const assigned = new Set(c.assignedTo || []);
          assigned.add(userId);
          return { ...c, assignedTo: Array.from(assigned), permissions: { ...(c.permissions || {}), [userId]: { canEdit: !!perms.canEdit, canDelete: !!perms.canDelete } } };
        })
      );

      setSelectedCase((prev) => (prev && prev.id === caseId ? { ...prev, assignedTo: Array.from(new Set([...(prev.assignedTo || []), userId])), permissions: { ...(prev.permissions || {}), [userId]: { canEdit: !!perms.canEdit, canDelete: !!perms.canDelete } } } : prev));
    } catch (error) {
      console.error("Error assigning with perms:", error);
      throw error;
    } finally {
      setAssignLoading(false);
    }
  };

  // Atomic unassign + remove permissions
  const handleUnassign = async (caseId, userId) => {
    if (!caseId) return;
    setAssignLoading(true);
    const caseRef = doc(db, "cases", caseId);
    try {
      await updateDoc(caseRef, {
        assignedTo: arrayRemove(userId),
        [`permissions.${userId}`]: deleteField(),
      });

      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;
          return { ...c, assignedTo: (c.assignedTo || []).filter((id) => id !== userId), permissions: Object.fromEntries(Object.entries(c.permissions || {}).filter(([k]) => k !== userId)) };
        })
      );

      setSelectedCase((prev) => {
        if (!prev || prev.id !== caseId) return prev;
        const newPerms = Object.fromEntries(Object.entries(prev.permissions || {}).filter(([k]) => k !== userId));
        return { ...prev, assignedTo: (prev.assignedTo || []).filter((id) => id !== userId), permissions: newPerms };
      });
    } catch (error) {
      console.error("Error unassigning:", error);
      throw error;
    } finally {
      setAssignLoading(false);
    }
  };

  // Set or overwrite permission object for a user (single field update)
  const handleSetPermission = async (caseId, userId, perms = { canEdit: false, canDelete: false }) => {
    if (!caseId) return;
    setAssignLoading(true);
    const caseRef = doc(db, "cases", caseId);
    try {
      await updateDoc(caseRef, {
        [`permissions.${userId}`]: { canEdit: !!perms.canEdit, canDelete: !!perms.canDelete },
      });

      setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, permissions: { ...(c.permissions || {}), [userId]: { canEdit: !!perms.canEdit, canDelete: !!perms.canDelete } } } : c))
      );

      setSelectedCase((prev) => (prev && prev.id === caseId ? { ...prev, permissions: { ...(prev.permissions || {}), [userId]: { canEdit: !!perms.canEdit, canDelete: !!perms.canDelete } } } : prev));
    } catch (error) {
      console.error("Error setting permission:", error);
      throw error;
    } finally {
      setAssignLoading(false);
    }
  };

  // Toggle a single boolean permission
  const handleTogglePermission = async (caseId, userId, key = "canEdit") => {
    // read current from local state
    const c = cases.find((x) => x.id === caseId) || selectedCase;
    const current = c?.permissions?.[userId]?.[key] ?? false;
    await handleSetPermission(caseId, userId, { ...(c?.permissions?.[userId] || {}), [key]: !current });
  };

  const isAssignedToUser = (caseItem, userId) => (caseItem?.assignedTo || []).includes(userId);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FiUsers className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Case Assignment Management</h1>
            <p className="text-gray-600 ml-11">Assign cases to associates and manage case distribution</p>
          </div>
        </div>

        <FiltersAndSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          filteredCases={filteredCases}
          cases={cases}
        />

        {filteredCases.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCases.map((caseItem) => (
              <CaseCard key={caseItem.id} caseItem={caseItem} handleOpenDetailsPopup={handleOpenDetailsPopup} handleOpenAssignPopup={handleOpenAssignPopup} />
            ))}
          </div>
        ) : (
          <NoCasesFound cases={cases} />
        )}

        <CaseDetailsModal detailsPopupOpen={detailsPopupOpen} setDetailsPopupOpen={setDetailsPopupOpen} selectedCase={selectedCase} handleOpenAssignPopup={handleOpenAssignPopup} />

        <AssignAssociatesModal
          assignPopupOpen={assignPopupOpen}
          setAssignPopupOpen={setAssignPopupOpen}
          selectedCase={selectedCase}
          users={users}
          assignLoading={assignLoading}
          // new functions
          handleAssignWithPerms={(userId, perms) => handleAssignWithPerms(selectedCaseId, userId, perms)}
          handleUnassign={(userId) => handleUnassign(selectedCaseId, userId)}
          handleTogglePermission={(userId, key) => handleTogglePermission(selectedCaseId, userId, key)}
          handleSetPermission={(userId, perms) => handleSetPermission(selectedCaseId, userId, perms)}
          isAssignedToUser={(userId) => isAssignedToUser(selectedCase, userId)}
        />
      </div>
    </div>
  );
}

// --------------------
// AssignAssociatesModal
// --------------------
export function AssignAssociatesModal({
  assignPopupOpen,
  setAssignPopupOpen,
  selectedCase,
  users = [],
  assignLoading = false,
  handleAssignWithPerms, // (userId, perms) => Promise
  handleUnassign, // (userId) => Promise
  handleTogglePermission, // (userId, key) => Promise
  handleSetPermission, // (userId, perms) => Promise
  isAssignedToUser = () => false,
}) {
  const [localCase, setLocalCase] = useState(selectedCase || null);
  const [busyForUser, setBusyForUser] = useState({});
  const [presetForUser, setPresetForUser] = useState({}); // stores preset choice per user: 'viewer'|'editor'|'admin'|'custom'

  useEffect(() => setLocalCase(selectedCase || null), [selectedCase]);

  const close = () => setAssignPopupOpen(false);

  const handleAssignClicked = async (userId) => {
    setBusyForUser((p) => ({ ...p, [userId]: true }));
    try {
      const preset = presetForUser[userId] || "editor";
      let perms = { canEdit: false, canDelete: false };
      if (preset === "viewer") perms = { canEdit: false, canDelete: false };
      else if (preset === "editor") perms = { canEdit: true, canDelete: false };
      else if (preset === "admin") perms = { canEdit: true, canDelete: true };

      // call parent to do atomic update
      await handleAssignWithPerms(userId, perms);
      // update localCase (parent will also update but this keeps UI snappy)
      setLocalCase((prev) => prev ? { ...prev, assignedTo: Array.from(new Set([...(prev.assignedTo || []), userId])), permissions: { ...(prev.permissions || {}), [userId]: perms } } : prev);
    } catch (error) {
      console.error("Assign failed:", error);
      alert("Assign failed. Check console.");
    } finally {
      setBusyForUser((p) => ({ ...p, [userId]: false }));
    }
  };

  const handleUnassignClicked = async (userId) => {
    setBusyForUser((p) => ({ ...p, [userId]: true }));
    try {
      await handleUnassign(userId);
      setLocalCase((prev) => {
        if (!prev) return prev;
        const newAssigned = (prev.assignedTo || []).filter((id) => id !== userId);
        const newPerms = Object.fromEntries(Object.entries(prev.permissions || {}).filter(([k]) => k !== userId));
        return { ...prev, assignedTo: newAssigned, permissions: newPerms };
      });
    } catch (error) {
      console.error("Unassign failed:", error);
      alert("Unassign failed. Check console.");
    } finally {
      setBusyForUser((p) => ({ ...p, [userId]: false }));
    }
  };

  const onToggle = async (userId, key) => {
    setBusyForUser((p) => ({ ...p, [userId]: true }));
    try {
      await handleTogglePermission(userId, key);
      setLocalCase((prev) => {
        if (!prev) return prev;
        const userPerms = { ...(prev.permissions?.[userId] || {}) };
        userPerms[key] = !userPerms[key];
        return { ...prev, permissions: { ...(prev.permissions || {}), [userId]: userPerms } };
      });
    } catch (error) {
      console.error("Toggle failed:", error);
      alert("Toggle failed. Check console.");
    } finally {
      setBusyForUser((p) => ({ ...p, [userId]: false }));
    }
  };

  const onPresetChange = (userId, value) => setPresetForUser((p) => ({ ...p, [userId]: value }));

  return (
    <AnimatePresence>
      {assignPopupOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={close} />

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Assign Associates & Permissions</h2>
              <button onClick={close} className="p-2 rounded hover:bg-gray-100"><X /></button>
            </div>

            <p className="text-sm text-gray-500 mb-4">Case: <strong>{localCase?.caseTitle || "-"}</strong></p>

            <div className="space-y-3 max-h-96 overflow-auto pr-2">
              {users.map((u) => {
                const perms = localCase?.permissions?.[u.id] || { canEdit: false, canDelete: false };
                const assigned = (localCase?.assignedTo || []).includes(u.id);
                return (
                  <div key={u.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div>
                      <div className="font-medium">{u.displayName || u.name || u.email || u.id}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center text-xs">
                          <input type="checkbox" checked={!!perms.canEdit} onChange={() => onToggle(u.id, "canEdit")} disabled={!assigned || busyForUser[u.id]} className="mr-2" />
                          Edit
                        </label>

                        <label className="flex items-center text-xs">
                          <input type="checkbox" checked={!!perms.canDelete} onChange={() => onToggle(u.id, "canDelete")} disabled={!assigned || busyForUser[u.id]} className="mr-2" />
                          Delete
                        </label>
                      </div>

                      {!assigned ? (
                        <div className="flex items-center space-x-2">
                          <select value={presetForUser[u.id] || "editor"} onChange={(e) => onPresetChange(u.id, e.target.value)} className="text-sm p-1 border rounded">
                            <option value="viewer">Viewer (no edit)</option>
                            <option value="editor">Editor (edit)</option>
                            <option value="admin">Admin (edit + delete)</option>
                          </select>

                          <button onClick={() => handleAssignClicked(u.id)} disabled={assignLoading || busyForUser[u.id]} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Assign</button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button onClick={() => handleUnassignClicked(u.id)} disabled={busyForUser[u.id]} className="px-3 py-1 rounded bg-red-100 text-red-700 text-sm">Unassign</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {users.length === 0 && <div className="text-sm text-gray-500">No approved associates found.</div>}
            </div>

            <div className="mt-4 flex justify-end">
              <button onClick={close} className="px-4 py-2 rounded bg-gray-100">Close</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
