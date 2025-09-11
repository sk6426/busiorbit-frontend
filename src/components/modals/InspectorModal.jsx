// 📄 src/components/modals/InspectorModal.jsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import PhoneWhatsPreviewAdapter from "../previews/PhoneWhatsPreviewAdapter";
import normalizeTemplate from "../../utils/normalizeTemplate";
import { X } from "lucide-react";

function Overlay({ onClick }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999]"
      onClick={onClick}
      aria-hidden="true"
    />
  );
}

export default function InspectorModal({ open, onClose, item }) {
  // ✅ Hooks must not be conditional. Run always, guard inside the effect.
  useEffect(() => {
    if (!open) return; // run only when modal is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // If closed or no item, render nothing *after* hooks were called
  if (!open || !item) return null;

  // Safe normalization
  const n = normalizeTemplate(item) || {};
  const previewProps = {
    messageType: n.messageType || "template",
    headerType: n.headerType || (n.headerImageUrl ? "image" : "none"),
    headerImageUrl: n.headerImageUrl || n.imageUrl || n.mediaUrl || "",
    caption: n.caption || "",
    body: n.messageBody || n.body || n.text || "",
    footer: n.footer || "",
    buttons:
      (Array.isArray(n.multiButtons) && n.multiButtons.length
        ? n.multiButtons
        : n.buttons) || [],
  };

  const title =
    item.name || item.templateName || item.campaignName || "Template Preview";
  const status = item.status || item.reviewStatus || item.templateStatus || "—";
  const category = item.category || item.templateCategory || item.type || "—";

  return createPortal(
    <>
      <Overlay onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl border"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
                  Status: <span className="ml-1 font-medium">{status}</span>
                </span>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
                  Category: <span className="ml-1 font-medium">{category}</span>
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-0 sm:p-4">
            <div className="max-h-[75vh] overflow-auto p-4">
              <PhoneWhatsPreviewAdapter {...previewProps} />
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
