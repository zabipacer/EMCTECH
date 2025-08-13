// Profile.jsx
// Owner Dashboard (React + Tailwind + Framer Motion) with live Firestore data
// Uses Firebase v9 modular SDK. Replace firebaseConfig with your project's config.

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiBriefcase,
  FiClipboard,
  FiFileText,
  FiUsers,
  FiUserCheck,
  FiClock,
  FiCalendar,
  FiSettings,
  FiShield,
} from "react-icons/fi";


import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

// ----------  REPLACE with your Firebase config ----------

/* ---------- Framer Motion variants ---------- */
const containerFade = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } },
};
const cardFade = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};
const listItem = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35 } },
};

/* ---------- Utility helpers ---------- */

// Robust status checks (handles variability in status strings)
function isClosedStatus(status) {
  if (!status) return false;
  const s = String(status).toLowerCase();
  return ["closed", "resolved", "archived", "completed"].includes(s);
}
function isActiveStatus(status) {
  if (!status) return false;
  const s = String(status).toLowerCase();
  return ["open", "active", "in-progress", "pending"].includes(s);
}

function formatTimestamp(ts) {
  if (!ts) return "";
  try {
    // Firestore Timestamp has toDate()
    if (typeof ts.toDate === "function") {
      return ts.toDate().toLocaleString();
    } else {
      // if it's a JS Date or ISO string
      const d = new Date(ts);
      return d.toLocaleString();
    }
  } catch {
    return String(ts);
  }
}

