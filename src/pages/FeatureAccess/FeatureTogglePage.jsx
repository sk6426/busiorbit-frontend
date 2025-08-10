// 📄 src/pages/FeatureAccess/FeatureTogglePage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "../../components/ui/card"; // Corrected this line
import { toast } from "react-toastify";

export default function FeatureTogglePage() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatureToggles();
  }, []);

  const fetchFeatureToggles = async () => {
    try {
      const res = await axios.get("/api/feature-access/feature-toggle-view");
      setFeatures(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load features");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">🧩 Feature Toggle View</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <Card className="overflow-x-auto p-4 shadow-md">
          <table className="min-w-full table-auto border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Feature</th>
                <th className="px-4 py-2">Group</th>
                <th className="px-4 py-2">In Plan</th>
                <th className="px-4 py-2">Overridden</th>
                <th className="px-4 py-2">Active?</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2 font-medium">{f.featureCode}</td>
                  <td className="px-4 py-2">{f.group}</td>
                  <td className="px-4 py-2 text-center">
                    {f.isAvailableInPlan ? "✅" : "❌"}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {f.isOverridden === true
                      ? "✅"
                      : f.isOverridden === false
                      ? "❌"
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {f.isActive ? "✅" : "❌"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// // 📄 src/pages/FeatureAccess/FeatureTogglePage.jsx
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { Card, CardContent } from "../../components/ui/card";
// import { toast } from "react-toastify";

// export default function FeatureTogglePage() {
//   const [features, setFeatures] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchFeatureToggles();
//   }, []);

//   const fetchFeatureToggles = async () => {
//     try {
//       const res = await axios.get("/api/feature-access/feature-toggle-view");
//       setFeatures(res.data.data || []);
//     } catch (err) {
//       toast.error("Failed to load features");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-semibold mb-4">🧩 Feature Toggle View</h1>

//       {loading ? (
//         <p>Loading...</p>
//       ) : (
//         <Card className="overflow-x-auto p-4 shadow-md">
//           <table className="min-w-full table-auto border border-gray-200">
//             <thead>
//               <tr className="bg-gray-100">
//                 <th className="px-4 py-2 text-left">Feature</th>
//                 <th className="px-4 py-2">Group</th>
//                 <th className="px-4 py-2">In Plan</th>
//                 <th className="px-4 py-2">Overridden</th>
//                 <th className="px-4 py-2">Active?</th>
//               </tr>
//             </thead>
//             <tbody>
//               {features.map((f, i) => (
//                 <tr key={i} className="border-t">
//                   <td className="px-4 py-2 font-medium">{f.featureCode}</td>
//                   <td className="px-4 py-2">{f.group}</td>
//                   <td className="px-4 py-2 text-center">
//                     {f.isAvailableInPlan ? "✅" : "❌"}
//                   </td>
//                   <td className="px-4 py-2 text-center">
//                     {f.isOverridden === true
//                       ? "✅"
//                       : f.isOverridden === false
//                       ? "❌"
//                       : "—"}
//                   </td>
//                   <td className="px-4 py-2 text-center">
//                     {f.isActive ? "✅" : "❌"}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </Card>
//       )}
//     </div>
//   );
// }
