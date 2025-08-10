import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export default function ContactFormModal({
  isOpen,
  onClose,
  contact,
  onSaveComplete,
}) {
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    leadSource: "",
    notes: "",
    lastContactedAt: "",
    nextFollowUpAt: "",
    tags: [],
  });

  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    axios
      .get("/api/tags")
      .then(res => {
        const tags = res.data?.data || res.data || [];
        if (Array.isArray(tags)) {
          setAllTags(tags);
        } else {
          toast.error("❌ Invalid tag format");
        }
      })
      .catch(() => toast.error("❌ Failed to load tags"));
  }, []);

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || "",
        phoneNumber: contact.phoneNumber || "",
        email: contact.email || "",
        leadSource: contact.leadSource || "",
        notes: contact.notes || "",
        lastContactedAt: contact.lastContactedAt
          ? new Date(contact.lastContactedAt).toISOString().slice(0, 16)
          : "",
        nextFollowUpAt: contact.nextFollowUpAt
          ? new Date(contact.nextFollowUpAt).toISOString().slice(0, 16)
          : "",
        tags: contact.tags?.map(t => t.tagId) || [],
      });
    }
  }, [contact]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagChange = e => {
    const selected = Array.from(e.target.selectedOptions, opt => opt.value);
    setFormData(prev => ({ ...prev, tags: selected }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const mappedTags = formData.tags
      .map(id => {
        const tag = allTags.find(t => t.id === id);
        return tag ? { tagId: tag.id, tagName: tag.name } : null;
      })
      .filter(Boolean);

    const payload = {
      ...formData,
      tags: mappedTags,
      lastContactedAt: formData.lastContactedAt
        ? new Date(formData.lastContactedAt).toISOString()
        : null,
      nextFollowUpAt: formData.nextFollowUpAt
        ? new Date(formData.nextFollowUpAt).toISOString()
        : null,
    };

    try {
      if (contact?.id) {
        await axios.put(`/api/contacts/${contact.id}`, payload);
        toast.success("✅ Contact updated");
      } else {
        await axios.post("/api/contacts", payload); // ✅ Flat payload
        toast.success("✅ Contact added");
      }
      onSaveComplete?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to save contact");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
        >
          &times;
        </button>

        <h2 className="text-xl font-bold mb-4">
          {contact?.id ? "Edit Contact" : "Add New Contact"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name"
            required
            className="border px-3 py-2 rounded w-full"
          />
          <input
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="Phone Number"
            required
            className="border px-3 py-2 rounded w-full"
          />
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="border px-3 py-2 rounded w-full"
          />
          <input
            name="leadSource"
            value={formData.leadSource}
            onChange={handleChange}
            placeholder="Lead Source"
            className="border px-3 py-2 rounded w-full"
          />

          <select
            multiple
            value={formData.tags}
            onChange={handleTagChange}
            className="col-span-2 border px-3 py-2 rounded w-full h-24"
          >
            {Array.isArray(allTags) &&
              allTags.map(tag => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
          </select>

          <input
            type="datetime-local"
            name="lastContactedAt"
            value={formData.lastContactedAt}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
          />
          <input
            type="datetime-local"
            name="nextFollowUpAt"
            value={formData.nextFollowUpAt}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
          />
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Notes"
            className="col-span-2 border px-3 py-2 rounded w-full h-24"
          />

          <div className="col-span-2 flex justify-end">
            <button
              type="submit"
              className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
            >
              {contact?.id ? "Update Contact" : "Add Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
