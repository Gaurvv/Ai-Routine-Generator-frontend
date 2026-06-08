import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./Navbar";

function parseRoutineToTable(text) {
  const rows = [];
  const lines = text.split("\n").filter((l) => l.trim());
  for (const line of lines) {
    const pipeMatch = line.match(/^\|(.+)\|$/);
    if (pipeMatch) {
      const cells = pipeMatch[1].split("|").map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) continue;
      rows.push(cells);
      continue;
    }
    const timeMatch = line.match(
      /^[-*]?\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[-–to]+\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[:\-–]?\s*(.+)/i
    );
    if (timeMatch) {
      const rest = timeMatch[3].trim();
      const dashSplit = rest.split(/\s+[-–]\s+/);
      rows.push([
        `${timeMatch[1].trim()} – ${timeMatch[2].trim()}`,
        dashSplit[0] || rest,
        dashSplit[1] || "",
      ]);
      continue;
    }
    const boldMatch = line.match(/^\*{1,2}(.+?)\*{1,2}[:\s–-]+(.+)/);
    if (boldMatch) {
      rows.push(["", boldMatch[1].trim(), boldMatch[2].trim()]);
    }
  }
  return rows;
}

function categoryColor(name = "") {
  const n = name.toLowerCase();
  if (/sleep|rest|nap|bed/.test(n))                        return { bg: "#E6F1FB", text: "#0C447C", dot: "#185FA5" };
  if (/exercise|gym|workout|walk|run|yoga/.test(n))         return { bg: "#EAF3DE", text: "#27500A", dot: "#3B6D11" };
  if (/work|class|study|learn|read/.test(n))                return { bg: "#EEEDFE", text: "#3C3489", dot: "#534AB7" };
  if (/eat|breakfast|lunch|dinner|meal|snack|food/.test(n)) return { bg: "#FAEEDA", text: "#633806", dot: "#854F0B" };
  if (/break|relax|leisure|hobby|social/.test(n))           return { bg: "#E1F5EE", text: "#085041", dot: "#0F6E56" };
  return { bg: "#F1EFE8", text: "#444441", dot: "#888780" };
}

const LEGEND = [
  { label: "Sleep / Rest",    dot: "#185FA5" },
  { label: "Exercise",        dot: "#3B6D11" },
  { label: "Work / Study",    dot: "#534AB7" },
  { label: "Meals",           dot: "#854F0B" },
  { label: "Break / Leisure", dot: "#0F6E56" },
  { label: "Other",           dot: "#888780" },
];

