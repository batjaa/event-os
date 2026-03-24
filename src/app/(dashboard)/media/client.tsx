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

type MediaPartner = {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  type: string | null;
  reach: string | null;
  status: string;
  source: string;
  stage: string;
  assignedTo: string | null;
  deliverables: string | null;
};

export function MediaClient({ initialPartners }: { initialPartners: MediaPartner[] }) {
  const { source, stage, setSource, setStage, filter } = usePipelineFilters();
  const [partners, setPartners] = useState(initialPartners);
  const [showForm, setShowForm] = useState(false);

  const filtered = filter(partners);

  const columns = [
    {
      key: "companyName",
      label: "Company",
      width: "160px",
      render: (p: MediaPartner) => (
        <p className="font-medium text-sm">{p.companyName}</p>
      ),
    },
    {
      key: "contactName",
      label: "Contact",
      width: "140px",
      render: (p: MediaPartner) => (
        <span className="text-xs text-muted-foreground">{p.contactName || "—"}</span>
      ),
    },
    {
      key: "contactEmail",
      label: "Email",
      width: "180px",
      render: (p: MediaPartner) => (
        <span className="text-xs text-muted-foreground">{p.contactEmail || "—"}</span>
      ),
    },
    {
      key: "type",
      label: "Type",
      width: "80px",
      render: (p: MediaPartner) => (
        <span className="text-xs capitalize">{p.type || "—"}</span>
      ),
    },
    {
      key: "reach",
      label: "Reach",
      width: "140px",
      render: (p: MediaPartner) => (
        <span className="text-xs text-muted-foreground">{p.reach || "—"}</span>
      ),
    },
  ];

  // Refresh data without full page reload
  const refreshData = useCallback(async () => {
    const res = await fetch("/api/media-partners");
    if (res.ok) {
      const json = await res.json();
      if (json.data) setPartners(json.data);
    } else {
      window.location.reload();
    }
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form);

    const res = await fetch("/api/media-partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const json = await res.json();
      setPartners((prev) => [json.data, ...prev]);
      setShowForm(false);
    }
  };

  return (
    <div>
      <div className="mb-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Media Partners</h1>
          <p className="text-sm text-muted-foreground">{partners.length} total</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="mr-2 h-3 w-3" /> Cancel</> : <><Plus className="mr-2 h-3 w-3" /> Add Partner</>}
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
                  <Input name="companyName" placeholder="e.g., Eagle News" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Name *</Label>
                  <Input name="contactName" placeholder="e.g., Oyunaa B." required />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Email *</Label>
                  <Input name="contactEmail" type="email" placeholder="press@media.mn" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select name="type" defaultValue="online">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tv">TV</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="print">Print</SelectItem>
                      <SelectItem value="podcast">Podcast</SelectItem>
                      <SelectItem value="blog">Blog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Reach</Label>
                  <Input name="reach" placeholder="e.g., 50K monthly readers" />
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
                <Label>Proposal</Label>
                <Textarea name="proposal" placeholder="Coverage plan or partnership proposal..." rows={2} />
              </div>
              <Button type="submit" className="w-full sm:w-auto">Create Media Partner</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pipeline filters */}
      <PipelineFilters
        items={partners}
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
        entityName="media partner"
        apiEndpoint="/api/media-partners"
        onUpdate={refreshData}
      />

      {filtered.length === 0 && partners.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">No media partners match the current filters.</p>
      )}
    </div>
  );
}
