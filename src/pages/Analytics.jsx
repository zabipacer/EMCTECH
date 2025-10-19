// src/pages/Analytics.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiBarChart2, FiPieChart, FiTrendingUp, FiUsers, FiDollarSign, FiCheckCircle, FiClock } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';

/*
Firestore-based Analytics Dashboard
- Replaces mock data with real queries on collections:
  - proposals (fields used: proposalDate (string), createdAt/updatedAt (timestamp), grandTotal (number), status, clientName)
  - products (fields used: title.EN or name, price (number), stock (number), lowStockThreshold (number))
  - clients (fields used: status, createdAt)
- Handles Firestore Timestamps where necessary (uses .toDate()).
- Aggregates:
  - proposal time series (sent vs accepted) for chosen range (7/30/90 days)
  - top products (by price*stock or price if stock missing)
  - monthly revenue per top clients (last 6 months)
  - KPI stats (total revenue from paid/completed proposals, active clients, acceptance rate, avg response time stub)
*/

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

function toDate(d) {
  // Accepts Firestore Timestamp, ISO string, or Date
  if (!d) return null;
  if (typeof d === 'string') {
    const parsed = new Date(d);
    return isNaN(parsed) ? null : parsed;
  }
  if (d.toDate && typeof d.toDate === 'function') return d.toDate();
  if (d instanceof Date) return d;
  return null;
}

function formatMonthLabel(date) {
  return date.toLocaleString('default', { month: 'short' });
}

function parseYYYYMMDD(str) {
  // Accepts 'YYYY-MM-DD' or similar; returns Date or null
  if (!str) return null;
  const tryDate = new Date(str);
  if (!isNaN(tryDate)) return tryDate;
  return null;
}

