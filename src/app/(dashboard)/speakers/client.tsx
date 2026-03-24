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
import { Mic2, Copy, Check, ExternalLink, Plus, X } from "lucide-react";

type Speaker = {
  id: string;
  name: string;
  email: string;
  talkTitle: string;
  company: string | null;
  title: string | null;
  status: string;
  reviewScore: number | null;
  source: string;
  stage: string;
  assignedTo: string | null;
  trackPreference: string | null;
  createdAt: Date;
};

export function SpeakersClient({ initialSpeakers }: { initialSpeakers: Speaker[] }) {
  const { source, stage, setSource, setStage, filter } = usePipelineFilters();
  const [speakers, setSpeakers] = useState(initialSpeakers);
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const filtered = filter(speakers);

  const handleCopyCfp = () => {
    navigator.clipboard.writeText(`${window.location.origin}/apply/dev-summit-2026`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Refresh data without full page reload
  const refreshData = useCallback(async () => {
    const res = await fetch("/api/speakers?editionId=all");
    if (res.ok) {
      const json = await res.json();
      if (json.data) setSpeakers(json.data);
    } else {
      // Fallback: reload page
      window.location.reload();
    }
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form);
    const res = await fetch("/api/speakers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const json = await res.json();
      setSpeakers((prev) => [json.data, ...prev]);
      setShowForm(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Speaker",
      width: "200px",
      render: (s: Speaker) => (
        <div>
          <p className="font-medium text-sm">{s.name}</p>
          <p className="text-xs text-muted-foreground">{s.email || "No email"}</p>
        </div>
      ),
    },
    {
      key: "company",
      label: "Company",
      width: "140px",
      render: (s: Speaker) => (
        <span className="text-xs text-muted-foreground">{s.company || "—"}</span>
      ),
    },
    {
      key: "talk",
      label: "Talk",
      render: (s: Speaker) => (
        <div>
          <p className="text-xs">{s.talkTitle || "TBD"}</p>
          {s.trackPreference && (
            <p className="text-[10px] text-muted-foreground">{s.trackPreference}</p>
          )}
        </div>
      ),
    },
    {
      key: "score",
      label: "Score",
      width: "60px",
      render: (s: Speaker) => (
        <span className="text-xs tabular-nums font-medium">
          {s.reviewScore ? (s.reviewScore / 10).toFixed(1) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Speakers</h1>
          <p className="text-sm text-muted-foreground">{speakers.length} total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyCfp}>
            {copied ? <><Check className="mr-2 h-3 w-3" /> Copied</> : <><ExternalLink className="mr-2 h-3 w-3" /> CFP Link</>}
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? <><X className="mr-2 h-3 w-3" /> Cancel</> : <><Plus className="mr-2 h-3 w-3" /> Add Speaker</>}
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
                  <Input name="name" placeholder="e.g., Batbold T." required />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input name="email" type="email" placeholder="batbold@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Company</Label>
                  <Input name="company" placeholder="DataMN" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Talk Title</Label>
                  <Input name="talkTitle" placeholder="TBD" />
                </div>
                <div className="space-y-1.5">
                  <Label>Source</Label>
                  <Select name="source" defaultValue="outreach">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intake">Intake (CFP)</SelectItem>
                      <SelectItem value="outreach">Outreach</SelectItem>
                      <SelectItem value="sponsored">Sponsored</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Assigned To</Label>
                  <Input name="assignedTo" placeholder="Team member" />
                </div>
              </div>
              <Button type="submit" className="w-full sm:w-auto">Add Speaker</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pipeline filters */}
      <PipelineFilters
        items={speakers}
        sources={["all", "intake", "outreach", "sponsored"]}
        activeSource={source}
        activeStage={stage}
        onSourceChange={setSource}
        onStageChange={setStage}
      />

      {/* Table view */}
      {speakers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Mic2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-1">No speakers yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Share your CFP link or add speakers via the agent chat.</p>
            <Button onClick={handleCopyCfp}>
              <Copy className="mr-2 h-4 w-4" /> Copy CFP Link
            </Button>
          </CardContent>
        </Card>
      ) : (
        <PipelineTable
          items={filtered}
          columns={columns}
          entityName="speaker"
          apiEndpoint="/api/speakers"
          onUpdate={refreshData}
        />
      )}

      {filtered.length === 0 && speakers.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">No speakers match the current filters.</p>
      )}
    </div>
  );
}
