// ManageAssociates.jsx
// Owner-only Associates Manager (schema-aligned to your Firestore)
// React + Tailwind + Framer Motion + react-hook-form + Firebase v9 (modular)

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  FiUser, FiMail, FiPhone, FiPlus, FiEdit, FiTrash2, FiDownload,
  FiSearch, FiX
} from "react-icons/fi";

/* Firebase v9 (you’re importing centralized instances already) */
import {
  collection, query, where, orderBy, limit, startAfter, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp,
  arrayUnion, arrayRemove
} from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from "firebase/storage";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db, storage } from "../firebase/firebase";

/* ----------------- utils ----------------- */
function fmt(ts) {
  if (!ts) return "";
  try {
    if (typeof ts.toDate === "function") return ts.toDate().toLocaleString();
    return new Date(ts).toLocaleString();
  } catch { return String(ts); }
}

function exportCSV(filename = "export.csv", rows = []) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.setAttribute("download", filename);
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

async function uploadFile(file, path = "associates") {
  if (!file) return null;
  const name = `${path}/${Date.now()}_${file.name}`;
  const sRef = storageRef(storage, name);
  const uploadTask = uploadBytesResumable(sRef, file);
  return await new Promise((resolve, reject) => {
    uploadTask.on("state_changed", null, reject, async () => {
      const url = await getDownloadURL(uploadTask.snapshot.ref);
      resolve(url);
    });
  });
}

/* motion variants */
const containerFade = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } } };
const rowFade = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } };
const modalFade = { hidden: { opacity: 0, scale: 0.98 }, show: { opacity: 1, scale: 1 } };
const drawerFade = { hidden: { x: "100%" }, show: { x: 0 } };

/* permissions (optional) */
const ALL_PERMISSIONS = [
  { key: "canCreateCase", label: "Create Case" },
  { key: "canEditCase", label: "Edit Case" },
  { key: "canDeleteCase", label: "Delete Case" },
  { key: "canManageClients", label: "Manage Clients" },
  { key: "isAdmin", label: "Admin" },
];

