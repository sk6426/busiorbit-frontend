import { useEffect, useState, useRef } from "react";

export default function useNotificationSound() {
  const [enabled, setEnabled] = useState(() => {
    return localStorage.getItem("playSound") === "true";
  });

  const audioRef = useRef(null);

  // Load audio file once
  useEffect(() => {
    audioRef.current = new Audio("/sounds/inbox_notify.mp3");
    audioRef.current.preload = "auto";
  }, []);

  // Toggle ON/OFF and store in localStorage
  const toggleSound = () => {
    const newVal = !enabled;
    setEnabled(newVal);
    localStorage.setItem("playSound", newVal);
  };

  // ✅ Safe + up-to-date check
  const play = () => {
    const isAllowed = localStorage.getItem("playSound") === "true";
    if (!isAllowed || !audioRef.current) return;

    audioRef.current.play().catch(err => {
      console.warn("🔇 Sound blocked by browser:", err);
    });
  };

  return {
    enabled,
    toggleSound,
    play,
  };
}

// import { useCallback, useState } from "react";
// import { toast } from "react-toastify";

// /**
//  * Hook to manage notification sound toggle logic.
//  * Stores preference in localStorage and ensures autoplay permission.
//  */
// export default function useNotificationSound() {
//   const [isSoundOn, setIsSoundOn] = useState(
//     localStorage.getItem("playSound") === "true"
//   );

//   const toggleSound = useCallback(async () => {
//     const newVal = !isSoundOn;

//     if (newVal) {
//       try {
//         const audio = new Audio("/sounds/inbox_notify.mp3");
//         await audio.play(); // Attempt to get autoplay permission
//         audio.pause();

//         setIsSoundOn(true);
//         localStorage.setItem("playSound", "true");
//       } catch (err) {
//         toast.error("🔇 Browser blocked autoplay. Please interact first.");
//         console.warn("⚠️ Autoplay blocked:", err);

//         setIsSoundOn(false);
//         localStorage.setItem("playSound", "false");
//       }
//     } else {
//       setIsSoundOn(false);
//       localStorage.setItem("playSound", "false");
//     }
//   }, [isSoundOn]);

//   return { isSoundOn, toggleSound };
// }
