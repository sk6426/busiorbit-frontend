import React from "react";

export default function ToggleSwitch({ checked, onChange, disabled = false }) {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <span className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <div
          className={`w-11 h-6 rounded-full transition duration-300 ease-in-out ${
            checked ? "bg-purple-600" : "bg-gray-300"
          }`}
        />
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition duration-300 ease-in-out ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </span>
    </label>
  );
}
