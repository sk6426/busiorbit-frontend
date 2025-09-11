// 📄 src/pages/campaigns/TemplateCampaignList.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import WhatsAppBubblePreview from "../../components/WhatsAppBubblePreview";
import TemplateCard from "./components/templates/TemplateCard";
import normalizeCampaign from "../../utils/normalizeTemplate";

import { useNavigate } from "react-router-dom";

import {
  FaRocket,
  FaSearch,
  FaSyncAlt,
  FaListUl,
  FaTable,
  FaThLarge,
  FaFilter,
} from "react-icons/fa";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

const TYPE_FILTERS = [
  { id: "all", label: "All" },
  { id: "image_header", label: "Image Header" },
  { id: "text_only", label: "Text Only" },
  { id: "with_buttons", label: "With Buttons" },
  { id: "no_buttons", label: "No Buttons" },
];

/* ---------- Inspector Modal ---------- */
// function InspectorModal({ item, onClose }) {
//   if (!item) return null;
//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
//       onClick={onClose}
//     >
//       <div
//         className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
//         onClick={e => e.stopPropagation()}
//       >
//         <div className="flex items-center justify-between border-b px-5 py-3">
//           <div>
//             <div className="text-lg font-semibold text-gray-900">
//               {item.name}
//             </div>
//             <div className="text-xs text-gray-500">Full fidelity preview</div>
//           </div>
//           <button
//             className="rounded-lg border px-3 py-1.5 text-gray-700 hover:bg-gray-50"
//             onClick={onClose}
//           >
//             Close
//           </button>
//         </div>
//         <div className="p-4">
//           <WhatsAppBubblePreview
//             messageTemplate={item.body}
//             multiButtons={item.buttons}
//             imageUrl={item.imageUrl || undefined}
//             caption={item.caption}
//             campaignId={item.id}
//           />
//         </div>
//         <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
//           <button
//             className="rounded-lg border px-3 py-2 text-gray-700 hover:bg-gray-50"
//             onClick={onClose}
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
/* ---------- Inspector Modal ---------- */
function InspectorModal({ item, onClose }) {
  if (!item) return null;

  // Normalize fields from different shapes (DB list vs. detail vs. legacy)
  const messageTemplate =
    item.body || item.messageBody || item.templateBody || "";

  // Buttons can be `buttons`, `multiButtons`, or a JSON string
  let buttonsRaw = item.buttons ?? item.multiButtons ?? [];
  if (typeof buttonsRaw === "string") {
    try {
      buttonsRaw = JSON.parse(buttonsRaw);
    } catch {
      buttonsRaw = [];
    }
  }

  const imageUrl =
    item.imageUrl || item.mediaUrl || item.headerImageUrl || undefined;

  const caption = item.caption || item.imageCaption || "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {item.name}
            </div>
            <div className="text-xs text-gray-500">Template Perview</div>
          </div>
          <button
            className="rounded-lg border px-3 py-1.5 text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="p-4">
          <WhatsAppBubblePreview
            messageTemplate={messageTemplate}
            multiButtons={buttonsRaw}
            imageUrl={imageUrl}
            caption={caption}
            campaignId={item.id}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
          <button
            className="rounded-lg border px-3 py-2 text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
function TemplateCampaignList() {
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);
  const [q, setQ] = useState("");
  const [onlyWithRecipients, setOnlyWithRecipients] = useState(false);
  const [sort, setSort] = useState("recent"); // recent | recipients | name
  const [activeType, setActiveType] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // grid | table
  const [inspector, setInspector] = useState(null);

  const navigate = useNavigate();

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/campaign/get-image-campaign");
      setRaw(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to load template campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleSend = async campaignId => {
    setSendingId(campaignId);
    try {
      await axiosClient.post(`/campaign/send-campaign/${campaignId}`);
      toast.success("🚀 Campaign sent successfully!");
    } catch (err) {
      console.error("❌ Sending failed:", err);
      toast.error("❌ Failed to send campaign");
    } finally {
      setSendingId(null);
    }
  };

  const data = useMemo(() => raw.map(normalizeCampaign), [raw]);

  const view = useMemo(() => {
    let list = data;

    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        c =>
          c.name.toLowerCase().includes(needle) ||
          c.body.toLowerCase().includes(needle)
      );
    }

    if (onlyWithRecipients) list = list.filter(c => c.recipients > 0);

    if (activeType !== "all") {
      list = list.filter(c => {
        if (activeType === "image_header") return c.kind === "image_header";
        if (activeType === "text_only") return c.kind === "text_only";
        if (activeType === "with_buttons") return c.hasButtons;
        if (activeType === "no_buttons") return !c.hasButtons;
        return true;
      });
    }

    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "recipients") return b.recipients - a.recipients;
      const ax = new Date(a.updatedAt || 0).getTime();
      const bx = new Date(b.updatedAt || 0).getTime();
      return bx - ax; // recent
    });

    return list;
  }, [data, q, onlyWithRecipients, activeType, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <FaRocket className="text-green-500 text-xl" />
          <h2 className="text-2xl md:text-2xl font-bold text-purple-500">
            Template Campaigns
          </h2>
          <button
            onClick={loadCampaigns}
            className="ml-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            title="Refresh"
          >
            <FaSyncAlt className={cx(loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by name or message…"
              className="w-full md:w-72 rounded-xl border pl-10 pr-3 py-2 focus:ring-2 focus:ring-purple-300 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyWithRecipients}
                onChange={e => setOnlyWithRecipients(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-400"
              />
              Only with recipients
            </label>

            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-purple-300 outline-none"
            >
              <option value="recent">Sort: Recent</option>
              <option value="recipients">Sort: Recipients</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Segmented filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-gray-600 flex items-center gap-2">
          <FaFilter /> Filter:
        </span>
        {TYPE_FILTERS.map(f => (
          <button
            key={f.id}
            className={cx(
              "rounded-full px-3 py-1 text-sm",
              activeType === f.id
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
            onClick={() => setActiveType(f.id)}
          >
            {f.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <button
            className={cx(
              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
              viewMode === "grid"
                ? "bg-purple-50 border-purple-200 text-purple-700"
                : "text-gray-700 hover:bg-gray-50"
            )}
            onClick={() => setViewMode("grid")}
            title="Grid view"
          >
            <FaThLarge /> Grid
          </button>
          <button
            className={cx(
              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
              viewMode === "table"
                ? "bg-purple-50 border-purple-200 text-purple-700"
                : "text-gray-700 hover:bg-gray-50"
            )}
            onClick={() => setViewMode("table")}
            title="Table view"
          >
            <FaTable /> Table
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border bg-white p-4 shadow-sm animate-pulse"
            >
              <div className="h-40 w-full rounded-xl bg-gray-100" />
              <div className="mt-4 h-5 w-2/3 rounded bg-gray-100" />
              <div className="mt-2 h-4 w-1/3 rounded bg-gray-100" />
              <div className="mt-4 h-20 w-full rounded bg-gray-100" />
              <div className="mt-4 flex gap-2">
                <div className="h-9 w-24 rounded bg-gray-100" />
                <div className="h-9 w-24 rounded bg-gray-100" />
                <div className="h-9 w-24 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && view.length === 0 && (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <div className="rounded-3xl border p-10 shadow-sm bg-white max-w-lg">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100">
              <FaListUl className="text-purple-600 text-xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">
              No template campaigns yet
            </h3>
            <p className="mt-2 text-gray-500">
              Create an image template campaign and assign recipients to start
              sending.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() =>
                  navigate("/app/campaigns/image-campaigns/create")
                }
                className="rounded-xl bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700"
              >
                New Campaign
              </button>
              <button
                onClick={loadCampaigns}
                className="rounded-xl border px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRID VIEW */}
      {!loading && view.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {view.map(t => {
            const sending = sendingId === t.id;
            return (
              <TemplateCard
                key={t.id}
                t={t}
                sending={sending}
                onOpenInspector={() => setInspector(t)}
                onSend={() => handleSend(t.id)}
                onAssign={() =>
                  navigate(
                    `/app/campaigns/image-campaigns/assign-contacts/${t.id}`
                  )
                }
                onViewRecipients={() =>
                  navigate(
                    `/app/campaigns/image-campaigns/assigned-contacts/${t.id}`
                  )
                }
              />
            );
          })}
        </div>
      )}

      {/* TABLE VIEW (compact) */}
      {!loading && view.length > 0 && viewMode === "table" && (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 z-10 bg-gray-50 text-left text-gray-700 border-b">
                <tr>
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Type</th>
                  <th className="px-3 py-2 font-semibold">Buttons</th>
                  <th className="px-3 py-2 font-semibold">Recipients</th>
                  <th className="px-3 py-2 font-semibold">Updated</th>
                  <th className="px-3 py-2 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {view.map(t => (
                  <tr
                    key={t.id}
                    className="border-t hover:bg-gray-50/70 transition-colors"
                  >
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {t.name}
                    </td>
                    <td className="px-3 py-2">
                      {t.kind === "image_header" ? "Image Header" : "Text Only"}
                    </td>
                    <td className="px-3 py-2">
                      {t.hasButtons ? t.buttons.length : 0}
                    </td>
                    <td className="px-3 py-2">{t.recipients}</td>
                    <td className="px-3 py-2">
                      {t.updatedAt
                        ? new Date(t.updatedAt).toLocaleString()
                        : "—"}
                    </td>
                    {/* <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          className="rounded-md border px-2.5 py-1.5 hover:bg-gray-50"
                          onClick={() => setInspector(t)}
                        >
                          Preview
                        </button>
                        <button
                          className="rounded-md bg-purple-100 px-2.5 py-1.5 text-purple-800 hover:bg-purple-200"
                          onClick={() =>
                            navigate(
                              `/app/campaigns/image-campaigns/assign-contacts/${t.id}`
                            )
                          }
                        >
                          Assign
                        </button>
                        <button
                          className="rounded-md bg-blue-100 px-2.5 py-1.5 text-blue-700 hover:bg-blue-200"
                          onClick={() =>
                            navigate(
                              `/app/campaigns/image-campaigns/assigned-contacts/${t.id}`
                            )
                          }
                        >
                          Recipients
                        </button>
                        <button
                          className="rounded-md bg-emerald-600 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          disabled={t.recipients === 0}
                          onClick={() => handleSend(t.id)}
                        >
                          Send
                        </button>
                      </div>
                    </td> */}
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          className="rounded-md border px-2.5 py-1.5 hover:bg-gray-50"
                          onClick={() => setInspector(t)}
                        >
                          Preview
                        </button>

                        {/* ✅ New Edit button */}
                        <button
                          className="rounded-md bg-yellow-100 px-2.5 py-1.5 text-yellow-800 hover:bg-yellow-200"
                          onClick={() =>
                            navigate(`/app/campaigns/logs/${t.id}`)
                          }
                        >
                          Log
                        </button>

                        <button
                          className="rounded-md bg-purple-100 px-2.5 py-1.5 text-purple-800 hover:bg-purple-200"
                          onClick={() =>
                            navigate(
                              `/app/campaigns/image-campaigns/assign-contacts/${t.id}`
                            )
                          }
                        >
                          Assign
                        </button>

                        <button
                          className="rounded-md bg-blue-100 px-2.5 py-1.5 text-blue-700 hover:bg-blue-200"
                          onClick={() =>
                            navigate(
                              `/app/campaigns/image-campaigns/assigned-contacts/${t.id}`
                            )
                          }
                        >
                          Recipients
                        </button>

                        <button
                          className="rounded-md bg-emerald-600 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          disabled={t.recipients === 0}
                          onClick={() => handleSend(t.id)}
                        >
                          Send
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InspectorModal item={inspector} onClose={() => setInspector(null)} />
    </div>
  );
}

export default TemplateCampaignList;

// // 📄 src/pages/campaigns/TemplateCampaignList.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import WhatsAppBubblePreview from "../../components/WhatsAppBubblePreview";
// import { useNavigate } from "react-router-dom";
// import {
//   FaRocket,
//   FaSearch,
//   FaSyncAlt,
//   FaImage,
//   FaUsers,
//   FaUserCheck,
//   FaListUl,
//   FaPaperPlane,
//   FaUserPlus,
//   FaTable,
//   FaThLarge,
//   FaFilter,
// } from "react-icons/fa";

// function cx(...xs) {
//   return xs.filter(Boolean).join(" ");
// }

// /** --------------------------------
//  * Helpers: robust extractors
//  * --------------------------------*/
// function pickFirst(...vals) {
//   for (const v of vals) {
//     if (v !== undefined && v !== null && String(v).trim() !== "") return v;
//   }
//   return "";
// }

// // BODY from multiple shapes
// function extractBody(raw) {
//   const flat = pickFirst(
//     raw?.messageBody,
//     raw?.templateBody,
//     raw?.sampleBody,
//     raw?.messageTemplate,
//     raw?.body,
//     raw?.text,
//     raw?.message
//   );
//   if (flat) return flat;

//   // WABA-like nested
//   const comp1 = raw?.template?.components?.find?.(
//     c => c?.type?.toUpperCase() === "BODY"
//   )?.text;
//   if (comp1) return comp1;

//   const comp2 = raw?.template?.components?.body?.text;
//   if (comp2) return comp2;

//   const comp3 = raw?.payload?.template?.body || raw?.payload?.template?.text;
//   if (comp3) return comp3;

//   const comp4 = raw?.content?.body;
//   if (comp4) return comp4;

//   return "";
// }

// // Buttons normalized to {title,type,value}
// function extractButtons(raw) {
//   const btns =
//     raw?.multiButtons ||
//     raw?.buttonParams ||
//     raw?.buttons ||
//     raw?.templateButtons ||
//     raw?.payload?.template?.buttons ||
//     raw?.content?.buttons ||
//     [];
//   return Array.isArray(btns)
//     ? btns.map(b => ({
//         title: b?.title ?? b?.buttonText ?? b?.text ?? "Button",
//         type: b?.type ?? b?.buttonType ?? "url",
//         value: b?.value ?? b?.targetUrl ?? b?.url ?? undefined,
//       }))
//     : [];
// }

// function extractImageUrl(raw) {
//   return (
//     raw?.imageUrl ||
//     raw?.mediaUrl ||
//     raw?.headerImage ||
//     raw?.template?.components?.find?.(c => c?.type?.toUpperCase() === "HEADER")
//       ?.example?.header_handle?.[0] ||
//     raw?.payload?.template?.image ||
//     null
//   );
// }

// function extractCaption(raw) {
//   return pickFirst(raw?.imageCaption, raw?.caption, raw?.headerCaption);
// }

// /** -----------------------
//  * Normalizer (single source of truth)
//  * ---------------------- */
// function normalizeCampaign(raw) {
//   const buttons = extractButtons(raw);
//   const imageUrl = extractImageUrl(raw);
//   const body = extractBody(raw);

//   if (!body) {
//     // Dev aid: see problematic records in console (won’t break UI)
//     // eslint-disable-next-line no-console
//     console.warn(
//       "[TemplateCampaignList] Empty body for campaign id:",
//       raw?.id,
//       raw
//     );
//   }

//   return {
//     id: raw?.id,
//     name: raw?.name || "Untitled Campaign",
//     kind: imageUrl ? "image_header" : "text_only",
//     body,
//     caption: extractCaption(raw),
//     imageUrl,
//     buttons,
//     hasButtons: Array.isArray(buttons) && buttons.length > 0,
//     recipients: raw?.recipientCount || 0,
//     updatedAt: raw?.updatedAt || raw?.createdAt || null,
//     raw, // keep original for any future needs
//   };
// }

// const TYPE_FILTERS = [
//   { id: "all", label: "All" },
//   { id: "image_header", label: "Image Header" },
//   { id: "text_only", label: "Text Only" },
//   { id: "with_buttons", label: "With Buttons" },
//   { id: "no_buttons", label: "No Buttons" },
// ];

// /** -----------------------
//  * Subcomponents
//  * ---------------------- */
// function InspectorModal({ item, onClose }) {
//   if (!item) return null;
//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
//       onClick={onClose}
//     >
//       <div
//         className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
//         onClick={e => e.stopPropagation()}
//       >
//         <div className="flex items-center justify-between border-b px-5 py-3">
//           <div>
//             <div className="text-lg font-semibold text-gray-900">
//               {item.name}
//             </div>
//             <div className="text-xs text-gray-500">Full fidelity preview</div>
//           </div>
//           <button
//             className="rounded-lg border px-3 py-1.5 text-gray-700 hover:bg-gray-50"
//             onClick={onClose}
//           >
//             Close
//           </button>
//         </div>
//         <div className="p-4">
//           <WhatsAppBubblePreview
//             messageTemplate={item.body}
//             multiButtons={item.buttons}
//             imageUrl={item.imageUrl || undefined}
//             caption={item.caption}
//             campaignId={item.id}
//           />
//         </div>
//         <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
//           <button
//             className="rounded-lg border px-3 py-2 text-gray-700 hover:bg-gray-50"
//             onClick={onClose}
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// function TemplateCard({
//   t,
//   onSend,
//   onAssign,
//   onViewRecipients,
//   onOpenInspector,
//   sending,
// }) {
//   const hasRecipients = t.recipients > 0;

//   return (
//     <div className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
//       {/* Media Slot — fixed 16:9 for uniformity */}
//       <div className="relative">
//         <div className="aspect-[16/9] w-full bg-gray-50 flex items-center justify-center">
//           {t.kind === "image_header" && t.imageUrl ? (
//             <img
//               src={t.imageUrl}
//               alt="Campaign"
//               className="h-full w-full object-cover"
//             />
//           ) : (
//             <div className="flex flex-col items-center text-gray-400">
//               <svg
//                 width="40"
//                 height="40"
//                 viewBox="0 0 24 24"
//                 className="opacity-80"
//               >
//                 <path
//                   fill="currentColor"
//                   d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14zm-2 0H5V5h14zM8 13l2.03 2.71L12 13l3 4H7z"
//                 />
//               </svg>
//               <span className="mt-2 text-xs text-gray-500">
//                 {t.kind === "text_only" ? "Text template" : "No media"}
//               </span>
//             </div>
//           )}
//         </div>

//         {/* Type chip (neutral) */}
//         <div className="absolute right-3 top-3">
//           <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white backdrop-blur-sm">
//             {t.kind === "image_header" ? "Image header" : "Text only"}
//           </span>
//         </div>
//       </div>

//       {/* Body */}
//       <div className="flex flex-col gap-3 p-4">
//         {/* Title + recipients */}
//         <div className="flex items-start justify-between gap-3">
//           <h3 className="line-clamp-1 text-base font-semibold text-gray-900">
//             {t.name}
//           </h3>
//           <span
//             className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
//               hasRecipients
//                 ? "bg-emerald-50 text-emerald-700"
//                 : "bg-gray-100 text-gray-500"
//             }`}
//             title={`${t.recipients} recipient(s)`}
//           >
//             <svg width="14" height="14" viewBox="0 0 24 24">
//               <path
//                 fill="currentColor"
//                 d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5m7 8v-1a6 6 0 0 0-12 0v1z"
//               />
//             </svg>
//             {t.recipients}
//           </span>
//         </div>

//         {/* Compact preview (click → inspector) */}
//         <button
//           type="button"
//           onClick={onOpenInspector}
//           className="rounded-lg border border-gray-200 bg-gray-50 p-2 text-left transition hover:bg-gray-100"
//           title="Open full preview"
//         >
//           <WhatsAppBubblePreview
//             messageTemplate={t.body}
//             multiButtons={t.buttons}
//             imageUrl={t.imageUrl || undefined}
//             caption={t.caption}
//             campaignId={t.id}
//           />
//         </button>

//         {/* Actions */}
//         <div className="mt-1 grid grid-cols-3 gap-2">
//           <button
//             disabled={!hasRecipients || sending}
//             onClick={onSend}
//             className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition
//               ${
//                 hasRecipients
//                   ? "bg-emerald-600 text-white hover:bg-emerald-700"
//                   : "bg-gray-200 text-gray-400 cursor-not-allowed"
//               }`}
//             title={hasRecipients ? "Send campaign" : "Assign recipients first"}
//           >
//             {sending ? "Sending…" : "Send"}
//           </button>

//           <button
//             onClick={onAssign}
//             className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
//             title="Assign recipients"
//           >
//             Assign
//           </button>

//           <button
//             onClick={onViewRecipients}
//             className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
//             title="View recipients"
//           >
//             Recipients
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// /** -----------------------
//  * Page
//  * ---------------------- */
// function TemplateCampaignList() {
//   const [raw, setRaw] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [sendingId, setSendingId] = useState(null);
//   const [q, setQ] = useState("");
//   const [onlyWithRecipients, setOnlyWithRecipients] = useState(false);
//   const [sort, setSort] = useState("recent"); // recent | recipients | name
//   const [activeType, setActiveType] = useState("all");
//   const [viewMode, setViewMode] = useState("grid"); // grid | table
//   const [inspector, setInspector] = useState(null);

//   const navigate = useNavigate();

//   const loadCampaigns = async () => {
//     setLoading(true);
//     try {
//       const res = await axiosClient.get("/campaign/get-image-campaign");
//       setRaw(res.data || []);
//     } catch (err) {
//       console.error(err);
//       toast.error("❌ Failed to load template campaigns");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadCampaigns();
//   }, []);

//   const handleSend = async campaignId => {
//     setSendingId(campaignId);
//     try {
//       await axiosClient.post(`/campaign/send-campaign/${campaignId}`);
//       toast.success("🚀 Campaign sent successfully!");
//     } catch (err) {
//       console.error("❌ Sending failed:", err);
//       toast.error("❌ Failed to send campaign");
//     } finally {
//       setSendingId(null);
//     }
//   };

//   const data = useMemo(() => raw.map(normalizeCampaign), [raw]);

//   const view = useMemo(() => {
//     let list = data;

//     if (q.trim()) {
//       const needle = q.toLowerCase();
//       list = list.filter(
//         c =>
//           c.name.toLowerCase().includes(needle) ||
//           c.body.toLowerCase().includes(needle)
//       );
//     }

//     if (onlyWithRecipients) list = list.filter(c => c.recipients > 0);

//     if (activeType !== "all") {
//       list = list.filter(c => {
//         if (activeType === "image_header") return c.kind === "image_header";
//         if (activeType === "text_only") return c.kind === "text_only";
//         if (activeType === "with_buttons") return c.hasButtons;
//         if (activeType === "no_buttons") return !c.hasButtons;
//         return true;
//       });
//     }

//     list = [...list].sort((a, b) => {
//       if (sort === "name") return a.name.localeCompare(b.name);
//       if (sort === "recipients") return b.recipients - a.recipients;
//       const ax = new Date(a.updatedAt || 0).getTime();
//       const bx = new Date(b.updatedAt || 0).getTime();
//       return bx - ax; // recent
//     });

//     return list;
//   }, [data, q, onlyWithRecipients, activeType, sort]);

//   return (
//     <div className="mx-auto max-w-7xl px-4 py-8">
//       {/* Header */}
//       <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
//         <div className="flex items-center gap-2">
//           <FaRocket className="text-green-500 text-xl" />
//           <h2 className="text-2xl md:text-3xl font-bold text-purple-700">
//             Template Campaigns
//           </h2>
//           <button
//             onClick={loadCampaigns}
//             className="ml-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
//             title="Refresh"
//           >
//             <FaSyncAlt className={cx(loading && "animate-spin")} />
//             Refresh
//           </button>
//         </div>

//         {/* Controls */}
//         <div className="flex flex-col gap-3 md:flex-row md:items-center">
//           <div className="relative">
//             <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//             <input
//               value={q}
//               onChange={e => setQ(e.target.value)}
//               placeholder="Search by name or message…"
//               className="w-full md:w-72 rounded-xl border pl-10 pr-3 py-2 focus:ring-2 focus:ring-purple-300 outline-none"
//             />
//           </div>

//           <div className="flex items-center gap-2">
//             <label className="inline-flex items-center gap-2 text-sm">
//               <input
//                 type="checkbox"
//                 checked={onlyWithRecipients}
//                 onChange={e => setOnlyWithRecipients(e.target.checked)}
//                 className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-400"
//               />
//               Only with recipients
//             </label>

//             <select
//               value={sort}
//               onChange={e => setSort(e.target.value)}
//               className="rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-purple-300 outline-none"
//             >
//               <option value="recent">Sort: Recent</option>
//               <option value="recipients">Sort: Recipients</option>
//               <option value="name">Sort: Name</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* Segmented filters */}
//       <div className="mb-6 flex flex-wrap items-center gap-2">
//         <span className="text-sm font-semibold text-gray-600 flex items-center gap-2">
//           <FaFilter /> Filter:
//         </span>
//         {TYPE_FILTERS.map(f => (
//           <button
//             key={f.id}
//             className={cx(
//               "rounded-full px-3 py-1 text-sm",
//               activeType === f.id
//                 ? "bg-purple-600 text-white"
//                 : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//             )}
//             onClick={() => setActiveType(f.id)}
//           >
//             {f.label}
//           </button>
//         ))}

//         <div className="ml-auto flex items-center gap-2">
//           <button
//             className={cx(
//               "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
//               viewMode === "grid"
//                 ? "bg-purple-50 border-purple-200 text-purple-700"
//                 : "text-gray-700 hover:bg-gray-50"
//             )}
//             onClick={() => setViewMode("grid")}
//             title="Grid view"
//           >
//             <FaThLarge /> Grid
//           </button>
//           <button
//             className={cx(
//               "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
//               viewMode === "table"
//                 ? "bg-purple-50 border-purple-200 text-purple-700"
//                 : "text-gray-700 hover:bg-gray-50"
//             )}
//             onClick={() => setViewMode("table")}
//             title="Table view"
//           >
//             <FaTable /> Table
//           </button>
//         </div>
//       </div>

//       {/* Loading skeleton */}
//       {loading && (
//         <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
//           {Array.from({ length: 6 }).map((_, i) => (
//             <div
//               key={i}
//               className="rounded-2xl border bg-white p-4 shadow-sm animate-pulse"
//             >
//               <div className="h-40 w-full rounded-xl bg-gray-100" />
//               <div className="mt-4 h-5 w-2/3 rounded bg-gray-100" />
//               <div className="mt-2 h-4 w-1/3 rounded bg-gray-100" />
//               <div className="mt-4 h-20 w-full rounded bg-gray-100" />
//               <div className="mt-4 flex gap-2">
//                 <div className="h-9 w-24 rounded bg-gray-100" />
//                 <div className="h-9 w-24 rounded bg-gray-100" />
//                 <div className="h-9 w-24 rounded bg-gray-100" />
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Empty state */}
//       {!loading && view.length === 0 && (
//         <div className="mt-16 flex flex-col items-center justify-center text-center">
//           <div className="rounded-3xl border p-10 shadow-sm bg-white max-w-lg">
//             <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100">
//               <FaListUl className="text-purple-600 text-xl" />
//             </div>
//             <h3 className="text-xl font-semibold text-gray-800">
//               No template campaigns yet
//             </h3>
//             <p className="mt-2 text-gray-500">
//               Create an image template campaign and assign recipients to start
//               sending.
//             </p>
//             <div className="mt-6 flex items-center justify-center gap-3">
//               <button
//                 onClick={() =>
//                   navigate("/app/campaigns/image-campaigns/create")
//                 }
//                 className="rounded-xl bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700"
//               >
//                 New Campaign
//               </button>
//               <button
//                 onClick={loadCampaigns}
//                 className="rounded-xl border px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
//               >
//                 Refresh
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* GRID VIEW */}
//       {!loading && view.length > 0 && viewMode === "grid" && (
//         <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
//           {view.map(t => {
//             const sending = sendingId === t.id;
//             return (
//               <TemplateCard
//                 key={t.id}
//                 t={t}
//                 sending={sending}
//                 onOpenInspector={() => setInspector(t)}
//                 onSend={() => handleSend(t.id)}
//                 onAssign={() =>
//                   navigate(
//                     `/app/campaigns/image-campaigns/assign-contacts/${t.id}`
//                   )
//                 }
//                 onViewRecipients={() =>
//                   navigate(
//                     `/app/campaigns/image-campaigns/assigned-contacts/${t.id}`
//                   )
//                 }
//               />
//             );
//           })}
//         </div>
//       )}

//       {/* TABLE VIEW (compact) */}
//       {!loading && view.length > 0 && viewMode === "table" && (
//         <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
//           <div className="max-h-[70vh] overflow-auto">
//             <table className="w-full text-[13px]">
//               <thead className="sticky top-0 z-10 bg-gray-50 text-left text-gray-700 border-b">
//                 <tr>
//                   <th className="px-3 py-2 font-semibold">Name</th>
//                   <th className="px-3 py-2 font-semibold">Type</th>
//                   <th className="px-3 py-2 font-semibold">Buttons</th>
//                   <th className="px-3 py-2 font-semibold">Recipients</th>
//                   <th className="px-3 py-2 font-semibold">Updated</th>
//                   <th className="px-3 py-2 font-semibold text-right">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {view.map(t => (
//                   <tr
//                     key={t.id}
//                     className="border-t hover:bg-gray-50/70 transition-colors"
//                   >
//                     <td className="px-3 py-2 font-medium text-gray-900">
//                       {t.name}
//                     </td>
//                     <td className="px-3 py-2">
//                       {t.kind === "image_header" ? "Image Header" : "Text Only"}
//                     </td>
//                     <td className="px-3 py-2">
//                       {t.hasButtons ? t.buttons.length : 0}
//                     </td>
//                     <td className="px-3 py-2">{t.recipients}</td>
//                     <td className="px-3 py-2">
//                       {t.updatedAt
//                         ? new Date(t.updatedAt).toLocaleString()
//                         : "—"}
//                     </td>
//                     <td className="px-3 py-2">
//                       <div className="flex justify-end gap-2">
//                         <button
//                           className="rounded-md border px-2.5 py-1.5 hover:bg-gray-50"
//                           onClick={() => setInspector(t)}
//                         >
//                           Preview
//                         </button>
//                         <button
//                           className="rounded-md bg-purple-100 px-2.5 py-1.5 text-purple-800 hover:bg-purple-200"
//                           onClick={() =>
//                             navigate(
//                               `/app/campaigns/image-campaigns/assign-contacts/${t.id}`
//                             )
//                           }
//                         >
//                           Assign
//                         </button>
//                         <button
//                           className="rounded-md bg-blue-100 px-2.5 py-1.5 text-blue-700 hover:bg-blue-200"
//                           onClick={() =>
//                             navigate(
//                               `/app/campaigns/image-campaigns/assigned-contacts/${t.id}`
//                             )
//                           }
//                         >
//                           Recipients
//                         </button>
//                         <button
//                           className="rounded-md bg-emerald-600 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
//                           disabled={t.recipients === 0}
//                           onClick={() => handleSend(t.id)}
//                         >
//                           Send
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}

//       <InspectorModal item={inspector} onClose={() => setInspector(null)} />
//     </div>
//   );
// }

// export default TemplateCampaignList;

// // 📄 src/pages/campaigns/TemplateCampaignList.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import WhatsAppBubblePreview from "../../components/WhatsAppBubblePreview";
// import { useNavigate } from "react-router-dom";
// import {
//   FaRocket,
//   FaSearch,
//   FaSyncAlt,
//   FaImage,
//   FaUsers,
//   FaUserCheck,
//   FaListUl,
//   FaPaperPlane,
//   FaUserPlus,
//   FaTable,
//   FaThLarge,
//   FaFilter,
// } from "react-icons/fa";

// function cx(...xs) {
//   return xs.filter(Boolean).join(" ");
// }

// /** -----------------------
//  * Normalizer (single source of truth)
//  * ---------------------- */
// function normalizeCampaign(raw) {
//   const buttons = raw?.multiButtons || raw?.buttonParams || raw?.buttons || [];
//   const imageUrl = raw?.imageUrl || null;
//   const body =
//     raw?.messageBody ||
//     raw?.templateBody ||
//     raw?.sampleBody ||
//     raw?.messageTemplate ||
//     raw?.body ||
//     "";

//   return {
//     id: raw?.id,
//     name: raw?.name || "Untitled Campaign",
//     kind: imageUrl ? "image_header" : "text_only",
//     body,
//     caption: raw?.imageCaption || raw?.caption || "",
//     imageUrl,
//     buttons,
//     hasButtons: Array.isArray(buttons) && buttons.length > 0,
//     recipients: raw?.recipientCount || 0,
//     updatedAt: raw?.updatedAt || raw?.createdAt || null,
//     raw, // keep original for any future needs
//   };
// }

// const TYPE_FILTERS = [
//   { id: "all", label: "All" },
//   { id: "image_header", label: "Image Header" },
//   { id: "text_only", label: "Text Only" },
//   { id: "with_buttons", label: "With Buttons" },
//   { id: "no_buttons", label: "No Buttons" },
// ];

// /** -----------------------
//  * Subcomponents
//  * ---------------------- */
// function InspectorModal({ item, onClose }) {
//   if (!item) return null;
//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
//       onClick={onClose}
//     >
//       <div
//         className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
//         onClick={e => e.stopPropagation()}
//       >
//         <div className="flex items-center justify-between border-b px-5 py-3">
//           <div>
//             <div className="text-lg font-semibold text-gray-900">
//               {item.name}
//             </div>
//             <div className="text-xs text-gray-500">Full fidelity preview</div>
//           </div>
//           <button
//             className="rounded-lg border px-3 py-1.5 text-gray-700 hover:bg-gray-50"
//             onClick={onClose}
//           >
//             Close
//           </button>
//         </div>
//         <div className="p-4">
//           <WhatsAppBubblePreview
//             messageTemplate={item.body}
//             multiButtons={item.buttons}
//             imageUrl={item.imageUrl || undefined}
//             caption={item.caption}
//             campaignId={item.id}
//           />
//         </div>
//         <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
//           <button
//             className="rounded-lg border px-3 py-2 text-gray-700 hover:bg-gray-50"
//             onClick={onClose}
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // function TemplateCard({
// //   t,
// //   onSend,
// //   onAssign,
// //   onViewRecipients,
// //   onOpenInspector,
// //   sending,
// // }) {
// //   const hasRecipients = t.recipients > 0;

// //   return (
// //     <div className="group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-lg">
// //       {/* Media Slot — fixed 16:9 to normalize card heights */}
// //       <div className="relative">
// //         <div className="aspect-[16/9] w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
// //           {t.kind === "image_header" && t.imageUrl ? (
// //             <img
// //               src={t.imageUrl}
// //               alt="Campaign"
// //               className="h-full w-full object-cover"
// //             />
// //           ) : (
// //             <div className="flex flex-col items-center text-gray-400">
// //               <FaImage className="text-4xl" />
// //               <span className="mt-2 text-xs">
// //                 {t.kind === "text_only" ? "Text Template" : "No Media"}
// //               </span>
// //             </div>
// //           )}
// //         </div>
// //         <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-purple-500 via-purple-400 to-green-400" />
// //         <div className="absolute right-3 top-3">
// //           <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white backdrop-blur">
// //             {t.kind === "image_header" ? "Image Header" : "Text Only"}
// //           </span>
// //         </div>
// //       </div>

// //       <div className="flex flex-col gap-3 p-4">
// //         <div className="flex items-start justify-between gap-3">
// //           <h3 className="line-clamp-1 text-lg font-semibold text-gray-900">
// //             {t.name}
// //           </h3>
// //           <span
// //             className={cx(
// //               "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
// //               hasRecipients
// //                 ? "bg-green-100 text-green-700"
// //                 : "bg-gray-100 text-gray-500"
// //             )}
// //             title={`${t.recipients} recipient(s)`}
// //           >
// //             {hasRecipients ? <FaUserCheck /> : <FaUsers />}
// //             {t.recipients}
// //           </span>
// //         </div>

// //         {/* Curated, compact preview (click to open full inspector) */}
// //         <div
// //           className="rounded-xl border bg-gray-50/60 p-2 cursor-pointer"
// //           onClick={onOpenInspector}
// //           title="Open full preview"
// //         >
// //           <WhatsAppBubblePreview
// //             messageTemplate={t.body}
// //             multiButtons={t.buttons}
// //             imageUrl={t.imageUrl || undefined}
// //             caption={t.caption}
// //             campaignId={t.id}
// //           />
// //         </div>

// //         {/* Actions */}
// //         <div className="mt-1 grid grid-cols-3 gap-2">
// //           <button
// //             disabled={!hasRecipients || sending}
// //             onClick={onSend}
// //             className={cx(
// //               "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-semibold transition",
// //               hasRecipients
// //                 ? "bg-green-600 text-white hover:bg-green-700"
// //                 : "bg-gray-200 text-gray-400 cursor-not-allowed"
// //             )}
// //             title={hasRecipients ? "Send campaign" : "Assign recipients first"}
// //           >
// //             <FaPaperPlane className={sending ? "animate-pulse" : ""} />
// //             {sending ? "Sending…" : "Send"}
// //           </button>

// //           <button
// //             onClick={onAssign}
// //             className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-100 px-3 py-2 font-semibold text-purple-800 hover:bg-purple-200"
// //             title="Assign recipients"
// //           >
// //             <FaUserPlus />
// //             Assign
// //           </button>

// //           <button
// //             onClick={onViewRecipients}
// //             className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-100 px-3 py-2 font-semibold text-blue-700 hover:bg-blue-200"
// //             title="View recipients"
// //           >
// //             <FaListUl />
// //             Recipients
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
// function TemplateCard({
//   t,
//   onSend,
//   onAssign,
//   onViewRecipients,
//   onOpenInspector,
//   sending,
// }) {
//   const hasRecipients = t.recipients > 0;

//   return (
//     <div className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
//       {/* Media Slot — fixed 16:9 for uniformity */}
//       <div className="relative">
//         <div className="aspect-[16/9] w-full bg-gray-50 flex items-center justify-center">
//           {t.kind === "image_header" && t.imageUrl ? (
//             <img
//               src={t.imageUrl}
//               alt="Campaign"
//               className="h-full w-full object-cover"
//             />
//           ) : (
//             <div className="flex flex-col items-center text-gray-400">
//               <svg
//                 width="40"
//                 height="40"
//                 viewBox="0 0 24 24"
//                 className="opacity-80"
//               >
//                 <path
//                   fill="currentColor"
//                   d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14zm-2 0H5V5h14zM8 13l2.03 2.71L12 13l3 4H7z"
//                 />
//               </svg>
//               <span className="mt-2 text-xs text-gray-500">
//                 {t.kind === "text_only" ? "Text template" : "No media"}
//               </span>
//             </div>
//           )}
//         </div>

//         {/* Type chip (neutral) */}
//         <div className="absolute right-3 top-3">
//           <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white backdrop-blur-sm">
//             {t.kind === "image_header" ? "Image header" : "Text only"}
//           </span>
//         </div>
//       </div>

//       {/* Body */}
//       <div className="flex flex-col gap-3 p-4">
//         {/* Title + recipients */}
//         <div className="flex items-start justify-between gap-3">
//           <h3 className="line-clamp-1 text-base font-semibold text-gray-900">
//             {t.name}
//           </h3>
//           <span
//             className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
//               hasRecipients
//                 ? "bg-emerald-50 text-emerald-700"
//                 : "bg-gray-100 text-gray-500"
//             }`}
//             title={`${t.recipients} recipient(s)`}
//           >
//             <svg width="14" height="14" viewBox="0 0 24 24">
//               <path
//                 fill="currentColor"
//                 d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5m7 8v-1a6 6 0 0 0-12 0v1z"
//               />
//             </svg>
//             {t.recipients}
//           </span>
//         </div>

//         {/* Compact preview (click → inspector) */}
//         <button
//           type="button"
//           onClick={onOpenInspector}
//           className="rounded-lg border border-gray-200 bg-gray-50 p-2 text-left transition hover:bg-gray-100"
//           title="Open full preview"
//         >
//           <WhatsAppBubblePreview
//             messageTemplate={t.body}
//             multiButtons={t.buttons}
//             imageUrl={t.imageUrl || undefined}
//             caption={t.caption}
//             campaignId={t.id}
//           />
//         </button>

//         {/* Actions */}
//         <div className="mt-1 grid grid-cols-3 gap-2">
//           <button
//             disabled={!hasRecipients || sending}
//             onClick={onSend}
//             className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition
//               ${
//                 hasRecipients
//                   ? "bg-emerald-600 text-white hover:bg-emerald-700"
//                   : "bg-gray-200 text-gray-400 cursor-not-allowed"
//               }`}
//             title={hasRecipients ? "Send campaign" : "Assign recipients first"}
//           >
//             {sending ? "Sending…" : "Send"}
//           </button>

//           <button
//             onClick={onAssign}
//             className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
//             title="Assign recipients"
//           >
//             Assign
//           </button>

//           <button
//             onClick={onViewRecipients}
//             className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
//             title="View recipients"
//           >
//             Recipients
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// /** -----------------------
//  * Page
//  * ---------------------- */
// function TemplateCampaignList() {
//   const [raw, setRaw] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [sendingId, setSendingId] = useState(null);
//   const [q, setQ] = useState("");
//   const [onlyWithRecipients, setOnlyWithRecipients] = useState(false);
//   const [sort, setSort] = useState("recent"); // recent | recipients | name
//   const [activeType, setActiveType] = useState("all");
//   const [viewMode, setViewMode] = useState("grid"); // grid | table
//   const [inspector, setInspector] = useState(null);

//   const navigate = useNavigate();

//   const loadCampaigns = async () => {
//     setLoading(true);
//     try {
//       const res = await axiosClient.get("/campaign/get-image-campaign");
//       setRaw(res.data || []);
//     } catch (err) {
//       console.error(err);
//       toast.error("❌ Failed to load template campaigns");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadCampaigns();
//   }, []);

//   const handleSend = async campaignId => {
//     setSendingId(campaignId);
//     try {
//       await axiosClient.post(`/campaign/send-campaign/${campaignId}`);
//       toast.success("🚀 Campaign sent successfully!");
//     } catch (err) {
//       console.error("❌ Sending failed:", err);
//       toast.error("❌ Failed to send campaign");
//     } finally {
//       setSendingId(null);
//     }
//   };

//   const data = useMemo(() => raw.map(normalizeCampaign), [raw]);

//   const view = useMemo(() => {
//     let list = data;

//     if (q.trim()) {
//       const needle = q.toLowerCase();
//       list = list.filter(
//         c =>
//           c.name.toLowerCase().includes(needle) ||
//           c.body.toLowerCase().includes(needle)
//       );
//     }

//     if (onlyWithRecipients) list = list.filter(c => c.recipients > 0);

//     if (activeType !== "all") {
//       list = list.filter(c => {
//         if (activeType === "image_header") return c.kind === "image_header";
//         if (activeType === "text_only") return c.kind === "text_only";
//         if (activeType === "with_buttons") return c.hasButtons;
//         if (activeType === "no_buttons") return !c.hasButtons;
//         return true;
//       });
//     }

//     list = [...list].sort((a, b) => {
//       if (sort === "name") return a.name.localeCompare(b.name);
//       if (sort === "recipients") return b.recipients - a.recipients;
//       const ax = new Date(a.updatedAt || 0).getTime();
//       const bx = new Date(b.updatedAt || 0).getTime();
//       return bx - ax; // recent
//     });

//     return list;
//   }, [data, q, onlyWithRecipients, activeType, sort]);

//   return (
//     <div className="mx-auto max-w-7xl px-4 py-8">
//       {/* Header */}
//       <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
//         <div className="flex items-center gap-2">
//           <FaRocket className="text-green-500 text-xl" />
//           <h2 className="text-2xl md:text-3xl font-bold text-purple-700">
//             Template Campaigns
//           </h2>
//           <button
//             onClick={loadCampaigns}
//             className="ml-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
//             title="Refresh"
//           >
//             <FaSyncAlt className={cx(loading && "animate-spin")} />
//             Refresh
//           </button>
//         </div>

//         {/* Controls */}
//         <div className="flex flex-col gap-3 md:flex-row md:items-center">
//           <div className="relative">
//             <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//             <input
//               value={q}
//               onChange={e => setQ(e.target.value)}
//               placeholder="Search by name or message…"
//               className="w-full md:w-72 rounded-xl border pl-10 pr-3 py-2 focus:ring-2 focus:ring-purple-300 outline-none"
//             />
//           </div>

//           <div className="flex items-center gap-2">
//             <label className="inline-flex items-center gap-2 text-sm">
//               <input
//                 type="checkbox"
//                 checked={onlyWithRecipients}
//                 onChange={e => setOnlyWithRecipients(e.target.checked)}
//                 className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-400"
//               />
//               Only with recipients
//             </label>

//             <select
//               value={sort}
//               onChange={e => setSort(e.target.value)}
//               className="rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-purple-300 outline-none"
//             >
//               <option value="recent">Sort: Recent</option>
//               <option value="recipients">Sort: Recipients</option>
//               <option value="name">Sort: Name</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* Segmented filters */}
//       <div className="mb-6 flex flex-wrap items-center gap-2">
//         <span className="text-sm font-semibold text-gray-600 flex items-center gap-2">
//           <FaFilter /> Filter:
//         </span>
//         {TYPE_FILTERS.map(f => (
//           <button
//             key={f.id}
//             className={cx(
//               "rounded-full px-3 py-1 text-sm",
//               activeType === f.id
//                 ? "bg-purple-600 text-white"
//                 : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//             )}
//             onClick={() => setActiveType(f.id)}
//           >
//             {f.label}
//           </button>
//         ))}

//         <div className="ml-auto flex items-center gap-2">
//           <button
//             className={cx(
//               "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
//               viewMode === "grid"
//                 ? "bg-purple-50 border-purple-200 text-purple-700"
//                 : "text-gray-700 hover:bg-gray-50"
//             )}
//             onClick={() => setViewMode("grid")}
//             title="Grid view"
//           >
//             <FaThLarge /> Grid
//           </button>
//           <button
//             className={cx(
//               "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
//               viewMode === "table"
//                 ? "bg-purple-50 border-purple-200 text-purple-700"
//                 : "text-gray-700 hover:bg-gray-50"
//             )}
//             onClick={() => setViewMode("table")}
//             title="Table view"
//           >
//             <FaTable /> Table
//           </button>
//         </div>
//       </div>

//       {/* Loading skeleton */}
//       {loading && (
//         <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
//           {Array.from({ length: 6 }).map((_, i) => (
//             <div
//               key={i}
//               className="rounded-2xl border bg-white p-4 shadow-sm animate-pulse"
//             >
//               <div className="h-40 w-full rounded-xl bg-gray-100" />
//               <div className="mt-4 h-5 w-2/3 rounded bg-gray-100" />
//               <div className="mt-2 h-4 w-1/3 rounded bg-gray-100" />
//               <div className="mt-4 h-20 w-full rounded bg-gray-100" />
//               <div className="mt-4 flex gap-2">
//                 <div className="h-9 w-24 rounded bg-gray-100" />
//                 <div className="h-9 w-24 rounded bg-gray-100" />
//                 <div className="h-9 w-24 rounded bg-gray-100" />
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Empty state */}
//       {!loading && view.length === 0 && (
//         <div className="mt-16 flex flex-col items-center justify-center text-center">
//           <div className="rounded-3xl border p-10 shadow-sm bg-white max-w-lg">
//             <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100">
//               <FaListUl className="text-purple-600 text-xl" />
//             </div>
//             <h3 className="text-xl font-semibold text-gray-800">
//               No template campaigns yet
//             </h3>
//             <p className="mt-2 text-gray-500">
//               Create an image template campaign and assign recipients to start
//               sending.
//             </p>
//             <div className="mt-6 flex items-center justify-center gap-3">
//               <button
//                 onClick={() =>
//                   navigate("/app/campaigns/image-campaigns/create")
//                 }
//                 className="rounded-xl bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700"
//               >
//                 New Campaign
//               </button>
//               <button
//                 onClick={loadCampaigns}
//                 className="rounded-xl border px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
//               >
//                 Refresh
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* GRID VIEW */}
//       {!loading && view.length > 0 && viewMode === "grid" && (
//         <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
//           {view.map(t => {
//             const sending = sendingId === t.id;
//             return (
//               <TemplateCard
//                 key={t.id}
//                 t={t}
//                 sending={sending}
//                 onOpenInspector={() => setInspector(t)}
//                 onSend={() => handleSend(t.id)}
//                 onAssign={() =>
//                   navigate(
//                     `/app/campaigns/image-campaigns/assign-contacts/${t.id}`
//                   )
//                 }
//                 onViewRecipients={() =>
//                   navigate(
//                     `/app/campaigns/image-campaigns/assigned-contacts/${t.id}`
//                   )
//                 }
//               />
//             );
//           })}
//         </div>
//       )}

//       {/* TABLE VIEW */}
//       {!loading && view.length > 0 && viewMode === "table" && (
//         <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
//           <table className="w-full text-sm">
//             <thead className="bg-gray-50 text-left text-gray-700">
//               <tr>
//                 <th className="px-4 py-3">Name</th>
//                 <th className="px-4 py-3">Type</th>
//                 <th className="px-4 py-3">Buttons</th>
//                 <th className="px-4 py-3">Recipients</th>
//                 <th className="px-4 py-3">Updated</th>
//                 <th className="px-4 py-3 text-right">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {view.map(t => (
//                 <tr key={t.id} className="border-t">
//                   <td className="px-4 py-3 font-medium text-gray-900">
//                     {t.name}
//                   </td>
//                   <td className="px-4 py-3">
//                     {t.kind === "image_header" ? "Image Header" : "Text Only"}
//                   </td>
//                   <td className="px-4 py-3">
//                     {t.hasButtons ? t.buttons.length : 0}
//                   </td>
//                   <td className="px-4 py-3">{t.recipients}</td>
//                   <td className="px-4 py-3">
//                     {t.updatedAt ? new Date(t.updatedAt).toLocaleString() : "—"}
//                   </td>
//                   <td className="px-4 py-3">
//                     <div className="flex justify-end gap-2">
//                       <button
//                         className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
//                         onClick={() => setInspector(t)}
//                       >
//                         Preview
//                       </button>
//                       <button
//                         className="rounded-lg bg-purple-100 px-3 py-1.5 text-purple-800 hover:bg-purple-200"
//                         onClick={() =>
//                           navigate(
//                             `/app/campaigns/image-campaigns/assign-contacts/${t.id}`
//                           )
//                         }
//                       >
//                         Assign
//                       </button>
//                       <button
//                         className="rounded-lg bg-blue-100 px-3 py-1.5 text-blue-700 hover:bg-blue-200"
//                         onClick={() =>
//                           navigate(
//                             `/app/campaigns/image-campaigns/assigned-contacts/${t.id}`
//                           )
//                         }
//                       >
//                         Recipients
//                       </button>
//                       <button
//                         className="rounded-lg bg-green-600 px-3 py-1.5 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
//                         disabled={t.recipients === 0}
//                         onClick={() => handleSend(t.id)}
//                       >
//                         Send
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       <InspectorModal item={inspector} onClose={() => setInspector(null)} />
//     </div>
//   );
// }

// export default TemplateCampaignList;

// import React, { useEffect, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import WhatsAppBubblePreview from "../../components/WhatsAppBubblePreview";
// import { useNavigate } from "react-router-dom";
// import { FaRocket } from "react-icons/fa";

// function TemplateCampaignList() {
//   const [campaigns, setCampaigns] = useState([]);
//   const [sendingId, setSendingId] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const loadCampaigns = async () => {
//       try {
//         const res = await axiosClient.get("/campaign/get-image-campaign");
//         setCampaigns(res.data || []);
//       } catch (err) {
//         console.error(err);
//         toast.error("❌ Failed to load template campaigns");
//       }
//     };
//     loadCampaigns();
//   }, []);

//   const handleSend = async campaignId => {
//     setSendingId(campaignId);
//     try {
//       await axiosClient.post(`/campaign/send-campaign/${campaignId}`);
//       toast.success("🚀 Campaign sent successfully!");
//     } catch (err) {
//       console.error("❌ Sending failed:", err);
//       toast.error("❌ Failed to send campaign");
//     } finally {
//       setSendingId(null);
//     }
//   };

//   // Utility: Get the message body from all likely fields
//   function getMessageBody(campaign) {
//     return (
//       campaign.messageBody ||
//       campaign.templateBody ||
//       campaign.sampleBody ||
//       campaign.messageTemplate ||
//       campaign.body ||
//       ""
//     );
//   }

//   // Utility: Get buttons (array) from all likely fields
//   function getButtons(campaign) {
//     return (
//       campaign.multiButtons || campaign.buttonParams || campaign.buttons || []
//     );
//   }

//   // Utility: Get caption from all likely fields
//   function getCaption(campaign) {
//     return campaign.imageCaption || campaign.caption || "";
//   }

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-8">
//       <h2 className="text-3xl font-bold text-purple-700 mb-8 flex items-center gap-2">
//         <FaRocket className="text-green-500" />
//         Template Campaigns
//       </h2>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
//         {campaigns.length === 0 ? (
//           <div className="col-span-full text-gray-500 text-lg mt-8">
//             No template campaigns available.
//           </div>
//         ) : (
//           campaigns.map(campaign => (
//             <div
//               key={campaign.id}
//               className="flex flex-col bg-white rounded-xl shadow border px-6 py-4 min-h-[540px] relative"
//               style={{ minWidth: 340, maxWidth: 410 }}
//             >
//               {/* Gradient Bar */}
//               <div className="absolute left-0 top-0 h-2 w-full rounded-t-xl bg-gradient-to-r from-purple-500 via-purple-400 to-green-400"></div>
//               {/* Header Row */}
//               <div className="flex items-center justify-between mt-2 mb-2">
//                 <h3 className="text-lg font-semibold text-purple-800">
//                   {campaign.name}
//                 </h3>
//                 <span className="text-xs flex items-center gap-1 px-2 py-1 bg-gray-100 rounded font-medium">
//                   <svg
//                     width={18}
//                     height={18}
//                     className="inline-block text-gray-500"
//                     fill="none"
//                     stroke="currentColor"
//                   >
//                     <rect x="2" y="2" width="14" height="14" rx="2" />
//                     <path d="M2 12l4-4a2 2 0 012.8 0l5.2 5.2" />
//                     <path d="M14 6h.01" />
//                   </svg>
//                   Image
//                 </span>
//               </div>
//               {/* Image Preview */}
//               <div className="bg-gray-100 rounded-lg flex items-center justify-center min-h-[180px] mb-3 border border-gray-200">
//                 {campaign.imageUrl ? (
//                   <img
//                     src={campaign.imageUrl}
//                     alt="Campaign"
//                     className="object-contain max-h-44 max-w-full rounded"
//                   />
//                 ) : (
//                   <div className="flex flex-col items-center text-gray-400 py-10">
//                     <svg
//                       width={54}
//                       height={54}
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 48 48"
//                     >
//                       <rect
//                         x="7"
//                         y="11"
//                         width="34"
//                         height="26"
//                         rx="2"
//                         strokeWidth={2}
//                       />
//                       <path
//                         d="M7 32l8.4-8.8c1.1-1.1 2.9-1.1 4 0L31 32M21.5 20.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z"
//                         strokeWidth={2}
//                       />
//                     </svg>
//                     <span className="mt-2 text-sm">No Image</span>
//                   </div>
//                 )}
//               </div>
//               {/* Recipients Badge */}
//               <div className="mb-2">
//                 <span
//                   className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium
//       ${
//         campaign.recipientCount > 0
//           ? "bg-green-100 text-green-700"
//           : "bg-gray-100 text-gray-500"
//       }`}
//                 >
//                   <svg
//                     className="w-4 h-4"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 20 20"
//                   >
//                     <path d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM5 13a7 7 0 0110 0" />
//                   </svg>
//                   {campaign.recipientCount || 0} Recipients
//                 </span>
//               </div>

//               {/* WhatsApp Bubble Preview */}
//               <div className="mb-2">
//                 <WhatsAppBubblePreview
//                   messageTemplate={getMessageBody(campaign)}
//                   multiButtons={getButtons(campaign)}
//                   imageUrl={campaign.imageUrl}
//                   caption={getCaption(campaign)}
//                   campaignId={campaign.id}
//                 />
//               </div>

//               {/* Spacer to push buttons to bottom */}
//               <div className="flex-1"></div>
//               {/* Action Buttons */}
//               <div className="flex gap-2 mt-3 pt-1 w-full">
//                 <button
//                   disabled={
//                     !campaign.recipientCount || sendingId === campaign.id
//                   }
//                   onClick={() => handleSend(campaign.id)}
//                   className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold shadow-sm transition
//         ${
//           !campaign.recipientCount
//             ? "bg-gray-200 text-gray-400 cursor-not-allowed"
//             : "bg-green-600 text-white hover:bg-green-700"
//         }
//       `}
//                 >
//                   <span role="img" aria-label="Send">
//                     🚀
//                   </span>{" "}
//                   Send
//                 </button>
//                 <button
//                   onClick={() =>
//                     navigate(
//                       `/app/campaigns/image-campaigns/assign-contacts/${campaign.id}`
//                     )
//                   }
//                   className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold bg-purple-100 text-purple-800 hover:bg-purple-200 transition"
//                 >
//                   <span role="img" aria-label="Assign">
//                     📇
//                   </span>{" "}
//                   Assign
//                 </button>
//                 <button
//                   onClick={() =>
//                     navigate(
//                       `/app/campaigns/image-campaigns/assigned-contacts/${campaign.id}`
//                     )
//                   }
//                   className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
//                 >
//                   <span role="img" aria-label="Recipients">
//                     👁️
//                   </span>{" "}
//                   Recipients
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// export default TemplateCampaignList;

// import React, { useEffect, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import WhatsAppBubblePreview from "../../components/WhatsAppBubblePreview";
// import { useNavigate } from "react-router-dom";
// import { FaRocket } from "react-icons/fa";

// function TemplateCampaignList() {
//   const [campaigns, setCampaigns] = useState([]);
//   const [sendingId, setSendingId] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const loadCampaigns = async () => {
//       try {
//         const res = await axiosClient.get("/campaign/get-image-campaign");
//         setCampaigns(res.data || []);
//       } catch (err) {
//         console.error(err);
//         toast.error("❌ Failed to load template campaigns");
//       }
//     };
//     loadCampaigns();
//   }, []);

//   const handleSend = async campaignId => {
//     setSendingId(campaignId);
//     try {
//       await axiosClient.post(`/campaign/send-campaign/${campaignId}`);
//       toast.success("🚀 Campaign sent successfully!");
//     } catch (err) {
//       console.error("❌ Sending failed:", err);
//       toast.error("❌ Failed to send campaign");
//     } finally {
//       setSendingId(null);
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-8">
//       <h2 className="text-3xl font-bold text-purple-700 mb-8 flex items-center gap-2">
//         <FaRocket className="text-green-500" />
//         Template Campaigns
//       </h2>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
//         {campaigns.length === 0 ? (
//           <div className="col-span-full text-gray-500 text-lg mt-8">
//             No template campaigns available.
//           </div>
//         ) : (
//           campaigns.map(campaign => (
//             <div
//               key={campaign.id}
//               className="flex flex-col bg-white rounded-xl shadow border px-6 py-4 min-h-[540px] relative"
//               style={{ minWidth: 340, maxWidth: 410 }}
//             >
//               {/* Gradient Bar */}
//               <div className="absolute left-0 top-0 h-2 w-full rounded-t-xl bg-gradient-to-r from-purple-500 via-purple-400 to-green-400"></div>
//               {/* Header Row */}
//               <div className="flex items-center justify-between mt-2 mb-2">
//                 <h3 className="text-lg font-semibold text-purple-800">
//                   {campaign.name}
//                 </h3>
//                 <span className="text-xs flex items-center gap-1 px-2 py-1 bg-gray-100 rounded font-medium">
//                   <svg
//                     width={18}
//                     height={18}
//                     className="inline-block text-gray-500"
//                     fill="none"
//                     stroke="currentColor"
//                   >
//                     <rect x="2" y="2" width="14" height="14" rx="2" />
//                     <path d="M2 12l4-4a2 2 0 012.8 0l5.2 5.2" />
//                     <path d="M14 6h.01" />
//                   </svg>
//                   Image
//                 </span>
//               </div>
//               {/* Image Preview */}
//               <div className="bg-gray-100 rounded-lg flex items-center justify-center min-h-[180px] mb-3 border border-gray-200">
//                 {campaign.imageUrl ? (
//                   <img
//                     src={campaign.imageUrl}
//                     alt="Campaign"
//                     className="object-contain max-h-44 max-w-full rounded"
//                   />
//                 ) : (
//                   <div className="flex flex-col items-center text-gray-400 py-10">
//                     <svg
//                       width={54}
//                       height={54}
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 48 48"
//                     >
//                       <rect
//                         x="7"
//                         y="11"
//                         width="34"
//                         height="26"
//                         rx="2"
//                         strokeWidth={2}
//                       />
//                       <path
//                         d="M7 32l8.4-8.8c1.1-1.1 2.9-1.1 4 0L31 32M21.5 20.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z"
//                         strokeWidth={2}
//                       />
//                     </svg>
//                     <span className="mt-2 text-sm">No Image</span>
//                   </div>
//                 )}
//               </div>
//               {/* Recipients Badge */}
//               <div className="mb-2">
//                 <span
//                   className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium
//       ${
//         campaign.recipientCount > 0
//           ? "bg-green-100 text-green-700"
//           : "bg-gray-100 text-gray-500"
//       }`}
//                 >
//                   <svg
//                     className="w-4 h-4"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 20 20"
//                   >
//                     <path d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM5 13a7 7 0 0110 0" />
//                   </svg>
//                   {campaign.recipientCount || 0} Recipients
//                 </span>
//               </div>

//               {/* WhatsApp Bubble Preview */}
//               <div className="mb-2">
//                 <WhatsAppBubblePreview
//                   messageTemplate={
//                     campaign.messageBody ||
//                     campaign.templateBody ||
//                     campaign.sampleBody ||
//                     campaign.messageTemplate ||
//                     "No message body"
//                   }
//                   multiButtons={
//                     campaign.multiButtons ||
//                     campaign.buttonParams ||
//                     campaign.buttons ||
//                     []
//                   }
//                   imageUrl={campaign.imageUrl}
//                   caption={campaign.imageCaption || ""}
//                   campaignId={campaign.id}
//                 />
//               </div>

//               {/* Spacer to push buttons to bottom */}
//               <div className="flex-1"></div>
//               {/* Action Buttons */}
//               <div className="flex gap-2 mt-3 pt-1 w-full">
//                 <button
//                   disabled={
//                     !campaign.recipientCount || sendingId === campaign.id
//                   }
//                   onClick={() => handleSend(campaign.id)}
//                   className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold shadow-sm transition
//         ${
//           !campaign.recipientCount
//             ? "bg-gray-200 text-gray-400 cursor-not-allowed"
//             : "bg-green-600 text-white hover:bg-green-700"
//         }
//       `}
//                 >
//                   <span role="img" aria-label="Send">
//                     🚀
//                   </span>{" "}
//                   Send
//                 </button>
//                 <button
//                   onClick={() =>
//                     navigate(
//                       `/app/campaigns/image-campaigns/assign-contacts/${campaign.id}`
//                     )
//                   }
//                   className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold bg-purple-100 text-purple-800 hover:bg-purple-200 transition"
//                 >
//                   <span role="img" aria-label="Assign">
//                     📇
//                   </span>{" "}
//                   Assign
//                 </button>
//                 <button
//                   onClick={() =>
//                     navigate(
//                       `/app/campaigns/image-campaigns/assigned-contacts/${campaign.id}`
//                     )
//                   }
//                   className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
//                 >
//                   <span role="img" aria-label="Recipients">
//                     👁️
//                   </span>{" "}
//                   Recipients
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// export default TemplateCampaignList;

// // ✅ File: src/pages/Campaigns/TemplateCampaignList.jsx

// import React, { useEffect, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { useNavigate } from "react-router-dom";
// import WhatsAppBubblePreview from "../../components/WhatsAppBubblePreview";
// import {
//   FaRocket,
//   FaAddressBook,
//   FaEye,
//   FaImage,
//   FaUsers,
// } from "react-icons/fa";

// function TemplateCampaignList() {
//   const [campaigns, setCampaigns] = useState([]);
//   const [sendingId, setSendingId] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const loadCampaigns = async () => {
//       try {
//         const res = await axiosClient.get("/campaign/get-image-campaign");
//         setCampaigns(res.data || []);
//       } catch (err) {
//         console.error(err);
//         toast.error("❌ Failed to load template campaigns");
//       }
//     };
//     loadCampaigns();
//   }, []);

//   const handleSend = async campaignId => {
//     setSendingId(campaignId);
//     try {
//       await axiosClient.post(`/campaign/send-campaign/${campaignId}`);
//       toast.success("🚀 Campaign sent successfully!");
//     } catch (err) {
//       console.error("❌ Sending failed:", err);
//       toast.error("❌ Failed to send campaign");
//     } finally {
//       setSendingId(null);
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-8">
//       <h2 className="text-3xl font-bold text-purple-700 mb-8 flex items-center gap-2">
//         <FaRocket className="text-green-500" />
//         Template Campaigns
//       </h2>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
//         {campaigns.length === 0 ? (
//           <div className="col-span-full text-gray-500 text-lg mt-8">
//             No template campaigns available.
//           </div>
//         ) : (
//           campaigns.map(campaign => (
//             <div
//               key={campaign.id}
//               className="flex flex-col bg-white rounded-xl shadow border px-6 py-4 min-h-[540px] relative"
//               style={{ minWidth: 340, maxWidth: 410 }}
//             >
//               {/* Gradient Bar */}
//               <div className="absolute left-0 top-0 h-2 w-full rounded-t-xl bg-gradient-to-r from-purple-500 via-purple-400 to-green-400"></div>
//               {/* Header Row */}
//               <div className="flex items-center justify-between mt-2 mb-2">
//                 <h3 className="text-lg font-semibold text-purple-800">
//                   {campaign.name}
//                 </h3>
//                 <span className="text-xs flex items-center gap-1 px-2 py-1 bg-gray-100 rounded font-medium">
//                   <svg
//                     width={18}
//                     height={18}
//                     className="inline-block text-gray-500"
//                     fill="none"
//                     stroke="currentColor"
//                   >
//                     <rect x="2" y="2" width="14" height="14" rx="2" />
//                     <path d="M2 12l4-4a2 2 0 012.8 0l5.2 5.2" />
//                     <path d="M14 6h.01" />
//                   </svg>
//                   Image
//                 </span>
//               </div>
//               {/* Image Preview */}
//               <div className="bg-gray-100 rounded-lg flex items-center justify-center min-h-[180px] mb-3 border border-gray-200">
//                 {campaign.imageUrl ? (
//                   <img
//                     src={campaign.imageUrl}
//                     alt="Campaign"
//                     className="object-contain max-h-44 max-w-full rounded"
//                   />
//                 ) : (
//                   <div className="flex flex-col items-center text-gray-400 py-10">
//                     <svg
//                       width={54}
//                       height={54}
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 48 48"
//                     >
//                       <rect
//                         x="7"
//                         y="11"
//                         width="34"
//                         height="26"
//                         rx="2"
//                         strokeWidth={2}
//                       />
//                       <path
//                         d="M7 32l8.4-8.8c1.1-1.1 2.9-1.1 4 0L31 32M21.5 20.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z"
//                         strokeWidth={2}
//                       />
//                     </svg>
//                     <span className="mt-2 text-sm">No Image</span>
//                   </div>
//                 )}
//               </div>
//               {/* Recipients Badge */}
//               <div className="mb-2">
//                 <span
//                   className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium
//       ${
//         campaign.recipientCount > 0
//           ? "bg-green-100 text-green-700"
//           : "bg-gray-100 text-gray-500"
//       }`}
//                 >
//                   <svg
//                     className="w-4 h-4"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 20 20"
//                   >
//                     <path d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM5 13a7 7 0 0110 0" />
//                   </svg>
//                   {campaign.recipientCount || 0} Recipients
//                 </span>
//               </div>
//               {/* Template Preview */}
//               <div className="bg-gray-50 rounded-lg p-3 min-h-[84px] mb-2 border border-gray-100">
//                 <div className="font-mono text-xs text-gray-700 break-all">
//                   {campaign.messageTemplate || "Template Preview"}
//                 </div>
//               </div>
//               {/* Spacer to push buttons to bottom */}
//               <div className="flex-1"></div>
//               {/* Action Buttons */}
//               <div className="flex gap-2 mt-3 pt-1 w-full">
//                 <button
//                   disabled={
//                     !campaign.recipientCount || sendingId === campaign.id
//                   }
//                   onClick={() => handleSend(campaign.id)}
//                   className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold shadow-sm transition
//         ${
//           !campaign.recipientCount
//             ? "bg-gray-200 text-gray-400 cursor-not-allowed"
//             : "bg-green-600 text-white hover:bg-green-700"
//         }
//       `}
//                 >
//                   <span role="img" aria-label="Send">
//                     🚀
//                   </span>{" "}
//                   Send
//                 </button>
//                 <button
//                   onClick={() =>
//                     navigate(
//                       `/app/campaigns/image-campaigns/assign-contacts/${campaign.id}`
//                     )
//                   }
//                   className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold bg-purple-100 text-purple-800 hover:bg-purple-200 transition"
//                 >
//                   <span role="img" aria-label="Assign">
//                     📇
//                   </span>{" "}
//                   Assign
//                 </button>
//                 <button
//                   onClick={() =>
//                     navigate(
//                       `/app/campaigns/image-campaigns/assigned-contacts/${campaign.id}`
//                     )
//                   }
//                   className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
//                 >
//                   <span role="img" aria-label="Recipients">
//                     👁️
//                   </span>{" "}
//                   Recipients
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// export default TemplateCampaignList;

// ✅ File: src/pages/Campaigns/TemplateCampaignList.jsx
// import React, { useEffect, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { useNavigate } from "react-router-dom";
// import WhatsAppBubblePreview from "../../components/WhatsAppBubblePreview";

// function TemplateCampaignList() {
//   const [campaigns, setCampaigns] = useState([]);
//   const [sendingId, setSendingId] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const loadCampaigns = async () => {
//       try {
//         const res = await axiosClient.get("/campaign/get-image-campaign");
//         setCampaigns(res.data || []);
//       } catch (err) {
//         console.error(err);
//         toast.error("❌ Failed to load template campaigns");
//       }
//     };
//     loadCampaigns();
//   }, []);

//   const handleSend = async campaignId => {
//     setSendingId(campaignId);
//     try {
//       // await axiosClient.post(`/campaign/send-template-campaign/${campaignId}`);
//       await axiosClient.post(`/campaign/send-campaign/${campaignId}`);
//       toast.success("🚀 Campaign sent +1 successfully!");
//     } catch (err) {
//       console.error("❌ Sending failed:", err);
//       toast.error("❌ Failed to send campaign");
//     } finally {
//       setSendingId(null);
//     }
//   };

//   return (
//     <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
//       <h2 className="text-2xl font-bold text-purple-700">
//         📄 Template Campaigns
//       </h2>

//       {campaigns.length === 0 ? (
//         <p className="text-gray-500">No template campaigns available.</p>
//       ) : (
//         campaigns.map(campaign => (
//           <div
//             key={campaign.id}
//             className="bg-white rounded-xl shadow border p-4 space-y-3"
//           >
//             <h3 className="text-lg font-semibold text-purple-800">
//               {campaign.name}
//             </h3>
//             <p className="text-sm text-gray-500">
//               Template: <strong>{campaign.messageTemplate}</strong>
//             </p>
//             <p className="text-sm text-gray-400">
//               Recipients: <strong>{campaign.recipientCount || 0}</strong>
//             </p>

//             <WhatsAppBubblePreview
//               templateBody={campaign.messageTemplate}
//               parameters={campaign.templateParameters || []}
//               imageUrl={campaign.imageUrl}
//               buttonParams={campaign.multiButtons?.map(btn => ({
//                 title: btn.title,
//                 type: btn.type,
//                 value: btn.value,
//               }))}
//             />

//             <div className="flex justify-end gap-4">
//               <button
//                 disabled={!campaign.recipientCount || sendingId === campaign.id}
//                 onClick={() => handleSend(campaign.id)}
//                 className={`px-4 py-2 rounded font-medium ${
//                   !campaign.recipientCount
//                     ? "bg-gray-300 text-gray-500 cursor-not-allowed"
//                     : "bg-green-600 text-white hover:bg-green-700"
//                 }`}
//               >
//                 {sendingId === campaign.id ? "Sending..." : "🚀 Send"}
//               </button>

//               <button
//                 onClick={() =>
//                   navigate(
//                     `/app/campaigns/image-campaigns/assign-contacts/${campaign.id}`
//                   )
//                 }
//                 className="px-4 py-2 rounded text-sm text-purple-600 hover:underline"
//               >
//                 🧩 Assign Contacts
//               </button>

//               <button
//                 onClick={() =>
//                   navigate(
//                     `/app/campaigns/image-campaigns/assigned-contacts/${campaign.id}`
//                   )
//                 }
//                 className="px-4 py-2 rounded text-sm text-blue-600 hover:underline"
//               >
//                 View Recipients
//               </button>
//             </div>
//           </div>
//         ))
//       )}
//     </div>
//   );
// }

// export default TemplateCampaignList;
