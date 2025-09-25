// src/pages/Campaigns/components/CsvAudienceSection.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  fetchCsvSchema,
  downloadCsvSampleBlob,
  uploadCsvBatch,
  getBatchSample,
  validateBatch,
  suggestMappings,
  saveMappings,
  materialize,
} from "../api/csvApi";

/* ---------------- Utilities ---------------- */

function saveBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

const norm = s =>
  String(s || "")
    .toLowerCase()
    .replace(/[\s._-]+/g, "")
    .replace(/[^a-z0-9]/g, "");

const PHONE_ALIASES = ["phone", "mobile", "whatsapp", "number", "phonee164"];

// Aliases to help auto-map
const ALIASES = {
  // parameterN
  parameter1: ["param1", "body1"],
  parameter2: ["param2", "body2"],
  parameter3: ["param3", "body3"],
  parameter4: ["param4", "body4"],
  parameter5: ["param5", "body5"],
  // header text
  headerpara1: ["header1", "headerparam1"],
  headerpara2: ["header2", "headerparam2"],
  headerpara3: ["header3", "headerparam3"],
  // buttons
  buttonpara1: ["btn1", "button1", "url1", "buttonparam1"],
  buttonpara2: ["btn2", "button2", "url2", "buttonparam2"],
  buttonpara3: ["btn3", "button3", "url3", "buttonparam3"],
};

// Auto-pick CSV columns for expected keys.
function autoPick(headers, wants) {
  const map = {};
  const used = new Set();
  const H = headers.map(h => ({ raw: h, k: norm(h) }));

  // 1) exact (case-insensitive)
  for (const key of wants) {
    const hit = headers.find(h => norm(h) === norm(key));
    if (hit) {
      map[key] = hit;
      used.add(hit);
    }
  }

  // 2) aliases
  for (const key of wants) {
    if (map[key]) continue;
    const aliases = ALIASES[key] || [];
    const hit = H.find(
      h => aliases.some(a => h.k === norm(a)) && !used.has(h.raw)
    );
    if (hit) {
      map[key] = hit.raw;
      used.add(hit.raw);
    }
  }

  // 3) parameterN convenience (match "paramN" or "bodyN")
  for (const key of wants) {
    if (map[key]) continue;
    const m = key.match(/^parameter(\d+)$/i);
    if (!m) continue;
    const n = m[1];
    const hit = H.find(
      h => (h.k === `param${n}` || h.k === `body${n}`) && !used.has(h.raw)
    );
    if (hit) {
      map[key] = hit.raw;
      used.add(hit.raw);
    }
  }

  return map;
}

/* ---------------- Component ---------------- */

