import React, { useState } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

function TextMessageTab() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!phone || !message) {
      toast.warn("📌 Please fill both phone and message.");
      return;
    }

    const businessId = localStorage.getItem("businessId");
    if (!businessId) {
      toast.error("❌ Business ID missing in localStorage.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        businessId,
        recipientNumber: phone,
        textContent: message,
      };

      const res = await axiosClient.post("/whatsappengine/send-text", payload);

      if (res.status === 200) {
        toast.success("✅ Message sent!");
        setPhone("");
        setMessage("");
      } else {
        toast.error("❌ Send failed.");
      }
    } catch (err) {
      toast.error("❌ Error sending message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Enter phone number"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        className="w-full border px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-300"
      />

      <textarea
        rows={4}
        placeholder="Type your message"
        value={message}
        onChange={e => setMessage(e.target.value)}
        className="w-full border px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-300"
      />

      <button
        onClick={handleSend}
        disabled={loading}
        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send Message"}
      </button>
    </div>
  );
}

export default TextMessageTab;
