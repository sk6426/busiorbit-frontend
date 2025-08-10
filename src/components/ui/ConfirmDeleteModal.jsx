// 📄 File: src/components/modals/ConfirmDeleteModal.jsx
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

export default function ConfirmDeleteModal({ open, onClose, onConfirm }) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-bold text-gray-800"
                >
                  🗑️ Confirm Deletion
                </Dialog.Title>
                <div className="mt-2 text-sm text-gray-600">
                  Are you sure you want to delete this step? This action cannot
                  be undone.
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                  >
                    Yes, Delete
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
