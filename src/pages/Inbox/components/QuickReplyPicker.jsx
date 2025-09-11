import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axiosClient from "../../../api/axiosClient";

/**
 * QuickReplyPicker
 * Props:
 *  - onInsert(text: string): required
 *  - onClose(): optional
 *  - scope?: "Business" | "Personal" | "All"  // initial view; default "All"
 */
export default function QuickReplyPicker({ onInsert, onClose, scope = "All" }) {
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // scope chips
  const [viewScope, setViewScope] = useState(() => scope || "All");
  const viewScopeParam = useMemo(() => {
    const s = (viewScope || "All").toString().toLowerCase();
    return s === "business" || s === "personal" ? s : "all";
  }, [viewScope]);

  // NEW: create mode
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagsCsv, setTagsCsv] = useState("");
  const [createScope, setCreateScope] = useState("Personal"); // default personal
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Debounced fetch when search or scope changes
  useEffect(() => {
    if (creating) return; // pause list fetch while creating
    let ignore = false;
    setLoading(true);

    const t = setTimeout(() => {
      const params = {};
      if (q) params.q = q;
      if (viewScopeParam) params.scope = viewScopeParam;

      axiosClient
        .get("/quick-replies", { params })
        .then(res => {
          if (ignore) return;
          setItems(Array.isArray(res.data) ? res.data : []);
          setActiveIndex(-1);
        })
        .catch(() => {
          if (ignore) return;
          setItems([]);
        })
        .finally(() => !ignore && setLoading(false));
    }, 200);

    return () => {
      clearTimeout(t);
      ignore = true;
    };
  }, [q, viewScopeParam, creating]);

  // Autofocus search on open
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Close on click outside
  useEffect(() => {
    const onDocClick = e => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", onDocClick, { capture: true });
    return () =>
      document.removeEventListener("mousedown", onDocClick, { capture: true });
  }, [onClose]);

  const handleInsert = useCallback(
    text => {
      if (!text) return;
      onInsert?.(text);
    },
    [onInsert]
  );

  const handleKeyDown = e => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (creating) {
        setCreating(false);
        return;
      }
      onClose?.();
      return;
    }
    if (creating) return; // no list nav while in create form
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, Math.max(0, items.length - 1)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
      return;
    }
    if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < items.length) {
        e.preventDefault();
        handleInsert(items[activeIndex]?.body);
        onClose?.();
      }
    }
  };

  const handleCreate = async () => {
    setSaveMsg("");
    if (!title.trim() || !body.trim()) {
      setSaveMsg("Title and Body are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        body: body,
        tagsCsv: tagsCsv.trim() || null,
        scope: createScope === "Business" ? 2 : 0, // enum: Personal=0, Business=2
      };
      const res = await axiosClient.post("/quick-replies", payload);
      const ok = res?.data?.success === true;
      setSaveMsg(ok ? "✅ Saved." : res?.data?.message || "❌ Failed to save.");
      if (ok) {
        // reset form and refresh list to created scope
        setTitle("");
        setBody("");
        setTagsCsv("");
        setCreating(false);
        setViewScope(createScope);
        setQ(""); // clear search
      }
    } catch (err) {
      setSaveMsg("❌ Failed to save.");
      // optional: console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-80 rounded-xl border bg-white shadow-lg p-2"
      role="dialog"
      aria-label="Quick replies"
    >
      {/* Header row: search + actions */}
      <div className="flex items-center gap-2 mb-2">
        {!creating ? (
          <>
            <input
              ref={searchRef}
              className="flex-1 border rounded-md px-2 py-1 text-sm"
              placeholder="Search saved replies…"
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="text-xs px-2 py-1 border rounded-md bg-white hover:bg-gray-50"
              onClick={() => setCreating(true)}
              type="button"
              title="Create a new quick reply"
            >
              New
            </button>
            <button
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
              onClick={() => onClose?.()}
              type="button"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <div className="text-sm font-medium">New quick reply</div>
            <div className="flex-1" />
            <button
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
              onClick={() => setCreating(false)}
              type="button"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Scope chips (list view) OR Create form */}
      {!creating ? (
        <>
          {/* Scope chips */}
          <div className="flex items-center gap-1 mb-2 px-1">
            {["All", "Business", "Personal"].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setViewScope(s)}
                className={`px-2 py-0.5 text-xs rounded-full border ${
                  viewScope === s ? "bg-gray-200" : "bg-white hover:bg-gray-100"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="max-h-64 overflow-y-auto">
            {loading && (
              <div className="text-xs text-gray-500 p-2">Loading…</div>
            )}
            {!loading && items.length === 0 && (
              <div className="text-xs text-gray-500 p-2">No results</div>
            )}

            {!loading &&
              items.map((x, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={x.id}
                    type="button"
                    className={`w-full text-left p-2 rounded-md ${
                      isActive ? "bg-gray-200" : "hover:bg-gray-100"
                    }`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      handleInsert(x.body);
                      onClose?.();
                    }}
                    title={x.tagsCsv || ""}
                  >
                    <div className="text-sm font-medium text-gray-800">
                      {x.title}
                    </div>
                    <div className="text-xs text-gray-600 line-clamp-2">
                      {x.body}
                    </div>
                    {x.language && (
                      <div className="text-[10px] text-gray-400 mt-1">
                        Lang: {x.language}
                      </div>
                    )}
                  </button>
                );
              })}
          </div>

          <div className="flex items-center justify-between mt-2 px-1">
            <div className="text-[10px] text-gray-400">
              Scope: <span className="uppercase">{viewScopeParam}</span>
            </div>
            <div className="text-[10px] text-gray-400">
              ↑/↓ navigate • Enter insert • Esc close
            </div>
          </div>
        </>
      ) : (
        // CREATE FORM
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-16">Scope</label>
            <div className="flex items-center gap-2">
              {["Personal", "Business"].map(s => (
                <label key={s} className="text-xs flex items-center gap-1">
                  <input
                    type="radio"
                    name="qr-scope"
                    value={s}
                    checked={createScope === s}
                    onChange={() => setCreateScope(s)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-16">Title</label>
            <input
              className="flex-1 border rounded-md px-2 py-1 text-sm"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Greeting (EN)"
            />
          </div>

          <div className="flex items-start gap-2">
            <label className="text-xs text-gray-600 w-16 mt-1">Body</label>
            <textarea
              className="flex-1 border rounded-md px-2 py-1 text-sm h-24"
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Type the message…"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-16">Tags</label>
            <input
              className="flex-1 border rounded-md px-2 py-1 text-sm"
              value={tagsCsv}
              onChange={e => setTagsCsv(e.target.value)}
              placeholder="e.g., greeting,eng"
            />
          </div>

          {saveMsg && (
            <div className="text-xs px-2 py-1 rounded-md bg-gray-50 border">
              {saveMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              className="text-xs px-3 py-1 rounded-md border bg-white hover:bg-gray-50"
              onClick={() => setCreating(false)}
              type="button"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="text-xs px-3 py-1 rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300"
              onClick={handleCreate}
              type="button"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import axiosClient from "../../../api/axiosClient";

// /**
//  * QuickReplyPicker
//  * Props:
//  *  - onInsert(text: string): required
//  *  - onClose(): optional
//  *  - scope?: "Business" | "Personal" | "All"  // acts as the initial scope; default: "All"
//  */
// export default function QuickReplyPicker({ onInsert, onClose, scope = "All" }) {
//   const containerRef = useRef(null);
//   const searchRef = useRef(null);

//   const [q, setQ] = useState("");
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [activeIndex, setActiveIndex] = useState(-1);

//   // NEW: local scope state (chips control this)
//   const [viewScope, setViewScope] = useState(() => scope || "All");

//   const viewScopeParam = useMemo(() => {
//     const s = (viewScope || "All").toString().toLowerCase();
//     return s === "business" || s === "personal" ? s : "all";
//   }, [viewScope]);

//   // Debounced fetch when search or scope changes
//   useEffect(() => {
//     let ignore = false;
//     setLoading(true);

//     const t = setTimeout(() => {
//       const params = {};
//       if (q) params.q = q;
//       if (viewScopeParam) params.scope = viewScopeParam;

//       axiosClient
//         .get("/quick-replies", { params })
//         .then(res => {
//           if (ignore) return;
//           setItems(Array.isArray(res.data) ? res.data : []);
//           setActiveIndex(-1);
//         })
//         .catch(() => {
//           if (ignore) return;
//           setItems([]);
//         })
//         .finally(() => !ignore && setLoading(false));
//     }, 200);

//     return () => {
//       clearTimeout(t);
//       ignore = true;
//     };
//   }, [q, viewScopeParam]);

//   // Autofocus search on open
//   useEffect(() => {
//     searchRef.current?.focus();
//   }, []);

//   // Close on click outside
//   useEffect(() => {
//     const onDocClick = e => {
//       if (!containerRef.current) return;
//       if (!containerRef.current.contains(e.target)) onClose?.();
//     };
//     document.addEventListener("mousedown", onDocClick, { capture: true });
//     return () =>
//       document.removeEventListener("mousedown", onDocClick, { capture: true });
//   }, [onClose]);

//   const handleInsert = useCallback(
//     text => {
//       if (!text) return;
//       onInsert?.(text);
//     },
//     [onInsert]
//   );

//   const handleKeyDown = e => {
//     if (e.key === "Escape") {
//       e.preventDefault();
//       onClose?.();
//       return;
//     }
//     if (e.key === "ArrowDown") {
//       e.preventDefault();
//       setActiveIndex(i => Math.min(i + 1, Math.max(0, items.length - 1)));
//       return;
//     }
//     if (e.key === "ArrowUp") {
//       e.preventDefault();
//       setActiveIndex(i => Math.max(i - 1, -1));
//       return;
//     }
//     if (e.key === "Enter") {
//       if (activeIndex >= 0 && activeIndex < items.length) {
//         e.preventDefault();
//         handleInsert(items[activeIndex]?.body);
//         onClose?.();
//       }
//     }
//   };

//   return (
//     <div
//       ref={containerRef}
//       className="w-80 rounded-xl border bg-white shadow-lg p-2"
//       role="dialog"
//       aria-label="Quick replies"
//     >
//       {/* Header row: search + close */}
//       <div className="flex items-center gap-2 mb-2">
//         <input
//           ref={searchRef}
//           className="flex-1 border rounded-md px-2 py-1 text-sm"
//           placeholder="Search saved replies…"
//           value={q}
//           onChange={e => setQ(e.target.value)}
//           onKeyDown={handleKeyDown}
//         />
//         <button
//           className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
//           onClick={() => onClose?.()}
//           type="button"
//         >
//           Close
//         </button>
//       </div>

//       {/* NEW: Scope chips inside the picker */}
//       <div className="flex items-center gap-1 mb-2 px-1">
//         {["All", "Business", "Personal"].map(s => (
//           <button
//             key={s}
//             type="button"
//             onClick={() => setViewScope(s)}
//             className={`px-2 py-0.5 text-xs rounded-full border ${
//               viewScope === s ? "bg-gray-200" : "bg-white hover:bg-gray-100"
//             }`}
//           >
//             {s}
//           </button>
//         ))}
//       </div>

//       <div className="max-h-64 overflow-y-auto">
//         {loading && <div className="text-xs text-gray-500 p-2">Loading…</div>}
//         {!loading && items.length === 0 && (
//           <div className="text-xs text-gray-500 p-2">No results</div>
//         )}

//         {!loading &&
//           items.map((x, idx) => {
//             const isActive = idx === activeIndex;
//             return (
//               <button
//                 key={x.id}
//                 type="button"
//                 className={`w-full text-left p-2 rounded-md ${
//                   isActive ? "bg-gray-200" : "hover:bg-gray-100"
//                 }`}
//                 onMouseEnter={() => setActiveIndex(idx)}
//                 onClick={() => {
//                   handleInsert(x.body);
//                   onClose?.();
//                 }}
//                 title={x.tagsCsv || ""}
//               >
//                 <div className="text-sm font-medium text-gray-800">
//                   {x.title}
//                 </div>
//                 <div className="text-xs text-gray-600 line-clamp-2">
//                   {x.body}
//                 </div>
//                 {x.language && (
//                   <div className="text-[10px] text-gray-400 mt-1">
//                     Lang: {x.language}
//                   </div>
//                 )}
//               </button>
//             );
//           })}
//       </div>

//       <div className="flex items-center justify-between mt-2 px-1">
//         <div className="text-[10px] text-gray-400">
//           Scope: <span className="uppercase">{viewScopeParam}</span>
//         </div>
//         <div className="text-[10px] text-gray-400">
//           ↑/↓ navigate • Enter insert • Esc close
//         </div>
//       </div>
//     </div>
//   );
// }
