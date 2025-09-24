import axiosClient from "../../api/axiosClient";
/**
 * Coerce values coming from the UI into clean types for the API.
 */
const toBool = v => v === true || v === "true" || v === 1;
const toPosInt = (v, def = 1) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
};

/**
 * Save a visual flow (nodes + edges).
 * Includes UseProfileName/ProfileNameSlot so the runtime knows where to inject the WA profile name.
 */
export async function saveVisualFlow(payload) {
  const safeNodes = (payload.Nodes || []).map(node => ({
    Id: node.Id || "",
    TemplateName: node.TemplateName || "",
    TemplateType: node.TemplateType || "text_template",
    MessageBody: node.MessageBody || "",
    PositionX: node.PositionX ?? 0,
    PositionY: node.PositionY ?? 0,
    TriggerButtonText: node.TriggerButtonText || "",
    TriggerButtonType: node.TriggerButtonType || "cta",

    // 👇 NEW: persist the greeting controls per-step
    UseProfileName: toBool(node.UseProfileName),
    ProfileNameSlot: toPosInt(node.ProfileNameSlot ?? 1, 1),

    // buttons with stable Index (used later to map clicks)
    Buttons: (node.Buttons || []).map((btn, idx) => ({
      Text: btn.Text || "",
      Type: btn.Type || "",
      SubType: btn.SubType || "",
      Value: btn.Value || "",
      TargetNodeId: btn.TargetNodeId || null,
      Index: Number.isFinite(btn.Index) ? btn.Index : idx,
    })),
  }));

  const safeEdges = (payload.Edges || []).map(e => ({
    FromNodeId: e.FromNodeId || "",
    ToNodeId: e.ToNodeId || "",
    SourceHandle: e.SourceHandle || "", // button text
  }));

  const fixedPayload = {
    FlowName: payload.FlowName || "Untitled",
    IsPublished: !!payload.IsPublished,
    Nodes: safeNodes,
    Edges: safeEdges,
  };

  const res = await axiosClient.post("/cta-flow/save-visual", fixedPayload);
  return res.data;
}

/**
 * Load a visual flow by ID.
 * The builder expects the response shape to include: { flowName, nodes: [...], edges: [...] }.
 */
export async function getVisualFlowById(flowId) {
  const res = await axiosClient.get(`/cta-flow/by-id/${flowId}`);
  return res.data;
}

// import axiosClient from "../../api/axiosClient";

// // ✅ FINAL version with Index support for buttons
// export async function saveVisualFlow(payload) {
//   const safeNodes = (payload.Nodes || []).map(node => {
//     return {
//       Id: node.Id || "",
//       TemplateName: node.TemplateName || "",
//       TemplateType: node.TemplateType || "text_template",
//       MessageBody: node.MessageBody || "",
//       PositionX: node.PositionX ?? 0,
//       PositionY: node.PositionY ?? 0,
//       TriggerButtonText: node.TriggerButtonText || "",
//       TriggerButtonType: node.TriggerButtonType || "cta",
//       Buttons: (node.Buttons || []).map((btn, idx) => ({
//         Text: btn.Text || "",
//         Type: btn.Type || "",
//         SubType: btn.SubType || "",
//         Value: btn.Value || "",
//         TargetNodeId: btn.TargetNodeId || null,
//         Index: typeof btn.Index === "number" ? btn.Index : idx, // ✅ preserve Index
//       })),
//     };
//   });

//   const safeEdges = (payload.Edges || []).map(edge => ({
//     FromNodeId: edge.FromNodeId || "",
//     ToNodeId: edge.ToNodeId || "",
//     SourceHandle: edge.SourceHandle || "",
//   }));

//   const fixedPayload = {
//     FlowName: payload.FlowName || "Untitled",
//     IsPublished: payload.IsPublished ?? false,
//     Nodes: safeNodes,
//     Edges: safeEdges,
//   };

//   console.log("📤 Sending flow to API:", fixedPayload);
//   const response = await axiosClient.post(
//     "/cta-flow/save-visual",
//     fixedPayload
//   );
//   return response.data;
// }

