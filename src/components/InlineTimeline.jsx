import React, { useEffect, useState, useCallback } from "react";
import axiosClient from "../api/axiosClient";
import TimelineEntryCard from "./TimelineEntryCard";
import { toast } from "react-toastify";

function InlineTimeline({ contactId }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🆕 New: Filter
  const [filter, setFilter] = useState("All");

  // 🆕 Add entry form
  const [eventType, setEventType] = useState("");
  const [description, setDescription] = useState("");

  // ✅ useCallback for ESLint dependency fix
  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/leadtimeline/contact/${contactId}`);
      setTimeline(res.data);
    } catch (err) {
      toast.error("❌ Failed to load timeline");
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  const handleAdd = async () => {
    if (!eventType || !description) {
      toast.warn("⚠️ Please enter both event type and description.");
      return;
    }

    try {
      await axiosClient.post("/leadtimeline", {
        contactId,
        eventType,
        description,
        createdBy: "You",
        source: "Inline",
        category: "Manual",
        isSystemGenerated: false,
      });

      toast.success("✅ Timeline entry added");
      setEventType("");
      setDescription("");
      fetchTimeline();
    } catch (err) {
      toast.error("❌ Failed to add timeline entry");
    }
  };

  useEffect(() => {
    if (contactId) fetchTimeline();
  }, [contactId, fetchTimeline]); // Added fetchTimeline to deps

  // 🧠 Filtered list
  const filteredTimeline =
    filter === "All"
      ? timeline
      : timeline.filter(entry => entry.eventType === filter);

  if (!contactId) return null;

  return (
    <div className="bg-white rounded-xl shadow p-4 mt-4">
      <h3 className="text-lg font-bold mb-4">📜 Timeline</h3>

      {/* 🧾 Filter + Form */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="All">All</option>
          <option value="PhoneCall">Phone Call</option>
          <option value="ReminderSet">Reminder Set</option>
          <option value="NoteAdded">Note Added</option>
          <option value="CustomActivity">Custom Activity</option>
        </select>

        <input
          type="text"
          placeholder="Event Type"
          value={eventType}
          onChange={e => setEventType(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <button
          onClick={handleAdd}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          ➕ Add
        </button>
      </div>

      {/* Filtered Timeline List */}
      {loading ? (
        <p>Loading...</p>
      ) : filteredTimeline.length === 0 ? (
        <p className="text-gray-500">No entries for this filter.</p>
      ) : (
        filteredTimeline.map(entry => (
          <TimelineEntryCard key={entry.id} entry={entry} />
        ))
      )}
    </div>
  );
}

export default InlineTimeline;

// import React, { useEffect, useState } from "react";
// import axiosClient from "../api/axiosClient";
// import TimelineEntryCard from "./TimelineEntryCard";
// import { toast } from "react-toastify";

// function InlineTimeline({ contactId }) {
//   const [timeline, setTimeline] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // 🆕 New: Filter
//   const [filter, setFilter] = useState("All");

//   // 🆕 Add entry form
//   const [eventType, setEventType] = useState("");
//   const [description, setDescription] = useState("");

//   const fetchTimeline = async () => {
//     try {
//       setLoading(true);
//       const res = await axiosClient.get(`/leadtimeline/contact/${contactId}`);
//       setTimeline(res.data);
//     } catch (err) {
//       toast.error("❌ Failed to load timeline");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAdd = async () => {
//     if (!eventType || !description) {
//       toast.warn("⚠️ Please enter both event type and description.");
//       return;
//     }

//     try {
//       await axiosClient.post("/leadtimeline", {
//         contactId,
//         eventType,
//         description,
//         createdBy: "You",
//         source: "Inline",
//         category: "Manual",
//         isSystemGenerated: false,
//       });

//       toast.success("✅ Timeline entry added");
//       setEventType("");
//       setDescription("");
//       fetchTimeline();
//     } catch (err) {
//       toast.error("❌ Failed to add timeline entry");
//     }
//   };

//   useEffect(() => {
//     if (contactId) fetchTimeline();
//   }, [contactId]);

//   // 🧠 Filtered list
//   const filteredTimeline =
//     filter === "All"
//       ? timeline
//       : timeline.filter(entry => entry.eventType === filter);

//   if (!contactId) return null;

//   return (
//     <div className="bg-white rounded-xl shadow p-4 mt-4">
//       <h3 className="text-lg font-bold mb-4">📜 Timeline</h3>

//       {/* 🧾 Filter + Form */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
//         <select
//           value={filter}
//           onChange={e => setFilter(e.target.value)}
//           className="border rounded px-3 py-2"
//         >
//           <option value="All">All</option>
//           <option value="PhoneCall">Phone Call</option>
//           <option value="ReminderSet">Reminder Set</option>
//           <option value="NoteAdded">Note Added</option>
//           <option value="CustomActivity">Custom Activity</option>
//         </select>

//         <input
//           type="text"
//           placeholder="Event Type"
//           value={eventType}
//           onChange={e => setEventType(e.target.value)}
//           className="border rounded px-3 py-2"
//         />
//         <input
//           type="text"
//           placeholder="Description"
//           value={description}
//           onChange={e => setDescription(e.target.value)}
//           className="border rounded px-3 py-2"
//         />
//         <button
//           onClick={handleAdd}
//           className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
//         >
//           ➕ Add
//         </button>
//       </div>

//       {/* Filtered Timeline List */}
//       {loading ? (
//         <p>Loading...</p>
//       ) : filteredTimeline.length === 0 ? (
//         <p className="text-gray-500">No entries for this filter.</p>
//       ) : (
//         filteredTimeline.map(entry => (
//           <TimelineEntryCard key={entry.id} entry={entry} />
//         ))
//       )}
//     </div>
//   );
// }

// export default InlineTimeline;
