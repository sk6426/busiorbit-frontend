// src/pages/Campaigns/api/csvApi.js
import axiosClient from "../../../api/axiosClient";

/** Helper to unwrap { success, data } or raw payloads */
function un(data) {
  return data?.data ?? data;
}

/** ---------- Schema + Sample ---------- **/

export async function fetchCsvSchema(campaignId) {
  const { data } = await axiosClient.get(
    `/campaigns/${campaignId}/csv-sample/schema`
  );
  const p = un(data) ?? {};

  // Prefer explicit headers; fall back to array payloads; finally to []
  let headers = p.headers ?? p.data?.headers;
  if (!headers && Array.isArray(p?.data)) headers = p.data;
  if (!Array.isArray(headers)) headers = [];

  const placeholderCount =
    Number(p.placeholderCount ?? p.data?.placeholderCount ?? 0) || 0;
  return { headers, placeholderCount };
}

export async function downloadCsvSampleBlob(campaignId) {
  const res = await axiosClient.get(`/campaigns/${campaignId}/csv-sample`, {
    responseType: "blob",
  });
  return res.data; // Blob
}

/** ---------- Upload + Batch Info ---------- **/

/**
 * Uploads a CSV and returns a normalized object:
 * { batchId, headerJson: string[] }
 */
export async function uploadCsvBatch(file, audienceId = null) {
  const form = new FormData();
  form.append("file", file);
  if (audienceId) form.append("audienceId", audienceId);

  const { data } = await axiosClient.post("/csv/batch", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const p = un(data) ?? {};

  // Normalize keys so components can immediately render headers
  const batchId = p.batchId ?? p.BatchId ?? p.id ?? p.Id;
  const headerJson = p.headerJson ?? p.headers ?? p.Headers ?? [];

  return { ...p, batchId, headerJson };
}

/**
 * Returns batch meta in a normalized shape:
 * { batchId, headers, headerJson, rowCount, createdAt, ... }
 */
export async function getBatchInfo(batchId) {
  const { data } = await axiosClient.get(`/csv/batch/${batchId}`);
  const p = un(data) ?? {};
  const headers = p.headers ?? p.headerJson ?? p.Headers ?? [];
  return {
    ...p,
    batchId: p.batchId ?? p.BatchId ?? batchId,
    headers,
    headerJson: headers,
  };
}

/** ---------- Sample (preview rows) ---------- **/

/**
 * Always returns { headers: string[], rows: Array<Record<string,string>> }
 * even if the backend only returns an array of { rowIndex, data | Data }.
 */
export async function getBatchSample(batchId, take = 10) {
  const { data } = await axiosClient.get(`/csv/batch/${batchId}/sample`, {
    params: { take },
  });
  const payload = un(data);

  // Case A: backend already returns { headers, rows }
  if (payload?.headers && payload?.rows) {
    return {
      headers: payload.headers,
      rows: payload.rows,
    };
  }

  // Case B: backend returns only rows as an array
  if (Array.isArray(payload)) {
    const rows = payload.map(x => x.data ?? x.Data ?? x.row ?? x.Row ?? {});
    // Try to infer from the first row; else fall back to batch info; else []
    let headers = rows.length > 0 ? Object.keys(rows[0] ?? {}) : [];
    if (!headers.length) {
      const info = await getBatchInfo(batchId);
      headers =
        Array.isArray(info.headers) && info.headers.length ? info.headers : [];
    }
    return { headers, rows };
  }

  // Case C: unexpected shape — fall back to batch info
  const info = await getBatchInfo(batchId);
  return { headers: info.headers ?? [], rows: [] };
}

/** ---------- Validation ---------- **/

/**
 * Validates the batch using the chosen phone header and options.
 * Returns a normalized shape: { problems: string[], ...raw }
 */
export async function validateBatch(batchId, req) {
  // Map UI request -> backend field names (tolerant to either)
  const body = {
    phoneField: req.phoneHeader ?? req.phoneField,
    requiredHeaders: req.requiredHeaders ?? [],
    normalizePhones: !!(req.normalizePhone ?? req.normalizePhones),
    deduplicate: !!(req.checkDuplicates ?? req.deduplicate),
  };

  const { data } = await axiosClient.post(
    `/csv/batch/${batchId}/validate`,
    body
  );
  const p = un(data) ?? {};

  // Normalize a few common shapes
  const problems = p.problems ?? p.errors ?? p.Errors ?? [];

  return { ...p, problems };
}

/** ---------- Optional: mapping helpers (no-ops if backend lacks them) ---------- **/

/**
 * Ask backend for parameter mapping suggestions based on the batch.
 * Gracefully handles 404/501 by returning { items: [] }.
 */
export async function suggestMappings(campaignId, batchId) {
  try {
    const { data } = await axiosClient.get(
      `/campaigns/${campaignId}/mappings/suggest`,
      { params: { batchId } }
    );
    const p = un(data) ?? {};
    return { items: p.items ?? [] };
  } catch {
    return { items: [] };
  }
}

/** Persist current mapping preferences (optional, idempotent). */
export async function saveMappings(campaignId, mappingDto) {
  // many backends use POST /campaigns/{id}/mappings
  const { data } = await axiosClient.post(
    `/campaigns/${campaignId}/mappings`,
    mappingDto
  );
  return un(data) ?? {};
}

/** ---------- Materialize (dry-run / commit) ---------- **/

/**
 * body = {
 *   csvBatchId,
 *   mappings: { "{{1}}": "Name", "button1.url_param": "UrlCol", ... } (column names or "constant:VALUE"),
 *   phoneField: "Phone",
 *   normalizePhones: boolean,
 *   deduplicate: boolean,
 *   persist: boolean,
 *   audienceName?: string
 * }
 */
export async function materialize(campaignId, body) {
  const { data } = await axiosClient.post(
    `/campaigns/${campaignId}/materialize`,
    body
  );
  return un(data) ?? {};
}

// // src/pages/Campaigns/api/csvApi.js
// import axiosClient from "../../../api/axiosClient";

// /** Helper to unwrap { success, data } or raw payloads */
// function un(data) {
//   return data?.data ?? data;
// }

// /** ---------- Schema + Sample ---------- **/

// export async function fetchCsvSchema(campaignId) {
//   const { data } = await axiosClient.get(
//     `/campaigns/${campaignId}/csv-sample/schema`
//   );
//   const p = un(data) ?? {};

//   // Prefer explicit headers; fall back to array payloads; then to ["phone"]
//   let headers = p.headers ?? p.data?.headers;
//   if (!headers && Array.isArray(p?.data)) headers = p.data;
//   if (!Array.isArray(headers) || headers.length === 0) headers = ["phone"];

//   const placeholderCount =
//     Number(p.placeholderCount ?? p.data?.placeholderCount ?? 0) || 0;
//   return { headers, placeholderCount };
// }

// export async function downloadCsvSampleBlob(campaignId) {
//   const res = await axiosClient.get(`/campaigns/${campaignId}/csv-sample`, {
//     responseType: "blob",
//   });
//   return res.data; // Blob
// }

// /** ---------- Upload + Batch Info ---------- **/

// /**
//  * Uploads a CSV and returns a normalized object:
//  * { batchId, headerJson: string[] }
//  */
// export async function uploadCsvBatch(file, audienceId = null) {
//   const form = new FormData();
//   form.append("file", file);
//   if (audienceId) form.append("audienceId", audienceId);

//   const { data } = await axiosClient.post("/csv/batch", form, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
//   const p = un(data) ?? {};

//   // Normalize keys so components can immediately render headers
//   const batchId = p.batchId ?? p.BatchId ?? p.id ?? p.Id;
//   const headerJson = p.headerJson ?? p.headers ?? p.Headers ?? [];

//   return { ...p, batchId, headerJson };
// }

// /**
//  * Returns batch meta in a normalized shape:
//  * { batchId, headers, headerJson, rowCount, createdAt, ... }
//  */
// export async function getBatchInfo(batchId) {
//   const { data } = await axiosClient.get(`/csv/batch/${batchId}`);
//   const p = un(data) ?? {};
//   const headers = p.headers ?? p.headerJson ?? p.Headers ?? [];
//   return {
//     ...p,
//     batchId: p.batchId ?? p.BatchId ?? batchId,
//     headers,
//     headerJson: headers,
//   };
// }

// /** ---------- Sample (preview rows) ---------- **/

// /**
//  * Always returns { headers: string[], rows: Array<Record<string,string>> }
//  * even if the backend only returns an array of { rowIndex, data | Data }.
//  */
// export async function getBatchSample(batchId, take = 10) {
//   const { data } = await axiosClient.get(`/csv/batch/${batchId}/sample`, {
//     params: { take },
//   });
//   const payload = un(data);

//   // Case A: backend already returns { headers, rows }
//   if (payload?.headers && payload?.rows) {
//     return {
//       headers: payload.headers,
//       rows: payload.rows,
//     };
//   }

//   // Case B: backend returns only rows as an array
//   if (Array.isArray(payload)) {
//     const rows = payload.map(x => x.data ?? x.Data ?? x.row ?? x.Row ?? {});
//     // Try to infer from the first row; else fall back to batch info; else ["phone"]
//     let headers = rows.length > 0 ? Object.keys(rows[0] ?? {}) : [];
//     if (!headers.length) {
//       const info = await getBatchInfo(batchId);
//       headers =
//         Array.isArray(info.headers) && info.headers.length
//           ? info.headers
//           : ["phone"];
//     }
//     return { headers, rows };
//   }

//   // Case C: unexpected shape — fall back to batch info
//   const info = await getBatchInfo(batchId);
//   return { headers: info.headers ?? ["phone"], rows: [] };
// }

// /** ---------- Validation ---------- **/

// /**
//  * Validates the batch using the chosen phone header and options.
//  * Returns a normalized shape: { problems: string[], ...raw }
//  */
// export async function validateBatch(batchId, req) {
//   // Map UI request -> backend field names (tolerant to either)
//   const body = {
//     phoneField: req.phoneHeader ?? req.phoneField,
//     requiredHeaders: req.requiredHeaders ?? [],
//     normalizePhones: !!(req.normalizePhone ?? req.normalizePhones),
//     deduplicate: !!(req.checkDuplicates ?? req.deduplicate),
//   };

//   const { data } = await axiosClient.post(
//     `/csv/batch/${batchId}/validate`,
//     body
//   );
//   const p = un(data) ?? {};

//   // Normalize a few common shapes
//   const problems = p.problems ?? p.errors ?? p.Errors ?? [];

//   return { ...p, problems };
// }

// /** ---------- Optional: mapping helpers (no-ops if backend lacks them) ---------- **/

// /**
//  * Ask backend for parameter mapping suggestions based on the batch.
//  * Gracefully handles 404/501 by returning { items: [] }.
//  */
// export async function suggestMappings(campaignId, batchId) {
//   try {
//     const { data } = await axiosClient.get(
//       `/campaigns/${campaignId}/mappings/suggest`,
//       { params: { batchId } }
//     );
//     const p = un(data) ?? {};
//     return { items: p.items ?? [] };
//   } catch {
//     return { items: [] };
//   }
// }

// /** Persist current mapping preferences (optional, idempotent). */
// export async function saveMappings(campaignId, mappingDto) {
//   // many backends use POST /campaigns/{id}/mappings
//   const { data } = await axiosClient.post(
//     `/campaigns/${campaignId}/mappings`,
//     mappingDto
//   );
//   return un(data) ?? {};
// }

// /** ---------- Materialize (dry-run / commit) ---------- **/

// /**
//  * body = {
//  *   // common FE shapes your backend can accept as-is:
//  *   // csvBatchId: string,            // preferred by FE
//  *   // OR batchId: string,            // some backends prefer this
//  *   mappings: Record<string,string>,  // "{{1}}": "colA", "button1.url_param": "colX", ...
//  *   phoneField: string,
//  *   normalizePhones: boolean,
//  *   deduplicate: boolean,
//  *   persist?: boolean,                // true=commit, false=dry-run
//  *   audienceName?: string
//  * }
//  */
// export async function materialize(campaignId, body) {
//   const { data } = await axiosClient.post(
//     `/campaigns/${campaignId}/materialize`,
//     body
//   );
//   return un(data) ?? {};
// }

// // src/pages/Campaigns/api/csvApi.js
// import axiosClient from "../../../api/axiosClient";

// /** Helper to unwrap { success, data } or raw payloads */
// function un(data) {
//   return data?.data ?? data;
// }

// /** ---------- Schema + Sample ---------- **/

// export async function fetchCsvSchema(campaignId) {
//   const { data } = await axiosClient.get(
//     `/campaigns/${campaignId}/csv-sample/schema`
//   );
//   const p = un(data) ?? {};
//   const headers = p.headers ??
//     p.data?.headers ??
//     (Array.isArray(p?.data) ? p.data : []) ?? ["phone"];
//   const placeholderCount = p.placeholderCount ?? p.data?.placeholderCount ?? 0;

//   return { headers, placeholderCount };
// }

// export async function downloadCsvSampleBlob(campaignId) {
//   const res = await axiosClient.get(`/campaigns/${campaignId}/csv-sample`, {
//     responseType: "blob",
//   });
//   return res.data; // Blob
// }

// /** ---------- Upload + Batch Info ---------- **/

// /**
//  * Uploads a CSV and returns a normalized object:
//  * { batchId, headerJson: string[] }
//  */
// export async function uploadCsvBatch(file, audienceId = null) {
//   const form = new FormData();
//   form.append("file", file);
//   if (audienceId) form.append("audienceId", audienceId);

//   const { data } = await axiosClient.post("/csv/batch", form, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
//   const p = un(data) ?? {};

//   // Normalize keys so components can immediately render headers
//   const batchId = p.batchId ?? p.BatchId ?? p.id ?? p.Id;
//   const headerJson = p.headerJson ?? p.headers ?? p.Headers ?? [];

//   return { ...p, batchId, headerJson };
// }

// /**
//  * Returns batch meta in a normalized shape:
//  * { batchId, headers, headerJson, rowCount, createdAt, ... }
//  */
// export async function getBatchInfo(batchId) {
//   const { data } = await axiosClient.get(`/csv/batch/${batchId}`);
//   const p = un(data) ?? {};
//   const headers = p.headers ?? p.headerJson ?? p.Headers ?? [];
//   return {
//     ...p,
//     batchId: p.batchId ?? p.BatchId ?? batchId,
//     headers,
//     headerJson: headers,
//   };
// }

// /** ---------- Sample (preview rows) ---------- **/

// /**
//  * Always returns { headers: string[], rows: Array<Record<string,string>> }
//  * even if the backend only returns an array of { rowIndex, data | Data }.
//  */
// export async function getBatchSample(batchId, take = 10) {
//   const { data } = await axiosClient.get(`/csv/batch/${batchId}/sample`, {
//     params: { take },
//   });
//   const payload = un(data);

//   // Case A: backend already returns { headers, rows }
//   if (payload?.headers && payload?.rows) {
//     return {
//       headers: payload.headers,
//       rows: payload.rows,
//     };
//   }

//   // Case B: backend returns only rows as an array
//   if (Array.isArray(payload)) {
//     const info = await getBatchInfo(batchId);
//     const headers = info.headers?.length ? info.headers : ["phone"];
//     const rows = payload.map(x => x.data ?? x.Data ?? x.row ?? x.Row ?? {});
//     return { headers, rows };
//   }

//   // Case C: unexpected shape — fall back to batch info
//   const info = await getBatchInfo(batchId);
//   return { headers: info.headers ?? ["phone"], rows: [] };
// }

// /** ---------- Validation ---------- **/

// /**
//  * Validates the batch using the chosen phone header and options.
//  * Returns a normalized shape: { problems: string[], ...raw }
//  */
// export async function validateBatch(batchId, req) {
//   // Map UI request -> backend field names (tolerant to either)
//   const body = {
//     phoneField: req.phoneHeader ?? req.phoneField,
//     requiredHeaders: req.requiredHeaders ?? [],
//     normalizePhones: !!(req.normalizePhone ?? req.normalizePhones),
//     deduplicate: !!(req.checkDuplicates ?? req.deduplicate),
//   };

//   const { data } = await axiosClient.post(
//     `/csv/batch/${batchId}/validate`,
//     body
//   );
//   const p = un(data) ?? {};

//   // Normalize a few common shapes
//   const problems = p.problems ?? p.errors ?? p.Errors ?? [];

//   return { ...p, problems };
// }

// /** ---------- Optional: mapping helpers (no-ops if backend lacks them) ---------- **/

// /**
//  * Ask backend for parameter mapping suggestions based on the batch.
//  * Gracefully handles 404/501 by returning { items: [] }.
//  */
// export async function suggestMappings(campaignId, batchId) {
//   try {
//     const { data } = await axiosClient.get(
//       `/campaigns/${campaignId}/mappings/suggest`,
//       { params: { batchId } }
//     );
//     const p = un(data) ?? {};
//     return { items: p.items ?? [] };
//   } catch {
//     return { items: [] };
//   }
// }

// /** Persist current mapping preferences (optional, idempotent). */
// export async function saveMappings(campaignId, mappingDto) {
//   // many backends use POST /campaigns/{id}/mappings
//   const { data } = await axiosClient.post(
//     `/campaigns/${campaignId}/mappings`,
//     mappingDto
//   );
//   return un(data) ?? {};
// }

// /** ---------- Materialize (dry-run / commit) ---------- **/

// /**
//  * body = {
//  *   mode: "dryRun" | "commit",
//  *   batchId,
//  *   normalizePhone: boolean,
//  *   deduplicate: boolean,
//  *   phoneHeader: string,
//  *   mappings: [...]
//  * }
//  */
// export async function materialize(campaignId, body) {
//   const { data } = await axiosClient.post(
//     `/campaigns/${campaignId}/materialize`,
//     body
//   );
//   return un(data) ?? {};
// }
