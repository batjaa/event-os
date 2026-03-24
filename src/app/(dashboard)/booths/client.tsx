"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PipelineFilters, usePipelineFilters } from "@/components/pipeline-view";
import { PipelineTable } from "@/components/pipeline-table";
import { Plus, X } from "lucide-react";

type Booth = {
  id: string;
  name: string;
  location: string | null;
  size: string | null;
  status: string;
  source: string;
  stage: string;
  assignedTo: string | null;
  sponsorId: string | null;
  equipment: string | null;
};

export function BoothsClient({ initialBooths }: { initialBooths: Booth[] }) {
  const { source, stage, setSource, setStage, filter } = usePipelineFilters();
  const [booths, setBooths] = useState(initialBooths);
  const [showForm, setShowForm] = useState(false);

  const filtered = filter(booths);

  const columns = [
    {
      key: "name",
      label: "Name",
      width: "140px",
      render: (b: Booth) => (
        <p className="font-medium text-sm">{b.name}</p>
      ),
    },
    {
      key: "location",
      label: "Location",
      width: "140px",
      render: (b: Booth) => (
        <span className="text-xs text-muted-foreground">{b.location || "—"}</span>
      ),
    },
    {
      key: "size",
      label: "Size",
      width: "90px",
      render: (b: Booth) => (
        <span className="text-xs capitalize">{b.size || "—"}</span>
      ),
    },
    {
      key: "equipment",
      label: "Equipment",
      render: (b: Booth) => (
        <span className="text-xs text-muted-foreground">{b.equipment || "—"}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      width: "90px",
      render: (b: Booth) => (
        <span className="text-xs">{b.status}</span>
      ),
    },
  ];

  // Refresh data without full page reload
  const refreshData = useCallback(async () => {
    const res = await fetch("/api/booths");
    if (res.ok) {
      const json = await res.json();
      if (json.data) setBooths(json.data);
    } else {
      window.location.reload();
    }
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form);

    const res = await fetch("/api/booths", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const json = await res.json();
      setBooths((prev) => [json.data, ...prev]);
      setShowForm(false);
    }
  };

  return (
    <div>
      <div className="mb-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Booths</h1>
          <p className="text-sm text-muted-foreground">{booths.length} total</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="mr-2 h-3 w-3" /> Cancel</> : <><Plus className="mr-2 h-3 w-3" /> Add Booth</>}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input name="name" placeholder="e.g., Booth A1" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input name="location" placeholder="e.g., Hall B, Row 3" />
                </div>
                <div className="space-y-1.5">
                  <Label>Size</Label>
                  <Select name="size" defaultValue="standard">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Equipment</Label>
                  <Input name="equipment" placeholder="e.g., Table, chairs, power strip" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Source</Label>
                  <Select name="source" defaultValue="outreach">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intake">Intake</SelectItem>
                      <SelectItem value="outreach">Outreach</SelectItem>
                      <SelectItem value="sponsored">Sponsored</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Assigned To</Label>
                  <Input name="assignedTo" placeholder="Team member name" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea name="notes" placeholder="Any additional notes about this booth..." rows={2} />
              </div>
              <Button type="submit" className="w-full sm:w-auto">Create Booth</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pipeline filters */}
      <PipelineFilters
        items={booths}
        sources={["all", "intake", "outreach", "sponsored"]}
        activeSource={source}
        activeStage={stage}
        onSourceChange={setSource}
        onStageChange={setStage}
      />

      {/* Table view */}
      <PipelineTable
        items={filtered}
        columns={columns}
        entityName="booth"
        apiEndpoint="/api/booths"
        onUpdate={refreshData}
      />

      {filtered.length === 0 && booths.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">No booths match the current filters.</p>
      )}
    </div>
  );
}