export default function CsvAudienceSection({ campaignId }) {
  const [loading, setLoading] = useState(true);
  const [schema, setSchema] = useState(null);

  const [batch, setBatch] = useState(null);
  const [sample, setSample] = useState(null);
  const [valReq, setValReq] = useState({
    normalizePhone: true,
    checkDuplicates: true,
  });
  const [valRes, setValRes] = useState(null);

  // {{n}} mapping UI (body placeholders)
  const [paramMappings, setParamMappings] = useState([]);
  // Explicit mapping for headerparaN / buttonparaN
  const [expectedKeys, setExpectedKeys] = useState([]); // EXACTLY as backend returns
  const [keyToColumn, setKeyToColumn] = useState({});

  const [phoneHeader, setPhoneHeader] = useState("");
  const [audienceName, setAudienceName] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `Audience ${yyyy}-${mm}-${dd}`;
  });

  const [dryPreview, setDryPreview] = useState(null);
  const [persisting, setPersisting] = useState(false);

  const [showMapping, setShowMapping] = useState(false);
  const topRef = useRef(null);

  // Load schema (columns come straight from backend)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const sc = await fetchCsvSchema(campaignId);
        if (!alive) return;
        setSchema(sc);

        // Columns exactly as BE will generate in CSV:
        // e.g. ["parameter1","headerpara1","buttonpara1"]
        const keys = Array.isArray(sc?.headers) ? sc.headers : [];
        setExpectedKeys(keys);

        // Setup legacy {{n}} slots based on placeholderCount for body values
        const N = Number(sc?.placeholderCount || 0);
        setParamMappings(
          Array.from({ length: N }, (_, i) => ({
            index: i + 1,
            sourceType: "csv",
            sourceName: "",
            constValue: "",
          }))
        );
      } catch {
        toast.error("Failed to load CSV schema.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [campaignId]);

  const csvHeaders = useMemo(
    () => sample?.headers ?? batch?.headerJson ?? schema?.headers ?? [],
    [schema, batch, sample]
  );

  const updateMapping = (idx, patch) =>
    setParamMappings(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });

  const handleDownloadSample = async () => {
    try {
      const blob = await downloadCsvSampleBlob(campaignId);
      saveBlob(blob, `campaign-${campaignId}-sample.csv`);
    } catch {
      toast.error("Could not download sample CSV.");
    }
  };

  const handleFile = async f => {
    if (!f) return;
    try {
      const up = await uploadCsvBatch(f, null);
      setBatch(up);
      toast.success("CSV uploaded.");

      const s = await getBatchSample(up?.batchId, 10);
      setSample(s);

      const hdrs = Array.isArray(s?.headers) ? s.headers : [];

      // Auto-pick phone column
      const lower = hdrs.map(h => String(h).toLowerCase());
      const guessIdx = lower.findIndex(h =>
        PHONE_ALIASES.some(k => h.includes(k))
      );
      setPhoneHeader(guessIdx >= 0 ? hdrs[guessIdx] : "");

      // Auto-map explicit keys (parameter/headerpara/buttonpara)
      const km = autoPick(hdrs, expectedKeys);
      setKeyToColumn(km);

      // Also seed the legacy {{n}} list for body placeholders
      setParamMappings(prev =>
        prev.map(p => {
          const key = `parameter${p.index}`;
          return km[key] ? { ...p, sourceName: km[key] } : p;
        })
      );

      // Optional server suggestions for {{n}}
      try {
        const sugg = await suggestMappings(campaignId, up?.batchId);
        if (Array.isArray(sugg?.items)) {
          setParamMappings(prev =>
            prev.map(p => {
              const m = sugg.items.find(x => x.index === p.index);
              return m ? { ...p, ...m } : p;
            })
          );
        }
      } catch {}
      setShowMapping(false);
    } catch (e) {
      toast.error(e?.message || "CSV upload failed.");
    }
  };

  const handleValidate = async () => {
    if (!batch?.batchId) return toast.warn("Upload a CSV first.");
    if (!phoneHeader) return toast.warn("Choose the phone column.");

    try {
      const req = {
        phoneHeader,
        requiredHeaders: [],
        normalizePhone: !!valReq.normalizePhone,
        checkDuplicates: !!valReq.checkDuplicates,
      };
      const res = await validateBatch(batch.batchId, req);
      setValRes(res);
      if (Array.isArray(res?.problems) && res.problems.length > 0) {
        toast.warn(`Validation found ${res.problems.length} issue(s).`);
      } else {
        toast.success("Validation passed.");
      }
    } catch {
      toast.error("Validation call failed.");
    }
  };

  // Build the mapping dictionary the backend expects.
  //  - "{{n}}" for body placeholders (legacy, required by BE)
  //  - "headerparaN"/"buttonparaN" -> CSV column names
  const buildMappingDict = () => {
    const dict = {};

    // Body placeholders -> {{n}}
    for (const m of paramMappings) {
      const key = `{{${m.index}}}`;
      if (m.sourceType === "csv") {
        dict[key] = m.sourceName || "";
      } else {
        dict[key] = `constant:${m.constValue ?? ""}`;
      }
    }

    // Header & buttons only
    for (const [k, v] of Object.entries(keyToColumn || {})) {
      if (!v) continue;
      if (/^parameter\d+$/i.test(k)) continue; // handled via {{n}}
      dict[k] = v;
    }

    return dict;
  };

  const handleDryRun = async () => {
    if (!batch?.batchId) return toast.warn("Upload a CSV first.");
    try {
      await saveMappings(campaignId, buildMappingDict());
      const body = {
        csvBatchId: batch.batchId,
        mappings: buildMappingDict(),
        phoneField: phoneHeader || undefined,
        normalizePhones: !!valReq.normalizePhone,
        deduplicate: !!valReq.checkDuplicates,
        persist: false,
      };
      const preview = await materialize(campaignId, body);
      setDryPreview(preview);
      toast.success("Dry-run ready.");
    } catch {
      toast.error("Dry-run failed.");
    }
  };

  const handlePersist = async () => {
    if (!batch?.batchId) return toast.warn("Upload a CSV first.");
    if (!audienceName?.trim()) return toast.warn("Enter an audience name.");
    setPersisting(true);
    try {
      await saveMappings(campaignId, buildMappingDict());
      const body = {
        csvBatchId: batch.batchId,
        mappings: buildMappingDict(),
        phoneField: phoneHeader || undefined,
        normalizePhones: !!valReq.normalizePhone,
        deduplicate: !!valReq.checkDuplicates,
        persist: true,
        audienceName: audienceName.trim(),
      };
      await materialize(campaignId, body);
      toast.success("Audience created and recipients materialized.");
    } catch {
      toast.error("Persist failed.");
    } finally {
      setPersisting(false);
    }
  };

  // Only count headerpara*/buttonpara* when showing mapping status UI
  const visibleKeys = useMemo(
    () => (expectedKeys || []).filter(k => !/^parameter\d+$/i.test(k)),
    [expectedKeys]
  );
  const mappingStatus = useMemo(() => {
    if (!visibleKeys.length) return { label: "No extra params", ok: true };
    const missing = visibleKeys.filter(k => !keyToColumn[k]);
    return missing.length
      ? { label: `${missing.length} missing`, ok: false }
      : { label: "All mapped", ok: true };
  }, [visibleKeys, keyToColumn]);

  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-4 text-sm text-gray-500">
        Loading CSV schema…
      </div>
    );
  }

  return (
    <section ref={topRef} className="rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-800">
        Audience via CSV
      </h2>

      {/* Audience name */}
      <div className="mb-3">
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
          placeholder="Audience name (required to persist)"
          value={audienceName}
          onChange={e => setAudienceName(e.target.value)}
        />
      </div>

      {/* Expected columns + actions */}
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <div className="text-gray-600">
          Expected columns:&nbsp;
          <code className="rounded bg-gray-100 px-1.5 py-0.5">
            {["phone", ...(schema?.headers || [])].join(", ")}
          </code>
        </div>
        <button
          type="button"
          onClick={handleDownloadSample}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          Download sample CSV
        </button>
        {/* Upload CSV (indigo outline) */}
        <div className="ml-auto">
          <input
            id="csv-file-input"
            type="file"
            accept=".csv"
            onChange={e => handleFile(e.target.files?.[0])}
            className="sr-only"
          />
          <label
            htmlFor="csv-file-input"
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {/* Cloud-upload icon */}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 16.5a4 4 0 0 0-1-7.9 5 5 0 0 0-9.8 1.2 3.5 3.5 0 0 0 .7 6.9h2" />
              <path d="M12 12v8" />
              <path d="m8.5 15.5 3.5-3.5 3.5 3.5" />
            </svg>
            Upload CSV
          </label>
        </div>
      </div>

      {/* Helper note */}
      <div className="mb-3 rounded-md border border-dashed border-gray-200 bg-gray-50 p-2 text-[11px] text-gray-600">
        We set any media URL once at <strong>campaign creation</strong> (not in
        CSV). Your CSV should contain <code>phone</code>, body values as{" "}
        <code>parameter1…N</code>, plus any <code>headerparaN</code> and{" "}
        <code>buttonparaN</code> columns if the template needs them.
      </div>

      {/* Phone + toggles and mapping */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border p-3">
          <h3 className="mb-2 text-xs font-semibold text-gray-700">
            Phone column
          </h3>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
            value={phoneHeader}
            onChange={e => setPhoneHeader(e.target.value)}
            disabled={!(csvHeaders ?? []).length}
          >
            <option value="">
              {(csvHeaders ?? []).length
                ? "-- Select column --"
                : "Upload a CSV first"}
            </option>
            {(csvHeaders ?? []).map(h => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>

          <div className="mt-3 flex items-center gap-4 text-xs text-gray-700">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={valReq.normalizePhone}
                onChange={e =>
                  setValReq(v => ({ ...v, normalizePhone: e.target.checked }))
                }
              />
              Normalize phone (E.164)
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={valReq.checkDuplicates}
                onChange={e =>
                  setValReq(v => ({ ...v, checkDuplicates: e.target.checked }))
                }
              />
              Deduplicate by phone
            </label>
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-700">
              Mapping & Validation
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                mappingStatus.ok
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {mappingStatus.label}
            </span>
          </div>

          <button
            type="button"
            className="mt-2 text-xs text-indigo-600 hover:underline"
            onClick={() => setShowMapping(s => !s)}
            disabled={!(csvHeaders ?? []).length}
          >
            {showMapping ? "Hide mapping" : "Edit mapping"}
          </button>

          {showMapping && (
            <div className="mt-3 space-y-2">
              {/* Only show non-body keys here (headerparaN / buttonparaN) */}
              {visibleKeys.length === 0 ? (
                <p className="text-xs text-gray-500">No extra parameters.</p>
              ) : (
                visibleKeys.map(k => (
                  <div
                    key={k}
                    className="grid grid-cols-[160px,1fr] items-center gap-2"
                  >
                    <div className="text-[11px] text-gray-500">{k}</div>
                    <select
                      className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
                      value={keyToColumn[k] || ""}
                      onChange={e =>
                        setKeyToColumn(m => ({ ...m, [k]: e.target.value }))
                      }
                      disabled={!(csvHeaders ?? []).length}
                    >
                      <option value="">
                        {(csvHeaders ?? []).length
                          ? "-- Select column --"
                          : "Upload CSV"}
                      </option>
                      {(csvHeaders ?? []).map(h => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))
              )}

              {/* Body placeholders ({{n}}) */}
              {paramMappings.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <div className="mb-2 text-xs font-semibold text-gray-700">
                    Body values ({"{{n}}"}) → CSV
                  </div>
                  <div className="space-y-2">
                    {paramMappings.map((m, i) => (
                      <div
                        key={m.index}
                        className="grid grid-cols-[80px,100px,1fr] items-center gap-2"
                      >
                        <div className="text-xs text-gray-500">{`parameter${m.index}`}</div>
                        <select
                          className="rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
                          value={m.sourceType}
                          onChange={e =>
                            updateMapping(i, { sourceType: e.target.value })
                          }
                        >
                          <option value="csv">CSV column</option>
                          <option value="const">Constant</option>
                        </select>

                        {m.sourceType === "csv" ? (
                          <select
                            className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
                            value={m.sourceName || ""}
                            onChange={e =>
                              updateMapping(i, { sourceName: e.target.value })
                            }
                            disabled={!(csvHeaders ?? []).length}
                          >
                            <option value="">
                              {(csvHeaders ?? []).length
                                ? "-- Select column --"
                                : "Upload CSV"}
                            </option>
                            {(csvHeaders ?? []).map(h => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
                            placeholder="Constant value"
                            value={m.constValue || ""}
                            onChange={e =>
                              updateMapping(i, { constValue: e.target.value })
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sample table */}
      <div className="mt-4 overflow-x-auto rounded-lg border">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              {(sample?.headers ?? csvHeaders ?? []).map(h => (
                <th key={h} className="px-3 py-2 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.isArray(sample?.rows) && sample.rows.length > 0 ? (
              sample.rows.map((row, idx) => (
                <tr key={idx} className="border-t">
                  {(sample?.headers ?? csvHeaders ?? []).map(h => (
                    <td key={h} className="px-3 py-1.5">
                      {row?.[h] ?? ""}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-3 py-2 text-gray-400"
                  colSpan={(csvHeaders ?? []).length || 1}
                >
                  No rows yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleValidate}
          disabled={!batch?.batchId}
          className="rounded-md bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Validate
        </button>
        <button
          type="button"
          onClick={handleDryRun}
          disabled={!batch?.batchId}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          (Preview) Dry-run materialize
        </button>
        <button
          type="button"
          onClick={handlePersist}
          disabled={!batch?.batchId || persisting || !audienceName?.trim()}
          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {persisting
            ? "Persisting…"
            : "Persist (create audience + recipients)"}
        </button>
      </div>

      {/* Validation result */}
      {valRes && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <div className="font-semibold">Validation</div>
          {Array.isArray(valRes.problems) && valRes.problems.length > 0 ? (
            <ul className="mt-1 list-disc pl-5">
              {valRes.problems.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          ) : (
            <div className="mt-1 text-green-700">No problems found.</div>
          )}
        </div>
      )}

      {/* Dry-run preview */}
      {dryPreview && (
        <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
          <div className="font-semibold">Dry-run preview</div>
          <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-[11px] text-gray-800">
            {JSON.stringify(dryPreview, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}

// // src/pages/Campaigns/components/CsvAudienceSection.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { toast } from "react-toastify";
// import {
//   fetchCsvSchema,
//   downloadCsvSampleBlob,
//   uploadCsvBatch,
//   getBatchSample,
//   validateBatch,
//   suggestMappings,
//   saveMappings,
//   materialize,
// } from "../api/csvApi";

// /* ---------------- Utilities ---------------- */

// function saveBlob(blob, filename) {
//   const url = window.URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   a.click();
//   window.URL.revokeObjectURL(url);
// }

// const norm = s =>
//   String(s || "")
//     .toLowerCase()
//     .replace(/[\s._-]+/g, "")
//     .replace(/[^a-z0-9]/g, "");

// const PHONE_ALIASES = ["phone", "mobile", "whatsapp", "number", "phonee164"];

// // Canonical keys we want to map in CSV (beyond {{n}})
// // 👇 Header media is campaign-level now, so ONLY button URL params stay here.
// const CANONICAL_KEYS = [
//   "button1.url_param",
//   "button2.url_param",
//   "button3.url_param",
// ];

// // Aliases for canonical keys
// const ALIASES = {
//   "button1.url_param": ["btn1", "button1", "url1"],
//   "button2.url_param": ["btn2", "button2", "url2"],
//   "button3.url_param": ["btn3", "button3", "url3"],
// };

// // Auto-pick CSV columns for expected canonical keys.
// function autoPick(headers, wants, fallbackGreedyBody = false) {
//   const map = {};
//   const used = new Set();
//   const H = headers.map(h => ({ raw: h, k: norm(h) }));

//   // 1) exact (case-insensitive)
//   for (const key of wants) {
//     const hit = headers.find(h => h.toLowerCase() === key.toLowerCase());
//     if (hit) {
//       map[key] = hit;
//       used.add(hit);
//     }
//   }

//   // 2) alias match
//   for (const key of wants) {
//     if (map[key]) continue;
//     const aliases = ALIASES[key] || [];
//     const hit = H.find(
//       h => aliases.some(a => h.k === norm(a)) && !used.has(h.raw)
//     );
//     if (hit) {
//       map[key] = hit.raw;
//       used.add(hit.raw);
//     }
//   }

//   // 3) “paramN” / “body.N” convenience for body.* only
//   for (const key of wants) {
//     if (map[key]) continue;
//     const m = key.match(/^body\.(\d+)$/);
//     if (!m) continue;
//     const n = m[1];
//     const hit = H.find(
//       h => (h.k === `param${n}` || h.k === `body${n}`) && !used.has(h.raw)
//     );
//     if (hit) {
//       map[key] = hit.raw;
//       used.add(hit.raw);
//     }
//   }

//   // 4) greedy fill for remaining body.* only
//   if (fallbackGreedyBody) {
//     const remaining = headers.filter(h => !used.has(h));
//     for (const key of wants) {
//       if (!map[key] && key.startsWith("body.")) {
//         const pick = remaining.shift();
//         if (pick) {
//           map[key] = pick;
//           used.add(pick);
//         }
//       }
//     }
//   }

//   return map;
// }

// /* ---------------- Component ---------------- */

// export default function CsvAudienceSection({ campaignId }) {
//   const [loading, setLoading] = useState(true);
//   const [schema, setSchema] = useState(null);

//   const [batch, setBatch] = useState(null); // { batchId, headerJson, ... }
//   const [sample, setSample] = useState(null); // { headers, rows }
//   const [valReq, setValReq] = useState({
//     normalizePhone: true,
//     checkDuplicates: true,
//   });
//   const [valRes, setValRes] = useState(null);

//   // Legacy {{n}} param UI (kept for now)
//   const [paramMappings, setParamMappings] = useState([]);
//   // New: canonical key -> CSV column mapping (buttons only)
//   const [expectedKeys, setExpectedKeys] = useState([]); // ['body.1', …, 'button1.url_param', …]
//   const [keyToColumn, setKeyToColumn] = useState({});

//   const [phoneHeader, setPhoneHeader] = useState("");
//   const [audienceName, setAudienceName] = useState(() => {
//     const d = new Date();
//     const yyyy = d.getFullYear();
//     const mm = String(d.getMonth() + 1).padStart(2, "0");
//     const dd = String(d.getDate()).padStart(2, "0");
//     return `Audience ${yyyy}-${mm}-${dd}`;
//   });

//   const [dryPreview, setDryPreview] = useState(null);
//   const [persisting, setPersisting] = useState(false);

//   // Collapsible UX
//   const [showMapping, setShowMapping] = useState(false);

//   const topRef = useRef(null);

//   // Load schema and prime expected keys / {{n}} slots
//   useEffect(() => {
//     let alive = true;
//     (async () => {
//       try {
//         setLoading(true);
//         const sc = await fetchCsvSchema(campaignId);
//         if (!alive) return;
//         setSchema(sc);

//         // 1) Build expected keys from placeholderCount + any canonical keys present in schema.headers
//         const N = Number(sc?.placeholderCount || 0);
//         const bodyKeys = Array.from({ length: N }, (_, i) => `body.${i + 1}`);

//         const hdrs = Array.isArray(sc?.headers) ? sc.headers : [];
//         const extraKeys = CANONICAL_KEYS.filter(k =>
//           hdrs.some(h => h.toLowerCase() === k.toLowerCase())
//         );

//         const keys = [...bodyKeys, ...extraKeys];
//         setExpectedKeys(keys);

//         // 2) Init legacy {{n}} mapping slots
//         setParamMappings(
//           Array.from({ length: N }, (_, i) => ({
//             index: i + 1,
//             sourceType: "csv",
//             sourceName: "",
//             constValue: "",
//           }))
//         );
//       } catch {
//         toast.error("Failed to load CSV schema.");
//       } finally {
//         if (alive) setLoading(false);
//       }
//     })();
//     return () => {
//       alive = false;
//     };
//   }, [campaignId]);

//   // Available headers from sample/batch/schema
//   const csvHeaders = useMemo(
//     () => sample?.headers ?? batch?.headerJson ?? schema?.headers ?? [],
//     [schema, batch, sample]
//   );

//   // Update a single {{n}} mapping slot
//   const updateMapping = (idx, patch) =>
//     setParamMappings(prev => {
//       const next = [...prev];
//       next[idx] = { ...next[idx], ...patch };
//       return next;
//     });

//   const handleDownloadSample = async () => {
//     try {
//       const blob = await downloadCsvSampleBlob(campaignId);
//       saveBlob(blob, `campaign-${campaignId}-sample.csv`);
//     } catch {
//       toast.error("Could not download sample CSV.");
//     }
//   };

//   const handleFile = async f => {
//     if (!f) return;
//     try {
//       const up = await uploadCsvBatch(f, null);
//       setBatch(up);
//       toast.success("CSV uploaded.");

//       const s = await getBatchSample(up?.batchId, 10);
//       setSample(s);

//       const hdrs = Array.isArray(s?.headers) ? s.headers : [];

//       // Auto-pick phone column
//       const lower = hdrs.map(h => String(h).toLowerCase());
//       const guessIdx = lower.findIndex(h =>
//         PHONE_ALIASES.some(k => h.includes(k))
//       );
//       setPhoneHeader(guessIdx >= 0 ? hdrs[guessIdx] : "");

//       // Auto-map canonical keys (body + buttons)
//       const km = autoPick(hdrs, expectedKeys, /*fallbackGreedyBody*/ true);
//       setKeyToColumn(km);

//       // Also seed the legacy {{n}} list so current backend keeps working
//       setParamMappings(prev =>
//         prev.map(p => {
//           const key = `body.${p.index}`;
//           return km[key] ? { ...p, sourceName: km[key] } : p;
//         })
//       );

//       // Try server suggestions (optional; reconciled over auto map)
//       try {
//         const sugg = await suggestMappings(campaignId, up?.batchId);
//         if (Array.isArray(sugg?.items)) {
//           // Expect items like { index: 1, sourceType: "csv"|"const", sourceName, constValue }
//           setParamMappings(prev =>
//             prev.map(p => {
//               const m = sugg.items.find(x => x.index === p.index);
//               return m ? { ...p, ...m } : p;
//             })
//           );
//         }
//       } catch {
//         /* no-op */
//       }

//       // Keep UI minimal by default
//       setShowMapping(false);
//     } catch (e) {
//       toast.error(e?.message || "CSV upload failed.");
//     }
//   };

//   const handleValidate = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");
//     if (!phoneHeader) return toast.warn("Choose the phone column.");

//     try {
//       const req = {
//         phoneHeader,
//         requiredHeaders: [], // params may be constants
//         normalizePhone: !!valReq.normalizePhone,
//         checkDuplicates: !!valReq.checkDuplicates,
//       };
//       const res = await validateBatch(batch.batchId, req);
//       setValRes(res);
//       if (Array.isArray(res?.problems) && res.problems.length > 0) {
//         toast.warn(`Validation found ${res.problems.length} issue(s).`);
//       } else {
//         toast.success("Validation passed.");
//       }
//     } catch {
//       toast.error("Validation call failed.");
//     }
//   };

//   // Build the mapping dictionary the backend expects.
//   // Keeps compatibility with your existing backend:
//   // - "{{n}}" => "CSV_COLUMN" | "constant:VALUE"
//   // - canonical keys (button*.url_param) => "CSV_COLUMN"
//   const buildMappingDict = () => {
//     const dict = {};

//     // Legacy body placeholders
//     for (const m of paramMappings) {
//       const key = `{{${m.index}}}`;
//       if (m.sourceType === "csv") {
//         dict[key] = m.sourceName || "";
//       } else {
//         dict[key] = `constant:${m.constValue ?? ""}`;
//       }
//     }

//     // Canonical keys passthrough (buttons only)
//     for (const [k, v] of Object.entries(keyToColumn || {})) {
//       if (!v) continue;
//       dict[k] = v; // column name
//     }

//     return dict;
//   };

//   const handleDryRun = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");

//     try {
//       await saveMappings(campaignId, buildMappingDict()); // optional persistence

//       const body = {
//         csvBatchId: batch.batchId,
//         mappings: buildMappingDict(),
//         phoneField: phoneHeader || undefined,
//         normalizePhones: !!valReq.normalizePhone,
//         deduplicate: !!valReq.checkDuplicates,
//         persist: false, // preview only
//         audienceName: undefined,
//       };

//       const preview = await materialize(campaignId, body);
//       setDryPreview(preview);
//       toast.success("Dry-run ready.");
//     } catch {
//       toast.error("Dry-run failed.");
//     }
//   };

//   const handlePersist = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");
//     if (!audienceName?.trim()) return toast.warn("Enter an audience name.");

//     setPersisting(true);
//     try {
//       await saveMappings(campaignId, buildMappingDict());

//       const body = {
//         csvBatchId: batch.batchId,
//         mappings: buildMappingDict(),
//         phoneField: phoneHeader || undefined,
//         normalizePhones: !!valReq.normalizePhone,
//         deduplicate: !!valReq.checkDuplicates,
//         persist: true,
//         audienceName: audienceName.trim(),
//       };

//       await materialize(campaignId, body);
//       toast.success("Audience created and recipients materialized.");
//     } catch {
//       toast.error("Persist failed.");
//     } finally {
//       setPersisting(false);
//     }
//   };

//   // Mapping status chip (for the collapsed panel)
//   const mappingStatus = useMemo(() => {
//     if (!expectedKeys?.length) return { label: "No params", ok: true };
//     const missing = expectedKeys.filter(k => !keyToColumn[k]);
//     return missing.length
//       ? { label: `${missing.length} missing`, ok: false }
//       : { label: "All mapped", ok: true };
//   }, [expectedKeys, keyToColumn]);

//   if (loading) {
//     return (
//       <div className="rounded-lg border bg-white p-4 text-sm text-gray-500">
//         Loading CSV schema…
//       </div>
//     );
//   }

//   return (
//     <section ref={topRef} className="rounded-xl border bg-white p-4 shadow-sm">
//       <h2 className="mb-3 text-sm font-semibold text-gray-800">
//         Audience via CSV
//       </h2>

//       {/* Audience name */}
//       <div className="mb-3">
//         <input
//           className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
//           placeholder="Audience name (required to persist)"
//           value={audienceName}
//           onChange={e => setAudienceName(e.target.value)}
//         />
//       </div>

//       {/* Header row: expected columns + actions */}
//       <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
//         <div className="text-gray-600">
//           Expected columns:&nbsp;
//           <code className="rounded bg-gray-100 px-1.5 py-0.5">
//             {Array.isArray(schema?.headers) ? schema.headers.join(", ") : "—"}
//           </code>
//         </div>
//         <button
//           type="button"
//           onClick={handleDownloadSample}
//           className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
//         >
//           Download sample CSV
//         </button>
//         <label className="ml-auto cursor-pointer text-indigo-600 hover:underline">
//           Upload CSV
//           <input
//             type="file"
//             accept=".csv"
//             onChange={e => handleFile(e.target.files?.[0])}
//             className="hidden"
//           />
//         </label>
//       </div>

//       {/* Helper note: header media is set at Campaign creation */}
//       <div className="mb-3 rounded-md border border-dashed border-gray-200 bg-gray-50 p-2 text-[11px] text-gray-600">
//         Header media URL (image/video/document) is configured once on the{" "}
//         <strong>Campaign</strong>. CSV should include only <code>phone</code>,
//         body placeholders (<code>{`{{n}}`}</code> → columns <code>body.n</code>)
//         and any dynamic button URL params (<code>button1.url_param</code>,{" "}
//         <code>button2.url_param</code>, <code>button3.url_param</code>).
//       </div>

//       {/* Phone + toggles and collapsible mapping */}
//       <div className="grid gap-3 md:grid-cols-2">
//         {/* Phone + toggles */}
//         <div className="rounded-lg border p-3">
//           <h3 className="mb-2 text-xs font-semibold text-gray-700">
//             Phone column
//           </h3>
//           <select
//             className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
//             value={phoneHeader}
//             onChange={e => setPhoneHeader(e.target.value)}
//             disabled={!(csvHeaders ?? []).length}
//           >
//             <option value="">
//               {(csvHeaders ?? []).length
//                 ? "-- Select column --"
//                 : "Upload a CSV first"}
//             </option>
//             {(csvHeaders ?? []).map(h => (
//               <option key={h} value={h}>
//                 {h}
//               </option>
//             ))}
//           </select>

//           <div className="mt-3 flex items-center gap-4 text-xs text-gray-700">
//             <label className="inline-flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={valReq.normalizePhone}
//                 onChange={e =>
//                   setValReq(v => ({ ...v, normalizePhone: e.target.checked }))
//                 }
//               />
//               Normalize phone (E.164)
//             </label>
//             <label className="inline-flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={valReq.checkDuplicates}
//                 onChange={e =>
//                   setValReq(v => ({ ...v, checkDuplicates: e.target.checked }))
//                 }
//               />
//               Deduplicate by phone
//             </label>
//           </div>
//         </div>

//         {/* Collapsible mapping & validation */}
//         <div className="rounded-lg border p-3">
//           <div className="flex items-center justify-between">
//             <h3 className="text-xs font-semibold text-gray-700">
//               Mapping & Validation
//             </h3>
//             <span
//               className={`rounded-full px-2 py-0.5 text-[11px] ${
//                 mappingStatus.ok
//                   ? "bg-emerald-100 text-emerald-700"
//                   : "bg-amber-100 text-amber-700"
//               }`}
//             >
//               {mappingStatus.label}
//             </span>
//           </div>

//           <button
//             type="button"
//             className="mt-2 text-xs text-indigo-600 hover:underline"
//             onClick={() => setShowMapping(s => !s)}
//             disabled={!(csvHeaders ?? []).length}
//           >
//             {showMapping ? "Hide mapping" : "Edit mapping"}
//           </button>

//           {showMapping && (
//             <div className="mt-3 space-y-2">
//               {/* Canonical keys (buttons) + body.* */}
//               {expectedKeys.length === 0 ? (
//                 <p className="text-xs text-gray-500">No parameters required.</p>
//               ) : (
//                 expectedKeys.map(k => (
//                   <div
//                     key={k}
//                     className="grid grid-cols-[160px,1fr] items-center gap-2"
//                   >
//                     <div className="text-[11px] text-gray-500">{k}</div>
//                     <select
//                       className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                       value={keyToColumn[k] || ""}
//                       onChange={e =>
//                         setKeyToColumn(m => ({ ...m, [k]: e.target.value }))
//                       }
//                       disabled={!(csvHeaders ?? []).length}
//                     >
//                       <option value="">
//                         {(csvHeaders ?? []).length
//                           ? "-- Select column --"
//                           : "Upload CSV"}
//                       </option>
//                       {(csvHeaders ?? []).map(h => (
//                         <option key={h} value={h}>
//                           {h}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 ))
//               )}

//               {/* Legacy {{n}} UI (kept for now) */}
//               {paramMappings.length > 0 && (
//                 <div className="mt-4 border-t pt-3">
//                   <div className="mb-2 text-xs font-semibold text-gray-700">
//                     Body placeholders (legacy)
//                   </div>
//                   <div className="space-y-2">
//                     {paramMappings.map((m, i) => (
//                       <div
//                         key={m.index}
//                         className="grid grid-cols-[80px,100px,1fr] items-center gap-2"
//                       >
//                         <div className="text-xs text-gray-500">{`{{${m.index}}}`}</div>
//                         <select
//                           className="rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                           value={m.sourceType}
//                           onChange={e =>
//                             updateMapping(i, { sourceType: e.target.value })
//                           }
//                         >
//                           <option value="csv">CSV column</option>
//                           <option value="const">Constant</option>
//                         </select>

//                         {m.sourceType === "csv" ? (
//                           <select
//                             className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                             value={m.sourceName || ""}
//                             onChange={e =>
//                               updateMapping(i, { sourceName: e.target.value })
//                             }
//                             disabled={!(csvHeaders ?? []).length}
//                           >
//                             <option value="">
//                               {(csvHeaders ?? []).length
//                                 ? "-- Select column --"
//                                 : "Upload CSV"}
//                             </option>
//                             {(csvHeaders ?? []).map(h => (
//                               <option key={h} value={h}>
//                                 {h}
//                               </option>
//                             ))}
//                           </select>
//                         ) : (
//                           <input
//                             className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                             placeholder="Constant value"
//                             value={m.constValue || ""}
//                             onChange={e =>
//                               updateMapping(i, { constValue: e.target.value })
//                             }
//                           />
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Sample table */}
//       <div className="mt-4 overflow-x-auto rounded-lg border">
//         <table className="min-w-full text-xs">
//           <thead className="bg-gray-100 text-gray-700">
//             <tr>
//               {(sample?.headers ?? csvHeaders ?? []).map(h => (
//                 <th key={h} className="px-3 py-2 text-left">
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {Array.isArray(sample?.rows) && sample.rows.length > 0 ? (
//               sample.rows.map((row, idx) => (
//                 <tr key={idx} className="border-t">
//                   {(sample?.headers ?? csvHeaders ?? []).map(h => (
//                     <td key={h} className="px-3 py-1.5">
//                       {row?.[h] ?? ""}
//                     </td>
//                   ))}
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td
//                   className="px-3 py-2 text-gray-400"
//                   colSpan={(csvHeaders ?? []).length || 1}
//                 >
//                   No rows yet
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Actions */}
//       <div className="mt-4 flex flex-wrap items-center gap-2">
//         <button
//           type="button"
//           onClick={handleValidate}
//           disabled={!batch?.batchId}
//           className="rounded-md bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
//         >
//           Validate
//         </button>
//         <button
//           type="button"
//           onClick={handleDryRun}
//           disabled={!batch?.batchId}
//           className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
//         >
//           (Preview) Dry-run materialize
//         </button>
//         <button
//           type="button"
//           onClick={handlePersist}
//           disabled={!batch?.batchId || persisting || !audienceName?.trim()}
//           className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
//         >
//           {persisting
//             ? "Persisting…"
//             : "Persist (create audience + recipients)"}
//         </button>
//       </div>

//       {/* Validation result */}
//       {valRes && (
//         <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
//           <div className="font-semibold">Validation</div>
//           {Array.isArray(valRes.problems) && valRes.problems.length > 0 ? (
//             <ul className="mt-1 list-disc pl-5">
//               {valRes.problems.map((p, i) => (
//                 <li key={i}>{p}</li>
//               ))}
//             </ul>
//           ) : (
//             <div className="mt-1 text-green-700">No problems found.</div>
//           )}
//         </div>
//       )}

//       {/* Dry-run preview */}
//       {dryPreview && (
//         <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
//           <div className="font-semibold">Dry-run preview</div>
//           <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-[11px] text-gray-800">
//             {JSON.stringify(dryPreview, null, 2)}
//           </pre>
//         </div>
//       )}
//     </section>
//   );
// }

// // src/pages/Campaigns/components/CsvAudienceSection.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { toast } from "react-toastify";
// import {
//   fetchCsvSchema,
//   downloadCsvSampleBlob,
//   uploadCsvBatch,
//   getBatchSample,
//   validateBatch,
//   suggestMappings,
//   saveMappings,
//   materialize,
// } from "../api/csvApi";

// /* ---------------- Utilities ---------------- */

// function saveBlob(blob, filename) {
//   const url = window.URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   a.click();
//   window.URL.revokeObjectURL(url);
// }

// const norm = s =>
//   String(s || "")
//     .toLowerCase()
//     .replace(/[\s._-]+/g, "")
//     .replace(/[^a-z0-9]/g, "");

// const PHONE_ALIASES = ["phone", "mobile", "whatsapp", "number", "phonee164"];

// /**
//  * ONLY keep aliases for dynamic URL buttons.
//  * Media header URLs are CONSTANT (single field), so no header.*_url aliases here.
//  */
// const ALIASES = {
//   "button1.url_param": ["btn1", "button1", "url1"],
//   "button2.url_param": ["btn2", "button2", "url2"],
//   "button3.url_param": ["btn3", "button3", "url3"],
// };

// // Auto-pick CSV columns for expected keys (body.*, header.* (text), button*.url_param)
// function autoPick(headers, wants, fallbackGreedyBody = false) {
//   const map = {};
//   const used = new Set();
//   const H = headers.map(h => ({ raw: h, k: norm(h) }));

//   // 1) exact (case-insensitive)
//   for (const key of wants) {
//     const hit = headers.find(h => h.toLowerCase() === key.toLowerCase());
//     if (hit) {
//       map[key] = hit;
//       used.add(hit);
//     }
//   }

//   // 2) alias match (only for button*.url_param)
//   for (const key of wants) {
//     if (map[key]) continue;
//     const aliases = ALIASES[key] || [];
//     const hit = H.find(
//       h => aliases.some(a => h.k === norm(a)) && !used.has(h.raw)
//     );
//     if (hit) {
//       map[key] = hit.raw;
//       used.add(hit.raw);
//     }
//   }

//   // 3) “paramN” / “bodyN” convenience for body.*
//   for (const key of wants) {
//     if (map[key]) continue;
//     const m = key.match(/^body\.(\d+)$/);
//     if (!m) continue;
//     const n = m[1];
//     const hit = H.find(
//       h => (h.k === `param${n}` || h.k === `body${n}`) && !used.has(h.raw)
//     );
//     if (hit) {
//       map[key] = hit.raw;
//       used.add(hit.raw);
//     }
//   }

//   // 4) greedy fill for remaining body.* only
//   if (fallbackGreedyBody) {
//     const remaining = headers.filter(h => !used.has(h));
//     for (const key of wants) {
//       if (!map[key] && key.startsWith("body.")) {
//         const pick = remaining.shift();
//         if (pick) {
//           map[key] = pick;
//           used.add(pick);
//         }
//       }
//     }
//   }

//   return map;
// }

// /* ---------------- Component ---------------- */

// export default function CsvAudienceSection({ campaignId }) {
//   const [loading, setLoading] = useState(true);

//   // server schema
//   const [schema, setSchema] = useState(null); // { headers:[], placeholderCount, header:{type,needsUrl} }

//   // batch + preview
//   const [batch, setBatch] = useState(null); // { batchId, headerJson, ... }
//   const [sample, setSample] = useState(null); // { headers, rows }

//   // phone & validation
//   const [valReq, setValReq] = useState({
//     normalizePhone: true,
//     checkDuplicates: true,
//   });
//   const [valRes, setValRes] = useState(null);
//   const [phoneHeader, setPhoneHeader] = useState("");

//   // legacy {{n}} mapping for BODY only (count = schema.placeholderCount)
//   const [paramMappings, setParamMappings] = useState([]);

//   // dynamic per-row mapping for keys in schema.headers
//   const [expectedKeys, setExpectedKeys] = useState([]); // exactly schema.headers from backend
//   const [keyToColumn, setKeyToColumn] = useState({});

//   // single constant header media URL (only when schema.header.needsUrl === true)
//   const [headerMediaUrl, setHeaderMediaUrl] = useState("");
//   const [headerMediaError, setHeaderMediaError] = useState("");

//   // audience persist
//   const [audienceName, setAudienceName] = useState(() => {
//     const d = new Date();
//     const yyyy = d.getFullYear();
//     const mm = String(d.getMonth() + 1).padStart(2, "0");
//     const dd = String(d.getDate()).padStart(2, "0");
//     return `Audience ${yyyy}-${mm}-${dd}`;
//   });
//   const [dryPreview, setDryPreview] = useState(null);
//   const [persisting, setPersisting] = useState(false);

//   // Collapsible UX
//   const [showMapping, setShowMapping] = useState(false);

//   const topRef = useRef(null);

//   /* ----------- helpers ----------- */

//   const csvHeaders = useMemo(
//     () => sample?.headers ?? batch?.headerJson ?? schema?.headers ?? [],
//     [schema, batch, sample]
//   );

//   const updateMapping = (idx, patch) =>
//     setParamMappings(prev => {
//       const next = [...prev];
//       next[idx] = { ...next[idx], ...patch };
//       return next;
//     });

//   // Strict-ish URL validation for header media by type
//   function validateHeaderUrl(url, type) {
//     if (!schema?.header?.needsUrl) return "";
//     if (!url?.trim()) return "Required";
//     try {
//       // just to ensure it's a URL
//       const u = new URL(url);
//       const path = (u.pathname || "").toLowerCase();

//       switch (type) {
//         case "video":
//           if (!path.endsWith(".mp4")) return "Video URL must end with .mp4";
//           break;
//         case "document":
//           // optional: restrict to pdf; relax if you allow general docs
//           if (!path.endsWith(".pdf")) return "Document URL must be a .pdf";
//           break;
//         case "image":
//           // common image extensions
//           if (
//             !(
//               path.endsWith(".jpg") ||
//               path.endsWith(".jpeg") ||
//               path.endsWith(".png") ||
//               path.endsWith(".webp")
//             )
//           ) {
//             return "Image URL should be .jpg/.jpeg/.png/.webp";
//           }
//           break;
//         default:
//           break;
//       }
//       return "";
//     } catch {
//       return "Invalid URL";
//     }
//   }

//   /* ----------- effects ----------- */

//   // Load schema and prime mapping state
//   useEffect(() => {
//     let alive = true;
//     (async () => {
//       try {
//         setLoading(true);
//         const sc = await fetchCsvSchema(campaignId);
//         if (!alive) return;

//         // sc = { headers, placeholderCount, header: { type, needsUrl } }
//         setSchema(sc);

//         // expected per-row keys are EXACTLY what backend returned
//         setExpectedKeys(Array.isArray(sc?.headers) ? sc.headers : []);

//         // init {{n}} slots only for BODY placeholders
//         const N = Number(sc?.placeholderCount || 0);
//         setParamMappings(
//           Array.from({ length: N }, (_, i) => ({
//             index: i + 1,
//             sourceType: "csv",
//             sourceName: "",
//             constValue: "",
//           }))
//         );

//         // reset header media URL field
//         setHeaderMediaUrl("");
//         setHeaderMediaError("");
//       } catch {
//         toast.error("Failed to load CSV schema.");
//       } finally {
//         if (alive) setLoading(false);
//       }
//     })();
//     return () => {
//       alive = false;
//     };
//   }, [campaignId]);

//   /* ----------- handlers ----------- */

//   const handleDownloadSample = async () => {
//     try {
//       const blob = await downloadCsvSampleBlob(campaignId);
//       saveBlob(blob, `campaign-${campaignId}-sample.csv`);
//     } catch {
//       toast.error("Could not download sample CSV.");
//     }
//   };

//   const handleFile = async f => {
//     if (!f) return;
//     try {
//       const up = await uploadCsvBatch(f, null);
//       setBatch(up);
//       toast.success("CSV uploaded.");

//       const s = await getBatchSample(up?.batchId, 10);
//       setSample(s);

//       const hdrs = Array.isArray(s?.headers) ? s.headers : [];

//       // Auto-pick phone column
//       const lower = hdrs.map(h => String(h).toLowerCase());
//       const guessIdx = lower.findIndex(h =>
//         PHONE_ALIASES.some(k => h.includes(k))
//       );
//       setPhoneHeader(guessIdx >= 0 ? hdrs[guessIdx] : "");

//       // Auto-map keys for body/header(text)/buttons
//       const km = autoPick(hdrs, expectedKeys, /*fallbackGreedyBody*/ true);
//       setKeyToColumn(km);

//       // Seed legacy {{n}} from auto pick (BODY only)
//       setParamMappings(prev =>
//         prev.map(p => {
//           const key = `body.${p.index}`;
//           return km[key] ? { ...p, sourceName: km[key] } : p;
//         })
//       );

//       // Try server suggestions (optional)
//       try {
//         const sugg = await suggestMappings(campaignId, up?.batchId);
//         if (Array.isArray(sugg?.items)) {
//           setParamMappings(prev =>
//             prev.map(p => {
//               const m = sugg.items.find(x => x.index === p.index);
//               return m ? { ...p, ...m } : p;
//             })
//           );
//         }
//       } catch {
//         /* no-op */
//       }

//       setShowMapping(false);
//     } catch (e) {
//       toast.error(e?.message || "CSV upload failed.");
//     }
//   };

//   const handleValidate = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");
//     if (!phoneHeader) return toast.warn("Choose the phone column.");

//     // header media URL guard (only when required)
//     if (schema?.header?.needsUrl) {
//       const err = validateHeaderUrl(headerMediaUrl, schema?.header?.type);
//       setHeaderMediaError(err);
//       if (err) return toast.warn(`Header media URL: ${err}`);
//     }

//     try {
//       const req = {
//         phoneHeader,
//         requiredHeaders: [], // params may be constants
//         normalizePhone: !!valReq.normalizePhone,
//         checkDuplicates: !!valReq.checkDuplicates,
//       };
//       const res = await validateBatch(batch.batchId, req);
//       setValRes(res);
//       if (Array.isArray(res?.problems) && res.problems.length > 0) {
//         toast.warn(`Validation found ${res.problems.length} issue(s).`);
//       } else {
//         toast.success("Validation passed.");
//       }
//     } catch {
//       toast.error("Validation call failed.");
//     }
//   };

//   // Build the mapping dictionary the backend expects.
//   // - "{{n}}" => "CSV_COLUMN" | "constant:VALUE"
//   // - keys from expectedKeys (body.*, header.* (text), button*.url_param) => "CSV_COLUMN"
//   const buildMappingDict = () => {
//     const dict = {};

//     // BODY placeholders → legacy mapping
//     for (const m of paramMappings) {
//       const key = `{{${m.index}}}`;
//       if (m.sourceType === "csv") {
//         dict[key] = m.sourceName || "";
//       } else {
//         dict[key] = `constant:${m.constValue ?? ""}`;
//       }
//     }

//     // All other expected keys (header.* (text), button*.url_param)
//     for (const [k, v] of Object.entries(keyToColumn || {})) {
//       if (!v) continue;
//       dict[k] = v; // column name
//     }

//     return dict;
//   };

//   const handleDryRun = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");

//     // header media URL guard (only when required)
//     if (schema?.header?.needsUrl) {
//       const err = validateHeaderUrl(headerMediaUrl, schema?.header?.type);
//       setHeaderMediaError(err);
//       if (err) return toast.warn(`Header media URL: ${err}`);
//     }

//     try {
//       await saveMappings(campaignId, buildMappingDict()); // optional persistence

//       const body = {
//         csvBatchId: batch.batchId,
//         mappings: buildMappingDict(),
//         phoneField: phoneHeader || undefined,
//         normalizePhones: !!valReq.normalizePhone,
//         deduplicate: !!valReq.checkDuplicates,
//         persist: false, // preview only
//         audienceName: undefined,

//         // NEW: single constant media for all recipients (backend will read this)
//         header: schema?.header?.needsUrl
//           ? { type: schema?.header?.type, mediaUrl: headerMediaUrl.trim() }
//           : { type: schema?.header?.type, mediaUrl: null },
//       };

//       const preview = await materialize(campaignId, body);
//       setDryPreview(preview);
//       toast.success("Dry-run ready.");
//     } catch (e) {
//       toast.error(e?.message || "Dry-run failed.");
//     }
//   };

//   const handlePersist = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");
//     if (!audienceName?.trim()) return toast.warn("Enter an audience name.");

//     // header media URL guard (only when required)
//     if (schema?.header?.needsUrl) {
//       const err = validateHeaderUrl(headerMediaUrl, schema?.header?.type);
//       setHeaderMediaError(err);
//       if (err) return toast.warn(`Header media URL: ${err}`);
//     }

//     setPersisting(true);
//     try {
//       await saveMappings(campaignId, buildMappingDict());

//       const body = {
//         csvBatchId: batch.batchId,
//         mappings: buildMappingDict(),
//         phoneField: phoneHeader || undefined,
//         normalizePhones: !!valReq.normalizePhone,
//         deduplicate: !!valReq.checkDuplicates,
//         persist: true,
//         audienceName: audienceName.trim(),

//         // NEW: constant header media details
//         header: schema?.header?.needsUrl
//           ? { type: schema?.header?.type, mediaUrl: headerMediaUrl.trim() }
//           : { type: schema?.header?.type, mediaUrl: null },
//       };

//       await materialize(campaignId, body);
//       toast.success("Audience created and recipients materialized.");
//     } catch (e) {
//       toast.error(e?.message || "Persist failed.");
//     } finally {
//       setPersisting(false);
//     }
//   };

//   // Mapping status chip (for the collapsed panel)
//   const mappingStatus = useMemo(() => {
//     if (!expectedKeys?.length) return { label: "No params", ok: true };
//     const missing = expectedKeys.filter(k => !keyToColumn[k]);
//     return missing.length
//       ? { label: `${missing.length} missing`, ok: false }
//       : { label: "All mapped", ok: true };
//   }, [expectedKeys, keyToColumn]);

//   /* ----------- render ----------- */

//   if (loading) {
//     return (
//       <div className="rounded-lg border bg-white p-4 text-sm text-gray-500">
//         Loading CSV schema…
//       </div>
//     );
//   }

//   const headerInfo = schema?.header ?? { type: "none", needsUrl: false };
//   const showHeaderUrl = !!headerInfo.needsUrl;

//   return (
//     <section ref={topRef} className="rounded-xl border bg-white p-4 shadow-sm">
//       <h2 className="mb-3 text-sm font-semibold text-gray-800">
//         Audience via CSV
//       </h2>

//       {/* Audience name */}
//       <div className="mb-3">
//         <input
//           className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
//           placeholder="Audience name (required to persist)"
//           value={audienceName}
//           onChange={e => setAudienceName(e.target.value)}
//         />
//       </div>

//       {/* Header row: expected columns + actions */}
//       <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
//         <div className="text-gray-600">
//           Expected columns:&nbsp;
//           <code className="rounded bg-gray-100 px-1.5 py-0.5">
//             {Array.isArray(schema?.headers) && schema.headers.length > 0
//               ? schema.headers.join(", ")
//               : "—"}
//           </code>
//         </div>
//         <button
//           type="button"
//           onClick={handleDownloadSample}
//           className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
//         >
//           Download sample CSV
//         </button>
//         <label className="ml-auto cursor-pointer text-indigo-600 hover:underline">
//           Upload CSV
//           <input
//             type="file"
//             accept=".csv"
//             onChange={e => handleFile(e.target.files?.[0])}
//             className="hidden"
//           />
//         </label>
//       </div>

//       {/* Phone + toggles + (optional) constant header media */}
//       <div className="grid gap-3 md:grid-cols-2">
//         {/* Phone + toggles + header media */}
//         <div className="rounded-lg border p-3 space-y-3">
//           <div>
//             <h3 className="mb-2 text-xs font-semibold text-gray-700">
//               Phone column
//             </h3>
//             <select
//               className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
//               value={phoneHeader}
//               onChange={e => setPhoneHeader(e.target.value)}
//               disabled={!(csvHeaders ?? []).length}
//             >
//               <option value="">
//                 {(csvHeaders ?? []).length
//                   ? "-- Select column --"
//                   : "Upload a CSV first"}
//               </option>
//               {(csvHeaders ?? []).map(h => (
//                 <option key={h} value={h}>
//                   {h}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="flex items-center gap-4 text-xs text-gray-700">
//             <label className="inline-flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={valReq.normalizePhone}
//                 onChange={e =>
//                   setValReq(v => ({ ...v, normalizePhone: e.target.checked }))
//                 }
//               />
//               Normalize phone (E.164)
//             </label>
//             <label className="inline-flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={valReq.checkDuplicates}
//                 onChange={e =>
//                   setValReq(v => ({ ...v, checkDuplicates: e.target.checked }))
//                 }
//               />
//               Deduplicate by phone
//             </label>
//           </div>

//           {showHeaderUrl && (
//             <div className="pt-2 border-t">
//               <div className="mb-1 text-xs font-semibold text-gray-700">
//                 Header media URL (constant for all)
//                 {headerInfo.type === "video" && (
//                   <span className="ml-1 text-[11px] text-gray-500">
//                     — must end with .mp4
//                   </span>
//                 )}
//                 {headerInfo.type === "document" && (
//                   <span className="ml-1 text-[11px] text-gray-500">
//                     — must be a .pdf
//                   </span>
//                 )}
//               </div>
//               <input
//                 className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500 ${
//                   headerMediaError ? "border-red-400" : ""
//                 }`}
//                 placeholder={
//                   headerInfo.type === "video"
//                     ? "https://.../file.mp4"
//                     : headerInfo.type === "document"
//                     ? "https://.../file.pdf"
//                     : "https://.../image.jpg"
//                 }
//                 value={headerMediaUrl}
//                 onChange={e => {
//                   setHeaderMediaUrl(e.target.value);
//                   if (headerMediaError) {
//                     setHeaderMediaError(
//                       validateHeaderUrl(e.target.value, headerInfo.type)
//                     );
//                   }
//                 }}
//                 onBlur={e =>
//                   setHeaderMediaError(
//                     validateHeaderUrl(e.target.value, headerInfo.type)
//                   )
//                 }
//               />
//               {headerMediaError && (
//                 <div className="mt-1 text-[11px] text-red-600">
//                   {headerMediaError}
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Collapsible mapping & validation */}
//         <div className="rounded-lg border p-3">
//           <div className="flex items-center justify-between">
//             <h3 className="text-xs font-semibold text-gray-700">
//               Mapping & Validation
//             </h3>
//             <span
//               className={`rounded-full px-2 py-0.5 text-[11px] ${
//                 mappingStatus.ok
//                   ? "bg-emerald-100 text-emerald-700"
//                   : "bg-amber-100 text-amber-700"
//               }`}
//             >
//               {mappingStatus.label}
//             </span>
//           </div>

//           <button
//             type="button"
//             className="mt-2 text-xs text-indigo-600 hover:underline"
//             onClick={() => setShowMapping(s => !s)}
//             disabled={!(csvHeaders ?? []).length}
//           >
//             {showMapping ? "Hide mapping" : "Edit mapping"}
//           </button>

//           {showMapping && (
//             <div className="mt-3 space-y-2">
//               {/* Expected per-row keys (from backend): body.*, header.* (text), button*.url_param */}
//               {expectedKeys.length === 0 ? (
//                 <p className="text-xs text-gray-500">No parameters required.</p>
//               ) : (
//                 expectedKeys.map(k => (
//                   <div
//                     key={k}
//                     className="grid grid-cols-[160px,1fr] items-center gap-2"
//                   >
//                     <div className="text-[11px] text-gray-500">{k}</div>
//                     <select
//                       className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                       value={keyToColumn[k] || ""}
//                       onChange={e =>
//                         setKeyToColumn(m => ({ ...m, [k]: e.target.value }))
//                       }
//                       disabled={!(csvHeaders ?? []).length}
//                     >
//                       <option value="">
//                         {(csvHeaders ?? []).length
//                           ? "-- Select column --"
//                           : "Upload CSV"}
//                       </option>
//                       {(csvHeaders ?? []).map(h => (
//                         <option key={h} value={h}>
//                           {h}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 ))
//               )}

//               {/* Legacy {{n}} UI (BODY only) */}
//               {paramMappings.length > 0 && (
//                 <div className="mt-4 border-t pt-3">
//                   <div className="mb-2 text-xs font-semibold text-gray-700">
//                     Body placeholders (legacy)
//                   </div>
//                   <div className="space-y-2">
//                     {paramMappings.map((m, i) => (
//                       <div
//                         key={m.index}
//                         className="grid grid-cols-[80px,100px,1fr] items-center gap-2"
//                       >
//                         <div className="text-xs text-gray-500">{`{{${m.index}}}`}</div>
//                         <select
//                           className="rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                           value={m.sourceType}
//                           onChange={e =>
//                             updateMapping(i, { sourceType: e.target.value })
//                           }
//                         >
//                           <option value="csv">CSV column</option>
//                           <option value="const">Constant</option>
//                         </select>

//                         {m.sourceType === "csv" ? (
//                           <select
//                             className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                             value={m.sourceName || ""}
//                             onChange={e =>
//                               updateMapping(i, { sourceName: e.target.value })
//                             }
//                             disabled={!(csvHeaders ?? []).length}
//                           >
//                             <option value="">
//                               {(csvHeaders ?? []).length
//                                 ? "-- Select column --"
//                                 : "Upload CSV"}
//                             </option>
//                             {(csvHeaders ?? []).map(h => (
//                               <option key={h} value={h}>
//                                 {h}
//                               </option>
//                             ))}
//                           </select>
//                         ) : (
//                           <input
//                             className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                             placeholder="Constant value"
//                             value={m.constValue || ""}
//                             onChange={e =>
//                               updateMapping(i, { constValue: e.target.value })
//                             }
//                           />
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Sample table */}
//       <div className="mt-4 overflow-x-auto rounded-lg border">
//         <table className="min-w-full text-xs">
//           <thead className="bg-gray-100 text-gray-700">
//             <tr>
//               {(sample?.headers ?? csvHeaders ?? []).map(h => (
//                 <th key={h} className="px-3 py-2 text-left">
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {Array.isArray(sample?.rows) && sample.rows.length > 0 ? (
//               sample.rows.map((row, idx) => (
//                 <tr key={idx} className="border-t">
//                   {(sample?.headers ?? csvHeaders ?? []).map(h => (
//                     <td key={h} className="px-3 py-1.5">
//                       {row?.[h] ?? ""}
//                     </td>
//                   ))}
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td
//                   className="px-3 py-2 text-gray-400"
//                   colSpan={(csvHeaders ?? []).length || 1}
//                 >
//                   No rows yet
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Actions */}
//       <div className="mt-4 flex flex-wrap items-center gap-2">
//         <button
//           type="button"
//           onClick={handleValidate}
//           disabled={!batch?.batchId}
//           className="rounded-md bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
//         >
//           Validate
//         </button>
//         <button
//           type="button"
//           onClick={handleDryRun}
//           disabled={!batch?.batchId}
//           className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
//         >
//           (Preview) Dry-run materialize
//         </button>
//         <button
//           type="button"
//           onClick={handlePersist}
//           disabled={!batch?.batchId || persisting || !audienceName?.trim()}
//           className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
//         >
//           {persisting
//             ? "Persisting…"
//             : "Persist (create audience + recipients)"}
//         </button>
//       </div>

//       {/* Validation result */}
//       {valRes && (
//         <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
//           <div className="font-semibold">Validation</div>
//           {Array.isArray(valRes.problems) && valRes.problems.length > 0 ? (
//             <ul className="mt-1 list-disc pl-5">
//               {valRes.problems.map((p, i) => (
//                 <li key={i}>{p}</li>
//               ))}
//             </ul>
//           ) : (
//             <div className="mt-1 text-green-700">No problems found.</div>
//           )}
//         </div>
//       )}

//       {/* Dry-run preview */}
//       {dryPreview && (
//         <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
//           <div className="font-semibold">Dry-run preview</div>
//           <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-[11px] text-gray-800">
//             {JSON.stringify(dryPreview, null, 2)}
//           </pre>
//         </div>
//       )}
//     </section>
//   );
// }

// // src/pages/Campaigns/components/CsvAudienceSection.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { toast } from "react-toastify";
// import {
//   fetchCsvSchema,
//   downloadCsvSampleBlob,
//   uploadCsvBatch,
//   getBatchSample,
//   validateBatch,
//   suggestMappings,
//   saveMappings,
//   materialize,
// } from "../api/csvApi";

// /* ---------------- Utilities ---------------- */

// function saveBlob(blob, filename) {
//   const url = window.URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   a.click();
//   window.URL.revokeObjectURL(url);
// }

// const norm = s =>
//   String(s || "")
//     .toLowerCase()
//     .replace(/[\s._-]+/g, "")
//     .replace(/[^a-z0-9]/g, "");

// const PHONE_ALIASES = ["phone", "mobile", "whatsapp", "number", "phonee164"];

// // Canonical keys we want to map in CSV (beyond {{n}})
// const CANONICAL_KEYS = [
//   "header.image_url",
//   "header.video_url",
//   "header.document_url",
//   "button1.url_param",
//   "button2.url_param",
//   "button3.url_param",
// ];

// // Aliases for non-{{n}} canonical keys
// const ALIASES = {
//   "header.image_url": ["image", "imageurl", "headerimage"],
//   "header.video_url": ["video", "videourl", "headervideo"],
//   "header.document_url": ["document", "doc", "pdf", "documenturl", "pdfurl"],
//   "button1.url_param": ["btn1", "button1", "url1"],
//   "button2.url_param": ["btn2", "button2", "url2"],
//   "button3.url_param": ["btn3", "button3", "url3"],
// };

// // Auto-pick CSV columns for expected canonical keys.
// function autoPick(headers, wants, fallbackGreedyBody = false) {
//   const map = {};
//   const used = new Set();
//   const H = headers.map(h => ({ raw: h, k: norm(h) }));

//   // 1) exact (case-insensitive)
//   for (const key of wants) {
//     const hit = headers.find(h => h.toLowerCase() === key.toLowerCase());
//     if (hit) {
//       map[key] = hit;
//       used.add(hit);
//     }
//   }

//   // 2) alias match
//   for (const key of wants) {
//     if (map[key]) continue;
//     const aliases = ALIASES[key] || [];
//     const hit = H.find(
//       h => aliases.some(a => h.k === norm(a)) && !used.has(h.raw)
//     );
//     if (hit) {
//       map[key] = hit.raw;
//       used.add(hit.raw);
//     }
//   }

//   // 3) “paramN” / “body.N” convenience for body.*
//   for (const key of wants) {
//     if (map[key]) continue;
//     const m = key.match(/^body\.(\d+)$/);
//     if (!m) continue;
//     const n = m[1];
//     const hit = H.find(
//       h => (h.k === `param${n}` || h.k === `body${n}`) && !used.has(h.raw)
//     );
//     if (hit) {
//       map[key] = hit.raw;
//       used.add(hit.raw);
//     }
//   }

//   // 4) greedy fill for remaining body.* only
//   if (fallbackGreedyBody) {
//     const remaining = headers.filter(h => !used.has(h));
//     for (const key of wants) {
//       if (!map[key] && key.startsWith("body.")) {
//         const pick = remaining.shift();
//         if (pick) {
//           map[key] = pick;
//           used.add(pick);
//         }
//       }
//     }
//   }

//   return map;
// }

// /* ---------------- Component ---------------- */

// export default function CsvAudienceSection({ campaignId }) {
//   const [loading, setLoading] = useState(true);
//   const [schema, setSchema] = useState(null);

//   const [batch, setBatch] = useState(null); // { batchId, headerJson, ... }
//   const [sample, setSample] = useState(null); // { headers, rows }
//   const [valReq, setValReq] = useState({
//     normalizePhone: true,
//     checkDuplicates: true,
//   });
//   const [valRes, setValRes] = useState(null);

//   // Legacy {{n}} param UI (kept for now)
//   const [paramMappings, setParamMappings] = useState([]);
//   // New: canonical key -> CSV column mapping (header/video/document/buttons)
//   const [expectedKeys, setExpectedKeys] = useState([]); // e.g. ['body.1','header.video_url','button1.url_param',...]
//   const [keyToColumn, setKeyToColumn] = useState({});

//   const [phoneHeader, setPhoneHeader] = useState("");
//   const [audienceName, setAudienceName] = useState(() => {
//     const d = new Date();
//     const yyyy = d.getFullYear();
//     const mm = String(d.getMonth() + 1).padStart(2, "0");
//     const dd = String(d.getDate()).padStart(2, "0");
//     return `Audience ${yyyy}-${mm}-${dd}`;
//   });

//   const [dryPreview, setDryPreview] = useState(null);
//   const [persisting, setPersisting] = useState(false);

//   // Collapsible UX
//   const [showMapping, setShowMapping] = useState(false);

//   const topRef = useRef(null);

//   // Load schema and prime expected keys / {{n}} slots
//   useEffect(() => {
//     let alive = true;
//     (async () => {
//       try {
//         setLoading(true);
//         const sc = await fetchCsvSchema(campaignId);
//         if (!alive) return;
//         setSchema(sc);

//         // 1) Build expected keys from placeholderCount + any canonical keys present in schema.headers
//         const N = Number(sc?.placeholderCount || 0);
//         const bodyKeys = Array.from({ length: N }, (_, i) => `body.${i + 1}`);

//         const hdrs = Array.isArray(sc?.headers) ? sc.headers : [];
//         const extraKeys = CANONICAL_KEYS.filter(k => hdrs.includes(k));

//         const keys = [...bodyKeys, ...extraKeys];
//         setExpectedKeys(keys);

//         // 2) Init legacy {{n}} mapping slots
//         setParamMappings(
//           Array.from({ length: N }, (_, i) => ({
//             index: i + 1,
//             sourceType: "csv",
//             sourceName: "",
//             constValue: "",
//           }))
//         );
//       } catch {
//         toast.error("Failed to load CSV schema.");
//       } finally {
//         if (alive) setLoading(false);
//       }
//     })();
//     return () => {
//       alive = false;
//     };
//   }, [campaignId]);

//   // Available headers from sample/batch/schema
//   const csvHeaders = useMemo(
//     () => sample?.headers ?? batch?.headerJson ?? schema?.headers ?? [],
//     [schema, batch, sample]
//   );

//   // Update a single {{n}} mapping slot
//   const updateMapping = (idx, patch) =>
//     setParamMappings(prev => {
//       const next = [...prev];
//       next[idx] = { ...next[idx], ...patch };
//       return next;
//     });

//   const handleDownloadSample = async () => {
//     try {
//       const blob = await downloadCsvSampleBlob(campaignId);
//       saveBlob(blob, `campaign-${campaignId}-sample.csv`);
//     } catch {
//       toast.error("Could not download sample CSV.");
//     }
//   };

//   const handleFile = async f => {
//     if (!f) return;
//     try {
//       const up = await uploadCsvBatch(f, null);
//       setBatch(up);
//       toast.success("CSV uploaded.");

//       const s = await getBatchSample(up?.batchId, 10);
//       setSample(s);

//       const hdrs = Array.isArray(s?.headers) ? s.headers : [];

//       // Auto-pick phone column
//       const lower = hdrs.map(h => String(h).toLowerCase());
//       const guessIdx = lower.findIndex(h =>
//         PHONE_ALIASES.some(k => h.includes(k))
//       );
//       setPhoneHeader(guessIdx >= 0 ? hdrs[guessIdx] : "");

//       // Auto-map canonical keys (body/header/buttons)
//       const km = autoPick(hdrs, expectedKeys, /*fallbackGreedyBody*/ true);
//       setKeyToColumn(km);

//       // Also seed the legacy {{n}} list so current backend keeps working
//       setParamMappings(prev =>
//         prev.map(p => {
//           const key = `body.${p.index}`;
//           return km[key] ? { ...p, sourceName: km[key] } : p;
//         })
//       );

//       // Try server suggestions (optional; reconciled over auto map)
//       try {
//         const sugg = await suggestMappings(campaignId, up?.batchId);
//         if (Array.isArray(sugg?.items)) {
//           // Expect items like { index: 1, sourceType: "csv"|"const", sourceName, constValue }
//           setParamMappings(prev =>
//             prev.map(p => {
//               const m = sugg.items.find(x => x.index === p.index);
//               return m ? { ...p, ...m } : p;
//             })
//           );
//         }
//       } catch {
//         /* no-op */
//       }

//       // Keep UI minimal by default
//       setShowMapping(false);
//     } catch (e) {
//       toast.error(e?.message || "CSV upload failed.");
//     }
//   };

//   const handleValidate = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");
//     if (!phoneHeader) return toast.warn("Choose the phone column.");

//     try {
//       const req = {
//         phoneHeader,
//         requiredHeaders: [], // params may be constants
//         normalizePhone: !!valReq.normalizePhone,
//         checkDuplicates: !!valReq.checkDuplicates,
//       };
//       const res = await validateBatch(batch.batchId, req);
//       setValRes(res);
//       if (Array.isArray(res?.problems) && res.problems.length > 0) {
//         toast.warn(`Validation found ${res.problems.length} issue(s).`);
//       } else {
//         toast.success("Validation passed.");
//       }
//     } catch {
//       toast.error("Validation call failed.");
//     }
//   };

//   // Build the mapping dictionary the backend expects.
//   // Keeps compatibility with your existing backend:
//   // - "{{n}}" => "CSV_COLUMN" | "constant:VALUE"
//   // - canonical keys (header.*, button*.url_param) => "CSV_COLUMN"
//   const buildMappingDict = () => {
//     const dict = {};

//     // Legacy body placeholders
//     for (const m of paramMappings) {
//       const key = `{{${m.index}}}`;
//       if (m.sourceType === "csv") {
//         dict[key] = m.sourceName || "";
//       } else {
//         dict[key] = `constant:${m.constValue ?? ""}`;
//       }
//     }

//     // Canonical keys passthrough
//     for (const [k, v] of Object.entries(keyToColumn || {})) {
//       if (!v) continue;
//       dict[k] = v; // column name
//     }

//     return dict;
//   };

//   const handleDryRun = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");

//     try {
//       await saveMappings(campaignId, buildMappingDict()); // optional persistence

//       const body = {
//         csvBatchId: batch.batchId,
//         mappings: buildMappingDict(),
//         phoneField: phoneHeader || undefined,
//         normalizePhones: !!valReq.normalizePhone,
//         deduplicate: !!valReq.checkDuplicates,
//         persist: false, // preview only
//         audienceName: undefined,
//       };

//       const preview = await materialize(campaignId, body);
//       setDryPreview(preview);
//       toast.success("Dry-run ready.");
//     } catch {
//       toast.error("Dry-run failed.");
//     }
//   };

//   const handlePersist = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");
//     if (!audienceName?.trim()) return toast.warn("Enter an audience name.");

//     setPersisting(true);
//     try {
//       await saveMappings(campaignId, buildMappingDict());

//       const body = {
//         csvBatchId: batch.batchId,
//         mappings: buildMappingDict(),
//         phoneField: phoneHeader || undefined,
//         normalizePhones: !!valReq.normalizePhone,
//         deduplicate: !!valReq.checkDuplicates,
//         persist: true,
//         audienceName: audienceName.trim(),
//       };

//       await materialize(campaignId, body);
//       toast.success("Audience created and recipients materialized.");
//     } catch {
//       toast.error("Persist failed.");
//     } finally {
//       setPersisting(false);
//     }
//   };

//   // Mapping status chip (for the collapsed panel)
//   const mappingStatus = useMemo(() => {
//     if (!expectedKeys?.length) return { label: "No params", ok: true };
//     const missing = expectedKeys.filter(k => !keyToColumn[k]);
//     return missing.length
//       ? { label: `${missing.length} missing`, ok: false }
//       : { label: "All mapped", ok: true };
//   }, [expectedKeys, keyToColumn]);

//   if (loading) {
//     return (
//       <div className="rounded-lg border bg-white p-4 text-sm text-gray-500">
//         Loading CSV schema…
//       </div>
//     );
//   }

//   return (
//     <section ref={topRef} className="rounded-xl border bg-white p-4 shadow-sm">
//       <h2 className="mb-3 text-sm font-semibold text-gray-800">
//         Audience via CSV
//       </h2>

//       {/* Audience name */}
//       <div className="mb-3">
//         <input
//           className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
//           placeholder="Audience name (required to persist)"
//           value={audienceName}
//           onChange={e => setAudienceName(e.target.value)}
//         />
//       </div>

//       {/* Header row: expected columns + actions */}
//       <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
//         <div className="text-gray-600">
//           Expected columns:&nbsp;
//           <code className="rounded bg-gray-100 px-1.5 py-0.5">
//             {Array.isArray(schema?.headers) ? schema.headers.join(", ") : "—"}
//           </code>
//         </div>
//         <button
//           type="button"
//           onClick={handleDownloadSample}
//           className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
//         >
//           Download sample CSV
//         </button>
//         <label className="ml-auto cursor-pointer text-indigo-600 hover:underline">
//           Upload CSV
//           <input
//             type="file"
//             accept=".csv"
//             onChange={e => handleFile(e.target.files?.[0])}
//             className="hidden"
//           />
//         </label>
//       </div>

//       {/* Phone + toggles and collapsible mapping */}
//       <div className="grid gap-3 md:grid-cols-2">
//         {/* Phone + toggles */}
//         <div className="rounded-lg border p-3">
//           <h3 className="mb-2 text-xs font-semibold text-gray-700">
//             Phone column
//           </h3>
//           <select
//             className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
//             value={phoneHeader}
//             onChange={e => setPhoneHeader(e.target.value)}
//             disabled={!(csvHeaders ?? []).length}
//           >
//             <option value="">
//               {(csvHeaders ?? []).length
//                 ? "-- Select column --"
//                 : "Upload a CSV first"}
//             </option>
//             {(csvHeaders ?? []).map(h => (
//               <option key={h} value={h}>
//                 {h}
//               </option>
//             ))}
//           </select>

//           <div className="mt-3 flex items-center gap-4 text-xs text-gray-700">
//             <label className="inline-flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={valReq.normalizePhone}
//                 onChange={e =>
//                   setValReq(v => ({ ...v, normalizePhone: e.target.checked }))
//                 }
//               />
//               Normalize phone (E.164)
//             </label>
//             <label className="inline-flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={valReq.checkDuplicates}
//                 onChange={e =>
//                   setValReq(v => ({ ...v, checkDuplicates: e.target.checked }))
//                 }
//               />
//               Deduplicate by phone
//             </label>
//           </div>
//         </div>

//         {/* Collapsible mapping & validation */}
//         <div className="rounded-lg border p-3">
//           <div className="flex items-center justify-between">
//             <h3 className="text-xs font-semibold text-gray-700">
//               Mapping & Validation
//             </h3>
//             <span
//               className={`rounded-full px-2 py-0.5 text-[11px] ${
//                 mappingStatus.ok
//                   ? "bg-emerald-100 text-emerald-700"
//                   : "bg-amber-100 text-amber-700"
//               }`}
//             >
//               {mappingStatus.label}
//             </span>
//           </div>

//           <button
//             type="button"
//             className="mt-2 text-xs text-indigo-600 hover:underline"
//             onClick={() => setShowMapping(s => !s)}
//             disabled={!(csvHeaders ?? []).length}
//           >
//             {showMapping ? "Hide mapping" : "Edit mapping"}
//           </button>

//           {showMapping && (
//             <div className="mt-3 space-y-2">
//               {/* Canonical keys (header/video/document/buttons) + body.* */}
//               {expectedKeys.length === 0 ? (
//                 <p className="text-xs text-gray-500">No parameters required.</p>
//               ) : (
//                 expectedKeys.map(k => (
//                   <div
//                     key={k}
//                     className="grid grid-cols-[160px,1fr] items-center gap-2"
//                   >
//                     <div className="text-[11px] text-gray-500">{k}</div>
//                     <select
//                       className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                       value={keyToColumn[k] || ""}
//                       onChange={e =>
//                         setKeyToColumn(m => ({ ...m, [k]: e.target.value }))
//                       }
//                       disabled={!(csvHeaders ?? []).length}
//                     >
//                       <option value="">
//                         {(csvHeaders ?? []).length
//                           ? "-- Select column --"
//                           : "Upload CSV"}
//                       </option>
//                       {(csvHeaders ?? []).map(h => (
//                         <option key={h} value={h}>
//                           {h}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 ))
//               )}

//               {/* Legacy {{n}} UI (kept for now) */}
//               {paramMappings.length > 0 && (
//                 <div className="mt-4 border-t pt-3">
//                   <div className="mb-2 text-xs font-semibold text-gray-700">
//                     Body placeholders (legacy)
//                   </div>
//                   <div className="space-y-2">
//                     {paramMappings.map((m, i) => (
//                       <div
//                         key={m.index}
//                         className="grid grid-cols-[80px,100px,1fr] items-center gap-2"
//                       >
//                         <div className="text-xs text-gray-500">{`{{${m.index}}}`}</div>
//                         <select
//                           className="rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                           value={m.sourceType}
//                           onChange={e =>
//                             updateMapping(i, { sourceType: e.target.value })
//                           }
//                         >
//                           <option value="csv">CSV column</option>
//                           <option value="const">Constant</option>
//                         </select>

//                         {m.sourceType === "csv" ? (
//                           <select
//                             className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                             value={m.sourceName || ""}
//                             onChange={e =>
//                               updateMapping(i, { sourceName: e.target.value })
//                             }
//                             disabled={!(csvHeaders ?? []).length}
//                           >
//                             <option value="">
//                               {(csvHeaders ?? []).length
//                                 ? "-- Select column --"
//                                 : "Upload CSV"}
//                             </option>
//                             {(csvHeaders ?? []).map(h => (
//                               <option key={h} value={h}>
//                                 {h}
//                               </option>
//                             ))}
//                           </select>
//                         ) : (
//                           <input
//                             className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                             placeholder="Constant value"
//                             value={m.constValue || ""}
//                             onChange={e =>
//                               updateMapping(i, { constValue: e.target.value })
//                             }
//                           />
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Sample table */}
//       <div className="mt-4 overflow-x-auto rounded-lg border">
//         <table className="min-w-full text-xs">
//           <thead className="bg-gray-100 text-gray-700">
//             <tr>
//               {(sample?.headers ?? csvHeaders ?? []).map(h => (
//                 <th key={h} className="px-3 py-2 text-left">
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {Array.isArray(sample?.rows) && sample.rows.length > 0 ? (
//               sample.rows.map((row, idx) => (
//                 <tr key={idx} className="border-t">
//                   {(sample?.headers ?? csvHeaders ?? []).map(h => (
//                     <td key={h} className="px-3 py-1.5">
//                       {row?.[h] ?? ""}
//                     </td>
//                   ))}
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td
//                   className="px-3 py-2 text-gray-400"
//                   colSpan={(csvHeaders ?? []).length || 1}
//                 >
//                   No rows yet
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Actions */}
//       <div className="mt-4 flex flex-wrap items-center gap-2">
//         <button
//           type="button"
//           onClick={handleValidate}
//           disabled={!batch?.batchId}
//           className="rounded-md bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
//         >
//           Validate
//         </button>
//         <button
//           type="button"
//           onClick={handleDryRun}
//           disabled={!batch?.batchId}
//           className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
//         >
//           (Preview) Dry-run materialize
//         </button>
//         <button
//           type="button"
//           onClick={handlePersist}
//           disabled={!batch?.batchId || persisting || !audienceName?.trim()}
//           className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
//         >
//           {persisting
//             ? "Persisting…"
//             : "Persist (create audience + recipients)"}
//         </button>
//       </div>

//       {/* Validation result */}
//       {valRes && (
//         <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
//           <div className="font-semibold">Validation</div>
//           {Array.isArray(valRes.problems) && valRes.problems.length > 0 ? (
//             <ul className="mt-1 list-disc pl-5">
//               {valRes.problems.map((p, i) => (
//                 <li key={i}>{p}</li>
//               ))}
//             </ul>
//           ) : (
//             <div className="mt-1 text-green-700">No problems found.</div>
//           )}
//         </div>
//       )}

//       {/* Dry-run preview */}
//       {dryPreview && (
//         <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
//           <div className="font-semibold">Dry-run preview</div>
//           <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-[11px] text-gray-800">
//             {JSON.stringify(dryPreview, null, 2)}
//           </pre>
//         </div>
//       )}
//     </section>
//   );
// }

// // src/pages/Campaigns/components/CsvAudienceSection.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { toast } from "react-toastify";
// import {
//   fetchCsvSchema,
//   downloadCsvSampleBlob,
//   uploadCsvBatch,
//   getBatchSample,
//   validateBatch,
//   suggestMappings,
//   saveMappings,
//   materialize,
// } from "../api/csvApi";

// function saveBlob(blob, filename) {
//   const url = window.URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   a.click();
//   window.URL.revokeObjectURL(url);
// }

// export default function CsvAudienceSection({ campaignId }) {
//   const [loading, setLoading] = useState(true);
//   const [schema, setSchema] = useState(null);

//   const [batch, setBatch] = useState(null); // { batchId, headerJson, ... }
//   const [sample, setSample] = useState(null); // { headers, rows }
//   const [valReq, setValReq] = useState({
//     normalizePhone: true,
//     checkDuplicates: true,
//   });
//   const [valRes, setValRes] = useState(null);

//   const [paramMappings, setParamMappings] = useState([]);
//   const [phoneHeader, setPhoneHeader] = useState("");
//   const [audienceName, setAudienceName] = useState(() => {
//     const d = new Date();
//     const yyyy = d.getFullYear();
//     const mm = String(d.getMonth() + 1).padStart(2, "0");
//     const dd = String(d.getDate()).padStart(2, "0");
//     return `Audience ${yyyy}-${mm}-${dd}`;
//   });

//   const [dryPreview, setDryPreview] = useState(null);
//   const [persisting, setPersisting] = useState(false);

//   const topRef = useRef(null);

//   useEffect(() => {
//     let alive = true;
//     (async () => {
//       try {
//         setLoading(true);
//         const sc = await fetchCsvSchema(campaignId);
//         if (!alive) return;
//         setSchema(sc);

//         const N = Number(sc?.placeholderCount || 0);
//         setParamMappings(
//           Array.from({ length: N }, (_, i) => ({
//             index: i + 1,
//             sourceType: "csv",
//             sourceName: "",
//             constValue: "",
//           }))
//         );
//       } catch {
//         toast.error("Failed to load CSV schema.");
//       } finally {
//         if (alive) setLoading(false);
//       }
//     })();
//     return () => {
//       alive = false;
//     };
//   }, [campaignId]);

//   const csvHeaders = useMemo(
//     () => sample?.headers ?? batch?.headerJson ?? schema?.headers ?? [],
//     [schema, batch, sample]
//   );

//   const updateMapping = (idx, patch) =>
//     setParamMappings(prev => {
//       const next = [...prev];
//       next[idx] = { ...next[idx], ...patch };
//       return next;
//     });

//   const handleDownloadSample = async () => {
//     try {
//       const blob = await downloadCsvSampleBlob(campaignId);
//       saveBlob(blob, `campaign-${campaignId}-sample.csv`);
//     } catch {
//       toast.error("Could not download sample CSV.");
//     }
//   };

//   const handleFile = async f => {
//     if (!f) return;
//     try {
//       const up = await uploadCsvBatch(f, null);
//       setBatch(up);
//       toast.success("CSV uploaded.");

//       const s = await getBatchSample(up?.batchId, 10);
//       setSample(s);

//       const hdrs = Array.isArray(s?.headers) ? s.headers : [];
//       const lower = hdrs.map(h => String(h).toLowerCase());
//       const guessIdx = lower.findIndex(h =>
//         ["phone", "mobile", "whatsapp", "number", "phonee164"].some(k =>
//           h.includes(k)
//         )
//       );
//       setPhoneHeader(guessIdx >= 0 ? hdrs[guessIdx] : "");

//       try {
//         const sugg = await suggestMappings(campaignId, up?.batchId);
//         if (Array.isArray(sugg?.items)) {
//           setParamMappings(prev =>
//             prev.map(p => {
//               const m = sugg.items.find(x => x.index === p.index);
//               return m ? { ...p, ...m } : p;
//             })
//           );
//         }
//       } catch {
//         /* optional */
//       }
//     } catch (e) {
//       toast.error(e?.message || "CSV upload failed.");
//     }
//   };

//   const handleValidate = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");
//     if (!phoneHeader) return toast.warn("Choose the phone column.");

//     try {
//       const req = {
//         phoneHeader,
//         requiredHeaders: [], // params may be constants
//         normalizePhone: !!valReq.normalizePhone,
//         checkDuplicates: !!valReq.checkDuplicates,
//       };
//       const res = await validateBatch(batch.batchId, req);
//       setValRes(res);
//       if (Array.isArray(res?.problems) && res.problems.length > 0) {
//         toast.warn(`Validation found ${res.problems.length} issue(s).`);
//       } else {
//         toast.success("Validation passed.");
//       }
//     } catch {
//       toast.error("Validation call failed.");
//     }
//   };

//   // Dictionary the backend expects for mappings (eg { "{{1}}": "Nicolus", "{{2}}": "Email" }).
//   const buildMappingDict = () => {
//     const dict = {};
//     for (const m of paramMappings) {
//       const key = `{{${m.index}}}`;
//       if (m.sourceType === "csv") {
//         dict[key] = m.sourceName || "";
//       } else {
//         // IMPORTANT: backend expects "constant:" prefix
//         dict[key] = `constant:${m.constValue ?? ""}`;
//       }
//     }
//     return dict;
//   };
//   const handleDryRun = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");

//     try {
//       await saveMappings(campaignId, buildMappingDict()); // optional

//       const body = {
//         csvBatchId: batch.batchId,
//         mappings: buildMappingDict(),
//         phoneField: phoneHeader || undefined,
//         normalizePhones: !!valReq.normalizePhone,
//         deduplicate: !!valReq.checkDuplicates,
//         persist: false, // <-- preview only
//         audienceName: undefined, // <-- not needed for preview
//       };

//       const preview = await materialize(campaignId, body);
//       setDryPreview(preview);
//       toast.success("Dry-run ready.");
//     } catch {
//       toast.error("Dry-run failed.");
//     }
//   };

//   const handlePersist = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");
//     if (!audienceName?.trim()) return toast.warn("Enter an audience name.");

//     setPersisting(true);
//     try {
//       await saveMappings(campaignId, buildMappingDict()); // optional

//       const body = {
//         csvBatchId: batch.batchId,
//         mappings: buildMappingDict(),
//         phoneField: phoneHeader || undefined,
//         normalizePhones: !!valReq.normalizePhone,
//         deduplicate: !!valReq.checkDuplicates,
//         persist: true, // <-- REQUIRED
//         audienceName: audienceName.trim(),
//       };

//       const result = await materialize(campaignId, body);
//       toast.success("Audience created and recipients materialized.");
//       // result.audienceId will be set on success
//     } catch {
//       toast.error("Persist failed.");
//     } finally {
//       setPersisting(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="rounded-lg border bg-white p-4 text-sm text-gray-500">
//         Loading CSV schema…
//       </div>
//     );
//   }

//   return (
//     <section ref={topRef} className="rounded-xl border bg-white p-4 shadow-sm">
//       <h2 className="mb-3 text-sm font-semibold text-gray-800">
//         Audience via CSV
//       </h2>

//       {/* Audience name */}
//       <div className="mb-3">
//         <input
//           className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
//           placeholder="Audience name (required to persist)"
//           value={audienceName}
//           onChange={e => setAudienceName(e.target.value)}
//         />
//       </div>

//       {/* Header row: expected columns + actions */}
//       <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
//         <div className="text-gray-600">
//           Expected columns:&nbsp;
//           <code className="rounded bg-gray-100 px-1.5 py-0.5">
//             {Array.isArray(schema?.headers) ? schema.headers.join(", ") : "—"}
//           </code>
//         </div>
//         <button
//           type="button"
//           onClick={handleDownloadSample}
//           className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
//         >
//           Download sample CSV
//         </button>
//         <label className="ml-auto cursor-pointer text-indigo-600 hover:underline">
//           Upload CSV
//           <input
//             type="file"
//             accept=".csv"
//             onChange={e => handleFile(e.target.files?.[0])}
//             className="hidden"
//           />
//         </label>
//       </div>

//       {/* Phone + toggles and parameter mapping */}
//       <div className="grid gap-3 md:grid-cols-2">
//         <div className="rounded-lg border p-3">
//           <h3 className="mb-2 text-xs font-semibold text-gray-700">
//             Phone column
//           </h3>
//           <select
//             className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
//             value={phoneHeader}
//             onChange={e => setPhoneHeader(e.target.value)}
//             disabled={!(csvHeaders ?? []).length}
//           >
//             <option value="">
//               {(csvHeaders ?? []).length
//                 ? "-- Select column --"
//                 : "Upload a CSV first"}
//             </option>
//             {(csvHeaders ?? []).map(h => (
//               <option key={h} value={h}>
//                 {h}
//               </option>
//             ))}
//           </select>

//           <div className="mt-3 flex items-center gap-4 text-xs text-gray-700">
//             <label className="inline-flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={valReq.normalizePhone}
//                 onChange={e =>
//                   setValReq(v => ({ ...v, normalizePhone: e.target.checked }))
//                 }
//               />
//               Normalize phone (E.164)
//             </label>
//             <label className="inline-flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={valReq.checkDuplicates}
//                 onChange={e =>
//                   setValReq(v => ({ ...v, checkDuplicates: e.target.checked }))
//                 }
//               />
//               Deduplicate by phone
//             </label>
//           </div>
//         </div>

//         <div className="rounded-lg border p-3">
//           <h3 className="mb-2 text-xs font-semibold text-gray-700">
//             Template parameters
//           </h3>
//           {paramMappings.length === 0 ? (
//             <p className="text-sm text-gray-500">
//               No parameters required for this template.
//             </p>
//           ) : (
//             <div className="space-y-2">
//               {paramMappings.map((m, i) => (
//                 <div
//                   key={m.index}
//                   className="grid grid-cols-[80px,100px,1fr] items-center gap-2"
//                 >
//                   <div className="text-xs text-gray-500">{`{{${m.index}}}`}</div>
//                   <select
//                     className="rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                     value={m.sourceType}
//                     onChange={e =>
//                       updateMapping(i, { sourceType: e.target.value })
//                     }
//                   >
//                     <option value="csv">CSV column</option>
//                     <option value="const">Constant</option>
//                   </select>

//                   {m.sourceType === "csv" ? (
//                     <select
//                       className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                       value={m.sourceName || ""}
//                       onChange={e =>
//                         updateMapping(i, { sourceName: e.target.value })
//                       }
//                       disabled={!(csvHeaders ?? []).length}
//                     >
//                       <option value="">
//                         {(csvHeaders ?? []).length
//                           ? "-- Select column --"
//                           : "Upload CSV"}
//                       </option>
//                       {(csvHeaders ?? []).map(h => (
//                         <option key={h} value={h}>
//                           {h}
//                         </option>
//                       ))}
//                     </select>
//                   ) : (
//                     <input
//                       className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                       placeholder="Constant value"
//                       value={m.constValue || ""}
//                       onChange={e =>
//                         updateMapping(i, { constValue: e.target.value })
//                       }
//                     />
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Sample table */}
//       <div className="mt-4 overflow-x-auto rounded-lg border">
//         <table className="min-w-full text-xs">
//           <thead className="bg-gray-100 text-gray-700">
//             <tr>
//               {(sample?.headers ?? csvHeaders ?? []).map(h => (
//                 <th key={h} className="px-3 py-2 text-left">
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {Array.isArray(sample?.rows) && sample.rows.length > 0 ? (
//               sample.rows.map((row, idx) => (
//                 <tr key={idx} className="border-t">
//                   {(sample?.headers ?? csvHeaders ?? []).map(h => (
//                     <td key={h} className="px-3 py-1.5">
//                       {row?.[h] ?? ""}
//                     </td>
//                   ))}
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td
//                   className="px-3 py-2 text-gray-400"
//                   colSpan={(csvHeaders ?? []).length || 1}
//                 >
//                   No rows yet
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Actions */}
//       <div className="mt-4 flex flex-wrap items-center gap-2">
//         <button
//           type="button"
//           onClick={handleValidate}
//           disabled={!batch?.batchId}
//           className="rounded-md bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
//         >
//           Validate
//         </button>
//         <button
//           type="button"
//           onClick={handleDryRun}
//           disabled={!batch?.batchId}
//           className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
//         >
//           (Preview) Dry-run materialize
//         </button>
//         <button
//           type="button"
//           onClick={handlePersist}
//           disabled={!batch?.batchId || persisting || !audienceName?.trim()}
//           className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
//         >
//           {persisting
//             ? "Persisting…"
//             : "Persist (create audience + recipients)"}
//         </button>
//       </div>

//       {/* Validation result */}
//       {valRes && (
//         <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
//           <div className="font-semibold">Validation</div>
//           {Array.isArray(valRes.problems) && valRes.problems.length > 0 ? (
//             <ul className="mt-1 list-disc pl-5">
//               {valRes.problems.map((p, i) => (
//                 <li key={i}>{p}</li>
//               ))}
//             </ul>
//           ) : (
//             <div className="mt-1 text-green-700">No problems found.</div>
//           )}
//         </div>
//       )}

//       {/* Dry-run preview */}
//       {dryPreview && (
//         <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
//           <div className="font-semibold">Dry-run preview</div>
//           <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-[11px] text-gray-800">
//             {JSON.stringify(dryPreview, null, 2)}
//           </pre>
//         </div>
//       )}
//     </section>
//   );
// }

// // src/pages/Campaigns/components/CsvAudienceSection.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { toast } from "react-toastify";
// import {
//   fetchCsvSchema,
//   downloadCsvSampleBlob,
//   uploadCsvBatch,
//   getBatchSample,
//   validateBatch,
//   suggestMappings,
//   saveMappings,
//   materialize,
// } from "../api/csvApi";

// // Small helper to download a Blob as a file
// function saveBlob(blob, filename) {
//   const url = window.URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   a.click();
//   window.URL.revokeObjectURL(url);
// }

// /**
//  * CsvAudienceSection
//  * Drives the end-to-end bulk personalization flow for a campaign.
//  */
// export default function CsvAudienceSection({ campaignId }) {
//   const [loading, setLoading] = useState(true);
//   const [schema, setSchema] = useState(null); // { headers, placeholderCount, parameterNames? }

//   const [batch, setBatch] = useState(null); // { batchId, headerJson, ... }
//   const [sample, setSample] = useState(null); // { headers, rows }
//   const [valReq, setValReq] = useState({
//     normalizePhone: true,
//     checkDuplicates: true,
//   });
//   const [valRes, setValRes] = useState(null);

//   // { index:1, sourceType:"csv"|"const", sourceName:"", constValue:"" }
//   const [paramMappings, setParamMappings] = useState([]);
//   const [phoneHeader, setPhoneHeader] = useState("");
//   const [dryPreview, setDryPreview] = useState(null);
//   const [persisting, setPersisting] = useState(false);

//   const topRef = useRef(null);

//   // Load schema
//   useEffect(() => {
//     let isMounted = true;
//     (async () => {
//       try {
//         setLoading(true);
//         const sc = await fetchCsvSchema(campaignId);
//         if (!isMounted) return;
//         setSchema(sc);

//         const N = Number(sc?.placeholderCount || 0);
//         const initial = Array.from({ length: N }, (_, i) => ({
//           index: i + 1,
//           sourceType: "csv",
//           sourceName: "",
//           constValue: "",
//         }));
//         setParamMappings(initial);
//       } catch {
//         toast.error("Failed to load CSV schema.");
//       } finally {
//         if (isMounted) setLoading(false);
//       }
//     })();
//     return () => {
//       isMounted = false;
//     };
//   }, [campaignId]);

//   // Prefer most concrete headers: sample.headers -> batch.headerJson -> schema.headers
//   const csvHeaders = useMemo(
//     () => sample?.headers ?? batch?.headerJson ?? schema?.headers ?? [],
//     [schema, batch, sample]
//   );

//   // Update mapping helper
//   const updateMapping = (idxZero, patch) => {
//     setParamMappings(prev => {
//       const next = [...prev];
//       next[idxZero] = { ...next[idxZero], ...patch };
//       return next;
//     });
//   };

//   // Download one-line sample (server builds correct headers)
//   const handleDownloadSample = async () => {
//     try {
//       const blob = await downloadCsvSampleBlob(campaignId);
//       saveBlob(blob, `campaign-${campaignId}-sample.csv`);
//     } catch {
//       toast.error("Could not download sample CSV.");
//     }
//   };

//   // Upload CSV -> create CsvBatch -> load first rows -> try mapping suggestions
//   const handleFile = async f => {
//     if (!f) return;
//     try {
//       const up = await uploadCsvBatch(f, null);
//       setBatch(up);
//       toast.success("CSV uploaded.");

//       const s = await getBatchSample(up?.batchId, 10);
//       setSample(s);

//       // Guess phone column by common names (guard headers)
//       const hdrs = Array.isArray(s?.headers) ? s.headers : [];
//       const lower = hdrs.map(h => String(h).toLowerCase());
//       const guessIdx = lower.findIndex(h =>
//         ["phone", "mobile", "whatsapp", "number", "phonee164"].some(k =>
//           h.includes(k)
//         )
//       );
//       setPhoneHeader(guessIdx >= 0 ? hdrs[guessIdx] : "");

//       // Optional: backend suggestions to pre-fill param mappings
//       try {
//         const sugg = await suggestMappings(campaignId, up?.batchId);
//         if (Array.isArray(sugg?.items)) {
//           setParamMappings(prev =>
//             prev.map(p => {
//               const m = sugg.items.find(x => x.index === p.index);
//               return m ? { ...p, ...m } : p;
//             })
//           );
//         }
//       } catch {
//         /* suggestions are optional */
//       }
//     } catch (e) {
//       toast.error(e?.message || "CSV upload failed.");
//     }
//   };

//   // Validate phones & duplicates
//   const handleValidate = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");
//     if (!phoneHeader) return toast.warn("Choose the phone column.");

//     try {
//       const req = {
//         phoneHeader,
//         requiredHeaders: [], // params may be constants
//         normalizePhone: !!valReq.normalizePhone,
//         checkDuplicates: !!valReq.checkDuplicates,
//       };
//       const res = await validateBatch(batch.batchId, req);
//       setValRes(res);
//       if (Array.isArray(res?.problems) && res.problems.length > 0) {
//         toast.warn(`Validation found ${res.problems.length} issue(s).`);
//       } else {
//         toast.success("Validation passed.");
//       }
//     } catch {
//       toast.error("Validation call failed.");
//     }
//   };

//   // ---- NEW: build backend-friendly dictionary for mappings ----
//   // /mappings endpoint expects Dictionary<string,string> like:
//   // { "{{1}}": "Nicolus", "{{2}}": "Email" }
//   // For constants, we encode as "const:<value>" so backend can distinguish.
//   const buildMappingDict = () => {
//     const dict = {};
//     for (const m of paramMappings) {
//       const key = `{{${m.index}}}`;
//       if (m.sourceType === "csv") {
//         dict[key] = m.sourceName || "";
//       } else {
//         dict[key] = `const:${m.constValue ?? ""}`;
//       }
//     }
//     return dict;
//   };

//   // Dry-run (no DB writes)
//   const handleDryRun = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");
//     if (!phoneHeader) return toast.warn("Choose the phone column.");

//     try {
//       // Persist mapping config (Dictionary<string,string>)
//       await saveMappings(campaignId, buildMappingDict());

//       const body = {
//         mode: "dryRun",
//         //batchId: batch.batchId,
//         csvBatchId: batch.batchId,
//         normalizePhone: !!valReq.normalizePhone,
//         deduplicate: !!valReq.checkDuplicates,
//         phoneHeader,
//         // Use the same dictionary shape for materialize
//         mappings: buildMappingDict(),
//       };
//       const preview = await materialize(campaignId, body);
//       setDryPreview(preview);
//       toast.success("Dry-run ready.");
//       topRef.current?.scrollIntoView({ behavior: "smooth" });
//     } catch {
//       toast.error("Dry-run failed.");
//     }
//   };

//   // Commit (creates Audience + AudienceMembers + CampaignRecipients)
//   const handlePersist = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");
//     setPersisting(true);
//     try {
//       // Keep mappings in sync
//       await saveMappings(campaignId, buildMappingDict());

//       const body = {
//         mode: "commit",
//         csvBatchId: batch.batchId,
//         normalizePhone: !!valReq.normalizePhone,
//         deduplicate: !!valReq.checkDuplicates,
//         phoneHeader,
//         mappings: buildMappingDict(),
//       };
//       await materialize(campaignId, body);
//       toast.success("Audience created and recipients materialized.");
//     } catch {
//       toast.error("Persist failed.");
//     } finally {
//       setPersisting(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="rounded-lg border bg-white p-4 text-sm text-gray-500">
//         Loading CSV schema…
//       </div>
//     );
//   }

//   return (
//     <section ref={topRef} className="rounded-xl border bg-white p-4 shadow-sm">
//       <h2 className="mb-3 text-sm font-semibold text-gray-800">
//         Audience via CSV
//       </h2>

//       {/* Header: expected columns + actions */}
//       <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
//         <div className="text-gray-600">
//           Expected columns:&nbsp;
//           <code className="rounded bg-gray-100 px-1.5 py-0.5">
//             {Array.isArray(schema?.headers) ? schema.headers.join(", ") : "—"}
//           </code>
//         </div>
//         <button
//           type="button"
//           onClick={handleDownloadSample}
//           className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
//         >
//           Download sample CSV
//         </button>
//         <label className="ml-auto cursor-pointer text-indigo-600 hover:underline">
//           Upload CSV
//           <input
//             type="file"
//             accept=".csv"
//             onChange={e => handleFile(e.target.files?.[0])}
//             className="hidden"
//           />
//         </label>
//       </div>

//       {/* Phone + toggles */}
//       <div className="grid gap-3 md:grid-cols-2">
//         <div className="rounded-lg border p-3">
//           <h3 className="mb-2 text-xs font-semibold text-gray-700">
//             Phone column
//           </h3>
//           <select
//             className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
//             value={phoneHeader}
//             onChange={e => setPhoneHeader(e.target.value)}
//             disabled={!(csvHeaders ?? []).length}
//           >
//             <option value="">
//               {(csvHeaders ?? []).length
//                 ? "-- Select column --"
//                 : "Upload a CSV first"}
//             </option>
//             {(csvHeaders ?? []).map(h => (
//               <option key={h} value={h}>
//                 {h}
//               </option>
//             ))}
//           </select>

//           <div className="mt-3 flex items-center gap-4 text-xs text-gray-700">
//             <label className="inline-flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={valReq.normalizePhone}
//                 onChange={e =>
//                   setValReq(v => ({ ...v, normalizePhone: e.target.checked }))
//                 }
//               />
//               Normalize phone (E.164)
//             </label>
//             <label className="inline-flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={valReq.checkDuplicates}
//                 onChange={e =>
//                   setValReq(v => ({ ...v, checkDuplicates: e.target.checked }))
//                 }
//               />
//               Deduplicate by phone
//             </label>
//           </div>
//         </div>

//         {/* Param mappings */}
//         <div className="rounded-lg border p-3">
//           <h3 className="mb-2 text-xs font-semibold text-gray-700">
//             Template parameters
//           </h3>
//           {paramMappings.length === 0 ? (
//             <p className="text-sm text-gray-500">
//               No parameters required for this template.
//             </p>
//           ) : (
//             <div className="space-y-2">
//               {paramMappings.map((m, i) => (
//                 <div
//                   key={m.index}
//                   className="grid grid-cols-[80px,100px,1fr] items-center gap-2"
//                 >
//                   <div className="text-xs text-gray-500">{`{{${m.index}}}`}</div>
//                   <select
//                     className="rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                     value={m.sourceType}
//                     onChange={e =>
//                       updateMapping(i, { sourceType: e.target.value })
//                     }
//                   >
//                     <option value="csv">CSV column</option>
//                     <option value="const">Constant</option>
//                   </select>

//                   {m.sourceType === "csv" ? (
//                     <select
//                       className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                       value={m.sourceName || ""}
//                       onChange={e =>
//                         updateMapping(i, { sourceName: e.target.value })
//                       }
//                       disabled={!(csvHeaders ?? []).length}
//                     >
//                       <option value="">
//                         {(csvHeaders ?? []).length
//                           ? "-- Select column --"
//                           : "Upload CSV"}
//                       </option>
//                       {(csvHeaders ?? []).map(h => (
//                         <option key={h} value={h}>
//                           {h}
//                         </option>
//                       ))}
//                     </select>
//                   ) : (
//                     <input
//                       className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                       placeholder="Constant value"
//                       value={m.constValue || ""}
//                       onChange={e =>
//                         updateMapping(i, { constValue: e.target.value })
//                       }
//                     />
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Sample table */}
//       <div className="mt-4 overflow-x-auto rounded-lg border">
//         <table className="min-w-full text-xs">
//           <thead className="bg-gray-100 text-gray-700">
//             <tr>
//               {(sample?.headers ?? csvHeaders ?? []).map(h => (
//                 <th key={h} className="px-3 py-2 text-left">
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//         </table>

//         {/* simple body for preview */}
//         <table className="min-w-full text-xs">
//           <tbody>
//             {Array.isArray(sample?.rows) && sample.rows.length > 0 ? (
//               sample.rows.map((row, idx) => (
//                 <tr key={idx} className="border-t">
//                   {(sample?.headers ?? csvHeaders ?? []).map(h => (
//                     <td key={h} className="px-3 py-1.5">
//                       {row?.[h] ?? ""}
//                     </td>
//                   ))}
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td
//                   className="px-3 py-2 text-gray-400"
//                   colSpan={(csvHeaders ?? []).length || 1}
//                 >
//                   No rows yet
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Actions */}
//       <div className="mt-4 flex flex-wrap items-center gap-2">
//         <button
//           type="button"
//           onClick={handleValidate}
//           disabled={!batch?.batchId}
//           className="rounded-md bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
//         >
//           Validate
//         </button>
//         <button
//           type="button"
//           onClick={handleDryRun}
//           disabled={!batch?.batchId}
//           className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
//         >
//           (Preview) Dry-run materialize
//         </button>
//         <button
//           type="button"
//           onClick={handlePersist}
//           disabled={!batch?.batchId || persisting}
//           className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
//         >
//           {persisting
//             ? "Persisting…"
//             : "Persist (create audience + recipients)"}
//         </button>
//       </div>

//       {/* Validation result */}
//       {valRes && (
//         <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
//           <div className="font-semibold">Validation</div>
//           {Array.isArray(valRes.problems) && valRes.problems.length > 0 ? (
//             <ul className="mt-1 list-disc pl-5">
//               {valRes.problems.map((p, i) => (
//                 <li key={i}>{p}</li>
//               ))}
//             </ul>
//           ) : (
//             <div className="mt-1 text-green-700">No problems found.</div>
//           )}
//         </div>
//       )}

//       {/* Dry-run preview */}
//       {dryPreview && (
//         <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
//           <div className="font-semibold">Dry-run preview</div>
//           <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-[11px] text-gray-800">
//             {JSON.stringify(dryPreview, null, 2)}
//           </pre>
//         </div>
//       )}
//     </section>
//   );
// }

// // src/pages/Campaigns/components/CsvAudienceSection.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { toast } from "react-toastify";
// import {
//   fetchCsvSchema,
//   downloadCsvSampleBlob,
//   uploadCsvBatch,
//   getBatchSample,
//   validateBatch,
//   suggestMappings,
//   saveMappings,
//   materialize,
// } from "../api/csvApi";

// // Small helper to download a Blob as a file
// function saveBlob(blob, filename) {
//   const url = window.URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   a.click();
//   window.URL.revokeObjectURL(url);
// }

// /**
//  * CsvAudienceSection
//  * Drives the end-to-end bulk personalization flow for a campaign.
//  */
// export default function CsvAudienceSection({ campaignId }) {
//   const [loading, setLoading] = useState(true);
//   const [schema, setSchema] = useState(null); // { headers, placeholderCount, parameterNames? }

//   const [file, setFile] = useState(null);
//   const [batch, setBatch] = useState(null); // { batchId, headerJson, ... }
//   const [sample, setSample] = useState(null); // { headers, rows }
//   const [valReq, setValReq] = useState({
//     normalizePhone: true,
//     checkDuplicates: true,
//   });
//   const [valRes, setValRes] = useState(null);

//   // { index:1, sourceType:"csv"|"const", sourceName:"", constValue:"" }
//   const [paramMappings, setParamMappings] = useState([]);
//   const [phoneHeader, setPhoneHeader] = useState("");
//   const [dryPreview, setDryPreview] = useState(null);
//   const [persisting, setPersisting] = useState(false);

//   const topRef = useRef(null);

//   // Load schema
//   useEffect(() => {
//     let isMounted = true;
//     (async () => {
//       try {
//         setLoading(true);
//         const sc = await fetchCsvSchema(campaignId);
//         if (!isMounted) return;
//         setSchema(sc);

//         const N = Number(sc?.placeholderCount || 0);
//         const initial = Array.from({ length: N }, (_, i) => ({
//           index: i + 1,
//           sourceType: "csv",
//           sourceName: "",
//           constValue: "",
//         }));
//         setParamMappings(initial);
//       } catch (e) {
//         toast.error("Failed to load CSV schema.");
//       } finally {
//         if (isMounted) setLoading(false);
//       }
//     })();
//     return () => {
//       isMounted = false;
//     };
//   }, [campaignId]);

//   // Prefer most concrete headers: sample.headers -> batch.headerJson -> schema.headers
//   const csvHeaders = useMemo(
//     () => sample?.headers ?? batch?.headerJson ?? schema?.headers ?? [],
//     [schema, batch, sample]
//   );

//   // Update mapping helper
//   const updateMapping = (idxZero, patch) => {
//     setParamMappings(prev => {
//       const next = [...prev];
//       next[idxZero] = { ...next[idxZero], ...patch };
//       return next;
//     });
//   };

//   // Download one-line sample (server builds correct headers)
//   const handleDownloadSample = async () => {
//     try {
//       const blob = await downloadCsvSampleBlob(campaignId);
//       saveBlob(blob, `campaign-${campaignId}-sample.csv`);
//     } catch {
//       toast.error("Could not download sample CSV.");
//     }
//   };

//   // Upload CSV -> create CsvBatch -> load first rows -> try mapping suggestions
//   const handleFile = async f => {
//     if (!f) return;
//     setFile(f);
//     try {
//       const up = await uploadCsvBatch(f, null);
//       setBatch(up);
//       toast.success("CSV uploaded.");

//       const s = await getBatchSample(up?.batchId, 10);
//       setSample(s);

//       // Guess phone column by common names (guard headers)
//       const hdrs = Array.isArray(s?.headers) ? s.headers : [];
//       const lower = hdrs.map(h => String(h).toLowerCase());
//       const guessIdx = lower.findIndex(h =>
//         ["phone", "mobile", "whatsapp", "number", "phonee164"].some(k =>
//           h.includes(k)
//         )
//       );
//       setPhoneHeader(guessIdx >= 0 ? hdrs[guessIdx] : "");

//       // Optional: backend suggestions to pre-fill param mappings
//       try {
//         const sugg = await suggestMappings(campaignId, up?.batchId);
//         if (Array.isArray(sugg?.items)) {
//           setParamMappings(prev =>
//             prev.map(p => {
//               const m = sugg.items.find(x => x.index === p.index);
//               return m ? { ...p, ...m } : p;
//             })
//           );
//         }
//       } catch {
//         /* suggestions are optional */
//       }
//     } catch (e) {
//       toast.error(e?.message || "CSV upload failed.");
//     }
//   };

//   // Validate phones & duplicates
//   const handleValidate = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");
//     if (!phoneHeader) return toast.warn("Choose the phone column.");

//     try {
//       const req = {
//         phoneHeader,
//         requiredHeaders: [], // params may be constants
//         normalizePhone: !!valReq.normalizePhone,
//         checkDuplicates: !!valReq.checkDuplicates,
//       };
//       const res = await validateBatch(batch.batchId, req);
//       setValRes(res);
//       if (Array.isArray(res?.problems) && res.problems.length > 0) {
//         toast.warn(`Validation found ${res.problems.length} issue(s).`);
//       } else {
//         toast.success("Validation passed.");
//       }
//     } catch {
//       toast.error("Validation call failed.");
//     }
//   };

//   // Build DTO we send to saveMappings/materialize
//   const buildMappingsDto = () => ({
//     items: paramMappings.map(m => ({
//       component: "param",
//       index: m.index,
//       sourceType: m.sourceType,
//       sourceName: m.sourceType === "csv" ? m.sourceName || null : null,
//       constValue: m.sourceType === "const" ? m.constValue ?? "" : null,
//     })),
//   });

//   // Dry-run (no DB writes)
//   const handleDryRun = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");
//     if (!phoneHeader) return toast.warn("Choose the phone column.");

//     try {
//       await saveMappings(campaignId, buildMappingsDto());

//       const body = {
//         mode: "dryRun",
//         batchId: batch.batchId,
//         normalizePhone: !!valReq.normalizePhone,
//         deduplicate: !!valReq.checkDuplicates,
//         phoneHeader,
//         mappings: buildMappingsDto().items,
//       };
//       const preview = await materialize(campaignId, body);
//       setDryPreview(preview);
//       toast.success("Dry-run ready.");
//       topRef.current?.scrollIntoView({ behavior: "smooth" });
//     } catch {
//       toast.error("Dry-run failed.");
//     }
//   };

//   // Commit (creates Audience + AudienceMembers + CampaignRecipients)
//   const handlePersist = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");
//     setPersisting(true);
//     try {
//       const body = {
//         mode: "commit",
//         batchId: batch.batchId,
//         normalizePhone: !!valReq.normalizePhone,
//         deduplicate: !!valReq.checkDuplicates,
//         phoneHeader,
//         mappings: buildMappingsDto().items,
//       };
//       await materialize(campaignId, body);
//       toast.success("Audience created and recipients materialized.");
//     } catch {
//       toast.error("Persist failed.");
//     } finally {
//       setPersisting(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="rounded-lg border bg-white p-4 text-sm text-gray-500">
//         Loading CSV schema…
//       </div>
//     );
//   }

//   return (
//     <section ref={topRef} className="rounded-xl border bg-white p-4 shadow-sm">
//       <h2 className="mb-3 text-sm font-semibold text-gray-800">
//         Audience via CSV
//       </h2>

//       {/* Header: expected columns + actions */}
//       <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
//         <div className="text-gray-600">
//           Expected columns:&nbsp;
//           <code className="rounded bg-gray-100 px-1.5 py-0.5">
//             {Array.isArray(schema?.headers) ? schema.headers.join(", ") : "—"}
//           </code>
//         </div>
//         <button
//           type="button"
//           onClick={handleDownloadSample}
//           className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
//         >
//           Download sample CSV
//         </button>
//         <label className="ml-auto cursor-pointer text-indigo-600 hover:underline">
//           Upload CSV
//           <input
//             type="file"
//             accept=".csv"
//             onChange={e => handleFile(e.target.files?.[0])}
//             className="hidden"
//           />
//         </label>
//       </div>

//       {/* Phone + toggles */}
//       <div className="grid gap-3 md:grid-cols-2">
//         <div className="rounded-lg border p-3">
//           <h3 className="mb-2 text-xs font-semibold text-gray-700">
//             Phone column
//           </h3>
//           <select
//             className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
//             value={phoneHeader}
//             onChange={e => setPhoneHeader(e.target.value)}
//             disabled={!(csvHeaders ?? []).length}
//           >
//             <option value="">
//               {(csvHeaders ?? []).length
//                 ? "-- Select column --"
//                 : "Upload a CSV first"}
//             </option>
//             {(csvHeaders ?? []).map(h => (
//               <option key={h} value={h}>
//                 {h}
//               </option>
//             ))}
//           </select>

//           <div className="mt-3 flex items-center gap-4 text-xs text-gray-700">
//             <label className="inline-flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={valReq.normalizePhone}
//                 onChange={e =>
//                   setValReq(v => ({ ...v, normalizePhone: e.target.checked }))
//                 }
//               />
//               Normalize phone (E.164)
//             </label>
//             <label className="inline-flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={valReq.checkDuplicates}
//                 onChange={e =>
//                   setValReq(v => ({ ...v, checkDuplicates: e.target.checked }))
//                 }
//               />
//               Deduplicate by phone
//             </label>
//           </div>
//         </div>

//         {/* Param mappings */}
//         <div className="rounded-lg border p-3">
//           <h3 className="mb-2 text-xs font-semibold text-gray-700">
//             Template parameters
//           </h3>
//           {paramMappings.length === 0 ? (
//             <p className="text-sm text-gray-500">
//               No parameters required for this template.
//             </p>
//           ) : (
//             <div className="space-y-2">
//               {paramMappings.map((m, i) => (
//                 <div
//                   key={m.index}
//                   className="grid grid-cols-[80px,100px,1fr] items-center gap-2"
//                 >
//                   <div className="text-xs text-gray-500">{`{{${m.index}}}`}</div>
//                   <select
//                     className="rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                     value={m.sourceType}
//                     onChange={e =>
//                       updateMapping(i, { sourceType: e.target.value })
//                     }
//                   >
//                     <option value="csv">CSV column</option>
//                     <option value="const">Constant</option>
//                   </select>

//                   {m.sourceType === "csv" ? (
//                     <select
//                       className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                       value={m.sourceName || ""}
//                       onChange={e =>
//                         updateMapping(i, { sourceName: e.target.value })
//                       }
//                       disabled={!(csvHeaders ?? []).length}
//                     >
//                       <option value="">
//                         {(csvHeaders ?? []).length
//                           ? "-- Select column --"
//                           : "Upload CSV"}
//                       </option>
//                       {(csvHeaders ?? []).map(h => (
//                         <option key={h} value={h}>
//                           {h}
//                         </option>
//                       ))}
//                     </select>
//                   ) : (
//                     <input
//                       className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                       placeholder="Constant value"
//                       value={m.constValue || ""}
//                       onChange={e =>
//                         updateMapping(i, { constValue: e.target.value })
//                       }
//                     />
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Sample table */}
//       <div className="mt-4 overflow-x-auto rounded-lg border">
//         <table className="min-w-full text-xs">
//           <thead className="bg-gray-100 text-gray-700">
//             <tr>
//               {(sample?.headers ?? csvHeaders ?? []).map(h => (
//                 <th key={h} className="px-3 py-2 text-left">
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {Array.isArray(sample?.rows) && sample.rows.length > 0 ? (
//               sample.rows.map((row, idx) => (
//                 <tr key={idx} className="border-t">
//                   {(sample?.headers ?? csvHeaders ?? []).map(h => (
//                     <td key={h} className="px-3 py-1.5">
//                       {row?.[h] ?? ""}
//                     </td>
//                   ))}
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td
//                   className="px-3 py-2 text-gray-400"
//                   colSpan={(csvHeaders ?? []).length || 1}
//                 >
//                   No rows yet
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Actions */}
//       <div className="mt-4 flex flex-wrap items-center gap-2">
//         <button
//           type="button"
//           onClick={handleValidate}
//           disabled={!batch?.batchId}
//           className="rounded-md bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
//         >
//           Validate
//         </button>
//         <button
//           type="button"
//           onClick={handleDryRun}
//           disabled={!batch?.batchId}
//           className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
//         >
//           (Perview) Dry-run materialize
//         </button>
//         <button
//           type="button"
//           onClick={handlePersist}
//           disabled={!batch?.batchId || persisting}
//           className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
//         >
//           {persisting
//             ? "Persisting…"
//             : "Persist (create audience + recipients)"}
//         </button>
//       </div>

//       {/* Validation result */}
//       {valRes && (
//         <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
//           <div className="font-semibold">Validation</div>
//           {Array.isArray(valRes.problems) && valRes.problems.length > 0 ? (
//             <ul className="mt-1 list-disc pl-5">
//               {valRes.problems.map((p, i) => (
//                 <li key={i}>{p}</li>
//               ))}
//             </ul>
//           ) : (
//             <div className="mt-1 text-green-700">No problems found.</div>
//           )}
//         </div>
//       )}

//       {/* Dry-run preview */}
//       {dryPreview && (
//         <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
//           <div className="font-semibold">Dry-run preview</div>
//           <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-[11px] text-gray-800">
//             {JSON.stringify(dryPreview, null, 2)}
//           </pre>
//         </div>
//       )}
//     </section>
//   );
// }

// // src/pages/Campaigns/components/CsvAudienceSection.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { toast } from "react-toastify";
// import {
//   fetchCsvSchema,
//   downloadCsvSampleBlob,
//   uploadCsvBatch,
//   getBatchSample,
//   validateBatch,
//   suggestMappings,
//   saveMappings,
//   materialize,
// } from "../api/csvApi";

// // Small helper to download a Blob as a file
// function saveBlob(blob, filename) {
//   const url = window.URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   a.click();
//   window.URL.revokeObjectURL(url);
// }

// /**
//  * CsvAudienceSection
//  * Drives the end-to-end bulk personalization flow for a campaign:
//  * 1) GET /campaigns/{id}/csv-sample/schema   -> learn required headers + param count
//  * 2) Download sample (optional)
//  * 3) Upload CSV (multipart)                   -> POST /csv/batch
//  * 4) Preview first rows                       -> GET /csv/batch/{batchId}/sample
//  * 5) Map phone + params (CSV column or constant)
//  * 6) Validate                                 -> POST /csv/batch/{batchId}/validate
//  * 7) Dry-run                                  -> POST /campaigns/{id}/materialize { mode: "dryRun" }
//  * 8) Persist                                  -> POST /campaigns/{id}/materialize { mode: "commit" }
//  */
// export default function CsvAudienceSection({ campaignId }) {
//   const [loading, setLoading] = useState(true);
//   const [schema, setSchema] = useState(null); // { headers, placeholderCount, parameterNames? }

//   const [file, setFile] = useState(null);
//   const [batch, setBatch] = useState(null); // { batchId, headerJson, ... }
//   const [sample, setSample] = useState(null); // { headers, rows }
//   const [valReq, setValReq] = useState({
//     normalizePhone: true,
//     checkDuplicates: true,
//   });
//   const [valRes, setValRes] = useState(null);

//   // For each template param {{1}}..{{N}}:
//   // { index:1, sourceType:"csv"|"const", sourceName:"", constValue:"" }
//   const [paramMappings, setParamMappings] = useState([]);
//   const [phoneHeader, setPhoneHeader] = useState("");
//   const [dryPreview, setDryPreview] = useState(null);
//   const [persisting, setPersisting] = useState(false);

//   const topRef = useRef(null);

//   // Load schema (single source of truth for how many params are needed)
//   useEffect(() => {
//     let isMounted = true;
//     (async () => {
//       try {
//         setLoading(true);
//         const sc = await fetchCsvSchema(campaignId);
//         if (!isMounted) return;
//         setSchema(sc);

//         const N = Number(sc?.placeholderCount || 0);
//         const initial = Array.from({ length: N }, (_, i) => ({
//           index: i + 1,
//           sourceType: "csv",
//           sourceName: "",
//           constValue: "",
//         }));
//         setParamMappings(initial);
//       } catch (e) {
//         toast.error("Failed to load CSV schema.");
//       } finally {
//         if (isMounted) setLoading(false);
//       }
//     })();
//     return () => {
//       isMounted = false;
//     };
//   }, [campaignId]);

//   // Prefer most concrete headers: sample.headers -> batch.headerJson -> schema.headers
//   const csvHeaders = useMemo(
//     () => sample?.headers || batch?.headerJson || schema?.headers || [],
//     [schema, batch, sample]
//   );

//   // Update mapping helper
//   const updateMapping = (idxZero, patch) => {
//     setParamMappings(prev => {
//       const next = [...prev];
//       next[idxZero] = { ...next[idxZero], ...patch };
//       return next;
//     });
//   };

//   // Download one-line sample (server builds correct headers)
//   const handleDownloadSample = async () => {
//     try {
//       const blob = await downloadCsvSampleBlob(campaignId);
//       saveBlob(blob, `campaign-${campaignId}-sample.csv`);
//     } catch {
//       toast.error("Could not download sample CSV.");
//     }
//   };

//   // Upload CSV -> create CsvBatch -> load first rows -> try mapping suggestions
//   const handleFile = async f => {
//     if (!f) return;
//     setFile(f);
//     try {
//       const up = await uploadCsvBatch(f, null);
//       setBatch(up);
//       toast.success("CSV uploaded.");

//       const s = await getBatchSample(up.batchId, 10);
//       setSample(s);

//       // Guess phone column by common names
//       const lower = s.headers.map(h => String(h).toLowerCase());
//       const guessIdx = lower.findIndex(h =>
//         ["phone", "mobile", "whatsapp", "number", "phonee164"].some(k =>
//           h.includes(k)
//         )
//       );
//       setPhoneHeader(guessIdx >= 0 ? s.headers[guessIdx] : "");

//       // Optional: backend suggestions to pre-fill param mappings
//       try {
//         const sugg = await suggestMappings(campaignId, up.batchId);
//         if (Array.isArray(sugg?.items)) {
//           setParamMappings(prev =>
//             prev.map(p => {
//               const m = sugg.items.find(x => x.index === p.index);
//               return m ? { ...p, ...m } : p;
//             })
//           );
//         }
//       } catch {
//         // suggestions are optional
//       }
//     } catch (e) {
//       toast.error(e?.message || "CSV upload failed.");
//     }
//   };

//   // Validate phones & duplicates
//   const handleValidate = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");
//     if (!phoneHeader) return toast.warn("Choose the phone column.");

//     try {
//       const req = {
//         phoneHeader,
//         requiredHeaders: [], // params may be constants; we don't force CSV headers
//         normalizePhone: !!valReq.normalizePhone,
//         checkDuplicates: !!valReq.checkDuplicates,
//       };
//       const res = await validateBatch(batch.batchId, req);
//       setValRes(res);
//       if (Array.isArray(res?.problems) && res.problems.length > 0) {
//         toast.warn(`Validation found ${res.problems.length} issue(s).`);
//       } else {
//         toast.success("Validation passed.");
//       }
//     } catch {
//       toast.error("Validation call failed.");
//     }
//   };

//   // Build DTO we send to saveMappings/materialize
//   const buildMappingsDto = () => ({
//     items: paramMappings.map(m => ({
//       component: "param",
//       index: m.index,
//       sourceType: m.sourceType,
//       sourceName: m.sourceType === "csv" ? m.sourceName || null : null,
//       constValue: m.sourceType === "const" ? m.constValue ?? "" : null,
//     })),
//   });

//   // Dry-run (no DB writes)
//   const handleDryRun = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");
//     if (!phoneHeader) return toast.warn("Choose the phone column.");

//     try {
//       // Keep backend in sync with what user chose
//       await saveMappings(campaignId, buildMappingsDto());

//       const body = {
//         mode: "dryRun",
//         batchId: batch.batchId,
//         normalizePhone: !!valReq.normalizePhone,
//         deduplicate: !!valReq.checkDuplicates,
//         phoneHeader,
//         mappings: buildMappingsDto().items, // sent inline as well
//       };
//       const preview = await materialize(campaignId, body);
//       setDryPreview(preview);
//       toast.success("Dry-run ready.");
//       topRef.current?.scrollIntoView({ behavior: "smooth" });
//     } catch {
//       toast.error("Dry-run failed.");
//     }
//   };

//   // Commit (creates Audience + AudienceMembers + CampaignRecipients)
//   const handlePersist = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");
//     setPersisting(true);
//     try {
//       const body = {
//         mode: "commit",
//         batchId: batch.batchId,
//         normalizePhone: !!valReq.normalizePhone,
//         deduplicate: !!valReq.checkDuplicates,
//         phoneHeader,
//         mappings: buildMappingsDto().items,
//       };
//       const result = await materialize(campaignId, body);
//       toast.success("Audience created and recipients materialized.");
//       // You can surface counts from `result` if your API returns them
//       // console.log(result);
//     } catch {
//       toast.error("Persist failed.");
//     } finally {
//       setPersisting(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="rounded-lg border bg-white p-4 text-sm text-gray-500">
//         Loading CSV schema…
//       </div>
//     );
//   }

//   return (
//     <section ref={topRef} className="rounded-xl border bg-white p-4 shadow-sm">
//       <h2 className="mb-3 text-sm font-semibold text-gray-800">
//         Audience via CSV
//       </h2>

//       {/* Header: expected columns + actions */}
//       <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
//         <div className="text-gray-600">
//           Expected columns:&nbsp;
//           <code className="rounded bg-gray-100 px-1.5 py-0.5">
//             {Array.isArray(schema?.headers) ? schema.headers.join(", ") : "—"}
//           </code>
//         </div>
//         <button
//           type="button"
//           onClick={handleDownloadSample}
//           className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
//         >
//           Download sample CSV
//         </button>
//         <label className="ml-auto cursor-pointer text-indigo-600 hover:underline">
//           Upload CSV
//           <input
//             type="file"
//             accept=".csv"
//             onChange={e => handleFile(e.target.files?.[0])}
//             className="hidden"
//           />
//         </label>
//       </div>

//       {/* Phone + toggles */}
//       <div className="grid gap-3 md:grid-cols-2">
//         <div className="rounded-lg border p-3">
//           <h3 className="mb-2 text-xs font-semibold text-gray-700">
//             Phone column
//           </h3>
//           <select
//             className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
//             value={phoneHeader}
//             onChange={e => setPhoneHeader(e.target.value)}
//             disabled={!csvHeaders.length}
//           >
//             <option value="">
//               {csvHeaders.length ? "-- Select column --" : "Upload a CSV first"}
//             </option>
//             {csvHeaders.map(h => (
//               <option key={h} value={h}>
//                 {h}
//               </option>
//             ))}
//           </select>

//           <div className="mt-3 flex items-center gap-4 text-xs text-gray-700">
//             <label className="inline-flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={valReq.normalizePhone}
//                 onChange={e =>
//                   setValReq(v => ({ ...v, normalizePhone: e.target.checked }))
//                 }
//               />
//               Normalize phone (E.164)
//             </label>
//             <label className="inline-flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={valReq.checkDuplicates}
//                 onChange={e =>
//                   setValReq(v => ({ ...v, checkDuplicates: e.target.checked }))
//                 }
//               />
//               Deduplicate by phone
//             </label>
//           </div>
//         </div>

//         {/* Param mappings */}
//         <div className="rounded-lg border p-3">
//           <h3 className="mb-2 text-xs font-semibold text-gray-700">
//             Template parameters
//           </h3>
//           {paramMappings.length === 0 ? (
//             <p className="text-sm text-gray-500">
//               No parameters required for this template.
//             </p>
//           ) : (
//             <div className="space-y-2">
//               {paramMappings.map((m, i) => (
//                 <div
//                   key={m.index}
//                   className="grid grid-cols-[80px,100px,1fr] items-center gap-2"
//                 >
//                   <div className="text-xs text-gray-500">{`{{${m.index}}}`}</div>
//                   <select
//                     className="rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                     value={m.sourceType}
//                     onChange={e =>
//                       updateMapping(i, { sourceType: e.target.value })
//                     }
//                   >
//                     <option value="csv">CSV column</option>
//                     <option value="const">Constant</option>
//                   </select>

//                   {m.sourceType === "csv" ? (
//                     <select
//                       className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                       value={m.sourceName || ""}
//                       onChange={e =>
//                         updateMapping(i, { sourceName: e.target.value })
//                       }
//                       disabled={!csvHeaders.length}
//                     >
//                       <option value="">
//                         {csvHeaders.length
//                           ? "-- Select column --"
//                           : "Upload CSV"}
//                       </option>
//                       {csvHeaders.map(h => (
//                         <option key={h} value={h}>
//                           {h}
//                         </option>
//                       ))}
//                     </select>
//                   ) : (
//                     <input
//                       className="w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                       placeholder="Constant value"
//                       value={m.constValue || ""}
//                       onChange={e =>
//                         updateMapping(i, { constValue: e.target.value })
//                       }
//                     />
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Sample table */}
//       <div className="mt-4 overflow-x-auto rounded-lg border">
//         <table className="min-w-full text-xs">
//           <thead className="bg-gray-100 text-gray-700">
//             <tr>
//               {(sample?.headers || csvHeaders).map(h => (
//                 <th key={h} className="px-3 py-2 text-left">
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {Array.isArray(sample?.rows) && sample.rows.length > 0 ? (
//               sample.rows.map((row, idx) => (
//                 <tr key={idx} className="border-t">
//                   {(sample.headers || csvHeaders).map(h => (
//                     <td key={h} className="px-3 py-1.5">
//                       {row[h]}
//                     </td>
//                   ))}
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td
//                   className="px-3 py-2 text-gray-400"
//                   colSpan={(csvHeaders || []).length || 1}
//                 >
//                   No rows yet
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Actions */}
//       <div className="mt-4 flex flex-wrap items-center gap-2">
//         <button
//           type="button"
//           onClick={handleValidate}
//           disabled={!batch?.batchId}
//           className="rounded-md bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
//         >
//           Validate
//         </button>
//         <button
//           type="button"
//           onClick={handleDryRun}
//           disabled={!batch?.batchId}
//           className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
//         >
//           Dry-run materialize
//         </button>
//         <button
//           type="button"
//           onClick={handlePersist}
//           disabled={!batch?.batchId || persisting}
//           className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
//         >
//           {persisting
//             ? "Persisting…"
//             : "Persist (create audience + recipients)"}
//         </button>
//       </div>

//       {/* Validation result */}
//       {valRes && (
//         <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
//           <div className="font-semibold">Validation</div>
//           {Array.isArray(valRes.problems) && valRes.problems.length > 0 ? (
//             <ul className="mt-1 list-disc pl-5">
//               {valRes.problems.map((p, i) => (
//                 <li key={i}>{p}</li>
//               ))}
//             </ul>
//           ) : (
//             <div className="mt-1 text-green-700">No problems found.</div>
//           )}
//         </div>
//       )}

//       {/* Dry-run preview (render raw JSON to stay service-agnostic) */}
//       {dryPreview && (
//         <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
//           <div className="font-semibold">Dry-run preview</div>
//           <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-[11px] text-gray-800">
//             {JSON.stringify(dryPreview, null, 2)}
//           </pre>
//         </div>
//       )}
//     </section>
//   );
// }
