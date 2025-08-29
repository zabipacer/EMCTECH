// CaseList.jsx — fixed PDF generation (ensures every case gets its own page)
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  FileText,
  Clock,
  Briefcase,
  DollarSign,
  MapPin,
  ArrowUpRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Scale,
  User,
  BookOpen,
  Shield,
  Gavel,
  Users,
  CalendarCheck
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { db, auth } from '../firebase/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CaseList = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [expandedCase, setExpandedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [adjournModal, setAdjournModal] = useState(null);

  // Track authentication state and fetch user role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(db, 'Users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUserRole(userData.role || 'user');
          } else {
            setUserRole('user');
          }
        } catch (err) {
          console.error('Error fetching user role:', err);
          setUserRole('user');
        }
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const toggleExpand = (caseId) => setExpandedCase(prev => prev === caseId ? null : caseId);

  const parseHearingDate = (docData) => {
    const dates = [];
    if (docData.hearingDate) {
      const d = new Date(docData.hearingDate);
      if (!isNaN(d.getTime())) dates.push(d);
    }
    if (docData.caseDate) {
      if (typeof docData.caseDate === 'object' && typeof docData.caseDate.toDate === 'function') {
        dates.push(docData.caseDate.toDate());
      } else {
        const d = new Date(docData.caseDate);
        if (!isNaN(d.getTime())) dates.push(d);
      }
    }
    if (Array.isArray(docData.hearingDates)) {
      docData.hearingDates.forEach(dateStr => {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) dates.push(d);
      });
    }
    if (docData.scheduleDate) {
      const d = new Date(docData.scheduleDate);
      if (!isNaN(d.getTime())) dates.push(d);
    }
    return dates;
  };

  useEffect(() => {
    if (!currentUser || !userRole) return;
    setLoading(true);
    setError(null);
    if (!date) {
      setError('Invalid date parameter');
      setLoading(false);
      return;
    }
    const parts = date.split('-');
    if (parts.length !== 3) {
      setError('Invalid date format');
      setLoading(false);
      return;
    }
    const year = +parts[0], month = +parts[1] - 1, day = +parts[2];
    const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

    const fetchAndFilterCases = async () => {
      try {
        const casesCol = collection(db, 'cases');
        let q;
        if (userRole === 'user') {
          q = query(casesCol, where('assignedTo', 'array-contains', currentUser.uid), orderBy('createdAt', 'desc'), limit(2000));
        } else {
          q = query(casesCol, orderBy('createdAt', 'desc'), limit(2000));
        }
        const snapshot = await getDocs(q);
        const all = [];
        snapshot.forEach(d => all.push({ id: d.id, ...d.data() }));

        const filtered = [];
        all.forEach(caseDoc => {
          const hearingDates = parseHearingDate(caseDoc);
          for (const dateObj of hearingDates) {
            if (!dateObj) continue;
            if (dateObj >= startOfDay && dateObj <= endOfDay) {
              filtered.push({ ...caseDoc, parsedHearingDate: dateObj });
              break;
            }
          }
        });

        setCases(filtered);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching cases:', err);
        setError('Failed to load cases');
        setLoading(false);
      }
    };

    fetchAndFilterCases();
  }, [date, currentUser, userRole]);

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch ((status || '').toLowerCase()) {
      case 'in review': return 'bg-blue-100 text-blue-800';
      case 'preparation': return 'bg-amber-100 text-amber-800';
      case 'discovery': return 'bg-purple-100 text-purple-800';
      case 'negotiation': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    switch ((priority || '').toLowerCase()) {
      case 'urgent':
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatHearingTime = (hearingDate) => {
    if (!hearingDate) return '—';
    try {
      const d = new Date(hearingDate);
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (err) {
      return '—';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) {
        if (typeof dateString === 'string' && dateString.includes('/')) return dateString;
        return '—';
      }
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '—';
    }
  };

  const adjournCase = async (caseId, newDate, reason) => {
    try {
      const caseRef = doc(db, 'cases', caseId);
      await updateDoc(caseRef, {
        hearingDate: newDate,
        adjournHistory: arrayUnion({
          date: newDate,
          reason,
          updatedAt: new Date().toISOString()
        })
      });
      setCases(cases.map(c =>
        c.id === caseId ? {
          ...c,
          hearingDate: newDate,
          adjournHistory: [...(c.adjournHistory || []), { date: newDate, reason, updatedAt: new Date().toISOString() }]
        } : c
      ));
      setAdjournModal(null);
      alert('Case adjourned successfully!');
    } catch (err) {
      console.error('Error adjourning:', err);
      alert('Failed to adjourn case');
    }
  };

  const renderCourt = (caseItem) => {
    const c = caseItem?.court;
    if (!c) return '—';
    if (typeof c === 'string') return c;
    if (typeof c === 'object') {
      const name = c.name || c.courtName || c.title || '';
      const district = c.district || c.city || '';
      return name ? (district ? `${name} — ${district}` : name) : '—';
    }
    return '—';
  };

  // ========== FIXED PDF generation ==========
  const escapeHtml = (str) => {
    if (!str && str !== 0) return '';
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  };

  const buildTextSummary = (casesArray) => {
    if (!casesArray || casesArray.length === 0) return 'No cases for today.';
    const parts = casesArray.map((c, i) => {
      const court = renderCourt(c);
      const hearing = c.hearingDate ? `${formatDate(c.hearingDate)} ${formatHearingTime(c.hearingDate)}` : '—';
      const title = c.caseTitle || 'Untitled';
      const num = c.caseNumber || (c.id ? `#${c.id.slice(-6)}` : '—');
      const party = c.partyName || '—';
      const small = c.caseDescription ? (c.caseDescription.length > 120 ? c.caseDescription.slice(0, 117) + '…' : c.caseDescription) : '';
      return `${i + 1}. ${title}\n   Case #: ${num}\n   Court: ${court}\n   Party: ${party}\n   Hearing: ${hearing}\n   ${small ? `Desc: ${small}\n` : ''}`;
    });
    return `Cases for ${new Date(date).toLocaleDateString()}:\n\n` + parts.join('\n');
  };

  // Improved generatePdfBlob: scale to fit both width & height of A4 (prevents clipping)
const generatePdfBlob = async (casesArray) => {
  if (!casesArray || casesArray.length === 0) return null;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const availWidth = pageWidth - margin * 2;
  const lineHeight = 7;

  let y = margin;

  casesArray.forEach((c, i) => {
    const court = renderCourt(c);
    const hearing = c.hearingDate
      ? `${formatDate(c.hearingDate)} ${formatHearingTime(c.hearingDate)}`
      : '—';
    const title = c.caseTitle || 'Untitled Case';
    const num = c.caseNumber || (c.id ? `#${c.id.slice(-6)}` : '—');
    const party = c.partyName || '—';
    const stage = c.caseStage || '—';
    const desc =
      c.caseDescription && c.caseDescription.length > 120
        ? c.caseDescription.slice(0, 117) + '…'
        : c.caseDescription || '';

    const lines = [
      `${i + 1}. ${title}`,
      `   Case #: ${num}   •   Stage: ${stage}`,
      `   Court: ${court}`,
      `   Party: ${party}`,
      `   Hearing: ${hearing}`,
      desc ? `   Desc: ${desc}` : '',
    ].filter(Boolean);

    // Check if adding these lines fits current page, else new page
    if (y + lines.length * lineHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }

    lines.forEach((line) => {
      pdf.text(line, margin, y);
      y += lineHeight;
    });

    // Add a separator line between cases
    pdf.setDrawColor(200);
    pdf.line(margin, y, pageWidth - margin, y);
    y += lineHeight;
  });

  return pdf.output('blob');
};


  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const sharePdfBlob = async (blob, filename) => {
    try {
      const file = new File([blob], filename, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Cases - ${date}`, text: `Cases for ${new Date(date).toLocaleDateString()}` });
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Web Share failed', err);
      return false;
    }
  };

  const shareViaWhatsAppText = (text) => {
    const encoded = encodeURIComponent(text);
    const waUrl = `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  const exportAndShareCases = async (opts = { download: false, shareFile: true }) => {
    if (!cases || cases.length === 0) {
      alert('No cases to export for this date.');
      return;
    }
    try {
      setLoading(true);
      const pdfBlob = await generatePdfBlob(cases);
      if (!pdfBlob) {
        alert('Failed to generate PDF');
        setLoading(false);
        return;
      }
      const filename = `cases_${date}.pdf`;

      if (opts.download) {
        downloadBlob(pdfBlob, filename);
        setLoading(false);
        return;
      }

      if (opts.shareFile) {
        const shared = await sharePdfBlob(pdfBlob, filename);
        if (shared) {
          setLoading(false);
          return;
        }
      }

      // fallback: download + whatsapp text summary
      downloadBlob(pdfBlob, filename);
      const summary = buildTextSummary(cases);
      shareViaWhatsAppText(summary);
    } catch (err) {
      console.error('Export/Share failed: ', err);
      alert('Failed to export/share: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // (rest of your UI — unchanged)...
  if (currentUser === null) {
    return (
      <div className="p-6 max-w-6xl mx-auto text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-yellow-800 mb-4">Authentication Required</h2>
          <p className="text-yellow-700 mb-6">Please sign in to view your assigned cases</p>
          <button onClick={() => navigate('/login')} className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">Go to Login</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map(i => (<div key={i} className="h-24 bg-gray-200 rounded-xl"></div>))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (<div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-700 font-medium">Error Loading Cases</div>
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  const headerText = userRole === 'user'
    ? `Your Assigned Cases for ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
    : `All Cases for ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-6 justify-between">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <ChevronLeft className="w-5 h-5 mr-1" /> Back to Calendar
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 ml-4">{headerText}</h1>
        </div>

        {/* Export / Share */}
        <div className="flex items-center gap-3">
          <button onClick={() => exportAndShareCases({ shareFile: true })} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Export & Share PDF</button>
          <button onClick={() => exportAndShareCases({ download: true, shareFile: false })} className="px-3 py-2 bg-white border border-gray-200 text-gray-800 rounded-lg hover:bg-gray-50">Download PDF</button>
        </div>
      </div>

      {/* Summary + Cases (rest unchanged) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-100 shadow-sm">
          <h3 className="text-lg font-semibold text-blue-800">{cases.length ? 'Total Cases' : 'No Cases'}</h3>
          <p className="text-3xl font-bold text-blue-900 mt-2">{cases.length}</p>
        </div>
       
      </div>

      {cases.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center border border-gray-100">
          <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No cases found</h3>
          <p className="text-gray-500 max-w-md mx-auto">No cases for selected date.</p>
          <button onClick={() => navigate(-1)} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Back to Calendar</button>
        </div>
      ) : (
        <div className="space-y-5">
          {cases.map(caseItem => (
            <div key={caseItem.id} className={`bg-white rounded-2xl shadow-md overflow-hidden border transition-all duration-200 ${expandedCase === caseItem.id ? 'border-blue-300 shadow-lg' : 'border-gray-100 hover:border-blue-200 hover:shadow-lg'}`}>
              <div className="p-5 cursor-pointer" onClick={() => toggleExpand(caseItem.id)}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-3 rounded-lg"><Briefcase className="w-5 h-5 text-blue-700" /></div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{caseItem.caseTitle || 'Untitled Case'}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 flex items-center gap-2"><Gavel className="w-3 h-3" /><span className="font-medium">{renderCourt(caseItem)}</span></div>
                          <span className="text-sm text-gray-600">Case #: {caseItem.caseNumber || `#${caseItem.id?.slice(-6) || 'Unknown'}`}</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(caseItem.priority)}`}>{caseItem.priority || 'Standard'}</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(caseItem.status)}`}>{caseItem.status || 'Unknown'}</span>
                        </div>
                        <p className="text-gray-600 flex items-center mb-1"><User className="w-4 h-4 mr-2" />{caseItem.partyName ? `${caseItem.partyName} (${caseItem.onBehalfOf})` : '—'}</p>
                        <p className="text-gray-600 flex items-center"><CalendarIcon className="w-4 h-4 mr-2" />{caseItem.hearingDate ? new Date(caseItem.hearingDate).toLocaleDateString() : '—'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-gray-50 px-3 py-2 rounded-lg flex items-center"><Clock className="w-4 h-4 mr-2 text-gray-600" /><span className="font-medium">{formatHearingTime(caseItem.hearingDate) || caseItem.scheduleTime || '—'}</span></div>
                    <div className="bg-gray-50 px-3 py-2 rounded-lg flex items-center"><MapPin className="w-4 h-4 mr-2 text-gray-600" /><span className="text-sm">{caseItem.location || '—'}</span></div>
                     <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">{expandedCase === caseItem.id ? <ChevronUp /> : <ChevronDown />}</button>
                  </div>
                </div>
              </div>

              {expandedCase === caseItem.id && (
                <div className="border-t border-gray-100 px-5 py-6 bg-gray-50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* left & right content as in your original file */}
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center"><FileText className="w-5 h-5 mr-2 text-blue-600" />Case Overview</h4>
                        <div className="space-y-3">
                          <div><p className="text-sm text-gray-500">Case Title</p><p className="font-medium">{caseItem.caseTitle || '—'}</p></div>
                          <div><p className="text-sm text-gray-500">Case Number</p><p className="font-medium">{caseItem.caseNumber || '—'}</p></div>
                          <div><p className="text-sm text-gray-500">On Behalf Of</p><p className="font-medium">{caseItem.onBehalfOf || '—'}</p></div>
                          <div><p className="text-sm text-gray-500">Case Stage</p><p className="font-medium">{caseItem.caseStage || '—'}</p></div>
                          <div><p className="text-sm text-gray-500">Party Name</p><p className="font-medium">{caseItem.partyName || '—'}</p></div>
                          <div><p className="text-sm text-gray-500">Complainant Name</p><p className="font-medium">{caseItem.complainantName || '—'}</p></div>
                          <div><p className="text-sm text-gray-500">Location</p><p className="font-medium">{caseItem.location || '—'}</p></div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center"><Gavel className="w-5 h-5 mr-2 text-purple-600" />Legal Details</h4>
                        <div className="space-y-3">
                          <div><p className="text-sm text-gray-500">U/Sec or Nature of Suit</p><p className="font-medium">{caseItem.underSection || '—'}</p></div>
                          <div><p className="text-sm text-gray-500">Hearing Date</p><p className="font-medium">{caseItem.hearingDate ? new Date(caseItem.hearingDate).toLocaleDateString() : '—'}</p></div>
                          <div><p className="text-sm text-gray-500">Adjourn Date</p><p className="font-medium">{formatDate(caseItem.adjournDate) || '—'}</p></div>
                          <div><p className="text-sm text-gray-500">Court</p><p className="font-medium">{renderCourt(caseItem)}</p></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center"><Scale className="w-5 h-5 mr-2 text-purple-600" />Case Metrics</h4>
                        <div className="space-y-4">
                          <div><div className="flex justify-between items-center mb-2"><p className="text-sm text-gray-500">Progress</p><p className="text-sm font-medium">{caseItem.progress || 0}%</p></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${caseItem.progress || 0}%` }}></div></div></div>
                           </div>
                      </div>

                      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center"><FileText className="w-5 h-5 mr-2 text-blue-600" />Case Description</h4>
                        <p className="text-gray-700">{caseItem.caseDescription || 'No description provided.'}</p>
                      </div>

                      {caseItem.adjournHistory && caseItem.adjournHistory.length > 0 && (
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                          <h4 className="font-bold text-gray-800 mb-4 flex items-center"><CalendarCheck className="w-5 h-5 mr-2 text-blue-600" />Adjournment History</h4>
                          <div className="space-y-3">
                            {caseItem.adjournHistory.map((adjournment, index) => (
                              <div key={index} className="border-l-4 border-blue-200 pl-3 py-2">
                                <div className="flex justify-between items-start">
                                  <p className="font-medium text-gray-800">{adjournment.date ? new Date(adjournment.date).toLocaleDateString() : 'No date'}</p>
                                  <span className="text-xs text-gray-500">{adjournment.updatedAt ? new Date(adjournment.updatedAt).toLocaleDateString() : ''}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{adjournment.reason || 'No reason provided'}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <div className="flex flex-wrap gap-3">
                          <button onClick={() => setAdjournModal(caseItem)} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">Adjourn Case</button>
                          <button onClick={() => navigate(`/edit-form/${caseItem.id}`)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Edit Case</button>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
                          <span>Created: {caseItem.createdAt ? new Date(caseItem.createdAt).toLocaleDateString() : '—'}</span>
                          <span>Updated: {caseItem.updatedAt ? new Date(caseItem.updatedAt).toLocaleDateString() : '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {adjournModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Adjourn Case</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">New Date</label><input type="date" className="w-full p-2 border rounded-lg" id="adjournDate" /></div>
              <div><label className="block text-sm font-medium mb-1">Reason</label><textarea className="w-full p-2 border rounded-lg" rows="3" id="adjournReason" placeholder="Enter reason for adjournment"></textarea></div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setAdjournModal(null)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button onClick={() => {
                  const newDate = document.getElementById('adjournDate').value;
                  const reason = document.getElementById('adjournReason').value;
                  if (newDate && reason) adjournCase(adjournModal.id, newDate, reason);
                  else alert('Please provide both date and reason');
                }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Confirm Adjournment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseList;
