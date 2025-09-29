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
