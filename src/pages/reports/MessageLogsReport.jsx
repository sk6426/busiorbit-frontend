// 📄 src/pages/reports/MessageLogsReport.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";

// compact multiselect
import MultiSelect from "../../utils/MultiSelect";

const STATUS_OPTIONS = ["Queued", "Sent", "Delivered", "Read", "Failed"];
const DATE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "custom", label: "Custom…" },
];

const toOptions = arr => (arr || []).map(x => ({ label: x, value: x }));

function deriveFacetOptionsFromRows(items) {
  const senders = new Set();
  const wabas = new Set();
  for (const it of items || []) {
    if (it.senderId) senders.add(String(it.senderId).trim());
    const wid =
      it.wabaId ??
      it.wabaID ??
      it.metaWabaId ??
      it.businessWabaId ??
      it.waba_id ??
      null;
    if (wid) wabas.add(String(wid).trim());
  }
  const toSortedOptions = set =>
    Array.from(set)
      .filter(Boolean)
      .sort((a, b) => String(a).localeCompare(String(b)))
      .map(v => ({ label: v, value: v }));
  return {
    senderOptions: toSortedOptions(senders),
    wabaOptions: toSortedOptions(wabas),
  };
}

/* ---------- Message ID cell (truncate inline; multiline & Copy in HOVER POPOVER) ---------- */
function MessageIdCell({ value }) {
  const full = value || "";
  const short = full.length > 23 ? `${full.slice(0, 23)}…` : full;
  const [copied, setCopied] = useState(false);

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // keep silent per request (no toast); you can surface an inline error if desired
    }
  };

  return (
    <div className="relative group inline-block align-middle">
      {/* Inline: single line, truncated */}
      <span className="inline-block max-w-[220px] truncate font-mono text-gray-800">
        {short || "-"}
      </span>

      {/* Hover/focus popover: multiline + Copy + small 'Copied' badge */}
      {full && (
        <div
          className="
            pointer-events-auto
            invisible opacity-0 translate-y-1
            group-hover:visible group-hover:opacity-100 group-hover:translate-y-0
            group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0
            transition-opacity transition-transform
            absolute left-0 mt-1 z-30
            min-w-[320px] max-w-[560px]
            bg-white border rounded shadow px-3 py-2
          "
          role="tooltip"
        >
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={doCopy}
              className="shrink-0 text-xs px-2 py-0.5 rounded border hover:bg-gray-50"
              title="Copy Message Id"
            >
              Copy
            </button>
            <code className="text-xs font-mono leading-snug break-all text-gray-900">
              {full}
            </code>
          </div>
          {copied && (
            <div className="mt-1 text-[11px] text-emerald-600">Copied</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MessageLogsReport() {
  // data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // filters/paging/sort
  const [search, setSearch] = useState("");
  const [dateKey, setDateKey] = useState("last7");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [statuses, setStatuses] = useState([]);
  const [senderIds, setSenderIds] = useState([]);
  const [wabaIds, setWabaIds] = useState([]);

  // facet options
  const [senderOptions, setSenderOptions] = useState([]);
  const [wabaOptions, setWabaOptions] = useState([]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState("SentAt");
  const [sortDir, setSortDir] = useState("desc");

  // date range
  const range = useMemo(() => {
    const end = new Date();
    const start = new Date();
    if (dateKey === "today") start.setHours(0, 0, 0, 0);
    else if (dateKey === "yesterday") {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (dateKey === "last7") {
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (dateKey === "last30") {
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    } else if (dateKey === "custom" && from && to) {
      return { fromUtc: new Date(from), toUtc: new Date(to) };
    }
    return { fromUtc: start, toUtc: end };
  }, [dateKey, from, to]);

  const rangeKey = `${range.fromUtc?.toISOString?.() ?? ""}|${
    range.toUtc?.toISOString?.() ?? ""
  }`;

  /* ---- fetchers ---- */
  const fetchFacets = useCallback(async () => {
    try {
      const { data } = await axiosClient.get("/report/message-logs/facets");
      if (data?.senderIds) setSenderOptions(toOptions(data.senderIds));
      if (data?.wabaIds) setWabaOptions(toOptions(data.wabaIds));
    } catch {}
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const body = {
      search: search || undefined,
      statuses: statuses.length ? statuses : undefined,
      senderIds: senderIds.length ? senderIds : undefined,
      wabaIds: wabaIds.length ? wabaIds : undefined,
      fromUtc: range.fromUtc?.toISOString?.(),
      toUtc: range.toUtc?.toISOString?.(),
      sortBy,
      sortDir,
      page,
      pageSize,
    };
    try {
      const { data } = await axiosClient.post(
        "/report/message-logs/search",
        body
      );
      const items = data.items || [];
      setRows(items);

      const computedTotalPages =
        typeof data.totalPages === "number"
          ? data.totalPages
          : Math.ceil((data.totalCount ?? 0) / (data.pageSize ?? pageSize));
      setTotalPages(
        Number.isFinite(computedTotalPages) ? computedTotalPages : 0
      );
      setTotalCount(data.totalCount ?? (items ? items.length : 0));

      // fallback facet derivation from rows
      const derived = deriveFacetOptionsFromRows(items);
      if (derived.senderOptions.length) {
        setSenderOptions(prev => {
          const known = new Set(prev.map(o => o.value));
          const merged = [...prev];
          derived.senderOptions.forEach(o => {
            if (!known.has(o.value)) merged.push(o);
          });
          return merged.sort((a, b) => a.label.localeCompare(b.label));
        });
      }
      if (derived.wabaOptions.length) {
        setWabaOptions(prev => {
          const known = new Set(prev.map(o => o.value));
          const merged = [...prev];
          derived.wabaOptions.forEach(o => {
            if (!known.has(o.value)) merged.push(o);
          });
          return merged.sort((a, b) => a.label.localeCompare(b.label));
        });
      }
    } catch {
      toast.error("❌ Failed to load message logs");
      setRows([]);
      setTotalPages(0);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    statuses,
    senderIds,
    wabaIds,
    rangeKey,
    sortBy,
    sortDir,
    page,
    pageSize,
  ]);

  useEffect(() => {
    fetchFacets();
  }, [fetchFacets]);

  useEffect(() => {
    const t = setTimeout(fetchRows, 250);
    return () => clearTimeout(t);
  }, [fetchRows]);

  const toggleSort = col => {
    if (sortBy === col) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("desc");
    }
    setPage(1);
  };

  const commonExportBody = () => ({
    search: search || undefined,
    statuses: statuses.length ? statuses : undefined,
    senderIds: senderIds.length ? senderIds : undefined,
    wabaIds: wabaIds.length ? wabaIds : undefined,
    fromUtc: range.fromUtc?.toISOString?.(),
    toUtc: range.toUtc?.toISOString?.(),
    sortBy,
    sortDir,
  });

  const exportCsv = async () => {
    try {
      const res = await axiosClient.post(
        "/report/message-logs/export/csv",
        commonExportBody(),
        { responseType: "blob" }
      );
      saveAs(res.data, `MessageLogs.csv`);
    } catch {
      const headers = [
        "S.No",
        "Contacts",
        "Sender Id",
        "Status",
        "Campaign",
        "Message",
        "MessageId",
        "SentAt",
        "Error",
      ];
      const csvRows = [
        headers,
        ...rows.map((r, i) => [
          i + 1,
          r.recipientNumber || "",
          r.senderId || "",
          r.status || "",
          r.campaignName || r.campaignId || "",
          (r.messageContent || "").replace(/\r?\n/g, " ").slice(0, 500),
          r.providerMessageId || "",
          r.sentAt
            ? new Date(r.sentAt).toLocaleString()
            : new Date(r.createdAt).toLocaleString(),
          (r.errorMessage || "").replace(/\r?\n/g, " ").slice(0, 500),
        ]),
      ];
      const blob = new Blob([csvRows.map(r => r.join(",")).join("\n")], {
        type: "text/csv",
      });
      saveAs(blob, `MessageLogs.csv`);
    }
  };
  const exportXlsx = async () => {
    try {
      const res = await axiosClient.post(
        "/report/message-logs/export/xlsx",
        commonExportBody(),
        { responseType: "blob" }
      );
      saveAs(res.data, `MessageLogs.xlsx`);
    } catch {
      toast.error("XLSX export not available");
    }
  };

  const getDisplayPhone = log => {
    const clean = v => (typeof v === "string" ? v.trim() : v);
    const p = clean(log?.contactPhone);
    if (p && p !== "-" && p.toLowerCase() !== "n/a") return p;
    const r = clean(log?.recipientNumber) || clean(log?.to);
    return r || "";
  };

  const srBase = (page - 1) * pageSize;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-purple-700">
          📊 Message Send Logs{" "}
        </h1>
        <div className="space-x-2">
          <button
            onClick={exportCsv}
            className="bg-emerald-600 text-white text-sm px-3 py-1 rounded hover:bg-emerald-700"
          >
            CSV
          </button>
          <button
            onClick={exportXlsx}
            className="bg-emerald-700 text-white text-sm px-3 py-1 rounded hover:bg-emerald-800"
          >
            Excel
          </button>
          <Link
            to="/app/campaigns/template-campaigns-list"
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <span className="text-lg">←</span> Back to Campaigns
          </Link>
        </div>
      </div>

      {/* Filters — order: WABA Id, Sender Id, Status, Search, Date range (LAST) */}
      <div className="grid lg:grid-cols-12 md:grid-cols-8 grid-cols-1 gap-4 mb-4">
        <div className="lg:col-span-2 md:col-span-4 col-span-1 relative">
          <MultiSelect
            label="WABA Id"
            options={wabaOptions}
            value={wabaIds}
            onChange={next => {
              setWabaIds(next);
              setPage(1);
            }}
            placeholder="All"
          />
        </div>

        <div className="lg:col-span-2 md:col-span-4 col-span-1 relative">
          <MultiSelect
            label="Sender Id"
            options={senderOptions}
            value={senderIds}
            onChange={next => {
              setSenderIds(next);
              setPage(1);
            }}
            placeholder="All"
          />
        </div>

        <div className="lg:col-span-2 md:col-span-4 col-span-1 relative">
          <MultiSelect
            label="Status"
            options={toOptions(STATUS_OPTIONS)}
            value={statuses}
            onChange={next => {
              setStatuses(next);
              setPage(1);
            }}
            placeholder="All"
          />
        </div>

        <div className="lg:col-span-3 md:col-span-4 col-span-1">
          <label className="text-sm text-gray-600 mb-1 block">Search</label>
          <div className="relative">
            <input
              className="w-full border px-3 py-2 rounded pr-8"
              placeholder="Search across all fields"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <span className="absolute right-2 top-2.5 text-gray-400">⌕</span>
          </div>
        </div>

        {/* Date range presets at the end */}
        <div className="lg:col-span-3 md:col-span-4 col-span-1">
          <label className="text-sm text-gray-600 mb-1 block">Date range</label>
          <select
            className="w-full border px-3 py-2 rounded"
            value={dateKey}
            onChange={e => {
              setDateKey(e.target.value);
              setPage(1);
            }}
          >
            {DATE_PRESETS.map(p => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {dateKey === "custom" && (
          <>
            <div className="lg:col-span-3 md:col-span-4 col-span-1">
              <label className="text-sm text-gray-600 mb-1 block">From</label>
              <input
                type="datetime-local"
                className="w-full border px-3 py-2 rounded"
                value={from}
                onChange={e => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="lg:col-span-3 md:col-span-4 col-span-1">
              <label className="text-sm text-gray-600 mb-1 block">To</label>
              <input
                type="datetime-local"
                className="w-full border px-3 py-2 rounded"
                value={to}
                onChange={e => {
                  setTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Count */}
      <div className="mb-3 text-sm text-gray-500">
        Showing {rows.length} of {totalCount} logs
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0 text-left">
            <tr>
              <th className="p-2 whitespace-nowrap">S.No</th>
              {[
                ["Recipient", "Contacts"],
                ["SenderId", "Sender Id"],
                ["Status", "Status"],
                ["CampaignName", "Campaign"],
                ["Message", "Message"],
                ["MessageId", "Message Id"],
                ["SentAt", "Sent At"],
                ["Error", "Error"],
              ].map(([key, label]) => (
                <th
                  key={key}
                  className="p-2 cursor-pointer select-none whitespace-nowrap"
                  onClick={() =>
                    toggleSort(key === "Message" ? "MessageType" : key)
                  }
                >
                  {label}{" "}
                  {sortBy === key ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={11}>
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-3 text-gray-500" colSpan={11}>
                  No logs found for the selected filters.
                </td>
              </tr>
            ) : (
              rows.map((log, idx) => {
                const isFailed =
                  String(log.status || "").toLowerCase() === "failed";
                const sr = (page - 1) * pageSize + idx + 1;
                return (
                  <tr
                    key={log.id ?? sr}
                    className={`border-t hover:bg-gray-50 ${
                      isFailed ? "text-red-700" : ""
                    }`}
                  >
                    <td className="p-2 whitespace-nowrap">{sr}</td>

                    <td className="p-2 whitespace-nowrap">
                      {getDisplayPhone(log) || "-"}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {log.senderId || "-"}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {log.status || "-"}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {log.campaignName || log.campaignId || "-"}
                    </td>

                    <td className="p-2 max-w-[460px]">
                      <div
                        className="text-gray-800 truncate"
                        title={log.messageContent || ""}
                      >
                        {log.messageContent || "-"}
                      </div>
                    </td>

                    <td className="p-2 whitespace-nowrap align-top">
                      <MessageIdCell value={log.providerMessageId} />
                    </td>

                    <td className="p-2 whitespace-nowrap">
                      {log.sentAt
                        ? new Date(log.sentAt).toLocaleString()
                        : new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="p-2 max-w-[320px]">
                      <div
                        className={`truncate ${
                          isFailed ? "text-red-700 font-medium" : ""
                        }`}
                        title={log.errorMessage || ""}
                      >
                        {log.errorMessage ? `❗ ${log.errorMessage}` : "-"}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paging */}
      {totalPages > 1 && (
        <div className="flex flex-wrap gap-2 justify-end items-center mt-4">
          <button
            className="px-2 py-1 text-sm border rounded"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            ⬅ Prev
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            className="px-2 py-1 text-sm border rounded"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next ➡
          </button>
          <select
            className="border px-2 py-1 rounded"
            value={pageSize}
            onChange={e => {
              setPageSize(parseInt(e.target.value, 10));
              setPage(1);
            }}
          >
            {[10, 25, 50, 100, 200].map(n => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

// // 📄 src/pages/reports/MessageLogsReport.jsx
// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { saveAs } from "file-saver";

// // your compact multiselect
// import MultiSelect from "../../utils/MultiSelect";

// const STATUS_OPTIONS = ["Queued", "Sent", "Delivered", "Read", "Failed"];
// const DATE_PRESETS = [
//   { key: "today", label: "Today" },
//   { key: "yesterday", label: "Yesterday" },
//   { key: "last7", label: "Last 7 days" },
//   { key: "last30", label: "Last 30 days" },
//   { key: "custom", label: "Custom…" },
// ];

// const toOptions = arr => (arr || []).map(x => ({ label: x, value: x }));

// /** Build unique sorted options from current rows as a fallback facet source */
// function deriveFacetOptionsFromRows(items) {
//   const senders = new Set();
//   const wabas = new Set();

//   for (const it of items || []) {
//     if (it.senderId) senders.add(String(it.senderId).trim());

//     const wid =
//       it.wabaId ??
//       it.wabaID ??
//       it.metaWabaId ??
//       it.businessWabaId ??
//       it.waba_id ??
//       null;
//     if (wid) wabas.add(String(wid).trim());
//   }

//   const toSortedOptions = set =>
//     Array.from(set)
//       .filter(Boolean)
//       .sort((a, b) => String(a).localeCompare(String(b)))
//       .map(v => ({ label: v, value: v }));

//   return {
//     senderOptions: toSortedOptions(senders),
//     wabaOptions: toSortedOptions(wabas),
//   };
// }

// /* ---------- Message ID cell (truncate inline; multiline & Copy in HOVER POPOVER) ---------- */
// function MessageIdCell({ value }) {
//   const full = value || "";
//   const short = full.length > 23 ? `${full.slice(0, 23)}…` : full;

//   const doCopy = async () => {
//     try {
//       await navigator.clipboard.writeText(full);
//       toast.dismiss();
//       toast.success("Message Id copied");
//     } catch {
//       toast.error("Copy failed");
//     }
//   };

//   return (
//     <div className="relative group inline-block align-middle">
//       <span className="inline-block max-w-[220px] truncate font-mono text-gray-800">
//         {short || "-"}
//       </span>

//       {full && (
//         <div
//           className="
//             pointer-events-auto
//             invisible opacity-0 translate-y-1
//             group-hover:visible group-hover:opacity-100 group-hover:translate-y-0
//             group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0
//             transition-opacity transition-transform
//             absolute left-0 mt-1 z-30
//             min-w-[320px] max-w-[560px]
//             bg-white border rounded shadow px-3 py-2
//           "
//           role="tooltip"
//         >
//           <div className="flex items-start gap-2">
//             <button
//               type="button"
//               onClick={doCopy}
//               className="shrink-0 text-xs px-2 py-0.5 rounded border hover:bg-gray-50"
//               title="Copy Message Id"
//             >
//               Copy
//             </button>
//             <code className="text-xs font-mono leading-snug break-all text-gray-900">
//               {full}
//             </code>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default function MessageLogsReport() {
//   // data
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [totalPages, setTotalPages] = useState(0);
//   const [totalCount, setTotalCount] = useState(0);

//   // filters/paging/sort
//   const [search, setSearch] = useState("");
//   const [dateKey, setDateKey] = useState("last7");
//   const [from, setFrom] = useState("");
//   const [to, setTo] = useState("");
//   const [statuses, setStatuses] = useState([]);
//   const [senderIds, setSenderIds] = useState([]);
//   const [wabaIds, setWabaIds] = useState([]);

//   // facet options
//   const [senderOptions, setSenderOptions] = useState([]);
//   const [wabaOptions, setWabaOptions] = useState([]);

//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(25);
//   const [sortBy, setSortBy] = useState("SentAt");
//   const [sortDir, setSortDir] = useState("desc");

//   // date range
//   const range = useMemo(() => {
//     const end = new Date();
//     const start = new Date();
//     if (dateKey === "today") start.setHours(0, 0, 0, 0);
//     else if (dateKey === "yesterday") {
//       start.setDate(start.getDate() - 1);
//       start.setHours(0, 0, 0, 0);
//       end.setDate(end.getDate() - 1);
//       end.setHours(23, 59, 59, 999);
//     } else if (dateKey === "last7") {
//       start.setDate(start.getDate() - 6);
//       start.setHours(0, 0, 0, 0);
//     } else if (dateKey === "last30") {
//       start.setDate(start.getDate() - 29);
//       start.setHours(0, 0, 0, 0);
//     } else if (dateKey === "custom" && from && to) {
//       return { fromUtc: new Date(from), toUtc: new Date(to) };
//     }
//     return { fromUtc: start, toUtc: end };
//   }, [dateKey, from, to]);

//   const rangeKey = `${range.fromUtc?.toISOString?.() ?? ""}|${
//     range.toUtc?.toISOString?.() ?? ""
//   }`;

//   /* ---- fetchers ---- */
//   const fetchFacets = useCallback(async () => {
//     try {
//       const { data } = await axiosClient.get("/report/message-logs/facets");
//       if (data?.senderIds) setSenderOptions(toOptions(data.senderIds));
//       if (data?.wabaIds) setWabaOptions(toOptions(data.wabaIds));
//     } catch {
//       // optional
//     }
//   }, []);

//   const fetchRows = useCallback(async () => {
//     setLoading(true);
//     const body = {
//       search: search || undefined,
//       statuses: statuses.length ? statuses : undefined,
//       senderIds: senderIds.length ? senderIds : undefined,
//       wabaIds: wabaIds.length ? wabaIds : undefined,
//       fromUtc: range.fromUtc?.toISOString?.(),
//       toUtc: range.toUtc?.toISOString?.(),
//       sortBy,
//       sortDir,
//       page,
//       pageSize,
//     };
//     try {
//       const { data } = await axiosClient.post(
//         "/report/message-logs/search",
//         body
//       );
//       const items = data.items || [];
//       setRows(items);

//       const computedTotalPages =
//         typeof data.totalPages === "number"
//           ? data.totalPages
//           : Math.ceil((data.totalCount ?? 0) / (data.pageSize ?? pageSize));
//       setTotalPages(
//         Number.isFinite(computedTotalPages) ? computedTotalPages : 0
//       );
//       setTotalCount(data.totalCount ?? (items ? items.length : 0));

//       // Fallback derive options from rows
//       const derived = deriveFacetOptionsFromRows(items);
//       if (derived.senderOptions.length) {
//         setSenderOptions(prev => {
//           const known = new Set(prev.map(o => o.value));
//           const merged = [...prev];
//           derived.senderOptions.forEach(o => {
//             if (!known.has(o.value)) merged.push(o);
//           });
//           return merged.sort((a, b) => a.label.localeCompare(b.label));
//         });
//       }
//       if (derived.wabaOptions.length) {
//         setWabaOptions(prev => {
//           const known = new Set(prev.map(o => o.value));
//           const merged = [...prev];
//           derived.wabaOptions.forEach(o => {
//             if (!known.has(o.value)) merged.push(o);
//           });
//           return merged.sort((a, b) => a.label.localeCompare(b.label));
//         });
//       }
//     } catch {
//       toast.error("❌ Failed to load message logs");
//       setRows([]);
//       setTotalPages(0);
//       setTotalCount(0);
//     } finally {
//       setLoading(false);
//     }
//   }, [
//     search,
//     statuses,
//     senderIds,
//     wabaIds,
//     rangeKey,
//     sortBy,
//     sortDir,
//     page,
//     pageSize,
//   ]);

//   useEffect(() => {
//     fetchFacets();
//   }, [fetchFacets]);

//   useEffect(() => {
//     const t = setTimeout(fetchRows, 250);
//     return () => clearTimeout(t);
//   }, [fetchRows]);

//   // sorting
//   const toggleSort = col => {
//     if (sortBy === col) setSortDir(d => (d === "asc" ? "desc" : "asc"));
//     else {
//       setSortBy(col);
//       setSortDir("desc");
//     }
//     setPage(1);
//   };

//   // exports
//   const commonExportBody = () => ({
//     search: search || undefined,
//     statuses: statuses.length ? statuses : undefined,
//     senderIds: senderIds.length ? senderIds : undefined,
//     wabaIds: wabaIds.length ? wabaIds : undefined,
//     fromUtc: range.fromUtc?.toISOString?.(),
//     toUtc: range.toUtc?.toISOString?.(),
//     sortBy,
//     sortDir,
//   });

//   const exportCsv = async () => {
//     try {
//       const res = await axiosClient.post(
//         "/report/message-logs/export/csv",
//         commonExportBody(),
//         { responseType: "blob" }
//       );
//       saveAs(res.data, `MessageLogs.csv`);
//     } catch {
//       const headers = [
//         "Sr. No.",
//         "Contacts",
//         "Sender Id",
//         "Status",
//         "Campaign",
//         "Message",
//         "MessageId",
//         "SentAt",
//         "Error",
//       ];
//       const csvRows = [
//         headers,
//         ...rows.map((r, i) => [
//           i + 1,
//           r.recipientNumber || "",
//           r.senderId || "",
//           r.status || "",
//           r.campaignName || r.campaignId || "",
//           (r.messageContent || "").replace(/\r?\n/g, " ").slice(0, 500),
//           r.providerMessageId || "",
//           r.sentAt
//             ? new Date(r.sentAt).toLocaleString()
//             : new Date(r.createdAt).toLocaleString(),
//           (r.errorMessage || "").replace(/\r?\n/g, " ").slice(0, 500),
//         ]),
//       ];
//       const blob = new Blob([csvRows.map(r => r.join(",")).join("\n")], {
//         type: "text/csv",
//       });
//       saveAs(blob, `MessageLogs.csv`);
//     }
//   };
//   const exportXlsx = async () => {
//     try {
//       const res = await axiosClient.post(
//         "/report/message-logs/export/xlsx",
//         commonExportBody(),
//         { responseType: "blob" }
//       );
//       saveAs(res.data, `MessageLogs.xlsx`);
//     } catch {
//       toast.error("XLSX export not available");
//     }
//   };

//   const getDisplayPhone = log => {
//     const clean = v => (typeof v === "string" ? v.trim() : v);
//     const p = clean(log?.contactPhone);
//     if (p && p !== "-" && p.toLowerCase() !== "n/a") return p;
//     const r = clean(log?.recipientNumber) || clean(log?.to);
//     return r || "";
//   };

//   // serial number base for current page
//   const srBase = (page - 1) * pageSize;

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <h1 className="text-2xl font-bold text-purple-700">
//           📊 Message Send Logs{" "}
//           <span className="text-sm text-gray-500">(All messages)</span>
//         </h1>
//         <div className="space-x-2">
//           <button
//             onClick={exportCsv}
//             className="bg-emerald-600 text-white text-sm px-3 py-1 rounded hover:bg-emerald-700"
//           >
//             CSV
//           </button>
//           <button
//             onClick={exportXlsx}
//             className="bg-emerald-700 text-white text-sm px-3 py-1 rounded hover:bg-emerald-800"
//           >
//             Excel
//           </button>
//           <Link
//             to="/app/campaigns/template-campaigns-list"
//             className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition"
//           >
//             <span className="text-lg">←</span> Back to Campaigns
//           </Link>
//         </div>
//       </div>

//       {/* Filters — order: WABA Id, Sender Id, Status, Search, Date range (LAST) */}
//       <div className="grid lg:grid-cols-12 md:grid-cols-8 grid-cols-1 gap-4 mb-4">
//         <div className="lg:col-span-2 md:col-span-4 col-span-1 relative">
//           <MultiSelect
//             label="WABA Id"
//             options={wabaOptions}
//             value={wabaIds}
//             onChange={next => {
//               setWabaIds(next);
//               setPage(1);
//             }}
//             placeholder="All"
//           />
//         </div>

//         <div className="lg:col-span-2 md:col-span-4 col-span-1 relative">
//           <MultiSelect
//             label="Sender Id"
//             options={senderOptions}
//             value={senderIds}
//             onChange={next => {
//               setSenderIds(next);
//               setPage(1);
//             }}
//             placeholder="All"
//           />
//         </div>

//         <div className="lg:col-span-2 md:col-span-4 col-span-1 relative">
//           <MultiSelect
//             label="Status"
//             options={toOptions(STATUS_OPTIONS)}
//             value={statuses}
//             onChange={next => {
//               setStatuses(next);
//               setPage(1);
//             }}
//             placeholder="All"
//           />
//         </div>

//         <div className="lg:col-span-3 md:col-span-4 col-span-1">
//           <label className="text-sm text-gray-600 mb-1 block">Search</label>
//           <div className="relative">
//             <input
//               className="w-full border px-3 py-2 rounded pr-8"
//               placeholder="Search across all fields"
//               value={search}
//               onChange={e => {
//                 setSearch(e.target.value);
//                 setPage(1);
//               }}
//             />
//             <span className="absolute right-2 top-2.5 text-gray-400">⌕</span>
//           </div>
//         </div>

//         {/* Date range PRESETS at the END */}
//         <div className="lg:col-span-3 md:col-span-4 col-span-1">
//           <label className="text-sm text-gray-600 mb-1 block">Date range</label>
//           <select
//             className="w-full border px-3 py-2 rounded"
//             value={dateKey}
//             onChange={e => {
//               setDateKey(e.target.value);
//               setPage(1);
//             }}
//           >
//             {DATE_PRESETS.map(p => (
//               <option key={p.key} value={p.key}>
//                 {p.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         {dateKey === "custom" && (
//           <>
//             <div className="lg:col-span-3 md:col-span-4 col-span-1">
//               <label className="text-sm text-gray-600 mb-1 block">From</label>
//               <input
//                 type="datetime-local"
//                 className="w-full border px-3 py-2 rounded"
//                 value={from}
//                 onChange={e => {
//                   setFrom(e.target.value);
//                   setPage(1);
//                 }}
//               />
//             </div>
//             <div className="lg:col-span-3 md:col-span-4 col-span-1">
//               <label className="text-sm text-gray-600 mb-1 block">To</label>
//               <input
//                 type="datetime-local"
//                 className="w-full border px-3 py-2 rounded"
//                 value={to}
//                 onChange={e => {
//                   setTo(e.target.value);
//                   setPage(1);
//                 }}
//               />
//             </div>
//           </>
//         )}
//       </div>

//       {/* Count */}
//       <div className="mb-3 text-sm text-gray-500">
//         Showing {rows.length} of {totalCount} logs
//       </div>

//       {/* Table */}
//       <div className="overflow-x-auto bg-white shadow rounded">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-100 sticky top-0 text-left">
//             <tr>
//               <th className="p-2 whitespace-nowrap">Sr. No.</th>
//               {[
//                 ["Recipient", "Contacts"],
//                 ["SenderId", "Sender Id"],
//                 ["Status", "Status"],
//                 ["CampaignName", "Campaign"],
//                 ["Message", "Message"],
//                 ["MessageId", "Message Id"],
//                 ["SentAt", "Sent At"],
//                 ["Error", "Error"],
//               ].map(([key, label]) => (
//                 <th
//                   key={key}
//                   className="p-2 cursor-pointer select-none whitespace-nowrap"
//                   onClick={() =>
//                     toggleSort(key === "Message" ? "MessageType" : key)
//                   }
//                 >
//                   {label}{" "}
//                   {sortBy === key ? (sortDir === "asc" ? "▲" : "▼") : ""}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr>
//                 <td className="p-3" colSpan={11}>
//                   Loading…
//                 </td>
//               </tr>
//             ) : rows.length === 0 ? (
//               <tr>
//                 <td className="p-3 text-gray-500" colSpan={11}>
//                   No logs found for the selected filters.
//                 </td>
//               </tr>
//             ) : (
//               rows.map((log, idx) => {
//                 const isFailed =
//                   String(log.status || "").toLowerCase() === "failed";
//                 const sr = srBase + idx + 1;
//                 return (
//                   <tr
//                     key={log.id ?? sr}
//                     className={`border-t hover:bg-gray-50 ${
//                       isFailed ? "text-red-700" : ""
//                     }`}
//                   >
//                     <td className="p-2 whitespace-nowrap">{sr}</td>

//                     <td className="p-2 whitespace-nowrap">
//                       {getDisplayPhone(log) || "-"}
//                     </td>
//                     <td className="p-2 whitespace-nowrap">
//                       {log.senderId || "-"}
//                     </td>
//                     <td className="p-2 whitespace-nowrap">
//                       {log.status || "-"}
//                     </td>
//                     <td className="p-2 whitespace-nowrap">
//                       {log.campaignName || log.campaignId || "-"}
//                     </td>

//                     <td className="p-2 max-w-[460px]">
//                       <div
//                         className="text-gray-800 truncate"
//                         title={log.messageContent || ""}
//                       >
//                         {log.messageContent || "-"}
//                       </div>
//                     </td>

//                     <td className="p-2 whitespace-nowrap align-top">
//                       <MessageIdCell value={log.providerMessageId} />
//                     </td>

//                     <td className="p-2 whitespace-nowrap">
//                       {log.sentAt
//                         ? new Date(log.sentAt).toLocaleString()
//                         : new Date(log.createdAt).toLocaleString()}
//                     </td>

//                     <td className="p-2 max-w-[320px]">
//                       <div
//                         className={`truncate ${
//                           isFailed ? "text-red-700 font-medium" : ""
//                         }`}
//                         title={log.errorMessage || ""}
//                       >
//                         {log.errorMessage ? `❗ ${log.errorMessage}` : "-"}
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Paging */}
//       {totalPages > 1 && (
//         <div className="flex flex-wrap gap-2 justify-end items-center mt-4">
//           <button
//             className="px-2 py-1 text-sm border rounded"
//             disabled={page === 1}
//             onClick={() => setPage(p => p - 1)}
//           >
//             ⬅ Prev
//           </button>
//           <span className="text-sm text-gray-600">
//             Page {page} of {totalPages}
//           </span>
//           <button
//             className="px-2 py-1 text-sm border rounded"
//             disabled={page === totalPages}
//             onClick={() => setPage(p => p + 1)}
//           >
//             Next ➡
//           </button>
//           <select
//             className="border px-2 py-1 rounded"
//             value={pageSize}
//             onChange={e => {
//               setPageSize(parseInt(e.target.value, 10));
//               setPage(1);
//             }}
//           >
//             {[10, 25, 50, 100, 200].map(n => (
//               <option key={n} value={n}>
//                 {n}/page
//               </option>
//             ))}
//           </select>
//         </div>
//       )}
//     </div>
//   );
// }

// // 📄 src/pages/reports/MessageLogsReport.jsx
// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { saveAs } from "file-saver";

// // your compact multiselect
// import MultiSelect from "../../utils/MultiSelect";

// const STATUS_OPTIONS = ["Queued", "Sent", "Delivered", "Read", "Failed"];
// const DATE_PRESETS = [
//   { key: "today", label: "Today" },
//   { key: "yesterday", label: "Yesterday" },
//   { key: "last7", label: "Last 7 days" },
//   { key: "last30", label: "Last 30 days" },
//   { key: "custom", label: "Custom…" },
// ];

// const toOptions = (arr) => (arr || []).map((x) => ({ label: x, value: x }));

// /** Build unique sorted options from current rows as a fallback facet source */
// function deriveFacetOptionsFromRows(items) {
//   const senders = new Set();
//   const wabas = new Set();

//   for (const it of items || []) {
//     if (it.senderId) senders.add(String(it.senderId).trim());

//     // try a few common WABA id field names
//     const wid =
//       it.wabaId ??
//       it.wabaID ??
//       it.metaWabaId ??
//       it.businessWabaId ??
//       it.waba_id ??
//       null;
//     if (wid) wabas.add(String(wid).trim());
//   }

//   const toSortedOptions = (set) =>
//     Array.from(set)
//       .filter(Boolean)
//       .sort((a, b) => String(a).localeCompare(String(b)))
//       .map((v) => ({ label: v, value: v }));

//   return {
//     senderOptions: toSortedOptions(senders),
//     wabaOptions: toSortedOptions(wabas),
//   };
// }

// /* ---------- Message ID cell (truncate inline; multiline & Copy in HOVER POPOVER) ---------- */
// function MessageIdCell({ value }) {
//   const full = value || "";
//   const short = full.length > 23 ? `${full.slice(0, 23)}…` : full;

//   const doCopy = async () => {
//     try {
//       await navigator.clipboard.writeText(full);
//       toast.dismiss();
//       toast.success("Message Id copied");
//     } catch {
//       toast.error("Copy failed");
//     }
//   };

//   return (
//     <div className="relative group inline-block align-middle">
//       {/* 1) Inline: single-line, truncated (keeps row compact) */}
//       <span className="inline-block max-w-[220px] truncate font-mono text-gray-800">
//         {short || "-"}
//       </span>

//       {/* 2) On hover/focus: popover below the cell with full id (multi-line) + Copy */}
//       {full && (
//         <div
//           className="
//             pointer-events-auto
//             invisible opacity-0 translate-y-1
//             group-hover:visible group-hover:opacity-100 group-hover:translate-y-0
//             group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0
//             transition-opacity transition-transform
//             absolute left-0 mt-1 z-30
//             min-w-[320px] max-w-[560px]
//             bg-white border rounded shadow px-3 py-2
//           "
//           role="tooltip"
//         >
//           <div className="flex items-start gap-2">
//             <button
//               type="button"
//               onClick={doCopy}
//               className="shrink-0 text-xs px-2 py-0.5 rounded border hover:bg-gray-50"
//               title="Copy Message Id"
//             >
//               Copy
//             </button>
//             <code className="text-xs font-mono leading-snug break-all text-gray-900">
//               {full}
//             </code>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default function MessageLogsReport() {
//   // data
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [totalPages, setTotalPages] = useState(0);
//   const [totalCount, setTotalCount] = useState(0);

//   // filters/paging/sort
//   const [search, setSearch] = useState("");
//   const [dateKey, setDateKey] = useState("last7");
//   const [from, setFrom] = useState("");
//   const [to, setTo] = useState("");
//   const [statuses, setStatuses] = useState([]);
//   const [senderIds, setSenderIds] = useState([]);
//   const [wabaIds, setWabaIds] = useState([]);

//   // facet options
//   const [senderOptions, setSenderOptions] = useState([]);
//   const [wabaOptions, setWabaOptions] = useState([]);

//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(25);
//   const [sortBy, setSortBy] = useState("SentAt");
//   const [sortDir, setSortDir] = useState("desc");

//   // date range
//   const range = useMemo(() => {
//     const end = new Date();
//     const start = new Date();
//     if (dateKey === "today") start.setHours(0, 0, 0, 0);
//     else if (dateKey === "yesterday") {
//       start.setDate(start.getDate() - 1);
//       start.setHours(0, 0, 0, 0);
//       end.setDate(end.getDate() - 1);
//       end.setHours(23, 59, 59, 999);
//     } else if (dateKey === "last7") {
//       start.setDate(start.getDate() - 6);
//       start.setHours(0, 0, 0, 0);
//     } else if (dateKey === "last30") {
//       start.setDate(start.getDate() - 29);
//       start.setHours(0, 0, 0, 0);
//     } else if (dateKey === "custom" && from && to) {
//       return { fromUtc: new Date(from), toUtc: new Date(to) };
//     }
//     return { fromUtc: start, toUtc: end };
//   }, [dateKey, from, to]);

//   const rangeKey = `${range.fromUtc?.toISOString?.() ?? ""}|${
//     range.toUtc?.toISOString?.() ?? ""
//   }`;

//   /* ---- fetchers ---- */
//   const fetchFacets = useCallback(async () => {
//     try {
//       const { data } = await axiosClient.get("/report/message-logs/facets");
//       if (data?.senderIds) setSenderOptions(toOptions(data.senderIds));
//       if (data?.wabaIds) setWabaOptions(toOptions(data.wabaIds));
//     } catch {
//       // optional; ignore if not available
//     }
//   }, []);

//   const fetchRows = useCallback(async () => {
//     setLoading(true);
//     const body = {
//       search: search || undefined,
//       statuses: statuses.length ? statuses : undefined,
//       senderIds: senderIds.length ? senderIds : undefined,
//       wabaIds: wabaIds.length ? wabaIds : undefined,
//       fromUtc: range.fromUtc?.toISOString?.(),
//       toUtc: range.toUtc?.toISOString?.(),
//       sortBy,
//       sortDir,
//       page,
//       pageSize,
//     };
//     try {
//       const { data } = await axiosClient.post("/report/message-logs/search", body);
//       const items = data.items || [];
//       setRows(items);

//       const computedTotalPages =
//         typeof data.totalPages === "number"
//           ? data.totalPages
//           : Math.ceil((data.totalCount ?? 0) / (data.pageSize ?? pageSize));
//       setTotalPages(Number.isFinite(computedTotalPages) ? computedTotalPages : 0);
//       setTotalCount(data.totalCount ?? (items ? items.length : 0));

//       // Fallback facet derivation from current page results
//       const derived = deriveFacetOptionsFromRows(items);
//       if (derived.senderOptions.length) {
//         setSenderOptions((prev) => {
//           const known = new Set(prev.map((o) => o.value));
//           const merged = [...prev];
//           derived.senderOptions.forEach((o) => {
//             if (!known.has(o.value)) merged.push(o);
//           });
//           return merged.sort((a, b) => a.label.localeCompare(b.label));
//         });
//       }
//       if (derived.wabaOptions.length) {
//         setWabaOptions((prev) => {
//           const known = new Set(prev.map((o) => o.value));
//           const merged = [...prev];
//           derived.wabaOptions.forEach((o) => {
//             if (!known.has(o.value)) merged.push(o);
//           });
//           return merged.sort((a, b) => a.label.localeCompare(b.label));
//         });
//       }
//     } catch {
//       toast.error("❌ Failed to load message logs");
//       setRows([]);
//       setTotalPages(0);
//       setTotalCount(0);
//     } finally {
//       setLoading(false);
//     }
//   }, [
//     search,
//     statuses,
//     senderIds,
//     wabaIds,
//     rangeKey,
//     sortBy,
//     sortDir,
//     page,
//     pageSize,
//   ]);

//   useEffect(() => {
//     fetchFacets();
//   }, [fetchFacets]);

//   useEffect(() => {
//     const t = setTimeout(fetchRows, 250);
//     return () => clearTimeout(t);
//   }, [fetchRows]);

//   // sorting
//   const toggleSort = (col) => {
//     if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
//     else {
//       setSortBy(col);
//       setSortDir("desc");
//     }
//     setPage(1);
//   };

//   // exports (headers updated to match new columns)
//   const commonExportBody = () => ({
//     search: search || undefined,
//     statuses: statuses.length ? statuses : undefined,
//     senderIds: senderIds.length ? senderIds : undefined,
//     wabaIds: wabaIds.length ? wabaIds : undefined,
//     fromUtc: range.fromUtc?.toISOString?.(),
//     toUtc: range.toUtc?.toISOString?.(),
//     sortBy,
//     sortDir,
//   });

//   const exportCsv = async () => {
//     try {
//       const res = await axiosClient.post(
//         "/report/message-logs/export/csv",
//         commonExportBody(),
//         { responseType: "blob" }
//       );
//       saveAs(res.data, `MessageLogs.csv`);
//     } catch {
//       // fallback current page
//       const headers = [
//         "Contacts",
//         "Sender Id",
//         "Status",
//         "Campaign",
//         "Message",
//         "MessageId",
//         "SentAt",
//         "Error",
//       ];
//       const csvRows = [
//         headers,
//         ...rows.map((r) => [
//           r.recipientNumber || "",
//           r.senderId || "",
//           r.status || "",
//           r.campaignName || r.campaignId || "",
//           (r.messageContent || "").replace(/\r?\n/g, " ").slice(0, 500),
//           r.providerMessageId || "",
//           r.sentAt
//             ? new Date(r.sentAt).toLocaleString()
//             : new Date(r.createdAt).toLocaleString(),
//           (r.errorMessage || "").replace(/\r?\n/g, " ").slice(0, 500),
//         ]),
//       ];
//       const blob = new Blob([csvRows.map((r) => r.join(",")).join("\n")], {
//         type: "text/csv",
//       });
//       saveAs(blob, `MessageLogs.csv`);
//     }
//   };
//   const exportXlsx = async () => {
//     try {
//       const res = await axiosClient.post(
//         "/report/message-logs/export/xlsx",
//         commonExportBody(),
//         { responseType: "blob" }
//       );
//       saveAs(res.data, `MessageLogs.xlsx`);
//     } catch {
//       toast.error("XLSX export not available");
//     }
//   };

//   const getDisplayPhone = (log) => {
//     const clean = (v) => (typeof v === "string" ? v.trim() : v);
//     const p = clean(log?.contactPhone);
//     if (p && p !== "-" && p.toLowerCase() !== "n/a") return p;
//     const r = clean(log?.recipientNumber) || clean(log?.to);
//     return r || "";
//   };

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <h1 className="text-2xl font-bold text-purple-700">
//           📊 Message Send Logs{" "}
//           <span className="text-sm text-gray-500">(All messages)</span>
//         </h1>
//         <div className="space-x-2">
//           <button
//             onClick={exportCsv}
//             className="bg-emerald-600 text-white text-sm px-3 py-1 rounded hover:bg-emerald-700"
//           >
//             CSV
//           </button>
//           <button
//             onClick={exportXlsx}
//             className="bg-emerald-700 text-white text-sm px-3 py-1 rounded hover:bg-emerald-800"
//           >
//             Excel
//           </button>
//           <Link
//             to="/app/campaigns/template-campaigns-list"
//             className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition"
//           >
//             <span className="text-lg">←</span> Back to Campaigns
//           </Link>
//         </div>
//       </div>

//       {/* Filters — order: WABA Id, Sender Id, Status, Search, Date range (LAST) */}
//       <div className="grid lg:grid-cols-12 md:grid-cols-8 grid-cols-1 gap-4 mb-4">
//         <div className="lg:col-span-2 md:col-span-4 col-span-1 relative">
//           <MultiSelect
//             label="WABA Id"
//             options={wabaOptions}
//             value={wabaIds}
//             onChange={(next) => {
//               setWabaIds(next);
//               setPage(1);
//             }}
//             placeholder={wabaOptions.length ? "All" : "All (loading…)"}
//           />
//         </div>

//         <div className="lg:col-span-2 md:col-span-4 col-span-1 relative">
//           <MultiSelect
//             label="Sender Id"
//             options={senderOptions}
//             value={senderIds}
//             onChange={(next) => {
//               setSenderIds(next);
//               setPage(1);
//             }}
//             placeholder={senderOptions.length ? "All" : "All (loading…)"}
//           />
//         </div>

//         <div className="lg:col-span-2 md:col-span-4 col-span-1 relative">
//           <MultiSelect
//             label="Status"
//             options={toOptions(STATUS_OPTIONS)}
//             value={statuses}
//             onChange={(next) => {
//               setStatuses(next);
//               setPage(1);
//             }}
//             placeholder="All"
//           />
//         </div>

//         <div className="lg:col-span-3 md:col-span-4 col-span-1">
//           <label className="text-sm text-gray-600 mb-1 block">Search</label>
//           <div className="relative">
//             <input
//               className="w-full border px-3 py-2 rounded pr-8"
//               placeholder="Search across all fields"
//               value={search}
//               onChange={(e) => {
//                 setSearch(e.target.value);
//                 setPage(1);
//               }}
//             />
//             <span className="absolute right-2 top-2.5 text-gray-400">⌕</span>
//           </div>
//         </div>

//         {/* Date range PRESETS moved to the END */}
//         <div className="lg:col-span-3 md:col-span-4 col-span-1">
//           <label className="text-sm text-gray-600 mb-1 block">Date range</label>
//           <select
//             className="w-full border px-3 py-2 rounded"
//             value={dateKey}
//             onChange={(e) => {
//               setDateKey(e.target.value);
//               setPage(1);
//             }}
//           >
//             {DATE_PRESETS.map((p) => (
//               <option key={p.key} value={p.key}>
//                 {p.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         {dateKey === "custom" && (
//           <>
//             <div className="lg:col-span-3 md:col-span-4 col-span-1">
//               <label className="text-sm text-gray-600 mb-1 block">From</label>
//               <input
//                 type="datetime-local"
//                 className="w-full border px-3 py-2 rounded"
//                 value={from}
//                 onChange={(e) => {
//                   setFrom(e.target.value);
//                   setPage(1);
//                 }}
//               />
//             </div>
//             <div className="lg:col-span-3 md:col-span-4 col-span-1">
//               <label className="text-sm text-gray-600 mb-1 block">To</label>
//               <input
//                 type="datetime-local"
//                 className="w-full border px-3 py-2 rounded"
//                 value={to}
//                 onChange={(e) => {
//                   setTo(e.target.value);
//                   setPage(1);
//                 }}
//               />
//             </div>
//           </>
//         )}
//       </div>

//       {/* Count */}
//       <div className="mb-3 text-sm text-gray-500">
//         Showing {rows.length} of {totalCount} logs
//       </div>

//       {/* Table */}
//       <div className="overflow-x-auto bg-white shadow rounded">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-100 sticky top-0 text-left">
//             <tr>
//               {[
//                 ["Recipient", "Contacts"],
//                 ["SenderId", "Sender Id"],
//                 ["Status", "Status"],
//                 ["CampaignName", "Campaign"],
//                 ["Message", "Message"], // label only
//                 ["MessageId", "Message Id"],
//                 ["SentAt", "Sent At"],
//                 ["Error", "Error"],
//               ].map(([key, label]) => (
//                 <th
//                   key={key}
//                   className="p-2 cursor-pointer select-none whitespace-nowrap"
//                   onClick={() =>
//                     toggleSort(key === "Message" ? "MessageType" : key)
//                   }
//                 >
//                   {label} {sortBy === key ? (sortDir === "asc" ? "▲" : "▼") : ""}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr>
//                 <td className="p-3" colSpan={10}>
//                   Loading…
//                 </td>
//               </tr>
//             ) : rows.length === 0 ? (
//               <tr>
//                 <td className="p-3 text-gray-500" colSpan={10}>
//                   No logs found for the selected filters.
//                 </td>
//               </tr>
//             ) : (
//               rows.map((log) => {
//                 const isFailed =
//                   String(log.status || "").toLowerCase() === "failed";
//                 return (
//                   <tr
//                     key={log.id}
//                     className={`border-t hover:bg-gray-50 ${
//                       isFailed ? "text-red-700" : ""
//                     }`}
//                   >
//                     <td className="p-2 whitespace-nowrap">
//                       {getDisplayPhone(log) || "-"}
//                     </td>
//                     <td className="p-2 whitespace-nowrap">
//                       {log.senderId || "-"}
//                     </td>
//                     <td className="p-2 whitespace-nowrap">
//                       {log.status || "-"}
//                     </td>
//                     <td className="p-2 whitespace-nowrap">
//                       {log.campaignName || log.campaignId || "-"}
//                     </td>

//                     <td className="p-2 max-w-[460px]">
//                       <div
//                         className="text-gray-800 truncate"
//                         title={log.messageContent || ""}
//                       >
//                         {log.messageContent || "-"}
//                       </div>
//                     </td>

//                     <td className="p-2 whitespace-nowrap align-top">
//                       <MessageIdCell value={log.providerMessageId} />
//                     </td>

//                     <td className="p-2 whitespace-nowrap">
//                       {log.sentAt
//                         ? new Date(log.sentAt).toLocaleString()
//                         : new Date(log.createdAt).toLocaleString()}
//                     </td>

//                     <td className="p-2 max-w-[320px]">
//                       <div
//                         className={`truncate ${
//                           isFailed ? "text-red-700 font-medium" : ""
//                         }`}
//                         title={log.errorMessage || ""}
//                       >
//                         {log.errorMessage ? `❗ ${log.errorMessage}` : "-"}
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Paging */}
//       {totalPages > 1 && (
//         <div className="flex flex-wrap gap-2 justify-end items-center mt-4">
//           <button
//             className="px-2 py-1 text-sm border rounded"
//             disabled={page === 1}
//             onClick={() => setPage((p) => p - 1)}
//           >
//             ⬅ Prev
//           </button>
//           <span className="text-sm text-gray-600">
//             Page {page} of {totalPages}
//           </span>
//           <button
//             className="px-2 py-1 text-sm border rounded"
//             disabled={page === totalPages}
//             onClick={() => setPage((p) => p + 1)}
//           >
//             Next ➡
//           </button>
//           <select
//             className="border px-2 py-1 rounded"
//             value={pageSize}
//             onChange={(e) => {
//               setPageSize(parseInt(e.target.value, 10));
//               setPage(1);
//             }}
//           >
//             {[10, 25, 50, 100, 200].map((n) => (
//               <option key={n} value={n}>
//                 {n}/page
//               </option>
//             ))}
//           </select>
//         </div>
//       )}
//     </div>
//   );
// }

// // 📄 src/pages/reports/MessageLogsReport.jsx
// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { saveAs } from "file-saver";

// // your compact multiselect
// import MultiSelect from "../../utils/MultiSelect";

// const STATUS_OPTIONS = ["Queued", "Sent", "Delivered", "Read", "Failed"];
// const DATE_PRESETS = [
//   { key: "today", label: "Today" },
//   { key: "yesterday", label: "Yesterday" },
//   { key: "last7", label: "Last 7 days" },
//   { key: "last30", label: "Last 30 days" },
//   { key: "custom", label: "Custom…" },
// ];

// const toOptions = arr => (arr || []).map(x => ({ label: x, value: x }));

// /* ---------- Message ID cell (truncate inline; multiline & Copy in HOVER POPOVER) ---------- */
// function MessageIdCell({ value }) {
//   const full = value || "";
//   const short = full.length > 23 ? `${full.slice(0, 23)}…` : full;

//   const doCopy = async () => {
//     try {
//       await navigator.clipboard.writeText(full);
//       toast.dismiss();
//       toast.success("Message Id copied");
//     } catch {
//       toast.error("Copy failed");
//     }
//   };

//   return (
//     <div className="relative group inline-block align-middle">
//       {/* 1) Inline: single-line, truncated (keeps row compact) */}
//       <span className="inline-block max-w-[220px] truncate font-mono text-gray-800">
//         {short || "-"}
//       </span>

//       {/* 2) On hover/focus: popover below the cell with full id (multi-line) + Copy */}
//       {full && (
//         <div
//           className="
//             pointer-events-auto
//             invisible opacity-0 translate-y-1
//             group-hover:visible group-hover:opacity-100 group-hover:translate-y-0
//             group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0
//             transition-opacity transition-transform
//             absolute left-0 mt-1 z-30
//             min-w-[320px] max-w-[560px]
//             bg-white border rounded shadow px-3 py-2
//           "
//           role="tooltip"
//         >
//           <div className="flex items-start gap-2">
//             <button
//               type="button"
//               onClick={doCopy}
//               className="shrink-0 text-xs px-2 py-0.5 rounded border hover:bg-gray-50"
//               title="Copy Message Id"
//             >
//               Copy
//             </button>
//             <code className="text-xs font-mono leading-snug break-all text-gray-900">
//               {full}
//             </code>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default function MessageLogsReport() {
//   // data
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [totalPages, setTotalPages] = useState(0);
//   const [totalCount, setTotalCount] = useState(0);

//   // filters/paging/sort
//   const [search, setSearch] = useState("");
//   const [dateKey, setDateKey] = useState("last7");
//   const [from, setFrom] = useState("");
//   const [to, setTo] = useState("");
//   const [statuses, setStatuses] = useState([]);
//   const [senderIds, setSenderIds] = useState([]);
//   const [wabaIds, setWabaIds] = useState([]);

//   // facet options
//   const [senderOptions, setSenderOptions] = useState([]);
//   const [wabaOptions, setWabaOptions] = useState([]);

//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(25);
//   const [sortBy, setSortBy] = useState("SentAt");
//   const [sortDir, setSortDir] = useState("desc");

//   // date range
//   const range = useMemo(() => {
//     const end = new Date();
//     const start = new Date();
//     if (dateKey === "today") start.setHours(0, 0, 0, 0);
//     else if (dateKey === "yesterday") {
//       start.setDate(start.getDate() - 1);
//       start.setHours(0, 0, 0, 0);
//       end.setDate(end.getDate() - 1);
//       end.setHours(23, 59, 59, 999);
//     } else if (dateKey === "last7") {
//       start.setDate(start.getDate() - 6);
//       start.setHours(0, 0, 0, 0);
//     } else if (dateKey === "last30") {
//       start.setDate(start.getDate() - 29);
//       start.setHours(0, 0, 0, 0);
//     } else if (dateKey === "custom" && from && to) {
//       return { fromUtc: new Date(from), toUtc: new Date(to) };
//     }
//     return { fromUtc: start, toUtc: end };
//   }, [dateKey, from, to]);
//   const rangeKey = `${range.fromUtc?.toISOString?.() ?? ""}|${
//     range.toUtc?.toISOString?.() ?? ""
//   }`;

//   /* ---- fetchers ---- */
//   const fetchFacets = useCallback(async () => {
//     try {
//       const { data } = await axiosClient.get("/report/message-logs/facets");
//       if (data?.senderIds) setSenderOptions(toOptions(data.senderIds));
//       if (data?.wabaIds) setWabaOptions(toOptions(data.wabaIds));
//     } catch {}
//   }, []);

//   const fetchRows = useCallback(async () => {
//     setLoading(true);
//     const body = {
//       search: search || undefined,
//       statuses: statuses.length ? statuses : undefined,
//       senderIds: senderIds.length ? senderIds : undefined,
//       wabaIds: wabaIds.length ? wabaIds : undefined,
//       fromUtc: range.fromUtc?.toISOString?.(),
//       toUtc: range.toUtc?.toISOString?.(),
//       sortBy,
//       sortDir,
//       page,
//       pageSize,
//     };
//     try {
//       const { data } = await axiosClient.post(
//         "/report/message-logs/search",
//         body
//       );
//       setRows(data.items || []);
//       const computedTotalPages =
//         typeof data.totalPages === "number"
//           ? data.totalPages
//           : Math.ceil((data.totalCount ?? 0) / (data.pageSize ?? pageSize));
//       setTotalPages(
//         Number.isFinite(computedTotalPages) ? computedTotalPages : 0
//       );
//       setTotalCount(data.totalCount ?? (data.items ? data.items.length : 0));
//     } catch {
//       toast.error("❌ Failed to load message logs");
//       setRows([]);
//       setTotalPages(0);
//       setTotalCount(0);
//     } finally {
//       setLoading(false);
//     }
//   }, [
//     search,
//     statuses,
//     senderIds,
//     wabaIds,
//     rangeKey,
//     sortBy,
//     sortDir,
//     page,
//     pageSize,
//   ]);

//   useEffect(() => {
//     fetchFacets();
//   }, [fetchFacets]);

//   useEffect(() => {
//     const t = setTimeout(fetchRows, 250);
//     return () => clearTimeout(t);
//   }, [fetchRows]);

//   // sorting
//   const toggleSort = col => {
//     if (sortBy === col) setSortDir(d => (d === "asc" ? "desc" : "asc"));
//     else {
//       setSortBy(col);
//       setSortDir("desc");
//     }
//     setPage(1);
//   };

//   // exports (headers updated to match new columns)
//   const commonExportBody = () => ({
//     search: search || undefined,
//     statuses: statuses.length ? statuses : undefined,
//     senderIds: senderIds.length ? senderIds : undefined,
//     wabaIds: wabaIds.length ? wabaIds : undefined,
//     fromUtc: range.fromUtc?.toISOString?.(),
//     toUtc: range.toUtc?.toISOString?.(),
//     sortBy,
//     sortDir,
//   });

//   const exportCsv = async () => {
//     try {
//       const res = await axiosClient.post(
//         "/report/message-logs/export/csv",
//         commonExportBody(),
//         { responseType: "blob" }
//       );
//       saveAs(res.data, `MessageLogs.csv`);
//     } catch {
//       // fallback current page
//       const headers = [
//         "Date",
//         "Contacts",
//         "Sender Id",
//         "Status",
//         "Campaign",
//         "Message",
//         "MessageId",
//         "Error",
//       ];
//       const csvRows = [
//         headers,
//         ...rows.map(r => [
//           r.sentAt
//             ? new Date(r.sentAt).toLocaleString()
//             : new Date(r.createdAt).toLocaleString(),
//           r.recipientNumber || "",
//           r.senderId || "",
//           r.status || "",
//           r.campaignName || r.campaignId || "",
//           (r.messageContent || "").replace(/\r?\n/g, " ").slice(0, 500),
//           r.providerMessageId || "",
//           (r.errorMessage || "").replace(/\r?\n/g, " ").slice(0, 500),
//         ]),
//       ];
//       const blob = new Blob([csvRows.map(r => r.join(",")).join("\n")], {
//         type: "text/csv",
//       });
//       saveAs(blob, `MessageLogs.csv`);
//     }
//   };
//   const exportXlsx = async () => {
//     try {
//       const res = await axiosClient.post(
//         "/report/message-logs/export/xlsx",
//         commonExportBody(),
//         { responseType: "blob" }
//       );
//       saveAs(res.data, `MessageLogs.xlsx`);
//     } catch {
//       toast.error("XLSX export not available");
//     }
//   };

//   const getDisplayPhone = log => {
//     const clean = v => (typeof v === "string" ? v.trim() : v);
//     const p = clean(log?.contactPhone);
//     if (p && p !== "-" && p.toLowerCase() !== "n/a") return p;
//     const r = clean(log?.recipientNumber) || clean(log?.to);
//     return r || "";
//   };

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <h1 className="text-2xl font-bold text-purple-700">
//           📊 Message Send Logs{" "}
//           <span className="text-sm text-gray-500">(All messages)</span>
//         </h1>
//         <div className="space-x-2">
//           <button
//             onClick={exportCsv}
//             className="bg-emerald-600 text-white text-sm px-3 py-1 rounded hover:bg-emerald-700"
//           >
//             CSV
//           </button>
//           <button
//             onClick={exportXlsx}
//             className="bg-emerald-700 text-white text-sm px-3 py-1 rounded hover:bg-emerald-800"
//           >
//             Excel
//           </button>

//           <Link
//             to="/app/campaigns/template-campaigns-list"
//             className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition"
//           >
//             <span className="text-lg">←</span> Back to Campaigns
//           </Link>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="grid lg:grid-cols-12 md:grid-cols-8 grid-cols-1 gap-4 mb-4">
//         <div className="lg:col-span-3 md:col-span-4 col-span-1">
//           <label className="text-sm text-gray-600 mb-1 block">
//             Search phone or text
//           </label>
//           <div className="relative">
//             <input
//               className="w-full border px-3 py-2 rounded pr-8"
//               placeholder="🔍 Search phone or text"
//               value={search}
//               onChange={e => {
//                 setSearch(e.target.value);
//                 setPage(1);
//               }}
//             />
//             <span className="absolute right-2 top-2.5 text-gray-400">⌕</span>
//           </div>
//         </div>

//         <div className="lg:col-span-2 md:col-span-4 col-span-1">
//           <label className="text-sm text-gray-600 mb-1 block">Date range</label>
//           <select
//             className="w-full border px-3 py-2 rounded"
//             value={dateKey}
//             onChange={e => {
//               setDateKey(e.target.value);
//               setPage(1);
//             }}
//           >
//             {DATE_PRESETS.map(p => (
//               <option key={p.key} value={p.key}>
//                 {p.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         {dateKey === "custom" && (
//           <>
//             <div className="lg:col-span-2 md:col-span-4 col-span-1">
//               <label className="text-sm text-gray-600 mb-1 block">From</label>
//               <input
//                 type="datetime-local"
//                 className="w-full border px-3 py-2 rounded"
//                 value={from}
//                 onChange={e => {
//                   setFrom(e.target.value);
//                   setPage(1);
//                 }}
//               />
//             </div>
//             <div className="lg:col-span-2 md:col-span-4 col-span-1">
//               <label className="text-sm text-gray-600 mb-1 block">To</label>
//               <input
//                 type="datetime-local"
//                 className="w-full border px-3 py-2 rounded"
//                 value={to}
//                 onChange={e => {
//                   setTo(e.target.value);
//                   setPage(1);
//                 }}
//               />
//             </div>
//           </>
//         )}

//         <div className="lg:col-span-2 md:col-span-4 col-span-1 relative">
//           <MultiSelect
//             label="Status"
//             options={toOptions(STATUS_OPTIONS)}
//             value={statuses}
//             onChange={next => {
//               setStatuses(next);
//               setPage(1);
//             }}
//             placeholder="All"
//           />
//         </div>

//         <div className="lg:col-span-2 md:col-span-4 col-span-1 relative">
//           <MultiSelect
//             label="Sender Id"
//             options={senderOptions}
//             value={senderIds}
//             onChange={next => {
//               setSenderIds(next);
//               setPage(1);
//             }}
//             placeholder="All"
//           />
//         </div>

//         <div className="lg:col-span-2 md:col-span-4 col-span-1 relative">
//           <MultiSelect
//             label="WABA Id"
//             options={wabaOptions}
//             value={wabaIds}
//             onChange={next => {
//               setWabaIds(next);
//               setPage(1);
//             }}
//             placeholder="All"
//           />
//         </div>
//       </div>

//       {/* Count */}
//       <div className="mb-3 text-sm text-gray-500">
//         Showing {rows.length} of {totalCount} logs
//       </div>

//       {/* Table */}
//       <div className="overflow-x-auto bg-white shadow rounded">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-100 sticky top-0 text-left">
//             <tr>
//               {[
//                 ["SentAt", "Time"],
//                 ["Recipient", "Contacts"],
//                 ["SenderId", "Sender Id"],
//                 ["Status", "Status"],
//                 ["CampaignName", "Campaign"],
//               ].map(([key, label]) => (
//                 <th
//                   key={key}
//                   className="p-2 cursor-pointer select-none whitespace-nowrap"
//                   onClick={() => toggleSort(key)}
//                 >
//                   {label}{" "}
//                   {sortBy === key ? (sortDir === "asc" ? "▲" : "▼") : ""}
//                 </th>
//               ))}
//               <th className="p-2 whitespace-nowrap">Message</th>
//               <th className="p-2 whitespace-nowrap">Message Id</th>
//               <th className="p-2 whitespace-nowrap">Error</th>
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr>
//                 <td className="p-3" colSpan={10}>
//                   Loading…
//                 </td>
//               </tr>
//             ) : rows.length === 0 ? (
//               <tr>
//                 <td className="p-3 text-gray-500" colSpan={10}>
//                   No logs found for the selected filters.
//                 </td>
//               </tr>
//             ) : (
//               rows.map(log => {
//                 const isFailed =
//                   String(log.status || "").toLowerCase() === "failed";
//                 return (
//                   <tr
//                     key={log.id}
//                     className={`border-t hover:bg-gray-50 ${
//                       isFailed ? "text-red-700" : ""
//                     }`}
//                   >
//                     <td className="p-2 whitespace-nowrap">
//                       {log.sentAt
//                         ? new Date(log.sentAt).toLocaleString()
//                         : new Date(log.createdAt).toLocaleString()}
//                     </td>
//                     <td className="p-2 whitespace-nowrap">
//                       {getDisplayPhone(log) || "-"}
//                     </td>
//                     <td className="p-2 whitespace-nowrap">
//                       {log.senderId || "-"}
//                     </td>
//                     <td className="p-2 whitespace-nowrap">
//                       {log.status || "-"}
//                     </td>
//                     <td className="p-2 whitespace-nowrap">
//                       {log.campaignName || log.campaignId || "-"}
//                     </td>

//                     <td className="p-2 max-w-[460px]">
//                       <div
//                         className="text-gray-800 truncate"
//                         title={log.messageContent || ""}
//                       >
//                         {log.messageContent || "-"}
//                       </div>
//                     </td>

//                     <td className="p-2 align-top">
//                       <MessageIdCell value={log.providerMessageId} />
//                     </td>

//                     <td className="p-2 max-w-[320px]">
//                       <div
//                         className={`truncate ${
//                           isFailed ? "text-red-700 font-medium" : ""
//                         }`}
//                         title={log.errorMessage || ""}
//                       >
//                         {log.errorMessage ? `❗ ${log.errorMessage}` : "-"}
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Paging */}
//       {totalPages > 1 && (
//         <div className="flex flex-wrap gap-2 justify-end items-center mt-4">
//           <button
//             className="px-2 py-1 text-sm border rounded"
//             disabled={page === 1}
//             onClick={() => setPage(p => p - 1)}
//           >
//             ⬅ Prev
//           </button>
//           <span className="text-sm text-gray-600">
//             Page {page} of {totalPages}
//           </span>
//           <button
//             className="px-2 py-1 text-sm border rounded"
//             disabled={page === totalPages}
//             onClick={() => setPage(p => p + 1)}
//           >
//             Next ➡
//           </button>
//           <select
//             className="border px-2 py-1 rounded"
//             value={pageSize}
//             onChange={e => {
//               setPageSize(parseInt(e.target.value, 10));
//               setPage(1);
//             }}
//           >
//             {[10, 25, 50, 100, 200].map(n => (
//               <option key={n} value={n}>
//                 {n}/page
//               </option>
//             ))}
//           </select>
//         </div>
//       )}
//     </div>
//   );
// }

// // 📄 src/pages/reports/MessageLogsReport.jsx
// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { saveAs } from "file-saver";

// // ✅ your custom multi-select
// import MultiSelect from "../../utils/MultiSelect";

// const STATUS_OPTIONS = ["Queued", "Sent", "Delivered", "Read", "Failed"];
// const DATE_PRESETS = [
//   { key: "today", label: "Today" },
//   { key: "yesterday", label: "Yesterday" },
//   { key: "last7", label: "Last 7 days" },
//   { key: "last30", label: "Last 30 days" },
//   { key: "custom", label: "Custom…" },
// ];

// const toOptions = arr => (arr || []).map(x => ({ label: x, value: x }));

// /* ---------- Message ID cell (truncate + compact overlay with Copy) ---------- */
// function MessageIdCell({ value }) {
//   const [copied, setCopied] = useState(false);
//   const full = value || "";
//   const short = full.length > 22 ? `${full.slice(0, 22)}…` : full;

//   const doCopy = async () => {
//     if (!full) return;
//     try {
//       await navigator.clipboard.writeText(full);
//       setCopied(true);
//       toast.dismiss();
//       toast.success("Message Id copied");
//       window.clearTimeout(doCopy._t);
//       doCopy._t = window.setTimeout(() => setCopied(false), 900);
//     } catch {
//       toast.error("Copy failed");
//     }
//   };

//   return (
//     <div className="relative group inline-block align-middle">
//       <span className="inline-block max-w-[220px] truncate font-mono">
//         {short || "-"}
//       </span>

//       {full && (
//         <div
//           className="
//             invisible group-hover:visible group-focus-within:visible
//             absolute left-0 mt-1 z-30
//             min-w-[280px] max-w-[520px]
//             bg-white border rounded shadow px-2 py-2
//           "
//           role="tooltip"
//         >
//           <div className="flex items-start gap-2">
//             <code className="text-xs break-all font-mono text-gray-900">
//               {full}
//             </code>
//             <button
//               type="button"
//               className="shrink-0 text-xs px-2 py-0.5 rounded border hover:bg-gray-50"
//               onClick={doCopy}
//             >
//               Copy
//             </button>
//           </div>
//           {copied && (
//             <div className="mt-1 text-[11px] text-emerald-600">Copied</div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// export default function MessageLogsReport() {
//   // data
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [totalPages, setTotalPages] = useState(0);
//   const [totalCount, setTotalCount] = useState(0);

//   // filters/paging/sort
//   const [search, setSearch] = useState("");
//   const [dateKey, setDateKey] = useState("last7");
//   const [from, setFrom] = useState(""); // yyyy-MM-ddThh:mm
//   const [to, setTo] = useState("");
//   const [statuses, setStatuses] = useState([]);
//   const [senderIds, setSenderIds] = useState([]);
//   const [wabaIds, setWabaIds] = useState([]);

//   // options (fetched)
//   const [senderOptions, setSenderOptions] = useState([]);
//   const [wabaOptions, setWabaOptions] = useState([]);

//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(25);
//   const [sortBy, setSortBy] = useState("SentAt");
//   const [sortDir, setSortDir] = useState("desc");

//   // date range
//   const range = useMemo(() => {
//     const end = new Date();
//     const start = new Date();
//     if (dateKey === "today") start.setHours(0, 0, 0, 0);
//     else if (dateKey === "yesterday") {
//       start.setDate(start.getDate() - 1);
//       start.setHours(0, 0, 0, 0);
//       end.setDate(end.getDate() - 1);
//       end.setHours(23, 59, 59, 999);
//     } else if (dateKey === "last7") {
//       start.setDate(start.getDate() - 6);
//       start.setHours(0, 0, 0, 0);
//     } else if (dateKey === "last30") {
//       start.setDate(start.getDate() - 29);
//       start.setHours(0, 0, 0, 0);
//     } else if (dateKey === "custom" && from && to) {
//       return { fromUtc: new Date(from), toUtc: new Date(to) };
//     }
//     return { fromUtc: start, toUtc: end };
//   }, [dateKey, from, to]);
//   const rangeKey = `${range.fromUtc?.toISOString?.() ?? ""}|${
//     range.toUtc?.toISOString?.() ?? ""
//   }`;

//   /* ---- fetchers ---- */
//   const fetchFacets = useCallback(async () => {
//     try {
//       const { data } = await axiosClient.get("/report/message-logs/facets");
//       if (data?.senderIds) setSenderOptions(toOptions(data.senderIds));
//       if (data?.wabaIds) setWabaOptions(toOptions(data.wabaIds));
//     } catch {
//       /* optional; ignore */
//     }
//   }, []);

//   const fetchRows = useCallback(async () => {
//     setLoading(true);
//     const body = {
//       search: search || undefined,
//       statuses: statuses.length ? statuses : undefined,
//       senderIds: senderIds.length ? senderIds : undefined,
//       wabaIds: wabaIds.length ? wabaIds : undefined,
//       fromUtc: range.fromUtc?.toISOString?.(),
//       toUtc: range.toUtc?.toISOString?.(),
//       sortBy,
//       sortDir,
//       page,
//       pageSize,
//     };
//     try {
//       const { data } = await axiosClient.post(
//         "/report/message-logs/search",
//         body
//       );
//       setRows(data.items || []);
//       const computedTotalPages =
//         typeof data.totalPages === "number"
//           ? data.totalPages
//           : Math.ceil((data.totalCount ?? 0) / (data.pageSize ?? pageSize));
//       setTotalPages(
//         Number.isFinite(computedTotalPages) ? computedTotalPages : 0
//       );
//       setTotalCount(data.totalCount ?? (data.items ? data.items.length : 0));
//     } catch {
//       toast.error("❌ Failed to load message logs");
//       setRows([]);
//       setTotalPages(0);
//       setTotalCount(0);
//     } finally {
//       setLoading(false);
//     }
//   }, [
//     search,
//     statuses,
//     senderIds,
//     wabaIds,
//     rangeKey,
//     sortBy,
//     sortDir,
//     page,
//     pageSize,
//   ]);

//   useEffect(() => {
//     fetchFacets();
//   }, [fetchFacets]);

//   useEffect(() => {
//     const t = setTimeout(fetchRows, 250);
//     return () => clearTimeout(t);
//   }, [fetchRows]);

//   const toggleSort = col => {
//     if (sortBy === col) setSortDir(d => (d === "asc" ? "desc" : "asc"));
//     else {
//       setSortBy(col);
//       setSortDir("desc");
//     }
//     setPage(1);
//   };

//   // export helpers
//   const commonExportBody = () => ({
//     search: search || undefined,
//     statuses: statuses.length ? statuses : undefined,
//     senderIds: senderIds.length ? senderIds : undefined,
//     wabaIds: wabaIds.length ? wabaIds : undefined,
//     fromUtc: range.fromUtc?.toISOString?.(),
//     toUtc: range.toUtc?.toISOString?.(),
//     sortBy,
//     sortDir,
//   });

//   const exportCsv = async () => {
//     try {
//       const res = await axiosClient.post(
//         "/report/message-logs/export/csv",
//         commonExportBody(),
//         { responseType: "blob" }
//       );
//       saveAs(res.data, `MessageLogs.csv`);
//     } catch {
//       toast.error("CSV export not available");
//     }
//   };
//   const exportXlsx = async () => {
//     try {
//       const res = await axiosClient.post(
//         "/report/message-logs/export/xlsx",
//         commonExportBody(),
//         { responseType: "blob" }
//       );
//       saveAs(res.data, `MessageLogs.xlsx`);
//     } catch {
//       toast.error("XLSX export not available");
//     }
//   };
//   const exportPdf = async () => {
//     try {
//       const res = await axiosClient.post(
//         "/report/message-logs/export/pdf",
//         commonExportBody(),
//         { responseType: "blob" }
//       );
//       saveAs(res.data, `MessageLogs.pdf`);
//     } catch {
//       toast.error("PDF export not available");
//     }
//   };

//   const getDisplayPhone = log => {
//     const clean = v => (typeof v === "string" ? v.trim() : v);
//     const p = clean(log?.contactPhone);
//     if (p && p !== "-" && p.toLowerCase() !== "n/a") return p;
//     const r = clean(log?.recipientNumber) || clean(log?.to);
//     return r || "";
//   };

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <h1 className="text-2xl font-bold text-purple-700">
//           📊 Message Send Logs{" "}
//           <span className="text-sm text-gray-500">(All messages)</span>
//         </h1>
//         <div className="space-x-2">
//           <button
//             onClick={exportCsv}
//             className="bg-emerald-600 text-white text-sm px-3 py-1 rounded hover:bg-emerald-700"
//           >
//             CSV
//           </button>
//           <button
//             onClick={exportXlsx}
//             className="bg-emerald-700 text-white text-sm px-3 py-1 rounded hover:bg-emerald-800"
//           >
//             Excel
//           </button>
//           <button
//             onClick={exportPdf}
//             className="bg-emerald-800 text-white text-sm px-3 py-1 rounded hover:bg-emerald-900"
//           >
//             PDF
//           </button>
//           <Link
//             to="/app/campaigns/template-campaigns-list"
//             className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition"
//           >
//             <span className="text-lg">←</span> Back to Campaigns
//           </Link>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="grid lg:grid-cols-12 md:grid-cols-8 grid-cols-1 gap-4 mb-4">
//         <div className="lg:col-span-3 md:col-span-4 col-span-1">
//           <label className="text-sm text-gray-600 mb-1 block">
//             Search phone or text
//           </label>
//           <div className="relative">
//             <input
//               className="w-full border px-3 py-2 rounded pr-8"
//               placeholder="🔍 Search phone or text"
//               value={search}
//               onChange={e => {
//                 setSearch(e.target.value);
//                 setPage(1);
//               }}
//             />
//             <span className="absolute right-2 top-2.5 text-gray-400">⌕</span>
//           </div>
//         </div>

//         <div className="lg:col-span-2 md:col-span-4 col-span-1">
//           <label className="text-sm text-gray-600 mb-1 block">Date range</label>
//           <select
//             className="w-full border px-3 py-2 rounded"
//             value={dateKey}
//             onChange={e => {
//               setDateKey(e.target.value);
//               setPage(1);
//             }}
//           >
//             {DATE_PRESETS.map(p => (
//               <option key={p.key} value={p.key}>
//                 {p.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         {dateKey === "custom" && (
//           <>
//             <div className="lg:col-span-2 md:col-span-4 col-span-1">
//               <label className="text-sm text-gray-600 mb-1 block">From</label>
//               <input
//                 type="datetime-local"
//                 className="w-full border px-3 py-2 rounded"
//                 value={from}
//                 onChange={e => {
//                   setFrom(e.target.value);
//                   setPage(1);
//                 }}
//               />
//             </div>
//             <div className="lg:col-span-2 md:col-span-4 col-span-1">
//               <label className="text-sm text-gray-600 mb-1 block">To</label>
//               <input
//                 type="datetime-local"
//                 className="w-full border px-3 py-2 rounded"
//                 value={to}
//                 onChange={e => {
//                   setTo(e.target.value);
//                   setPage(1);
//                 }}
//               />
//             </div>
//           </>
//         )}

//         <div className="lg:col-span-2 md:col-span-4 col-span-1 relative">
//           <MultiSelect
//             label="Status"
//             options={toOptions(STATUS_OPTIONS)}
//             value={statuses}
//             onChange={next => {
//               setStatuses(next);
//               setPage(1);
//             }}
//             placeholder="All"
//           />
//         </div>

//         <div className="lg:col-span-2 md:col-span-4 col-span-1 relative">
//           <MultiSelect
//             label="SenderId"
//             options={senderOptions}
//             value={senderIds}
//             onChange={next => {
//               setSenderIds(next);
//               setPage(1);
//             }}
//             placeholder="All"
//           />
//         </div>

//         <div className="lg:col-span-2 md:col-span-4 col-span-1 relative">
//           <MultiSelect
//             label="WABA Id"
//             options={wabaOptions}
//             value={wabaIds}
//             onChange={next => {
//               setWabaIds(next);
//               setPage(1);
//             }}
//             placeholder="All"
//           />
//         </div>
//       </div>

//       {/* Count */}
//       <div className="mb-3 text-sm text-gray-500">
//         Showing {rows.length} of {totalCount} logs
//       </div>

//       {/* Table */}
//       <div className="overflow-x-auto bg-white shadow rounded">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-100 sticky top-0 text-left">
//             <tr>
//               {[
//                 ["SentAt", "Time"],
//                 ["Recipient", "Recipient"],
//                 ["SenderId", "SenderId"],
//                 ["Status", "Status"],
//                 ["CampaignName", "Campaign"],
//               ].map(([key, label]) => (
//                 <th
//                   key={key}
//                   className="p-2 cursor-pointer select-none whitespace-nowrap"
//                   onClick={() => toggleSort(key)}
//                 >
//                   {label}{" "}
//                   {sortBy === key ? (sortDir === "asc" ? "▲" : "▼") : ""}
//                 </th>
//               ))}
//               <th className="p-2 whitespace-nowrap">Body</th>
//               <th className="p-2 whitespace-nowrap">Message Id</th>
//               <th className="p-2 whitespace-nowrap">Delivered</th>
//               <th className="p-2 whitespace-nowrap">Read</th>
//               <th className="p-2 whitespace-nowrap">Error</th>
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr>
//                 <td className="p-3" colSpan={12}>
//                   Loading…
//                 </td>
//               </tr>
//             ) : rows.length === 0 ? (
//               <tr>
//                 <td className="p-3 text-gray-500" colSpan={12}>
//                   No logs found for the selected filters.
//                 </td>
//               </tr>
//             ) : (
//               rows.map(log => (
//                 <tr key={log.id} className="border-t hover:bg-gray-50">
//                   <td className="p-2 whitespace-nowrap">
//                     {log.sentAt
//                       ? new Date(log.sentAt).toLocaleString()
//                       : new Date(log.createdAt).toLocaleString()}
//                   </td>
//                   <td className="p-2 whitespace-nowrap">
//                     {getDisplayPhone(log) || "-"}
//                   </td>
//                   <td className="p-2 whitespace-nowrap">
//                     {log.senderId || "-"}
//                   </td>
//                   <td className="p-2 whitespace-nowrap">{log.status || "-"}</td>
//                   <td className="p-2 whitespace-nowrap">
//                     {log.campaignName || log.campaignId || "-"}
//                   </td>
//                   <td
//                     className="p-2 max-w-[360px] truncate"
//                     title={log.messageContent || ""}
//                   >
//                     {log.messageContent || "-"}
//                   </td>

//                   <td className="p-2 whitespace-nowrap">
//                     <MessageIdCell value={log.providerMessageId} />
//                   </td>

//                   <td className="p-2 whitespace-nowrap">
//                     {log.deliveredAt
//                       ? new Date(log.deliveredAt).toLocaleString()
//                       : "-"}
//                   </td>
//                   <td className="p-2 whitespace-nowrap">
//                     {log.readAt ? new Date(log.readAt).toLocaleString() : "-"}
//                   </td>
//                   <td
//                     className="p-2 max-w-[280px] truncate"
//                     title={log.errorMessage || ""}
//                   >
//                     {log.errorMessage ? "❗ " : ""}
//                     {log.errorMessage || "-"}
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Paging */}
//       {totalPages > 1 && (
//         <div className="flex flex-wrap gap-2 justify-end items-center mt-4">
//           <button
//             className="px-2 py-1 text-sm border rounded"
//             disabled={page === 1}
//             onClick={() => setPage(p => p - 1)}
//           >
//             ⬅ Prev
//           </button>
//           <span className="text-sm text-gray-600">
//             Page {page} of {totalPages}
//           </span>
//           <button
//             className="px-2 py-1 text-sm border rounded"
//             disabled={page === totalPages}
//             onClick={() => setPage(p => p + 1)}
//           >
//             Next ➡
//           </button>
//           <select
//             className="border px-2 py-1 rounded"
//             value={pageSize}
//             onChange={e => {
//               setPageSize(parseInt(e.target.value, 10));
//               setPage(1);
//             }}
//           >
//             {[10, 25, 50, 100, 200].map(n => (
//               <option key={n} value={n}>
//                 {n}/page
//               </option>
//             ))}
//           </select>
//         </div>
//       )}
//     </div>
//   );
// }

// // 📄 src/pages/reports/MessageLogsReport.jsx
// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import { Link } from "react-router-dom";
// import axiosClient from "../../api/axiosClient";
// import { saveAs } from "file-saver";
// import { toast } from "react-toastify";

// // --- tiny UI helpers (kept simple / no external deps) ---
// const DATE_PRESETS = [
//   { key: "today", label: "Today" },
//   { key: "yesterday", label: "Yesterday" },
//   { key: "last7", label: "Last 7 days" },
//   { key: "last30", label: "Last 30 days" },
//   { key: "custom", label: "Custom…" },
// ];
// const STATUS_OPTIONS = ["Queued", "Sent", "Delivered", "Read", "Failed"];
// const TYPE_OPTIONS = ["text", "image", "document", "template"]; // keep if your API supports it

// function useDateRange(key, from, to) {
//   return useMemo(() => {
//     const end = new Date();
//     const start = new Date();
//     if (key === "today") {
//       start.setHours(0, 0, 0, 0);
//     } else if (key === "yesterday") {
//       start.setDate(start.getDate() - 1);
//       start.setHours(0, 0, 0, 0);
//       end.setDate(end.getDate() - 1);
//       end.setHours(23, 59, 59, 999);
//     } else if (key === "last7") {
//       start.setDate(start.getDate() - 6);
//       start.setHours(0, 0, 0, 0);
//     } else if (key === "last30") {
//       start.setDate(start.getDate() - 29);
//       start.setHours(0, 0, 0, 0);
//     } else if (key === "custom" && from && to) {
//       return { fromUtc: new Date(from), toUtc: new Date(to) };
//     }
//     return { fromUtc: start, toUtc: end };
//   }, [key, from, to]);
// }
// const rangeKey = r =>
//   `${r.fromUtc?.toISOString?.() ?? ""}|${r.toUtc?.toISOString?.() ?? ""}`;

// // Truncated + copy-on-hover cell for Message ID
// function MessageIdCell({ value }) {
//   const [copied, setCopied] = useState(false);
//   const full = value || "";
//   const short = full.length > 22 ? `${full.slice(0, 22)}…` : full;

//   const doCopy = async () => {
//     try {
//       await navigator.clipboard.writeText(full);
//       setCopied(true);
//       setTimeout(() => setCopied(false), 900);
//     } catch {
//       toast.error("Failed to copy");
//     }
//   };

//   return (
//     <div className="relative group max-w-[260px]">
//       {/* default view (no layout jump) */}
//       <div className="font-mono truncate text-gray-800">{short || "-"}</div>

//       {/* on hover/focus, reveal an overlay that shows full id + copy */}
//       {full ? (
//         <div
//           className="invisible group-hover:visible focus-within:visible absolute z-10 left-0 mt-1 min-w-[280px] max-w-[520px] p-2 rounded-md bg-white shadow border"
//           role="tooltip"
//         >
//           <div className="flex items-start gap-2">
//             <code className="font-mono text-xs break-all text-gray-900">
//               {full}
//             </code>
//             <button
//               onClick={doCopy}
//               className="shrink-0 rounded border px-2 py-0.5 text-xs hover:bg-gray-50"
//             >
//               Copy
//             </button>
//           </div>
//           {copied && (
//             <div className="mt-1 text-[11px] text-emerald-600">Copied</div>
//           )}
//         </div>
//       ) : null}
//     </div>
//   );
// }

// export default function MessageLogsReport() {
//   // data
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [totalPages, setTotalPages] = useState(0);
//   const [totalCount, setTotalCount] = useState(0);

//   // filters/paging/sort
//   const [search, setSearch] = useState("");
//   const [dateKey, setDateKey] = useState("last7");
//   const [from, setFrom] = useState("");
//   const [to, setTo] = useState("");
//   const [statuses, setStatuses] = useState([]); // multi
//   const [types, setTypes] = useState([]); // multi
//   const [senderIds, setSenderIds] = useState([]); // multi
//   const [wabaIds, setWabaIds] = useState([]); // multi

//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(25);
//   const [sortBy, setSortBy] = useState("SentAt");
//   const [sortDir, setSortDir] = useState("desc");

//   // options for SenderId / WABA dropdowns
//   const [senderOptions, setSenderOptions] = useState([]);
//   const [wabaOptions, setWabaOptions] = useState([]);

//   const range = useDateRange(dateKey, from, to);
//   const warnedOnce = useRef(false);

//   // load selectable SenderIds/WABAs (you can point these to your real endpoints)
//   useEffect(() => {
//     // These two are optional — if your API doesn't have list endpoints,
//     // you can remove this and keep the fields hidden or static.
//     (async () => {
//       try {
//         const [senders, wabas] = await Promise.allSettled([
//           axiosClient.get("/report/message-logs/senders"), // EXPECTED OPTIONAL ENDPOINT
//           axiosClient.get("/report/message-logs/wabas"), // EXPECTED OPTIONAL ENDPOINT
//         ]);
//         if (senders.status === "fulfilled") {
//           setSenderOptions(senders.value.data || []);
//         }
//         if (wabas.status === "fulfilled") {
//           setWabaOptions(wabas.value.data || []);
//         }
//       } catch {
//         // quiet
//       }
//     })();
//   }, []);

//   const fetchRows = useCallback(async () => {
//     setLoading(true);
//     const body = {
//       search: search || undefined,
//       statuses: statuses.length ? statuses : undefined,
//       messageTypes: types.length ? types : undefined,
//       senderIds: senderIds.length ? senderIds : undefined,
//       wabaIds: wabaIds.length ? wabaIds : undefined, // if backend supports it
//       fromUtc: range.fromUtc?.toISOString?.(),
//       toUtc: range.toUtc?.toISOString?.(),
//       sortBy,
//       sortDir,
//       page,
//       pageSize,
//     };

//     try {
//       const { data } = await axiosClient.post(
//         "/report/message-logs/search",
//         body
//       );
//       setRows(data.items || []);
//       const computedTotalPages =
//         typeof data.totalPages === "number"
//           ? data.totalPages
//           : Math.ceil((data.totalCount ?? 0) / (data.pageSize ?? pageSize));
//       setTotalPages(
//         Number.isFinite(computedTotalPages) ? computedTotalPages : 0
//       );
//       setTotalCount(data.totalCount ?? (data.items ? data.items.length : 0));
//     } catch (e) {
//       if (!warnedOnce.current) {
//         toast.error("Failed to load message logs.");
//         warnedOnce.current = true;
//       }
//       setRows([]);
//       setTotalPages(0);
//       setTotalCount(0);
//     } finally {
//       setLoading(false);
//     }
//   }, [
//     search,
//     statuses,
//     types,
//     senderIds,
//     wabaIds,
//     rangeKey(range),
//     sortBy,
//     sortDir,
//     page,
//     pageSize,
//   ]);

//   useEffect(() => {
//     const t = setTimeout(fetchRows, 250);
//     return () => clearTimeout(t);
//   }, [fetchRows]);

//   const toggleSort = col => {
//     if (sortBy === col) setSortDir(d => (d === "asc" ? "desc" : "asc"));
//     else {
//       setSortBy(col);
//       setSortDir("desc");
//     }
//     setPage(1);
//   };

//   // export helpers (leave as-is)
//   const exportCsv = async () => {
//     const body = {
//       search: search || undefined,
//       statuses: statuses.length ? statuses : undefined,
//       messageTypes: types.length ? types : undefined,
//       senderIds: senderIds.length ? senderIds : undefined,
//       wabaIds: wabaIds.length ? wabaIds : undefined,
//       fromUtc: range.fromUtc?.toISOString?.(),
//       toUtc: range.toUtc?.toISOString?.(),
//       sortBy,
//       sortDir,
//     };
//     try {
//       const res = await axiosClient.post(
//         "/report/message-logs/export/csv",
//         body,
//         {
//           responseType: "blob",
//         }
//       );
//       saveAs(res.data, "MessageLogs.csv");
//     } catch {
//       toast.error("CSV export not available");
//     }
//   };
//   const exportXlsx = async () => {
//     const body = {
//       search: search || undefined,
//       statuses: statuses.length ? statuses : undefined,
//       messageTypes: types.length ? types : undefined,
//       senderIds: senderIds.length ? senderIds : undefined,
//       wabaIds: wabaIds.length ? wabaIds : undefined,
//       fromUtc: range.fromUtc?.toISOString?.(),
//       toUtc: range.toUtc?.toISOString?.(),
//       sortBy,
//       sortDir,
//     };
//     try {
//       const res = await axiosClient.post(
//         "/report/message-logs/export/xlsx",
//         body,
//         {
//           responseType: "blob",
//         }
//       );
//       saveAs(res.data, "MessageLogs.xlsx");
//     } catch {
//       toast.error("XLSX export not available");
//     }
//   };
//   const exportPdf = async () => {
//     const body = {
//       search: search || undefined,
//       statuses: statuses.length ? statuses : undefined,
//       messageTypes: types.length ? types : undefined,
//       senderIds: senderIds.length ? senderIds : undefined,
//       wabaIds: wabaIds.length ? wabaIds : undefined,
//       fromUtc: range.fromUtc?.toISOString?.(),
//       toUtc: range.toUtc?.toISOString?.(),
//       sortBy,
//       sortDir,
//     };
//     try {
//       const res = await axiosClient.post(
//         "/report/message-logs/export/pdf",
//         body,
//         {
//           responseType: "blob",
//         }
//       );
//       saveAs(res.data, "MessageLogs.pdf");
//     } catch {
//       toast.error("PDF export not available");
//     }
//   };

//   // helpers
//   const getDisplayPhone = log => {
//     const clean = v => (typeof v === "string" ? v.trim() : v);
//     const p = clean(log?.contactPhone);
//     if (p && p !== "-" && p.toLowerCase() !== "n/a") return p;
//     const r = clean(log?.recipientNumber) || clean(log?.to);
//     return r || "";
//   };

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-5">
//         <h1 className="text-2xl font-bold text-purple-700">
//           📊 Message Send Logs{" "}
//           <span className="text-sm text-gray-500">(All messages)</span>
//         </h1>
//         <div className="space-x-2">
//           <button
//             onClick={exportCsv}
//             className="bg-emerald-600 text-white text-sm px-3 py-1 rounded hover:bg-emerald-700"
//           >
//             CSV
//           </button>
//           <button
//             onClick={exportXlsx}
//             className="bg-emerald-700 text-white text-sm px-3 py-1 rounded hover:bg-emerald-800"
//           >
//             Excel
//           </button>
//           <button
//             onClick={exportPdf}
//             className="bg-emerald-800 text-white text-sm px-3 py-1 rounded hover:bg-emerald-900"
//           >
//             PDF
//           </button>
//           <Link
//             to="/app/campaigns/template-campaigns-list"
//             className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition"
//           >
//             <span className="text-lg">←</span> Back to Campaigns
//           </Link>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="grid lg:grid-cols-6 md:grid-cols-3 gap-3 mb-4">
//         <div className="flex flex-col">
//           <label className="text-sm text-gray-600 mb-1">
//             Search phone or text
//           </label>
//           <input
//             className="border px-3 py-2 rounded"
//             placeholder="🔍 Search phone or text"
//             value={search}
//             onChange={e => {
//               setSearch(e.target.value);
//               setPage(1);
//             }}
//           />
//         </div>

//         <div className="flex flex-col">
//           <label className="text-sm text-gray-600 mb-1">Date range</label>
//           <select
//             className="border px-3 py-2 rounded"
//             value={dateKey}
//             onChange={e => {
//               setDateKey(e.target.value);
//               setPage(1);
//             }}
//           >
//             {DATE_PRESETS.map(p => (
//               <option key={p.key} value={p.key}>
//                 {p.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         {dateKey === "custom" && (
//           <>
//             <div className="flex flex-col">
//               <label className="text-sm text-gray-600 mb-1">From</label>
//               <input
//                 type="datetime-local"
//                 className="border px-3 py-2 rounded"
//                 value={from}
//                 onChange={e => {
//                   setFrom(e.target.value);
//                   setPage(1);
//                 }}
//               />
//             </div>
//             <div className="flex flex-col">
//               <label className="text-sm text-gray-600 mb-1">To</label>
//               <input
//                 type="datetime-local"
//                 className="border px-3 py-2 rounded"
//                 value={to}
//                 onChange={e => {
//                   setTo(e.target.value);
//                   setPage(1);
//                 }}
//               />
//             </div>
//           </>
//         )}

//         <div className="flex flex-col">
//           <label className="text-sm text-gray-600 mb-1">Status</label>
//           <select
//             multiple
//             className="border px-3 py-2 rounded h-[42px]"
//             value={statuses}
//             onChange={e => {
//               setStatuses(
//                 Array.from(e.target.selectedOptions).map(o => o.value)
//               );
//               setPage(1);
//             }}
//           >
//             {STATUS_OPTIONS.map(s => (
//               <option key={s} value={s}>
//                 {s}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="flex flex-col">
//           <label className="text-sm text-gray-600 mb-1">Type</label>
//           <select
//             multiple
//             className="border px-3 py-2 rounded h-[42px]"
//             value={types}
//             onChange={e => {
//               setTypes(Array.from(e.target.selectedOptions).map(o => o.value));
//               setPage(1);
//             }}
//           >
//             {TYPE_OPTIONS.map(t => (
//               <option key={t} value={t}>
//                 {t}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="flex flex-col">
//           <label className="text-sm text-gray-600 mb-1">SenderId</label>
//           <select
//             multiple
//             className="border px-3 py-2 rounded h-[42px]"
//             value={senderIds}
//             onChange={e => {
//               setSenderIds(
//                 Array.from(e.target.selectedOptions).map(o => o.value)
//               );
//               setPage(1);
//             }}
//           >
//             {senderOptions.length === 0 ? (
//               <option value="" disabled>
//                 No data
//               </option>
//             ) : null}
//             {senderOptions.map(v => (
//               <option key={v} value={v}>
//                 {v}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="flex flex-col">
//           <label className="text-sm text-gray-600 mb-1">WABA Id</label>
//           <select
//             multiple
//             className="border px-3 py-2 rounded h-[42px]"
//             value={wabaIds}
//             onChange={e => {
//               setWabaIds(
//                 Array.from(e.target.selectedOptions).map(o => o.value)
//               );
//               setPage(1);
//             }}
//           >
//             {wabaOptions.length === 0 ? (
//               <option value="" disabled>
//                 No data
//               </option>
//             ) : null}
//             {wabaOptions.map(v => (
//               <option key={v} value={v}>
//                 {v}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {/* Count */}
//       <div className="mb-3 text-sm text-gray-500">
//         Showing {rows.length} of {totalCount} logs
//       </div>

//       {/* Table */}
//       <div className="overflow-x-auto bg-white shadow rounded">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-100 sticky top-0 text-left">
//             <tr>
//               {[
//                 ["SentAt", "Time"],
//                 ["Recipient", "Recipient"],
//                 ["SenderId", "SenderId"],
//                 ["Status", "Status"],
//                 ["MessageType", "Type"],
//                 ["CampaignName", "Campaign"],
//               ].map(([key, label]) => (
//                 <th
//                   key={key}
//                   className="p-2 cursor-pointer select-none"
//                   onClick={() => toggleSort(key)}
//                 >
//                   {label}{" "}
//                   {sortBy === key ? (sortDir === "asc" ? "▲" : "▼") : ""}
//                 </th>
//               ))}
//               <th className="p-2">Body</th>
//               <th className="p-2">Message ID</th>
//               <th className="p-2">Delivered</th>
//               <th className="p-2">Read</th>
//               <th className="p-2">Error</th>
//               {/* NO Actions column anymore */}
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr>
//                 <td className="p-3" colSpan={13}>
//                   Loading…
//                 </td>
//               </tr>
//             ) : rows.length === 0 ? (
//               <tr>
//                 <td className="p-3 text-gray-500" colSpan={13}>
//                   No logs found for the selected filters.
//                 </td>
//               </tr>
//             ) : (
//               rows.map(log => (
//                 <tr key={log.id} className="border-t hover:bg-gray-50">
//                   <td className="p-2">
//                     {log.sentAt
//                       ? new Date(log.sentAt).toLocaleString()
//                       : new Date(log.createdAt).toLocaleString()}
//                   </td>
//                   <td className="p-2 whitespace-nowrap">
//                     {getDisplayPhone(log) || "-"}
//                   </td>
//                   <td className="p-2 whitespace-nowrap">
//                     {log.senderId || "-"}
//                   </td>
//                   <td className="p-2 whitespace-nowrap">{log.status || "-"}</td>
//                   <td className="p-2 whitespace-nowrap">
//                     {log.messageType || "-"}
//                   </td>
//                   <td className="p-2 whitespace-nowrap">
//                     {log.campaignName || log.campaignId || "-"}
//                   </td>
//                   <td
//                     className="p-2 max-w-[420px] truncate"
//                     title={log.messageContent || ""}
//                   >
//                     {log.messageContent || "-"}
//                   </td>
//                   <td className="p-2">
//                     <MessageIdCell value={log.providerMessageId} />
//                   </td>
//                   <td className="p-2 whitespace-nowrap">
//                     {log.deliveredAt
//                       ? new Date(log.deliveredAt).toLocaleString()
//                       : "-"}
//                   </td>
//                   <td className="p-2 whitespace-nowrap">
//                     {log.readAt ? new Date(log.readAt).toLocaleString() : "-"}
//                   </td>
//                   <td
//                     className="p-2 max-w-[280px] truncate"
//                     title={log.errorMessage || ""}
//                   >
//                     {log.errorMessage ? "❗ " : ""}
//                     {log.errorMessage || "-"}
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Paging */}
//       {totalPages > 1 && (
//         <div className="flex justify-end items-center mt-4 space-x-2">
//           <button
//             className="px-2 py-1 text-sm border rounded"
//             disabled={page === 1}
//             onClick={() => setPage(p => p - 1)}
//           >
//             ⬅ Prev
//           </button>
//           <span className="text-sm text-gray-600">
//             Page {page} of {totalPages}
//           </span>
//           <button
//             className="px-2 py-1 text-sm border rounded"
//             disabled={page === totalPages}
//             onClick={() => setPage(p => p + 1)}
//           >
//             Next ➡
//           </button>
//           <select
//             className="border px-2 py-1 rounded"
//             value={pageSize}
//             onChange={e => {
//               setPageSize(parseInt(e.target.value, 10));
//               setPage(1);
//             }}
//           >
//             {[10, 25, 50, 100, 200].map(n => (
//               <option key={n} value={n}>
//                 {n}/page
//               </option>
//             ))}
//           </select>
//         </div>
//       )}
//     </div>
//   );
// }

// // 📄 src/pages/reports/MessageLogsReport.jsx
// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import { useLocation, Link } from "react-router-dom";
// import axiosClient from "../../api/axiosClient";
// import { saveAs } from "file-saver";
// import { toast } from "react-toastify";
// import { confirmAlert } from "react-confirm-alert";
// import "react-confirm-alert/src/react-confirm-alert.css";

// // ---------- Config ----------
// const STATUS_OPTIONS = ["Queued", "Sent", "Delivered", "Read", "Failed"];
// const TYPE_OPTIONS = ["text", "image", "document", "template"];

// const DATE_PRESETS = [
//   { key: "today", label: "Today" },
//   { key: "yesterday", label: "Yesterday" },
//   { key: "last7", label: "Last 7 days" },
//   { key: "last30", label: "Last 30 days" },
//   { key: "custom", label: "Custom range…" },
// ];

// const isGuid = s =>
//   typeof s === "string" &&
//   /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
//     s
//   );

// // ---------- Small UI primitives ----------
// function Badge({ children }) {
//   return (
//     <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-gray-700 bg-white">
//       {children}
//     </span>
//   );
// }

// function IconButton({ children, ...props }) {
//   return (
//     <button
//       {...props}
//       className={
//         "inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 " +
//         (props.className || "")
//       }
//     >
//       {children}
//     </button>
//   );
// }

// // Lightweight popover multi-select (no external libs)
// function MultiSelect({ label, options, values, onChange, className }) {
//   const [open, setOpen] = useState(false);
//   const ref = useRef(null);
//   useEffect(() => {
//     const onDoc = e => {
//       if (!ref.current || ref.current.contains(e.target)) return;
//       setOpen(false);
//     };
//     document.addEventListener("mousedown", onDoc);
//     return () => document.removeEventListener("mousedown", onDoc);
//   }, []);
//   const toggle = opt => {
//     const has = values.includes(opt);
//     const next = has ? values.filter(v => v !== opt) : [...values, opt];
//     onChange(next);
//   };
//   const summary =
//     values.length === 0
//       ? "All"
//       : values.length === 1
//       ? values[0]
//       : `${values.length} selected`;

//   return (
//     <div ref={ref} className={"relative " + (className || "")}>
//       <button
//         type="button"
//         onClick={() => setOpen(v => !v)}
//         className="w-full rounded-lg border bg-white px-3 py-2 text-left text-sm hover:bg-gray-50"
//       >
//         <div className="flex items-center justify-between">
//           <span className="text-gray-500">{label}</span>
//           <span className="font-medium text-gray-800">{summary}</span>
//         </div>
//       </button>

//       {open && (
//         <div className="absolute z-20 mt-2 w-56 rounded-lg border bg-white shadow-lg">
//           <div className="max-h-64 overflow-auto p-2">
//             {options.map(opt => {
//               const checked = values.includes(opt);
//               return (
//                 <label
//                   key={opt}
//                   className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50"
//                 >
//                   <input
//                     type="checkbox"
//                     className="h-4 w-4 rounded border-gray-300"
//                     checked={checked}
//                     onChange={() => toggle(opt)}
//                   />
//                   <span className="text-sm text-gray-800">{opt}</span>
//                 </label>
//               );
//             })}
//           </div>
//           <div className="flex items-center justify-between border-t px-2 py-1.5">
//             <button
//               className="text-xs text-gray-600 hover:underline"
//               onClick={() => onChange([])}
//             >
//               Clear
//             </button>
//             <button
//               className="rounded-md bg-gray-900 px-2 py-1 text-xs text-white hover:bg-black"
//               onClick={() => setOpen(false)}
//             >
//               Done
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // ---------- Page ----------
// export default function MessageLogsReport() {
//   const { search: qs } = useLocation();
//   const urlCampaignId = new URLSearchParams(qs).get("campaignId");
//   const campaignId = isGuid(urlCampaignId) ? urlCampaignId : undefined;

//   // table state
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [totalCount, setTotalCount] = useState(0);
//   const [totalPages, setTotalPages] = useState(0);

//   // filters
//   const [q, setQ] = useState("");
//   const [dateKey, setDateKey] = useState("last7");
//   const [from, setFrom] = useState(""); // yyyy-MM-ddThh:mm
//   const [to, setTo] = useState("");

//   const [statuses, setStatuses] = useState([]);
//   const [types, setTypes] = useState([]);
//   const [senderIds, setSenderIds] = useState([]);

//   // paging & sort
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(25);
//   const [sortBy, setSortBy] = useState("SentAt");
//   const [sortDir, setSortDir] = useState("desc");

//   // derived date range
//   const range = useMemo(() => {
//     const end = new Date();
//     const start = new Date();
//     if (dateKey === "today") start.setHours(0, 0, 0, 0);
//     else if (dateKey === "yesterday") {
//       start.setDate(start.getDate() - 1);
//       start.setHours(0, 0, 0, 0);
//       end.setDate(end.getDate() - 1);
//       end.setHours(23, 59, 59, 999);
//     } else if (dateKey === "last7") {
//       start.setDate(start.getDate() - 6);
//       start.setHours(0, 0, 0, 0);
//     } else if (dateKey === "last30") {
//       start.setDate(start.getDate() - 29);
//       start.setHours(0, 0, 0, 0);
//     } else if (dateKey === "custom" && from && to) {
//       return { fromUtc: new Date(from), toUtc: new Date(to) };
//     }
//     return { fromUtc: start, toUtc: end };
//   }, [dateKey, from, to]);

//   const rangeKey = useMemo(
//     () =>
//       `${range.fromUtc?.toISOString?.() ?? ""}|${
//         range.toUtc?.toISOString?.() ?? ""
//       }`,
//     [range]
//   );

//   const fetchRows = useCallback(async () => {
//     setLoading(true);
//     const body = {
//       search: q || undefined,
//       statuses: statuses.length ? statuses : undefined,
//       messageTypes: types.length ? types : undefined,
//       senderIds: senderIds.length ? senderIds : undefined,
//       fromUtc: range.fromUtc?.toISOString?.(),
//       toUtc: range.toUtc?.toISOString?.(),
//       campaignId, // optional scope
//       sortBy,
//       sortDir,
//       page,
//       pageSize,
//     };

//     try {
//       const { data } = await axiosClient.post(
//         "/report/message-logs/search",
//         body
//       );
//       setRows(data.items || []);
//       const pages =
//         typeof data.totalPages === "number"
//           ? data.totalPages
//           : Math.ceil((data.totalCount ?? 0) / (data.pageSize ?? pageSize));
//       setTotalPages(Number.isFinite(pages) ? pages : 0);
//       setTotalCount(data.totalCount ?? (data.items ? data.items.length : 0));
//     } catch (e) {
//       setRows([]);
//       setTotalPages(0);
//       setTotalCount(0);
//       // axiosClient already toasts a friendly message
//     } finally {
//       setLoading(false);
//     }
//   }, [
//     q,
//     statuses,
//     types,
//     senderIds,
//     rangeKey,
//     campaignId,
//     sortBy,
//     sortDir,
//     page,
//     pageSize,
//   ]);

//   useEffect(() => {
//     const t = setTimeout(fetchRows, 200);
//     return () => clearTimeout(t);
//   }, [fetchRows]);

//   // sort
//   const toggleSort = col => {
//     if (sortBy === col) setSortDir(d => (d === "asc" ? "desc" : "asc"));
//     else {
//       setSortBy(col);
//       setSortDir("desc");
//     }
//     setPage(1);
//   };

//   // retry all (campaign scope only)
//   const retryAll = () => {
//     if (!campaignId) return;
//     confirmAlert({
//       title: "Retry All Failed Messages?",
//       message: "This will retry all failed messages in this campaign.",
//       buttons: [
//         {
//           label: "Yes",
//           onClick: async () => {
//             try {
//               const res = await axiosClient.post(
//                 `/campaign-logs/campaign/${campaignId}/retry-all`
//               );
//               toast.success(`✅ Retried ${res.data.retried} messages`);
//               fetchRows();
//             } catch {
//               // toast handled by interceptor
//             }
//           },
//         },
//         { label: "Cancel" },
//       ],
//     });
//   };

//   const exportCommon = async fmt => {
//     const body = {
//       search: q || undefined,
//       statuses: statuses.length ? statuses : undefined,
//       messageTypes: types.length ? types : undefined,
//       senderIds: senderIds.length ? senderIds : undefined,
//       fromUtc: range.fromUtc?.toISOString?.(),
//       toUtc: range.toUtc?.toISOString?.(),
//       campaignId,
//       sortBy,
//       sortDir,
//     };
//     const path =
//       fmt === "csv"
//         ? "/report/message-logs/export/csv"
//         : fmt === "xlsx"
//         ? "/report/message-logs/export/xlsx"
//         : "/report/message-logs/export/pdf";
//     try {
//       const res = await axiosClient.post(path, body, { responseType: "blob" });
//       saveAs(
//         res.data,
//         `MessageLogs${campaignId ? `-${campaignId}` : ""}.${fmt}`
//       );
//     } catch {
//       // toast already shown
//     }
//   };

//   const getPhone = log => {
//     const v = (
//       log?.contactPhone ||
//       log?.recipientNumber ||
//       log?.to ||
//       ""
//     ).trim();
//     return v && v !== "-" && v.toLowerCase() !== "n/a" ? v : "";
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       {/* Header */}
//       <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-purple-700">
//             📊 Message Send Logs
//           </h1>
//           <p className="text-sm text-gray-500">
//             {campaignId ? (
//               <Badge>Campaign scope</Badge>
//             ) : (
//               <Badge>All messages</Badge>
//             )}
//           </p>
//         </div>
//         <div className="flex flex-wrap items-center gap-2">
//           <IconButton onClick={() => exportCommon("csv")}>CSV</IconButton>
//           <IconButton
//             className="bg-emerald-700 hover:bg-emerald-800"
//             onClick={() => exportCommon("xlsx")}
//           >
//             Excel
//           </IconButton>
//           <IconButton
//             className="bg-emerald-800 hover:bg-emerald-900"
//             onClick={() => exportCommon("pdf")}
//           >
//             PDF
//           </IconButton>
//           <Link
//             to="/app/campaigns/template-campaigns-list"
//             className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
//           >
//             ← Back to Campaigns
//           </Link>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-12">
//         <div className="md:col-span-3">
//           <label className="mb-1 block text-xs font-medium text-gray-600">
//             Search
//           </label>
//           <input
//             className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
//             placeholder="Phone, text, provider id…"
//             value={q}
//             onChange={e => {
//               setQ(e.target.value);
//               setPage(1);
//             }}
//           />
//         </div>

//         <div className="md:col-span-2">
//           <label className="mb-1 block text-xs font-medium text-gray-600">
//             Date range
//           </label>
//           <select
//             className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
//             value={dateKey}
//             onChange={e => {
//               setDateKey(e.target.value);
//               setPage(1);
//             }}
//           >
//             {DATE_PRESETS.map(p => (
//               <option key={p.key} value={p.key}>
//                 {p.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         {dateKey === "custom" && (
//           <>
//             <div className="md:col-span-2">
//               <label className="mb-1 block text-xs font-medium text-gray-600">
//                 From
//               </label>
//               <input
//                 type="datetime-local"
//                 className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
//                 value={from}
//                 onChange={e => {
//                   setFrom(e.target.value);
//                   setPage(1);
//                 }}
//               />
//             </div>
//             <div className="md:col-span-2">
//               <label className="mb-1 block text-xs font-medium text-gray-600">
//                 To
//               </label>
//               <input
//                 type="datetime-local"
//                 className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
//                 value={to}
//                 onChange={e => {
//                   setTo(e.target.value);
//                   setPage(1);
//                 }}
//               />
//             </div>
//           </>
//         )}

//         <MultiSelect
//           className="md:col-span-2"
//           label="Status"
//           options={STATUS_OPTIONS}
//           values={statuses}
//           onChange={v => {
//             setStatuses(v);
//             setPage(1);
//           }}
//         />

//         <MultiSelect
//           className="md:col-span-2"
//           label="Type"
//           options={TYPE_OPTIONS}
//           values={types}
//           onChange={v => {
//             setTypes(v);
//             setPage(1);
//           }}
//         />

//         <div className="md:col-span-3">
//           <label className="mb-1 block text-xs font-medium text-gray-600">
//             SenderId(s)
//           </label>
//           <input
//             className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
//             placeholder="Comma separated phone_number_id"
//             value={senderIds.join(",")}
//             onChange={e => {
//               setSenderIds(
//                 e.target.value
//                   .split(",")
//                   .map(s => s.trim())
//                   .filter(Boolean)
//               );
//               setPage(1);
//             }}
//           />
//         </div>
//       </div>

//       {/* Top bar */}
//       <div className="mb-3 flex items-center justify-between">
//         <p className="text-sm text-gray-500">
//           Showing {rows.length} of {totalCount} logs
//         </p>
//         {campaignId && (
//           <button
//             onClick={retryAll}
//             className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-700"
//           >
//             🔁 Retry All Failed
//           </button>
//         )}
//       </div>

//       {/* Table */}
//       <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
//         <table className="w-full text-sm">
//           <thead className="sticky top-0 bg-gray-100 text-left">
//             <tr>
//               {[
//                 ["SentAt", "Time"],
//                 ["Recipient", "Recipient"],
//                 ["SenderId", "SenderId"],
//                 ["Status", "Status"],
//                 ["MessageType", "Type"],
//                 ["CampaignName", "Campaign"],
//               ].map(([key, label]) => (
//                 <th
//                   key={key}
//                   className="select-none p-3 font-semibold text-gray-700"
//                 >
//                   <button
//                     onClick={() => toggleSort(key)}
//                     className="inline-flex items-center gap-1"
//                   >
//                     <span>{label}</span>
//                     {sortBy === key && (
//                       <span className="text-gray-500">
//                         {sortDir === "asc" ? "▲" : "▼"}
//                       </span>
//                     )}
//                   </button>
//                 </th>
//               ))}
//               <th className="p-3 font-semibold text-gray-700">Body</th>
//               <th className="p-3 font-semibold text-gray-700">Provider Id</th>
//               <th className="p-3 font-semibold text-gray-700">Delivered</th>
//               <th className="p-3 font-semibold text-gray-700">Read</th>
//               <th className="p-3 font-semibold text-gray-700">Error</th>
//               <th className="p-3 font-semibold text-gray-700">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr>
//                 <td className="p-4 text-gray-500" colSpan={13}>
//                   Loading…
//                 </td>
//               </tr>
//             ) : rows.length === 0 ? (
//               <tr>
//                 <td className="p-4 text-gray-500" colSpan={13}>
//                   No logs found for the selected filters.
//                 </td>
//               </tr>
//             ) : (
//               rows.map(r => (
//                 <tr key={r.id} className="border-t hover:bg-gray-50">
//                   <td className="p-3">
//                     {r.sentAt
//                       ? new Date(r.sentAt).toLocaleString()
//                       : new Date(r.createdAt).toLocaleString()}
//                   </td>
//                   <td className="p-3">{getPhone(r) || "-"}</td>
//                   <td className="p-3">{r.senderId || "-"}</td>
//                   <td className="p-3">{r.status || "-"}</td>
//                   <td className="p-3">{r.messageType || "-"}</td>
//                   <td className="p-3">
//                     {r.campaignName || r.campaignId || "-"}
//                   </td>
//                   <td
//                     className="p-3 max-w-[420px] truncate"
//                     title={r.messageContent || ""}
//                   >
//                     {r.messageContent || "-"}
//                   </td>
//                   <td className="p-3">{r.providerMessageId || "-"}</td>
//                   <td className="p-3">
//                     {r.deliveredAt
//                       ? new Date(r.deliveredAt).toLocaleString()
//                       : "-"}
//                   </td>
//                   <td className="p-3">
//                     {r.readAt ? new Date(r.readAt).toLocaleString() : "-"}
//                   </td>
//                   <td
//                     className="p-3 max-w-[300px] truncate"
//                     title={r.errorMessage || ""}
//                   >
//                     {r.errorMessage ? "❗ " : ""}
//                     {r.errorMessage || "-"}
//                   </td>
//                   <td className="p-3">
//                     {/* Hook up real preview/journey if you want; left as no-op buttons to keep page self-contained */}
//                     <button className="text-xs text-blue-600 hover:underline">
//                       Preview
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Pagination */}
//       {totalPages > 1 && (
//         <div className="mt-4 flex items-center justify-end gap-2">
//           <button
//             className="rounded border px-2 py-1 text-sm disabled:opacity-50"
//             disabled={page === 1}
//             onClick={() => setPage(p => p - 1)}
//           >
//             ⬅ Prev
//           </button>
//           <span className="text-sm text-gray-600">
//             Page {page} of {totalPages}
//           </span>
//           <button
//             className="rounded border px-2 py-1 text-sm disabled:opacity-50"
//             disabled={page === totalPages}
//             onClick={() => setPage(p => p + 1)}
//           >
//             Next ➡
//           </button>
//           <select
//             className="rounded border px-2 py-1 text-sm"
//             value={pageSize}
//             onChange={e => {
//               setPageSize(parseInt(e.target.value, 10));
//               setPage(1);
//             }}
//           >
//             {[10, 25, 50, 100, 200].map(n => (
//               <option key={n} value={n}>
//                 {n}/page
//               </option>
//             ))}
//           </select>
//         </div>
//       )}
//     </div>
//   );
// }