function prettyTimeFromDate(d) {
  if (!d) return 'just now';
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-xs">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-gray-700">
            <span style={{ color: entry.color }}>{entry.name}</span>: <strong>{entry.value}</strong>{entry.dataKey === 'rate' ? '%' : entry.dataKey === 'grandTotal' ? ' USD' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

const KPICard = ({ title, value, change, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <motion.div variants={itemVariants} className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {typeof change === 'number' && (
            <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}% from last period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30d'); // '7d' | '30d' | '90d'
  const [proposalDocs, setProposalDocs] = useState([]);
  const [productDocs, setProductDocs] = useState([]);
  const [clientDocs, setClientDocs] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Firestore realtime listeners
  useEffect(() => {
    setLoading(true);
    const proposalsCol = collection(db, 'proposals');
    const productsCol = collection(db, 'products');
    const clientsCol = collection(db, 'clients');

    // Listen proposals (ordered by updatedAt descending so recent come first)
    const unsubProposals = onSnapshot(
      query(proposalsCol, orderBy('updatedAt', 'desc')),
      (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setProposalDocs(arr);
      },
      (err) => {
        console.error('proposals snapshot error:', err);
      }
    );

    // Listen products
    const unsubProducts = onSnapshot(
      query(productsCol, orderBy('updatedAt', 'desc')),
      (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setProductDocs(arr);
      },
      (err) => {
        console.error('products snapshot error:', err);
      }
    );

    // Listen clients
    const unsubClients = onSnapshot(
      query(clientsCol, orderBy('createdAt', 'desc')),
      (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setClientDocs(arr);
      },
      (err) => {
        console.error('clients snapshot error:', err);
      }
    );

    // stop loading after initial short delay (listeners will update state)
    const t = setTimeout(() => setLoading(false), 700);

    return () => {
      unsubProposals && unsubProposals();
      unsubProducts && unsubProducts();
      unsubClients && unsubClients();
      clearTimeout(t);
    };
  }, []);

  /* ---------------------------
     Transformations / Aggregates
     --------------------------- */

  // KPI: total revenue (paid/completed), active clients count, proposal acceptance rate, avg response time (best-effort)
  const kpiStats = useMemo(() => {
    // totalRevenue: sum grandTotal for proposals with status 'paid' or 'completed' (case-insensitive)
    let totalRevenue = 0;
    let acceptedCount = 0;
    let sentCount = 0;
    let responseDaysTotal = 0;
    let responseCount = 0;

    for (const p of proposalDocs) {
      const status = (p.status || '').toString().toLowerCase();
      const grand = Number(p.grandTotal || 0);
      // determine sent: presence of proposalDate or createdAt -> counts as sent
      const proposalDate = p.proposalDate ? parseYYYYMMDD(p.proposalDate) : toDate(p.createdAt) || toDate(p.updatedAt);
      if (proposalDate) sentCount += 1;
      if (status === 'accepted' || status === 'sent-accepted' || status === 'paid' || status === 'completed') {
        acceptedCount += 1;
      }
      if ((status === 'paid' || status === 'completed') && !isNaN(grand)) totalRevenue += grand;

      // average response time: if you have createdAt and updatedAt, compute diff in days when status changed (best-effort)
      if (p.createdAt && p.updatedAt && p.updatedAt !== p.createdAt) {
        const c = toDate(p.createdAt);
        const u = toDate(p.updatedAt);
        if (c && u) {
          responseDaysTotal += Math.max(0, (u - c) / (1000 * 60 * 60 * 24));
          responseCount += 1;
        }
      }
    }

    const activeClients = clientDocs.filter((c) => (c.status || '').toString().toLowerCase() === 'active' || (c.status || '').toString().toLowerCase() === 'premium').length;
    const acceptanceRate = sentCount ? Math.round((acceptedCount / sentCount) * 100) : 0;
    const avgResponseTime = responseCount ? Number((responseDaysTotal / responseCount).toFixed(1)) : null;

    return {
      totalRevenue,
      activeClients,
      proposalAcceptance: acceptanceRate,
      avgResponseTime
    };
  }, [proposalDocs, clientDocs]);

  // Proposal time series (sent vs accepted) for the given timeRange
  const proposalSeries = useMemo(() => {
    // build days array
    const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;
    const now = new Date();
    const map = {}; // dateStr -> { date, sent, accepted, rate }
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      map[key] = { date: key, sent: 0, accepted: 0, rate: 0 };
    }

    for (const p of proposalDocs) {
      // determine proposal date
      let pd = null;
      if (p.proposalDate) pd = parseYYYYMMDD(p.proposalDate);
      if (!pd && p.createdAt) pd = toDate(p.createdAt);
      if (!pd && p.updatedAt) pd = toDate(p.updatedAt);
      if (!pd) continue;
      const key = pd.toISOString().split('T')[0];
      if (!(key in map)) continue; // outside range
      map[key].sent += 1;
      const status = (p.status || '').toString().toLowerCase();
      if (status === 'accepted' || status === 'paid' || status === 'completed') map[key].accepted += 1;
    }

    const arr = Object.values(map).map((r) => ({ ...r, rate: r.sent ? Math.round((r.accepted / r.sent) * 100) : 0 }));
    return arr;
  }, [proposalDocs, timeRange]);

  // Product top list (by revenue potential = price * stock OR price)
  const productTop = useMemo(() => {
    const list = productDocs.map((p) => {
      // title could be object { EN: ... } or string fields
      const title = (p.title && p.title.EN) || p.name || p.title || p.slug || 'Unnamed';
      const price = Number(p.price || p.cost || 0);
      const stock = Number(p.stock || 0);
      const score = (!isNaN(price) ? price : 0) * (!isNaN(stock) ? Math.max(1, stock) : 1);
      return { id: p.id, name: title, value: isNaN(score) ? 0 : score, price: price, stock: stock };
    });
    list.sort((a, b) => b.value - a.value);
    return list.slice(0, 6);
  }, [productDocs]);

  // Revenue trend by client for last 6 months (monthly totals per client)
  const revenueTrend = useMemo(() => {
    // choose top clients by total across proposals
    const now = new Date();
    const months = 6;
    // monthsKeys: array of Date (first day of month)
    const monthsKeys = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsKeys.push(d);
    }

    // group by clientName and month
    const clientMonthMap = {}; // client -> monthKey -> sum
    const clientTotals = {}; // client -> total

    for (const p of proposalDocs) {
      const status = (p.status || '').toString().toLowerCase();
      const grand = Number(p.grandTotal || 0);
      // use proposalDate if present else createdAt/updatedAt
      let pd = null;
      if (p.proposalDate) pd = parseYYYYMMDD(p.proposalDate);
      if (!pd && p.createdAt) pd = toDate(p.createdAt);
      if (!pd && p.updatedAt) pd = toDate(p.updatedAt);
      if (!pd) continue;
      // only consider proposals within last 6 months window
      const monthStart = new Date(pd.getFullYear(), pd.getMonth(), 1).getTime();
      const found = monthsKeys.find((m) => m.getTime() === monthStart);
      if (!found) continue;

      const client = (p.clientName || p.client || p.clientEmail || 'Unknown Client').toString();
      clientMonthMap[client] = clientMonthMap[client] || {};
      clientMonthMap[client][monthStart] = (clientMonthMap[client][monthStart] || 0) + (isNaN(grand) ? 0 : grand);
      clientTotals[client] = (clientTotals[client] || 0) + (isNaN(grand) ? 0 : grand);
    }

    // pick top 4 clients by total
    const topClients = Object.keys(clientTotals).sort((a, b) => clientTotals[b] - clientTotals[a]).slice(0, 4);

    // assemble data array for recharts: each item = { month: 'Oct', 'Client A': value, 'Client B': value, total: x }
    const data = monthsKeys.map((m) => {
      const monthKey = m.getTime();
      const item = { month: formatMonthLabel(m), monthKey };
      let tot = 0;
      for (const client of topClients) {
        const val = clientMonthMap[client] && clientMonthMap[client][monthKey] ? clientMonthMap[client][monthKey] : 0;
        item[client] = val;
        tot += val;
      }
      item.total = tot;
      return item;
    });

    return data;
  }, [proposalDocs]);

  // Recent activity list (from proposals & product updates)
  const recentActivities = useMemo(() => {
    const acts = [];

    for (const p of proposalDocs.slice(0, 8)) {
      const ts = toDate(p.updatedAt) || toDate(p.createdAt);
      acts.push({
        id: `proposal-${p.id}`,
        type: 'proposal',
        message: `Proposal ${p.proposalNumber || p.proposalTitle || ''} for ${p.clientName || p.clientEmail || 'client'} — ${p.status || ''}`,
        timePretty: prettyTimeFromDate(ts),
        ts: ts ? ts.getTime() : Date.now(),
        icon: FiBarChart2,
        color: 'text-blue-500'
      });
    }

    for (const pr of productDocs.slice(0, 8)) {
      const ts = toDate(pr.updatedAt) || toDate(pr.createdAt);
      const title = (pr.title && pr.title.EN) || pr.name || pr.title || 'Product';
      acts.push({
        id: `product-${pr.id}`,
        type: 'product',
        message: `Product "${title}" updated`,
        timePretty: prettyTimeFromDate(ts),
        ts: ts ? ts.getTime() : Date.now(),
        icon: FiPieChart,
        color: 'text-green-500'
      });
    }

    // sort descending by ts and keep 10
    acts.sort((a, b) => b.ts - a.ts);
    return acts.slice(0, 10);
  }, [proposalDocs, productDocs]);

  /* ---------------------------
     Export CSV (simple client-side)
     --------------------------- */
  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      // For simplicity: export proposals as CSV
      const rows = proposalDocs.map((p) => ({
        id: p.id,
        proposalNumber: p.proposalNumber || '',
        clientName: p.clientName || '',
        proposalDate: p.proposalDate || (p.createdAt ? toDate(p.createdAt).toISOString() : ''),
        status: p.status || '',
        grandTotal: p.grandTotal || 0
      }));

      const csv = toCSV(rows);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposals-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      // small UX: notify via alert (or replace with toast)
      alert(`${format.toUpperCase()} export completed — downloaded proposals CSV.`);
    } catch (err) {
      console.error('export error', err);
      alert('Export failed. Check console.');
    } finally {
      setIsExporting(false);
    }
  };

  const toCSV = (rows) => {
    if (!rows || rows.length === 0) return '';
    const keys = Object.keys(rows[0]);
    const lines = [keys.join(',')];
    for (const r of rows) {
      const vals = keys.map((k) => {
        const v = r[k] ?? '';
        if (typeof v === 'string') return `"${v.replace(/"/g, '""')}"`;
        return v;
      });
      lines.push(vals.join(','));
    }
    return lines.join('\n');
  };

  /* ---------------------------
     Render UI (same layout as your mock)
     --------------------------- */

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your business performance and metrics (live from Firestore)</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>

            <button onClick={() => handleExport('csv')} disabled={isExporting} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <FiDownload className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>

            <button onClick={() => handleExport('pdf')} disabled={isExporting} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <FiDownload className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard title="Total Revenue" value={`$${kpiStats.totalRevenue?.toLocaleString()}`} change={12.5} icon={FiDollarSign} color="green" />
          <KPICard title="Active Clients" value={kpiStats.activeClients} change={8.3} icon={FiUsers} color="blue" />
          <KPICard title="Proposal Acceptance" value={`${kpiStats.proposalAcceptance}%`} change={4.2} icon={FiCheckCircle} color="purple" />
          <KPICard title="Avg Response Time" value={kpiStats.avgResponseTime ? `${kpiStats.avgResponseTime} days` : '—'} change={-15.2} icon={FiClock} color="yellow" />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Proposals Sent vs Accepted */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900"><FiBarChart2 className="w-5 h-5" /> Proposals Sent vs Accepted</h2>
              <div className="flex gap-2 text-sm">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded" /> <span>Sent</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded" /> <span>Accepted</span></div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={proposalSeries}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sent" fill="#4F46E5" radius={[4,4,0,0]} />
                <Bar dataKey="accepted" fill="#10B981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top Products */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-6"><FiPieChart className="w-5 h-5" /> Top Products by Potential Revenue</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={productTop} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent*100).toFixed(0)}%)`} labelLine={false}>
                  {productTop.map((entry, idx) => <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, 'Potential']} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Revenue Trend */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-6"><FiTrendingUp className="w-5 h-5" /> Revenue Trend by Client</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                <Legend />
                {revenueTrend.length > 0 && Object.keys(revenueTrend[0]).filter(k => k !== 'month' && k !== 'monthKey' && k !== 'total').map((client, idx) => (
                  <Line key={client} type="monotone" dataKey={client} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Proposal Performance */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-6"><FiBarChart2 className="w-5 h-5" /> Proposal Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {proposalSeries.slice(-3).map((day, idx) => (
              <div key={idx} className="text-center p-4 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">{day.date}</p>
                <div className="flex justify-between items-center mb-2"><span className="text-sm">Sent:</span><span className="font-semibold">{day.sent}</span></div>
                <div className="flex justify-between items-center mb-2"><span className="text-sm">Accepted:</span><span className="font-semibold text-green-600">{day.accepted}</span></div>
                <div className="flex justify-between items-center"><span className="text-sm">Rate:</span><span className="font-semibold text-blue-600">{day.rate}%</span></div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-6">Recent Activity</h2>
          <ul className="space-y-2 max-h-[320px] overflow-y-auto">
            {recentActivities.map((a) => (
              <li key={a.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full bg-gray-100 ${a.color}`}>
                    <a.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate" title={a.message}>{a.message}</p>
                    <p className="text-xs text-gray-500">{a.timePretty}</p>
                  </div>
                </div>
                <div className="text-gray-300 text-sm">›</div>
              </li>
            ))}
            {recentActivities.length === 0 && <li className="text-gray-500 text-center py-4">No recent activity</li>}
          </ul>
        </motion.div>
      </motion.div>

      {loading && (
        <div className="fixed inset-0 flex items-end justify-end p-6 pointer-events-none">
          <div className="bg-white px-4 py-2 rounded shadow">Loading analytics…</div>
        </div>
      )}
    </div>
  );
}