// // 📥 Load a specific visual flow by ID
// export async function getVisualFlowById(flowId) {
//   const res = await axiosClient.get(`/cta-flow/by-id/${flowId}`);
//   return res.data;
// }

// import axiosClient from "../../api/axiosClient";
// // Removed: import { v4 as uuidv4 } from "uuid"; // Not used

// // ✅ FINAL version with UUID fallback for node.Id
// // ✅ Accept the full payload object
// export async function saveVisualFlow(payload) {
//   const safeNodes = (payload.Nodes || []).map(node => {
//     // Removed: const data = node.data || {}; // Not used
//     return {
//       Id: node.Id || "",
//       TemplateName: node.TemplateName || "",
//       TemplateType: node.TemplateType || "text_template",
//       MessageBody: node.MessageBody || "",
//       PositionX: node.PositionX ?? 0,
//       PositionY: node.PositionY ?? 0,
//       TriggerButtonText: node.TriggerButtonText || "",
//       TriggerButtonType: node.TriggerButtonType || "cta",
//       Buttons: (node.Buttons || []).map(btn => ({
//         Text: btn.Text || "",
//         Type: btn.Type || "",
//         SubType: btn.SubType || "",
//         Value: btn.Value || "",
//         TargetNodeId: btn.TargetNodeId || null,
//       })),
//     };
//   });

//   const safeEdges = (payload.Edges || []).map(edge => ({
//     FromNodeId: edge.FromNodeId || "",
//     ToNodeId: edge.ToNodeId || "",
//     SourceHandle: edge.SourceHandle || "",
//   }));

//   const fixedPayload = {
//     FlowName: payload.FlowName || "Untitled",
//     IsPublished: payload.IsPublished ?? false,
//     Nodes: safeNodes,
//     Edges: safeEdges,
//   };

//   console.log("📤 Sending minimal flow to API:", fixedPayload);
//   const response = await axiosClient.post(
//     "/cta-flow/save-visual",
//     fixedPayload
//   );
//   return response.data;
// }

// // 📥 Load a specific visual flow by ID
// export async function getVisualFlowById(flowId) {
//   const res = await axiosClient.get(`/cta-flow/by-id/${flowId}`);
//   return res.data;
// }

// import axiosClient from "../../api/axiosClient";
// import { v4 as uuidv4 } from "uuid"; // ✅ Ensure UUID generator is imported

// // ✅ FINAL version with UUID fallback for node.Id
// // ✅ Accept the full payload object
// export async function saveVisualFlow(payload) {
//   const safeNodes = (payload.Nodes || []).map(node => {
//     const data = node.data || {};
//     return {
//       Id: node.Id || "",
//       TemplateName: node.TemplateName || "",
//       TemplateType: node.TemplateType || "text_template",
//       MessageBody: node.MessageBody || "",
//       PositionX: node.PositionX ?? 0,
//       PositionY: node.PositionY ?? 0,
//       TriggerButtonText: node.TriggerButtonText || "",
//       TriggerButtonType: node.TriggerButtonType || "cta",
//       Buttons: (node.Buttons || []).map(btn => ({
//         Text: btn.Text || "",
//         Type: btn.Type || "",
//         SubType: btn.SubType || "",
//         Value: btn.Value || "",
//         TargetNodeId: btn.TargetNodeId || null,
//       })),
//     };
//   });

//   const safeEdges = (payload.Edges || []).map(edge => ({
//     FromNodeId: edge.FromNodeId || "",
//     ToNodeId: edge.ToNodeId || "",
//     SourceHandle: edge.SourceHandle || "",
//   }));

//   const fixedPayload = {
//     FlowName: payload.FlowName || "Untitled",
//     IsPublished: payload.IsPublished ?? false,
//     Nodes: safeNodes,
//     Edges: safeEdges,
//   };

//   console.log("📤 Sending minimal flow to API:", fixedPayload);
//   const response = await axiosClient.post(
//     "/cta-flow/save-visual",
//     fixedPayload
//   );
//   return response.data;
// }

// // 📥 Load a specific visual flow by ID
// export async function getVisualFlowById(flowId) {
//   const res = await axiosClient.get(`/cta-flow/by-id/${flowId}`);
//   return res.data;
// }
