import { useEffect, useState, useRef, useCallback } from "react";

/**
 * Production-grade notification sound hook
 * - Keeps your API: { enabled, toggleSound, play }
 * - Adds:
 *   • Autoplay-safe: waits for first user interaction to unlock audio
 *   • Throttle: avoid spammy dings on message bursts (default 800ms)
 *   • Volume with persistence (localStorage: playSoundVolume)
 *   • Resilient playback: retries with a fresh Audio element if needed
 *
 * Optional options (backward compatible):
 *   useNotificationSound({ src, volume, throttleMs })
 */
export default function useNotificationSound(options = {}) {
  const {
    src = "/sounds/inbox_notify.mp3",
    volume = 0.6, // 0..1
    throttleMs = 800, // prevent spam
    storageEnabledKey = "playSound",
    storageVolumeKey = "playSoundVolume",
  } = options;

  // Enabled flag persists to localStorage (default OFF if key missing, matches your old behavior)
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(storageEnabledKey) === "true";
    } catch {
      return false;
    }
  });

  // Volume persists as well
  const [vol, setVol] = useState(() => {
    try {
      const raw = localStorage.getItem(storageVolumeKey);
      const v = raw == null ? volume : parseFloat(raw);
      return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : volume;
    } catch {
      return volume;
    }
  });

  // Autoplay gating: many browsers block audio until user interacts
  const [userInteracted, setUserInteracted] = useState(false);

  const audioRef = useRef(null);
  const lastPlayedAtRef = useRef(0);

  // Create or refresh audio element when src/vol changes
  useEffect(() => {
    let a = audioRef.current;
    if (!a) {
      a = new Audio();
      audioRef.current = a;
    }
    a.src = src;
    a.preload = "auto";
    a.volume = vol;
  }, [src, vol]);

  // Persist enabled + volume
  useEffect(() => {
    try {
      localStorage.setItem(storageEnabledKey, String(enabled));
    } catch {}
  }, [enabled, storageEnabledKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageVolumeKey, String(vol));
    } catch {}
  }, [vol, storageVolumeKey]);

  // Unlock audio on first interaction (Safari/iOS/Chrome policies)
  useEffect(() => {
    if (userInteracted) return;

    const unlock = () => {
      setUserInteracted(true);
      // Try a quick play/pause to unlock
      try {
        const a = audioRef.current;
        if (a)
          a.play()
            .then(() => a.pause())
            .catch(() => {});
      } catch {}
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };

    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchstart", unlock, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, [userInteracted]);

  // Toggle ON/OFF and store in localStorage
  const toggleSound = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem(storageEnabledKey, String(next));
      } catch {}
      return next;
    });
  }, [storageEnabledKey]);

  // Public: play the sound (throttled + gated)
  const play = useCallback(() => {
    const now = Date.now();
    if (now - lastPlayedAtRef.current < throttleMs) return;
    lastPlayedAtRef.current = now;

    // Re-check at call time (handles multi-tab changes)
    let isAllowed = false;
    try {
      isAllowed = localStorage.getItem(storageEnabledKey) === "true";
    } catch {}

    if (!isAllowed || !enabled || !userInteracted) return;

    const a = audioRef.current;
    if (!a) return;

    try {
      a.currentTime = 0;
      a.play().catch(() => {
        // Fallback: create a fresh element (sometimes helps on mobile)
        try {
          const b = new Audio(a.src);
          b.volume = a.volume;
          b.play().catch(() => {});
        } catch {}
      });
    } catch {}
  }, [enabled, userInteracted, throttleMs, storageEnabledKey]);

  // Extra helpers if you want to expose them later
  const setVolume = useCallback(v => {
    setVol(Math.min(1, Math.max(0, Number(v))));
  }, []);

  return {
    // Backward-compatible API
    enabled,
    toggleSound,
    play,

    // Optional extras (handy for a header toggle UI)
    volume: vol,
    setVolume,
    userInteracted,
  };
}

// import { useEffect, useState, useRef } from "react";

// export default function useNotificationSound() {
//   const [enabled, setEnabled] = useState(() => {
//     return localStorage.getItem("playSound") === "true";
//   });

//   const audioRef = useRef(null);

//   // Load audio file once
//   useEffect(() => {
//     audioRef.current = new Audio("/sounds/inbox_notify.mp3");
//     audioRef.current.preload = "auto";
//   }, []);

//   // Toggle ON/OFF and store in localStorage
//   const toggleSound = () => {
//     const newVal = !enabled;
//     setEnabled(newVal);
//     localStorage.setItem("playSound", newVal);
//   };

//   // ✅ Safe + up-to-date check
//   const play = () => {
//     const isAllowed = localStorage.getItem("playSound") === "true";
//     if (!isAllowed || !audioRef.current) return;

//     audioRef.current.play().catch(err => {
//       console.warn("🔇 Sound blocked by browser:", err);
//     });
//   };

//   return {
//     enabled,
//     toggleSound,
//     play,
//   };
// }

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
