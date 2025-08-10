import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import TimelineEntryCard from "../../components/TimelineEntryCard";
import { toast } from "react-toastify";

const LeadTimeline = () => {
  const { contactId } = useParams();
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("");
  const [eventType, setEventType] = useState("");
  const [description, setDescription] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Wrap in useCallback!
  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      const url = contactId
        ? `/leadtimeline/contact/${contactId}`
        : `/leadtimeline`;
      const response = await axiosClient.get(url);
      setTimeline(response.data);
    } catch (error) {
      // handled globally
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await axiosClient.get("/contacts");
      setContacts(res.data || []);
    } catch (err) {
      toast.error("❌ Failed to load contacts for filtering");
    }
  }, []);

  const handleAddTimeline = async () => {
    if (!eventType || !description) {
      toast.warn("Please fill in both fields.");
      return;
    }
    try {
      await axiosClient.post("/leadtimeline", {
        contactId,
        eventType,
        description,
        createdBy: "You",
        source: "UI",
        category: "Manual",
        isSystemGenerated: false,
      });
      toast.success("✅ Timeline entry added");
      setEventType("");
      setDescription("");
      fetchTimeline();
    } catch (err) {
      console.error("Failed to add entry:", err);
    }
  };

  // 2. Add fetchTimeline & fetchContacts to dependencies!
  useEffect(() => {
    fetchTimeline();
    fetchContacts();
  }, [fetchTimeline, fetchContacts]);

  // ... (rest is unchanged)
  const filteredTimeline = timeline.filter(entry => {
    const contactMatch = selectedContactId
      ? entry.contactId === selectedContactId
      : true;
    const typeMatch = selectedEventType
      ? entry.eventType === selectedEventType
      : true;
    return contactMatch && typeMatch;
  });

  const totalPages = Math.ceil(filteredTimeline.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTimeline = filteredTimeline.slice(
    startIndex,
    startIndex + pageSize
  );

  const handlePageChange = direction => {
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (direction === "next" && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageSizeChange = e => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1); // reset to page 1
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Lead Timeline</h1>
      {/* ... (rest unchanged) */}
      {/* 🔍 Filter Bar */}
      <div className="bg-white rounded shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          value={selectedContactId}
          onChange={e => setSelectedContactId(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Contacts</option>
          {contacts.map(contact => (
            <option key={contact.id} value={contact.id}>
              {contact.name} ({contact.phoneNumber})
            </option>
          ))}
        </select>
        <select
          value={selectedEventType}
          onChange={e => setSelectedEventType(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Event Types</option>
          <option value="PhoneCall">📞 Phone Call</option>
          <option value="ReminderSet">⏰ Reminder Set</option>
          <option value="NoteAdded">📝 Note Added</option>
          <option value="CustomActivity">⚙️ Custom Activity</option>
        </select>
        <button
          onClick={() => {
            setSelectedContactId("");
            setSelectedEventType("");
          }}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
        >
          Reset Filters
        </button>
      </div>

      {/* ➕ Add Entry Form */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Add Timeline Entry</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Event Type (e.g., Phone Call)"
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
            onClick={handleAddTimeline}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            ➕ Add Entry
          </button>
        </div>
      </div>

      {/* 🔢 Pagination Controls */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <label className="text-sm text-gray-600 mr-2">Show:</label>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="ml-2 text-sm text-gray-600">entries per page</span>
        </div>
        <div className="space-x-2">
          <button
            onClick={() => handlePageChange("prev")}
            className="text-sm px-3 py-1 border rounded bg-gray-200 hover:bg-gray-300"
            disabled={currentPage === 1}
          >
            ⬅ Prev
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange("next")}
            className="text-sm px-3 py-1 border rounded bg-gray-200 hover:bg-gray-300"
            disabled={currentPage === totalPages}
          >
            Next ➡
          </button>
        </div>
      </div>

      {/* Timeline List */}
      {loading ? (
        <p>Loading...</p>
      ) : paginatedTimeline.length > 0 ? (
        paginatedTimeline.map(entry => (
          <TimelineEntryCard key={entry.id} entry={entry} />
        ))
      ) : (
        <p className="text-gray-500">No timeline entries match your filters.</p>
      )}
    </div>
  );
};

export default LeadTimeline;
