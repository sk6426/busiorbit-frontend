import React from "react";
import { Dialog } from "@headlessui/react";

const MessagePreviewModal = ({ isOpen, onClose, messageLog }) => {
  if (!messageLog) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black bg-opacity-30"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl border border-gray-200">
          <Dialog.Title className="text-lg font-semibold text-purple-700 mb-3">
            📨 Sent Message Preview
          </Dialog.Title>

          <div className="text-sm bg-gray-50 p-4 border rounded-md whitespace-pre-wrap text-gray-800 mb-4">
            {messageLog.finalMessage || "No message available"}
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>
              <strong>Channel:</strong> {messageLog.sourceChannel || "-"}
            </p>
            <p>
              <strong>Sent At:</strong>{" "}
              {messageLog.sentAt
                ? new Date(messageLog.sentAt).toLocaleString()
                : "-"}
            </p>
            {messageLog.clickType && (
              <p>
                <strong>Click Type:</strong> {messageLog.clickType}
              </p>
            )}
          </div>

          <div className="mt-5 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default MessagePreviewModal;
