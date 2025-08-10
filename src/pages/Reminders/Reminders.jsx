import React, { useState } from "react";
import ReminderForm from "./ReminderForm";
import ReminderList from "./ReminderList";

function Reminders() {
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleEdit = reminder => {
    setSelectedReminder(reminder);
    setIsDrawerOpen(true);
  };

  const handleAddNew = () => {
    setSelectedReminder(null);
    setIsDrawerOpen(true);
  };

  const handleSaveComplete = () => {
    setIsDrawerOpen(false);
    setSelectedReminder(null);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-4 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Reminders</h2>
        <button
          onClick={handleAddNew}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg"
        >
          ➕ Add Reminder
        </button>
      </div>

      {/* Reminder Cards */}
      <ReminderList onEdit={handleEdit} refreshKey={refreshKey} />

      {/* Drawer */}
      {isDrawerOpen && (
        <div className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl z-50 transition-transform duration-300 border-l overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-bold">
              {selectedReminder ? "Edit Reminder" : "Add Reminder"}
            </h2>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="text-gray-500 text-xl"
            >
              ×
            </button>
          </div>
          <div className="p-4">
            <ReminderForm
              selectedReminder={selectedReminder}
              onSaveComplete={handleSaveComplete}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Reminders;

// import React, { useState } from "react";
// import ReminderForm from "./ReminderForm";
// import ReminderList from "./ReminderList";

// function Reminders() {
//   const [selectedReminder, setSelectedReminder] = useState(null);
//   const [refreshKey, setRefreshKey] = useState(0); // used to refresh list

//   const handleEdit = reminder => {
//     setSelectedReminder(reminder);
//   };

//   const handleSaveComplete = () => {
//     setSelectedReminder(null);
//     setRefreshKey(prev => prev + 1);
//   };

//   return (
//     <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
//       {/* Left: Form */}
//       <div className="bg-white rounded-2xl shadow-md p-4">
//         <h2 className="text-xl font-semibold mb-2">
//           {selectedReminder ? "Edit Reminder" : "Add Reminder"}
//         </h2>
//         <ReminderForm
//           selectedReminder={selectedReminder}
//           onSaveComplete={handleSaveComplete}
//         />
//       </div>

//       {/* Right: List */}
//       <div className="bg-white rounded-2xl shadow-md p-4">
//         <h2 className="text-xl font-semibold mb-2">Reminder List</h2>
//         <ReminderList onEdit={handleEdit} refreshKey={refreshKey} />
//       </div>
//     </div>
//   );
// }

// export default Reminders;
