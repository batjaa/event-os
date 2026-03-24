"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PipelineFilters, usePipelineFilters } from "@/components/pipeline-view";
import { PipelineTable } from "@/components/pipeline-table";
import { Copy, Check, Plus, X } from "lucide-react";

type Volunteer = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  availability: string | null;
  status: string;
  source: string;
  stage: string;
  assignedTo: string | null;
  assignedShift: string | null;
  tshirtSize: string | null;
};

export function VolunteersClient({ initialVolunteers }: { initialVolunteers: Volunteer[] }) {
  const { source, stage, setSource, setStage, filter } = usePipelineFilters();
  const [volunteers, setVolunteers] = useState(initialVolunteers);
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const filtered = filter(volunteers);

  const columns = [
    {
      key: "name",
      label: "Name",
      width: "160px",
      render: (v: Volunteer) => (
        <p className="font-medium text-sm">{v.name}</p>
      ),
    },
    {
      key: "email",
      label: "Email",
      width: "180px",
      render: (v: Volunteer) => (
        <span className="text-xs text-muted-foreground">{v.email || "—"}</span>
      ),
    },
    {
      key: "role",
      label: "Role",
      width: "140px",
      render: (v: Volunteer) => (
        <span className="text-xs">{v.role || "—"}</span>
      ),
    },
    {
      key: "availability",
      label: "Availability",
      width: "140px",
      render: (v: Volunteer) => (
        <span className="text-xs text-muted-foreground">{v.availability || "—"}</span>
      ),
    },
    {
      key: "tshirtSize",
      label: "T-Shirt",
      width: "70px",
      render: (v: Volunteer) => (
        <span className="text-xs font-medium">{v.tshirtSize || "—"}</span>
      ),
    },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/volunteer/dev-summit-2026`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Refresh data without full page reload
  const refreshData = useCallback(async () => {
    const res = await fetch("/api/volunteers");
    if (res.ok) {
      const json = await res.json();
      if (json.data) setVolunteers(json.data);
    } else {
      window.location.reload();
    }
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form);

    const res = await fetch("/api/volunteers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const json = await res.json();
      setVolunteers((prev) => [json.data, ...prev]);
      setShowForm(false);
    }
  };

  return (
    <div>
      <div className="mb-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Volunteers</h1>
          <p className="text-sm text-muted-foreground">{volunteers.length} total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {copied ? <><Check className="mr-2 h-3 w-3" /> Copied</> : <><Copy className="mr-2 h-3 w-3" /> Signup Link</>}
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? <><X className="mr-2 h-3 w-3" /> Cancel</> : <><Plus className="mr-2 h-3 w-3" /> Add Volunteer</>}
          </Button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input name="name" placeholder="e.g., Temuulen B." required />
                </div>
                <div className="space-y-1.5">
                  <Label>Email *</Label>
                  <Input name="email" type="email" placeholder="volunteer@email.mn" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input name="phone" placeholder="+976 ..." />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Input name="role" placeholder="e.g., Registration Desk" />
                </div>
                <div className="space-y-1.5">
                  <Label>Availability</Label>
                  <Input name="availability" placeholder="e.g., Both days, mornings only" />
                </div>
                <div className="space-y-1.5">
                  <Label>T-Shirt Size</Label>
                  <Select name="tshirtSize" defaultValue="L">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XS">XS</SelectItem>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="XL">XL</SelectItem>
                      <SelectItem value="XXL">XXL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Source</Label>
                  <Select name="source" defaultValue="outreach">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intake">Intake</SelectItem>
                      <SelectItem value="outreach">Outreach</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Assigned To</Label>
                  <Input name="assignedTo" placeholder="Team member name" />
                </div>
              </div>
              <Button type="submit" className="w-full sm:w-auto">Create Volunteer</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pipeline filters */}
      <PipelineFilters
        items={volunteers}
        sources={["all", "intake", "outreach"]}
        activeSource={source}
        activeStage={stage}
        onSourceChange={setSource}
        onStageChange={setStage}
      />

      {/* Table view */}
      <PipelineTable
        items={filtered}
        columns={columns}
        entityName="volunteer"
        apiEndpoint="/api/volunteers"
        onUpdate={refreshData}
      />

      {filtered.length === 0 && volunteers.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">No volunteers match the current filters.</p>
      )}
    </div>
  );
}
