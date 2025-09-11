// 📄 src/components/previews/PhoneWhatsPreviewAdapter.jsx
import React from "react";

// ⬇️ Try your canonical import first; adjust path/name if yours differs:
import PhoneWhatsPreview from "../PhoneWhatsPreview";
// If your file/export is named differently, you can use one of these instead:
// import PhoneWhatsPreview from "../phoneWhatsPerview";
// import { PhoneWhatsPreview as PhoneWhatsPerview } from "../phoneWhatsPerview";

/**
 * Adapter to keep our normalized props stable while supporting the
 * PhoneWhatsPreview's expected prop names (if they differ).
 *
 * Expected normalized props:
 * - messageType: 'template' | 'image_template' | 'text'
 * - headerType: 'image' | 'none'
 * - headerImageUrl: string
 * - caption: string
 * - body: string
 * - footer: string
 * - buttons: array of { buttonText, buttonType, targetUrl } or similar
 */
export default function PhoneWhatsPreviewAdapter(props) {
  const {
    messageType,
    headerType,
    headerImageUrl,
    caption,
    body,
    footer,
    buttons,
  } = props;

  // Map to the names many phone preview components commonly use.
  // If your PhoneWhatsPreview already accepts the normalized names,
  // these pass-throughs are harmless.
  const mappedProps = {
    // Common core
    messageType,
    headerType,
    headerImageUrl,
    caption,
    body,
    footer,
    buttons,

    // Extra compatibility fields some variants expect:
    mediaUrl: headerImageUrl,
    templateBody: body,
    templateFooter: footer,
    ctaButtons: buttons,
    messageBody: body,
  };

  return <PhoneWhatsPreview {...mappedProps} />;
}
