"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/components/confirm-dialog";
import { toast } from "sonner";

type ChecklistTemplate = {
  id: string;
  entityType: string;
  name: string;
  description: string | null;
  fieldKey: string | null;
  itemType: string;
  required: boolean;
  sortOrder: number;
  dueOffsetDays: number | null;
};

const ENTITY_TYPES = ["speaker", "sponsor", "venue", "booth", "volunteer", "media"];
const ITEM_TYPES = ["file_upload", "text_input", "link", "confirmation", "meeting"];

export function ChecklistsTab() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("speaker");
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    itemType: "text_input",
    fieldKey: "",
    required: true,
    dueOffsetDays: -14,
  });
  const [saving, setSaving] = useState(false);

  const fetchTemplates = () => {
    setLoading(true);
    fetch(`/api/checklist-templates?entityType=${selectedType}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setTemplates(d.data);
      })
      .catch(() => {
        toast.error("Failed to load checklist templates");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  const handleAdd = async () => {
    if (!newItem.name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/checklist-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: selectedType,
        name: newItem.name,
        description: newItem.description || null,
        itemType: newItem.itemType,
        fieldKey: newItem.fieldKey || null,
        required: newItem.required,
        dueOffsetDays: newItem.dueOffsetDays,
        sortOrder: templates.length,
      }),
    });
    if (res.ok) {
      toast.success("Template added");
    } else {
      toast.error("Failed to add template");
    }
    setSaving(false);
    setShowAdd(false);
    setNewItem({
      name: "",
      description: "",
      itemType: "text_input",
      fieldKey: "",
      required: true,
      dueOffsetDays: -14,
    });
    fetchTemplates();
  };

  const { confirm: confirmDialog } = useConfirm();

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmDialog({
      title: "Delete checklist template",
      message: `Remove "${name}"? Existing checklist items from this template will also be removed.`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;
    const res = await fetch(`/api/checklist-templates/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Template deleted");
    } else {
      toast.error("Failed to delete template");
    }
    fetchTemplates();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Checklist Templates</h2>
        <p className="text-sm text-muted-foreground">
          Configure what confirmed entities need to complete. Templates
          auto-generate checklist items when an entity is confirmed.
        </p>
      </div>

      {/* Entity type selector */}
      <div className="flex gap-1 flex-wrap">
        {ENTITY_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors",
              selectedType === type
                ? "bg-yellow-500 text-stone-900"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Templates list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-md bg-stone-100 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {templates.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-md border px-3 py-2.5 hover:bg-accent/30 transition-colors"
            >
              <GripVertical className="h-4 w-4 text-stone-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t.name}</span>
                  <Badge variant="outline" className="text-[9px]">
                    {t.itemType.replace("_", " ")}
                  </Badge>
                  {t.required && (
                    <Badge
                      variant="outline"
                      className="text-[9px] text-yellow-700 border-yellow-200"
                    >
                      Required
                    </Badge>
                  )}
                  {t.fieldKey && (
                    <Badge
                      variant="outline"
                      className="text-[9px] text-sky-600 border-sky-200"
                    >
                      {t.fieldKey}
                    </Badge>
                  )}
                </div>
                {t.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.description}
                  </p>
                )}
                {t.dueOffsetDays && (
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    Due {Math.abs(t.dueOffsetDays)} days before event
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(t.id, t.name)}
                className="rounded p-1 text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="rounded-lg border-2 border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No checklist templates for {selectedType}s yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add new template */}
      {showAdd ? (
        <div className="rounded-md border p-4 space-y-3">
          <h3 className="text-sm font-medium">
            New checklist item for {selectedType}s
          </h3>
          <div className="space-y-1.5">
            <Label>Item name *</Label>
            <Input
              autoFocus
              value={newItem.name}
              onChange={(e) =>
                setNewItem({ ...newItem, name: e.target.value })
              }
              placeholder="e.g., Upload headshot photo"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={newItem.description}
              onChange={(e) =>
                setNewItem({ ...newItem, description: e.target.value })
              }
              placeholder="Instructions for the stakeholder..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select
                value={newItem.itemType}
                onChange={(e) =>
                  setNewItem({ ...newItem, itemType: e.target.value })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {ITEM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Due (days before event)</Label>
              <Input
                type="number"
                value={Math.abs(newItem.dueOffsetDays)}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    dueOffsetDays: -Math.abs(parseInt(e.target.value) || 14),
                  })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Maps to entity field (optional)</Label>
              <Input
                value={newItem.fieldKey}
                onChange={(e) =>
                  setNewItem({ ...newItem, fieldKey: e.target.value })
                }
                placeholder="e.g., headshotUrl, bio"
              />
            </div>
            <div className="space-y-1.5 flex items-end gap-2 pb-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={newItem.required}
                  onChange={(e) =>
                    setNewItem({ ...newItem, required: e.target.checked })
                  }
                  className="rounded"
                />
                Required
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!newItem.name.trim() || saving}
            >
              {saving ? "Adding..." : "Add Item"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="mr-2 h-3 w-3" /> Add Checklist Item
        </Button>
      )}
    </div>
  );
}
