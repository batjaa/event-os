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
import { Building2, Plus, X } from "lucide-react";

type Sponsor = {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  packagePreference: string | null;
  message: string | null;
  status: string;
  source: string;
  stage: string;
  assignedTo: string | null;
  createdAt: Date;
};

export function SponsorsClient({ initialSponsors }: { initialSponsors: Sponsor[] }) {
  const { source, stage, setSource, setStage, filter } = usePipelineFilters();
  const [sponsors, setSponsors] = useState(initialSponsors);
  const [showForm, setShowForm] = useState(false);

  const filtered = filter(sponsors);

  const columns = [
    {
      key: "companyName",
      label: "Company Name",
      width: "180px",
      render: (s: Sponsor) => (
        <p className="font-medium text-sm">{s.companyName}</p>
      ),
    },
    {
      key: "contactName",
      label: "Contact",
      width: "140px",
      render: (s: Sponsor) => (
        <span className="text-xs text-muted-foreground">{s.contactName || "—"}</span>
      ),
    },
    {
      key: "contactEmail",
      label: "Email",
      width: "180px",
      render: (s: Sponsor) => (
        <span className="text-xs text-muted-foreground">{s.contactEmail || "—"}</span>
      ),
    },
    {
      key: "packagePreference",
      label: "Package",
      width: "100px",
      render: (s: Sponsor) => (
        <span className="text-xs capitalize">{s.packagePreference || "—"}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      width: "90px",
      render: (s: Sponsor) => (
        <span className="text-xs">{s.status}</span>
      ),
    },
  ];

  // Refresh data without full page reload
  const refreshData = useCallback(async () => {
    const res = await fetch("/api/sponsors");
    if (res.ok) {
      const json = await res.json();
      if (json.data) setSponsors(json.data);
    } else {
      window.location.reload();
    }
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form);

    const res = await fetch("/api/sponsors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const json = await res.json();
      setSponsors((prev) => [json.data, ...prev]);
      setShowForm(false);
    }
  };

  return (
    <div>
      <div className="mb-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Sponsors</h1>
          <p className="text-sm text-muted-foreground">{sponsors.length} total</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="mr-2 h-3 w-3" /> Cancel</> : <><Plus className="mr-2 h-3 w-3" /> Add Sponsor</>}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Company Name *</Label>
                  <Input name="companyName" placeholder="e.g., Khan Bank" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Name *</Label>
                  <Input name="contactName" placeholder="e.g., Bat-Erdene D." required />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Email *</Label>
                  <Input name="contactEmail" type="email" placeholder="events@company.mn" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Package</Label>
                  <Select name="packagePreference" defaultValue="gold">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="platinum">Platinum</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="community">Community</SelectItem>
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
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea name="message" placeholder="Any notes about the sponsorship..." rows={2} />
              </div>
              <Button type="submit" className="w-full sm:w-auto">Create Sponsor</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pipeline filters */}
      <PipelineFilters
        items={sponsors}
        sources={["all", "intake", "outreach"]}
        activeSource={source}
        activeStage={stage}
        onSourceChange={setSource}
        onStageChange={setStage}
      />

      {/* Table view */}
      {sponsors.length === 0 && !showForm ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-1">No sponsors yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add sponsors manually or paste their info into the agent chat.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Sponsor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <PipelineTable
          items={filtered}
          columns={columns}
          entityName="sponsor"
          apiEndpoint="/api/sponsors"
          onUpdate={refreshData}
        />
      )}

      {filtered.length === 0 && sponsors.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">No sponsors match the current filters.</p>
      )}
    </div>
  );
}
