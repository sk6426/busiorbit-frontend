import React, { useEffect, useMemo, useRef, useState } from "react";

// Lightweight emoji set (common, chat-friendly)
const RAW = [
  ["😀", "grinning"],
  ["😁", "beaming"],
  ["😂", "joy"],
  ["🤣", "rofl"],
  ["😊", "smile"],
  ["🙂", "slight_smile"],
  ["😉", "wink"],
  ["😍", "heart_eyes"],
  ["😘", "kiss"],
  ["😋", "yum"],
  ["😎", "cool"],
  ["🤩", "star_struck"],
  ["🥳", "partying"],
  ["😇", "innocent"],
  ["🤗", "hug"],
  ["😅", "sweat_smile"],
  ["😌", "relieved"],
  ["😴", "sleep"],
  ["🤔", "think"],
  ["🤨", "doubt"],
  ["😐", "neutral"],
  ["😮", "open_mouth"],
  ["😢", "cry"],
  ["😭", "sob"],
  ["😡", "angry"],
  ["😱", "scream"],
  ["🤯", "mind_blown"],
  ["🤒", "sick"],
  ["🤕", "injured"],
  ["🤧", "sneeze"],
  ["🥶", "cold"],
  ["🥵", "hot"],
  ["👍", "thumbs_up"],
  ["👎", "thumbs_down"],
  ["🙏", "pray"],
  ["👏", "clap"],
  ["🙌", "raised_hands"],
  ["🤝", "handshake"],
  ["💪", "muscle"],
  ["🫶", "heart_hands"],
  ["❤️", "red_heart"],
  ["💛", "yellow_heart"],
  ["💚", "green_heart"],
  ["💙", "blue_heart"],
  ["💜", "purple_heart"],
  ["🖤", "black_heart"],
  ["💔", "broken_heart"],
  ["✨", "sparkles"],
  ["🔥", "fire"],
  ["⭐", "star"],
  ["✅", "check"],
  ["❌", "cross"],
  ["⚠️", "warning"],
  ["⏳", "hourglass"],
  ["📌", "pin"],
  ["📍", "round_pushpin"],
  ["📅", "calendar"],
  ["🛍️", "shopping"],
  ["💰", "money"],
  ["🎉", "tada"],
  ["🎊", "confetti"],
  ["💬", "speech"],
  ["✉️", "envelope"],
  ["📱", "phone"],
  ["📞", "telephone"],
  ["⏰", "alarm"],
  ["⌛", "timer"],
  ["🧾", "receipt"],
  ["🧰", "tools"],
  ["🧠", "brain"],
];

const EMOJIS = RAW.map(([char, name]) => ({ char, name }));

export default function EmojiPicker({ onPick, onClose }) {
  const ref = useRef(null);
  const [q, setQ] = useState("");

  // Close on outside click
  useEffect(() => {
    const onDocClick = e => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", onDocClick, { capture: true });
    return () =>
      document.removeEventListener("mousedown", onDocClick, { capture: true });
  }, [onClose]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return EMOJIS;
    return EMOJIS.filter(e => e.char.includes(s) || e.name.includes(s));
  }, [q]);

  return (
    <div
      ref={ref}
      className="w-80 rounded-xl border bg-white shadow-lg p-2"
      role="dialog"
      aria-label="Emoji picker"
    >
      <div className="flex items-center gap-2 mb-2">
        <input
          autoFocus
          className="flex-1 border rounded-md px-2 py-1 text-sm"
          placeholder="Search emoji…"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Escape") onClose?.();
          }}
        />
        <button
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
          onClick={() => onClose?.()}
          type="button"
        >
          Close
        </button>
      </div>

      {/* No scrollbar: wider + more columns + slightly smaller buttons */}
      <div className="grid grid-cols-10 gap-1 overflow-y-hidden">
        {filtered.map(e => (
          <button
            key={e.char + e.name}
            type="button"
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-100"
            title={e.name.replace(/_/g, " ")}
            onClick={() => onPick?.(e.char)}
          >
            <span className="text-lg">{e.char}</span>
          </button>
        ))}
      </div>

      {/* <div className="mt-2 text-[10px] text-gray-400 px-1">
        Tip: you can also use your OS emoji panel (Win + .) / (⌘ Ctrl Space)
      </div> */}
    </div>
  );
}
