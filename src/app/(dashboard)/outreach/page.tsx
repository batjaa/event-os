"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Send, Plus, ArrowRight } from "lucide-react";

type OutreachStatus = "identified" | "contacted" | "interested" | "negotiating" | "confirmed" | "declined" | "converted";
type TargetType = "speaker" | "sponsor" | "booth" | "volunteer" | "media";

const statusConfig: Record<OutreachStatus, { label: string; color: string }> = {
  identified: { label: "Identified", color: "bg-stone-100 text-stone-600" },
  contacted: { label: "Contacted", color: "bg-sky-50 text-sky-700" },
  interested: { label: "Interested", color: "bg-violet-50 text-violet-700" },
  negotiating: { label: "Negotiating", color: "bg-yellow-50 text-yellow-700" },
  confirmed: { label: "Confirmed", color: "bg-emerald-50 text-emerald-700" },
  declined: { label: "Declined", color: "bg-red-50 text-red-600" },
  converted: { label: "Converted", color: "bg-emerald-100 text-emerald-800" },
};

const typeConfig: Record<TargetType, { label: string; color: string }> = {
  speaker: { label: "Speaker", color: "bg-sky-100 text-sky-800" },
  sponsor: { label: "Sponsor", color: "bg-yellow-100 text-yellow-800" },
  booth: { label: "Booth", color: "bg-violet-100 text-violet-800" },
  volunteer: { label: "Volunteer", color: "bg-emerald-100 text-emerald-800" },
  media: { label: "Media", color: "bg-pink-100 text-pink-800" },
};

const mockOutreach: Array<{
  id: string;
  targetType: TargetType;
  name: string;
  company: string;
  status: OutreachStatus;
  assignedTo: string;
  lastContactDate: string | null;
  nextFollowUp: string | null;
  source: string;
  notes: string;
}> = [
  { id: "1", targetType: "speaker", name: "Dr. Altangerel B.", company: "MUST University", status: "interested", assignedTo: "Amarbayar", lastContactDate: "2026-02-10", nextFollowUp: "2026-02-17", source: "Previous speaker", notes: "Interested in AI workshop slot" },
  { id: "2", targetType: "sponsor", name: "Golomt Bank", company: "Golomt Bank", status: "negotiating", assignedTo: "Tuvshin", lastContactDate: "2026-02-08", nextFollowUp: "2026-02-15", source: "Cold outreach", notes: "Discussing Gold package, want booth + keynote slot" },
  { id: "3", targetType: "speaker", name: "Nomindari S.", company: "Google Singapore", status: "contacted", assignedTo: "Amarbayar", lastContactDate: "2026-02-12", nextFollowUp: "2026-02-19", source: "LinkedIn", notes: "Sent initial invite, waiting for response" },
  { id: "4", targetType: "sponsor", name: "Mobicom", company: "Mobicom Corporation", status: "confirmed", assignedTo: "Tuvshin", lastContactDate: "2026-02-05", nextFollowUp: null, source: "Returning sponsor", notes: "Silver package confirmed, invoiced" },
  { id: "5", targetType: "media", name: "Mongol TV", company: "Mongol TV", status: "identified", assignedTo: "Sarnai", lastContactDate: null, nextFollowUp: "2026-02-20", source: "Research", notes: "Tech segment potential" },
  { id: "6", targetType: "booth", name: "Startup Mongolia", company: "Startup Mongolia NGO", status: "interested", assignedTo: "Tuvshin", lastContactDate: "2026-02-11", nextFollowUp: "2026-02-18", source: "Partner network", notes: "Want community booth, may co-host hackathon" },
  { id: "7", targetType: "volunteer", name: "CS Student Union", company: "NUM University", status: "contacted", assignedTo: "Sarnai", lastContactDate: "2026-02-13", nextFollowUp: "2026-02-20", source: "University partnership", notes: "Can provide 15-20 student volunteers" },
];

export default function OutreachPage() {
  const [typeFilter, setTypeFilter] = useState<TargetType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<OutreachStatus | "all">("all");

  const filtered = mockOutreach
    .filter((o) => typeFilter === "all" || o.targetType === typeFilter)
    .filter((o) => statusFilter === "all" || o.status === statusFilter);

  const pipelineCounts = {
    identified: mockOutreach.filter((o) => o.status === "identified").length,
    contacted: mockOutreach.filter((o) => o.status === "contacted").length,
    interested: mockOutreach.filter((o) => o.status === "interested").length,
    negotiating: mockOutreach.filter((o) => o.status === "negotiating").length,
    confirmed: mockOutreach.filter((o) => o.status === "confirmed").length,
  };

  return (
    <div>
      <div className="mb-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Outreach</h1>
          <p className="text-sm text-muted-foreground">Proactive sourcing for speakers, sponsors, partners, and volunteers</p>
        </div>
        <Button size="sm"><Plus className="mr-2 h-3 w-3" /> Add Lead</Button>
      </div>

      {/* Pipeline funnel */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
        {(["identified", "contacted", "interested", "negotiating", "confirmed"] as const).map((status, i) => (
          <div key={status} className="flex items-center shrink-0">
            <button
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
              className={`rounded-md px-3 py-2 text-center min-w-[90px] transition-colors ${
                statusFilter === status ? "ring-2 ring-yellow-500" : ""
              }`}
            >
              <p className="text-lg font-semibold tabular-nums">{pipelineCounts[status]}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{status}</p>
            </button>
            {i < 4 && <ArrowRight className="h-4 w-4 text-stone-300 shrink-0 mx-1" />}
          </div>
        ))}
      </div>

      {/* Type filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button variant={typeFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setTypeFilter("all")}>All</Button>
        {(Object.keys(typeConfig) as TargetType[]).map((type) => (
          <Button key={type} variant={typeFilter === type ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(type)} className="capitalize">
            {typeConfig[type].label} ({mockOutreach.filter((o) => o.targetType === type).length})
          </Button>
        ))}
      </div>

      {/* Outreach list */}
      <div className="space-y-2">
        {filtered.map((lead) => (
          <Card key={lead.id} className="hover:border-yellow-500/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{lead.name}</p>
                    <Badge className={typeConfig[lead.targetType].color}>{typeConfig[lead.targetType].label}</Badge>
                    <Badge className={statusConfig[lead.status].color}>{statusConfig[lead.status].label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{lead.company} &middot; Source: {lead.source}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{lead.notes}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span>Assigned: <strong>{lead.assignedTo}</strong></span>
                    {lead.lastContactDate && <span>Last contact: {new Date(lead.lastContactDate).toLocaleDateString()}</span>}
                    {lead.nextFollowUp && (
                      <span className="text-yellow-600 font-medium">Follow up: {new Date(lead.nextFollowUp).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
              {lead.status !== "confirmed" && lead.status !== "declined" && lead.status !== "converted" && (
                <div className="flex gap-2 mt-3 sm:justify-end">
                  <Button size="sm" variant="outline" className="flex-1 sm:flex-none">Log Contact</Button>
                  <Button size="sm" variant="outline" className="flex-1 sm:flex-none">Update Status</Button>
                  {(lead.status === "interested" || lead.status === "negotiating") && (
                    <Button size="sm" className="flex-1 sm:flex-none">Convert to Application</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