/* ---------------- hook: useAssociates (role=user per your schema) ---------------- */
export function useAssociates({ pageSize = 12 } = {}) {
  const [associates, setAssociates] = useState([]);
  const [invites, setInvites] = useState([]);
  const [counts, setCounts] = useState({ total: 0, active: 0, pendingInvites: 0, pendingAssignments: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastDocRef = useRef(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setLoading(true); setError(null);
    // IMPORTANT: Your schema => collection "Users", role === "user"
    // Use firstName for ordering to avoid missing createdAt.
    const qBase = query(
      collection(db, "Users"),
      where("role", "==", "user"),
      orderBy("firstName", "asc"),
      limit(pageSize)
    );

    const unsub = onSnapshot(
      qBase,
      async (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAssociates(docs);
        lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
        setHasMore(!!snap.docs.length && snap.docs.length >= pageSize);

        // counts
        const total = snap.size;
        const active = docs.filter(d => d.approved === true || d.active === true).length;
        const pendingAssignments = docs.filter(d => !(d.assignedCasesCount > 0)).length;

        try {
          const invSnap = await getDocs(query(collection(db, "invites"), orderBy("createdAt", "desc"), limit(50)));
          const invs = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setInvites(invs);
          setCounts({ total, active, pendingInvites: invs.length, pendingAssignments });
        } catch {
          setInvites([]);
          setCounts({ total, active, pendingInvites: 0, pendingAssignments });
        }

        setLoading(false);
      },
      (err) => { setError(err.message || "Failed to load"); setLoading(false); }
    );

    return () => unsub();
  }, [pageSize]);

  async function loadMore() {
    if (!lastDocRef.current) return;
    const qMore = query(
      collection(db, "Users"),
      where("role", "==", "user"),
      orderBy("firstName", "asc"),
      startAfter(lastDocRef.current),
      limit(pageSize)
    );
    const snap = await getDocs(qMore);
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setAssociates(prev => [...prev, ...docs]);
    lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
    setHasMore(!!snap.docs.length && snap.docs.length >= pageSize);
  }

  async function refresh() {
    try {
      const invSnap = await getDocs(query(collection(db, "invites"), orderBy("createdAt", "desc"), limit(50)));
      const invs = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setInvites(invs);
      setCounts(prev => ({ ...prev, pendingInvites: invs.length }));
    } catch {/* ignore */}
  }

  async function inviteAssociate(email, invitedBy) {
    if (!email) throw new Error("email required");
    return await addDoc(collection(db, "invites"), {
      email, role: "user", createdAt: serverTimestamp(), invitedBy
    });
  }

  async function createAssociate(payload) {
    // payload expects firstName, lastName, email, phone?, permissions?
    return await addDoc(collection(db, "Users"), {
      ...payload,
      role: "user",
      createdAt: serverTimestamp(),
      approved: true
    });
  }

  return { associates, invites, counts, loading, error, loadMore, hasMore, refresh, inviteAssociate, createAssociate };
}

/* ---------------- component ---------------- */
export default function ManageAssociates() {
  const { associates, invites, counts, loading, error, loadMore, hasMore, inviteAssociate, createAssociate } =
    useAssociates({ pageSize: 12 });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [permissionFilter, setPermissionFilter] = useState("");
  const [sortBy, setSortBy] = useState("firstName");
  const [orderDir, setOrderDir] = useState("asc");

  const [selected, setSelected] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [activeAssociate, setActiveAssociate] = useState(null);

  const isOwner = true;

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", permissions: {}, role: "user" },
  });

  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    const arr = associates
      .filter(a => {
        if (!a) return false;
        if (statusFilter === "active") {
          if (!(a.approved === true || a.active === true)) return false;
        } else if (statusFilter === "inactive") {
          if (a.approved === true || a.active === true) return false;
        } else if (statusFilter === "deleted") {
          if (!a.deleted) return false;
        }
        if (permissionFilter) {
          const p = (a.permissions && a.permissions[permissionFilter]) || false;
          if (!p) return false;
        }
        if (!q) return true;
        const name = `${a.firstName || ""} ${a.lastName || ""}`.trim().toLowerCase();
        return (
          name.includes(q) ||
          (a.email || "").toLowerCase().includes(q) ||
          (a.phone || "").toLowerCase().includes(q)
        );
      })
      .sort((x, y) => {
        if (sortBy === "name" || sortBy === "firstName") {
          const nx = `${x.firstName || ""} ${x.lastName || ""}`.trim();
          const ny = `${y.firstName || ""} ${y.lastName || ""}`.trim();
          return orderDir === "asc" ? nx.localeCompare(ny) : ny.localeCompare(nx);
        }
        const ta = x[sortBy] && typeof x[sortBy].toDate === "function"
          ? x[sortBy].toDate().getTime()
          : x[sortBy] ? new Date(x[sortBy]).getTime() : 0;
        const tb = y[sortBy] && typeof y[sortBy].toDate === "function"
          ? y[sortBy].toDate().getTime()
          : y[sortBy] ? new Date(y[sortBy]).getTime() : 0;
        return orderDir === "asc" ? ta - tb : tb - ta;
      });
    return arr;
  }, [associates, search, statusFilter, permissionFilter, sortBy, orderDir]);

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function selectAllVisible() { setSelected(new Set(filtered.map(f => f.id))); }
  function clearSelection() { setSelected(new Set()); }

  function openCreate() {
    setEditing(null);
    reset({ firstName: "", lastName: "", email: "", phone: "", permissions: {}, role: "user" });
    setShowModal(true);
  }
  function openEdit(assoc) {
    setEditing(assoc);
    reset({
      firstName: assoc.firstName || "",
      lastName: assoc.lastName || "",
      email: assoc.email || "",
      phone: assoc.phone || "",
      permissions: assoc.permissions || {},
      role: "user",
    });
    setShowModal(true);
  }

  async function onSubmit(data) {
    try {
      if (editing) {
        const ref = doc(db, "Users", editing.id);
        await updateDoc(ref, {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || "",
          role: "user",
          permissions: data.permissions || {},
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "Users"), {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || "",
          role: "user",
          permissions: data.permissions || {},
          createdAt: serverTimestamp(),
          approved: true,
        });
      }
      setShowModal(false);
    } catch (e) {
      console.error(e);
      alert("Failed to save associate: " + (e.message || e));
    }
  }

  async function handleInvite(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const email = form.get("inviteEmail");
    if (!email) return alert("Provide email");
    try {
      await inviteAssociate(email, auth.currentUser ? auth.currentUser.uid : "owner");
      alert("Invite created (server should send email).");
    } catch (err) {
      alert("Failed to create invite: " + (err.message || err));
    }
  }

  async function bulkExport() {
    const rows = associates
      .filter(a => selected.has(a.id))
      .map(a => ({
        id: a.id,
        firstName: a.firstName || "",
        lastName: a.lastName || "",
        email: a.email || "",
        phone: a.phone || "",
        role: a.role || "user",
        approved: a.approved === true,
      }));
    exportCSV("associates_export.csv", rows);
  }

  async function bulkDeactivate() {
    if (!isOwner) return alert("Only owner can bulk deactivate");
    if (!confirm(`Deactivate ${selected.size} associates?`)) return;
    const ids = Array.from(selected);
    setSelected(new Set());
    try {
      for (const id of ids) {
        await updateDoc(doc(db, "Users", id), { approved: false, updatedAt: serverTimestamp() });
      }
      alert("Deactivated selected associates");
    } catch (e) { alert("Bulk deactivate failed: " + (e.message || e)); }
  }

  async function toggleActive(assoc) {
    if (!isOwner) return alert("Only owner can change status");
    try {
      await updateDoc(doc(db, "Users", assoc.id), { approved: !(assoc.approved === true), updatedAt: serverTimestamp() });
    } catch (e) { alert("Failed to change status: " + (e.message || e)); }
  }

  async function softDelete(assoc) {
    if (!isOwner) return alert("Only owner can delete");
    if (!confirm("Soft delete associate?")) return;
    try {
      await updateDoc(doc(db, "Users", assoc.id), { deleted: true, updatedAt: serverTimestamp() });
    } catch (e) { alert("Delete failed: " + (e.message || e)); }
  }

  async function unassignCaseFromAssociate(caseId, uid) {
    try {
      const caseRef = doc(db, "cases", caseId);
      await updateDoc(caseRef, { assignedTo: arrayRemove(uid), updatedAt: serverTimestamp() });
    } catch (e) { alert("Failed to unassign case: " + (e.message || e)); }
  }

  async function triggerPasswordReset(email) {
    if (!email) return alert("No email");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent.");
    } catch (e) { alert("Failed to send reset: " + (e.message || e)); }
  }

  async function openDrawer(assoc) {
    setActiveAssociate({ ...assoc, cases: [] });
    setShowDrawer(true);
    try {
      const qCases = query(collection(db, "cases"), where("assignedTo", "array-contains", assoc.id), orderBy("createdAt", "desc"), limit(10));
      const snap = await getDocs(qCases);
      const cs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setActiveAssociate(prev => ({ ...prev, cases: cs }));
    } catch {/* ignore */}
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="mb-6 flex flex-col sm:flex-row sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Associates</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
            Managing users with role <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">user</code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-3">
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
              <div className="text-xs text-gray-500 dark:text-gray-300">Total</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">{counts.total}</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
              <div className="text-xs text-gray-500 dark:text-gray-300">Active</div>
              <div className="text-xl font-semibold text-green-600">{counts.active}</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
              <div className="text-xs text-gray-500 dark:text-gray-300">Invites</div>
              <div className="text-xl font-semibold text-orange-500">{counts.pendingInvites}</div>
            </motion.div>
          </div>
          <div className="ml-4 flex items-center gap-2">
            <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow"><FiPlus/> Add</button>
            <form onSubmit={handleInvite} className="flex items-center gap-2">
              <input name="inviteEmail" placeholder="invite@domain.com" className="px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
              <button type="submit" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">Invite</button>
            </form>
          </div>
        </div>
      </header>

      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name/email/phone" className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
            <FiSearch className="absolute left-2 top-2.5 text-gray-400" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="deleted">Deleted</option>
          </select>
          <select value={permissionFilter} onChange={e => setPermissionFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
            <option value="">All permissions</option>
            {ALL_PERMISSIONS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
            <option value="firstName">Name</option>
            <option value="createdAt">Created</option>
            <option value="lastLogin">Last Login</option>
          </select>
          <select value={orderDir} onChange={e => setOrderDir(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={selectAllVisible} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">Select Visible</button>
          <button onClick={clearSelection} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">Clear</button>
          <button onClick={bulkExport} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm inline-flex items-center gap-2"><FiDownload/> Export</button>
          <button onClick={bulkDeactivate} className="px-3 py-2 rounded-lg bg-red-600 text-white inline-flex items-center gap-2"><FiTrash2/> Bulk Deactivate</button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        {loading && <div className="text-sm text-gray-500">Loading associates...</div>}
        {error && <div className="text-sm text-red-500">Error: {error}</div>}

        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                <th className="py-3"><input type="checkbox" onChange={e => e.target.checked ? selectAllVisible() : clearSelection()} /></th>
                <th className="py-3">Associate</th>
                <th className="py-3">Email</th>
                <th className="py-3">Phone</th>
                <th className="py-3">Assigned Cases</th>
                <th className="py-3">Permissions</th>
                <th className="py-3">Status</th>
                <th className="py-3">Last Login</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>

            <motion.tbody initial="hidden" animate="show" variants={containerFade} className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(a => {
                const name = `${a.firstName || ""} ${a.lastName || ""}`.trim() || "No name";
                return (
                  <motion.tr key={a.id} variants={rowFade} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                    <td className="py-3"><input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSelect(a.id)} /></td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 text-white flex items-center justify-center">
                          {name !== "No name" ? name[0].toUpperCase() : <FiUser/>}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-100">{name}</div>
                          <div className="text-xs text-gray-400">{a.role || "user"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-200">{a.email || "—"}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-200">{a.phone || "—"}</td>
                    <td className="py-3 text-sm text-gray-700 dark:text-gray-100">{a.assignedCasesCount ?? "—"}</td>
                    <td className="py-3 text-sm">{(a.permissions && Object.keys(a.permissions).filter(k => a.permissions[k]).slice(0,2).join(", ")) || "—"}</td>
                    <td className="py-3 text-sm">
                      {a.deleted ? <span className="text-xs text-red-500">Deleted</span> :
                        (a.approved === true ? <span className="text-xs text-green-600">Active</span> :
                          <span className="text-xs text-gray-500">Inactive</span>)}
                    </td>
                    <td className="py-3 text-sm text-gray-500 dark:text-gray-400">{fmt(a.lastLogin)}</td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button onClick={() => openDrawer(a)} className="px-2 py-1 border rounded text-xs">View</button>
                        <button onClick={() => openEdit(a)} className="px-2 py-1 border rounded text-xs"><FiEdit/></button>
                        <button onClick={() => toggleActive(a)} className="px-2 py-1 border rounded text-xs">
                          {a.approved === true ? "Deactivate" : "Activate"}
                        </button>
                        <button onClick={() => softDelete(a)} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Delete</button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filtered.map(a => {
            const name = `${a.firstName || ""} ${a.lastName || ""}`.trim() || "No name";
            return (
              <motion.div key={a.id} initial="hidden" animate="show" variants={rowFade} className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 text-white flex items-center justify-center">
                      {name !== "No name" ? name[0].toUpperCase() : <FiUser/>}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white">{name}</div>
                      <div className="text-xs text-gray-400">{a.email || a.phone || ""}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openDrawer(a)} className="px-2 py-1 border rounded text-xs">View</button>
                    <button onClick={() => openEdit(a)} className="px-2 py-1 border rounded text-xs"><FiEdit/></button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-4 text-center">
          {hasMore ? <button onClick={loadMore} className="px-4 py-2 rounded-lg border">Load more</button> :
            <div className="text-sm text-gray-400">No more</div>}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <motion.div variants={modalFade} initial="hidden" animate="show" className="relative z-50 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{editing ? "Edit Associate" : "Create Associate"}</h3>
              <button onClick={() => setShowModal(false)}><FiX/></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-300">First Name</label>
                  <input {...register("firstName", { required: "First name required" })} className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
                  {errors.firstName && <div className="text-xs text-red-500">{errors.firstName.message}</div>}
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-300">Last Name</label>
                  <input {...register("lastName", { required: "Last name required" })} className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
                  {errors.lastName && <div className="text-xs text-red-500">{errors.lastName.message}</div>}
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-300">Email</label>
                  <input {...register("email", { required: "Email required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })} className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
                  {errors.email && <div className="text-xs text-red-500">{errors.email.message}</div>}
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-300">Phone</label>
                  <input {...register("phone")} className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-gray-600 dark:text-gray-300">Permissions</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {ALL_PERMISSIONS.map(p => (
                      <label key={p.key} className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" {...register(`permissions.${p.key}`)} className="rounded" />
                        <span>{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-2 rounded-md border">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-3 py-2 rounded-md bg-blue-600 text-white">{editing ? "Save" : "Create"}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Drawer */}
      {showDrawer && activeAssociate && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDrawer(false)} />
          <motion.aside variants={drawerFade} initial="hidden" animate="show" className="absolute right-0 top-0 h-full w-full md:w-1/3 bg-white dark:bg-gray-800 p-5 overflow-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {`${activeAssociate.firstName || ""} ${activeAssociate.lastName || ""}`.trim() || "Associate"}
                </h3>
                <div className="text-xs text-gray-500 dark:text-gray-300">{activeAssociate.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowDrawer(false)} className="p-2"><FiX/></button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500">Details</div>
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-100">
                  <div><strong>Phone:</strong> {activeAssociate.phone || "—"}</div>
                  <div><strong>Role:</strong> {activeAssociate.role || "user"}</div>
                  <div><strong>Status:</strong> {activeAssociate.deleted ? <span className="text-red-500">Deleted</span> : (activeAssociate.approved === true ? <span className="text-green-600">Active</span> : <span className="text-gray-500">Inactive</span>)}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Assigned Cases</div>
                <div className="mt-2 space-y-2">
                  {(activeAssociate.cases && activeAssociate.cases.length) ? activeAssociate.cases.map(c => (
                    <div key={c.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                      <div className="font-medium">{c.title || `Case ${c.id}`}</div>
                      <div className="text-xs text-gray-400">Status: {c.status || "—"} • {fmt(c.createdAt)}</div>
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => unassignCaseFromAssociate(c.id, activeAssociate.id)} className="px-2 py-1 text-xs border rounded">Unassign</button>
                        <Link to={`/cases/${c.id}`} className="px-2 py-1 text-xs border rounded">Open</Link>
                      </div>
                    </div>
                  )) : <div className="text-sm text-gray-400">No assigned cases.</div>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(activeAssociate)} className="px-3 py-2 border rounded">Edit</button>
                <button onClick={() => toggleActive(activeAssociate)} className="px-3 py-2 border rounded">
                  {activeAssociate.approved === true ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => softDelete(activeAssociate)} className="px-3 py-2 bg-red-600 text-white rounded">Delete</button>
                <button onClick={() => triggerPasswordReset(activeAssociate.email)} className="px-3 py-2 border rounded">Reset Pass</button>
              </div>
            </div>
          </motion.aside>
        </div>
      )}

      <footer className="mt-6 text-xs text-gray-400">
        <div>ManageAssociates • Legal Management System</div>
      </footer>
    </div>
  );
}
