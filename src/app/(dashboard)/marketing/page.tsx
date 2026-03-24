"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, Plus, Calendar, Send } from "lucide-react";

type CampaignStatus = "draft" | "scheduled" | "published" | "cancelled";

const statusConfig: Record<CampaignStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-stone-100 text-stone-600" },
  scheduled: { label: "Scheduled", color: "bg-yellow-50 text-yellow-700" },
  published: { label: "Published", color: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-600" },
};

const platformColors: Record<string, string> = {
  Twitter: "bg-sky-100 text-sky-700",
  Facebook: "bg-blue-100 text-blue-700",
  Instagram: "bg-pink-100 text-pink-700",
  LinkedIn: "bg-indigo-100 text-indigo-700",
  Telegram: "bg-cyan-100 text-cyan-700",
};

const mockCampaigns: Array<{
  id: string;
  title: string;
  type: string;
  platform: string;
  status: CampaignStatus;
  scheduledDate: string | null;
  content: string;
  speaker?: string;
}> = [
  { id: "1", title: "Speaker Spotlight: Sarah K.", type: "speaker_announcement", platform: "Twitter", status: "published", scheduledDate: "2026-03-01", content: "We're thrilled to announce Sarah K. will be speaking about Open Source in Central Asia at Dev Summit 2026!", speaker: "Sarah K." },
  { id: "2", title: "Speaker Spotlight: Batbold T.", type: "speaker_announcement", platform: "Twitter", status: "scheduled", scheduledDate: "2026-03-05", content: "Opening keynote announced! Batbold T. kicks off Dev Summit 2026.", speaker: "Batbold T." },
  { id: "3", title: "Early Bird Tickets Now Available", type: "event_update", platform: "Facebook", status: "published", scheduledDate: "2026-02-15", content: "Dev Summit 2026 early bird tickets are live! Get yours before March 1." },
  { id: "4", title: "Workshop Announcement: ML Setup", type: "speaker_announcement", platform: "LinkedIn", status: "draft", scheduledDate: null, content: "Hands-on ML workshop with Enkhbat D. from NUM University.", speaker: "Enkhbat D." },
  { id: "5", title: "Agenda Published!", type: "event_update", platform: "Telegram", status: "scheduled", scheduledDate: "2026-03-15", content: "The full Dev Summit 2026 agenda is live. Check out all sessions and plan your day." },
  { id: "6", title: "Sponsor Spotlight: Khan Bank", type: "sponsor_promo", platform: "Instagram", status: "draft", scheduledDate: null, content: "Thank you Khan Bank for being our platinum sponsor at Dev Summit 2026!" },
];

export default function MarketingPage() {
  const [filter, setFilter] = useState<CampaignStatus | "all">("all");

  const campaigns = mockCampaigns;
  const filtered = filter === "all" ? campaigns : campaigns.filter((c) => c.status === filter);

  const counts = {
    total: campaigns.length,
    draft: campaigns.filter((c) => c.status === "draft").length,
    scheduled: campaigns.filter((c) => c.status === "scheduled").length,
    published: campaigns.filter((c) => c.status === "published").length,
  };

  return (
    <div>
      <div className="mb-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Marketing</h1>
          <p className="text-sm text-muted-foreground">Social media campaigns and announcements</p>
        </div>
        <Button size="sm"><Plus className="mr-2 h-3 w-3" /> New Campaign</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mb-6">
        <Card><CardContent className="p-4"><p className="text-2xl font-semibold tabular-nums">{counts.total}</p><p className="text-xs text-muted-foreground">Campaigns</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-semibold tabular-nums text-stone-500">{counts.draft}</p><p className="text-xs text-muted-foreground">Drafts</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-semibold tabular-nums text-yellow-600">{counts.scheduled}</p><p className="text-xs text-muted-foreground">Scheduled</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-semibold tabular-nums text-emerald-600">{counts.published}</p><p className="text-xs text-muted-foreground">Published</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", "draft", "scheduled", "published"] as const).map((status) => (
          <Button key={status} variant={filter === status ? "default" : "outline"} size="sm" onClick={() => setFilter(status)} className="capitalize">
            {status}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((campaign) => (
          <Card key={campaign.id} className="hover:border-yellow-500/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{campaign.title}</p>
                    <Badge className={statusConfig[campaign.status].color}>{statusConfig[campaign.status].label}</Badge>
                    <Badge className={platformColors[campaign.platform] || "bg-stone-100 text-stone-600"} variant="outline">{campaign.platform}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{campaign.content}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    {campaign.scheduledDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(campaign.scheduledDate).toLocaleDateString()}
                      </span>
                    )}
                    {campaign.speaker && <span>Speaker: {campaign.speaker}</span>}
                  </div>
                </div>
              </div>
              {campaign.status === "draft" && (
                <div className="flex gap-2 mt-3 sm:justify-end">
                  <Button size="sm" variant="outline" className="flex-1 sm:flex-none">
                    <Calendar className="mr-2 h-3 w-3" /> Schedule
                  </Button>
                  <Button size="sm" className="flex-1 sm:flex-none">
                    <Send className="mr-2 h-3 w-3" /> Publish Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
