import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import { MessageType } from "../../constants/messageTypes";

function MessageComposer({ onMessageReady }) {
  const [templates, setTemplates] = useState([]);
  const [templateBody, setTemplateBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [mode, setMode] = useState(MessageType.Template);

  const [form, setForm] = useState({
    messageType: MessageType.Template,
    templateName: "",
    message: "",
    templateParams: [],
    buttonParams: [],
  });

  // 🚀 Load Templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const businessId = localStorage.getItem("businessId");
        if (!businessId) {
          toast.error("❌ BusinessId not found.");
          return;
        }
        const response = await axiosClient.get(
          `/WhatsAppTemplateFetcher/get-template-all/`
        );
        if (response.data.success && Array.isArray(response.data.templates)) {
          setTemplates(response.data.templates);

          if (!form.templateName && response.data.templates.length > 0) {
            // Auto-select first template if none selected
            handleTemplateChange({
              target: { value: response.data.templates[0].name },
            });
          }
        } else {
          toast.error("⚠️ Unexpected templates response format.");
        }
      } catch (err) {
        console.error(err);
        toast.error("❌ Failed to load templates.");
      }
    };

    loadTemplates();
    // eslint-disable-next-line
  }, []); // form/templateName intentionally left out for clean mount-only fetch

  // 🔍 Count placeholder params like {{1}}, {{2}}
  const extractParamCount = body => {
    const matches = body?.match(/{{\d+}}/g) || [];
    return [...new Set(matches)].length;
  };

  // 🔄 Handle template selection
  const handleTemplateChange = e => {
    const selectedName = e.target.value;
    const template = templates.find(t => t.name === selectedName);

    if (!selectedName || !template) {
      toast.warn("⚠️ Please select a valid template.");
      return;
    }

    const body = template.body || "";
    const paramCount = extractParamCount(body);
    const buttonParamCount = template.buttons?.length || 0;

    setForm(prev => ({
      ...prev,
      messageType: MessageType.Template,
      templateName: selectedName,
      message: "",
      templateParams: Array(paramCount).fill(""),
      buttonParams: Array(buttonParamCount).fill(""),
    }));

    setSelectedTemplate(template);
    setTemplateBody(body);
    setMode(MessageType.Template);
  };

  const updateParam = (index, value) => {
    setForm(prev => {
      const updated = [...prev.templateParams];
      updated[index] = value;
      return { ...prev, templateParams: updated };
    });
  };

  const updateButtonParam = (index, value) => {
    setForm(prev => {
      const updated = [...prev.buttonParams];
      updated[index] = value;
      return { ...prev, buttonParams: updated };
    });
  };

  // 🔍 Live preview generator
  const generatePreview = (template, paramValues) => {
    if (!template) return "";
    return template.replace(/{{(\d+)}}/g, (_, p1) => {
      const index = parseInt(p1, 10) - 1;
      return paramValues[index] || `{{${p1}}}`;
    });
  };

  const previewMessage =
    mode === MessageType.Template
      ? generatePreview(templateBody, form.templateParams)
      : form.message.trim();

  // 🔄 Notify parent of payload
  useEffect(() => {
    if (!onMessageReady) return;

    const hasTemplateParams = form.templateParams.some(
      val => val.trim() !== ""
    );
    const hasButtonParams = form.buttonParams.some(val => val.trim() !== "");

    const payload = {
      messageType: form.messageType,
      templateName: form.templateName,
      messageTemplate: previewMessage,
      templateVariables: hasTemplateParams
        ? Object.fromEntries(
            form.templateParams.map((val, idx) => [`${idx + 1}`, val.trim()])
          )
        : undefined,
      buttonParams: hasButtonParams
        ? form.buttonParams.map(p => p.trim()).filter(Boolean)
        : undefined,
      message: form.message,
    };

    const isValid =
      form.messageType === MessageType.Text
        ? form.message.trim().length > 0
        : form.templateName !== "";

    onMessageReady(isValid ? payload : null);
    // Only depend on form, templateBody, onMessageReady
    // eslint-disable-next-line
  }, [form, templateBody, onMessageReady]);

  return (
    <div className="bg-white p-6 rounded-md shadow space-y-5">
      <h3 className="text-lg font-semibold text-purple-600">
        ✍️ Compose Message
      </h3>

      {/* Mode switch */}
      <div className="flex gap-3">
        <button
          type="button"
          className={`px-4 py-1.5 rounded-md text-sm transition ${
            mode === MessageType.Template
              ? "bg-purple-600 text-white"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
          onClick={() => {
            setForm({
              messageType: MessageType.Template,
              templateName: "",
              message: "",
              templateParams: [],
              buttonParams: [],
            });
            setSelectedTemplate(null);
            setTemplateBody("");
            setMode(MessageType.Template);
          }}
        >
          Use Template
        </button>

        <button
          type="button"
          className={`px-4 py-1.5 rounded-md text-sm transition ${
            mode === MessageType.Text
              ? "bg-purple-600 text-white"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
          onClick={() => {
            setForm({
              messageType: MessageType.Text,
              templateName: "",
              message: "",
              templateParams: [],
              buttonParams: [],
            });
            setSelectedTemplate(null);
            setTemplateBody("");
            setMode(MessageType.Text);
          }}
        >
          Free Text
        </button>
      </div>

      {/* Template mode fields */}
      {mode === MessageType.Template && (
        <>
          <select
            value={form.templateName}
            onChange={handleTemplateChange}
            className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">-- Select Template --</option>
            {templates.map(t => (
              <option key={t.name} value={t.name}>
                {t.name} ({t.language})
              </option>
            ))}
          </select>

          <div className="text-sm bg-gray-50 p-3 rounded-md border border-gray-300 whitespace-pre-wrap text-gray-700">
            {templateBody || "No template selected"}
          </div>

          {form.templateParams.map((val, idx) => (
            <input
              key={idx}
              type="text"
              value={val}
              onChange={e => updateParam(idx, e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 mt-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder={`Text Param ${idx + 1}`}
            />
          ))}

          {selectedTemplate?.buttons?.map((btn, idx) => (
            <input
              key={`btn-${idx}`}
              type="text"
              value={form.buttonParams[idx]}
              onChange={e => updateButtonParam(idx, e.target.value)}
              className="w-full border border-purple-300 px-3 py-2 mt-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder={`Button Param for "${btn.text}"`}
            />
          ))}
        </>
      )}

      {/* Text message mode */}
      {mode === MessageType.Text && (
        <textarea
          rows={4}
          value={form.message}
          onChange={e =>
            setForm(prev => ({ ...prev, message: e.target.value }))
          }
          className="w-full border border-gray-300 px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
          placeholder="Type your WhatsApp message here..."
        />
      )}

      {/* Preview */}
      <div className="bg-gray-50 p-4 rounded-md border border-dashed border-gray-300 text-sm text-gray-700">
        <p className="font-semibold mb-2">👁️ Live Preview</p>
        <p className="whitespace-pre-wrap">{previewMessage}</p>
      </div>
    </div>
  );
}

export default MessageComposer;

// import React, { useEffect, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { MessageType } from "../../constants/messageTypes";

// function MessageComposer({ onMessageReady }) {
//   const [templates, setTemplates] = useState([]);
//   const [templateBody, setTemplateBody] = useState("");
//   const [selectedTemplate, setSelectedTemplate] = useState(null);
//   const [mode, setMode] = useState(MessageType.Template);

//   const [form, setForm] = useState({
//     messageType: MessageType.Template,
//     templateName: "",
//     message: "",
//     templateParams: [],
//     buttonParams: [],
//   });

//   // 🚀 Load Templates
//   useEffect(() => {
//     const loadTemplates = async () => {
//       try {
//         const businessId = localStorage.getItem("businessId");
//         if (!businessId) {
//           toast.error("❌ BusinessId not found.");
//           return;
//         }

//         const response = await axiosClient.get(
//           `/WhatsAppTemplateFetcher/get-template-all/`
//         );

//         if (response.data.success && Array.isArray(response.data.templates)) {
//           setTemplates(response.data.templates);

//           if (!form.templateName && response.data.templates.length > 0) {
//             handleTemplateChange({
//               target: { value: response.data.templates[0].name },
//             });
//           }
//         } else {
//           toast.error("⚠️ Unexpected templates response format.");
//         }
//       } catch (err) {
//         console.error(err);
//         toast.error("❌ Failed to load templates.");
//       }
//     };

//     loadTemplates();
//   }, []);

//   // 🔍 Count placeholder params like {{1}}, {{2}}
//   const extractParamCount = body => {
//     const matches = body?.match(/{{\d+}}/g) || [];
//     return [...new Set(matches)].length;
//   };

//   // 🔄 Handle template selection
//   const handleTemplateChange = e => {
//     const selectedName = e.target.value;
//     const template = templates.find(t => t.name === selectedName);

//     if (!selectedName || !template) {
//       toast.warn("⚠️ Please select a valid template.");
//       return;
//     }

//     const body = template.body || "";
//     const paramCount = extractParamCount(body);
//     const buttonParamCount = template.buttons?.length || 0;

//     setForm(prev => ({
//       ...prev,
//       messageType: MessageType.Template,
//       templateName: selectedName,
//       message: "",
//       templateParams: Array(paramCount).fill(""),
//       buttonParams: Array(buttonParamCount).fill(""),
//     }));

//     setSelectedTemplate(template);
//     setTemplateBody(body);
//     setMode(MessageType.Template);
//   };

//   const updateParam = (index, value) => {
//     setForm(prev => {
//       const updated = [...prev.templateParams];
//       updated[index] = value;
//       return { ...prev, templateParams: updated };
//     });
//   };

//   const updateButtonParam = (index, value) => {
//     setForm(prev => {
//       const updated = [...prev.buttonParams];
//       updated[index] = value;
//       return { ...prev, buttonParams: updated };
//     });
//   };

//   // 🔍 Live preview generator
//   const generatePreview = (template, paramValues) => {
//     if (!template) return "";
//     return template.replace(/{{(\d+)}}/g, (_, p1) => {
//       const index = parseInt(p1, 10) - 1;
//       return paramValues[index] || `{{${p1}}}`;
//     });
//   };

//   const previewMessage =
//     mode === MessageType.Template
//       ? generatePreview(templateBody, form.templateParams)
//       : form.message.trim();

//   // 🔄 Notify parent of payload
//   useEffect(() => {
//     if (!onMessageReady) return;

//     const hasTemplateParams = form.templateParams.some(
//       val => val.trim() !== ""
//     );
//     const hasButtonParams = form.buttonParams.some(val => val.trim() !== "");

//     const payload = {
//       messageType: form.messageType,
//       templateName: form.templateName,
//       messageTemplate: previewMessage,
//       templateVariables: hasTemplateParams
//         ? Object.fromEntries(
//             form.templateParams.map((val, idx) => [`${idx + 1}`, val.trim()])
//           )
//         : undefined,
//       buttonParams: hasButtonParams
//         ? form.buttonParams.map(p => p.trim()).filter(Boolean)
//         : undefined,
//       message: form.message,
//     };

//     const isValid =
//       form.messageType === MessageType.Text
//         ? form.message.trim().length > 0
//         : form.templateName !== "";

//     onMessageReady(isValid ? payload : null);
//   }, [form, templateBody, onMessageReady]);

//   return (
//     <div className="bg-white p-6 rounded-md shadow space-y-5">
//       <h3 className="text-lg font-semibold text-purple-600">
//         ✍️ Compose Message
//       </h3>

//       {/* Mode switch */}
//       <div className="flex gap-3">
//         <button
//           type="button"
//           className={`px-4 py-1.5 rounded-md text-sm transition ${
//             mode === MessageType.Template
//               ? "bg-purple-600 text-white"
//               : "bg-gray-200 text-gray-800 hover:bg-gray-300"
//           }`}
//           onClick={() => {
//             setForm({
//               messageType: MessageType.Template,
//               templateName: "",
//               message: "",
//               templateParams: [],
//               buttonParams: [],
//             });
//             setSelectedTemplate(null);
//             setTemplateBody("");
//             setMode(MessageType.Template);
//           }}
//         >
//           Use Template
//         </button>

//         <button
//           type="button"
//           className={`px-4 py-1.5 rounded-md text-sm transition ${
//             mode === MessageType.Text
//               ? "bg-purple-600 text-white"
//               : "bg-gray-200 text-gray-800 hover:bg-gray-300"
//           }`}
//           onClick={() => {
//             setForm({
//               messageType: MessageType.Text,
//               templateName: "",
//               message: "",
//               templateParams: [],
//               buttonParams: [],
//             });
//             setSelectedTemplate(null);
//             setTemplateBody("");
//             setMode(MessageType.Text);
//           }}
//         >
//           Free Text
//         </button>
//       </div>

//       {/* Template mode fields */}
//       {mode === MessageType.Template && (
//         <>
//           <select
//             value={form.templateName}
//             onChange={handleTemplateChange}
//             className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
//           >
//             <option value="">-- Select Template --</option>
//             {templates.map(t => (
//               <option key={t.name} value={t.name}>
//                 {t.name} ({t.language})
//               </option>
//             ))}
//           </select>

//           <div className="text-sm bg-gray-50 p-3 rounded-md border border-gray-300 whitespace-pre-wrap text-gray-700">
//             {templateBody || "No template selected"}
//           </div>

//           {form.templateParams.map((val, idx) => (
//             <input
//               key={idx}
//               type="text"
//               value={val}
//               onChange={e => updateParam(idx, e.target.value)}
//               className="w-full border border-gray-300 px-3 py-2 mt-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
//               placeholder={`Text Param ${idx + 1}`}
//             />
//           ))}

//           {selectedTemplate?.buttons?.map((btn, idx) => (
//             <input
//               key={`btn-${idx}`}
//               type="text"
//               value={form.buttonParams[idx]}
//               onChange={e => updateButtonParam(idx, e.target.value)}
//               className="w-full border border-purple-300 px-3 py-2 mt-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
//               placeholder={`Button Param for "${btn.text}"`}
//             />
//           ))}
//         </>
//       )}

//       {/* Text message mode */}
//       {mode === MessageType.Text && (
//         <textarea
//           rows={4}
//           value={form.message}
//           onChange={e =>
//             setForm(prev => ({ ...prev, message: e.target.value }))
//           }
//           className="w-full border border-gray-300 px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
//           placeholder="Type your WhatsApp message here..."
//         />
//       )}

//       {/* Preview */}
//       <div className="bg-gray-50 p-4 rounded-md border border-dashed border-gray-300 text-sm text-gray-700">
//         <p className="font-semibold mb-2">👁️ Live Preview</p>
//         <p className="whitespace-pre-wrap">{previewMessage}</p>
//       </div>
//     </div>
//   );
// }

// export default MessageComposer;
