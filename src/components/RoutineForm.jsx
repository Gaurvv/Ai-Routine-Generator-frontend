import { useState } from "react";
import axios from "axios";

export default function RoutineForm({ user }) {
  const [data, setData] = useState({
    wake_time: "",
    sleep_time: "",
    fixed_works: [],
    tasks: [],
  });

  const [aiRoutine, setAiRoutine] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [tableHeaders, setTableHeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");

  /* ── helpers ── */
  const addFixed = () =>
    setData({ ...data, fixed_works: [...data.fixed_works, { name: "", start_time: "", end_time: "" }] });

  const removeFixed = (i) =>
    setData({ ...data, fixed_works: data.fixed_works.filter((_, idx) => idx !== i) });

  const updateFixed = (i, key, val) => {
    const fws = [...data.fixed_works];
    fws[i] = { ...fws[i], [key]: val };
    setData({ ...data, fixed_works: fws });
  };

  const addTask = () =>
    setData({ ...data, tasks: [...data.tasks, { name: "", duration_hours: "", preferred_time: "Morning" }] });

  const removeTask = (i) =>
    setData({ ...data, tasks: data.tasks.filter((_, idx) => idx !== i) });

  const updateTask = (i, key, val) => {
    const tasks = [...data.tasks];
    tasks[i] = { ...tasks[i], [key]: val };
    setData({ ...data, tasks });
  };

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

  const handleSubmit = async () => {
    setError("");
    setSaved(false);
    setSaveError("");
    if (!data.wake_time || !data.sleep_time) {
      setError("Please set wake and sleep times");
      return;
    }
    setLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem("auth_token"));
      const response = await axios.post(
        import.meta.env.VITE_GENERATE_ROUTINE,
        data,
        { headers: { Authorization: `Bearer ${token.access}` } }
      );
      if (response.data.success) {
        const raw = response.data.ai_routine;
        setAiRoutine(raw);
        const rows = parseRoutineToTable(raw);
        if (rows.length > 0) {
          const firstRow = rows[0];
          const looksLikeHeader = firstRow.some((c) =>
            /time|activity|task|duration|note|description/i.test(c)
          );
          if (looksLikeHeader) {
            setTableHeaders(firstRow);
            setParsedRows(rows.slice(1));
          } else {
            setTableHeaders(["Time", "Activity", "Notes"]);
            setParsedRows(rows);
          }
        } else {
          setTableHeaders([]);
          setParsedRows([]);
        }
      } else {
        setError("Failed to generate routine. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error generating AI routine. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveError("");
    setSaving(true);
    try {
      const token = JSON.parse(localStorage.getItem("auth_token"));
      await axios.post(
        import.meta.env.VITE_SAVED_ROUTINES,
        { ai_routine: aiRoutine },
        { headers: { Authorization: `Bearer ${token.access}` } }
      );
      setSaved(true);
    } catch (err) {
      console.error("Failed to save routine:", err);
      setSaveError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
  const XIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-5 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">AI Daily Routine Generator</h2>
          <p className="text-purple-100 text-sm sm:text-base">Create your optimized daily schedule with AI assistance</p>
        </div>

        <div className="p-4 sm:p-6 space-y-6">

          {/* Sleep Schedule */}
          <section>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sleep Schedule
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { label: "Wake Time", key: "wake_time" },
                { label: "Sleep Time", key: "sleep_time" },
              ].map(({ label, key }) => (
                <div key={key} className="flex flex-col">
                  <label className="mb-1.5 font-medium text-gray-700 text-xs sm:text-sm">{label}</label>
                  <input
                    type="time"
                    value={data[key]}
                    onChange={(e) => setData({ ...data, [key]: e.target.value })}
                    className="border-2 border-gray-200 rounded-xl p-2.5 sm:p-3 text-sm focus:border-purple-500 focus:outline-none transition-colors w-full"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Fixed Schedule */}
          <section>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Fixed Schedule
              <span className="text-gray-400 font-normal text-xs sm:text-sm">(e.g. Work, Classes)</span>
            </h3>
            {data.fixed_works.length === 0 && (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-5 text-center mb-3">
                <p className="text-gray-400 text-sm">No fixed schedule added yet</p>
              </div>
            )}
            <div className="space-y-3 mb-3">
              {data.fixed_works.map((fw, i) => (
                <div key={i} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 sm:p-4 border border-blue-100">
                  <div className="flex gap-2 mb-2">
                    <input
                      placeholder="e.g., Work, Class"
                      value={fw.name}
                      onChange={(e) => updateFixed(i, "name", e.target.value)}
                      className="border-2 border-gray-200 rounded-lg p-2 flex-1 text-sm focus:border-blue-500 focus:outline-none min-w-0"
                    />
                    <button
                      onClick={() => removeFixed(i)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors shrink-0"
                    >
                      <XIcon />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Start</label>
                      <input
                        type="time"
                        value={fw.start_time}
                        onChange={(e) => updateFixed(i, "start_time", e.target.value)}
                        className="border-2 border-gray-200 rounded-lg p-2 text-sm w-full focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">End</label>
                      <input
                        type="time"
                        value={fw.end_time}
                        onChange={(e) => updateFixed(i, "end_time", e.target.value)}
                        className="border-2 border-gray-200 rounded-lg p-2 text-sm w-full focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addFixed}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
            >
              <PlusIcon />
              Add Fixed Schedule
            </button>
          </section>

          {/* Flexible Tasks */}
          <section>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Flexible Tasks
            </h3>
            {data.tasks.length === 0 && (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-5 text-center mb-3">
                <p className="text-gray-400 text-sm">No tasks added yet</p>
              </div>
            )}
            <div className="space-y-3 mb-3">
              {data.tasks.map((task, i) => (
                <div key={i} className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-3 sm:p-4 border border-green-100">
                  <div className="flex gap-2 mb-2">
                    <input
                      placeholder="e.g., Exercise, Study"
                      value={task.name}
                      onChange={(e) => updateTask(i, "name", e.target.value)}
                      className="border-2 border-gray-200 rounded-lg p-2 flex-1 text-sm focus:border-green-500 focus:outline-none min-w-0"
                    />
                    <button
                      onClick={() => removeTask(i)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors shrink-0"
                    >
                      <XIcon />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Duration (hrs)</label>
                      <input
                        placeholder="e.g. 1.5"
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="12"
                        value={task.duration_hours}
                        onChange={(e) => updateTask(i, "duration_hours", e.target.value)}
                        className="border-2 border-gray-200 rounded-lg p-2 text-sm w-full focus:border-green-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Preferred Time</label>
                      <select
                        value={task.preferred_time}
                        onChange={(e) => updateTask(i, "preferred_time", e.target.value)}
                        className="border-2 border-gray-200 rounded-lg p-2 text-sm w-full focus:border-green-500 focus:outline-none bg-white"
                      >
                        <option>Morning</option>
                        <option>Afternoon</option>
                        <option>Evening</option>
                        <option>Night</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addTask}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
            >
              <PlusIcon />
              Add Task
            </button>
          </section>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 font-medium text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3.5 sm:py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Generating Routine…</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Generate AI Routine</span>
              </>
            )}
          </button>

          {/* AI Routine Output */}
          {aiRoutine && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 sm:p-6 border-2 border-purple-200 shadow-inner">

              {/* Section header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-xl font-bold text-gray-800 flex-1">Your AI-Generated Routine</h3>
              </div>

              {/* Save button + error */}
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <div>
                  {saveError && (
                    <p className="text-xs text-red-500">{saveError}</p>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={saved || saving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm
                    ${saved
                      ? "bg-green-100 text-green-700 border border-green-300 cursor-default"
                      : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving…
                    </>
                  ) : saved ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Saved!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Save Routine
                    </>
                  )}
                </button>
              </div>

              {parsedRows.length > 0 ? (
                <>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
                    {LEGEND.map(({ label, dot }) => (
                      <span key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dot }} />
                        {label}
                      </span>
                    ))}
                  </div>

                  {/* Table */}
                  <div className="bg-white rounded-xl overflow-hidden border border-purple-100 shadow-sm overflow-x-auto -mx-1">
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
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed break-words">{aiRoutine}</pre>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}