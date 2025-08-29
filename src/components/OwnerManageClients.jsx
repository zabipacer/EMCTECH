// ManageClients.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  FiUser,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiDownload,
  FiSearch,
  FiX,
  FiFileText,
  FiUsers,
  FiBriefcase,
  FiUserCheck
} from "react-icons/fi";

/* ------------------- Firebase v9 modular ------------------- */
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

/* ---------------------- Helper utilities --------------------- */
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

function fmt(ts) {
  if (!ts) return "";
  try {
    if (typeof ts.toDate === "function") return ts.toDate().toLocaleDateString();
    return new Date(ts).toLocaleDateString();
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
  // State & refs
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [orderDir, setOrderDir] = useState("desc");

  const pageSize = 12;
  const lastDocRef = useRef(null);
  const [hasMore, setHasMore] = useState(true);

  const [selected, setSelected] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [activeClient, setActiveClient] = useState(null);
  const [clientCases, setClientCases] = useState([]);
  const [clientActivity, setClientActivity] = useState([]);

  const isOwner = true;

  // Form setup - only name/companyName, contact and location now
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue, watch } = useForm({
    defaultValues: {
      clientType: "individual",
      name: "",
      companyName: "",
      contact: "",
      location: "",
    }
  });

  const clientType = watch("clientType");

  /* ------------------ Firestore listeners ------------------ */
  useEffect(() => {
    setLoading(true);
    setError(null);

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
  }, []);

  // Filtered clients (search only name/companyName/contact/location)
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

        const nameField = c.clientType === "corporate" ? (c.companyName || "") : (c.name || "");
        const searchFields = [
          (nameField || ""),
          (c.contact || ""),
          (c.location || "")
        ].map(f => String(f).toLowerCase());

        return searchFields.some(field => field.includes(q));
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          const nameA = a.clientType === "corporate" ? (a.companyName || "") : (a.name || "");
          const nameB = b.clientType === "corporate" ? (b.companyName || "") : (b.name || "");
          return orderDir === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
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
  function openAddModal() {
    setEditingClient(null);
    reset({
      clientType: "individual",
      name: "",
      companyName: "",
      contact: "",
      location: "",
    });
    setShowModal(true);
  }

  function openEditModal(client) {
    setEditingClient(client);
    setValue("clientType", client.clientType || "individual");
    setValue("name", client.name || "");
    setValue("companyName", client.companyName || "");
    setValue("contact", client.contact || "");
    setValue("location", client.location || "");
    setShowModal(true);
  }

  async function onSubmit(data) {
    try {
      // minimal payload: clientType, name/companyName, contact, location
      const payload = {
        clientType: data.clientType || "individual",
        contact: data.contact || "",
        location: data.location || "",
        updatedAt: serverTimestamp(),
      };

      if (payload.clientType === "corporate") {
        payload.companyName = (data.companyName || "").trim();
        payload.name = ""; // keep name empty for corporate
      } else {
        payload.name = (data.name || "").trim();
        payload.companyName = "";
      }

      if (editingClient) {
        // optimistic UI update
        setClients((prev) => prev.map((c) => (c.id === editingClient.id ? { ...c, ...payload } : c)));
        await updateDoc(doc(db, "clients", editingClient.id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        payload.lastActivity = serverTimestamp();
        await addDoc(collection(db, "clients"), payload);
      }
      setShowModal(false);
    } catch (e) {
      console.error("save client error", e);
      alert("Failed to save client: " + (e.message || e));
    }
  }

  async function deleteClient(clientId) {
    if (!isOwner) return alert("Only owner can delete clients");
    if (!confirm("Delete client? This action cannot be undone.")) return;
    try {
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      await deleteDoc(doc(db, "clients", clientId));
    } catch (e) {
      console.error("delete client err", e);
      alert("Failed to delete client: " + (e.message || e));
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
      type: c.clientType === "corporate" ? "Corporate" : "Individual",
      name: c.clientType === "corporate" ? c.companyName : c.name,
      contact: c.contact,
      location: c.location,
      createdAt: fmt(c.createdAt),
    }));
    exportCSV("clients_export.csv", rows);
  }

  async function bulkDelete() {
    if (!isOwner) return alert("Only owner can delete");
    if (!selected.size) return alert("No clients selected");
    if (!confirm(`Delete ${selected.size} clients? This action cannot be undone.`)) return;
    const idsToDelete = Array.from(selected);
    setClients((prev) => prev.filter((c) => !idsToDelete.includes(c.id)));
    clearSelection();
    try {
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
    setClientCases([]);
    setClientActivity([]);

    // Fetch cases assigned to this client
    try {
      const q = query(
        collection(db, "cases"), 
        where("clientId", "==", client.id),
        orderBy("createdAt", "desc"), 
        limit(50)
      );
      const snap = await getDocs(q);
      const cases = snap.docs.map((d) => ({ 
        id: d.id, 
        ...d.data(),
        caseTitle: d.data().caseTitle || `Case ${d.id}`,
        progress: typeof d.data().progress === "number" ? d.data().progress : 0
      }));
      setClientCases(cases);
    } catch (e) {
      console.warn("fetch client cases err", e);
    }

    // Fetch recent activity
    try {
      const qAct = query(collection(db, "activity"), where("clientId", "==", client.id), orderBy("createdAt", "desc"), limit(5));
      const snapAct = await getDocs(qAct);
      const acts = snapAct.docs.map((d) => ({ id: d.id, ...d.data() }));
      setClientActivity(acts);
    } catch (e) {
      console.warn("fetch activity error", e);
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
            Manage clients — add only name, contact and location
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
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
                  <th className="py-3">Type</th>
                  <th className="py-3">Contact</th>
                  <th className="py-3">Location</th>
                  <th className="py-3">Created</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredClients.map((c) => {
                  const isCorporate = c.clientType === "corporate";
                  return (
                  <motion.tr key={c.id} variants={rowVariants} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                    <td className="py-3"><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${isCorporate ? "bg-gradient-to-br from-indigo-500 to-indigo-400" : "bg-gradient-to-br from-blue-500 to-blue-400"}`}>
                          {isCorporate ? <FiBriefcase /> : <FiUser />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-100">
                            {isCorporate ? (c.companyName || "—") : (c.name || "—")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${isCorporate ? "bg-indigo-100 text-indigo-800" : "bg-blue-100 text-blue-800"}`}>
                        {isCorporate ? "Corporate" : "Individual"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="text-sm text-gray-600 dark:text-gray-200">{c.contact || "—"}</div>
                    </td>
                    <td className="py-3">
                      <div className="text-sm text-gray-600 dark:text-gray-200">{c.location || "—"}</div>
                    </td>
                    <td className="py-3 text-sm text-gray-500 dark:text-gray-400">{fmt(c.createdAt)}</td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button onClick={() => openDrawer(c)} className="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-xs">View</button>
                        <button onClick={() => openEditModal(c)} className="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-xs"><FiEdit /></button>
                        {isOwner && <button onClick={() => deleteClient(c.id)} className="px-2 py-1 rounded-md bg-red-600 text-white text-xs"><FiTrash2/></button>}
                      </div>
                    </td>
                  </motion.tr>
                )})}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filteredClients.map((c) => {
              const isCorporate = c.clientType === "corporate";
              return (
              <motion.div key={c.id} variants={rowVariants} className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${isCorporate ? "bg-gradient-to-br from-indigo-500 to-indigo-400" : "bg-gradient-to-br from-blue-500 to-blue-400"}`}>
                      {isCorporate ? <FiBriefcase /> : <FiUser />}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-100">
                        {isCorporate ? (c.companyName || "—") : (c.name || "—")}
                      </div>
                      <div className="text-xs text-gray-400">
                        <span className={`px-1 py-0.5 rounded ${isCorporate ? "bg-indigo-100 text-indigo-800" : "bg-blue-100 text-blue-800"}`}>
                          {isCorporate ? "Corporate" : "Individual"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => openDrawer(c)} className="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-xs">View</button>
                    <button onClick={() => openEditModal(c)} className="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-xs"><FiEdit/></button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-600 dark:text-gray-300">Contact</div>
                  <div>{c.contact || "—"}</div>
                  <div className="text-gray-600 dark:text-gray-300">Location</div>
                  <div>{c.location || "—"}</div>
                </div>
              </motion.div>
            )})}
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex gap-4 border-b pb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="individual"
                    {...register("clientType")}
                    className="form-radio text-blue-500"
                  />
                  <span className="flex items-center gap-1">
                    <FiUser /> Individual
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="corporate"
                    {...register("clientType")}
                    className="form-radio text-indigo-500"
                  />
                  <span className="flex items-center gap-1">
                    <FiBriefcase /> Corporate
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientType === "corporate" ? (
                  <>
                    {/* Company Name (Required) */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Company Name *
                      </label>
                      <input
                        {...register("companyName", { required: "Company name is required" })}
                        className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                      />
                      {errors.companyName && <p className="text-xs text-red-500 mt-1">{errors.companyName.message}</p>}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Full Name (Required) */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        {...register("name", { required: "Name is required" })}
                        className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                      />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                    </div>
                  </>
                )}

                {/* Contact (Required) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Number *
                  </label>
                  <input
                    {...register("contact", { required: "Contact number is required" })}
                    placeholder="03XXXXXXXXX"
                    className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                  {errors.contact && <p className="text-xs text-red-500 mt-1">{errors.contact.message}</p>}
                </div>

                {/* Location (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    {...register("location")}
                    className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                >
                  {editingClient ? "Update Client" : "Save Client"}
                </button>
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
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${activeClient.clientType === "corporate" ? "bg-gradient-to-br from-indigo-500 to-indigo-400" : "bg-gradient-to-br from-blue-500 to-blue-400"}`}>
                    {activeClient.clientType === "corporate" ? <FiBriefcase size={24} /> : <FiUser size={24} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {activeClient.clientType === "corporate" 
                        ? (activeClient.companyName || "—") 
                        : (activeClient.name || "—")}
                    </h3>
                    <div className="text-xs text-gray-500 dark:text-gray-300">
                      <span className={`px-2 py-1 rounded-full ${activeClient.clientType === "corporate" ? "bg-indigo-100 text-indigo-800" : "bg-blue-100 text-blue-800"}`}>
                        {activeClient.clientType === "corporate" ? "Corporate Client" : "Individual Client"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowDrawer(false); }} className="p-2"><FiX /></button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Client Details */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <FiUserCheck /> Client Details
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Contact</div>
                    <div className="font-medium">{activeClient.contact || "—"}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Location</div>
                    <div className="font-medium">{activeClient.location || "—"}</div>
                  </div>
                </div>
              </div>

              {/* Assigned Cases */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <FiFileText /> Assigned Cases
                </h4>
                
                <div className="space-y-3">
                  {clientCases.length > 0 ? (
                    clientCases.map((cs) => (
                      <div key={cs.id} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                        <div className="font-medium text-blue-600 dark:text-blue-400">{cs.caseTitle}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {cs.status ? `${cs.status} • ` : ""}
                          {cs.hearingDate ? `Hearing: ${fmt(cs.hearingDate)}` : ""}
                        </div>
                        
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-500 dark:text-gray-400">Type</div>
                          <div>{cs.caseType || "N/A"}</div>
                          
                          <div className="text-gray-500 dark:text-gray-400">Value</div>
                          <div>{cs.caseValue ? `$${parseInt(cs.caseValue).toLocaleString()}` : "N/A"}</div>
                          
                          <div className="text-gray-500 dark:text-gray-400">Location</div>
                          <div>{cs.location || "N/A"}</div>
                          
                          <div className="text-gray-500 dark:text-gray-400">Tasks</div>
                          <div>{cs.completedTasks || 0} / {cs.totalTasks || 0} completed</div>
                          
                          <div className="text-gray-500 dark:text-gray-400">Progress</div>
                          <div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${cs.progress}%` }}
                              ></div>
                            </div>
                            <div className="text-xs">{cs.progress}%</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-400 p-3 text-center">No cases assigned</div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <FiUsers /> Recent Activity
                </h4>
                
                <div className="space-y-3">
                  {clientActivity.length > 0 ? (
                    clientActivity.map((a) => (
                      <div key={a.id} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                        <div className="text-sm">{a.text || a.message}</div>
                        <div className="text-xs text-gray-400 mt-1">{fmt(a.createdAt)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-400 p-3 text-center">No recent activity</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <button 
                  onClick={() => openEditModal(activeClient)} 
                  className="px-4 py-2 rounded-md border flex items-center gap-2"
                >
                  <FiEdit /> Edit Client
                </button>
                {isOwner && (
                  <button 
                    onClick={() => deleteClient(activeClient.id)} 
                    className="px-4 py-2 rounded-md bg-red-600 text-white flex items-center gap-2"
                  >
                    <FiTrash2 /> Delete
                  </button>
                )}
              </div>
            </div>
          </motion.aside>
        </div>
      )}

      <footer className="mt-6 text-xs text-gray-400">
        <div>Client Management System • {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
}
