import React from "react";
import { Smile, Paperclip } from "lucide-react";

export default function ChatInput({ value, onChange, onSend, disabled }) {
  return (
    <div className="p-3 border-t bg-white">
      <div className="flex items-center gap-2">
        {/* Emoji */}
        <button
          className="text-gray-500 hover:text-purple-600"
          disabled={disabled}
          title="Insert emoji"
        >
          <Smile size={18} />
        </button>

        {/* Input field */}
        <input
          type="text"
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={
            disabled ? "⚠️ Select contact to chat" : "Type your message..."
          }
          className={`flex-1 text-sm px-4 py-2 rounded-full border shadow-sm focus:outline-none focus:ring-1 ${
            disabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white focus:border-purple-500"
          }`}
        />

        {/* Attach */}
        <button
          className="text-gray-500 hover:text-purple-600"
          disabled={disabled}
          title="Attach file"
        >
          <Paperclip size={18} />
        </button>

        {/* Send Button */}
        <button
          onClick={onSend}
          disabled={disabled}
          className={`rounded-full px-4 py-2 text-sm font-medium text-white ${
            disabled
              ? "bg-green-300 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
}
