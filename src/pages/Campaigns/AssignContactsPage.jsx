import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import Papa from "papaparse";
import Modal from "react-modal";
// ❌ removed: WhatsAppBubblePreview
import TagFilterDropdown from "./components/TagFilterDropdown";

if (typeof document !== "undefined" && process.env.NODE_ENV !== "test") {
  Modal.setAppElement("#root");
}

export default function AssignContactsPage() {
  const { id: campaignId } = useParams();
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [tags, setTags] = useState([]);
  const [campaign, setCampaign] = useState(null);

  const [showFieldMapModal, setShowFieldMapModal] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [fieldMapping, setFieldMapping] = useState({ name: "", phone: "" });
  const [parsedCSV, setParsedCSV] = useState([]);
  const [importedCount, setImportedCount] = useState(0);
  const [saveToDb, setSaveToDb] = useState(true);
  const [selectedTagId, setSelectedTagId] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [setIsImporting] = useState(false);

  const importedRef = useRef(null);

  // ✅ Helper for consistent phone extraction
  function getPhone(contact) {
    return contact.phoneNumber || contact.phone || "";
  }

  useEffect(() => {
    loadCampaign();
    fetchAllTags();
    // eslint-disable-next-line
  }, [campaignId]);

  useEffect(() => {
    loadContacts();
    // eslint-disable-next-line
  }, [tags]);

  useEffect(() => {
    applySearchFilter();
    // eslint-disable-next-line
  }, [contacts, search]);

  const loadCampaign = async () => {
    if (!campaignId) {
      toast.error("No campaign ID found in URL.");
      return;
    }
    try {
      const res = await axiosClient.get(`/campaign/${campaignId}`);
      setCampaign(res.data);
      // console.log("Loaded campaign:", res.data);
    } catch (err) {
      console.error("Failed to load campaign:", err);
      toast.error("Failed to load campaign");
    }
  };

  const fetchAllTags = async () => {
    try {
      const res = await axiosClient.get("/tags/get-tags");
      const tags = res.data?.data || res.data || [];
      setAllTags(tags);
    } catch {
      toast.error("Failed to load tags");
    }
  };

  const loadContacts = async () => {
    try {
      let res;
      if (tags.length > 0) {
        res = await axiosClient.post("/contacts/filter-by-tags", tags);
        setContacts(res.data?.data || []);
      } else {
        res = await axiosClient.get("/contacts", {
          params: { tab: "all", page: 1, pageSize: 1000 },
        });
        setContacts(res.data?.data?.items || []);
      }
    } catch {
      toast.error("Failed to load contacts");
    }
  };

  const applySearchFilter = () => {
    const result = contacts.filter(
      c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        getPhone(c).includes(search)
    );
    setFilteredContacts(result);
  };

  const toggleContact = id => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const filteredIds = filteredContacts.map(c => c.id);
    const allSelected = filteredIds.every(id => selectedIds.includes(id));
    setSelectedIds(prev =>
      allSelected
        ? prev.filter(id => !filteredIds.includes(id))
        : [...new Set([...prev, ...filteredIds])]
    );
  };

  const handleFileUpload = e => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        const headers = Object.keys(results.data[0] || {});
        setParsedCSV(results.data);
        setCsvHeaders(headers);
        setShowFieldMapModal(true);
      },
      error: function () {
        toast.error("CSV Parsing Failed");
      },
    });
  };

  useEffect(() => {
    if (csvHeaders.length > 0) {
      const suggestions = {
        name: ["name", "full name", "contact name"],
        phone: ["phone", "mobile", "number", "whatsapp"],
      };
      const bestMatch = fieldOptions =>
        csvHeaders.find(h =>
          fieldOptions.some(option =>
            h.toLowerCase().includes(option.toLowerCase())
          )
        ) || "";
      setFieldMapping({
        name: bestMatch(suggestions.name),
        phone: bestMatch(suggestions.phone),
      });
    }
  }, [csvHeaders]);

  const applyFieldMapping = async () => {
    const mapped = parsedCSV
      .filter(row => row[fieldMapping.name] && row[fieldMapping.phone])
      .map(row => ({
        id: crypto.randomUUID(),
        name: row[fieldMapping.name],
        phone: row[fieldMapping.phone],
        tags: selectedTagId
          ? [
              {
                tagId: selectedTagId,
                tagName: allTags.find(t => t.id === selectedTagId)?.name || "",
              },
            ]
          : [],
      }));

    setContacts(prev => [...prev, ...mapped]);
    setSelectedIds(prev => [...new Set([...prev, ...mapped.map(c => c.id)])]);
    setImportedCount(mapped.length);
    setShowFieldMapModal(false);
    toast.success(`${mapped.length} contacts imported.`);

    setTimeout(() => {
      if (importedRef.current) {
        importedRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 200);

    if (saveToDb) {
      try {
        setIsImporting(true);
        await axiosClient.post("/contacts/bulk-import", mapped);
        toast.success("Contacts also saved to your CRM.");
      } catch {
        toast.error("Saving to CRM failed.");
      } finally {
        setIsImporting(false);
      }
    }
  };

  const assignContacts = async () => {
    if (!campaign || !campaign.id) {
      toast.error("Campaign not ready. Please try again.");
      return;
    }
    if (selectedIds.length === 0) {
      toast.warn("Please select at least one contact");
      return;
    }

    const validIds = selectedIds.filter(id =>
      contacts.find(c => c.id === id && getPhone(c).trim() !== "")
    );

    if (validIds.length === 0) {
      toast.warn("No selected contacts have valid phone numbers.");
      return;
    }

    try {
      const payload = { contactIds: validIds };
      await axiosClient.post(
        `/campaign/${campaign.id}/assign-contacts`,
        payload
      );
      toast.success("Contacts assigned to campaign");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Something went wrong during assignment.";
      toast.error(message);
    }
  };

  const allVisibleSelected = filteredContacts.every(c =>
    selectedIds.includes(c.id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-purple-600 mb-6 flex items-center gap-2">
        🎯 Assign Contacts to Campaign
      </h1>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <input
          className="border p-2 rounded-md w-full sm:w-1/3"
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <TagFilterDropdown
          selectedTags={tags}
          onChange={setTags}
          category="All"
        />
        <label className="cursor-pointer text-purple-600 hover:underline text-sm sm:ml-auto">
          + Upload CSV
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      <div
        className="bg-white rounded-xl shadow-sm overflow-x-auto"
        ref={importedRef}
      >
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2 text-center">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Phone</th>
              <th className="px-4 py-2 text-left">Tags</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
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
                <td className="px-4 py-2">{getPhone(contact) || "—"}</td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {(contact.tags || contact.contactTags || []).map(tag => (
                      <span
                        key={tag.tagId || tag.id}
                        className="px-2 py-0.5 text-xs rounded-full"
                        style={{
                          backgroundColor: tag.colorHex || "#E5E7EB",
                          color: "#000",
                        }}
                      >
                        {tag.tagName || tag.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2">
                  {getPhone(contact).trim() !== "" ? "✅ Valid" : "⚠️ No Phone"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600">
        <div>
          Selected: {selectedIds.length} / WhatsApp-ready:{" "}
          {
            filteredContacts.filter(
              c => selectedIds.includes(c.id) && getPhone(c).trim() !== ""
            ).length
          }
        </div>
        {importedCount > 0 && (
          <div className="text-green-600">
            ✔ Imported: {importedCount} contact(s)
          </div>
        )}
      </div>

      {/* ❌ Preview removed */}

      <div className="mt-6 flex justify-end">
        <button
          onClick={assignContacts}
          disabled={false}
          className="px-6 py-3 rounded-lg transition bg-purple-600 text-white hover:bg-purple-700"
        >
          Assign to Campaign
        </button>
      </div>

      <Modal
        isOpen={showFieldMapModal}
        onRequestClose={() => setShowFieldMapModal(false)}
        className="bg-white rounded-lg shadow-lg max-w-xl mx-auto mt-20 p-6"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      >
        <h2 className="text-lg font-bold mb-4">🧩 Map CSV Fields</h2>
        <div className="space-y-4">
          {["name", "phone"].map(field => (
            <div key={field}>
              <label className="block text-sm font-medium mb-1 capitalize">
                {field}
              </label>
              <select
                className="border px-3 py-2 rounded w-full"
                value={fieldMapping[field]}
                onChange={e =>
                  setFieldMapping(prev => ({
                    ...prev,
                    [field]: e.target.value,
                  }))
                }
              >
                <option value="">-- Select CSV column --</option>
                {csvHeaders.map(header => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-1">
              Apply Tag to All
            </label>
            <select
              className="border px-3 py-2 rounded w-full"
              value={selectedTagId || ""}
              onChange={e => setSelectedTagId(e.target.value)}
            >
              <option value="">-- None --</option>
              {Array.isArray(allTags) &&
                allTags.map(tag => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={saveToDb}
              onChange={e => setSaveToDb(e.target.checked)}
            />
            Also save these contacts to your CRM
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="text-gray-600 hover:underline"
            onClick={() => setShowFieldMapModal(false)}
          >
            Cancel
          </button>
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded-md"
            onClick={applyFieldMapping}
          >
            Import & Apply
          </button>
        </div>
      </Modal>
    </div>
  );
}
