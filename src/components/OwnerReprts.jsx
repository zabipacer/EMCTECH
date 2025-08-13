// Reports.jsx
// Owner-only analytics page for a Legal Management System
// Tech: React (JS) + Tailwind CSS + Framer Motion + Recharts + Firebase v9 (modular) + react-to-print
// -------------------------------------------------------------------------------------------------
// Install deps:
// npm i firebase framer-motion recharts react-icons react-router-dom react-to-print
// -------------------------------------------------------------------------------------------------
// Firestore data model used:
//
// cases:   { id, title, status, priority, caseDate(Timestamp|Date), fee(Number), paymentReceived(Number), assignedTo: string[] }
// clients: { id, name, createdAt(Timestamp|Date), contactInfo }
// Users:   { id === auth.uid, email, firstName, lastName, photo, role("store_owner" | "associate" | ...), active(Boolean), createdAt(Timestamp|Date) }
//
// IMPORTANT: Your schema shows the collection is named "Users" (capital U) and the doc ID equals the auth UID.
// This file loads the profile from doc(db, "Users", user.uid) and falls back to "users" if needed.
// -------------------------------------------------------------------------------------------------

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  FiBriefcase,
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiFilter,
  FiDownload,
  FiPrinter,
  FiAlertTriangle,
} from "react-icons/fi";
import { useReactToPrint } from "react-to-print";

/* ---------------------------- Firebase (v9 modular) ---------------------------- */
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

/* --------------------------- Replace with your config --------------------------- */
const firebaseConfig = {
  apiKey: "REPLACE_API_KEY",
  authDomain: "REPLACE_AUTH_DOMAIN",
  projectId: "REPLACE_PROJECT_ID",
  storageBucket: "REPLACE_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_MSG_SENDER_ID",
  appId: "REPLACE_APP_ID",
};
// Initialize once (or remove if already initialized in your app root)
if (!getApps().length) initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();

/* ---------------------------- helpers / utilities ---------------------------- */
const container = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

