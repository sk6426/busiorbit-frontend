import React from "react";

export default function PhoneWhatsAppPreview({
  businessName = "Your Business",
  templateBody = "",
  parameters = [],
  imageUrl = "",
  buttonParams = [],
  width = 380,
}) {
  const widthStyle = typeof width === "number" ? `${width}px` : String(width);

  const renderedBody = (templateBody || "").replace(/{{(\d+)}}/g, (_, i) => {
    const v = parameters[Number(i) - 1] ?? "";
    return v !== "" ? v : `{{${i}}}`;
  });

  return (
    <div
      style={{ width: widthStyle }}
      className="mx-auto rounded-xl shadow bg-[#ece5dd] p-4"
    >
      <div className="bg-[#efeae2] rounded-xl shadow-inner overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#075e54] text-white text-sm">
          <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center font-bold">
            {businessName?.charAt(0)?.toUpperCase() || "Y"}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-medium">{businessName}</span>
            <span className="text-[11px] text-gray-200">online</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          {imageUrl && (
            <img
              src={imageUrl}
              alt="header"
              className="rounded-t-xl mb-1 max-h-40 w-full object-cover"
            />
          )}

          {/* Message bubble */}
          <div
            className={[
              "px-3 py-2 shadow-sm text-[13.5px] text-gray-800 bg-white",
              "whitespace-pre-wrap leading-[1.45]",
              "rounded-xl rounded-tl-none",
              buttonParams?.length > 0 ? "rounded-b-none" : "",
            ].join(" ")}
          >
            {renderedBody}
            <div className="mt-1 text-right text-[10px] text-gray-400">
              09:45
            </div>
          </div>

          {/* Divider + Buttons */}
          {Array.isArray(buttonParams) && buttonParams.length > 0 && (
            <div className="border border-t border-gray-200 bg-white rounded-b-xl overflow-hidden">
              {buttonParams.map((b, idx) => (
                <div
                  key={idx}
                  className={[
                    "flex items-center justify-center gap-2",
                    "px-4 py-2.5 text-[13.5px] font-medium",
                    "text-[#34B7F1] hover:bg-gray-50",
                    idx > 0 ? "border-t border-gray-200" : "",
                    "select-none",
                  ].join(" ")}
                >
                  <svg
                    className="h-[14px] w-[14px] text-[#34B7F1] -translate-y-[1px]"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M10 17l5-5-5-5v10z" />
                  </svg>
                  <span className="leading-none">{b?.text || "Button"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// import React from "react";

// export default function PhoneWhatsAppPreview({
//   businessName = "Your Business",
//   templateBody = "",
//   parameters = [],
//   imageUrl = "",
//   buttonParams = [],
//   /** Width can be number (px) or CSS length (e.g. 'clamp(320px, 38vw, 400px)') */
//   width = 380,
// }) {
//   const widthStyle = typeof width === "number" ? `${width}px` : String(width);

//   // render {{1}}, {{2}} ... safely (leave unknown tokens visible)
//   const renderedBody = (templateBody || "").replace(/{{(\d+)}}/g, (_, i) => {
//     const v = parameters[Number(i) - 1] ?? "";
//     return v !== "" ? v : `{{${i}}}`;
//   });

//   return (
//     <div
//       style={{ width: widthStyle }}
//       className="mx-auto rounded-xl shadow bg-[#ece5dd] p-4"
//     >
//       {/* Phone surface */}
//       <div className="bg-[#efeae2] rounded-xl shadow-inner overflow-hidden">
//         {/* Header */}
//         <div className="flex items-center gap-2 px-3 py-2 bg-[#075e54] text-white text-sm">
//           <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center font-bold">
//             {businessName?.charAt(0)?.toUpperCase() || "Y"}
//           </div>
//           <div className="flex flex-col leading-tight">
//             <span className="font-medium">{businessName}</span>
//             <span className="text-[11px] text-gray-200">online</span>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="p-3">
//           {imageUrl && (
//             <img
//               src={imageUrl}
//               alt="header"
//               className="rounded-t-xl mb-1 max-h-40 w-full object-cover"
//             />
//           )}

//           {/* Message bubble (flat bottom if buttons exist) */}
//           <div
//             className={[
//               "px-3 py-2 shadow-sm text-[13.5px] text-gray-800 bg-white",
//               "whitespace-pre-wrap leading-[1.45]",
//               "rounded-xl rounded-tl-none",
//               buttonParams?.length > 0 ? "rounded-b-none" : "",
//             ].join(" ")}
//           >
//             {renderedBody}
//             <div className="mt-1 text-right text-[10px] text-gray-400">
//               09:45
//             </div>
//           </div>

//           {/* Buttons with WhatsApp-ish separators + centered icon/label */}
//           {Array.isArray(buttonParams) && buttonParams.length > 0 && (
//             <div className="border border-t-0 border-gray-200 bg-white rounded-b-xl overflow-hidden">
//               {buttonParams.map((b, idx) => (
//                 <div
//                   key={idx}
//                   className={[
//                     "flex items-center justify-center gap-2",
//                     "px-4 py-2.5 text-[13.5px] font-medium",
//                     "text-[#34B7F1] hover:bg-gray-50",
//                     "border-t border-gray-200 first:border-t-0",
//                     "select-none",
//                   ].join(" ")}
//                 >
//                   <svg
//                     className="h-[14px] w-[14px] text-[#34B7F1] -translate-y-[1px]"
//                     viewBox="0 0 24 24"
//                     fill="currentColor"
//                     aria-hidden="true"
//                   >
//                     <path d="M10 17l5-5-5-5v10z" />
//                   </svg>
//                   <span className="leading-none">{b?.text || "Button"}</span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// import React from "react";

// function PhoneWhatsAppPreview({
//   businessName = "Your Business",
//   templateBody = "",
//   parameters = [],
//   imageUrl = "",
//   buttonParams = [],
// }) {
//   // Replace {{1}}, {{2}}... with params while keeping unknown tokens visible
//   const renderedBody = (templateBody || "").replace(/{{(\d+)}}/g, (_, i) => {
//     const v = parameters[Number(i) - 1] ?? "";
//     return v !== "" ? v : `{{${i}}}`;
//   });

//   return (
//     <div className="w-[380px] mx-auto rounded-xl shadow bg-[#ece5dd] p-4">
//       {/* Phone surface */}
//       <div className="bg-[#efeae2] rounded-xl shadow-inner overflow-hidden">
//         {/* Header */}
//         <div className="flex items-center gap-2 px-3 py-2 bg-[#075e54] text-white text-sm">
//           <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center font-bold">
//             {businessName?.charAt(0)?.toUpperCase() || "Y"}
//           </div>
//           <div className="flex flex-col leading-tight">
//             <span className="font-medium">{businessName}</span>
//             <span className="text-[11px] text-gray-200">online</span>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="p-3">
//           {/* Optional image header */}
//           {imageUrl && (
//             <img
//               src={imageUrl}
//               alt="header"
//               className="rounded-t-xl mb-1 max-h-40 w-full object-cover"
//             />
//           )}

//           {/* Message bubble */}
//           <div
//             className={[
//               "px-3 py-2 shadow-sm text-[13.5px] text-gray-800 bg-white",
//               "whitespace-pre-wrap", // preserves template newlines
//               "leading-[1.45]", // tighter & consistent line-height
//               "rounded-xl rounded-tl-none",
//               buttonParams?.length > 0 ? "rounded-b-none" : "",
//             ].join(" ")}
//           >
//             {renderedBody}
//             <div className="mt-1 text-right text-[10px] text-gray-400">
//               09:45
//             </div>
//           </div>

//           {/* Buttons (WhatsApp-like) */}
//           {Array.isArray(buttonParams) && buttonParams.length > 0 && (
//             <div className="border border-t-0 border-gray-200 bg-white rounded-b-xl overflow-hidden">
//               {buttonParams.map((b, idx) => (
//                 <div
//                   key={idx}
//                   className={[
//                     "flex items-center justify-center gap-2",
//                     "px-4 py-2.5 text-[13.5px] font-medium",
//                     "text-[#34B7F1] hover:bg-gray-50",
//                     "border-t border-gray-200 first:border-t-0",
//                     "select-none",
//                   ].join(" ")}
//                 >
//                   {/* Chevron icon — optically centered */}
//                   <svg
//                     className="h-[14px] w-[14px] text-[#34B7F1] -translate-y-[1px]"
//                     viewBox="0 0 24 24"
//                     fill="currentColor"
//                     aria-hidden="true"
//                   >
//                     <path d="M10 17l5-5-5-5v10z" />
//                   </svg>

//                   {/* Label baseline aligned */}
//                   <span className="leading-none">{b?.text || "Button"}</span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default PhoneWhatsAppPreview;

// import React from "react";

// function PhoneWhatsAppPreview({
//   businessName = "Your Business",
//   templateBody = "",
//   parameters = [],
//   imageUrl = "",
//   buttonParams = [],
// }) {
//   // Replace {{1}}, {{2}}... with params
//   const renderedBody = templateBody.replace(/{{(\d+)}}/g, (_, idx) => {
//     const p = parameters[Number(idx) - 1] || "";
//     return p ? p : `{{${idx}}}`;
//   });

//   return (
//     <div className="w-[360px] mx-auto rounded-xl shadow bg-[#ece5dd] p-4">
//       {/* Phone screen background */}
//       <div className="bg-[#efeae2] rounded-xl shadow-inner overflow-hidden">
//         {/* Header */}
//         <div className="flex items-center gap-2 px-3 py-2 bg-[#075e54] text-white text-sm">
//           <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center font-bold">
//             {businessName.charAt(0).toUpperCase()}
//           </div>
//           <div className="flex flex-col leading-tight">
//             <span className="font-medium">{businessName}</span>
//             <span className="text-[11px] text-gray-200">online</span>
//           </div>
//         </div>

//         <div className="p-3">
//           {/* Image header if any */}
//           {imageUrl && (
//             <img
//               src={imageUrl}
//               alt="header"
//               className="rounded-t-xl mb-1 max-h-40 object-cover"
//             />
//           )}

//           {/* Message bubble */}
//           <div
//             className={`px-3 py-2 shadow-sm text-[13px] leading-relaxed text-gray-800 bg-white
//                         rounded-xl rounded-tl-none
//                         ${buttonParams.length > 0 ? "rounded-b-none" : ""}`}
//           >
//             {renderedBody}
//             <div className="mt-1 text-right text-[10px] text-gray-400">
//               09:45
//             </div>
//           </div>

//           {/* Buttons block */}
//           {buttonParams.length > 0 && (
//             <div className="border border-t-0 border-gray-200 bg-white rounded-b-xl overflow-hidden">
//               {buttonParams.map((b, idx) => (
//                 <div
//                   key={idx}
//                   className="flex items-center justify-center gap-2 px-3 py-2 text-[13px] font-medium text-[#34B7F1]
//                              hover:bg-gray-50 border-t border-gray-200 first:border-t-0"
//                 >
//                   {/* Reply icon */}
//                   <svg
//                     className="h-4 w-4 text-[#34B7F1]"
//                     viewBox="0 0 24 24"
//                     fill="currentColor"
//                   >
//                     <path d="M10 17l5-5-5-5v10z" />
//                   </svg>
//                   <span>{b.text}</span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default PhoneWhatsAppPreview;

// // src/components/PhoneWhatsAppPreview.jsx
// import React, { useMemo } from "react";

// /* ---------------- helpers ---------------- */

// function applyParams(text = "", params = []) {
//   let out = text;
//   params.forEach((val, idx) => {
//     const token = new RegExp(`\\{\\{\\s*${idx + 1}\\s*\\}\\}`, "g");
//     out = out.replace(token, val ?? "");
//   });
//   return out;
// }

// function renderMultiline(text = "") {
//   return text.split("\n").map((line, i) => {
//     if (line.trim() === "") return <br key={`br-${i}`} />;
//     const parts = line.split(/(https?:\/\/[^\s]+)/g);
//     return (
//       <p key={`ln-${i}`} className="whitespace-pre-wrap leading-[1.35]">
//         {parts.map((p, j) =>
//           /^https?:\/\//.test(p) ? (
//             <span key={j} className="text-[#1FA855] underline">
//               {p}
//             </span>
//           ) : (
//             <span key={j}>{p}</span>
//           )
//         )}
//       </p>
//     );
//   });
// }

// function CheckDouble() {
//   return (
//     <svg
//       className="ml-1 inline h-[14px] w-[14px] text-[#34B7F1]"
//       viewBox="0 0 16 15"
//       fill="currentColor"
//     >
//       <path d="M11.5 3.5l-4.8 7.2-2.2-2.5-.9 1.1 3.2 3.7 5.7-8.6-1-.9z" />
//       <path d="M15.1 3.5l-4.8 7.2-.8-1.1 3.9-5.9.9-.2.8 0z" />
//     </svg>
//   );
// }

// const Icon = {
//   chevron: (cls = "") => (
//     <svg viewBox="0 0 24 24" className={cls} fill="currentColor">
//       <path d="M10 17l5-5-5-5v10z" />
//     </svg>
//   ),
//   link: (cls = "") => (
//     <svg viewBox="0 0 24 24" className={cls} fill="currentColor">
//       <path d="M3.9 12a5 5 0 015-5h3v2h-3a3 3 0 000 6h3v2h-3a5 5 0 01-5-5zm7-1h2v2h-2v-2zm4.1-4h-3v2h3a3 3 0 010 6h-3v2h3a5 5 0 000-10z" />
//     </svg>
//   ),
//   phone: (cls = "") => (
//     <svg viewBox="0 0 24 24" className={cls} fill="currentColor">
//       <path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011.1-.2c1.2.5 2.6.8 4 .8a1 1 0 011 1v3.5a1 1 0 01-1 1A18.5 18.5 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.4.3 2.8.8 4a1 1 0 01-.2 1.1l-2.5 2.7z" />
//     </svg>
//   ),
//   coupon: (cls = "") => (
//     <svg viewBox="0 0 24 24" className={cls} fill="currentColor">
//       <path d="M3 6h18v4a2 2 0 010 4v4H3v-4a2 2 0 010-4V6zm6 2v8h2V8H9zm4 0v8h2V8h-2z" />
//     </svg>
//   ),
//   flow: (cls = "") => (
//     <svg viewBox="0 0 24 24" className={cls} fill="currentColor">
//       <path d="M7 4h10v4H7V4zm0 6h4v4H7v-4zm6 0h4v10h-4V10zM7 16h4v4H7v-4z" />
//     </svg>
//   ),
// };

// /* --------------- component --------------- */

// export default function PhoneWhatsAppPreview({
//   businessName = "Your Business",
//   templateBody = "",
//   parameters = [],
//   imageUrl = "",
//   buttonParams = [],
//   wallpaperUrl = "/wa_wallpaper.png", // put WhatsApp wallpaper into /public/wa_wallpaper.png
//   buttonStyle = "pills", // 'pills' | 'list'
// }) {
//   const finalText = useMemo(
//     () => applyParams(templateBody, parameters),
//     [templateBody, parameters]
//   );

//   const buttons = (buttonParams || []).map(b => ({
//     text: b?.text || "Button",
//     value: b?.value || "",
//     subType: (b?.subType || "").toLowerCase(), // url|phone_number|flow|copy_code|quick_reply…
//   }));

//   const iconFor = subType => {
//     switch (subType) {
//       case "url":
//         return Icon.link("h-3.5 w-3.5");
//       case "phone_number":
//       case "voice_call":
//         return Icon.phone("h-3.5 w-3.5");
//       case "copy_code":
//         return Icon.coupon("h-3.5 w-3.5");
//       case "flow":
//         return Icon.flow("h-3.5 w-3.5");
//       default:
//         return Icon.chevron("h-3.5 w-3.5");
//     }
//   };

//   return (
//     <div className="mx-auto max-w-[320px] rounded-3xl bg-white p-3 shadow-lg ring-1 ring-black/5">
//       {/* Notch */}
//       <div className="mx-auto mb-2 h-1.5 w-24 rounded-full bg-gray-200" />

//       {/* Chat body */}
//       <div className="rounded-2xl bg-[#ECE5DD] p-2">
//         {/* Header */}
//         <div className="flex items-center gap-2 rounded-xl bg-white/40 p-2">
//           <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-xs font-semibold text-white">
//             {businessName?.slice(0, 2)?.toUpperCase() || "B"}
//           </div>
//           <div className="flex-1">
//             <div className="text-[13px] font-semibold text-[#111827]">
//               {businessName}
//             </div>
//             <div className="text-[10px] text-[#6B7280]">online</div>
//           </div>
//           <div className="h-2 w-2 rounded-full bg-[#34D399]" />
//         </div>

//         {/* Conversation – uses your wallpaper */}
//         <div
//           className="mt-2 space-y-2 rounded-xl p-2"
//           style={{
//             backgroundImage: `url('${wallpaperUrl}')`,
//             backgroundSize: "cover",
//             backgroundRepeat: "repeat",
//             backgroundPosition: "center",
//           }}
//         >
//           {/* Business message */}
//           <div className="flex justify-start">
//             <div className="max-w-[88%]">
//               {/* Image header */}
//               {imageUrl ? (
//                 <div className="mb-1 overflow-hidden rounded-t-xl">
//                   <img
//                     src={imageUrl}
//                     alt="header"
//                     className="h-40 w-full object-cover"
//                   />
//                 </div>
//               ) : null}

//               <div
//                 className={[
//                   "rounded-xl bg-white px-3 py-2 text-[13px] leading-[1.35] text-[#111827]",
//                   imageUrl ? "rounded-t-none rounded-b-xl" : "rounded-xl",
//                 ].join(" ")}
//               >
//                 {renderMultiline(finalText)}
//               </div>

//               <div className="mt-1 flex items-center text-[10px] text-[#6B7280]">
//                 10:24 <CheckDouble />
//               </div>

//               {/* Buttons */}
//               {buttons.length > 0 && (
//                 <>
//                   {buttonStyle === "list" ? (
//                     // WhatsApp HSM rows variant
//                     <div className="mt-1 overflow-hidden rounded-b-xl border border-t-0 border-white/70 bg-white/90">
//                       {buttons.map((b, idx) => {
//                         const isQR = b.subType === "quick_reply";
//                         return (
//                           <div
//                             key={idx}
//                             className="flex items-center gap-2 border-t border-gray-100 px-3 py-2 text-[13px] hover:bg-gray-50"
//                           >
//                             {iconFor(b.subType)}
//                             <div className="min-w-0">
//                               <div className="truncate font-medium text-[#0F172A]">
//                                 {b.text}
//                               </div>
//                               {b.value ? (
//                                 <div className="truncate text-[11px] text-[#6B7280]">
//                                   {b.value}
//                                 </div>
//                               ) : null}
//                             </div>
//                             {isQR && (
//                               <span className="ml-auto text-[11px] text-[#25D366]">
//                                 Quick reply
//                               </span>
//                             )}
//                           </div>
//                         );
//                       })}
//                     </div>
//                   ) : (
//                     // Pills (closer to WhatsApp quick-replies)
//                     <div className="mt-2 flex flex-wrap gap-2">
//                       {buttons.map((b, idx) => {
//                         const isQR = b.subType === "quick_reply";
//                         return (
//                           <div
//                             key={idx}
//                             className={[
//                               "inline-flex max-w-full items-center gap-1 rounded-full px-3 py-1.5 text-[12px]",
//                               "border transition",
//                               isQR
//                                 ? "border-[#25D366] text-[#128C7E] bg-white"
//                                 : "border-gray-300 text-[#0F172A] bg-white",
//                               "hover:bg-gray-50 active:scale-[0.99]",
//                               "shadow-sm",
//                             ].join(" ")}
//                             title={b.value || ""}
//                           >
//                             {iconFor(b.subType)}
//                             <span className="truncate">{b.text}</span>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>

//           {/* small user reply for balance */}
//           <div className="flex justify-end">
//             <div className="rounded-xl bg-[#DCF8C6] px-3 py-1.5 text-[12px] text-[#0F172A] shadow-sm">
//               👍
//               <span className="ml-2 align-middle text-[10px] text-[#6B7280]">
//                 10:25
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Footer bar */}
//       <div className="mt-2 rounded-xl bg-gray-100 p-2 text-center text-[10px] text-gray-400">
//         Template Preview
//       </div>
//     </div>
//   );
// }

// // src/components/PhoneWhatsAppPreview.jsx
// import React, { useMemo } from "react";

// /**
//  * Tiny helper: replace {{1}}, {{2}} … with provided parameter values.
//  */
// function applyParams(text = "", params = []) {
//   let out = text;
//   params.forEach((val, idx) => {
//     const token = new RegExp(`\\{\\{\\s*${idx + 1}\\s*\\}\\}`, "g");
//     out = out.replace(token, val ?? "");
//   });
//   return out;
// }

// /**
//  * Tiny helper: split lines and keep empty rows as <br/>, linkify basic URLs.
//  */
// function renderMultiline(text = "") {
//   return text.split("\n").map((line, i) => {
//     if (line.trim() === "") return <br key={`br-${i}`} />;
//     // Very light linkify (http/https)
//     const parts = line.split(/(https?:\/\/[^\s]+)/g);
//     return (
//       <p key={`ln-${i}`} className="whitespace-pre-wrap leading-[1.3]">
//         {parts.map((p, j) =>
//           /^https?:\/\//.test(p) ? (
//             <span key={j} className="text-[#1FA855] underline">
//               {p}
//             </span>
//           ) : (
//             <span key={j}>{p}</span>
//           )
//         )}
//       </p>
//     );
//   });
// }

// function CheckDouble() {
//   return (
//     <svg
//       className="ml-1 inline h-[14px] w-[14px] text-[#34B7F1]"
//       viewBox="0 0 16 15"
//       fill="currentColor"
//     >
//       <path d="M11.5 3.5l-4.8 7.2-2.2-2.5-.9 1.1 3.2 3.7 5.7-8.6-1-.9z" />
//       <path d="M15.1 3.5l-4.8 7.2-.8-1.1 3.9-5.9.9-.2.8 0z" />
//     </svg>
//   );
// }

// /**
//  * WhatsApp-like phone preview
//  */
// export default function PhoneWhatsAppPreview({
//   businessName = "Your Business",
//   templateBody = "",
//   parameters = [],
//   imageUrl = "",
//   buttonParams = [],
// }) {
//   const finalText = useMemo(
//     () => applyParams(templateBody, parameters),
//     [templateBody, parameters]
//   );

//   // “Buttons” to show under the message bubble. If value exists for dynamic ones,
//   // we show it on a 2nd line in subtle style (helps QA).
//   const buttons = buttonParams?.map(b => ({
//     text: b?.text || "Button",
//     value: b?.value || "",
//     subType: (b?.subType || "").toLowerCase(), // url | flow | copy_code | quick_reply | phone_number | …
//   }));

//   return (
//     <div className="mx-auto max-w-[320px] rounded-3xl bg-white p-3 shadow-lg ring-1 ring-black/5">
//       {/* Phone top bar + notch */}
//       <div className="mx-auto mb-2 h-1.5 w-24 rounded-full bg-gray-200" />
//       <div className="rounded-2xl bg-[#ECE5DD] p-2">
//         {/* Chat header */}
//         <div className="flex items-center gap-2 rounded-xl bg-white/40 p-2">
//           <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-xs font-semibold text-white">
//             {businessName?.slice(0, 2)?.toUpperCase() || "B"}
//           </div>
//           <div className="flex-1">
//             <div className="text-[13px] font-semibold text-[#111827]">
//               {businessName}
//             </div>
//             <div className="text-[10px] text-[#6B7280]">online</div>
//           </div>
//           <div className="h-2 w-2 rounded-full bg-[#34D399]" />
//         </div>

//         {/* Conversation area */}
//         <div className="mt-2 space-y-2 rounded-xl bg-[url('https://i.imgur.com/mrO4ZrM.png')] bg-[length:360px] p-2">
//           {/* Message from Business */}
//           <div className="flex justify-start">
//             <div className="max-w-[88%]">
//               {/* Optional image header */}
//               {imageUrl ? (
//                 <div className="mb-1 overflow-hidden rounded-t-xl">

//                   <img
//                     src={imageUrl}
//                     alt="header"
//                     className="h-40 w-full object-cover"
//                   />
//                 </div>
//               ) : null}

//               {/* Bubble */}
//               <div
//                 className={[
//                   "rounded-xl bg-white px-3 py-2 text-[13px] leading-[1.35] text-[#111827]",
//                   imageUrl ? "rounded-t-none rounded-b-xl" : "rounded-xl",
//                 ].join(" ")}
//               >
//                 {renderMultiline(finalText)}
//               </div>

//               {/* Timestamp + ticks */}
//               <div className="mt-1 flex items-center text-[10px] text-[#6B7280]">
//                 10:24 <CheckDouble />
//               </div>

//               {/* Buttons (WhatsApp HSM) */}
//               {buttons?.length > 0 && (
//                 <div className="mt-1 overflow-hidden rounded-b-xl border border-t-0 border-white/70 bg-white/90">
//                   {buttons.map((b, idx) => {
//                     const isQuickReply = b.subType === "quick_reply";
//                     return (
//                       <div
//                         key={idx}
//                         className="flex items-center gap-2 border-t border-gray-100 px-3 py-2 text-[13px] hover:bg-gray-50"
//                       >
//                         {/* WhatsApp reply chevron style */}
//                         <svg
//                           viewBox="0 0 24 24"
//                           className={`h-4 w-4 ${
//                             isQuickReply ? "text-[#25D366]" : "text-[#6B7280]"
//                           }`}
//                           fill="currentColor"
//                         >
//                           <path d="M10 17l5-5-5-5v10z" />
//                         </svg>

//                         <div className="min-w-0">
//                           <div className="truncate font-medium text-[#0F172A]">
//                             {b.text}
//                           </div>
//                           {b.value ? (
//                             <div className="truncate text-[11px] text-[#6B7280]">
//                               {b.value}
//                             </div>
//                           ) : null}
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* A tiny user reply bubble to balance the view (optional, decorative) */}
//           <div className="flex justify-end">
//             <div className="rounded-xl bg-[#DCF8C6] px-3 py-1.5 text-[12px] text-[#0F172A] shadow-sm">
//               👍
//               <span className="ml-2 align-middle text-[10px] text-[#6B7280]">
//                 10:25
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Footer bar */}
//       <div className="mt-2 rounded-xl bg-gray-100 p-2 text-center text-[10px] text-gray-400">
//         Template Preview
//       </div>
//     </div>
//   );
// }

// import React from "react";

// /**
//  * Phone-looking WhatsApp bubble preview.
//  * Props:
//  * - businessName: string
//  * - templateBody: string (WhatsApp template body with {{1}}, {{2}}…)
//  * - parameters: string[] (values for {{1}}, {{2}}…)
//  * - imageUrl?: string
//  * - buttonParams?: { text: string, value?: string }[]
//  */
// export default function PhoneWhatsAppPreview({
//   businessName = "Your Business",
//   templateBody = "",
//   parameters = [],
//   imageUrl = "",
//   buttonParams = [],
// }) {
//   const renderText = () =>
//     templateBody.replace(/\{\{(\d+)\}\}/g, (_, n) => {
//       const i = parseInt(n, 10) - 1;
//       return parameters?.[i] ?? `{{${n}}}`;
//     });

//   return (
//     <div className="w-full">
//       <div className="mx-auto max-w-sm rounded-3xl border bg-[#f8f7f4] p-4">
//         {/* phone top bar */}
//         <div className="mx-auto mb-3 h-1.5 w-24 rounded bg-gray-300" />
//         <div className="rounded-2xl bg-[#e5ddd5] p-4">
//           {/* contact header */}
//           <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
//             <div className="h-8 w-8 rounded-full bg-green-500" />
//             <div className="font-semibold text-gray-700">{businessName}</div>
//           </div>

//           {/* message bubble */}
//           <div className="rounded-2xl rounded-bl-sm bg-white p-4 shadow-sm">
//             {imageUrl ? (
//               <div className="mb-3 overflow-hidden rounded-lg">

//                 <img
//                   src={imageUrl}
//                   alt="header"
//                   className="h-40 w-full object-cover"
//                 />
//               </div>
//             ) : null}

//             <div className="whitespace-pre-wrap text-[15px] leading-6 text-gray-900">
//               {renderText()}
//             </div>

//             {buttonParams?.length ? (
//               <div className="mt-3 divide-y rounded-lg border bg-white">
//                 {buttonParams.map((b, i) => (
//                   <div
//                     key={i}
//                     className="flex items-center justify-between px-3 py-2 text-[15px]"
//                   >
//                     <span className="text-green-600">↩</span>
//                     <div className="ml-2 flex-1 truncate px-2">
//                       <div className="truncate font-medium text-gray-800">
//                         {b?.text || "Button"}
//                       </div>
//                       {b?.value ? (
//                         <div className="truncate text-xs text-gray-500">
//                           {b.value}
//                         </div>
//                       ) : null}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : null}
//           </div>
//         </div>

//         <div className="mt-2 text-center text-xs text-gray-400">
//           Template Preview
//         </div>
//       </div>
//     </div>
//   );
// }
