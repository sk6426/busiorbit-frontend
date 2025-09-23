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

function saveBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export default function CsvAudienceSection({ campaignId }) {
  const [loading, setLoading] = useState(true);
  const [schema, setSchema] = useState(null);

  const [batch, setBatch] = useState(null); // { batchId, headerJson, ... }
  const [sample, setSample] = useState(null); // { headers, rows }
  const [valReq, setValReq] = useState({
    normalizePhone: true,
    checkDuplicates: true,
  });
  const [valRes, setValRes] = useState(null);

  const [paramMappings, setParamMappings] = useState([]);
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

  const topRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const sc = await fetchCsvSchema(campaignId);
        if (!alive) return;
        setSchema(sc);

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
      const lower = hdrs.map(h => String(h).toLowerCase());
      const guessIdx = lower.findIndex(h =>
        ["phone", "mobile", "whatsapp", "number", "phonee164"].some(k =>
          h.includes(k)
        )
      );
      setPhoneHeader(guessIdx >= 0 ? hdrs[guessIdx] : "");

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
      } catch {
        /* optional */
      }
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
        requiredHeaders: [], // params may be constants
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

  // Dictionary the backend expects for mappings (eg { "{{1}}": "Nicolus", "{{2}}": "Email" }).
  const buildMappingDict = () => {
    const dict = {};
    for (const m of paramMappings) {
      const key = `{{${m.index}}}`;
      if (m.sourceType === "csv") {
        dict[key] = m.sourceName || "";
      } else {
        // IMPORTANT: backend expects "constant:" prefix
        dict[key] = `constant:${m.constValue ?? ""}`;
      }
    }
    return dict;
  };
  const handleDryRun = async () => {
    if (!batch?.batchId) return toast.warn("Upload a CSV first.");

    try {
      await saveMappings(campaignId, buildMappingDict()); // optional

      const body = {
        csvBatchId: batch.batchId,
        mappings: buildMappingDict(),
        phoneField: phoneHeader || undefined,
        normalizePhones: !!valReq.normalizePhone,
        deduplicate: !!valReq.checkDuplicates,
        persist: false, // <-- preview only
        audienceName: undefined, // <-- not needed for preview
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
      await saveMappings(campaignId, buildMappingDict()); // optional

      const body = {
        csvBatchId: batch.batchId,
        mappings: buildMappingDict(),
        phoneField: phoneHeader || undefined,
        normalizePhones: !!valReq.normalizePhone,
        deduplicate: !!valReq.checkDuplicates,
        persist: true, // <-- REQUIRED
        audienceName: audienceName.trim(),
      };

      const result = await materialize(campaignId, body);
      toast.success("Audience created and recipients materialized.");
      // result.audienceId will be set on success
    } catch {
      toast.error("Persist failed.");
    } finally {
      setPersisting(false);
    }
  };

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

      {/* Header row: expected columns + actions */}
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <div className="text-gray-600">
          Expected columns:&nbsp;
          <code className="rounded bg-gray-100 px-1.5 py-0.5">
            {Array.isArray(schema?.headers) ? schema.headers.join(", ") : "—"}
          </code>
        </div>
        <button
          type="button"
          onClick={handleDownloadSample}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          Download sample CSV
        </button>
        <label className="ml-auto cursor-pointer text-indigo-600 hover:underline">
          Upload CSV
          <input
            type="file"
            accept=".csv"
            onChange={e => handleFile(e.target.files?.[0])}
            className="hidden"
          />
        </label>
      </div>

      {/* Phone + toggles and parameter mapping */}
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
          <h3 className="mb-2 text-xs font-semibold text-gray-700">
            Template parameters
          </h3>
          {paramMappings.length === 0 ? (
            <p className="text-sm text-gray-500">
              No parameters required for this template.
            </p>
          ) : (
            <div className="space-y-2">
              {paramMappings.map((m, i) => (
                <div
                  key={m.index}
                  className="grid grid-cols-[80px,100px,1fr] items-center gap-2"
                >
                  <div className="text-xs text-gray-500">{`{{${m.index}}}`}</div>
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
