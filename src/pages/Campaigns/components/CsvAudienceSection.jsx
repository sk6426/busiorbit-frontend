// src/pages/Campaigns/components/CsvAudienceSection.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom"; // ⟵ add
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
  parameter1: ["param1", "body1"],
  parameter2: ["param2", "body2"],
  parameter3: ["param3", "body3"],
  parameter4: ["param4", "body4"],
  parameter5: ["param5", "body5"],
  headerpara1: ["header1", "headerparam1"],
  headerpara2: ["header2", "headerparam2"],
  headerpara3: ["header3", "headerparam3"],
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

  // 3) parameterN convenience
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

export default function CsvAudienceSection({
  campaignId,
  audienceName: propAudienceName, // ← you pass campaign name from parent
}) {
  const navigate = useNavigate(); // ⟵ add
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

  const [dryPreview, setDryPreview] = useState(null);
  const [persisting, setPersisting] = useState(false);

  const [showMapping, setShowMapping] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // spinner flag
  const topRef = useRef(null);

  // Effective audience name (campaign name preferred; fallback to date label)
  const effectiveAudienceName = useMemo(() => {
    const trimmed = String(propAudienceName || "").trim();
    if (trimmed) return trimmed;
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `Audience ${yyyy}-${mm}-${dd}`;
  }, [propAudienceName]);

  // Load schema
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const sc = await fetchCsvSchema(campaignId);
        if (!alive) return;
        setSchema(sc);

        const keys = Array.isArray(sc?.headers) ? sc.headers : [];
        setExpectedKeys(keys);

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
    setIsUploading(true);
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

      // Auto-map explicit keys
      const km = autoPick(hdrs, expectedKeys);
      setKeyToColumn(km);

      // Seed legacy body placeholders
      setParamMappings(prev =>
        prev.map(p => {
          const key = `parameter${p.index}`;
          return km[key] ? { ...p, sourceName: km[key] } : p;
        })
      );

      // Optional server suggestions
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
    } finally {
      setIsUploading(false);
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

  // Build mapping dict
  const buildMappingDict = () => {
    const dict = {};
    for (const m of paramMappings) {
      const key = `parameter${m.index}`;
      dict[key] =
        m.sourceType === "csv"
          ? m.sourceName || ""
          : `constant:${m.constValue ?? ""}`;
    }
    for (const [k, v] of Object.entries(keyToColumn || {})) {
      if (!v) continue;
      if (/^parameter\d+$/i.test(k)) continue;
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
    const nameToUse = effectiveAudienceName;
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
        audienceName: nameToUse,
      };
      await materialize(campaignId, body);

      toast.success("Done!! Saved Successfully.");

      // ⟵ Redirect after successful save
      // Prefer router navigation; fall back to hard redirect if needed.
      const target = "/app/campaigns/template-campaigns-list";
      try {
        navigate(target, { replace: true });
      } catch {
        if (typeof window !== "undefined") {
          window.location.assign(target);
        }
      }
    } catch {
      toast.error("Persist failed.");
    } finally {
      setPersisting(false);
    }
  };

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
      {/* Expected columns + actions */}
      <div className="mb-4 flex items-center gap-3 text-sm">
        <div className="text-gray-600">
          Expected columns:&nbsp;
          <code className="rounded bg-gray-100 px-1.5 py-0.5">
            {["phone", ...(schema?.headers || [])].join(", ")}
          </code>
        </div>

        {/* Right-aligned paired buttons */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadSample}
            disabled={isUploading}
            className={`inline-flex items-center gap-2 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isUploading
                ? "cursor-not-allowed opacity-50 text-indigo-500"
                : "text-indigo-700 hover:bg-indigo-50"
            }`}
          >
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
              <path d="M12 3v12" />
              <path d="m8 11 4 4 4-4" />
              <path d="M5 21h14" />
            </svg>
            Download sample CSV
          </button>

          <div>
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              onChange={e => {
                const f = e.target.files?.[0];
                handleFile(f);
                e.target.value = ""; // allow re-selecting the same file
              }}
              className="sr-only"
              disabled={isUploading}
            />
            <label
              htmlFor="csv-file-input"
              aria-disabled={isUploading}
              className={`inline-flex items-center gap-2 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                isUploading
                  ? "pointer-events-none opacity-50 text-indigo-500"
                  : "text-indigo-700 hover:bg-indigo-50"
              }`}
            >
              {isUploading ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" className="opacity-25" />
                  <path d="M21 12a9 9 0 0 1-9 9" className="opacity-75" />
                </svg>
              ) : (
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
              )}
              {isUploading ? "Uploading…" : "Upload CSV"}
            </label>
          </div>
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
            disabled={!(csvHeaders ?? []).length || isUploading}
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
                disabled={isUploading}
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
                disabled={isUploading}
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
            className="mt-2 text-xs text-indigo-600 hover:underline disabled:opacity-50"
            onClick={() => setShowMapping(s => !s)}
            disabled={!(csvHeaders ?? []).length || isUploading}
          >
            {showMapping ? "Hide mapping" : "Edit mapping"}
          </button>

          {showMapping && (
            <div className="mt-3 space-y-2">
              {/* Non-body keys */}
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
                      disabled={!(csvHeaders ?? []).length || isUploading}
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

              {/* Body placeholders */}
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
                          disabled={isUploading}
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
                            disabled={!(csvHeaders ?? []).length || isUploading}
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
                            disabled={isUploading}
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
          disabled={!batch?.batchId || isUploading}
          className="rounded-md bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Validate
        </button>
        <button
          type="button"
          onClick={handleDryRun}
          disabled={!batch?.batchId || isUploading}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          (Preview) Dry-run materialize
        </button>
        <button
          type="button"
          onClick={handlePersist}
          disabled={!batch?.batchId || persisting || isUploading}
          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {persisting ? "saving" : "Save Contact"}
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

// // Aliases to help auto-map
// const ALIASES = {
//   // parameterN
//   parameter1: ["param1", "body1"],
//   parameter2: ["param2", "body2"],
//   parameter3: ["param3", "body3"],
//   parameter4: ["param4", "body4"],
//   parameter5: ["param5", "body5"],
//   // header text
//   headerpara1: ["header1", "headerparam1"],
//   headerpara2: ["header2", "headerparam2"],
//   headerpara3: ["header3", "headerparam3"],
//   // buttons
//   buttonpara1: ["btn1", "button1", "url1", "buttonparam1"],
//   buttonpara2: ["btn2", "button2", "url2", "buttonparam2"],
//   buttonpara3: ["btn3", "button3", "url3", "buttonparam3"],
// };

// // Auto-pick CSV columns for expected keys.
// function autoPick(headers, wants) {
//   const map = {};
//   const used = new Set();
//   const H = headers.map(h => ({ raw: h, k: norm(h) }));

//   // 1) exact (case-insensitive)
//   for (const key of wants) {
//     const hit = headers.find(h => norm(h) === norm(key));
//     if (hit) {
//       map[key] = hit;
//       used.add(hit);
//     }
//   }

//   // 2) aliases
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

//   // 3) parameterN convenience (match "paramN" or "bodyN")
//   for (const key of wants) {
//     if (map[key]) continue;
//     const m = key.match(/^parameter(\d+)$/i);
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

//   return map;
// }

// /* ---------------- Component ---------------- */

// export default function CsvAudienceSection({
//   campaignId,
//   audienceName: propAudienceName, // ← you pass campaign name from parent
// }) {
//   const [loading, setLoading] = useState(true);
//   const [schema, setSchema] = useState(null);

//   const [batch, setBatch] = useState(null);
//   const [sample, setSample] = useState(null);
//   const [valReq, setValReq] = useState({
//     normalizePhone: true,
//     checkDuplicates: true,
//   });
//   const [valRes, setValRes] = useState(null);

//   // {{n}} mapping UI (body placeholders)
//   const [paramMappings, setParamMappings] = useState([]);
//   // Explicit mapping for headerparaN / buttonparaN
//   const [expectedKeys, setExpectedKeys] = useState([]); // EXACTLY as backend returns
//   const [keyToColumn, setKeyToColumn] = useState({});

//   const [phoneHeader, setPhoneHeader] = useState("");

//   const [dryPreview, setDryPreview] = useState(null);
//   const [persisting, setPersisting] = useState(false);

//   const [showMapping, setShowMapping] = useState(false);
//   const [isUploading, setIsUploading] = useState(false); // ⟵ spinner flag
//   const topRef = useRef(null);

//   // Effective audience name (campaign name preferred; fallback to date label)
//   const effectiveAudienceName = useMemo(() => {
//     const trimmed = String(propAudienceName || "").trim();
//     if (trimmed) return trimmed;
//     const d = new Date();
//     const yyyy = d.getFullYear();
//     const mm = String(d.getMonth() + 1).padStart(2, "0");
//     const dd = String(d.getDate()).padStart(2, "0");
//     return `Audience ${yyyy}-${mm}-${dd}`;
//   }, [propAudienceName]);

//   // Load schema
//   useEffect(() => {
//     let alive = true;
//     (async () => {
//       try {
//         setLoading(true);
//         const sc = await fetchCsvSchema(campaignId);
//         if (!alive) return;
//         setSchema(sc);

//         const keys = Array.isArray(sc?.headers) ? sc.headers : [];
//         setExpectedKeys(keys);

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
//     setIsUploading(true);
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

//       // Auto-map explicit keys
//       const km = autoPick(hdrs, expectedKeys);
//       setKeyToColumn(km);

//       // Seed legacy body placeholders
//       setParamMappings(prev =>
//         prev.map(p => {
//           const key = `parameter${p.index}`;
//           return km[key] ? { ...p, sourceName: km[key] } : p;
//         })
//       );

//       // Optional server suggestions
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
//       } catch {}
//       setShowMapping(false);
//     } catch (e) {
//       toast.error(e?.message || "CSV upload failed.");
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   const handleValidate = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");
//     if (!phoneHeader) return toast.warn("Choose the phone column.");

//     try {
//       const req = {
//         phoneHeader,
//         requiredHeaders: [],
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

//   // Build mapping dict
//   const buildMappingDict = () => {
//     const dict = {};
//     for (const m of paramMappings) {
//       const key = `parameter${m.index}`;
//       dict[key] =
//         m.sourceType === "csv"
//           ? m.sourceName || ""
//           : `constant:${m.constValue ?? ""}`;
//     }
//     for (const [k, v] of Object.entries(keyToColumn || {})) {
//       if (!v) continue;
//       if (/^parameter\d+$/i.test(k)) continue;
//       dict[k] = v;
//     }
//     return dict;
//   };

//   const handleDryRun = async () => {
//     if (!batch?.batchId) return toast.warn("Upload a CSV first.");
//     try {
//       await saveMappings(campaignId, buildMappingDict());
//       const body = {
//         csvBatchId: batch.batchId,
//         mappings: buildMappingDict(),
//         phoneField: phoneHeader || undefined,
//         normalizePhones: !!valReq.normalizePhone,
//         deduplicate: !!valReq.checkDuplicates,
//         persist: false,
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
//     const nameToUse = effectiveAudienceName;
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
//         audienceName: nameToUse,
//       };
//       await materialize(campaignId, body);
//       toast.success("Done!! Saved Successfully.");
//     } catch {
//       toast.error("Persist failed.");
//     } finally {
//       setPersisting(false);
//     }
//   };

//   const visibleKeys = useMemo(
//     () => (expectedKeys || []).filter(k => !/^parameter\d+$/i.test(k)),
//     [expectedKeys]
//   );
//   const mappingStatus = useMemo(() => {
//     if (!visibleKeys.length) return { label: "No extra params", ok: true };
//     const missing = visibleKeys.filter(k => !keyToColumn[k]);
//     return missing.length
//       ? { label: `${missing.length} missing`, ok: false }
//       : { label: "All mapped", ok: true };
//   }, [visibleKeys, keyToColumn]);

//   if (loading) {
//     return (
//       <div className="rounded-lg border bg-white p-4 text-sm text-gray-500">
//         Loading CSV schema…
//       </div>
//     );
//   }

//   return (
//     <section ref={topRef} className="rounded-xl border bg-white p-4 shadow-sm">
//       {/* <h2 className="mb-3 text-sm font-semibold text-gray-800">
//         Audience via CSV
//       </h2> */}

//       {/* Expected columns + actions */}
//       <div className="mb-4 flex items-center gap-3 text-sm">
//         <div className="text-gray-600">
//           Expected columns:&nbsp;
//           <code className="rounded bg-gray-100 px-1.5 py-0.5">
//             {["phone", ...(schema?.headers || [])].join(", ")}
//           </code>
//         </div>

//         {/* Right-aligned paired buttons */}
//         <div className="ml-auto flex items-center gap-2">
//           <button
//             type="button"
//             onClick={handleDownloadSample}
//             disabled={isUploading}
//             className={`inline-flex items-center gap-2 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
//               isUploading
//                 ? "cursor-not-allowed opacity-50 text-indigo-500"
//                 : "text-indigo-700 hover:bg-indigo-50"
//             }`}
//           >
//             {/* Download icon */}
//             <svg
//               aria-hidden="true"
//               viewBox="0 0 24 24"
//               className="h-4 w-4"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="1.8"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//             >
//               <path d="M12 3v12" />
//               <path d="m8 11 4 4 4-4" />
//               <path d="M5 21h14" />
//             </svg>
//             Download sample CSV
//           </button>

//           <div>
//             <input
//               id="csv-file-input"
//               type="file"
//               accept=".csv"
//               onChange={e => {
//                 const f = e.target.files?.[0];
//                 handleFile(f);
//                 // allow selecting the same file again
//                 e.target.value = "";
//               }}
//               className="sr-only"
//               disabled={isUploading}
//             />
//             <label
//               htmlFor="csv-file-input"
//               aria-disabled={isUploading}
//               className={`inline-flex items-center gap-2 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
//                 isUploading
//                   ? "pointer-events-none opacity-50 text-indigo-500"
//                   : "text-indigo-700 hover:bg-indigo-50"
//               }`}
//             >
//               {/* Upload / Spinner icon */}
//               {isUploading ? (
//                 <svg
//                   aria-hidden="true"
//                   viewBox="0 0 24 24"
//                   className="h-4 w-4 animate-spin"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="2"
//                 >
//                   <circle cx="12" cy="12" r="9" className="opacity-25" />
//                   <path d="M21 12a9 9 0 0 1-9 9" className="opacity-75" />
//                 </svg>
//               ) : (
//                 <svg
//                   aria-hidden="true"
//                   viewBox="0 0 24 24"
//                   className="h-4 w-4"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="1.8"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 >
//                   <path d="M16 16.5a4 4 0 0 0-1-7.9 5 5 0 0 0-9.8 1.2 3.5 3.5 0 0 0 .7 6.9h2" />
//                   <path d="M12 12v8" />
//                   <path d="m8.5 15.5 3.5-3.5 3.5 3.5" />
//                 </svg>
//               )}
//               {isUploading ? "Uploading…" : "Upload CSV"}
//             </label>
//           </div>
//         </div>
//       </div>

//       {/* Helper note */}
//       <div className="mb-3 rounded-md border border-dashed border-gray-200 bg-gray-50 p-2 text-[11px] text-gray-600">
//         We set any media URL once at <strong>campaign creation</strong> (not in
//         CSV). Your CSV should contain <code>phone</code>, body values as{" "}
//         <code>parameter1…N</code>, plus any <code>headerparaN</code> and{" "}
//         <code>buttonparaN</code> columns if the template needs them.
//       </div>

//       {/* Phone + toggles and mapping */}
//       <div className="grid gap-3 md:grid-cols-2">
//         <div className="rounded-lg border p-3">
//           <h3 className="mb-2 text-xs font-semibold text-gray-700">
//             Phone column
//           </h3>
//           <select
//             className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
//             value={phoneHeader}
//             onChange={e => setPhoneHeader(e.target.value)}
//             disabled={!(csvHeaders ?? []).length || isUploading}
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
//                 disabled={isUploading}
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
//                 disabled={isUploading}
//               />
//               Deduplicate by phone
//             </label>
//           </div>
//         </div>

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
//             className="mt-2 text-xs text-indigo-600 hover:underline disabled:opacity-50"
//             onClick={() => setShowMapping(s => !s)}
//             disabled={!(csvHeaders ?? []).length || isUploading}
//           >
//             {showMapping ? "Hide mapping" : "Edit mapping"}
//           </button>

//           {showMapping && (
//             <div className="mt-3 space-y-2">
//               {/* Non-body keys */}
//               {visibleKeys.length === 0 ? (
//                 <p className="text-xs text-gray-500">No extra parameters.</p>
//               ) : (
//                 visibleKeys.map(k => (
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
//                       disabled={!(csvHeaders ?? []).length || isUploading}
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

//               {/* Body placeholders */}
//               {paramMappings.length > 0 && (
//                 <div className="mt-4 border-t pt-3">
//                   <div className="mb-2 text-xs font-semibold text-gray-700">
//                     Body values ({"{{n}}"}) → CSV
//                   </div>
//                   <div className="space-y-2">
//                     {paramMappings.map((m, i) => (
//                       <div
//                         key={m.index}
//                         className="grid grid-cols-[80px,100px,1fr] items-center gap-2"
//                       >
//                         <div className="text-xs text-gray-500">{`parameter${m.index}`}</div>
//                         <select
//                           className="rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-purple-500"
//                           value={m.sourceType}
//                           onChange={e =>
//                             updateMapping(i, { sourceType: e.target.value })
//                           }
//                           disabled={isUploading}
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
//                             disabled={!(csvHeaders ?? []).length || isUploading}
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
//                             disabled={isUploading}
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
//           disabled={!batch?.batchId || isUploading}
//           className="rounded-md bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
//         >
//           Validate
//         </button>
//         <button
//           type="button"
//           onClick={handleDryRun}
//           disabled={!batch?.batchId || isUploading}
//           className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
//         >
//           (Preview) Dry-run materialize
//         </button>
//         <button
//           type="button"
//           onClick={handlePersist}
//           disabled={!batch?.batchId || persisting || isUploading}
//           className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
//         >
//           {persisting ? "saving" : "Save Contact"}
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
