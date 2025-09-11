"use client";

import React, { useEffect, useState, useCallback } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { Button } from "../../../components/ui/button";
import { Switch } from "../../../components/ui/switch";
import { Pencil, Trash2, Users2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  updateRolePermissions,
} from "../../../api/roles";
import { getGroupedPermissions } from "../../../api/plans"; // reuse same endpoint

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Tabs = TabsPrimitive.Root;
const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-md bg-gray-100 p-1 text-gray-600",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-2 focus-visible:outline-none", className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export default function RolePermissionsPage() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [activeTab, setActiveTab] = useState("");
  const [featureGroups, setFeatureGroups] = useState([]);
  const [selected, setSelected] = useState({}); // { 'permission.code': true }
  const [loading, setLoading] = useState(true);

  // modal state for create/edit role (optional)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [roleForm, setRoleForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  // ===== Fetchers =====
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getRoles();
      const arr = Array.isArray(data) ? data : [];
      setRoles(arr);
      if (arr.length) {
        setSelectedRole(arr[0]);
        await fetchRolePermissions(arr[0].id);
      }
    } catch (e) {
      console.error("getRoles failed", e);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGrouped = async () => {
    try {
      const res = await getGroupedPermissions();
      const groups = res?.data?.data || [];
      setFeatureGroups(groups);
      if (groups.length) setActiveTab(groups[0].group);
    } catch (e) {
      console.error("getGroupedPermissions failed", e);
      setFeatureGroups([]);
    }
  };

  const fetchRolePermissions = async roleId => {
    try {
      const { data } = await getRolePermissions(roleId);
      // API returns array of permission codes or objects {id, code}
      const codes = Array.isArray(data)
        ? data.map(x => (typeof x === "string" ? x : x.code))
        : [];
      const map = Object.fromEntries(codes.map(c => [c, true]));
      setSelected(map);
    } catch (e) {
      console.error("getRolePermissions failed", e);
      setSelected({});
    }
  };

  // ===== Save =====
  const handleSave = async () => {
    if (!selectedRole) return;
    try {
      const pickedCodes = Object.entries(selected)
        .filter(([, v]) => v)
        .map(([code]) => code);

      // map codes → ids using featureGroups
      const enabledPermissionIds = featureGroups
        .flatMap(g => g.features || [])
        .filter(f => pickedCodes.includes(f.code))
        .map(f => f.id);

      await updateRolePermissions(selectedRole.id, enabledPermissionIds);
      // optionally refresh from source of truth
      // await fetchRolePermissions(selectedRole.id);
    } catch (e) {
      console.error("updateRolePermissions failed", e);
    }
  };

  const toggle = permCode => {
    setSelected(prev => ({ ...prev, [permCode]: !prev[permCode] }));
  };

  // ===== Role CRUD (optional UI) =====
  const openCreate = () => {
    setFormMode("create");
    setRoleForm({ name: "", code: "", description: "" });
    setIsDialogOpen(true);
  };

  const openEdit = role => {
    setFormMode("edit");
    setRoleForm({
      name: role.name,
      code: role.code,
      description: role.description || "",
    });
    setSelectedRole(role);
    setIsDialogOpen(true);
  };

  const handleRoleFormSubmit = async () => {
    try {
      if (formMode === "create") {
        await createRole({
          name: roleForm.name,
          code:
            roleForm.code || roleForm.name.toUpperCase().replace(/\s+/g, "_"),
          description: roleForm.description,
          isActive: true,
        });
      } else if (selectedRole) {
        await updateRole(selectedRole.id, {
          name: roleForm.name,
          code: roleForm.code,
          description: roleForm.description,
          isActive: true,
        });
      }
      setIsDialogOpen(false);
      setRoleForm({ name: "", code: "", description: "" });
      await fetchRoles();
    } catch (e) {
      console.error("save role failed", e);
    }
  };

  const handleDeleteRole = async roleId => {
    if (!window.confirm("Delete this role?")) return;
    try {
      await deleteRole(roleId);
      if (selectedRole?.id === roleId) {
        setSelectedRole(null);
        setSelected({});
      }
      await fetchRoles();
    } catch (e) {
      console.error("delete role failed", e);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchGrouped();
  }, [fetchRoles]);

  return (
    <div className="flex h-full p-6 gap-6">
      {/* Left: Roles */}
      <div className="w-1/3 border rounded-xl p-4 bg-white shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold">Roles</h2>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={openCreate}
          >
            + Add Role
          </Button>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-gray-500">Loading roles...</div>
        ) : roles.length === 0 ? (
          <div className="p-4 text-sm text-gray-500 bg-gray-50 border rounded-md">
            No roles found.
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {roles.map(role => (
              <div
                key={role.id}
                onClick={() => {
                  setSelectedRole(role);
                  fetchRolePermissions(role.id);
                }}
                className={cn(
                  "p-4 rounded-lg border transition-all cursor-pointer flex items-center justify-between group",
                  selectedRole?.id === role.id
                    ? "border-purple-500 bg-purple-50 shadow-md"
                    : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 text-purple-600 p-2 rounded-full">
                    <Users2 size={18} />
                  </div>
                  <div>
                    <span className="text-base font-semibold text-gray-800">
                      {role.name}
                    </span>
                    {role.description && (
                      <p className="text-xs text-gray-500">
                        {role.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      openEdit(role);
                    }}
                    className="p-1.5 rounded-md bg-purple-100 text-purple-600 hover:bg-purple-200"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteRole(role.id);
                    }}
                    className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Permissions */}
      <div className="flex-1 border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4">
          Permission Mapping – {selectedRole?.name || "N/A"}
        </h2>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            {featureGroups.map(group => (
              <TabsTrigger key={group.group} value={group.group}>
                {group.group}
              </TabsTrigger>
            ))}
          </TabsList>

          {featureGroups.map(group => (
            <TabsContent key={group.group} value={group.group}>
              <div className="space-y-3">
                {(Array.isArray(group.features) ? group.features : []).map(
                  f => {
                    const display = f.code
                      .replace(/\./g, " ")
                      .replace(/\b\w/g, c => c.toUpperCase());
                    return (
                      <div
                        key={f.code}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        <span className="text-sm font-medium text-gray-700">
                          {display}
                        </span>
                        <Switch
                          id={f.code}
                          checked={!!selected[f.code]}
                          onCheckedChange={() => toggle(f.code)}
                        />
                      </div>
                    );
                  }
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6">
          <Button
            onClick={handleSave}
            disabled={!selectedRole}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formMode === "create" ? "Create New Role" : "Edit Role"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                value={roleForm.name}
                onChange={e =>
                  setRoleForm({ ...roleForm, name: e.target.value })
                }
                placeholder="Enter role name"
              />
            </div>
            <div>
              <Label htmlFor="role-code">Code</Label>
              <Input
                id="role-code"
                value={roleForm.code}
                onChange={e =>
                  setRoleForm({ ...roleForm, code: e.target.value })
                }
                placeholder="BUSINESS, ADMIN, SUPPORT..."
              />
            </div>
            <div>
              <Label htmlFor="role-desc">Description</Label>
              <Input
                id="role-desc"
                value={roleForm.description}
                onChange={e =>
                  setRoleForm({ ...roleForm, description: e.target.value })
                }
                placeholder="Enter description"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleRoleFormSubmit}
              disabled={!roleForm.name.trim()}
            >
              {formMode === "create" ? "Create" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