function RoutineCard({ routine, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const rows = parseRoutineToTable(routine.ai_routine);
  let tableHeaders = [];
  let parsedRows = [];

  if (rows.length > 0) {
    const firstRow = rows[0];
    const looksLikeHeader = firstRow.some((c) =>
      /time|activity|task|duration|note|description/i.test(c)
    );
    if (looksLikeHeader) {
      tableHeaders = firstRow;
      parsedRows = rows.slice(1);
    } else {
      tableHeaders = ["Time", "Activity", "Notes"];
      parsedRows = rows;
    }
  }

  const formattedDate = new Date(routine.created_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(routine.id);
    setDeleting(false);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 sm:p-6 border-2 border-purple-200 shadow-sm">

      {/* Card header */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm sm:text-base">Generated Routine</p>
            <p className="text-xs text-gray-400">{formattedDate}</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 bg-white hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting ? (
            <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>

      {parsedRows.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
            {LEGEND.map(({ label, dot }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dot }} />
                {label}
              </span>
            ))}
          </div>
          <div className="bg-white rounded-xl overflow-hidden border border-purple-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[420px]">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-blue-600">
                  {tableHeaders.map((h, i) => (
                    <th key={i} className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, ri) => {
                  const activityCell = row[1] || row[0] || "";
                  const colors = categoryColor(activityCell);
                  return (
                    <tr key={ri} className={`border-b border-gray-100 last:border-0 ${ri % 2 === 0 ? "bg-white" : "bg-purple-50/30"} hover:bg-purple-50 transition-colors`}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 sm:px-4 py-3 align-middle">
                          {ci === 0 ? (
                            <span className="font-mono text-xs font-medium text-gray-500 whitespace-nowrap">{cell}</span>
                          ) : ci === 1 ? (
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colors.dot }} />
                              <span className="inline-block px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap" style={{ background: colors.bg, color: colors.text }}>
                                {cell}
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500 italic">{cell}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed break-words">
            {routine.ai_routine}
          </pre>
        </div>
      )}
    </div>
  );
}

const SavedRoutines = () => {
  const [user, setUser] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [loadingRoutines, setLoadingRoutines] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const navigate = useNavigate();

  const BLACKLIST_API = import.meta.env.VITE_BLACKLIST;
  const SAVED_ROUTINES_API = import.meta.env.VITE_SAVED_ROUTINES;

  // Auth: fetch user on mount
  useEffect(() => {
    const raw = localStorage.getItem("auth_token");
    if (!raw) { navigate("/login"); return; }

    let token = null;
    try { token = JSON.parse(raw); }
    catch { localStorage.removeItem("auth_token"); navigate("/login"); return; }

    if (!token?.access) { navigate("/login"); return; }

    fetch(import.meta.env.VITE_USERME, {
      headers: { Authorization: `Bearer ${token.access}` },
    })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => setUser(data))
      .catch(() => { localStorage.removeItem("auth_token"); navigate("/login"); });
  }, []);

  // Fetch routines from backend once user is loaded
  useEffect(() => {
    if (!user) return;
    const token = JSON.parse(localStorage.getItem("auth_token"));
    setLoadingRoutines(true);
    setFetchError("");
    fetch(SAVED_ROUTINES_API, {
      headers: { Authorization: `Bearer ${token.access}` },
    })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => setRoutines(data))
      .catch(() => setFetchError("Failed to load routines. Please refresh."))
      .finally(() => setLoadingRoutines(false));
  }, [user]);

  const logout = () => {
    const raw = localStorage.getItem("auth_token");
    localStorage.removeItem("auth_token");
    if (raw) {
      try {
        const token = JSON.parse(raw);
        fetch(BLACKLIST_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: token?.refresh }),
        }).catch((err) => console.error("Error blacklisting token:", err));
      } catch {}
    }
    navigate("/login");
  };

  const handleDelete = async (id) => {
    const token = JSON.parse(localStorage.getItem("auth_token"));
    try {
      const res = await fetch(`${SAVED_ROUTINES_API}${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token.access}` },
      });
      if (!res.ok) throw new Error();
      setRoutines((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("Failed to delete routine. Please try again.");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete all saved routines?")) return;
    const token = JSON.parse(localStorage.getItem("auth_token"));
    try {
      await Promise.all(
        routines.map((r) =>
          fetch(`${SAVED_ROUTINES_API}${r.id}/`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token.access}` },
          })
        )
      );
      setRoutines([]);
    } catch {
      alert("Failed to clear all routines. Please try again.");
    }
  };

  // Loading user
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <NavBar user={user} onLogout={logout} />

      <div className="min-h-screen bg-gray-100 p-3 sm:p-6">
        <div className="max-w-2xl mx-auto">

          {/* Page header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-5 sm:p-6 mb-6 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Saved Routines</h2>
                <p className="text-purple-100 text-sm">
                  {loadingRoutines
                    ? "Loading…"
                    : routines.length === 0
                    ? "No routines saved yet"
                    : `${routines.length} routine${routines.length > 1 ? "s" : ""} saved`}
                </p>
              </div>
              {routines.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-white/80 hover:text-white border border-white/30 hover:border-white/60 px-3 py-1.5 rounded-lg transition-all"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Error */}
          {fetchError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
              <p className="text-red-700 font-medium text-sm">{fetchError}</p>
            </div>
          )}

          {/* Loading routines spinner */}
          {loadingRoutines ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : routines.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-10 text-center border-2 border-dashed border-gray-200">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium mb-1">No saved routines yet</p>
              <p className="text-gray-400 text-sm">Generate a routine and click "Save Routine" to see it here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {routines.map((routine) => (
                <RoutineCard key={routine.id} routine={routine} onDelete={handleDelete} />
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default SavedRoutines;