function toDateInput(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function sum(arr) {
  return arr.reduce((a, b) => a + (Number(b) || 0), 0);
}
function toJSDate(v) {
  return v?.toDate?.() || (v ? new Date(v) : null);
}
function exportCSV(filename = "reports.csv", rows = []) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ---------------------------------- Component --------------------------------- */
export default function Reports() {
  const printRef = useRef(null);

  // 1) Auth + role gate states
  const [authReady, setAuthReady] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // 2) Filters (default: last 6 months to today)
  const today = new Date();
  const startDefault = new Date(today);
  startDefault.setMonth(today.getMonth() - 6);
  const [startDate, setStartDate] = useState(toDateInput(startDefault));
  const [endDate, setEndDate] = useState(toDateInput(today));

  // 3) Data states
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [associates, setAssociates] = useState([]); // users with role == "associate"

  // 4) Print
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `LMS-Reports-${new Date().toISOString()}`,
  });

  /* --------------------- Auth + profile loader (capital "Users") --------------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthReady(true);
        setRoleChecked(true);
        setIsOwner(false);
        return;
      }
      setAuthReady(true);
      try {
        // First try "Users" (your schema), then fall back to "users"
        let snap = await getDoc(doc(db, "Users", user.uid));
        if (!snap.exists()) {
          snap = await getDoc(doc(db, "users", user.uid)); // fallback if you later rename
        }
        const profile = snap.exists() ? snap.data() : null;
        const owner = profile?.role === "store_owner";
        setIsOwner(owner);
        setRoleChecked(true);
      } catch (e) {
        console.error("Profile load failed:", e);
        setIsOwner(false);
        setRoleChecked(true);
      }
    });
    return () => unsub();
  }, []);

  /* ---------------------------- Firestore listeners ---------------------------- */
  useEffect(() => {
    if (!authReady || !roleChecked || !isOwner) return;

    setLoading(true);
    setErr("");

    const s = new Date(startDate);
    const e = new Date(endDate);
    e.setHours(23, 59, 59, 999);

    // Cases in date range — requires index on caseDate asc with range filters if prompted
    const qCases = query(
      collection(db, "cases"),
      where("caseDate", ">=", s),
      where("caseDate", "<=", e),
      orderBy("caseDate", "asc")
    );

    // Clients — light dataset; we read all and filter client-side for "new this month"
    const qClients = query(collection(db, "clients"));

    // Associates — your model stores associates in Users with role === "associate"
    const qAssociates = query(collection(db, "Users"), where("role", "==", "associate"));

    const unsubCases = onSnapshot(
      qCases,
      (snap) => setCases(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e2) => {
        console.error(e2);
        setErr(e2.message || "Failed to load cases");
      }
    );

    const unsubClients = onSnapshot(
      qClients,
      (snap) => setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e2) => {
        console.error(e2);
        setErr((prev) => prev || e2.message || "Failed to load clients");
      }
    );

    const unsubUsers = onSnapshot(
      qAssociates,
      (snap) => {
        setAssociates(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (e2) => {
        console.error(e2);
        setErr((prev) => prev || e2.message || "Failed to load associates");
        setLoading(false);
      }
    );

    return () => {
      unsubCases();
      unsubClients();
      unsubUsers();
    };
  }, [authReady, roleChecked, isOwner, startDate, endDate]);

  /* ---------------------------- Derived metrics ---------------------------- */
  // Cases overview
  const totalCases = cases.length;
  const closedCases = cases.filter((c) => c.status === "closed").length;
  const pendingCases = cases.filter((c) => c.status === "pending").length;
  const urgentCases = cases.filter((c) => c.priority === "urgent").length;

  // Clients overview
  const totalClients = clients.length;
  const newClientsThisMonth = useMemo(() => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return clients.filter((cl) => {
      const d = toJSDate(cl.createdAt);
      return d && d >= firstOfMonth;
    }).length;
  }, [clients]);

  // Associates overview
  const associatesActive = associates.filter((u) => u.active === true).length;
  const associatesInactive = associates.filter((u) => u.active === false).length;

  // Financial overview from cases in range
  const billed = sum(cases.map((c) => c.fee || 0));
  const received = sum(cases.map((c) => c.paymentReceived || 0));
  const outstanding = Math.max(0, billed - received);

  // Monthly trends (opened vs closed counts for last 6 months within selected range)
  const trendData = useMemo(() => {
    const end = new Date(endDate);
    const buckets = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
      buckets[monthKey(d)] = {
        month: d.toLocaleString("default", { month: "short" }),
        opened: 0,
        closed: 0,
      };
    }
    cases.forEach((c) => {
      const openedDate = toJSDate(c.caseDate);
      if (openedDate) {
        const mk = monthKey(new Date(openedDate.getFullYear(), openedDate.getMonth(), 1));
        if (buckets[mk]) buckets[mk].opened += 1;
      }
      // If you store closedAt, use it instead of this approximation
      if (c.status === "closed") {
        const d = openedDate || new Date();
        const mk = monthKey(new Date(d.getFullYear(), d.getMonth(), 1));
        if (buckets[mk]) buckets[mk].closed += 1;
      }
    });
    return Object.values(buckets);
  }, [cases, endDate]);

  // Top performing associates (by number of cases assigned in current range)
  const associateNameById = useMemo(() => {
    const map = {};
    associates.forEach((u) => (map[u.id] = u.firstName || u.name || "Unnamed"));
    return map;
  }, [associates]);

  const topAssociates = useMemo(() => {
    const counts = {};
    cases.forEach((c) => {
      (c.assignedTo || []).forEach((uid) => {
        counts[uid] = (counts[uid] || 0) + 1;
      });
    });
    const rows = Object.entries(counts).map(([uid, count]) => ({
      uid,
      name: associateNameById[uid] || uid,
      cases: count,
    }));
    return rows.sort((a, b) => b.cases - a.cases).slice(0, 10);
  }, [cases, associateNameById]);

  // Exports
  const exportTopAssociatesCSV = () =>
    exportCSV("top_associates.csv", topAssociates);
  const exportFinancialCSV = () =>
    exportCSV("financial_overview.csv", [
      { metric: "Total Billed", amount: billed },
      { metric: "Received", amount: received },
      { metric: "Outstanding", amount: outstanding },
    ]);

  /* --------------------------- Route guard rendering -------------------------- */
  if (!authReady || !roleChecked) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-200">
          <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
          <span>Checking access…</span>
        </div>
      </div>
    );
  }
  if (!isOwner) {
    // Only redirect AFTER we've checked the role to avoid flash loops
    return <Navigate to="/dashboard" replace />;
  }

  /* --------------------------------- UI Render -------------------------------- */
  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      {/* Filter bar & actions */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">Owner dashboard analytics & exports</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
            <FiFilter className="text-gray-400" />
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-300">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-300">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white shadow hover:scale-[1.01] transition"
            >
              <FiPrinter /> Export PDF
            </button>
            <button
              onClick={() => {
                exportFinancialCSV();
                exportTopAssociatesCSV();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:scale-[1.01] transition"
            >
              <FiDownload /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {err && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800">
          <FiAlertTriangle className="mt-0.5" />
          <div className="text-sm">
            {err}
            <span className="block text-xs opacity-80">
              • If Firestore asks for an index, click the link it provides to create it.
            </span>
          </div>
        </div>
      )}

      {/* Printable content */}
      <div ref={printRef} className="space-y-6">
        {/* OVERVIEW CARDS */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Cases */}
          <motion.div variants={item} className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-300">Total Cases</div>
              <FiBriefcase className="text-[#3B82F6]" />
            </div>
            <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {loading ? "…" : totalCases}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200">
                Closed: {closedCases}
              </span>
              <span className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200">
                Pending: {pendingCases}
              </span>
              <span className="px-2 py-1 rounded bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200">
                Urgent: {urgentCases}
              </span>
            </div>
          </motion.div>

          {/* Clients */}
          <motion.div variants={item} className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-300">Total Clients</div>
              <FiUsers className="text-[#3B82F6]" />
            </div>
            <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {loading ? "…" : totalClients}
            </div>
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-300">
              New this month:{" "}
              <span className="font-medium text-gray-900 dark:text-white">{newClientsThisMonth}</span>
            </div>
          </motion.div>

          {/* Associates */}
          <motion.div variants={item} className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-300">Associates</div>
              <FiUsers className="text-[#3B82F6]" />
            </div>
            <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {loading ? "…" : associates.length}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200">
                Active: {associatesActive}
              </span>
              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                Inactive: {associatesInactive}
              </span>
            </div>
          </motion.div>

          {/* Financials */}
          <motion.div variants={item} className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-300">Financial Overview</div>
              <FiDollarSign className="text-[#3B82F6]" />
            </div>
            <div className="mt-3 text-sm space-y-1 text-gray-700 dark:text-gray-100">
              <div className="flex justify-between">
                <span>Total billed</span>
                <strong>₹ {billed.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>Received</span>
                <strong>₹ {received.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>Outstanding</span>
                <strong>₹ {outstanding.toLocaleString()}</strong>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* MONTHLY TRENDS */}
        <motion.section variants={item} initial="hidden" animate="show" className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiTrendingUp className="text-[#3B82F6]" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Trends (Opened vs Closed)</h2>
            </div>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="opened" stroke="#3B82F6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="closed" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* TOP PERFORMING ASSOCIATES */}
        <motion.section variants={item} initial="hidden" animate="show" className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiUsers className="text-[#3B82F6]" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Performing Associates</h2>
            </div>
            <button
              onClick={exportTopAssociatesCSV}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:scale-[1.01] transition"
            >
              <FiDownload /> CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                  <th className="py-2">#</th>
                  <th className="py-2">Associate</th>
                  <th className="py-2">Cases (in range)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {topAssociates.map((row, idx) => (
                  <tr key={row.uid} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="py-2">{idx + 1}</td>
                    <td className="py-2">{row.name}</td>
                    <td className="py-2">{row.cases}</td>
                  </tr>
                ))}
                {topAssociates.length === 0 && (
                  <tr>
                    <td className="py-3 text-gray-500 dark:text-gray-300" colSpan={3}>
                      No data in selected date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* FOOTER NOTES */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Generated on {new Date().toLocaleString()} • Date range: {startDate} → {endDate}
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] grid place-items-center">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 shadow">
            <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
            <span className="text-sm text-gray-700 dark:text-gray-200">Loading data…</span>
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="mt-6">
        <Link to="/dashboard" className="text-sm text-[#3B82F6] hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

/* --------------------------------- Dev Notes ---------------------------------
1) WHY YOU WERE REDIRECTED:
   - Your profile is in collection "Users" with docId === auth.uid and role === "store_owner".
   - Previously we queried collection "users" by authUid field (which doesn't exist), so role check failed.

2) OWNER CHECK (this file):
   - Loads doc(db, "Users", user.uid). Falls back to "users" if you rename later.
   - Only after loading do we redirect with <Navigate />, avoiding hydration/flash loops.

3) ASSOCIATES:
   - Queried as where("role","==","associate") from "Users".
   - If you use a different role string, change it here.

4) INDEXES YOU MAY NEED:
   - cases: orderBy("caseDate","asc") with range (>=, <=) -> Create composite index when Console prompts.
   - If you switch users query, Firestore may ask for indexes; click the error link to create.

5) SECURITY:
   - This page reads aggregate data only. Ensure your Firestore rules allow read for owners and restrict others.

6) CURRENCY:
   - Replace the "₹" symbol to your preference.

7) AVOID HTML NESTING ISSUES:
   - No nested <tbody>. Row animations can be added with motion.tr if needed.

-------------------------------------------------------------------------------- */
