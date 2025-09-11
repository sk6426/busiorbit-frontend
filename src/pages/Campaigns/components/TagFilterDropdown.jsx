// 📄 TagFilterDropdown.jsx
import React, { useEffect, useState } from "react";
import Select from "react-select";
import axiosClient from "../../../api/axiosClient";
import { toast } from "react-toastify";

export default function TagFilterDropdown({ selectedTags, onChange }) {
  const [tagOptions, setTagOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await axiosClient.get("/tags/get-tags");
        const allTags = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];

        const options = allTags.map(tag => ({
          label: tag.name,
          value: tag.id,
        }));

        setTagOptions(options);
      } catch (err) {
        console.error("❌ Failed to fetch tags:", err);
        toast.error("Failed to load tags");
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const handleChange = selected => {
    const tagIds = selected ? selected.map(tag => tag.value) : [];
    onChange(tagIds);
  };

  const selectedOptions = tagOptions.filter(opt =>
    selectedTags.includes(opt.value)
  );

  return (
    <div className="w-full max-w-md">
      <label className="block mb-1 text-sm font-medium text-gray-700">
        🏷️ Filter by Tags (All)
      </label>
      <Select
        isMulti
        options={tagOptions}
        value={selectedOptions}
        onChange={handleChange}
        isLoading={loading}
        placeholder="Select tags..."
        className="react-select-container"
        classNamePrefix="react-select"
        noOptionsMessage={() => (loading ? "Loading..." : "No tags available")}
      />
    </div>
  );
}
