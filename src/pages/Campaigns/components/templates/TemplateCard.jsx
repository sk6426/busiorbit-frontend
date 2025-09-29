import React, { useState, useMemo } from "react";

/* ---------- helpers ---------- */
function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}
function relPast(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso).getTime();
    const diff = Date.now() - d;
    if (diff < 0) return "in future";
    const mins = Math.round(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    return `${days}d ago`;
  } catch {
    return null;
  }
}
function fmt(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "—";
  }
}

/**
 * Props:
 *  - t: { id, name, body, kind, recipients, updatedAt, createdAt?, sentAt?, scheduledAt?, status? }
 *  - sending: boolean
 *  - onOpenInspector, onSend, onAssign, onViewRecipients
 */
export default function TemplateCard({
  t,
  sending = false,
  onOpenInspector,
  onSend,
  onAssign,
  onViewRecipients,
}) {
  const [expanded, setExpanded] = useState(false);

  const recipients = Number(t?.recipients || 0);
  const canSend = recipients > 0 && !sending;

  const isTextOnly = t?.kind !== "image_header";
  const typeLabel = isTextOnly ? "Text only" : "Image header";

  // Message body comes from Campaign.MessageBody (normalized to t.body)
  const body = String(t?.body || "");

  // Dates (defensive across possible shapes)
  const createdAt =
    t?.createdAt || t?.created_on || t?.createdOn || t?.created || null;
  const sentAt =
    t?.sentAt || t?.lastSentAt || t?.dispatchedAt || t?.deliveredAt || null;
  const scheduledAt =
    t?.scheduledAt || t?.scheduleAt || t?.scheduled_for || null;

  // Status logic
  const hasFutureSchedule =
    scheduledAt && new Date(scheduledAt).getTime() > Date.now();

  const { statusKind, statusLabel, statusTitle } = useMemo(() => {
    // prefer explicit backend status if present
    const raw = String(t?.status || "").toLowerCase(); // "draft" | "sending" | "sent" | etc.

    if (hasFutureSchedule) {
      return {
        statusKind: "scheduled",
        statusLabel: "Scheduled",
        statusTitle: `Scheduled for ${fmt(scheduledAt)}`,
      };
    }

    if (raw === "sending") {
      return {
        statusKind: "sending",
        statusLabel: "Sending…",
        statusTitle: "",
      };
    }
    if (raw === "sent" || sentAt) {
      return {
        statusKind: "sent",
        statusLabel: sentAt ? `Sent ${relPast(sentAt)}` : "Sent",
        statusTitle: sentAt ? `Sent on ${fmt(sentAt)}` : "",
      };
    }
    if (raw === "draft") {
      return { statusKind: "draft", statusLabel: "Draft", statusTitle: "" };
    }

    return { statusKind: "idle", statusLabel: "Not sent", statusTitle: "" };
  }, [t?.status, scheduledAt, hasFutureSchedule, sentAt]);

  const statusClasses =
    statusKind === "sent"
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
      : statusKind === "scheduled"
      ? "bg-amber-50 text-amber-800 ring-1 ring-amber-100"
      : statusKind === "sending"
      ? "bg-sky-50 text-sky-700 ring-1 ring-sky-100"
      : statusKind === "draft"
      ? "bg-gray-100 text-gray-700 ring-1 ring-gray-200"
      : "bg-gray-100 text-gray-700 ring-1 ring-gray-200";

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
        <div className="min-w-0 flex items-center gap-2">
          {/* App avatar / mark */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[12px] font-semibold text-gray-600">
            WA
          </div>

          <div className="min-w-0">
            <button
              onClick={onOpenInspector}
              type="button"
              className="block truncate text-[15px] font-semibold text-gray-900 hover:underline"
              title="Preview template"
            >
              {t?.name || "Untitled"}
            </button>
            <div className="mt-[2px] flex items-center gap-2 text-[11px] text-gray-500">
              <span
                className={cx(
                  "inline-flex items-center gap-1 rounded-full px-1.5 py-[2px] ring-1",
                  "bg-gray-50 text-gray-700 ring-gray-200"
                )}
                title={typeLabel}
              >
                <span className="inline-block h-[6px] w-[6px] rounded-full bg-gray-400" />
                {typeLabel}
              </span>

              {/* Created date */}
              {createdAt && (
                <span
                  className="inline-flex items-center gap-1"
                  title={`Created: ${fmt(createdAt)}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-[12px] w-[12px]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M8 2v3M16 2v3M3 9h18M4 7h16a1 1 0 011 1v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a1 1 0 011-1z" />
                  </svg>
                  {new Date(createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* recipients pill */}
          <span
            title="Recipients"
            className={cx(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              recipients > 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-100 text-gray-600"
            )}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            {recipients}
          </span>

          {/* status chip */}
          <span
            className={cx(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              statusClasses
            )}
            title={statusTitle || undefined}
          >
            {statusKind === "scheduled" && (
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 6v6l4 2" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            )}
            {statusKind === "sent" && (
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
            {statusLabel}
          </span>

          {/* (preview eye icon removed as requested) */}
        </div>
      </div>

      {/* Body (collapsible) */}
      <div className="px-3 py-2">
        <div
          role="button"
          title={expanded ? "Click to collapse" : "Click to expand"}
          onClick={() => setExpanded(v => !v)}
          className={cx(
            "relative rounded-lg border bg-gray-50 px-3 py-2 text-[13px] leading-[1.45] text-gray-800",
            expanded
              ? "max-h-[320px] overflow-auto"
              : "max-h-20 overflow-hidden"
          )}
        >
          <pre className="whitespace-pre-wrap font-sans">{body}</pre>

          {!expanded && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-gray-50 to-transparent" />
          )}
        </div>

        {/* meta row under body */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-gray-600">
          {/* Sent/date or not sent */}
          <span
            className="inline-flex items-center gap-1"
            title={sentAt ? fmt(sentAt) : "Not sent yet"}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[14px] w-[14px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
            {sentAt ? `Sent ${relPast(sentAt) || ""}` : "Not sent"}
          </span>

          {/* Created date (explicit) */}
          {createdAt && (
            <span
              className="inline-flex items-center gap-1"
              title={fmt(createdAt)}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[14px] w-[14px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M8 2v3M16 2v3M3 9h18M4 7h16a1 1 0 011 1v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a1 1 0 011-1z" />
              </svg>
              {new Date(createdAt).toLocaleDateString()}
            </span>
          )}

          {/* Scheduled (if in future) */}
          {hasFutureSchedule && (
            <span
              className="inline-flex items-center gap-1"
              title={fmt(scheduledAt)}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[14px] w-[14px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 6v6l4 2" />
                <circle cx="12" cy="12" r="9" />
              </svg>
              Scheduled
            </span>
          )}

          {/* expand/collapse hint */}
          <span
            onClick={() => setExpanded(v => !v)}
            className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-full bg-gray-100 px-2 py-[2px] text-[11px] text-gray-700 hover:bg-gray-200"
          >
            {expanded ? "Collapse" : "Expand"}
          </span>
        </div>
      </div>

      {/* Footer actions (right aligned) */}
      <div className="mt-auto border-t border-gray-100 px-3 py-2">
        <div className="flex items-center justify-end gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700"
            onClick={onAssign}
            type="button"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6M22 11h-6" />
            </svg>
            Assign
          </button>

          <button
            className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200"
            onClick={onViewRecipients}
            type="button"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            Recipients
          </button>

          <button
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            disabled={!canSend}
            onClick={onSend}
            type="button"
            title={canSend ? "Send campaign" : "Add recipients first"}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </article>
  );
}

// import React, { useState, useMemo } from "react";

// /* ---------- helpers ---------- */
// function cx(...xs) {
//   return xs.filter(Boolean).join(" ");
// }
// function relPast(iso) {
//   if (!iso) return null;
//   try {
//     const d = new Date(iso).getTime();
//     const diff = Date.now() - d;
//     if (diff < 0) return "in future";
//     const mins = Math.round(diff / 60000);
//     if (mins < 1) return "just now";
//     if (mins < 60) return `${mins}m ago`;
//     const hrs = Math.round(mins / 60);
//     if (hrs < 24) return `${hrs}h ago`;
//     const days = Math.round(hrs / 24);
//     return `${days}d ago`;
//   } catch {
//     return null;
//   }
// }
// function fmt(iso) {
//   try {
//     return new Date(iso).toLocaleString();
//   } catch {
//     return "—";
//   }
// }

// /**
//  * Props:
//  *  - t: { id, name, body, kind, recipients, updatedAt, createdAt?, sentAt?, scheduledAt?, status? }
//  *  - sending: boolean
//  *  - onOpenInspector, onSend, onAssign, onViewRecipients
//  */
// export default function TemplateCard({
//   t,
//   sending = false,
//   onOpenInspector,
//   onSend,
//   onAssign,
//   onViewRecipients,
// }) {
//   const [expanded, setExpanded] = useState(false);

//   const recipients = Number(t?.recipients || 0);
//   const canSend = recipients > 0 && !sending;

//   const isTextOnly = t?.kind !== "image_header";
//   const typeLabel = isTextOnly ? "Text only" : "Image header";

//   // Message body comes from Campaign.MessageBody (normalized to t.body)
//   const body = String(t?.body || "");

//   // Dates (defensive across possible shapes)
//   const createdAt =
//     t?.createdAt || t?.created_on || t?.createdOn || t?.created || null;
//   const sentAt =
//     t?.sentAt || t?.lastSentAt || t?.dispatchedAt || t?.deliveredAt || null;
//   const scheduledAt =
//     t?.scheduledAt || t?.scheduleAt || t?.scheduled_for || null;

//   // Status logic
//   const hasFutureSchedule =
//     scheduledAt && new Date(scheduledAt).getTime() > Date.now();

//   const { statusKind, statusLabel, statusTitle } = useMemo(() => {
//     // prefer explicit backend status if present
//     const raw = String(t?.status || "").toLowerCase(); // "draft" | "sending" | "sent" | etc.

//     if (hasFutureSchedule) {
//       return {
//         statusKind: "scheduled",
//         statusLabel: "Scheduled",
//         statusTitle: `Scheduled for ${fmt(scheduledAt)}`,
//       };
//     }

//     if (raw === "sending") {
//       return {
//         statusKind: "sending",
//         statusLabel: "Sending…",
//         statusTitle: "",
//       };
//     }
//     if (raw === "sent" || sentAt) {
//       return {
//         statusKind: "sent",
//         statusLabel: sentAt ? `Sent ${relPast(sentAt)}` : "Sent",
//         statusTitle: sentAt ? `Sent on ${fmt(sentAt)}` : "",
//       };
//     }
//     if (raw === "draft") {
//       return { statusKind: "draft", statusLabel: "Draft", statusTitle: "" };
//     }

//     return { statusKind: "idle", statusLabel: "Not sent", statusTitle: "" };
//   }, [t?.status, scheduledAt, hasFutureSchedule, sentAt]);

//   const statusClasses =
//     statusKind === "sent"
//       ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
//       : statusKind === "scheduled"
//       ? "bg-amber-50 text-amber-800 ring-1 ring-amber-100"
//       : statusKind === "sending"
//       ? "bg-sky-50 text-sky-700 ring-1 ring-sky-100"
//       : statusKind === "draft"
//       ? "bg-gray-100 text-gray-700 ring-1 ring-gray-200"
//       : "bg-gray-100 text-gray-700 ring-1 ring-gray-200";

//   return (
//     <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
//       {/* Header */}
//       <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
//         <div className="min-w-0 flex items-center gap-2">
//           {/* App avatar / mark */}
//           <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[12px] font-semibold text-gray-600">
//             WA
//           </div>

//           <div className="min-w-0">
//             <button
//               onClick={onOpenInspector}
//               type="button"
//               className="block truncate text-[15px] font-semibold text-gray-900 hover:underline"
//               title="Preview template"
//             >
//               {t?.name || "Untitled"}
//             </button>
//             <div className="mt-[2px] flex items-center gap-2 text-[11px] text-gray-500">
//               <span
//                 className={cx(
//                   "inline-flex items-center gap-1 rounded-full px-1.5 py-[2px] ring-1",
//                   "bg-gray-50 text-gray-700 ring-gray-200"
//                 )}
//                 title={typeLabel}
//               >
//                 <span className="inline-block h-[6px] w-[6px] rounded-full bg-gray-400" />
//                 {typeLabel}
//               </span>

//               {/* Created date */}
//               {createdAt && (
//                 <span
//                   className="inline-flex items-center gap-1"
//                   title={`Created: ${fmt(createdAt)}`}
//                 >
//                   <svg
//                     viewBox="0 0 24 24"
//                     className="h-[12px] w-[12px]"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                   >
//                     <path d="M8 2v3M16 2v3M3 9h18M4 7h16a1 1 0 011 1v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a1 1 0 011-1z" />
//                   </svg>
//                   {new Date(createdAt).toLocaleDateString()}
//                 </span>
//               )}
//             </div>
//           </div>
//         </div>

//         <div className="flex items-center gap-2">
//           {/* recipients pill */}
//           <span
//             title="Recipients"
//             className={cx(
//               "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
//               recipients > 0
//                 ? "bg-emerald-50 text-emerald-700"
//                 : "bg-gray-100 text-gray-600"
//             )}
//           >
//             <svg
//               viewBox="0 0 24 24"
//               className="h-3.5 w-3.5"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//             >
//               <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
//               <circle cx="9" cy="7" r="4" />
//             </svg>
//             {recipients}
//           </span>

//           {/* status chip */}
//           <span
//             className={cx(
//               "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
//               statusClasses
//             )}
//             title={statusTitle || undefined}
//           >
//             {statusKind === "scheduled" && (
//               <svg
//                 viewBox="0 0 24 24"
//                 className="h-3.5 w-3.5"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="2"
//               >
//                 <path d="M12 6v6l4 2" />
//                 <circle cx="12" cy="12" r="9" />
//               </svg>
//             )}
//             {statusKind === "sent" && (
//               <svg
//                 viewBox="0 0 24 24"
//                 className="h-3.5 w-3.5"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="2"
//               >
//                 <path d="M5 13l4 4L19 7" />
//               </svg>
//             )}
//             {statusLabel}
//           </span>

//           {/* compact preview icon (not in footer actions) */}
//           <button
//             type="button"
//             onClick={onOpenInspector}
//             className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
//             title="Preview"
//           >
//             <svg
//               viewBox="0 0 24 24"
//               className="h-4.5 w-4.5"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//             >
//               <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
//               <circle cx="12" cy="12" r="3" />
//             </svg>
//           </button>
//         </div>
//       </div>

//       {/* Body (collapsible) */}
//       <div className="px-3 py-2">
//         <div
//           role="button"
//           title={expanded ? "Click to collapse" : "Click to expand"}
//           onClick={() => setExpanded(v => !v)}
//           className={cx(
//             "relative rounded-lg border bg-gray-50 px-3 py-2 text-[13px] leading-[1.45] text-gray-800",
//             expanded
//               ? "max-h-[320px] overflow-auto"
//               : "max-h-20 overflow-hidden"
//           )}
//         >
//           <pre className="whitespace-pre-wrap font-sans">{body}</pre>

//           {!expanded && (
//             <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-gray-50 to-transparent" />
//           )}
//         </div>

//         {/* meta row under body */}
//         <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-gray-600">
//           {/* Sent/date or not sent */}
//           <span
//             className="inline-flex items-center gap-1"
//             title={sentAt ? fmt(sentAt) : "Not sent yet"}
//           >
//             <svg
//               viewBox="0 0 24 24"
//               className="h-[14px] w-[14px]"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//             >
//               <path d="M22 2L11 13" />
//               <path d="M22 2l-7 20-4-9-9-4 20-7z" />
//             </svg>
//             {sentAt ? `Sent ${relPast(sentAt) || ""}` : "Not sent"}
//           </span>

//           {/* Created date (explicit) */}
//           {createdAt && (
//             <span
//               className="inline-flex items-center gap-1"
//               title={fmt(createdAt)}
//             >
//               <svg
//                 viewBox="0 0 24 24"
//                 className="h-[14px] w-[14px]"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="2"
//               >
//                 <path d="M8 2v3M16 2v3M3 9h18M4 7h16a1 1 0 011 1v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a1 1 0 011-1z" />
//               </svg>
//               {new Date(createdAt).toLocaleDateString()}
//             </span>
//           )}

//           {/* Scheduled (if in future) */}
//           {hasFutureSchedule && (
//             <span
//               className="inline-flex items-center gap-1"
//               title={fmt(scheduledAt)}
//             >
//               <svg
//                 viewBox="0 0 24 24"
//                 className="h-[14px] w-[14px]"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="2"
//               >
//                 <path d="M12 6v6l4 2" />
//                 <circle cx="12" cy="12" r="9" />
//               </svg>
//               Scheduled
//             </span>
//           )}

//           {/* expand/collapse hint */}
//           <span
//             onClick={() => setExpanded(v => !v)}
//             className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-full bg-gray-100 px-2 py-[2px] text-[11px] text-gray-700 hover:bg-gray-200"
//           >
//             {expanded ? "Collapse" : "Expand"}
//           </span>
//         </div>
//       </div>

//       {/* Footer actions (right aligned) */}
//       <div className="mt-auto border-t border-gray-100 px-3 py-2">
//         <div className="flex items-center justify-end gap-2">
//           <button
//             className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700"
//             onClick={onAssign}
//             type="button"
//           >
//             <svg
//               viewBox="0 0 24 24"
//               className="h-4 w-4"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//             >
//               <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
//               <circle cx="9" cy="7" r="4" />
//               <path d="M19 8v6M22 11h-6" />
//             </svg>
//             Assign
//           </button>

//           <button
//             className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200"
//             onClick={onViewRecipients}
//             type="button"
//           >
//             <svg
//               viewBox="0 0 24 24"
//               className="h-4 w-4"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//             >
//               <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
//               <circle cx="9" cy="7" r="4" />
//             </svg>
//             Recipients
//           </button>

//           <button
//             className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
//             disabled={!canSend}
//             onClick={onSend}
//             type="button"
//             title={canSend ? "Send campaign" : "Add recipients first"}
//           >
//             <svg
//               viewBox="0 0 24 24"
//               className="h-4 w-4"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//             >
//               <path d="M22 2L11 13" />
//               <path d="M22 2l-7 20-4-9-9-4 20-7z" />
//             </svg>
//             {sending ? "Sending…" : "Send"}
//           </button>
//         </div>
//       </div>
//     </article>
//   );
// }

// import React from "react";

// /* ---------- helpers ---------- */
// function truncate(s = "", n = 100) {
//   const t = String(s).replace(/\s+/g, " ").trim();
//   return t.length > n ? t.slice(0, n - 1) + "…" : t;
// }
// function relPast(iso) {
//   if (!iso) return "—";
//   try {
//     const d = new Date(iso).getTime();
//     const diff = Date.now() - d;
//     if (diff < 0) return "in future";
//     const mins = Math.round(diff / 60000);
//     if (mins < 1) return "just now";
//     if (mins < 60) return `${mins}m ago`;
//     const hrs = Math.round(mins / 60);
//     if (hrs < 24) return `${hrs}h ago`;
//     const days = Math.round(hrs / 24);
//     return `${days}d ago`;
//   } catch {
//     return "—";
//   }
// }
// function formatDT(iso) {
//   try {
//     return new Date(iso).toLocaleString();
//   } catch {
//     return "—";
//   }
// }
// function cx(...xs) {
//   return xs.filter(Boolean).join(" ");
// }

// /**
//  * Props:
//  *  - t: { id, name, body, kind, recipients, updatedAt, createdAt?, sentAt?, scheduledAt?, status? }
//  *  - sending: boolean
//  *  - onOpenInspector, onSend, onAssign, onViewRecipients
//  */
// export default function TemplateCard({
//   t,
//   sending = false,
//   onOpenInspector,
//   onSend,
//   onAssign,
//   onViewRecipients,
// }) {
//   const recipients = Number(t?.recipients || 0);
//   const canSend = recipients > 0 && !sending;

//   const isTextOnly = t?.kind !== "image_header";
//   const typeLabel = isTextOnly ? "Text only" : "Image header";

//   const body = t?.body || "";

//   // Dates/status (defensive across possible field names)
//   const createdAt =
//     t?.createdAt || t?.created_at || t?.createdOn || t?.created || null;
//   const sentAt =
//     t?.sentAt || t?.lastSentAt || t?.dispatchedAt || t?.deliveredAt || null;
//   const scheduledAt =
//     t?.scheduledAt || t?.scheduleAt || t?.scheduled_for || null;

//   const hasFutureSchedule =
//     scheduledAt && new Date(scheduledAt).getTime() > Date.now();

//   let statusKind = "idle";
//   let statusLabel = "Not sent";
//   let statusTitle = "";

//   if (hasFutureSchedule) {
//     statusKind = "scheduled";
//     statusLabel = "Scheduled";
//     statusTitle = `Scheduled for ${formatDT(scheduledAt)}`;
//   } else if (sentAt) {
//     statusKind = "sent";
//     statusLabel = `Sent ${relPast(sentAt)}`;
//     statusTitle = `Sent on ${formatDT(sentAt)}`;
//   }

//   return (
//     <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
//       {/* Header (name + recipients) */}
//       <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
//         <button
//           onClick={onOpenInspector}
//           className="truncate text-[15px] font-semibold text-gray-900 hover:underline"
//           title="Open preview"
//           type="button"
//         >
//           {t?.name || "Untitled"}
//         </button>

//         <span
//           title="Recipients"
//           className={cx(
//             "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
//             recipients > 0
//               ? "bg-emerald-50 text-emerald-700"
//               : "bg-gray-100 text-gray-600"
//           )}
//         >
//           <svg
//             viewBox="0 0 24 24"
//             className="h-3.5 w-3.5"
//             fill="none"
//             stroke="currentColor"
//             strokeWidth="2"
//           >
//             <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
//             <circle cx="9" cy="7" r="4" />
//           </svg>
//           {recipients}
//         </span>
//       </div>

//       {/* Compact excerpt (no chat bubble) */}
//       <button
//         type="button"
//         onClick={onOpenInspector}
//         className="mx-3 mt-2 w-auto rounded-md bg-gray-50 px-3 py-2 text-left text-[13px] leading-5 text-gray-700 hover:bg-gray-100"
//         title="Preview template"
//       >
//         {truncate(body || " ")}
//       </button>

//       {/* Meta line: type • created • status */}
//       <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-3 pb-2 text-[11px] text-gray-600">
//         <MetaInline
//           icon={
//             isTextOnly ? (
//               <path d="M4 6h16M4 10h10M4 14h8M4 18h6" />
//             ) : (
//               <>
//                 <rect x="3" y="4" width="18" height="16" rx="2" />
//                 <rect x="6" y="6" width="12" height="6" rx="1" />
//               </>
//             )
//           }
//           label={typeLabel}
//         />
//         <Dot />
//         <MetaInline
//           icon={
//             <>
//               <rect x="4" y="4" width="16" height="16" rx="2" />
//               <path d="M8 2v4M16 2v4M4 10h16" />
//             </>
//           }
//           label={`Created ${createdAt ? relPast(createdAt) : "—"}`}
//           title={createdAt ? formatDT(createdAt) : ""}
//         />
//         <Dot />
//         <StatusPill kind={statusKind} label={statusLabel} title={statusTitle} />
//       </div>

//       {/* Actions */}
//       <div className="mt-auto border-t border-gray-100 px-3 py-2">
//         <div className="grid grid-cols-3 gap-2">
//           <button
//             onClick={onSend}
//             disabled={!canSend}
//             className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
//             title={
//               canSend ? "Send campaign" : "Add recipients to enable sending"
//             }
//           >
//             {sending ? (
//               <>
//                 <svg
//                   className="h-3.5 w-3.5 animate-spin"
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="2"
//                 >
//                   <circle cx="12" cy="12" r="9" className="opacity-25" />
//                   <path d="M21 12a9 9 0 0 1-9 9" className="opacity-75" />
//                 </svg>
//                 Sending…
//               </>
//             ) : (
//               <>
//                 <svg
//                   viewBox="0 0 24 24"
//                   className="h-3.5 w-3.5"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="2"
//                 >
//                   <path d="m22 2-7 20-4-9-9-4Z" />
//                 </svg>
//                 Send
//               </>
//             )}
//           </button>

//           <button
//             onClick={onAssign}
//             className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 transition hover:bg-gray-50"
//             title="Assign recipients"
//           >
//             <svg
//               viewBox="0 0 24 24"
//               className="h-3.5 w-3.5"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//             >
//               <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
//               <circle cx="9" cy="7" r="4" />
//             </svg>
//             Assign
//           </button>

//           <button
//             onClick={onViewRecipients}
//             className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 transition hover:bg-gray-50"
//             title="View recipients"
//           >
//             <svg
//               viewBox="0 0 24 24"
//               className="h-3.5 w-3.5"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//             >
//               <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
//               <circle cx="12" cy="12" r="3" />
//             </svg>
//             Recipients
//           </button>
//         </div>

//         {/* Minimal preview link (optional) */}
//         <div className="mt-2 text-right">
//           <button
//             onClick={onOpenInspector}
//             className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:underline"
//             title="Preview template"
//           >
//             <svg
//               viewBox="0 0 24 24"
//               className="h-3.5 w-3.5"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//             >
//               <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
//               <circle cx="12" cy="12" r="3" />
//             </svg>
//             Preview
//           </button>
//         </div>
//       </div>
//     </article>
//   );
// }

// /* ---------- small bits ---------- */
// function Dot() {
//   return <span className="text-gray-300">•</span>;
// }
// function MetaInline({ icon, label, title }) {
//   return (
//     <span className="inline-flex items-center gap-1" title={title}>
//       <svg
//         viewBox="0 0 24 24"
//         className="h-3.5 w-3.5"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.8"
//       >
//         {icon}
//       </svg>
//       {label}
//     </span>
//   );
// }
// function StatusPill({ kind, label, title }) {
//   const cls =
//     kind === "sent"
//       ? "bg-emerald-50 text-emerald-700"
//       : kind === "scheduled"
//       ? "bg-amber-50 text-amber-700"
//       : "bg-gray-100 text-gray-600";
//   const icon =
//     kind === "sent" ? (
//       <path d="m5 12 4 4L19 6" />
//     ) : kind === "scheduled" ? (
//       <>
//         <circle cx="12" cy="12" r="9" />
//         <path d="M12 7v5l3 3" />
//       </>
//     ) : (
//       <path d="M3 12h18" />
//     );
//   return (
//     <span
//       className={cx(
//         "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
//         cls
//       )}
//       title={title}
//     >
//       <svg
//         viewBox="0 0 24 24"
//         className="h-3.5 w-3.5"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="2"
//       >
//         {icon}
//       </svg>
//       {label}
//     </span>
//   );
// }

// import React from "react";

// /* ---------- tiny helpers ---------- */
// function truncate(s = "", n = 100) {
//   const t = String(s).replace(/\s+/g, " ").trim();
//   return t.length > n ? t.slice(0, n - 1) + "…" : t;
// }
// function relativeTime(iso) {
//   if (!iso) return "—";
//   try {
//     const d = new Date(iso).getTime();
//     const diff = Date.now() - d;
//     const mins = Math.round(diff / 60000);
//     if (mins < 1) return "just now";
//     if (mins < 60) return `${mins}m ago`;
//     const hrs = Math.round(mins / 60);
//     if (hrs < 24) return `${hrs}h ago`;
//     const days = Math.round(hrs / 24);
//     return `${days}d ago`;
//   } catch {
//     return "—";
//   }
// }
// function countPlaceholders(body = "") {
//   const m = String(body).match(/\{\{\d+\}\}/g);
//   return m ? m.length : 0;
// }
// function cx(...xs) {
//   return xs.filter(Boolean).join(" ");
// }

// /**
//  * Props:
//  *  - t: { id, name, body, kind, hasButtons, buttons, recipients, updatedAt }
//  *  - sending: boolean
//  *  - onOpenInspector, onSend, onAssign, onViewRecipients: handlers
//  */
// export default function TemplateCard({
//   t,
//   sending = false,
//   onOpenInspector,
//   onSend,
//   onAssign,
//   onViewRecipients,
// }) {
//   const recipients = Number(t?.recipients || 0);
//   const canSend = recipients > 0 && !sending;

//   const isTextOnly = t?.kind !== "image_header";
//   const typeLabel = isTextOnly ? "Text only" : "Image header";

//   const buttonCount = Array.isArray(t?.buttons)
//     ? t.buttons.length
//     : t?.hasButtons
//     ? 1
//     : 0;

//   const body = t?.body || "";
//   const bodyLen = body.length;
//   const vars = countPlaceholders(body);

//   return (
//     <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
//       {/* Header (name + recipients) */}
//       <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
//         <button
//           onClick={onOpenInspector}
//           className="truncate text-[15px] font-semibold text-gray-900 hover:underline"
//           title="Open preview"
//           type="button"
//         >
//           {t?.name || "Untitled"}
//         </button>

//         <span
//           title="Recipients"
//           className={cx(
//             "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
//             recipients > 0
//               ? "bg-emerald-50 text-emerald-700"
//               : "bg-gray-100 text-gray-600"
//           )}
//         >
//           <svg
//             viewBox="0 0 24 24"
//             className="h-3.5 w-3.5"
//             fill="none"
//             stroke="currentColor"
//             strokeWidth="2"
//           >
//             <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
//             <circle cx="9" cy="7" r="4" />
//           </svg>
//           {recipients}
//         </span>
//       </div>

//       {/* One-line WhatsApp-style preview (clickable) */}
//       <button
//         type="button"
//         onClick={onOpenInspector}
//         className="mx-3 mt-2 rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2 text-left"
//         title="Preview template"
//       >
//         <div className="relative w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] leading-5 text-gray-700">
//           {truncate(body || " ")}
//           <span className="absolute -bottom-1.5 left-6 block h-2 w-2 rotate-45 rounded-[2px] border-b border-r border-gray-200 bg-white" />
//         </div>
//       </button>

//       {/* Ultra-compact meta line (dot-separated) */}
//       <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-3 pb-2 text-[11px] text-gray-600">
//         <MetaInline
//           icon={
//             isTextOnly ? (
//               <path d="M4 6h16M4 10h10M4 14h8M4 18h6" />
//             ) : (
//               <>
//                 <rect x="3" y="4" width="18" height="16" rx="2" />
//                 <rect x="6" y="6" width="12" height="6" rx="1" />
//               </>
//             )
//           }
//           label={typeLabel}
//         />
//         <Dot />
//         <MetaInline
//           icon={<rect x="3" y="7" width="18" height="10" rx="2" />}
//           extra={<path d="M7 12h10" />}
//           label={`${buttonCount} button${buttonCount === 1 ? "" : "s"}`}
//         />
//         <Dot />
//         <MetaInline
//           icon={<path d="M4 7h16M4 12h10M4 17h7" />}
//           label={`${bodyLen} chars`}
//         />
//         {vars > 0 && (
//           <>
//             <Dot />
//             <MetaInline
//               icon={<path d="M4 6h16M4 12h8M4 18h4" />}
//               label={`${vars} vars`}
//             />
//           </>
//         )}
//         <Dot />
//         <MetaInline
//           icon={
//             <>
//               <circle cx="12" cy="12" r="9" />
//               <path d="M12 7v5l3 3" />
//             </>
//           }
//           label={relativeTime(t?.updatedAt)}
//         />
//       </div>

//       {/* Actions (compact) */}
//       <div className="mt-auto border-t border-gray-100 px-3 py-2">
//         <div className="grid grid-cols-3 gap-2">
//           <button
//             onClick={onSend}
//             disabled={!canSend}
//             className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
//             title={
//               canSend ? "Send campaign" : "Add recipients to enable sending"
//             }
//           >
//             {sending ? (
//               <>
//                 <svg
//                   className="h-3.5 w-3.5 animate-spin"
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="2"
//                 >
//                   <circle cx="12" cy="12" r="9" className="opacity-25" />
//                   <path d="M21 12a9 9 0 0 1-9 9" className="opacity-75" />
//                 </svg>
//                 Sending…
//               </>
//             ) : (
//               <>
//                 <svg
//                   viewBox="0 0 24 24"
//                   className="h-3.5 w-3.5"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="2"
//                 >
//                   <path d="m22 2-7 20-4-9-9-4Z" />
//                 </svg>
//                 Send
//               </>
//             )}
//           </button>

//           <button
//             onClick={onAssign}
//             className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 transition hover:bg-gray-50"
//             title="Assign recipients"
//           >
//             <svg
//               viewBox="0 0 24 24"
//               className="h-3.5 w-3.5"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//             >
//               <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
//               <circle cx="9" cy="7" r="4" />
//             </svg>
//             Assign
//           </button>

//           <button
//             onClick={onViewRecipients}
//             className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 transition hover:bg-gray-50"
//             title="View recipients"
//           >
//             <svg
//               viewBox="0 0 24 24"
//               className="h-3.5 w-3.5"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//             >
//               <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
//               <circle cx="12" cy="12" r="3" />
//             </svg>
//             Recipients
//           </button>
//         </div>

//         {/* Subtle preview link */}
//         <div className="mt-2 text-right">
//           <button
//             onClick={onOpenInspector}
//             className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:underline"
//             title="Preview template"
//           >
//             <svg
//               viewBox="0 0 24 24"
//               className="h-3.5 w-3.5"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//             >
//               <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
//               <circle cx="12" cy="12" r="3" />
//             </svg>
//             Preview
//           </button>
//         </div>
//       </div>
//     </article>
//   );
// }

// /* ---------- tiny inline bits ---------- */
// function Dot() {
//   return <span className="text-gray-300">•</span>;
// }
// function MetaInline({ icon, extra, label }) {
//   return (
//     <span className="inline-flex items-center gap-1">
//       <svg
//         viewBox="0 0 24 24"
//         className="h-3.5 w-3.5"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.8"
//       >
//         {icon}
//         {extra}
//       </svg>
//       {label}
//     </span>
//   );
// }

// // src/components/templates/TemplateCard.jsx
// import React from "react";
// // import WhatsAppBubblePreview from "../../WhatsAppBubblePreview";
// import WhatsAppBubblePreview from "../../../../components/WhatsAppBubblePreview";
// export default function TemplateCard({
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

//         {/* Neutral type chip */}
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
