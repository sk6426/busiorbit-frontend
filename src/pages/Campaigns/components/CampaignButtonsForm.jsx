import React from "react";
import { FaTrash } from "react-icons/fa";

const defaultButton = {
  buttonText: "",
  buttonType: "url",
  targetUrl: "",
};

const CampaignButtonsForm = ({ buttons, onChange }) => {
  const handleChange = (index, field, value) => {
    const updated = [...buttons];
    updated[index][field] = value;
    onChange(updated);
  };

  const handleAdd = () => {
    if (buttons.length < 3) {
      onChange([...buttons, { ...defaultButton }]);
    }
  };

  const handleRemove = index => {
    const updated = [...buttons];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-4">
      <h3 className="text-md font-semibold mb-2">📎 Add up to 3 CTA Buttons</h3>

      {buttons.map((btn, index) => (
        <div
          key={index}
          className="grid grid-cols-12 gap-2 items-center mb-3 border p-3 rounded"
        >
          <div className="col-span-3">
            <input
              type="text"
              className="w-full border rounded px-2 py-1"
              placeholder="Title"
              value={btn.buttonText}
              onChange={e => handleChange(index, "buttonText", e.target.value)}
            />
          </div>
          <div className="col-span-3">
            <select
              className="w-full border rounded px-2 py-1"
              value={btn.buttonType}
              onChange={e => handleChange(index, "buttonType", e.target.value)}
            >
              <option value="url">🌐 URL</option>
              <option value="call">📞 Call</option>
              <option value="quick_reply">💬 Reply</option>
            </select>
          </div>
          <div className="col-span-5">
            <input
              type="text"
              className="w-full border rounded px-2 py-1"
              placeholder="Value (link or payload)"
              value={btn.targetUrl}
              onChange={e => handleChange(index, "targetUrl", e.target.value)}
            />
          </div>
          <div className="col-span-1 text-right">
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="text-red-500 hover:text-red-700"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAdd}
        disabled={buttons.length >= 3}
        className="bg-green-600 text-white px-4 py-2 rounded mt-2 hover:bg-green-700 disabled:opacity-50"
      >
        ➕ Add Button
      </button>
    </div>
  );
};

export default CampaignButtonsForm;

// import React from "react";
// import { FaTrash } from "react-icons/fa";

// const defaultButton = { title: "", type: "url", value: "" };

// const CampaignButtonsForm = ({ buttons, onChange }) => {
//   const handleChange = (index, field, value) => {
//     const updated = [...buttons];
//     updated[index][field] = value;
//     onChange(updated); // ✅ Corrected
//   };

//   const handleAdd = () => {
//     if (buttons.length < 3) {
//       onChange([...buttons, { ...defaultButton }]); // ✅ Corrected
//     }
//   };

//   const handleRemove = index => {
//     const updated = [...buttons];
//     updated.splice(index, 1);
//     onChange(updated); // ✅ Corrected
//   };

//   return (
//     <div className="bg-white rounded-lg shadow p-4 mt-4">
//       <h3 className="text-md font-semibold mb-2">📎 Add up to 3 CTA Buttons</h3>

//       {buttons.map((btn, index) => (
//         <div
//           key={index}
//           className="grid grid-cols-12 gap-2 items-center mb-3 border p-3 rounded"
//         >
//           <div className="col-span-3">
//             <input
//               type="text"
//               className="w-full border rounded px-2 py-1"
//               placeholder="Title"
//               value={btn.title}
//               onChange={e => handleChange(index, "title", e.target.value)}
//             />
//           </div>
//           <div className="col-span-3">
//             <select
//               className="w-full border rounded px-2 py-1"
//               value={btn.type}
//               onChange={e => handleChange(index, "type", e.target.value)}
//             >
//               <option value="url">🌐 URL</option>
//               <option value="call">📞 Call</option>
//               <option value="quick_reply">💬 Reply</option>
//             </select>
//           </div>
//           <div className="col-span-5">
//             <input
//               type="text"
//               className="w-full border rounded px-2 py-1"
//               placeholder="Value (link or payload)"
//               value={btn.value}
//               onChange={e => handleChange(index, "value", e.target.value)}
//             />
//           </div>
//           <div className="col-span-1 text-right">
//             <button
//               type="button"
//               onClick={() => handleRemove(index)}
//               className="text-red-500 hover:text-red-700"
//             >
//               <FaTrash />
//             </button>
//           </div>
//         </div>
//       ))}

//       <button
//         type="button"
//         onClick={handleAdd}
//         disabled={buttons.length >= 3}
//         className="bg-green-600 text-white px-4 py-2 rounded mt-2 hover:bg-green-700 disabled:opacity-50"
//       >
//         ➕ Add Button
//       </button>
//     </div>
//   );
// };

// export default CampaignButtonsForm;
