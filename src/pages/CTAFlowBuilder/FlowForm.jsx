import React, { useEffect, useState } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import axiosClient from "../../api/axiosClient";

const FlowForm = ({ isOpen, onClose, onAdd, initialStep, allSteps }) => {
  const [formData, setFormData] = useState({
    buttonText: "",
    templateName: "",
    nextStepId: null,
  });

  const [templates, setTemplates] = useState([]);
  const [saving, setSaving] = useState(false);

  // Pre-fill form if editing
  useEffect(() => {
    if (initialStep) {
      setFormData({
        buttonText: initialStep.buttonText,
        templateName: initialStep.templateName,
        nextStepId: initialStep.nextStepId || null,
      });
    } else {
      setFormData({
        buttonText: "",
        templateName: "",
        nextStepId: null,
      });
    }
  }, [initialStep]);

  // Fetch WhatsApp templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axiosClient.get(
          "/WhatsAppTemplateFetcher/get-template-all"
        );
        const tplList = res.data.templates;
        setTemplates(Array.isArray(tplList) ? tplList : []);
        console.log("📦 Loaded templates:", tplList);
      } catch (err) {
        toast.error("Failed to fetch templates.");
      }
    };
    fetchTemplates();
  }, []);

  const handleSave = async () => {
    if (!formData.buttonText || !formData.templateName) {
      toast.warn("Button text and template name are required.");
      return;
    }

    setSaving(true);
    try {
      await onAdd(formData);
      onClose();
    } catch (err) {
      toast.error("Error saving step.");
    } finally {
      setSaving(false);
    }
  };

  const nextStepOptions = allSteps
    .filter(step => !initialStep || step.id !== initialStep.id)
    .map(step => ({
      value: step.id,
      label: step.buttonText || step.templateName,
    }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg space-y-4">
        <h2 className="text-xl font-semibold">
          {initialStep ? "Edit Step" : "Add Step"}
        </h2>

        {/* Button Text */}
        <input
          type="text"
          placeholder="Button Text"
          className="w-full border rounded px-3 py-2"
          value={formData.buttonText}
          onChange={e =>
            setFormData({ ...formData, buttonText: e.target.value })
          }
        />

        {/* Template Dropdown */}
        <select
          className="w-full border rounded px-3 py-2"
          value={formData.templateName}
          onChange={e =>
            setFormData({ ...formData, templateName: e.target.value })
          }
        >
          <option value="">Select Template</option>
          {templates.map(tpl => (
            <option key={tpl.name} value={tpl.name}>
              {tpl.name} ({tpl.language})
            </option>
          ))}
        </select>

        {/* Next Step Selector */}
        <div>
          <label className="block mb-1 font-medium">Next Step (Optional)</label>
          <Select
            isClearable
            options={nextStepOptions}
            value={
              nextStepOptions.find(opt => opt.value === formData.nextStepId) ||
              null
            }
            onChange={selected =>
              setFormData({
                ...formData,
                nextStepId: selected ? selected.value : null,
              })
            }
            placeholder="Select next step"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            className="px-4 py-2 bg-gray-200 rounded"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Step"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlowForm;
