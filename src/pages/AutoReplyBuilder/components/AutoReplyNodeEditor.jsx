import React, { useState, useEffect, useCallback } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "../../../components/ui/button";
import WhatsAppTemplatePreview from "./WhatsAppTemplatePreview";

export default function AutoReplyNodeEditor({ node, onClose, onSave }) {
  const [form, setForm] = useState({
    text: "",
    templateName: "",
    placeholders: [],
    tags: [],
    seconds: 1,
    body: "",
    multiButtons: [],
  });

  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const fetchFullTemplate = async templateName => {
    const businessId = localStorage.getItem("businessId");
    try {
      const res = await fetch(
        `/api/WhatsAppTemplateFetcher/get-by-name/${businessId}/${templateName}?includeButtons=true`
      );

      if (!res.ok) throw new Error("Failed to fetch full template");

      const json = await res.json();
      if (json.success) {
        const tpl = json.template;
        setSelectedTemplate(tpl);

        // ✅ Patch: store buttons in form
        setForm(prev => ({
          ...prev,
          templateName: tpl.name,
          body: tpl.body || tpl.bodyText || "",
          multiButtons: tpl.multiButtons || tpl.buttonParams || [],
        }));
      } else {
        setSelectedTemplate(null);
        console.warn("⚠️ No template found");
      }
    } catch (err) {
      console.error("❌ Failed to fetch full template", err);
      setSelectedTemplate(null);
    }
  };

  const fetchTemplates = useCallback(async (preselectedName = "") => {
    const businessId = localStorage.getItem("businessId");
    try {
      const res = await fetch(
        `/api/WhatsAppTemplateFetcher/get-template/${businessId}`
      );

      if (!res.ok) throw new Error("Failed to fetch templates");

      const json = await res.json();
      if (json.success) {
        setTemplates(json.templates);
        if (preselectedName) {
          fetchFullTemplate(preselectedName);
        }
      }
    } catch (err) {
      console.error("❌ Failed to fetch templates", err);
    }
  }, []);

  useEffect(() => {
    if (!node) return;

    const { config } = node.data || {};
    setForm({
      text: config?.text || "",
      templateName: config?.templateName || "",
      placeholders: config?.placeholders || [],
      tags: config?.tags || [],
      seconds: config?.seconds || 1,
      body: config?.body || "",
      multiButtons: config?.multiButtons || [],
    });

    if (node.type === "template") {
      fetchTemplates(config?.templateName);
    }
  }, [node, fetchTemplates]);

  const handleChange = async e => {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: name === "seconds" ? parseInt(value) || 1 : value,
    }));

    if (name === "templateName") {
      setSelectedTemplate(null);
      await fetchFullTemplate(value);
    }
  };

  const handleSave = () => {
    const updated = {
      ...node,
      data: {
        ...node.data,
        config: {
          ...form,
        },
      },
    };
    onSave(updated);
    onClose();
  };

  if (!node) return null;

  const isTemplate = node.type === "template";

  return (
    <Dialog open={!!node} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-gray-200 p-6">
          <Dialog.Title className="text-lg font-semibold mb-4 text-zinc-800">
            ✏️ Edit: {node.type}
          </Dialog.Title>

          <div className="space-y-4 text-sm text-gray-700">
            {node.type === "message" && (
              <div>
                <label className="block font-medium mb-1">Text Message</label>
                <textarea
                  name="text"
                  value={form.text}
                  onChange={handleChange}
                  rows={4}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {isTemplate && (
              <>
                <div>
                  <label className="block font-medium mb-1">
                    Choose Template
                  </label>
                  <select
                    name="templateName"
                    value={form.templateName}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">-- Select Template --</option>
                    {templates.map(tpl => (
                      <option key={tpl.name} value={tpl.name}>
                        {tpl.name} ({tpl.language}) — {tpl.placeholderCount}{" "}
                        param
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTemplate && (
                  <WhatsAppTemplatePreview template={selectedTemplate} />
                )}
              </>
            )}

            {node.type === "tag" && (
              <div>
                <label className="block font-medium mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.tags.join(", ")}
                  onChange={e => {
                    const updated = e.target.value
                      .split(",")
                      .map(tag => tag.trim())
                      .filter(tag => tag !== "");
                    setForm(prev => ({ ...prev, tags: updated }));
                  }}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. interested, hot-lead"
                />
              </div>
            )}

            {node.type === "wait" && (
              <div>
                <label className="block font-medium mb-1">
                  Wait Time (in seconds)
                </label>
                <input
                  type="number"
                  name="seconds"
                  min="1"
                  value={form.seconds}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. 3"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-6">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

// import React, { useState, useEffect, useCallback } from "react";
// import { Dialog } from "@headlessui/react";
// import { Button } from "../../../components/ui/button";
// import WhatsAppTemplatePreview from "./WhatsAppTemplatePreview";

// export default function AutoReplyNodeEditor({ node, onClose, onSave }) {
//   const [form, setForm] = useState({
//     text: "",
//     templateName: "",
//     placeholders: [],
//     tags: [],
//     seconds: 1,
//   });

//   const [templates, setTemplates] = useState([]);
//   const [selectedTemplate, setSelectedTemplate] = useState(null);

//   const fetchFullTemplate = async templateName => {
//     const businessId = localStorage.getItem("businessId");
//     try {
//       const res = await fetch(
//         `/api/WhatsAppTemplateFetcher/get-by-name/${businessId}/${templateName}?includeButtons=true`
//       );

//       if (!res.ok) throw new Error("Failed to fetch full template");

//       const json = await res.json();
//       if (json.success) {
//         setSelectedTemplate(json.template);
//       } else {
//         setSelectedTemplate(null);
//         console.warn("⚠️ No template found");
//       }
//     } catch (err) {
//       console.error("❌ Failed to fetch full template", err);
//       setSelectedTemplate(null);
//     }
//   };

//   const fetchTemplates = useCallback(async (preselectedName = "") => {
//     const businessId = localStorage.getItem("businessId");
//     try {
//       const res = await fetch(
//         `/api/WhatsAppTemplateFetcher/get-template/${businessId}`
//       );

//       if (!res.ok) throw new Error("Failed to fetch templates");

//       const json = await res.json();
//       if (json.success) {
//         const list = json.templates;
//         setTemplates(list);

//         if (preselectedName) {
//           fetchFullTemplate(preselectedName);
//         }
//       }
//     } catch (err) {
//       console.error("❌ Failed to fetch templates", err);
//     }
//   }, []);

//   useEffect(() => {
//     if (!node) return;

//     const { config } = node.data || {};
//     setForm({
//       text: config?.text || "",
//       templateName: config?.templateName || "",
//       placeholders: config?.placeholders || [],
//       tags: config?.tags || [],
//       seconds: config?.seconds || 1,
//     });

//     if (node.type === "template") {
//       fetchTemplates(config?.templateName);
//     }
//   }, [node, fetchTemplates]);

//   const handleChange = async e => {
//     const { name, value } = e.target;

//     setForm(prev => ({
//       ...prev,
//       [name]: name === "seconds" ? parseInt(value) || 1 : value,
//     }));

//     if (name === "templateName") {
//       setSelectedTemplate(null);
//       await fetchFullTemplate(value);
//     }
//   };

//   const handleSave = () => {
//     const updated = {
//       ...node,
//       data: {
//         ...node.data,
//         config: {
//           ...form,
//         },
//       },
//     };
//     onSave(updated);
//     onClose();
//   };

//   if (!node) return null;

//   const isTemplate = node.type === "template";

//   return (
//     <Dialog open={!!node} onClose={onClose} className="relative z-50">
//       <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
//       <div className="fixed inset-0 flex items-center justify-center p-4">
//         <Dialog.Panel className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-gray-200 p-6">
//           <Dialog.Title className="text-lg font-semibold mb-4 text-zinc-800">
//             ✏️ Edit: {node.type}
//           </Dialog.Title>

//           <div className="space-y-4 text-sm text-gray-700">
//             {node.type === "message" && (
//               <div>
//                 <label className="block font-medium mb-1">Text Message</label>
//                 <textarea
//                   name="text"
//                   value={form.text}
//                   onChange={handleChange}
//                   rows={4}
//                   className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
//                 />
//               </div>
//             )}

//             {isTemplate && (
//               <>
//                 <div>
//                   <label className="block font-medium mb-1">
//                     Choose Template
//                   </label>
//                   <select
//                     name="templateName"
//                     value={form.templateName}
//                     onChange={handleChange}
//                     className="w-full border rounded px-3 py-2"
//                   >
//                     <option value="">-- Select Template --</option>
//                     {templates.map(tpl => (
//                       <option key={tpl.name} value={tpl.name}>
//                         {tpl.name} ({tpl.language}) — {tpl.placeholderCount}{" "}
//                         param
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <WhatsAppTemplatePreview template={selectedTemplate} />
//               </>
//             )}

//             {node.type === "tag" && (
//               <div>
//                 <label className="block font-medium mb-1">
//                   Tags (comma-separated)
//                 </label>
//                 <input
//                   type="text"
//                   value={form.tags.join(", ")}
//                   onChange={e => {
//                     const updated = e.target.value
//                       .split(",")
//                       .map(tag => tag.trim())
//                       .filter(tag => tag !== "");
//                     setForm(prev => ({ ...prev, tags: updated }));
//                   }}
//                   className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
//                   placeholder="e.g. interested, hot-lead"
//                 />
//               </div>
//             )}

//             {node.type === "wait" && (
//               <div>
//                 <label className="block font-medium mb-1">
//                   Wait Time (in seconds)
//                 </label>
//                 <input
//                   type="number"
//                   name="seconds"
//                   min="1"
//                   value={form.seconds}
//                   onChange={handleChange}
//                   className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
//                   placeholder="e.g. 3"
//                 />
//               </div>
//             )}
//           </div>

//           <div className="flex justify-end gap-2 pt-6">
//             <Button variant="ghost" onClick={onClose}>
//               Cancel
//             </Button>
//             <Button onClick={handleSave}>Save</Button>
//           </div>
//         </Dialog.Panel>
//       </div>
//     </Dialog>
//   );
// }
