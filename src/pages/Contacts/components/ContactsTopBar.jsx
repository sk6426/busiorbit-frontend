// 📄 File: src/pages/Contacts/components/ContactsTopBar.jsx
import { Search, Plus, SlidersHorizontal } from "lucide-react";

export default function ContactsTopBar({
  onAddClick,
  onSearchChange,
  activeTab,
  onTabChange,
  searchTerm,
  onFilterClick,
}) {
  const tabs = [
    { key: "all", label: "All" },
    { key: "favourites", label: "Favourites" },
    { key: "archived", label: "Archived" },
    { key: "groups", label: "Groups" },
  ];

  return (
    <div className="space-y-3">
      {/* 🔍 Search + Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-2 flex-1">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={e => onSearchChange?.(e.target.value)}
            className="w-full md:max-w-xs border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onFilterClick}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm border text-gray-600 border-gray-300 hover:bg-gray-100"
          >
            <SlidersHorizontal size={16} /> Filter
          </button>
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
          >
            <Plus size={16} /> Add Contact
          </button>
        </div>
      </div>

      {/* 🧭 Tab Navigation */}
      <div className="flex gap-3 border-b text-sm font-medium">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onTabChange?.(tab.key)}
            className={`px-3 py-2 border-b-2 transition-all duration-150 ${
              activeTab === tab.key
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
