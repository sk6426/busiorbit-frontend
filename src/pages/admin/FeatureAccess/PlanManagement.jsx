"use client";

import React, { useEffect, useState, useCallback } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { Button } from "../../../components/ui/button";
import { Switch } from "../../../components/ui/switch";
import { Pencil, Trash2, Layers } from "lucide-react";
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
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getPlanPermissions,
  updatePlanPermissions,
  getGroupedPermissions,
} from "../../../api/plans";

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

export default function PlanManagement() {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activeTab, setActiveTab] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [planForm, setPlanForm] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [featureGroups, setFeatureGroups] = useState([]);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching plans...");
      const { data } = await getPlans();
      console.log("Plans API response:", data);

      const normalized = Array.isArray(data) ? data : [];
      setPlans(normalized);

      if (normalized.length) {
        const first = normalized[0];
        console.log("Selecting first plan:", first);
        setSelectedPlan(first);
        fetchPermissions(first.id);
      } else {
        console.warn("No plans found from API");
        setSelectedPlan(null);
        setSelectedFeatures({});
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissions = async planId => {
    try {
      console.log("Fetching permissions for planId:", planId);
      const { data } = await getPlanPermissions(planId);
      console.log("Plan permissions API response:", data);

      const map = Array.isArray(data)
        ? data.reduce((acc, perm) => ({ ...acc, [perm.code]: true }), {})
        : {};
      setSelectedFeatures(map);
    } catch (err) {
      console.error("Error fetching permissions:", err);
    }
  };

  const fetchFeatures = async () => {
    try {
      console.log("Fetching grouped permissions...");
      const res = await getGroupedPermissions();
      console.log("Grouped permissions raw API response:", res);

      // ✅ Extract actual array
      const permissionsArray = res?.data?.data || [];

      if (Array.isArray(permissionsArray) && permissionsArray.length) {
        setFeatureGroups(permissionsArray);
        setActiveTab(permissionsArray[0].group);
        console.log("Feature groups set:", permissionsArray);
      } else {
        console.warn("No feature groups returned from API");
        setFeatureGroups([]);
      }
    } catch (err) {
      console.error("Error fetching features:", err);
      setFeatureGroups([]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedPlan) return;

    try {
      // Get all selected codes
      const selectedCodes = Object.entries(selectedFeatures)
        .filter(([_, isEnabled]) => isEnabled)
        .map(([code]) => code);

      // Map codes to IDs
      const enabledPermissionIds = featureGroups
        .flatMap(group => group.features)
        .filter(feature => selectedCodes.includes(feature.code))
        .map(feature => feature.id); // GUIDs

      console.log(
        "Saving permissions for plan:",
        selectedPlan.id,
        enabledPermissionIds
      );

      await updatePlanPermissions(selectedPlan.id, enabledPermissionIds);

      // Optionally refresh UI
      // await fetchPermissions(selectedPlan.id);

      // toast.success("Permissions updated successfully!");
    } catch (err) {
      console.error("Error saving permissions:", err);
      // toast.error("Failed to save permissions");
    }
  };

  const toggleFeature = featureCode => {
    console.log("Toggling feature:", featureCode);
    setSelectedFeatures(prev => ({
      ...prev,
      [featureCode]: !prev[featureCode],
    }));
  };

  const handleFormSubmit = async () => {
    try {
      if (formMode === "create") {
        console.log("Creating new plan:", planForm);
        await createPlan({
          name: planForm.name,
          code:
            planForm.code || planForm.name.toUpperCase().replace(/\s+/g, "_"),
          description: planForm.description,
          isActive: true,
        });
      } else {
        console.log("Updating plan:", selectedPlan.id, planForm);
        await updatePlan(selectedPlan.id, {
          name: planForm.name,
          code: planForm.code,
          description: planForm.description,
          isActive: true,
        });
      }
      setIsDialogOpen(false);
      setPlanForm({ name: "", code: "", description: "" });
      fetchPlans();
    } catch (err) {
      console.error("Error saving plan:", err);
    }
  };

  const handleDeletePlan = async planId => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;
    try {
      console.log("Deleting plan:", planId);
      await deletePlan(planId);
      if (selectedPlan?.id === planId) {
        setSelectedPlan(null);
        setSelectedFeatures({});
      }
      fetchPlans();
    } catch (err) {
      console.error("Error deleting plan:", err);
    }
  };

  const openEditModal = plan => {
    console.log("Opening edit modal for plan:", plan);
    setFormMode("edit");
    setPlanForm({
      name: plan.name,
      code: plan.code,
      description: plan.description || "",
    });
    setSelectedPlan(plan);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    console.log("Component mounted: fetching plans and features...");
    fetchPlans();
    fetchFeatures();
  }, [fetchPlans]);

  return (
    <div className="flex h-full p-6 gap-6">
      {/* Left side: Plans */}
      <div className="w-1/3 border rounded-xl p-4 bg-white shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold">Plans</h2>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => {
              console.log("Opening create plan modal");
              setFormMode("create");
              setPlanForm({ name: "", code: "", description: "" });
              setIsDialogOpen(true);
            }}
          >
            + Add Plan
          </Button>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-gray-500">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="p-4 text-sm text-gray-500 bg-gray-50 border rounded-md">
            No plans found.
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {plans.map(plan => (
              <div
                key={plan.id}
                onClick={() => {
                  console.log("Selecting plan:", plan);
                  setSelectedPlan(plan);
                  fetchPermissions(plan.id);
                }}
                className={cn(
                  "p-4 rounded-lg border transition-all cursor-pointer flex items-center justify-between group",
                  selectedPlan?.id === plan.id
                    ? "border-purple-500 bg-purple-50 shadow-md"
                    : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 text-purple-600 p-2 rounded-full">
                    <Layers size={18} />
                  </div>
                  <div>
                    <span className="text-base font-semibold text-gray-800">
                      {plan.name}
                    </span>
                    {plan.description && (
                      <p className="text-xs text-gray-500">
                        {plan.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      openEditModal(plan);
                    }}
                    className="p-1.5 rounded-md bg-purple-100 text-purple-600 hover:bg-purple-200"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDeletePlan(plan.id);
                    }}
                    className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right side: Features */}
      <div className="flex-1 border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4">
          Feature Mapping – {selectedPlan?.name || "N/A"}
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
                  feature => {
                    const display = feature.code
                      .replace(/\./g, " ")
                      .replace(/\b\w/g, c => c.toUpperCase());
                    return (
                      <div
                        key={feature.code}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        <span className="text-sm font-medium text-gray-700">
                          {display}
                        </span>
                        <Switch
                          id={feature.code}
                          checked={!!selectedFeatures[feature.code]}
                          onCheckedChange={() => toggleFeature(feature.code)}
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
            onClick={handleSavePermissions}
            disabled={!selectedPlan}
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
              {formMode === "create" ? "Create New Plan" : "Edit Plan"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="plan-name">Plan Name</Label>
              <Input
                id="plan-name"
                value={planForm.name}
                onChange={e =>
                  setPlanForm({ ...planForm, name: e.target.value })
                }
                placeholder="Enter plan name"
              />
            </div>
            <div>
              <Label htmlFor="plan-code">Code</Label>
              <Input
                id="plan-code"
                value={planForm.code}
                onChange={e =>
                  setPlanForm({ ...planForm, code: e.target.value })
                }
                placeholder="Enter code (optional)"
              />
            </div>
            <div>
              <Label htmlFor="plan-desc">Description</Label>
              <Input
                id="plan-desc"
                value={planForm.description}
                onChange={e =>
                  setPlanForm({ ...planForm, description: e.target.value })
                }
                placeholder="Enter description"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleFormSubmit} disabled={!planForm.name.trim()}>
              {formMode === "create" ? "Create" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
