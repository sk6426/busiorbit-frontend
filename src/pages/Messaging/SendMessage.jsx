import { useState } from "react";
import axiosClient from "../../api/axiosClient"; // ✅ Import your axiosClient

function SendMessage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [errorDetail, setErrorDetail] = useState("");

  const handleSubmit = async e => {
    e.preventDefault();

    setSuccess(false);
    setError("");
    setErrorDetail("");

    if (!name || !phone || !message) {
      setError("❌ Please fill in all fields.");
      return;
    }

    const payload = {
      recipientNumber: phone,
      messageContent: message,
      businessId: localStorage.getItem("businessId"),
      messageType: "text",
    };

    console.log("Payload being sent:", payload);

    try {
      const response = await axiosClient.post("/messages/send-text", payload);

      if (response.data.success) {
        setSuccess(true);
        setName("");
        setPhone("");
        setMessage("");
      } else {
        setError(response.data.message || "❌ Message failed to send.");
        setErrorDetail(
          `🧠 Error: ${response.data.error || "Unknown"}\n📥 Raw: ${
            response.data.response || "-"
          }`
        );
      }
    } catch (err) {
      console.error("API Error:", err);
      setError("❌ Server error. Please try again.");
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow">
      <h2 className="text-2xl font-bold text-purple-600 mb-4">
        Send WhatsApp Message
      </h2>

      {success && (
        <div className="mb-4 text-green-600 font-semibold">
          ✅ Message sent successfully!
        </div>
      )}

      {error && (
        <div className="mb-2 text-red-600 font-semibold whitespace-pre-wrap">
          {error}
        </div>
      )}

      {errorDetail && (
        <pre className="mb-4 text-sm text-red-500 bg-gray-100 p-3 rounded whitespace-pre-wrap">
          {errorDetail}
        </pre>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Name (not sent)
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="e.g. Rahul"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="e.g. +919876543210"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            rows="4"
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Type your message here..."
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-2 rounded-xl hover:bg-purple-700 transition"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}

export default SendMessage;
