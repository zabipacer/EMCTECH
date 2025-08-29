import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FaGavel, FaMapMarkerAlt, FaCheck, FaPlus, FaTimes, FaSearch } from "react-icons/fa";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  getDoc
} from "firebase/firestore";
import { db } from "../firebase/firebase";

// Lightweight courts + districts (extend as needed)
const districts = [
  "Lahore",
  "Karachi",
  "Islamabad",
  "Multan",
  "Faisalabad",
  "Rawalpindi",
  "Quetta",
  "Peshawar",
  "Hyderabad",
  "Gujranwala",
  "Sialkot",
  "Bahawalpur",
];

const builtInCourts = [
  "Supreme Court of Pakistan",
  "Lahore High Court – Principal Seat (Lahore)",
  "Lahore High Court – Multan Bench",
  "High Court of Sindh (Karachi)",
  "High Court of Peshawar",
  "High Court of Balochistan (Quetta)",
  "Islamabad High Court",
  "District Court – Lahore",
  "District Court – Karachi",
  "Family Court – Lahore",
  "Anti-Terrorism Court – Lahore",
  "Other"
];

export default function AddCourt({ caseId: propCaseId = null, saveNewCourtToList = false }) {
  const [district, setDistrict] = useState("");
  const [court, setCourt] = useState("");
  const [loading, setLoading] = useState(false);

  // Case selector/search
  const [caseQuery, setCaseQuery] = useState("");
  const [caseResults, setCaseResults] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null); // { id, caseTitle }

  const [showDistrictList, setShowDistrictList] = useState(false);
  const [showCourtList, setShowCourtList] = useState(false);
  const [showCaseList, setShowCaseList] = useState(false);

  const containerRef = useRef(null);
  const caseRef = useRef(null);
  const districtRef = useRef(null);
  const courtRef = useRef(null);

  useEffect(() => {
    // if parent passed propCaseId, try to load its title
    const loadPropCase = async () => {
      if (!propCaseId) return;
      try {
        const snap = await getDoc(doc(db, "cases", String(propCaseId)));
        if (snap.exists()) {
          const data = snap.data();
          setSelectedCase({ id: snap.id, caseTitle: data.caseTitle || data.title || `Case ${snap.id}` });
        } else {
          setSelectedCase({ id: String(propCaseId), caseTitle: `Case ${propCaseId}` });
        }
      } catch (err) {
        console.warn("Could not load case for propCaseId", err);
      }
    };
    loadPropCase();
  }, [propCaseId]);

  useEffect(() => {
    // close dropdown when clicking outside
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDistrictList(false);
        setShowCourtList(false);
        setShowCaseList(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  // fetch recent cases and filter client-side (works with your schema: caseTitle, caseNumber, partyName)
  useEffect(() => {
    if (!caseQuery || caseQuery.trim().length === 0) {
      setCaseResults([]);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoadingCases(true);
      try {
        // load most recent 200 cases (adjust limit as needed)
        const q = query(collection(db, "cases"), orderBy("createdAt", "desc"), limit(200));
        const snap = await getDocs(q);
        if (cancelled) return;
        const items = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));

        const ql = caseQuery.trim().toLowerCase();
        const filtered = items.filter(it => {
          const title = (it.caseTitle || "").toLowerCase();
          const number = (it.caseNumber || "").toLowerCase();
          const party = (it.partyName || "").toLowerCase();
          return title.includes(ql) || number.includes(ql) || party.includes(ql);
        });

        setCaseResults(filtered.slice(0, 50));
      } catch (err) {
        console.error("Error searching cases:", err);
        setCaseResults([]);
      } finally {
        if (!cancelled) setLoadingCases(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [caseQuery]);

  const selectCase = (c) => {
    setSelectedCase({ id: c.id, caseTitle: c.caseTitle || c.caseTitle || c.caseTitle || `Case ${c.id}` });
    setCaseQuery("");
    setCaseResults([]);
    setShowCaseList(false);
  };

  const clearSelectedCase = () => setSelectedCase(null);

  const selectDistrict = (d) => {
    setDistrict(d);
    setShowDistrictList(false);
    setTimeout(() => courtRef.current && courtRef.current.focus(), 0);
  };

  const selectCourt = (c) => {
    setCourt(c);
    setShowCourtList(false);
  };

  const saveCourt = async () => {
    if (!district) return alert("Please select a district first.");
    if (!court || !court.trim()) return alert("Please enter a court name.");

    setLoading(true);
    try {
      let targetCaseId = selectedCase?.id || null;

      // if no selected case but user typed caseQuery, create a new case with minimal fields
      if (!targetCaseId && caseQuery && caseQuery.trim()) {
        const newCase = await addDoc(collection(db, "cases"), {
          caseTitle: caseQuery.trim(),
          createdAt: serverTimestamp(),
          court: { name: court.trim(), district }
        });
        targetCaseId = newCase.id;
      }

      // fallback: use propCaseId if provided
      if (!targetCaseId && propCaseId) targetCaseId = String(propCaseId);

      // final fallback: create an empty case and attach court
      if (!targetCaseId) {
        const newCase = await addDoc(collection(db, "cases"), {
          caseTitle: `Case ${new Date().toISOString()}`,
          createdAt: serverTimestamp(),
          court: { name: court.trim(), district }
        });
        targetCaseId = newCase.id;
      }

      // update the target case
      await updateDoc(doc(db, "cases", String(targetCaseId)), {
        court: { name: court.trim(), district }
      });

      // optionally, store new court in a central collection
      if (saveNewCourtToList) {
        // cheap client-side check; for production check server-side or unique index
        const existing = builtInCourts.find(b => b.toLowerCase() === court.trim().toLowerCase());
        if (!existing) {
          await addDoc(collection(db, "courts"), { name: court.trim(), district });
        }
      }

      alert("Court saved to case ✅");
      setCourt("");
      // keep district & selected case for rapid multiple adds
    } catch (err) {
      console.error("saveCourt error:", err);
      alert("Error saving court. See console for details.");
    }
    setLoading(false);
  };

  const filteredDistricts = districts.filter(d => d.toLowerCase().includes(district.toLowerCase()));
  const filteredBuiltCourts = builtInCourts.filter(c => c.toLowerCase().includes(court.toLowerCase()));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      ref={containerRef}
      className="p-6 bg-white rounded-2xl shadow-md w-full max-w-2xl mx-auto"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2"><FaGavel /> Add / Select Court</h2>
        <div className="text-sm text-gray-500">Search case by title, number or party</div>
      </div>

      {/* Case selector */}
      <div className="mt-4 relative">
        <label className="text-sm text-gray-600 flex items-center gap-2"><FaSearch /> Case</label>

        {selectedCase ? (
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
            <div className="flex-1">
              <div className="font-medium">{selectedCase.caseTitle}</div>
              <div className="text-xs text-gray-500">ID: {selectedCase.id}</div>
            </div>
            <button onClick={clearSelectedCase} className="text-sm text-gray-500">Change</button>
          </div>
        ) : (
          <>
            <input
              ref={caseRef}
              value={caseQuery}
              onChange={(e) => { setCaseQuery(e.target.value); setShowCaseList(true); }}
              onFocus={() => setShowCaseList(true)}
              placeholder="Search by case title, number or party. Or type a new case title and press Enter to create"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  if (caseResults.length > 0) {
                    selectCase(caseResults[0]);
                  } else if (caseQuery.trim()) {
                    // create new minimal case
                    setLoadingCases(true);
                    try {
                      const newCase = await addDoc(collection(db, 'cases'), {
                        caseTitle: caseQuery.trim(),
                        createdAt: serverTimestamp()
                      });
                      selectCase({ id: newCase.id, caseTitle: caseQuery.trim() });
                    } catch (err) {
                      console.error('create case error', err);
                      alert('Could not create case. See console.');
                    }
                    setLoadingCases(false);
                  }
                }
              }}
            />

            {showCaseList && caseQuery && (
              <ul className="absolute z-20 left-0 right-0 bg-white border mt-1 rounded-lg max-h-52 overflow-y-auto">
                {loadingCases && <li className="px-3 py-2 text-gray-500">Searching...</li>}
                {!loadingCases && caseResults.length === 0 && (
                  <li className="px-3 py-2 text-gray-500">No cases found — press Enter to create a new case</li>
                )}
                {!loadingCases && caseResults.map(c => (
                  <li key={c.id} onMouseDown={() => selectCase(c)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
                    <div className="font-medium">{c.caseTitle || '(No title)'}</div>
                    <div className="text-xs text-gray-400">{c.caseNumber ? `# ${c.caseNumber} • ` : ''}{c.partyName ? c.partyName : ''}</div>
                    <div className="text-xs text-gray-500">ID: {c.id}</div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* District input */}
      <div className="mt-4 relative">
        <label className="text-sm text-gray-600 flex items-center gap-2"><FaMapMarkerAlt /> District</label>
        <input
          ref={districtRef}
          value={district}
          onChange={(e) => { setDistrict(e.target.value); setShowDistrictList(true); }}
          onFocus={() => setShowDistrictList(true)}
          placeholder="Type or pick district"
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
        />

        {showDistrictList && district && (
          <ul className="absolute z-20 left-0 right-0 bg-white border mt-1 rounded-lg max-h-44 overflow-y-auto">
            {filteredDistricts.length === 0 && (
              <li className="px-3 py-2 text-gray-500">No match — press Enter to keep typed value</li>
            )}
            {filteredDistricts.map(d => (
              <li key={d} onMouseDown={() => selectDistrict(d)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer">{d}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Court input */}
      <div className="mt-4 relative">
        <label className="text-sm text-gray-600 flex items-center gap-2"><FaGavel /> Court Name</label>
        <input
          ref={courtRef}
          value={court}
          onChange={(e) => { setCourt(e.target.value); setShowCourtList(true); }}
          onFocus={() => setShowCourtList(true)}
          placeholder={district ? "Start typing court name (filtered by district)" : "Start typing court name"}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
        />

        {showCourtList && court && (
          <ul className="absolute z-20 left-0 right-0 bg-white border mt-1 rounded-lg max-h-44 overflow-y-auto">
            {filteredBuiltCourts.length === 0 && (
              <li className="px-3 py-2 text-gray-500">No suggestions — press Enter to use typed value</li>
            )}
            {filteredBuiltCourts.map((c, i) => (
              <li key={`${c}-${i}`} onMouseDown={() => selectCourt(c)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center">
                <div className="text-sm">{c}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* actions */}
      <div className="mt-5 flex gap-2 items-center">
        <button
          onClick={saveCourt}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 disabled:opacity-50"
        >
          <FaCheck /> {loading ? 'Saving...' : 'Save Court'}
        </button>

        <button
          onClick={() => {
            if (!district) return alert('Select district first');
            if (!court.trim()) return alert('Type court name');
            selectCourt(court.trim());
            saveCourt();
          }}
          className="flex items-center gap-2 px-3 py-2 border rounded-xl hover:bg-gray-50"
        >
          <FaPlus /> Quick Save
        </button>

        <button onClick={() => { setCourt(""); setDistrict(""); }} className="ml-auto text-sm text-gray-500 flex items-center gap-2">
          <FaTimes /> Clear
        </button>
      </div>

      <p className="mt-3 text-xs text-gray-500">Behavior: search cases by <strong>caseTitle</strong>, <strong>caseNumber</strong> or <strong>partyName</strong>. Type a new case title and press Enter to create. The component will update the selected or newly created case with the court info.</p>
    </motion.div>
  );
}
