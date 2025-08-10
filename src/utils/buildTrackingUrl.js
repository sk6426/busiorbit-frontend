const BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://yourdomain.com";

export function buildTrackingUrl({
  businessId,
  sourceType = "campaign",
  sourceId,
  buttonText,
  redirectUrl,
  messageId,
  contactId,
  contactPhone,
  sessionId,
  threadId,
}) {
  const query = new URLSearchParams({
    src: sourceType,
    id: sourceId,
    btn: buttonText,
    to: redirectUrl, // no need to double encode
    type: buttonText,
    msg: messageId || "",
    contact: contactId || "",
    phone: contactPhone || "",
    session: sessionId || "",
    thread: threadId || "",
  });

  return `${BASE_URL}/api/tracking/redirect?${query.toString()}`;
}
