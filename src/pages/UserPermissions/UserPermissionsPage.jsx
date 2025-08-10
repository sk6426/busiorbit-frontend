// 📄 File: src/pages/UserPermissions/UserPermissionsPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function UserPermissionsPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  const fetchPermissions = async () => {
    try {
      const res = await axios.get("/api/feature-access/user-permissions");
      setUsers(res.data);
    } catch (err) {
      toast.error("Failed to load user permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleToggle = async (userId, featureCode, current) => {
    try {
      await axios.patch(`/api/feature-access/user-permissions/${userId}`, {
        featureCode,
        isEnabled: !current,
      });
      toast.success("Permission updated");
      fetchPermissions();
    } catch (err) {
      toast.error("Failed to update permission");
    }
  };

  if (loading) return <p className="p-4">Loading permissions...</p>;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">User Feature Permissions</h2>
      {users.map(user => (
        <Card key={user.userId} className="shadow">
          <CardContent className="p-4 space-y-4">
            <div>
              <h3 className="font-bold">
                {user.fullName} ({user.email})
              </h3>
              <p className="text-sm text-gray-500">Role: {user.role}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {user.permissions.map(perm => (
                <div
                  key={perm.featureCode}
                  className="flex items-center gap-2 border p-2 rounded-md"
                >
                  <Switch
                    id={`${user.userId}-${perm.featureCode}`}
                    checked={perm.isEnabled}
                    onCheckedChange={() =>
                      handleToggle(
                        user.userId,
                        perm.featureCode,
                        perm.isEnabled
                      )
                    }
                  />
                  <Label
                    htmlFor={`${user.userId}-${perm.featureCode}`}
                    className="text-sm"
                  >
                    {perm.featureCode}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
