import axiosClient from "../../api/axiosClient";

// 🔵 Get the current published CTA flow
export async function getCurrentFlow() {
  const res = await axiosClient.get("/cta-flow/current");
  return res.data;
}

// 🆕 🔶 Get the draft (unpublished) CTA flow
export async function getDraftFlow() {
  const res = await axiosClient.get("/cta-flow/draft");
  return res.data;
}

// 🟢 Save or publish a CTA flow
export async function createFlow(flowName, steps, isActive, isPublished) {
  const payload = {
    flowName,
    isActive, // 🔁 Flow active/inactive
    isPublished, // 🆕 publish vs save draft
    steps: steps.map((step, i) => ({
      ...step,
      stepOrder: i + 1,
    })),
  };

  const res = await axiosClient.post("/cta-flow/create", payload);
  return res.data;
}

// 🟣 Fetch available WhatsApp templates for dropdown
export async function fetchTemplates() {
  const res = await axiosClient.get(
    "/WhatsAppTemplateFetcher/get-template-all"
  );
  return res.data.templates || [];
}
