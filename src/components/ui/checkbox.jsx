import React from "react";

export function Checkbox({ checked, onChange, id, label }) {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="h-4 w-4 border-gray-300 rounded text-purple-600 focus:ring-purple-500"
      />
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}
