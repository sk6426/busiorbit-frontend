import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axiosClient from "../../../api/axiosClient";
import TagFilterDropdown from "./TagFilterDropdown";

export default function ExistingContactsList({
  contacts,
  setContacts,
  selectedIds,
  setSelectedIds,
}) {
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [filterTags, setFilterTags] = useState([]);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const res =
          filterTags.length > 0
            ? await axiosClient.post("/contacts/filter-by-tags", {
                tagIds: filterTags,
              })
            : await axiosClient.get("/contacts/all");
        setContacts(res.data?.data || []);
      } catch {
        toast.error("Failed to load contacts");
      }
    };
    loadContacts();
  }, [filterTags, setContacts]);

  useEffect(() => {
    const result = contacts.filter(
      c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        (c.phoneNumber || c.phone || "").includes(search)
    );
    setFilteredContacts(result);
  }, [contacts, search]);

  const toggleContact = id => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <input
          className="border p-2 rounded-md w-full sm:w-1/3"
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <TagFilterDropdown
          selectedTags={filterTags}
          onChange={setFilterTags}
          category="All"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          {/* ... Your Table Head JSX ... */}
          <tbody>
            {filteredContacts.map(contact => (
              <tr key={contact.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(contact.id)}
                    onChange={() => toggleContact(contact.id)}
                  />
                </td>
                <td className="px-4 py-2">{contact.name || "Unnamed"}</td>
                <td className="px-4 py-2">
                  {contact.phoneNumber || contact.phone || "—"}
                </td>
                {/* ... Other table cells ... */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
