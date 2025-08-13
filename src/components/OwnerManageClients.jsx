// ManageClients.jsx
// Full-featured Manage Clients page for Owner account
// React + Tailwind CSS + Framer Motion + react-hook-form + Firebase v9 (modular)
// -------------------------------------------------------------
// Features:
// - Real-time clients list (onSnapshot from 'clients' collection)
// - Search, filter by tag, sort, and simple "Load more" pagination (cursor-based)
// - Add / Edit client modal (react-hook-form) with validation
// - Delete with confirmation (owner-only)
// - Client detail drawer showing client info, first 5 linked cases, and recent client activity
// - Bulk select with Export CSV and Delete (owner-only)
// - Optional file upload UI (Firebase Storage) with progress (requires configuring storage)
// - Optimistic UI on add/edit/delete (basic)
// - Framer Motion animations for modal, drawer, and list items
// - Clear comments and integration notes at bottom
// -------------------------------------------------------------
// IMPORTANT:
// - Replace firebaseConfig below with your project's config OR remove the firebase init
//   and import your existing initialized Firestore instance.
// - Expected Firestore collections & fields are documented later in the file.
// -------------------------------------------------------------

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiDownload,
  FiSearch,
  FiX,
  FiFileText,
  FiUsers,
  FiSidebar,
} from "react-icons/fi";

/* ------------------- Firebase v9 modular ------------------- */
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  where,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage"; // optional - comment out if not using storage

// ---------- Replace with your Firebase config if needed ----------
const firebaseConfig = {
  apiKey: "REPLACE_API_KEY",
  authDomain: "REPLACE_AUTH_DOMAIN",
  projectId: "REPLACE_PROJECT_ID",
  storageBucket: "REPLACE_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_MSG_SENDER_ID",
  appId: "REPLACE_APP_ID",
};
// ---------------------------------------------------------------

// Initialize firebase only if not already initialized in app
if (!getApps().length) {
  initializeApp(firebaseConfig);
}
const db = getFirestore();
const storage = getStorage(); // optional - safe even if storage bucket not configured

/* ---------------------- Helper utilities --------------------- */

// Simple CSV exporter for an array of objects (selected clients)
function exportCSV(filename = "clients.csv", rows = []) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// format date display
function fmt(ts) {
  if (!ts) return "";
  try {
    if (typeof ts.toDate === "function") return ts.toDate().toLocaleString();
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

/* ----------------------- Framer variants ---------------------- */
const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};
const modalVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  show: { opacity: 1, scale: 1 },
};
const drawerVariants = {
  hidden: { x: "100%" },
  show: { x: 0 },
};

