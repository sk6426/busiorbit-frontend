import React from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  Clock,
  Send,
  Eye,
  MousePointerClick,
  MessageCircle,
} from "lucide-react";

function ContactJourneyModal({ isOpen, onClose, log }) {
  if (!log) return null;

  const timeline = [
    {
      label: "Message Sent",
      icon: <Send className="w-5 h-5 text-blue-500" />,
      time: log.sentAt,
    },
    {
      label: "Delivered",
      icon: <Clock className="w-5 h-5 text-green-500" />,
      time: log.deliveredAt,
    },
    {
      label: "Read",
      icon: <Eye className="w-5 h-5 text-purple-500" />,
      time: log.readAt,
    },
    log.isClicked && {
      label: `CTA Clicked (${log.clickType || "Unknown"})`,
      icon: <MousePointerClick className="w-5 h-5 text-pink-500" />,
      time: log.clickedAt,
    },
    log.clickedCTA && {
      label: `💬 Replied: ${log.clickedCTA}`,
      icon: <MessageCircle className="w-5 h-5 text-orange-500" />,
      time: log.updatedAt || log.sentAt,
    },
  ].filter(Boolean);

  const format = dt => (dt ? new Date(dt).toLocaleString() : "-");

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-bold text-gray-800 mb-4">
                  🧭 Journey for {log.contactName}
                </Dialog.Title>

                <div className="space-y-4">
                  {timeline.map((event, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="pt-1">{event.icon}</div>
                      <div>
                        <p className="font-medium">{event.label}</p>
                        <p className="text-sm text-gray-500">
                          {format(event.time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
                  >
                    Close
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

export default ContactJourneyModal;
