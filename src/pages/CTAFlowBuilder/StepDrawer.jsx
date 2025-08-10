import React, { useEffect, useState } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import axiosClient from "../../api/axiosClient";

export default function StepDrawer({
  step,
  templates,
  allSteps,
  onSave,
  onClose,
}) {
  const [templateBody, setTemplateBody] = useState("");
  const [formData, setFormData] = useState({
    id: step.id,
    buttonText: step.buttonText || "",
    templateName: step.templateName || "",
    stepOrder: step.stepOrder || 1,
    buttonLinks: step.buttonLinks || [],
  });

  // Sync when drawer is opened with a different step
  useEffect(() => {
    setFormData({
      id: step.id,
      buttonText: step.buttonText || "",
      templateName: step.templateName || "",
      stepOrder: step.stepOrder || 1,
      buttonLinks: step.buttonLinks || [],
    });
  }, [step]);

  // 🧠 Fetch template preview & buttons on template selection
  useEffect(() => {
    const fetchTemplateMeta = async () => {
      if (!formData.templateName) return;

      try {
        const res = await axiosClient.get(
          `/WhatsAppTemplateFetcher/get-template-by-name?name=${formData.templateName}`
        );
        setTemplateBody(res.data.body || "");

        // 💡 Only auto-fill buttons if user hasn't added any
        if (
          (formData.buttonLinks || []).length === 0 &&
          res.data.buttonParams?.length > 0
        ) {
          const filled = res.data.buttonParams.map(btn => ({
            ButtonText: btn.text,
            NextStepId: null,
          }));

          setFormData(prev => ({
            ...prev,
            buttonLinks: filled,
          }));
        }
      } catch (err) {
        toast.error("⚠️ Failed to load template preview");
        setTemplateBody("");
      }
    };

    fetchTemplateMeta();
  }, [formData.templateName, formData.buttonLinks]); // ✅ Added missing dependency

  const handleChangeButtonLink = (index, field, value) => {
    const updated = [...formData.buttonLinks];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setFormData({ ...formData, buttonLinks: updated });
  };

  const addButtonLink = () => {
    if (formData.buttonLinks.length >= 3) {
      toast.warn("⚠️ Maximum 3 buttons allowed.");
      return;
    }
    setFormData({
      ...formData,
      buttonLinks: [
        ...formData.buttonLinks,
        { ButtonText: "", NextStepId: null },
      ],
    });
  };

  const removeButtonLink = index => {
    const updated = formData.buttonLinks.filter((_, i) => i !== index);
    setFormData({ ...formData, buttonLinks: updated });
  };

  const handleSave = () => {
    if (!formData.templateName) {
      toast.error("❌ Template is required.");
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-5 overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-semibold text-purple-700">Edit Step</h2>

        {/* Select Template */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Template
          </label>
          <select
            value={formData.templateName}
            onChange={e =>
              setFormData({
                ...formData,
                templateName: e.target.value,
                buttonLinks: [],
              })
            }
            className="w-full border px-3 py-2 rounded-md shadow-sm"
          >
            <option value="">Select template</option>
            {templates.map(tpl => (
              <option key={tpl.name} value={tpl.name}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>

        {/* 🔍 Template Preview */}
        {templateBody && (
          <div className="bg-gray-50 border border-purple-100 p-3 rounded-md text-sm text-gray-700 shadow-sm">
            <p className="font-semibold text-purple-700 mb-1">
              📄 Message Preview:
            </p>
            <p>{templateBody}</p>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            CTA Buttons
          </label>

          {formData.buttonLinks.map((link, index) => (
            <div
              key={index}
              className="border rounded-md bg-gray-50 p-4 space-y-3"
            >
              <input
                type="text"
                placeholder="Button Text"
                value={link.ButtonText}
                onChange={e =>
                  handleChangeButtonLink(index, "ButtonText", e.target.value)
                }
                className="w-full border px-3 py-2 rounded-md shadow-sm"
              />

              <Select
                isClearable
                placeholder="Select next step"
                options={allSteps
                  .filter(s => s.id !== step.id)
                  .map(s => ({
                    value: s.id,
                    label: s.buttonText || s.templateName || "Unnamed Step",
                  }))}
                value={
                  link.NextStepId
                    ? {
                        value: link.NextStepId,
                        label:
                          allSteps.find(s => s.id === link.NextStepId)
                            ?.buttonText ||
                          allSteps.find(s => s.id === link.NextStepId)
                            ?.templateName ||
                          "Unknown",
                      }
                    : null
                }
                onChange={opt =>
                  handleChangeButtonLink(
                    index,
                    "NextStepId",
                    opt?.value || null
                  )
                }
              />

              <div className="flex justify-end">
                <button
                  className="text-xs text-red-500 underline hover:text-red-700"
                  onClick={() => removeButtonLink(index)}
                >
                  Remove Button
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addButtonLink}
            className="text-sm px-4 py-2 border border-purple-500 text-purple-700 rounded-md hover:bg-purple-50"
          >
            ➕ Add Button
          </button>
        </div>

        {/* Save + Cancel */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            className="px-4 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
            onClick={handleSave}
          >
            Save Step
          </button>
        </div>
      </div>
    </div>
  );
}

// import React, { useEffect, useState } from "react";
// import Select from "react-select";
// import { toast } from "react-toastify";
// import axiosClient from "../../api/axiosClient";

// export default function StepDrawer({
//   step,
//   templates,
//   allSteps,
//   onSave,
//   onClose,
// }) {
//   const [templateBody, setTemplateBody] = useState("");
//   const [formData, setFormData] = useState({
//     id: step.id,
//     buttonText: step.buttonText || "",
//     templateName: step.templateName || "",
//     stepOrder: step.stepOrder || 1,
//     buttonLinks: step.buttonLinks || [],
//   });

//   // Sync when drawer is opened with a different step
//   useEffect(() => {
//     setFormData({
//       id: step.id,
//       buttonText: step.buttonText || "",
//       templateName: step.templateName || "",
//       stepOrder: step.stepOrder || 1,
//       buttonLinks: step.buttonLinks || [],
//     });
//   }, [step]);

//   // 🧠 Fetch template preview & buttons on template selection
//   useEffect(() => {
//     const fetchTemplateMeta = async () => {
//       if (!formData.templateName) return;

//       try {
//         const res = await axiosClient.get(
//           `/WhatsAppTemplateFetcher/get-template-by-name?name=${formData.templateName}`
//         );
//         setTemplateBody(res.data.body || "");

//         // 💡 Only auto-fill buttons if user hasn't added any
//         if (
//           (formData.buttonLinks || []).length === 0 &&
//           res.data.buttonParams?.length > 0
//         ) {
//           const filled = res.data.buttonParams.map(btn => ({
//             ButtonText: btn.text,
//             NextStepId: null,
//           }));

//           setFormData(prev => ({
//             ...prev,
//             buttonLinks: filled,
//           }));
//         }
//       } catch (err) {
//         toast.error("⚠️ Failed to load template preview");
//         setTemplateBody("");
//       }
//     };

//     fetchTemplateMeta();
//   }, [formData.templateName]);

//   const handleChangeButtonLink = (index, field, value) => {
//     const updated = [...formData.buttonLinks];
//     updated[index] = {
//       ...updated[index],
//       [field]: value,
//     };
//     setFormData({ ...formData, buttonLinks: updated });
//   };

//   const addButtonLink = () => {
//     if (formData.buttonLinks.length >= 3) {
//       toast.warn("⚠️ Maximum 3 buttons allowed.");
//       return;
//     }
//     setFormData({
//       ...formData,
//       buttonLinks: [
//         ...formData.buttonLinks,
//         { ButtonText: "", NextStepId: null },
//       ],
//     });
//   };

//   const removeButtonLink = index => {
//     const updated = formData.buttonLinks.filter((_, i) => i !== index);
//     setFormData({ ...formData, buttonLinks: updated });
//   };

//   const handleSave = () => {
//     if (!formData.templateName) {
//       toast.error("❌ Template is required.");
//       return;
//     }
//     onSave(formData);
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
//       <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-5 overflow-y-auto max-h-[90vh]">
//         <h2 className="text-xl font-semibold text-purple-700">Edit Step</h2>

//         {/* Select Template */}
//         <div className="space-y-1">
//           <label className="block text-sm font-medium text-gray-700">
//             Template
//           </label>
//           <select
//             value={formData.templateName}
//             onChange={e =>
//               setFormData({
//                 ...formData,
//                 templateName: e.target.value,
//                 buttonLinks: [],
//               })
//             }
//             className="w-full border px-3 py-2 rounded-md shadow-sm"
//           >
//             <option value="">Select template</option>
//             {templates.map(tpl => (
//               <option key={tpl.name} value={tpl.name}>
//                 {tpl.name}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* 🔍 Template Preview */}
//         {templateBody && (
//           <div className="bg-gray-50 border border-purple-100 p-3 rounded-md text-sm text-gray-700 shadow-sm">
//             <p className="font-semibold text-purple-700 mb-1">
//               📄 Message Preview:
//             </p>
//             <p>{templateBody}</p>
//           </div>
//         )}

//         {/* CTA Buttons */}
//         <div className="space-y-3">
//           <label className="block text-sm font-medium text-gray-700">
//             CTA Buttons
//           </label>

//           {formData.buttonLinks.map((link, index) => (
//             <div
//               key={index}
//               className="border rounded-md bg-gray-50 p-4 space-y-3"
//             >
//               <input
//                 type="text"
//                 placeholder="Button Text"
//                 value={link.ButtonText}
//                 onChange={e =>
//                   handleChangeButtonLink(index, "ButtonText", e.target.value)
//                 }
//                 className="w-full border px-3 py-2 rounded-md shadow-sm"
//               />

//               <Select
//                 isClearable
//                 placeholder="Select next step"
//                 options={allSteps
//                   .filter(s => s.id !== step.id)
//                   .map(s => ({
//                     value: s.id,
//                     label: s.buttonText || s.templateName || "Unnamed Step",
//                   }))}
//                 value={
//                   link.NextStepId
//                     ? {
//                         value: link.NextStepId,
//                         label:
//                           allSteps.find(s => s.id === link.NextStepId)
//                             ?.buttonText ||
//                           allSteps.find(s => s.id === link.NextStepId)
//                             ?.templateName ||
//                           "Unknown",
//                       }
//                     : null
//                 }
//                 onChange={opt =>
//                   handleChangeButtonLink(
//                     index,
//                     "NextStepId",
//                     opt?.value || null
//                   )
//                 }
//               />

//               <div className="flex justify-end">
//                 <button
//                   className="text-xs text-red-500 underline hover:text-red-700"
//                   onClick={() => removeButtonLink(index)}
//                 >
//                   Remove Button
//                 </button>
//               </div>
//             </div>
//           ))}

//           <button
//             onClick={addButtonLink}
//             className="text-sm px-4 py-2 border border-purple-500 text-purple-700 rounded-md hover:bg-purple-50"
//           >
//             ➕ Add Button
//           </button>
//         </div>

//         {/* Save + Cancel */}
//         <div className="flex justify-end gap-3 pt-4">
//           <button
//             className="px-4 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
//             onClick={onClose}
//           >
//             Cancel
//           </button>
//           <button
//             className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
//             onClick={handleSave}
//           >
//             Save Step
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
