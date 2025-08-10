import React, { useEffect, useState } from "react";
import axiosClient from "../../../api/axiosClient";
import { toast } from "react-toastify";

function StepContactSelect({ selectedContactIds = [], onChange }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🧠 Fetch all contacts with tags
  const fetchContacts = async () => {
    try {
      const res = await axiosClient.get("/contacts");
      setContacts(res.data || []);
    } catch (err) {
      toast.error("❌ Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const isSelected = id => selectedContactIds.includes(id);

  const toggleContact = id => {
    if (isSelected(id)) {
      onChange(selectedContactIds.filter(cid => cid !== id));
    } else {
      onChange([...selectedContactIds, id]);
    }
  };

  const handleSelectAll = () => {
    const allIds = contacts.map(c => c.id);
    onChange(allIds);
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  return (
    <div className="bg-white p-6 rounded shadow space-y-4">
      <h2 className="text-xl font-semibold text-purple-700">
        👥 Step 2: Select Contacts
      </h2>

      {loading ? (
        <p>⏳ Loading contacts...</p>
      ) : contacts.length === 0 ? (
        <p className="text-gray-500">🚫 No contacts available.</p>
      ) : (
        <>
          <div className="flex gap-4 mb-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
            >
              ✅ Select All
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm"
            >
              ❌ Deselect All
            </button>
            <span className="text-sm text-gray-500">
              Selected: {selectedContactIds.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[350px] overflow-y-auto border rounded p-2">
            {contacts.map(contact => (
              <div
                key={contact.id}
                className="p-2 rounded border hover:bg-gray-50 transition"
              >
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected(contact.id)}
                    onChange={() => toggleContact(contact.id)}
                  />
                  {contact.name} ({contact.phoneNumber})
                </label>

                {/* 🏷️ Tag chips display */}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1 pl-6">
                    {contact.tags.map(tag => (
                      <span
                        key={tag.id}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default StepContactSelect;
