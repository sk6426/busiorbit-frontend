import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

function ContactForm({ contact, onSaveComplete }) {
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    leadSource: "",
    notes: "",
    lastContactedAt: "",
    nextFollowUpAt: "",
    tags: [], // Now array of tag IDs
  });

  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    // Load all tags from DB
    axios
      .get("/api/tags")
      .then(res => setAllTags(res.data))
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
        lastContactedAt: contact.lastContactedAt || "",
        nextFollowUpAt: contact.nextFollowUpAt || "",
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

    const mappedTags = formData.tags.map(id => {
      const tag = allTags.find(t => t.id === id);
      return { tagId: tag.id, tagName: tag.name };
    });

    const payload = {
      ...formData,
      tags: mappedTags,
    };

    try {
      if (contact?.id) {
        await axios.put(`/contacts/${contact.id}`, payload);
        toast.success("✅ Contact updated");
      } else {
        await axios.post("/contacts", payload);
        toast.success("✅ Contact added");
      }

      onSaveComplete?.();
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to save contact");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        placeholder="Name"
        className="w-full border px-3 py-2 rounded"
      />
      <input
        name="phoneNumber"
        value={formData.phoneNumber}
        onChange={handleChange}
        required
        placeholder="Phone"
        className="w-full border px-3 py-2 rounded"
      />
      <input
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        className="w-full border px-3 py-2 rounded"
      />
      <input
        name="leadSource"
        value={formData.leadSource}
        onChange={handleChange}
        placeholder="Lead Source"
        className="w-full border px-3 py-2 rounded"
      />

      {/* ✅ Tag Select */}
      <select
        multiple
        value={formData.tags}
        onChange={handleTagChange}
        className="w-full border px-3 py-2 rounded"
      >
        {allTags.map(tag => (
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
        className="w-full border px-3 py-2 rounded"
      />
      <input
        type="datetime-local"
        name="nextFollowUpAt"
        value={formData.nextFollowUpAt}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded"
      />
      <textarea
        name="notes"
        value={formData.notes}
        onChange={handleChange}
        placeholder="Notes"
        className="w-full border px-3 py-2 rounded"
      />

      <button
        type="submit"
        className="bg-purple-600 text-white px-4 py-2 rounded"
      >
        {contact?.id ? "Update Contact" : "Add Contact"}
      </button>
    </form>
  );
}

export default ContactForm;