/* ------------------------- Component ------------------------- */
export default function ManageClients() {
  // --------- state & refs ----------
  const [clients, setClients] = useState([]); // full local page of clients
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt"); // createdAt | lastActivity | name
  const [orderDir, setOrderDir] = useState("desc"); // desc | asc

  // pagination (cursor-based)
  const pageSize = 12;
  const lastDocRef = useRef(null);
  const [hasMore, setHasMore] = useState(true);

  // selections for bulk actions
  const [selected, setSelected] = useState(new Set());

  // modal/drawer controls
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null); // null -> add mode
  const [showDrawer, setShowDrawer] = useState(false);
  const [activeClient, setActiveClient] = useState(null);

  // recent client activity inside drawer
  const [clientActivity, setClientActivity] = useState([]);

  // file upload progress (optional)
  const [uploadProgress, setUploadProgress] = useState(0);

  // mock owner check - replace with auth.currentUser.uid check in real app
  const isOwner = true; // TODO: wire with Firebase Auth in your app

  // react-hook-form for add/edit modal
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm({ defaultValues: { name: "", email: "", phone: "", address: "", dob: "", tags: "", notes: "" } });

  /* ------------------ Firestore listeners ------------------ */
  useEffect(() => {
    setLoading(true);
    setError(null);

    // build a basic query
    // Note: Firestore requires composite indexes for complex queries; keep queries simple here.
    // We'll order by createdAt and limit to pageSize initially.
    // For sorting by other fields you'd need indexes.
    try {
      const q = query(collection(db, "clients"), orderBy("createdAt", "desc"), limit(pageSize));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setClients(docs);
          lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
          setHasMore(!!snap.docs.length && snap.docs.length >= pageSize);
          setLoading(false);
        },
        (err) => {
          console.error("clients snapshot err", err);
          setError(err.message || "Failed to load clients");
          setLoading(false);
        }
      );

      return () => unsub();
    } catch (e) {
      console.error("listener setup error", e);
      setError(String(e));
      setLoading(false);
    }
  }, []); // run once

  // Derived filtered and searched clients (client-side filter)
  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients
      .filter((c) => {
        if (!c) return false;
        if (tagFilter) {
          const tags = Array.isArray(c.tags) ? c.tags : (c.tags || "").toString().split(",").map(t=>t.trim().toLowerCase());
          if (!tags.map(t=>t.toLowerCase()).includes(tagFilter.toLowerCase())) return false;
        }
        if (!q) return true;
        const name = (c.name || "").toLowerCase();
        const email = (c.email || "").toLowerCase();
        const phone = (c.phone || "").toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q);
      })
      .sort((a, b) => {
        // simple sorts - adjust for missing fields
        if (sortBy === "name") {
          return orderDir === "asc"
            ? (a.name || "").localeCompare(b.name || "")
            : (b.name || "").localeCompare(a.name || "");
        }
        const ta = a[sortBy] && typeof a[sortBy].toDate === "function" ? a[sortBy].toDate().getTime() : a[sortBy] ? new Date(a[sortBy]).getTime() : 0;
        const tb = b[sortBy] && typeof b[sortBy].toDate === "function" ? b[sortBy].toDate().getTime() : b[sortBy] ? new Date(b[sortBy]).getTime() : 0;
        return orderDir === "asc" ? ta - tb : tb - ta;
      });
  }, [clients, search, tagFilter, sortBy, orderDir]);

  /* ------------------ Pagination: Load more ------------------ */
  async function loadMore() {
    if (!lastDocRef.current) return;
    try {
      const q = query(collection(db, "clients"), orderBy("createdAt", "desc"), startAfter(lastDocRef.current), limit(pageSize));
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setClients((prev) => [...prev, ...docs]);
      lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
      setHasMore(!!snap.docs.length && snap.docs.length >= pageSize);
    } catch (e) {
      console.error("loadMore error", e);
    }
  }

  /* ------------------ CRUD: Add / Edit / Delete ------------------ */
  // Open modal for add
  function openAddModal() {
    setEditingClient(null);
    reset({ name: "", email: "", phone: "", address: "", dob: "", tags: "", notes: "" });
    setShowModal(true);
  }

  // Open modal for edit with prefilled values
  function openEditModal(client) {
    setEditingClient(client);
    // set form values
    setValue("name", client.name || "");
    setValue("email", client.email || "");
    setValue("phone", client.phone || "");
    setValue("address", client.address || "");
    setValue("dob", client.dob ? (client.dob.toDate ? client.dob.toDate().toISOString().slice(0, 10) : client.dob) : "");
    setValue("tags", Array.isArray(client.tags) ? client.tags.join(", ") : client.tags || "");
    setValue("notes", client.notes || "");
    setShowModal(true);
  }

  // Add or update client
  async function onSubmit(data) {
    try {
      if (editingClient) {
        // optimistic update locally
        setClients((prev) => prev.map((c) => (c.id === editingClient.id ? { ...c, ...data } : c)));
        // update in firestore
        const docRef = doc(db, "clients", editingClient.id);
        await updateDoc(docRef, {
          ...data,
          tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : [],
          updatedAt: serverTimestamp(),
        });
      } else {
        // create new client
        const payload = {
          ...data,
          tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : [],
          createdAt: serverTimestamp(),
          lastActivity: serverTimestamp(),
        };
        // optimistic not necessary here because snapshot will add it quickly
        await addDoc(collection(db, "clients"), payload);
      }
      setShowModal(false);
    } catch (e) {
      console.error("save client error", e);
      alert("Failed to save client: " + (e.message || e));
    }
  }

  // Delete client (owner-only)
  async function deleteClient(clientId) {
    if (!isOwner) return alert("Only owner can delete clients");
    if (!confirm("Delete client? This action cannot be undone.")) return;
    try {
      // optimistic remove locally
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      await deleteDoc(doc(db, "clients", clientId));
    } catch (e) {
      console.error("delete client err", e);
      alert("Failed to delete client: " + (e.message || e));
      // ideally reload from server or revert state
    }
  }

  /* ------------------ Bulk actions ------------------ */
  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    const ids = filteredClients.map((c) => c.id);
    setSelected(new Set(ids));
  }
  function clearSelection() {
    setSelected(new Set());
  }

  async function bulkExport() {
    if (!selected.size) return alert("Select some clients first");
    const rows = clients.filter((c) => selected.has(c.id)).map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      tags: Array.isArray(c.tags) ? c.tags.join(", ") : (c.tags || ""),
      createdAt: fmt(c.createdAt),
    }));
    exportCSV("clients_export.csv", rows);
  }

  async function bulkDelete() {
    if (!isOwner) return alert("Only owner can delete");
    if (!selected.size) return alert("No clients selected");
    if (!confirm(`Delete ${selected.size} clients? This action cannot be undone.`)) return;
    // optimistic local removal
    const idsToDelete = Array.from(selected);
    setClients((prev) => prev.filter((c) => !idsToDelete.includes(c.id)));
    clearSelection();
    try {
      // Firestore batch delete (simple loop here)
      for (const id of idsToDelete) {
        await deleteDoc(doc(db, "clients", id));
      }
    } catch (e) {
      console.error("bulk delete err", e);
      alert("Bulk delete failed: " + (e.message || e));
    }
  }

  /* ------------------ Client detail drawer ------------------ */
  async function openDrawer(client) {
    setActiveClient(client);
    setShowDrawer(true);

    // fetch linked cases (first 5)
    try {
      const q = query(collection(db, "cases"), where("clientId", "==", client.id), orderBy("createdAt", "desc"), limit(5));
      const snap = await getDocs(q);
      const cases = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setActiveClient((prev) => ({ ...prev, cases }));
    } catch (e) {
      console.warn("fetch client cases err", e);
    }

    // fetch recent activity for this client
    try {
      const qAct = query(collection(db, "activity"), where("clientId", "==", client.id), orderBy("createdAt", "desc"), limit(5));
      const snapAct = await getDocs(qAct);
      const acts = snapAct.docs.map((d) => ({ id: d.id, ...d.data() }));
      setClientActivity(acts);
    } catch (e) {
      // if activity collection not present, leave empty
      setClientActivity([]);
    }
  }

  /* ------------------ Optional Storage upload handler ------------------ */
  // Upload a file and get download URL (example for avatar/document)
  async function uploadFile(file, path = "clients") {
    if (!file) return null;
    try {
      const fname = `${path}/${Date.now()}_${file.name}`;
      const sRef = storageRef(storage, fname);
      const uploadTask = uploadBytesResumable(sRef, file);
      return await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadProgress(pct);
          },
          (err) => {
            console.error("upload err", err);
            reject(err);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setUploadProgress(0);
            resolve(url);
          }
        );
      });
    } catch (e) {
      console.error("uploadFile err", e);
      return null;
    }
  }

  /* ------------------ Render ------------------ */
  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Clients</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
            Real-time client management — add, edit, delete, and view client profiles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email or phone"
              className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <FiSearch className="absolute left-2 top-2.5 text-gray-400" />
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow"
          >
            <FiPlus /> Add Client
          </button>
        </div>
      </div>

      {/* Controls: filters, bulk actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="">All tags</option>
            {/* TODO: populate dynamically from tags collection or clients */}
            <option value="vip">VIP</option>
            <option value="corporate">Corporate</option>
            <option value="individual">Individual</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
            <option value="createdAt">Newest</option>
            <option value="lastActivity">Last Activity</option>
            <option value="name">Name</option>
          </select>

          <select value={orderDir} onChange={(e) => setOrderDir(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={selectAllVisible} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">Select Visible</button>
          <button onClick={clearSelection} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">Clear</button>

          <div className="flex items-center gap-2">
            <button onClick={bulkExport} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm inline-flex items-center gap-2">
              <FiDownload /> Export
            </button>

            <button onClick={bulkDelete} className="px-3 py-2 rounded-lg bg-red-600 text-white inline-flex items-center gap-2">
              <FiTrash2 /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Main list */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        {loading && <div className="text-sm text-gray-500">Loading clients...</div>}
        {error && <div className="text-sm text-red-500">Error: {String(error)}</div>}

        <motion.div initial="hidden" animate="show" className="space-y-3">
          {filteredClients.length === 0 && !loading ? (
            <div className="text-sm text-gray-500 p-6 text-center">No clients found.</div>
          ) : null}

          {/* Desktop table view */}
          <div className="hidden md:block">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                  <th className="py-3"><input type="checkbox" checked={selected.size === filteredClients.length && filteredClients.length>0} onChange={(e) => e.target.checked ? selectAllVisible() : clearSelection()} /></th>
                  <th className="py-3">Client</th>
                  <th className="py-3">Email</th>
                  <th className="py-3">Phone</th>
                  <th className="py-3">Cases</th>
                  <th className="py-3">Created</th>
                  <th className="py-3">Last Active</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredClients.map((c) => (
                  <motion.tr key={c.id} variants={rowVariants} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                    <td className="py-3"><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white">
                          {c.name ? c.name[0].toUpperCase() : <FiUser />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-100">{c.name || "Untitled"}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-400">{(Array.isArray(c.tags) ? c.tags.join(", ") : c.tags) || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="text-sm text-gray-600 dark:text-gray-200">{c.email || "—"}</div>
                    </td>
                    <td className="py-3"><div className="text-sm text-gray-600 dark:text-gray-200">{c.phone || "—"}</div></td>
                    <td className="py-3">
                      <div className="text-sm text-gray-700 dark:text-gray-200">{c.casesCount ?? "—"}</div>
                    </td>
                    <td className="py-3 text-sm text-gray-500 dark:text-gray-400">{fmt(c.createdAt)}</td>
                    <td className="py-3 text-sm text-gray-500 dark:text-gray-400">{fmt(c.lastActivity)}</td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button onClick={() => openDrawer(c)} className="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-xs">View</button>
                        <button onClick={() => openEditModal(c)} className="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-xs inline-flex items-center gap-2"><FiEdit />Edit</button>
                        {isOwner && <button onClick={() => deleteClient(c.id)} className="px-2 py-1 rounded-md bg-red-600 text-white text-xs inline-flex items-center gap-2"><FiTrash2/></button>}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filteredClients.map((c) => (
              <motion.div key={c.id} variants={rowVariants} className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white">
                      {c.name ? c.name[0].toUpperCase() : <FiUser />}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-100">{c.name || "Untitled"}</div>
                      <div className="text-xs text-gray-400">{c.email || c.phone || ""}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => openDrawer(c)} className="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-xs">View</button>
                    <button onClick={() => openEditModal(c)} className="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-xs"><FiEdit/></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Load more */}
        <div className="mt-4 text-center">
          {hasMore ? (
            <button onClick={loadMore} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700">Load more</button>
          ) : (
            <div className="text-sm text-gray-400">No more clients</div>
          )}
        </div>
      </div>

      {/* ---------------- Modal for Add/Edit ---------------- */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />

          <motion.div variants={modalVariants} initial="hidden" animate="show" className="relative z-50 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{editingClient ? "Edit Client" : "Add Client"}</h3>
              <button onClick={() => setShowModal(false)}><FiX /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-300">Name</label>
                  <input {...register("name", { required: "Name required" })} className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
                  {errors.name && <div className="text-xs text-red-500">{errors.name.message}</div>}
                </div>

                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-300">Email</label>
                  <input {...register("email", { pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })} className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
                  {errors.email && <div className="text-xs text-red-500">{errors.email.message}</div>}
                </div>

                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-300">Phone</label>
                  <input {...register("phone", { required: false })} className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
                </div>

                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-300">DOB</label>
                  <input type="date" {...register("dob")} className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-gray-600 dark:text-gray-300">Address</label>
                  <input {...register("address")} className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-gray-600 dark:text-gray-300">Tags (comma separated)</label>
                  <input {...register("tags")} className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-gray-600 dark:text-gray-300">Notes</label>
                  <textarea {...register("notes")} rows={3} className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
                </div>
              </div>

              {/* Optional upload UI (avatar/documents) */}
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-300">Upload Avatar / Document (optional)</label>
                <input type="file" onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  // if you want to upload immediately and set avatarUrl into form:
                  const url = await uploadFile(file, "client_uploads");
                  if (url) {
                    // setValue to a hidden form value or handle appropriately
                    setValue("avatarUrl", url);
                    alert("File uploaded, avatarUrl set.");
                  }
                }} className="w-full mt-2" />
                {uploadProgress > 0 && <div className="text-xs text-gray-500 mt-1">Uploading: {uploadProgress}%</div>}
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-md border">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-md bg-blue-600 text-white">{editingClient ? "Save changes" : "Create client"}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ---------------- Drawer: client detail ---------------- */}
      {showDrawer && activeClient && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDrawer(false)} />
          <motion.aside variants={drawerVariants} initial="hidden" animate="show" className="absolute right-0 top-0 h-full w-full md:w-1/3 bg-white dark:bg-gray-800 p-5 overflow-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{activeClient.name || "Client"}</h3>
                <div className="text-xs text-gray-500 dark:text-gray-300">{activeClient.email || activeClient.phone}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowDrawer(false); }} className="p-2"><FiX /></button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-300">Details</div>
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-100">
                  <div><strong>Phone:</strong> {activeClient.phone || "—"}</div>
                  <div><strong>Address:</strong> {activeClient.address || "—"}</div>
                  <div><strong>Tags:</strong> {(Array.isArray(activeClient.tags) ? activeClient.tags.join(", ") : activeClient.tags) || "—"}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Recent Cases</div>
                <div className="mt-2 space-y-2">
                  {activeClient.cases && activeClient.cases.length ? activeClient.cases.map((cs) => (
                    <Link key={cs.id} to={`/cases/${cs.id}`} className="block p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                      <div className="font-medium">{cs.title || `Case ${cs.id}`}</div>
                      <div className="text-xs text-gray-400">{cs.status || ""} • {fmt(cs.createdAt)}</div>
                    </Link>
                  )) : <div className="text-sm text-gray-400">No cases found.</div>}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Recent Activity</div>
                <div className="mt-2 space-y-2">
                  {clientActivity.length ? clientActivity.map((a) => (
                    <div key={a.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                      <div className="text-sm">{a.text || a.message}</div>
                      <div className="text-xs text-gray-400">{fmt(a.createdAt)}</div>
                    </div>
                  )) : <div className="text-sm text-gray-400">No activity found.</div>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => openEditModal(activeClient)} className="px-3 py-2 rounded-md border">Edit</button>
                {isOwner && <button onClick={() => deleteClient(activeClient.id)} className="px-3 py-2 rounded-md bg-red-600 text-white">Delete</button>}
              </div>
            </div>
          </motion.aside>
        </div>
      )}

      <footer className="mt-6 text-xs text-gray-400">
        <div>ManageClients • Legal Management System</div>
      </footer>
    </div>
  );
}

