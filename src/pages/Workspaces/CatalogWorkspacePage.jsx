// 📄 src/pages/Workspaces/CatalogWorkspacePage.jsx

import {
  Archive,
  Pin,
  ArrowRightCircle,
  MoreVertical,
  ShoppingCart,
  PlusCircle,
  BarChart2,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// ✅ use the real provider hook
import { useAuth } from "../../app/providers/AuthProvider";
// ✅ fine-grained capability codes (mirror backend)
import { FK } from "../../capabilities/featureKeys";

const PERM_BY_BLOCK = {
  "product-catalog": [FK.PRODUCT_VIEW], // view products
  "product-form": [FK.PRODUCT_CREATE], // create products
  // No explicit FK for insights yet; allow if they can view products.
  "catalog-dashboard": [FK.PRODUCT_VIEW],
  // "catalog-automation" is still plan-gated only (no FK yet)
};

const catalogBlocks = [
  {
    id: "product-catalog",
    label: "Product Catalog",
    description: "Browse, manage, and organize all your products in one place.",
    path: "/app/catalog/products",
    icon: <ShoppingCart className="text-purple-600" size={22} />,
    action: "Manage Products",
  },
  {
    id: "product-form",
    label: "Add New Product",
    description: "Create and publish new items to your WhatsApp catalog.",
    path: "/app/catalog/form",
    icon: <PlusCircle className="text-green-600" size={22} />,
    action: "Add Product",
  },
  {
    id: "catalog-dashboard",
    label: "Catalog Dashboard",
    description: "Get insights into catalog performance and user interactions.",
    path: "/app/catalog/insights",
    icon: <BarChart2 className="text-blue-600" size={22} />,
    action: "View Insights",
  },
  {
    id: "catalog-automation",
    label: "Auto-Responders",
    description: "Set up auto-replies triggered by catalog engagement events.",
    path: "/app/catalog/automation",
    icon: <Zap className="text-yellow-600" size={22} />,
    action: "Configure Bots",
    requiredPlan: "advanced",
  },
];

export default function CatalogWorkspacePage() {
  const navigate = useNavigate();
  const { isLoading, can, hasAllAccess, planId } = useAuth();

  const [pinned, setPinned] = useState(
    JSON.parse(localStorage.getItem("catalog-pinned") || "[]")
  );
  const [archived, setArchived] = useState(
    JSON.parse(localStorage.getItem("catalog-archived") || "[]")
  );
  const [order, setOrder] = useState(
    JSON.parse(localStorage.getItem("catalog-order")) ||
      catalogBlocks.map(b => b.id)
  );

  const togglePin = id => {
    const updated = pinned.includes(id)
      ? pinned.filter(i => i !== id)
      : [...pinned, id];
    setPinned(updated);
    localStorage.setItem("catalog-pinned", JSON.stringify(updated));
  };

  const toggleArchive = id => {
    const updated = archived.includes(id)
      ? archived.filter(i => i !== id)
      : [...archived, id];
    setArchived(updated);
    localStorage.setItem("catalog-archived", JSON.stringify(updated));
  };

  const onDragEnd = result => {
    if (!result.destination) return;
    const newOrder = Array.from(order);
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    setOrder(newOrder);
    localStorage.setItem("catalog-order", JSON.stringify(newOrder));
  };

  // ---- plan helper (you were already using this UX gate) --------------------
  const hasPlan = requiredPlan => {
    if (!requiredPlan) return true;
    const tiers = ["trial", "basic", "smart", "advanced"];
    // if you store planId as name already, great; else map your numeric ids here
    const current = String(planId || "basic").toLowerCase();
    return tiers.indexOf(current) >= tiers.indexOf(requiredPlan.toLowerCase());
  };

  // ---- permission helper using FK + can() -----------------------------------
  const canAny = codes => hasAllAccess || (codes || []).some(code => can(code));

  const visibleBlocks = order
    .map(id => catalogBlocks.find(b => b.id === id))
    .filter(Boolean)
    .filter(b => !archived.includes(b.id))
    .filter(b => canAny(PERM_BY_BLOCK[b.id]))
    .filter(b => hasPlan(b.requiredPlan));

  if (isLoading)
    return (
      <div className="p-10 text-center text-lg text-gray-500">
        Loading features…
      </div>
    );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-purple-800 mb-4">
        🛍️ Catalog Workspace
      </h2>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="catalog-blocks" direction="horizontal">
          {provided => (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {visibleBlocks.map((block, index) => (
                <Draggable key={block.id} draggableId={block.id} index={index}>
                  {provided => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="bg-white rounded-md border shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5 duration-200"
                    >
                      <div className="flex items-start gap-4 p-5">
                        <div className="bg-gray-100 rounded-md p-2">
                          {block.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-md font-semibold text-purple-700">
                            {block.label}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {block.description}
                          </p>
                        </div>
                        <MoreVertical size={16} className="text-gray-400" />
                      </div>
                      <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
                        <button
                          onClick={() => navigate(block.path)}
                          className="text-sm text-purple-600 font-medium flex items-center gap-1 hover:text-purple-800"
                        >
                          {block.action} <ArrowRightCircle size={18} />
                        </button>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => togglePin(block.id)}
                            title="Pin this"
                          >
                            <Pin
                              size={18}
                              className={
                                pinned.includes(block.id)
                                  ? "text-red-600"
                                  : "text-gray-400 hover:text-red-500"
                              }
                            />
                          </button>
                          <button
                            onClick={() => toggleArchive(block.id)}
                            title="Archive this"
                          >
                            <Archive
                              size={18}
                              className={
                                archived.includes(block.id)
                                  ? "text-indigo-600"
                                  : "text-gray-400 hover:text-indigo-500"
                              }
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

// // 📄 src/pages/Workspaces/CatalogWorkspacePage.jsx

// import {
//   Archive,
//   Pin,
//   ArrowRightCircle,
//   MoreVertical,
//   ShoppingCart,
//   PlusCircle,
//   BarChart2,
//   Zap,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import { useAuth } from "../auth/context/pld_AuthContext";

// const catalogBlocks = [
//   {
//     id: "product-catalog",
//     label: "Product Catalog",
//     description: "Browse, manage, and organize all your products in one place.",
//     path: "/app/catalog/products",
//     icon: <ShoppingCart className="text-purple-600" size={22} />,
//     action: "Manage Products",
//     featureKey: "Catalog",
//   },
//   {
//     id: "product-form",
//     label: "Add New Product",
//     description: "Create and publish new items to your WhatsApp catalog.",
//     path: "/app/catalog/form",
//     icon: <PlusCircle className="text-green-600" size={22} />,
//     action: "Add Product",
//     featureKey: "Catalog",
//   },
//   {
//     id: "catalog-dashboard",
//     label: "Catalog Dashboard",
//     description: "Get insights into catalog performance and user interactions.",
//     path: "/app/catalog/insights",
//     icon: <BarChart2 className="text-blue-600" size={22} />,
//     action: "View Insights",
//     featureKey: "CatalogInsights",
//   },
//   {
//     id: "catalog-automation",
//     label: "Auto-Responders",
//     description: "Set up auto-replies triggered by catalog engagement events.",
//     path: "/app/catalog/automation",
//     icon: <Zap className="text-yellow-600" size={22} />,
//     action: "Configure Bots",
//     requiredPlan: "advanced",
//   },
// ];

// export default function CatalogWorkspacePage() {
//   const navigate = useNavigate();
//   const { plan, availableFeatures = {}, isLoading } = useAuth();

//   const [pinned, setPinned] = useState(() =>
//     JSON.parse(localStorage.getItem("catalog-pinned") || "[]")
//   );
//   const [archived, setArchived] = useState(() =>
//     JSON.parse(localStorage.getItem("catalog-archived") || "[]")
//   );
//   const [order, setOrder] = useState(
//     () =>
//       JSON.parse(localStorage.getItem("catalog-order")) ||
//       catalogBlocks.map(b => b.id)
//   );

//   const togglePin = id => {
//     const updated = pinned.includes(id)
//       ? pinned.filter(i => i !== id)
//       : [...pinned, id];
//     setPinned(updated);
//     localStorage.setItem("catalog-pinned", JSON.stringify(updated));
//   };

//   const toggleArchive = id => {
//     const updated = archived.includes(id)
//       ? archived.filter(i => i !== id)
//       : [...archived, id];
//     setArchived(updated);
//     localStorage.setItem("catalog-archived", JSON.stringify(updated));
//   };

//   const onDragEnd = result => {
//     if (!result.destination) return;
//     const newOrder = Array.from(order);
//     const [moved] = newOrder.splice(result.source.index, 1);
//     newOrder.splice(result.destination.index, 0, moved);
//     setOrder(newOrder);
//     localStorage.setItem("catalog-order", JSON.stringify(newOrder));
//   };

//   // 🚩 Use both featureKey and plan for gating blocks
//   const hasFeature = key => availableFeatures[key];

//   const hasPlan = requiredPlan => {
//     const tiers = ["trial", "basic", "smart", "advanced"];
//     const userTier = tiers.indexOf(plan?.toLowerCase() || "basic");
//     const requiredTier = tiers.indexOf(requiredPlan?.toLowerCase() || "basic");
//     return userTier >= requiredTier;
//   };

//   const visibleBlocks = order
//     .filter(id => {
//       const block = catalogBlocks.find(b => b.id === id);
//       if (!block || archived.includes(id)) return false;
//       if (block.featureKey && !hasFeature(block.featureKey)) return false;
//       if (block.requiredPlan && !hasPlan(block.requiredPlan)) return false;
//       return true;
//     })
//     .map(id => catalogBlocks.find(b => b.id === id));

//   if (isLoading)
//     return (
//       <div className="p-10 text-center text-lg text-gray-500">
//         Loading features…
//       </div>
//     );

//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-bold text-purple-800 mb-4">
//         🛍️ Catalog Workspace
//       </h2>

//       {plan === "basic" && (
//         <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 px-4 py-3 rounded-md mb-6 shadow">
//           You’re on the <strong>Basic</strong> plan. Upgrade to unlock advanced
//           analytics and automation for your catalog.
//           <button
//             onClick={() => navigate("/app/upgrade")}
//             className="ml-3 text-purple-700 underline hover:text-purple-900 font-medium"
//           >
//             Upgrade Now
//           </button>
//         </div>
//       )}

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="catalog-blocks" direction="horizontal">
//           {provided => (
//             <div
//               className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//             >
//               {visibleBlocks.map((block, index) => (
//                 <Draggable key={block.id} draggableId={block.id} index={index}>
//                   {provided => (
//                     <div
//                       ref={provided.innerRef}
//                       {...provided.draggableProps}
//                       {...provided.dragHandleProps}
//                       className="bg-white rounded-md border shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5 duration-200"
//                     >
//                       <div className="flex items-start gap-4 p-5">
//                         <div className="bg-gray-100 rounded-md p-2">
//                           {block.icon}
//                         </div>
//                         <div className="flex-1">
//                           <h3 className="text-md font-semibold text-purple-700">
//                             {block.label}
//                           </h3>
//                           <p className="text-sm text-gray-600">
//                             {block.description}
//                           </p>
//                         </div>
//                         <MoreVertical size={16} className="text-gray-400" />
//                       </div>
//                       <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
//                         <button
//                           onClick={() => navigate(block.path)}
//                           className="text-sm text-purple-600 font-medium flex items-center gap-1 hover:text-purple-800"
//                         >
//                           {block.action} <ArrowRightCircle size={18} />
//                         </button>
//                         <div className="flex items-center gap-3">
//                           <button
//                             onClick={() => togglePin(block.id)}
//                             title="Pin this"
//                           >
//                             <Pin
//                               size={18}
//                               className={
//                                 pinned.includes(block.id)
//                                   ? "text-red-600"
//                                   : "text-gray-400 hover:text-red-500"
//                               }
//                             />
//                           </button>
//                           <button
//                             onClick={() => toggleArchive(block.id)}
//                             title="Archive this"
//                           >
//                             <Archive
//                               size={18}
//                               className={
//                                 archived.includes(block.id)
//                                   ? "text-indigo-600"
//                                   : "text-gray-400 hover:text-indigo-500"
//                               }
//                             />
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </Draggable>
//               ))}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>
//     </div>
//   );
// }
