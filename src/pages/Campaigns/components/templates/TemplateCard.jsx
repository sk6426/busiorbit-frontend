// src/components/templates/TemplateCard.jsx
import React from "react";
// import WhatsAppBubblePreview from "../../WhatsAppBubblePreview";
import WhatsAppBubblePreview from "../../../../components/WhatsAppBubblePreview";
export default function TemplateCard({
  t,
  onSend,
  onAssign,
  onViewRecipients,
  onOpenInspector,
  sending,
}) {
  const hasRecipients = t.recipients > 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Media Slot — fixed 16:9 for uniformity */}
      <div className="relative">
        <div className="aspect-[16/9] w-full bg-gray-50 flex items-center justify-center">
          {t.kind === "image_header" && t.imageUrl ? (
            <img
              src={t.imageUrl}
              alt="Campaign"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                className="opacity-80"
              >
                <path
                  fill="currentColor"
                  d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14zm-2 0H5V5h14zM8 13l2.03 2.71L12 13l3 4H7z"
                />
              </svg>
              <span className="mt-2 text-xs text-gray-500">
                {t.kind === "text_only" ? "Text template" : "No media"}
              </span>
            </div>
          )}
        </div>

        {/* Neutral type chip */}
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white backdrop-blur-sm">
            {t.kind === "image_header" ? "Image header" : "Text only"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-4">
        {/* Title + recipients */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-base font-semibold text-gray-900">
            {t.name}
          </h3>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              hasRecipients
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-100 text-gray-500"
            }`}
            title={`${t.recipients} recipient(s)`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5m7 8v-1a6 6 0 0 0-12 0v1z"
              />
            </svg>
            {t.recipients}
          </span>
        </div>

        {/* Compact preview (click → inspector) */}
        <button
          type="button"
          onClick={onOpenInspector}
          className="rounded-lg border border-gray-200 bg-gray-50 p-2 text-left transition hover:bg-gray-100"
          title="Open full preview"
        >
          <WhatsAppBubblePreview
            messageTemplate={t.body}
            multiButtons={t.buttons}
            imageUrl={t.imageUrl || undefined}
            caption={t.caption}
            campaignId={t.id}
          />
        </button>

        {/* Actions */}
        <div className="mt-1 grid grid-cols-3 gap-2">
          <button
            disabled={!hasRecipients || sending}
            onClick={onSend}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition
              ${
                hasRecipients
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            title={hasRecipients ? "Send campaign" : "Assign recipients first"}
          >
            {sending ? "Sending…" : "Send"}
          </button>

          <button
            onClick={onAssign}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
            title="Assign recipients"
          >
            Assign
          </button>

          <button
            onClick={onViewRecipients}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
            title="View recipients"
          >
            Recipients
          </button>
        </div>
      </div>
    </div>
  );
}