/* ---------------------- Integration notes ----------------------
Expected Firestore collections & sample fields:

Collection: clients
- name: string
- email: string
- phone: string
- address: string
- dob: Timestamp or ISO string
- tags: array[string] OR comma-separated string
- notes: string
- avatarUrl: string (optional)
- createdAt: Firestore Timestamp
- updatedAt: Firestore Timestamp
- lastActivity: Firestore Timestamp

Collection: cases
- clientId: string (refers to clients.id)
- title: string
- status: string ("open", "closed", etc.)
- createdAt: Timestamp

Collection: activity (optional)
- clientId: string
- text / message: string
- createdAt: Timestamp

Integration checklist:
1. Install dependencies:
   - npm i firebase framer-motion react-hook-form react-icons
2. Firebase:
   - Replace firebaseConfig at top or remove initialization and import your existing Firestore instance:
     e.g. import { db, storage } from "../firebase";
   - Ensure Firestore rules allow reads for owner or authenticated users as appropriate.
3. Auth:
   - Replace the `isOwner` mock with your auth logic, e.g. check auth.currentUser.uid or claim.
4. Storage (optional):
   - Configure Firebase Storage and update `uploadFile` usage as needed.
5. Indexes:
   - If you sort or query complex fields (e.g. orderBy lastActivity + where), create Firestore composite indexes via Firebase Console when prompted.
6. Performance / scale:
   - For large client bases, use server-side pagination and limit queries. This example uses simple cursor-based pagination for the first page and a "Load more" button.
7. Security:
   - Add server-side validation and Firestore security rules to restrict owner-only operations.

TODO / improvements:
- Add optimistic rollback on failed writes.
- Add loading skeletons for better UX.
- Add permission-based UI (hide owner-only buttons for non-owner).
- Replace inline confirm/alerts with a nicer modal/toast system (e.g., react-hot-toast or custom).
- Extract repeated logic into custom hooks (useClients, useUpload).
-------------------------------------------------------------- */
