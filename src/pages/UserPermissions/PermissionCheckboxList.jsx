// 📄 src/pages/UserPermissions/PermissionCheckboxList.jsx

import React from "react";

export default function PermissionCheckboxList({
  allPermissions,
  assignedPermissions,
  setAssignedPermissions,
}) {
  const grouped = allPermissions.reduce((acc, p) => {
    const group = p.group || "Other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {});

  const isChecked = id => assignedPermissions.includes(id);

  const handleToggle = id => {
    if (isChecked(id)) {
      setAssignedPermissions(assignedPermissions.filter(pid => pid !== id));
    } else {
      setAssignedPermissions([...assignedPermissions, id]);
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([group, permissions]) => (
        <div key={group}>
          <h3 className="font-semibold text-lg mb-2 border-b pb-1">{group}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {permissions.map(perm => (
              <label
                key={perm.id}
                className="flex items-center space-x-2 bg-gray-50 border rounded px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={isChecked(perm.id)}
                  onChange={() => handleToggle(perm.id)}
                />
                <span>{perm.name}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
