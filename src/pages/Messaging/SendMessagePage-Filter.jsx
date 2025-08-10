import React from "react";

function FilterBar({
  searchQuery,
  onSearchChange,
  selectedSource,
  onSourceChange,
  selectedTags,
  onTagsChange,
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 🔍 Search Input */}
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="🔍 Search name, phone, or email"
          className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none hover:border-purple-500"
        />

        {/* 📂 Source Dropdown */}
        <select
          value={selectedSource}
          onChange={e => onSourceChange(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none hover:border-purple-500"
        >
          <option value="">All Sources</option>
          <option value="crm">CRM</option>
          <option value="catalog">Catalog</option>
          <option value="campaign">Campaign</option>
          {/* Add other sources if needed */}
        </select>

        {/* 🏷️ Tags Dropdown (Placeholder for multi-select or manual tags) */}
        <input
          type="text"
          value={selectedTags}
          onChange={e => onTagsChange(e.target.value)}
          placeholder="🏷️ Filter by Tag (optional)"
          className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none hover:border-purple-500"
        />
      </div>
    </div>
  );
}

export default FilterBar;
