"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic2, Copy, Check, ExternalLink } from "lucide-react";

type SpeakerStatus = "pending" | "accepted" | "rejected" | "waitlisted";

const statusConfig: Record<
  SpeakerStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pending Review", variant: "secondary" },
  accepted: { label: "Accepted", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  waitlisted: { label: "Waitlisted", variant: "outline" },
};

// Placeholder data until API is connected
const mockSpeakers: Array<{
  id: string;
  name: string;
  email: string;
  talkTitle: string;
  company: string;
  status: SpeakerStatus;
  reviewScore: number;
  createdAt: string;
}> = [
  {
    id: "1",
    name: "Sarah K.",
    email: "sarah@example.com",
    talkTitle: "Open Source in Central Asia",
    company: "OSS Foundation",
    status: "accepted" as const,
    reviewScore: 4.8,
    createdAt: "2026-02-15",
  },
  {
    id: "2",
    name: "Batbold T.",
    email: "batbold@example.com",
    talkTitle: "Building ML Pipelines in Mongolia",
    company: "DataMN",
    status: "waitlisted" as const,
    reviewScore: 4.2,
    createdAt: "2026-02-18",
  },
  {
    id: "3",
    name: "James L.",
    email: "james@example.com",
    talkTitle: "DevOps for Small Teams",
    company: "Freelance",
    status: "pending" as const,
    reviewScore: 3.1,
    createdAt: "2026-02-20",
  },
  {
    id: "4",
    name: "Enkhbat D.",
    email: "enkhbat@example.com",
    talkTitle: "Hands-on ML Setup Workshop",
    company: "NUM University",
    status: "accepted" as const,
    reviewScore: 4.5,
    createdAt: "2026-02-22",
  },
];

export default function SpeakersPage() {
  const [filter, setFilter] = useState<SpeakerStatus | "all">("all");
  const [copied, setCopied] = useState(false);

  const speakers = mockSpeakers;
  const filtered =
    filter === "all"
      ? speakers
      : speakers.filter((s) => s.status === filter);

  const counts = {
    total: speakers.length,
    accepted: speakers.filter((s) => s.status === "accepted").length,
    pending: speakers.filter((s) => s.status === "pending").length,
    rejected: speakers.filter((s) => s.status === "rejected").length,
  };

  const handleCopyCfp = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/apply/dev-summit-2026`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (speakers.length === 0) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              Speakers
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage speaker applications for Dev Summit 2026
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Mic2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-1">No applications yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Share your CFP link to start receiving speaker applications.
            </p>
            <Button onClick={handleCopyCfp}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" /> Copy CFP Link
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Speakers
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage speaker applications for Dev Summit 2026
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyCfp}>
            {copied ? (
              <>
                <Check className="mr-2 h-3 w-3" /> Copied
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-3 w-3" /> CFP Link
              </>
            )}
          </Button>
          <Button size="sm">+ Add Speaker</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Applications", value: counts.total, color: "text-foreground" },
          { label: "Accepted", value: counts.accepted, color: "text-emerald-600" },
          { label: "Pending", value: counts.pending, color: "text-yellow-600" },
          { label: "Rejected", value: counts.rejected, color: "text-red-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className={`text-2xl font-semibold tabular-nums ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(["all", "pending", "accepted", "waitlisted", "rejected"] as const).map(
          (status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status}
              {status !== "all" && (
                <span className="ml-1 tabular-nums">
                  ({speakers.filter((s) => s.status === status).length})
                </span>
              )}
            </Button>
          )
        )}
      </div>

      {/* Speaker list */}
      <div className="space-y-2">
        {filtered.map((speaker) => (
          <Card key={speaker.id} className="hover:border-yellow-500/30 transition-colors">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <p className="font-medium truncate">{speaker.name}</p>
                  <Badge
                    variant={statusConfig[speaker.status].variant}
                    className="shrink-0"
                  >
                    {statusConfig[speaker.status].label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {speaker.talkTitle}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {speaker.company} &middot; Applied{" "}
                  {new Date(speaker.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4 ml-4">
                {speaker.reviewScore && (
                  <div className="text-right">
                    <p className="text-lg font-semibold tabular-nums">
                      {speaker.reviewScore}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Score
                    </p>
                  </div>
                )}
                {speaker.status === "pending" && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline">
                      Reject
                    </Button>
                    <Button size="sm">Accept</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
