import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

function ContactSelector({
  onSelectionChange,
  searchQuery,
  selectedSource,
  selectedTags,
}) {
  const [contacts, setContacts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const res = await axiosClient.get("/api/contacts");
      setContacts(res.data || []);
    } catch (err) {
      toast.error("❌ Failed to fetch contacts");
      console.error(err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const filtered = contacts.filter(contact => {
    const matchesSearch =
      contact.name?.toLowerCase().includes(searchQuery?.toLowerCase() || "") ||
      contact.phoneNumber?.includes(searchQuery || "") ||
      contact.email?.toLowerCase().includes(searchQuery?.toLowerCase() || "");

    const matchesLead = selectedSource
      ? contact.leadSource === selectedSource
      : true;

    const matchesTags = selectedTags.length
      ? selectedTags.every(tag => contact.tags?.some(t => t.tagName === tag))
      : true;

    return matchesSearch && matchesLead && matchesTags;
  });

  const handleCheckboxChange = (id, checked) => {
    const updated = checked
      ? [...selectedIds, id]
      : selectedIds.filter(i => i !== id);

    setSelectedIds(updated);
    onSelectionChange(filtered.filter(c => updated.includes(c.id)));
  };

  const handleSelectAll = () => {
    const allFilteredIds = filtered.map(c => c.id);
    const allSelected = allFilteredIds.every(id => selectedIds.includes(id));

    const updated = allSelected
      ? selectedIds.filter(id => !allFilteredIds.includes(id))
      : [...new Set([...selectedIds, ...allFilteredIds])];

    setSelectedIds(updated);
    onSelectionChange(filtered.filter(c => updated.includes(c.id)));
  };

  if (loadingContacts) {
    return (
      <div className="flex justify-center items-center py-10 text-gray-600">
        ⏳ Loading contacts...
      </div>
    );
  }

  if (!loadingContacts && contacts.length === 0) {
    return (
      <div className="flex justify-center items-center py-10 text-gray-600">
        😕 No contacts available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-md shadow-sm border border-gray-200">
        <table className="w-full text-sm text-gray-700">
          <thead className="bg-purple-50 text-gray-800 uppercase text-xs tracking-wide">
            <tr>
              <th className="p-2 text-left w-8">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    filtered.length > 0 &&
                    filtered.every(c => selectedIds.includes(c.id))
                  }
                />
              </th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Tags</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((contact, index) => (
              <tr
                key={contact.id}
                className={`border-b border-gray-200 ${
                  index % 2 === 0 ? "bg-gray-50" : ""
                } hover:bg-purple-50`}
              >
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(contact.id)}
                    onChange={e =>
                      handleCheckboxChange(contact.id, e.target.checked)
                    }
                  />
                </td>
                <td className="p-2">{contact.name}</td>
                <td className="p-2">{contact.phoneNumber}</td>
                <td className="p-2">
                  {contact.tags?.map(tag => (
                    <span
                      key={tag.tagId}
                      className="inline-block text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded mr-1 mb-1"
                    >
                      {tag.tagName}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-600 text-right pr-2">
        ✅ {selectedIds.length} selected out of {filtered.length} shown
      </div>
    </div>
  );
}

export default ContactSelector;
