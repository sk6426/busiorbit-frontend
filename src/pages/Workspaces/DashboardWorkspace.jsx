import { useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
// ✅ use the new provider (server-authoritative permissions)
import { useAuth } from "../../app/providers/AuthProvider";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const widgetColors = [
  { icon: "💰", bg: "bg-purple-100", ring: "ring-purple-500" },
  { icon: "📈", bg: "bg-indigo-100", ring: "ring-indigo-500" },
  { icon: "📊", bg: "bg-orange-100", ring: "ring-orange-500" },
  { icon: "💳", bg: "bg-blue-100", ring: "ring-blue-500" },
  { icon: "👥", bg: "bg-green-100", ring: "ring-green-500" },
  { icon: "↩️", bg: "bg-red-100", ring: "ring-red-500" },
];

export default function DashboardWorkspace() {
  const { isLoading, hasAllAccess, can } = useAuth();

  // if you’ve seeded "dashboard.view" on the server, this will gate the page
  const allowed =
    hasAllAccess || (typeof can === "function" && can("dashboard.view"));

  const [selectedRange, setSelectedRange] = useState("Last 7 days");
  const [activeTab, setActiveTab] = useState("overview");

  const handleRangeChange = e => setSelectedRange(e.target.value);

  const kpis = [
    { label: "Total Revenue", value: "$12.5K" },
    { label: "New Leads", value: "384" },
    { label: "Conv. Rate", value: "3.7%" },
    { label: "Active Users", value: "1.2K" },
    { label: "Sessions", value: "3.4K" },
    { label: "Bounce Rate", value: "41%" },
  ];

  const messagesData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Messages Sent",
        data: [150, 200, 180, 220, 300, 250, 270],
        backgroundColor: "#7c3aed",
        borderRadius: 4,
        barThickness: 16,
      },
    ],
  };

  const deliveryData = {
    labels: ["Delivered", "Pending", "Failed"],
    datasets: [
      {
        label: "Delivery Status",
        data: [70, 20, 10],
        backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
        borderWidth: 1,
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-purple-700 font-semibold">
        Loading dashboard…
      </div>
    );
  }

  if (!allowed) {
    // If the route is already wrapped in a FeatureGuard (FEATURE_KEYS.Dashboard),
    // you won’t normally hit this. It’s a safe fallback.
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-md p-4">
          You don’t have access to the Dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen text-sm">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
          📊 Dashboard
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={selectedRange}
            onChange={handleRangeChange}
            className="border rounded px-2 py-1 text-xs"
          >
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>This month</option>
          </select>
          <button className="border rounded px-3 py-1 text-xs">Export</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4" aria-label="Tabs">
          <button
            className={`pb-1 text-xs font-medium ${
              activeTab === "overview"
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`pb-1 text-xs font-medium ${
              activeTab === "engagement"
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("engagement")}
          >
            Engagement
          </button>
        </nav>
      </div>

      {activeTab === "overview" && (
        <>
          {/* KPI widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpis.map((kpi, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between border hover:shadow-md transition"
              >
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                        widgetColors[i % widgetColors.length].bg
                      }`}
                    >
                      {widgetColors[i % widgetColors.length].icon}
                    </span>
                    {kpi.label}
                  </p>
                  <p className="text-lg font-bold text-gray-900">{kpi.value}</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 ${
                    widgetColors[i % widgetColors.length].ring
                  } border-opacity-40`}
                />
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-lg border shadow-sm col-span-2">
              <h3 className="text-sm font-medium mb-2">
                📈 Messages Sent (Weekly)
              </h3>
              <Bar
                data={messagesData}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                }}
                height={160}
              />
            </div>
            <div className="bg-white p-3 rounded-lg border shadow-sm">
              <h3 className="text-sm font-medium mb-2">📊 Delivery Status</h3>
              <Doughnut data={deliveryData} />
            </div>
          </div>

          {/* Compact widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <h4 className="text-xs font-medium text-gray-500 mb-1">
                Top Performing CTA
              </h4>
              <p className="text-base font-semibold text-gray-800">
                Get Quote Now
              </p>
              <p className="text-xs text-gray-500">CTR: 42.3%</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <h4 className="text-xs font-medium text-gray-500 mb-1">
                Most Used Channel
              </h4>
              <p className="text-base font-semibold text-gray-800">WhatsApp</p>
              <p className="text-xs text-gray-500">68% of total campaigns</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <h4 className="text-xs font-medium text-gray-500 mb-1">
                Avg. Time Between Actions
              </h4>
              <p className="text-base font-semibold text-gray-800">3m 28s</p>
              <p className="text-xs text-gray-500">Based on last 100 events</p>
            </div>
          </div>
        </>
      )}

      {activeTab === "engagement" && (
        <div className="text-gray-500 p-3 bg-white rounded-md border shadow-sm text-xs">
          Engagement metrics coming soon...
        </div>
      )}
    </div>
  );
}

// import { useState } from "react";
// import { Bar, Doughnut } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   ArcElement,
// } from "chart.js";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   ArcElement
// );

// const widgetColors = [
//   { icon: "💰", bg: "bg-purple-100", ring: "ring-purple-500" },
//   { icon: "📈", bg: "bg-indigo-100", ring: "ring-indigo-500" },
//   { icon: "📊", bg: "bg-orange-100", ring: "ring-orange-500" },
//   { icon: "💳", bg: "bg-blue-100", ring: "ring-blue-500" },
//   { icon: "👥", bg: "bg-green-100", ring: "ring-green-500" },
//   { icon: "↩️", bg: "bg-red-100", ring: "ring-red-500" },
// ];

// export default function DashboardOverview() {
//   const [selectedRange, setSelectedRange] = useState("Last 7 days");
//   const [activeTab, setActiveTab] = useState("overview");

//   const handleRangeChange = e => setSelectedRange(e.target.value);

//   const kpis = [
//     { label: "Total Revenue", value: "$12.5K" },
//     { label: "New Leads", value: "384" },
//     { label: "Conv. Rate", value: "3.7%" },
//     { label: "Active Users", value: "1.2K" },
//     { label: "Sessions", value: "3.4K" },
//     { label: "Bounce Rate", value: "41%" },
//   ];

//   const messagesData = {
//     labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
//     datasets: [
//       {
//         label: "Messages Sent",
//         data: [150, 200, 180, 220, 300, 250, 270],
//         backgroundColor: "#7c3aed",
//         borderRadius: 4,
//         barThickness: 16,
//       },
//     ],
//   };

//   const deliveryData = {
//     labels: ["Delivered", "Pending", "Failed"],
//     datasets: [
//       {
//         label: "Delivery Status",
//         data: [70, 20, 10],
//         backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
//         borderWidth: 1,
//       },
//     ],
//   };

//   return (
//     <div className="p-4 space-y-4 bg-gray-50 min-h-screen text-sm">
//       <div className="flex justify-between items-center">
//         <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
//           📊 Dashboard
//         </h2>
//         <div className="flex items-center gap-2">
//           <select
//             value={selectedRange}
//             onChange={handleRangeChange}
//             className="border rounded px-2 py-1 text-xs"
//           >
//             <option>Last 7 days</option>
//             <option>Last 30 days</option>
//             <option>This month</option>
//           </select>
//           <button className="border rounded px-3 py-1 text-xs">Export</button>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="border-b border-gray-200">
//         <nav className="flex space-x-4" aria-label="Tabs">
//           <button
//             className={`pb-1 text-xs font-medium ${
//               activeTab === "overview"
//                 ? "border-b-2 border-purple-600 text-purple-600"
//                 : "text-gray-500 hover:text-gray-700"
//             }`}
//             onClick={() => setActiveTab("overview")}
//           >
//             Overview
//           </button>
//           <button
//             className={`pb-1 text-xs font-medium ${
//               activeTab === "engagement"
//                 ? "border-b-2 border-purple-600 text-purple-600"
//                 : "text-gray-500 hover:text-gray-700"
//             }`}
//             onClick={() => setActiveTab("engagement")}
//           >
//             Engagement
//           </button>
//         </nav>
//       </div>

//       {activeTab === "overview" && (
//         <>
//           {/* Stylish KPI Widgets */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
//             {kpis.map((kpi, i) => (
//               <div
//                 key={i}
//                 className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between border hover:shadow-md transition"
//               >
//                 <div>
//                   <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
//                     <span
//                       className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white ${
//                         widgetColors[i % widgetColors.length].bg
//                       }`}
//                     >
//                       {widgetColors[i % widgetColors.length].icon}
//                     </span>
//                     {kpi.label}
//                   </p>
//                   <p className="text-lg font-bold text-gray-900">{kpi.value}</p>
//                 </div>
//                 <div
//                   className={`w-6 h-6 rounded-full border-2 ${
//                     widgetColors[i % widgetColors.length].ring
//                   } border-opacity-40`}
//                 />
//               </div>
//             ))}
//           </div>

//           {/* Charts + Widget */}
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
//             <div className="bg-white p-3 rounded-lg border shadow-sm col-span-2">
//               <h3 className="text-sm font-medium mb-2">
//                 📈 Messages Sent (Weekly)
//               </h3>
//               <Bar
//                 data={messagesData}
//                 options={{
//                   responsive: true,
//                   plugins: { legend: { display: false } },
//                 }}
//                 height={160}
//               />
//             </div>
//             <div className="bg-white p-3 rounded-lg border shadow-sm">
//               <h3 className="text-sm font-medium mb-2">📊 Delivery Status</h3>
//               <Doughnut data={deliveryData} />
//             </div>
//           </div>

//           {/* New Compact Widgets */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//             <div className="bg-white rounded-lg p-3 shadow-sm border">
//               <h4 className="text-xs font-medium text-gray-500 mb-1">
//                 Top Performing CTA
//               </h4>
//               <p className="text-base font-semibold text-gray-800">
//                 Get Quote Now
//               </p>
//               <p className="text-xs text-gray-500">CTR: 42.3%</p>
//             </div>
//             <div className="bg-white rounded-lg p-3 shadow-sm border">
//               <h4 className="text-xs font-medium text-gray-500 mb-1">
//                 Most Used Channel
//               </h4>
//               <p className="text-base font-semibold text-gray-800">WhatsApp</p>
//               <p className="text-xs text-gray-500">68% of total campaigns</p>
//             </div>
//             <div className="bg-white rounded-lg p-3 shadow-sm border">
//               <h4 className="text-xs font-medium text-gray-500 mb-1">
//                 Avg. Time Between Actions
//               </h4>
//               <p className="text-base font-semibold text-gray-800">3m 28s</p>
//               <p className="text-xs text-gray-500">Based on last 100 events</p>
//             </div>
//           </div>
//         </>
//       )}

//       {activeTab === "engagement" && (
//         <div className="text-gray-500 p-3 bg-white rounded-md border shadow-sm text-xs">
//           Engagement metrics coming soon...
//         </div>
//       )}
//     </div>
//   );
// }
// import { useState } from "react";
// import { Bar, Doughnut } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   ArcElement,
// } from "chart.js";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   ArcElement
// );

// const widgetColors = [
//   { icon: "💰", bg: "bg-purple-100", ring: "ring-purple-500" },
//   { icon: "📈", bg: "bg-indigo-100", ring: "ring-indigo-500" },
//   { icon: "📊", bg: "bg-orange-100", ring: "ring-orange-500" },
//   { icon: "💳", bg: "bg-blue-100", ring: "ring-blue-500" },
//   { icon: "👥", bg: "bg-green-100", ring: "ring-green-500" },
//   { icon: "↩️", bg: "bg-red-100", ring: "ring-red-500" },
// ];

// export default function DashboardOverview() {
//   const [selectedRange, setSelectedRange] = useState("Last 7 days");
//   const [activeTab, setActiveTab] = useState("overview");

//   const handleRangeChange = e => setSelectedRange(e.target.value);

//   const kpis = [
//     { label: "Total Revenue", value: "$12.5K" },
//     { label: "New Leads", value: "384" },
//     { label: "Conv. Rate", value: "3.7%" },
//     { label: "Active Users", value: "1.2K" },
//     { label: "Sessions", value: "3.4K" },
//     { label: "Bounce Rate", value: "41%" },
//   ];

//   const messagesData = {
//     labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
//     datasets: [
//       {
//         label: "Messages Sent",
//         data: [150, 200, 180, 220, 300, 250, 270],
//         backgroundColor: "#7c3aed",
//         borderRadius: 4,
//         barThickness: 16,
//       },
//     ],
//   };

//   const deliveryData = {
//     labels: ["Delivered", "Pending", "Failed"],
//     datasets: [
//       {
//         label: "Delivery Status",
//         data: [70, 20, 10],
//         backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
//         borderWidth: 1,
//       },
//     ],
//   };

//   return (
//     <div className="p-4 space-y-4 bg-gray-50 min-h-screen text-sm">
//       <div className="flex justify-between items-center">
//         <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
//           📊 Dashboard
//         </h2>
//         <div className="flex items-center gap-2">
//           <select
//             value={selectedRange}
//             onChange={handleRangeChange}
//             className="border rounded px-2 py-1 text-xs"
//           >
//             <option>Last 7 days</option>
//             <option>Last 30 days</option>
//             <option>This month</option>
//           </select>
//           <button className="border rounded px-3 py-1 text-xs">Export</button>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="border-b border-gray-200">
//         <nav className="flex space-x-4" aria-label="Tabs">
//           <button
//             className={`pb-1 text-xs font-medium ${
//               activeTab === "overview"
//                 ? "border-b-2 border-purple-600 text-purple-600"
//                 : "text-gray-500 hover:text-gray-700"
//             }`}
//             onClick={() => setActiveTab("overview")}
//           >
//             Overview
//           </button>
//           <button
//             className={`pb-1 text-xs font-medium ${
//               activeTab === "engagement"
//                 ? "border-b-2 border-purple-600 text-purple-600"
//                 : "text-gray-500 hover:text-gray-700"
//             }`}
//             onClick={() => setActiveTab("engagement")}
//           >
//             Engagement
//           </button>
//         </nav>
//       </div>

//       {activeTab === "overview" && (
//         <>
//           {/* Stylish KPI Widgets */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
//             {kpis.map((kpi, i) => (
//               <div
//                 key={i}
//                 className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between border hover:shadow-md transition"
//               >
//                 <div>
//                   <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
//                     <span
//                       className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white ${
//                         widgetColors[i % widgetColors.length].bg
//                       }`}
//                     >
//                       {widgetColors[i % widgetColors.length].icon}
//                     </span>
//                     {kpi.label}
//                   </p>
//                   <p className="text-lg font-bold text-gray-900">{kpi.value}</p>
//                 </div>
//                 <div
//                   className={`w-6 h-6 rounded-full border-2 ${
//                     widgetColors[i % widgetColors.length].ring
//                   } border-opacity-40`}
//                 />
//               </div>
//             ))}
//           </div>

//           {/* Charts + Widget */}
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
//             <div className="bg-white p-3 rounded-lg border shadow-sm col-span-2">
//               <h3 className="text-sm font-medium mb-2">
//                 📈 Messages Sent (Weekly)
//               </h3>
//               <Bar
//                 data={messagesData}
//                 options={{
//                   responsive: true,
//                   plugins: { legend: { display: false } },
//                 }}
//                 height={160}
//               />
//             </div>
//             <div className="bg-white p-3 rounded-lg border shadow-sm">
//               <h3 className="text-sm font-medium mb-2">📊 Delivery Status</h3>
//               <Doughnut data={deliveryData} />
//             </div>
//           </div>

//           {/* New Compact Widgets */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//             <div className="bg-white rounded-lg p-3 shadow-sm border">
//               <h4 className="text-xs font-medium text-gray-500 mb-1">
//                 Top Performing CTA
//               </h4>
//               <p className="text-base font-semibold text-gray-800">
//                 Get Quote Now
//               </p>
//               <p className="text-xs text-gray-500">CTR: 42.3%</p>
//             </div>
//             <div className="bg-white rounded-lg p-3 shadow-sm border">
//               <h4 className="text-xs font-medium text-gray-500 mb-1">
//                 Most Used Channel
//               </h4>
//               <p className="text-base font-semibold text-gray-800">WhatsApp</p>
//               <p className="text-xs text-gray-500">68% of total campaigns</p>
//             </div>
//             <div className="bg-white rounded-lg p-3 shadow-sm border">
//               <h4 className="text-xs font-medium text-gray-500 mb-1">
//                 Avg. Time Between Actions
//               </h4>
//               <p className="text-base font-semibold text-gray-800">3m 28s</p>
//               <p className="text-xs text-gray-500">Based on last 100 events</p>
//             </div>
//           </div>
//         </>
//       )}

//       {activeTab === "engagement" && (
//         <div className="text-gray-500 p-3 bg-white rounded-md border shadow-sm text-xs">
//           Engagement metrics coming soon...
//         </div>
//       )}
//     </div>
//   );
// }