/* ---------- Small UI subcomponents ---------- */
function AnalyticsCard({ label, value, icon, index }) {
  const gradients = [
    "from-blue-500 to-blue-400",
    "from-green-400 to-green-300",
    "from-red-400 to-red-300",
    "from-purple-500 to-purple-400",
    "from-yellow-400 to-yellow-300",
    "from-orange-400 to-orange-300",
  ];
  const gradient = gradients[index % gradients.length];

  return (
    <motion.div
      variants={cardFade}
      initial="hidden"
      animate="show"
      whileHover={{ scale: 1.03, boxShadow: "0 10px 30px rgba(59,130,246,0.12)" }}
      className="group bg-white dark:bg-gray-800 rounded-2xl p-4 flex items-center space-x-4 transition-transform"
      role="region"
      aria-label={label}
    >
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-sm`}
        aria-hidden
      >
        {icon}
      </div>

      <div className="flex-1">
        <div className="text-sm text-gray-500 dark:text-gray-300">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
          {value}
        </div>
      </div>
    </motion.div>
  );
}

function ActionCard({ to, title, icon }) {
  return (
    <motion.div
      variants={cardFade}
      initial="hidden"
      animate="show"
      whileHover={{ scale: 1.03 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm hover:shadow-md transition transform"
    >
      <Link to={to} className="flex items-center space-x-3" aria-label={title}>
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{title}</div>
          <div className="text-xs text-gray-400 dark:text-gray-400">Open</div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ---------- Main component ---------- */
export default function Profile() {
  // Firestore-sourced state
  const [cases, setCases] = useState([]);
  const [clientsCount, setClientsCount] = useState(0);
  const [associatesCount, setAssociatesCount] = useState(0);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Subscriptions list to call unsubscribe on unmount
    const unsubscribes = [];

    try {
      // 1) Listen to cases collection (full snapshot)
      const casesCol = collection(db, "cases");
      const unsubCases = onSnapshot(
        casesCol,
        (snap) => {
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setCases(docs);
          setLoading(false);
        },
        (err) => {
          console.error("cases snapshot error:", err);
          setError(err.message || "Failed to load cases");
          setLoading(false);
        }
      );
      unsubscribes.push(unsubCases);

      // 2) Clients count (fast listener)
      const clientsCol = collection(db, "clients");
      const unsubClients = onSnapshot(
        clientsCol,
        (snap) => setClientsCount(snap.size),
        (err) => {
          console.error("clients snapshot error:", err);
        }
      );
      unsubscribes.push(unsubClients);

      // 3) Associates count
      const associatesCol = collection(db, "associates");
      const unsubAssociates = onSnapshot(
        associatesCol,
        (snap) => setAssociatesCount(snap.size),
        (err) => {
          console.error("associates snapshot error:", err);
        }
      );
      unsubscribes.push(unsubAssociates);

      // 4) Tasks - compute pending
      const tasksCol = collection(db, "tasks");
      const unsubTasks = onSnapshot(
        tasksCol,
        (snap) => {
          // assume each task doc has a boolean 'completed' or status
          let pending = 0;
          snap.docs.forEach((d) => {
            const data = d.data();
            if (data.completed === true) {
              // completed
            } else {
              // treat as pending unless explicitly marked completed
              pending += 1;
            }
          });
          setPendingTasksCount(pending);
        },
        (err) => {
          console.error("tasks snapshot error:", err);
        }
      );
      unsubscribes.push(unsubTasks);

      // 5) Recent activity (if you keep an 'activity' collection)
      //    Order by createdAt descending, limit 10
      try {
        const activityQuery = query(collection(db, "activity"), orderBy("createdAt", "desc"), limit(10));
        const unsubActivity = onSnapshot(
          activityQuery,
          (snap) => {
            const items = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                text: data.text || data.message || "Activity",
                when: data.createdAt ? formatTimestamp(data.createdAt) : "",
              };
            });
            setActivity(items);
          },
          (err) => {
            // If 'activity' doesn't exist or error, we'll fallback below (derived activity)
            console.warn("activity snapshot warning:", err);
            setActivity([]);
          }
        );
        unsubscribes.push(unsubActivity);
      } catch (eAct) {
        console.warn("activity query error", eAct);
      }
    } catch (e) {
      console.error("Firestore listener setup error:", e);
      setError(String(e));
      setLoading(false);
    }

    // Cleanup all listeners on unmount
    return () => {
      unsubscribes.forEach((u) => {
        try {
          u();
        } catch (e) {
          // ignore
        }
      });
    };
  }, []); // run once

  // Derived analytics from cases
  const totalCases = cases.length;
  const activeCases = cases.filter((c) => isActiveStatus(c.status)).length;
  const closedCases = cases.filter((c) => isClosedStatus(c.status)).length;

  // Fallback for recent activity: if no activity collection found, create derived events
  const derivedActivity = () => {
    if (activity && activity.length) return activity;
    // derive from latest case updates (sorted by updatedAt or createdAt)
    const withTime = cases
      .map((c) => ({
        id: c.id,
        text: c.title ? `${c.title} (${c.id}) updated` : `Case #${c.id} updated`,
        when: c.updatedAt ? formatTimestamp(c.updatedAt) : c.createdAt ? formatTimestamp(c.createdAt) : "",
        ts: c.updatedAt ? c.updatedAt : c.createdAt ? c.createdAt : null,
      }))
      .filter((x) => x.ts) // only items that have timestamps
      .sort((a, b) => {
        // try to compare timestamps robustly
        try {
          const ta = typeof a.ts.toDate === "function" ? a.ts.toDate().getTime() : new Date(a.ts).getTime();
          const tb = typeof b.ts.toDate === "function" ? b.ts.toDate().getTime() : new Date(b.ts).getTime();
          return tb - ta;
        } catch {
          return 0;
        }
      })
      .slice(0, 8);
    if (withTime.length) {
      return withTime.map((w) => ({ id: w.id, text: w.text, when: w.when }));
    }
    // last fallback: simple placeholders
    return [
      { id: "f1", text: "No recent activity found", when: "" },
    ];
  };

  // Action cards
  const actionCards = [
    { to: "/manage-cases", title: "Assign Cases", icon: <FiBriefcase size={18} /> },
    { to: "/manage-clients", title: "Manage Clients", icon: <FiUsers size={18} /> },
    { to: "/manage-associates", title: "Manage Associates", icon: <FiUserCheck size={18} /> },
    { to: "/calendar", title: "Calendar / Diary", icon: <FiCalendar size={18} /> },
    { to: "/reports", title: "Reports", icon: <FiFileText size={18} /> },
  ];

  // analytics data arranged for UI
  const analyticsData = [
    { key: "totalCases", label: "Total Cases", value: totalCases, icon: <FiBriefcase size={20} /> },
    { key: "activeCases", label: "Active Cases", value: activeCases, icon: <FiClipboard size={20} /> },
    { key: "closedCases", label: "Closed Cases", value: closedCases, icon: <FiFileText size={20} /> },
    { key: "totalClients", label: "Total Clients", value: clientsCount, icon: <FiUsers size={20} /> },
    { key: "associates", label: "Associates Count", value: associatesCount, icon: <FiUserCheck size={20} /> },
    { key: "pendingTasks", label: "Pending Tasks", value: pendingTasksCount, icon: <FiClock size={20} /> },
  ];

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Owner Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
            Live overview (data from Firestore)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-400 text-white text-sm shadow hover:brightness-95 transition"
            aria-label="Create new case"
          >
            + New Case
          </button>

          <Link
            to="/settings"
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Go to settings"
          >
            Settings
          </Link>
        </div>
      </header>

      {/* Error / Loading */}
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 dark:bg-red-900/30">
          Error loading data: {error}
        </div>
      )}
      {loading && (
        <div className="mb-4 p-3 rounded-md bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20">
          Loading data...
        </div>
      )}

      {/* Analytics grid */}
      <section className="mb-8">
        <motion.div variants={containerFade} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {analyticsData.map((a, i) => (
            <AnalyticsCard key={a.key} label={a.label} value={a.value} icon={a.icon} index={i} />
          ))}
        </motion.div>
      </section>

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h2>
        <motion.div variants={containerFade} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {actionCards.map((act) => (
            <ActionCard key={act.to} to={act.to} title={act.title} icon={act.icon} />
          ))}
        </motion.div>
      </section>

      {/* Lower content */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-3">Recent Activity</h3>

          <motion.ul initial="hidden" animate="show" variants={containerFade} className="space-y-3">
            {derivedActivity().map((item) => (
              <motion.li key={item.id} variants={listItem} className="flex items-start justify-between bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition">
                <div>
                  <div className="text-sm text-gray-700 dark:text-gray-100">{item.text}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-400 mt-1">{item.when}</div>
                </div>

                <div className="text-xs text-gray-400 dark:text-gray-400">View</div>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        {/* Summary */}
        <motion.aside variants={cardFade} initial="hidden" animate="show" className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-3">Summary</h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-300">Open Cases</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{activeCases}</div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-300">Due Today</div>
              {/* You can compute due-today from a task/case dueDate field */}
              <div className="text-sm font-semibold text-orange-500">—</div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-300">Overdue</div>
              <div className="text-sm font-semibold text-red-500">—</div>
            </div>

            <div className="mt-4">
              <Link to="/reports" className="w-full inline-flex items-center justify-center px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-400 text-white text-sm shadow hover:brightness-95 transition">
                View Full Reports
              </Link>
            </div>
          </div>
        </motion.aside>
      </section>

      <footer className="mt-8 text-center text-xs text-gray-400">
        <div>Legal Management System • Owner view (Firestore live)</div>
      </footer>
    </div>
  );
}
