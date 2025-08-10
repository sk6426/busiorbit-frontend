import axiosClient from "./axiosClient";

export const fetchTemplates = async businessId => {
  const response = await axiosClient.get(
    `/WhatsAppTemplateFetcher/${businessId}`
  );

  if (Array.isArray(response.data)) {
    // ✅ Direct array received
    return response.data;
  } else if (
    response.data.templates &&
    Array.isArray(response.data.templates)
  ) {
    // ✅ templates inside object
    return response.data.templates;
  } else {
    throw new Error("Unexpected template response format");
  }
};
