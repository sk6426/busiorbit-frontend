// src/utils/normalizeTemplate.js
export default function normalizeTemplate(raw) {
  const buttons = raw?.multiButtons || raw?.buttonParams || raw?.buttons || [];
  const imageUrl = raw?.imageUrl || null;
  const body =
    raw?.messageBody ||
    raw?.templateBody ||
    raw?.sampleBody ||
    raw?.messageTemplate ||
    raw?.body ||
    "";

  return {
    id: raw?.id,
    name: raw?.name || "Untitled Campaign",
    kind: imageUrl ? "image_header" : "text_only",
    body,
    caption: raw?.imageCaption || raw?.caption || "",
    imageUrl,
    buttons,
    hasButtons: Array.isArray(buttons) && buttons.length > 0,
    recipients: raw?.recipientCount || 0,
    updatedAt: raw?.updatedAt || raw?.createdAt || null,
    raw,
  };
}
