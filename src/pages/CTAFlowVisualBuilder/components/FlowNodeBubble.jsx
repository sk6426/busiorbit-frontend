import React, { useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import { X, MessageSquare } from "lucide-react";

export default function FlowNodeBubble({
  id,
  data,
  onDelete,
  readonly,
  onDataChange,
  visualDebug = false, // not rendered
}) {
  const {
    templateName,
    messageBody,
    buttons = [],
    requiredTag,
    requiredSource,
    isUnreachable,
  } = data;

  // Keep trigger info in sync with first button
  useEffect(() => {
    if (buttons.length > 0 && onDataChange) {
      const triggerText = buttons[0]?.text || "";
      onDataChange({
        ...data,
        triggerButtonText: triggerText,
        triggerButtonType: "cta",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buttons]);

  return (
    <div className="bg-white shadow-md rounded-xl border border-purple-200 w-72 p-4 relative">
      {/* ❌ Delete */}
      {!readonly && (
        <button
          onClick={() => onDelete(id)}
          className="absolute top-1.5 right-1.5 text-red-500 hover:text-red-700"
          title="Delete this step"
          aria-label="Delete step"
        >
          <X size={16} />
        </button>
      )}

      {/* ⚠️ Warning */}
      {isUnreachable && (
        <div
          className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full font-semibold mb-2 inline-block"
          title="This step has no incoming trigger. It may never run."
        >
          ⚠️ Unreachable Step
        </div>
      )}

      {/* Header — minimal (icon + name) with divider */}
      <div className="mb-2">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
          <MessageSquare
            size={16}
            className="text-purple-600 shrink-0"
            aria-hidden
          />
          <div
            className="min-w-0 truncate text-sm font-medium text-gray-900"
            title={templateName || "Untitled Step"}
          >
            {templateName || "Untitled Step"}
          </div>
        </div>
      </div>

      {/* 💬 Body — scrollable to avoid crowding */}
      <div
        className="text-sm text-gray-700 whitespace-pre-wrap mb-3 overflow-y-auto"
        style={{
          maxHeight: 180, // control the vertical footprint
          overscrollBehavior: "contain",
          scrollbarWidth: "thin", // Firefox
          WebkitOverflowScrolling: "touch", // iOS momentum
        }}
        title={messageBody}
      >
        💬 {messageBody || "Message body preview..."}
      </div>

      {/* 🎯 Badges */}
      <div className="flex flex-wrap gap-2 mb-2">
        {!!requiredTag && (
          <span
            className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full font-semibold"
            title={`Only contacts with tag "${requiredTag}" will receive this step.`}
          >
            🎯 Tag: {requiredTag}
          </span>
        )}
        {!!requiredSource && (
          <span
            className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-semibold"
            title={`This step runs only if Source = "${requiredSource}"`}
          >
            🔗 Source: {requiredSource}
          </span>
        )}
      </div>

      {/* 🔘 Buttons + source handles (no connection status UI) */}
      <div className="flex flex-col gap-2">
        {buttons.map((btn, index) => {
          const text = (btn.text || "").trim() || `Button ${index + 1}`;
          return (
            <div
              key={`${text}-${index}`}
              className="relative bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded shadow-sm"
              title={text}
            >
              <div className="pr-6 text-center select-none">🔘 {text}</div>

              {/* Right source handle (enlarged hit area) */}
              <Handle
                type="source"
                position={Position.Right}
                id={text} // keep equal to button text for mapping
                title={`Drag to connect: ${text}`}
                aria-label={`Connect from ${text}`}
                style={{
                  background: "#9333ea",
                  right: "-10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 16,
                  height: 16,
                  border: "2px solid #fff",
                  borderRadius: 9999,
                  boxShadow: "0 0 0 2px rgba(147,51,234,0.25)",
                  cursor: "crosshair",
                }}
              />
              {/* Invisible larger hotspot to make grabbing easier */}
              <div
                style={{
                  position: "absolute",
                  right: -18,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 36,
                  height: 28,
                  background: "transparent",
                  pointerEvents: "none",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* 🟣 Fallback source if no buttons */}
      {buttons.length === 0 && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="default"
          title="Drag to connect"
          style={{
            background: "#9333ea",
            width: 16,
            height: 16,
            border: "2px solid #fff",
            borderRadius: 9999,
            boxShadow: "0 0 0 2px rgba(147,51,234,0.25)",
          }}
        />
      )}

      {/* 🔵 Incoming target */}
      <Handle
        type="target"
        position={Position.Top}
        id="incoming"
        title="Drop a connection here"
        style={{
          background: "#9333ea",
          width: 16,
          height: 16,
          border: "2px solid #fff",
          borderRadius: 9999,
          boxShadow: "0 0 0 2px rgba(147,51,234,0.25)",
        }}
      />
    </div>
  );
}

// import React, { useEffect } from "react";
// import { Handle, Position } from "@xyflow/react";
// import { X, MessageSquare } from "lucide-react";

// export default function FlowNodeBubble({
//   id,
//   data,
//   onDelete,
//   readonly,
//   onDataChange,
//   visualDebug = false, // kept for parity; no debug UI rendered
// }) {
//   const {
//     templateName,
//     messageBody,
//     buttons = [],
//     requiredTag,
//     requiredSource,
//     isUnreachable,
//   } = data;

//   // Keep trigger info in sync with first button
//   useEffect(() => {
//     if (buttons.length > 0 && onDataChange) {
//       const triggerText = buttons[0]?.text || "";
//       onDataChange({
//         ...data,
//         triggerButtonText: triggerText,
//         triggerButtonType: "cta",
//       });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [buttons]);

//   return (
//     <div className="bg-white shadow-md rounded-xl border border-purple-200 w-72 p-4 relative">
//       {/* ❌ Delete */}
//       {!readonly && (
//         <button
//           onClick={() => onDelete(id)}
//           className="absolute top-1.5 right-1.5 text-red-500 hover:text-red-700"
//           title="Delete this step"
//           aria-label="Delete step"
//         >
//           <X size={16} />
//         </button>
//       )}

//       {/* ⚠️ Warning */}
//       {isUnreachable && (
//         <div
//           className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full font-semibold mb-2 inline-block"
//           title="This step has no incoming trigger. It may never run."
//         >
//           ⚠️ Unreachable Step
//         </div>
//       )}

//       {/* Header — minimal (icon + name) */}
//       <div className="mb-2 flex items-center gap-2">
//         <MessageSquare
//           size={16}
//           className="text-purple-600 shrink-0"
//           aria-hidden
//         />
//         <div
//           className="min-w-0 truncate text-sm font-medium text-gray-900"
//           title={templateName || "Untitled Step"}
//         >
//           {templateName || "Untitled Step"}
//         </div>
//       </div>

//       {/* 💬 Body */}
//       <div
//         className="text-sm text-gray-700 whitespace-pre-wrap mb-3"
//         style={{ maxHeight: 140, overflow: "auto" }}
//         title={messageBody}
//       >
//         💬 {messageBody || "Message body preview..."}
//       </div>

//       {/* 🎯 Badges */}
//       <div className="flex flex-wrap gap-2 mb-2">
//         {!!requiredTag && (
//           <span
//             className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full font-semibold"
//             title={`Only contacts with tag "${requiredTag}" will receive this step.`}
//           >
//             🎯 Tag: {requiredTag}
//           </span>
//         )}
//         {!!requiredSource && (
//           <span
//             className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-semibold"
//             title={`This step runs only if Source = "${requiredSource}"`}
//           >
//             🔗 Source: {requiredSource}
//           </span>
//         )}
//       </div>

//       {/* 🔘 Buttons + source handles (no connection status UI) */}
//       <div className="flex flex-col gap-2">
//         {buttons.map((btn, index) => {
//           const text = (btn.text || "").trim() || `Button ${index + 1}`;
//           return (
//             <div
//               key={`${text}-${index}`}
//               className="relative bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded shadow-sm"
//               title={text}
//             >
//               <div className="pr-6 text-center select-none">🔘 {text}</div>

//               {/* Right source handle (enlarged hit area) */}
//               <Handle
//                 type="source"
//                 position={Position.Right}
//                 id={text} // keep equal to button text for mapping
//                 title={`Drag to connect: ${text}`}
//                 aria-label={`Connect from ${text}`}
//                 style={{
//                   background: "#9333ea",
//                   right: "-10px",
//                   top: "50%",
//                   transform: "translateY(-50%)",
//                   width: 16,
//                   height: 16,
//                   border: "2px solid #fff",
//                   borderRadius: 9999,
//                   boxShadow: "0 0 0 2px rgba(147,51,234,0.25)",
//                   cursor: "crosshair",
//                 }}
//               />
//               {/* Invisible larger hotspot to make grabbing easier */}
//               <div
//                 style={{
//                   position: "absolute",
//                   right: -18,
//                   top: "50%",
//                   transform: "translateY(-50%)",
//                   width: 36,
//                   height: 28,
//                   background: "transparent",
//                   pointerEvents: "none",
//                 }}
//               />
//             </div>
//           );
//         })}
//       </div>

//       {/* 🟣 Fallback source if no buttons */}
//       {buttons.length === 0 && (
//         <Handle
//           type="source"
//           position={Position.Bottom}
//           id="default"
//           title="Drag to connect"
//           style={{
//             background: "#9333ea",
//             width: 16,
//             height: 16,
//             border: "2px solid #fff",
//             borderRadius: 9999,
//             boxShadow: "0 0 0 2px rgba(147,51,234,0.25)",
//           }}
//         />
//       )}

//       {/* 🔵 Incoming target */}
//       <Handle
//         type="target"
//         position={Position.Top}
//         id="incoming"
//         title="Drop a connection here"
//         style={{
//           background: "#9333ea",
//           width: 16,
//           height: 16,
//           border: "2px solid #fff",
//           borderRadius: 9999,
//           boxShadow: "0 0 0 2px rgba(147,51,234,0.25)",
//         }}
//       />
//     </div>
//   );
// }

// import React, { useEffect } from "react";
// import { Handle, Position } from "@xyflow/react";
// import { X } from "lucide-react";

// export default function FlowNodeBubble({
//   id,
//   data,
//   onDelete,
//   readonly,
//   onDataChange,
//   visualDebug = false, // kept for API parity; no debug UI rendered
// }) {
//   const {
//     templateName,
//     messageBody,
//     buttons = [],
//     requiredTag,
//     requiredSource,
//     isUnreachable,
//   } = data;

//   // Keep trigger info in sync with first button
//   useEffect(() => {
//     if (buttons.length > 0 && onDataChange) {
//       const triggerText = buttons[0]?.text || "";
//       onDataChange({
//         ...data,
//         triggerButtonText: triggerText,
//         triggerButtonType: "cta",
//       });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [buttons]);

//   return (
//     <div className="bg-white shadow-md rounded-xl border border-purple-200 w-72 p-4 relative">
//       {/* ❌ Delete */}
//       {!readonly && (
//         <button
//           onClick={() => onDelete(id)}
//           className="absolute top-1.5 right-1.5 text-red-500 hover:text-red-700"
//           title="Delete this step"
//           aria-label="Delete step"
//         >
//           <X size={16} />
//         </button>
//       )}

//       {/* ⚠️ Warning */}
//       {isUnreachable && (
//         <div
//           className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full font-semibold mb-2 inline-block"
//           title="This step has no incoming trigger. It may never run."
//         >
//           ⚠️ Unreachable Step
//         </div>
//       )}

//       {/* 🧾 Header */}
//       {/* <div className="font-bold text-purple-700 mb-2">
//         📦 {templateName || "Untitled Step"}
//       </div> */}
//       {/* Header (clean title bar) */}
//       <div className="mb-3 -mt-1">
//         <div className="flex items-center gap-2 rounded-lg border border-purple-100 bg-gradient-to-r from-purple-50 to-white px-2.5 py-1.5">
//           {/* icon badge */}
//           <div
//             className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-purple-100 text-purple-700 ring-1 ring-purple-200"
//             aria-hidden
//           >
//             {/* tiny message bubble icon (emoji keeps bundle light) */}
//             <span className="text-[12px]">💬</span>
//           </div>

//           {/* name (truncated with tooltip) */}
//           <div
//             className="min-w-0 text-sm font-semibold text-gray-900 truncate"
//             title={templateName || "Untitled Step"}
//           >
//             {templateName || "Untitled Step"}
//           </div>
//         </div>
//       </div>

//       {/* 💬 Body (soft clamp to keep node height stable) */}
//       <div
//         className="text-sm text-gray-700 whitespace-pre-wrap mb-3"
//         style={{ maxHeight: 140, overflow: "auto" }}
//         title={messageBody}
//       >
//         💬 {messageBody || "Message body preview..."}
//       </div>

//       {/* 🎯 Badges */}
//       <div className="flex flex-wrap gap-2 mb-2">
//         {!!requiredTag && (
//           <span
//             className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full font-semibold"
//             title={`Only contacts with tag "${requiredTag}" will receive this step.`}
//           >
//             🎯 Tag: {requiredTag}
//           </span>
//         )}
//         {!!requiredSource && (
//           <span
//             className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-semibold"
//             title={`This step runs only if Source = "${requiredSource}"`}
//           >
//             🔗 Source: {requiredSource}
//           </span>
//         )}
//       </div>

//       {/* 🔘 Buttons + BIGGER source handles (no connection status UI) */}
//       <div className="flex flex-col gap-2">
//         {buttons.map((btn, index) => {
//           const text = (btn.text || "").trim() || `Button ${index + 1}`;

//           return (
//             <div
//               key={`${text}-${index}`}
//               className="relative bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded shadow-sm"
//               title={text}
//             >
//               <div className="pr-6 text-center select-none">🔘 {text}</div>

//               {/* Right source handle (enlarged hit area) */}
//               <Handle
//                 type="source"
//                 position={Position.Right}
//                 id={text} // keep equal to button text for your mapping
//                 title={`Drag to connect: ${text}`}
//                 aria-label={`Connect from ${text}`}
//                 style={{
//                   background: "#9333ea",
//                   right: "-10px",
//                   top: "50%",
//                   transform: "translateY(-50%)",
//                   width: 16,
//                   height: 16,
//                   border: "2px solid #fff",
//                   borderRadius: 9999,
//                   boxShadow: "0 0 0 2px rgba(147,51,234,0.25)",
//                   cursor: "crosshair",
//                 }}
//               />
//               {/* Invisible larger hotspot to make grabbing easier */}
//               <div
//                 style={{
//                   position: "absolute",
//                   right: -18,
//                   top: "50%",
//                   transform: "translateY(-50%)",
//                   width: 36,
//                   height: 28,
//                   background: "transparent",
//                   pointerEvents: "none",
//                 }}
//               />
//             </div>
//           );
//         })}
//       </div>

//       {/* 🟣 Fallback source if no buttons */}
//       {buttons.length === 0 && (
//         <Handle
//           type="source"
//           position={Position.Bottom}
//           id="default"
//           title="Drag to connect"
//           style={{
//             background: "#9333ea",
//             width: 16,
//             height: 16,
//             border: "2px solid #fff",
//             borderRadius: 9999,
//             boxShadow: "0 0 0 2px rgba(147,51,234,0.25)",
//           }}
//         />
//       )}

//       {/* 🔵 Incoming target (bigger & centered) */}
//       <Handle
//         type="target"
//         position={Position.Top}
//         id="incoming"
//         title="Drop a connection here"
//         style={{
//           background: "#9333ea",
//           width: 16,
//           height: 16,
//           border: "2px solid #fff",
//           borderRadius: 9999,
//           boxShadow: "0 0 0 2px rgba(147,51,234,0.25)",
//         }}
//       />
//     </div>
//   );
// }

// import React, { useEffect } from "react";
// import { Handle, Position } from "@xyflow/react";
// import { X } from "lucide-react";

// export default function FlowNodeBubble({
//   id,
//   data,
//   onDelete,
//   readonly,
//   onDataChange,
//   visualDebug = false,
// }) {
//   const {
//     templateName,
//     messageBody,
//     buttons = [],
//     requiredTag,
//     requiredSource,
//     isUnreachable,
//   } = data;

//   // Keep trigger info in sync with first button (as you had)
//   useEffect(() => {
//     if (buttons.length > 0 && onDataChange) {
//       const triggerText = buttons[0]?.text || "";
//       onDataChange({
//         ...data,
//         triggerButtonText: triggerText,
//         triggerButtonType: "cta",
//       });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [buttons]);

//   return (
//     <div className="bg-white shadow-md rounded-xl border border-purple-200 w-72 p-4 relative">
//       {/* ❌ Delete */}
//       {!readonly && (
//         <button
//           onClick={() => onDelete(id)}
//           className="absolute top-1.5 right-1.5 text-red-500 hover:text-red-700"
//           title="Delete this step"
//           aria-label="Delete step"
//         >
//           <X size={16} />
//         </button>
//       )}

//       {/* ⚠️ Warning */}
//       {isUnreachable && (
//         <div
//           className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full font-semibold mb-2 inline-block"
//           title="This step has no incoming trigger. It may never run."
//         >
//           ⚠️ Unreachable Step
//         </div>
//       )}

//       {/* 🧾 Header */}
//       <div className="font-bold text-purple-700 mb-2">
//         📦 {templateName || "Untitled Step"}
//       </div>

//       {/* 💬 Body (soft clamp to keep node height stable) */}
//       <div
//         className="text-sm text-gray-700 whitespace-pre-wrap mb-3"
//         style={{ maxHeight: 140, overflow: "auto" }}
//         title={messageBody}
//       >
//         💬 {messageBody || "Message body preview..."}
//       </div>

//       {/* 🎯 Badges */}
//       <div className="flex flex-wrap gap-2 mb-2">
//         {!!requiredTag && (
//           <span
//             className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full font-semibold"
//             title={`Only contacts with tag "${requiredTag}" will receive this step.`}
//           >
//             🎯 Tag: {requiredTag}
//           </span>
//         )}
//         {!!requiredSource && (
//           <span
//             className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-semibold"
//             title={`This step runs only if Source = "${requiredSource}"`}
//           >
//             🔗 Source: {requiredSource}
//           </span>
//         )}
//       </div>

//       {/* 🔘 Buttons + BIGGER source handles */}
//       <div className="flex flex-col gap-2">
//         {buttons.map((btn, index) => {
//           const text = (btn.text || "").trim() || `Button ${index + 1}`;
//           const connected = !!btn.targetNodeId;

//           return (
//             <div
//               key={`${text}-${index}`}
//               className="relative bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded shadow-sm"
//               title={text}
//             >
//               <div className="pr-6 text-center select-none">
//                 🔘 {text}
//                 {connected ? (
//                   <span
//                     className="ml-2 inline-flex items-center gap-1 text-[10px] text-green-700"
//                     title={`Connected → ${btn.targetNodeId}`}
//                   >
//                     <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-600" />
//                     connected
//                   </span>
//                 ) : (
//                   <span
//                     className="ml-2 inline-flex items-center gap-1 text-[10px] text-gray-600"
//                     title="Not connected yet"
//                   >
//                     <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400" />
//                     not connected
//                   </span>
//                 )}
//               </div>

//               {/* Right source handle (enlarged hit area) */}
//               <Handle
//                 type="source"
//                 position={Position.Right}
//                 id={text} // keep equal to button text for your mapping
//                 title={`Drag to connect: ${text}`}
//                 aria-label={`Connect from ${text}`}
//                 style={{
//                   background: "#9333ea",
//                   right: "-10px",
//                   top: "50%",
//                   transform: "translateY(-50%)",
//                   width: 16,
//                   height: 16,
//                   border: "2px solid #fff",
//                   borderRadius: 9999,
//                   boxShadow: "0 0 0 2px rgba(147,51,234,0.25)",
//                   cursor: "crosshair",
//                 }}
//               />
//               {/* Invisible larger hotspot to make grabbing easier */}
//               <div
//                 title={`Drag to connect: ${text}`}
//                 style={{
//                   position: "absolute",
//                   right: -18,
//                   top: "50%",
//                   transform: "translateY(-50%)",
//                   width: 36,
//                   height: 28,
//                   // transparent but catches pointer for easier start
//                   background: "transparent",
//                   pointerEvents: "none",
//                 }}
//               />
//             </div>
//           );
//         })}
//       </div>

//       {/* 🟣 Fallback source if no buttons */}
//       {buttons.length === 0 && (
//         <Handle
//           type="source"
//           position={Position.Bottom}
//           id="default"
//           title="Drag to connect"
//           style={{
//             background: "#9333ea",
//             width: 16,
//             height: 16,
//             border: "2px solid #fff",
//             borderRadius: 9999,
//             boxShadow: "0 0 0 2px rgba(147,51,234,0.25)",
//           }}
//         />
//       )}

//       {/* 🔵 Incoming target (bigger & centered) */}
//       <Handle
//         type="target"
//         position={Position.Top}
//         id="incoming"
//         title="Drop a connection here"
//         style={{
//           background: "#9333ea",
//           width: 16,
//           height: 16,
//           border: "2px solid #fff",
//           borderRadius: 9999,
//           boxShadow: "0 0 0 2px rgba(147,51,234,0.25)",
//         }}
//       />

//       {/* 🧪 Debug */}
//       {visualDebug && (
//         <div className="mt-3 text-[10px] text-gray-500">
//           🔗 Connections:
//           <ul className="list-disc ml-4">
//             {buttons.map((btn, i) => (
//               <li key={i}>
//                 {(btn.text || "Unnamed").trim() || `Button ${i + 1}`} →{" "}
//                 <strong>{btn.targetNodeId || "Not Connected"}</strong>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }

// import React, { useEffect } from "react";
// import { Handle, Position } from "@xyflow/react";
// import { X } from "lucide-react";

// export default function FlowNodeBubble({
//   id,
//   data,
//   onDelete,
//   readonly,
//   onDataChange,
//   visualDebug = false,
// }) {
//   const {
//     templateName,
//     messageBody,
//     buttons = [],
//     requiredTag,
//     requiredSource,
//     isUnreachable,
//   } = data;

//   useEffect(() => {
//     if (buttons.length > 0 && onDataChange) {
//       const triggerText = buttons[0]?.text || "";
//       onDataChange({
//         ...data,
//         triggerButtonText: triggerText,
//         triggerButtonType: "cta",
//       });
//     }
//   }, [buttons, onDataChange, data]);

//   return (
//     <div className="bg-white shadow-md rounded-xl border border-purple-200 w-72 p-4 relative">
//       {/* ❌ Delete button */}
//       {!readonly && (
//         <button
//           onClick={() => onDelete(id)}
//           className="absolute top-1.5 right-1.5 text-red-500 hover:text-red-700"
//           title="Delete this step"
//         >
//           <X size={16} />
//         </button>
//       )}

//       {/* ⚠️ Visual Warning */}
//       {isUnreachable && (
//         <div
//           className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full font-semibold mb-2 inline-block"
//           title="This step has no incoming trigger. It may never run."
//         >
//           ⚠️ Unreachable Step
//         </div>
//       )}

//       {/* 🧾 Node Header */}
//       <div className="font-bold text-purple-700 mb-2">
//         📦 {templateName || "Untitled Step"}
//       </div>

//       {/* 💬 Message Body */}
//       <div className="text-sm text-gray-700 whitespace-pre-wrap mb-3">
//         💬 {messageBody || "Message body preview..."}
//       </div>

//       {/* 🎯 Conditional badges */}
//       <div className="flex flex-wrap gap-2 mb-2">
//         {requiredTag && (
//           <span
//             className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full font-semibold"
//             title={`Only contacts with tag "${requiredTag}" will receive this step.`}
//           >
//             🎯 Tag: {requiredTag}
//           </span>
//         )}
//         {requiredSource && (
//           <span
//             className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-semibold"
//             title={`This step runs only if Source = "${requiredSource}"`}
//           >
//             🔗 Source: {requiredSource}
//           </span>
//         )}
//       </div>

//       {/* 🔘 Buttons with output handles */}
//       <div className="flex flex-col gap-2">
//         {buttons.map((btn, index) => (
//           <div
//             key={index}
//             className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded shadow-sm text-center relative"
//           >
//             🔘 {btn.text || "Untitled Button"}
//             <Handle
//               type="source"
//               position={Position.Right}
//               id={btn.text}
//               title={`Drag from: ${btn.text}`}
//               style={{
//                 background: "#9333ea",
//                 top: "50%",
//                 transform: "translateY(-50%)",
//                 right: "-8px",
//               }}
//             />
//           </div>
//         ))}
//       </div>

//       {/* 🟣 Fallback output handle if no buttons */}
//       {buttons.length === 0 && (
//         <Handle
//           type="source"
//           position={Position.Bottom}
//           id="default"
//           style={{ background: "#9333ea" }}
//         />
//       )}

//       {/* 🔵 Incoming connection target */}
//       <Handle
//         type="target"
//         position={Position.Top}
//         id="incoming"
//         style={{ background: "#9333ea" }}
//       />

//       {/* 🧪 Visual Debug Info (no node ID) */}
//       {visualDebug && (
//         <div className="mt-3 text-[10px] text-gray-500">
//           🔗 Connections:
//           <ul className="list-disc ml-4">
//             {buttons.map((btn, i) => (
//               <li key={i}>
//                 {btn.text || "Unnamed"} →{" "}
//                 <strong>{btn.targetNodeId || "Not Connected"}</strong>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }
