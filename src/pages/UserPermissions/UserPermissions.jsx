// 📄 src/pages/UserPermissions/UserPermissions.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import PermissionCheckboxList from "./PermissionCheckboxList";

export default function UserPermissions() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [allPermissions, setAllPermissions] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchAllPermissions();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/users/by-business");
      setUsers(res.data);
    } catch (err) {
      toast.error("Failed to fetch users");
    }
  };

  const fetchAllPermissions = async () => {
    try {
      const res = await axios.get("/api/permissions");
      setAllPermissions(res.data);
    } catch (err) {
      toast.error("Failed to load permissions");
    }
  };

  const fetchUserPermissions = async userId => {
    try {
      const res = await axios.get(`/api/users/${userId}/permissions`);
      setUserPermissions(res.data);
    } catch (err) {
      toast.error("Failed to fetch user permissions");
    }
  };

  const handleUserChange = e => {
    const id = e.target.value;
    setSelectedUserId(id);
    fetchUserPermissions(id);
  };

  const handleSave = async () => {
    try {
      await axios.post(
        `/api/users/${selectedUserId}/permissions`,
        userPermissions
      );
      toast.success("Permissions updated successfully");
    } catch (err) {
      toast.error("Failed to save permissions");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">User Permissions</h2>

      <div className="mb-4">
        <label className="block font-medium mb-1">Select User:</label>
        <select
          value={selectedUserId}
          onChange={handleUserChange}
          className="w-full border rounded p-2"
        >
          <option value="">-- Select --</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.fullName} ({user.role})
            </option>
          ))}
        </select>
      </div>

      {selectedUserId && (
        <>
          <PermissionCheckboxList
            allPermissions={allPermissions}
            assignedPermissions={userPermissions}
            setAssignedPermissions={setUserPermissions}
          />
          <button
            onClick={handleSave}
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded shadow"
          >
            Save Permissions
          </button>
        </>
      )}
    </div>
  );
}
