"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, Plus, Send, Users } from "lucide-react";

type InvitationType = "special_guest" | "speaker_invitee" | "organizer_invitee" | "student" | "vip";
type InvitationStatus = "pending" | "sent" | "accepted" | "declined";

const typeConfig: Record<InvitationType, { label: string; color: string }> = {
  special_guest: { label: "Special Guest", color: "bg-violet-100 text-violet-700" },
  speaker_invitee: { label: "Speaker +1", color: "bg-sky-100 text-sky-700" },
  organizer_invitee: { label: "Organizer +1", color: "bg-yellow-100 text-yellow-700" },
  student: { label: "Student", color: "bg-emerald-100 text-emerald-700" },
  vip: { label: "VIP", color: "bg-pink-100 text-pink-700" },
};

const statusConfig: Record<InvitationStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-stone-100 text-stone-600" },
  sent: { label: "Sent", color: "bg-sky-50 text-sky-700" },
  accepted: { label: "Accepted", color: "bg-emerald-50 text-emerald-700" },
  declined: { label: "Declined", color: "bg-red-50 text-red-600" },
};

// Allocation config
const allocationConfig = {
  speakerInvitees: 2,   // per accepted speaker
  organizerInvitees: 2, // per organizer
};

const mockInvitations: Array<{
  id: string;
  name: string;
  email: string;
  type: InvitationType;
  status: InvitationStatus;
  invitedBy: string;
  sourceType: string;
  hasQr: boolean;
}> = [
  { id: "1", name: "Minister Oyun-Erdene", type: "special_guest", status: "accepted", invitedBy: "Amarbayar", email: "minister@gov.mn", sourceType: "direct", hasQr: true },
  { id: "2", name: "Prof. Purevdorj", type: "vip", status: "sent", invitedBy: "Amarbayar", email: "purevdorj@num.edu.mn", sourceType: "direct", hasQr: true },
  { id: "3", name: "Tuya B. (Sarah's +1)", type: "speaker_invitee", status: "accepted", invitedBy: "Sarah K.", email: "tuya@example.com", sourceType: "speaker", hasQr: true },
  { id: "4", name: "Ganbaatar D. (Sarah's +2)", type: "speaker_invitee", status: "pending", invitedBy: "Sarah K.", email: "", sourceType: "speaker", hasQr: false },
  { id: "5", name: "Enkhbold T. (Amarbayar's +1)", type: "organizer_invitee", status: "accepted", invitedBy: "Amarbayar", email: "enkhbold@example.com", sourceType: "organizer", hasQr: true },
  { id: "6", name: "Bayarmaa O.", type: "student", status: "sent", invitedBy: "CS Student Union", email: "bayarmaa@num.edu.mn", sourceType: "direct", hasQr: true },
  { id: "7", name: "Tserendorj M.", type: "student", status: "sent", invitedBy: "CS Student Union", email: "tserendorj@num.edu.mn", sourceType: "direct", hasQr: true },
  { id: "8", name: "Munkhjin A.", type: "student", status: "pending", invitedBy: "CS Student Union", email: "munkhjin@num.edu.mn", sourceType: "direct", hasQr: false },
];

export default function InvitationsPage() {
  const [typeFilter, setTypeFilter] = useState<InvitationType | "all">("all");

  const filtered = typeFilter === "all" ? mockInvitations : mockInvitations.filter((i) => i.type === typeFilter);

  const counts = {
    total: mockInvitations.length,
    accepted: mockInvitations.filter((i) => i.status === "accepted").length,
    sent: mockInvitations.filter((i) => i.status === "sent").length,
    pending: mockInvitations.filter((i) => i.status === "pending").length,
    withQr: mockInvitations.filter((i) => i.hasQr).length,
  };

  // Allocation tracking
  const speakerAllocUsed = mockInvitations.filter((i) => i.type === "speaker_invitee").length;
  const speakerAllocTotal = 4 * allocationConfig.speakerInvitees; // 4 accepted speakers * 2
  const organizerAllocUsed = mockInvitations.filter((i) => i.type === "organizer_invitee").length;
  const organizerAllocTotal = 3 * allocationConfig.organizerInvitees; // 3 organizers * 2

  return (
    <div>
      <div className="mb-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Invitations</h1>
          <p className="text-sm text-muted-foreground">Special guests, speaker/organizer invitees, and student passes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Send className="mr-2 h-3 w-3" /> Send Batch</Button>
          <Button size="sm"><Plus className="mr-2 h-3 w-3" /> Invite Guest</Button>
        </div>
      </div>

      {/* Stats + Allocations */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mb-4">
        <Card><CardContent className="p-4"><p className="text-2xl font-semibold tabular-nums">{counts.total}</p><p className="text-xs text-muted-foreground">Total Invitations</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-semibold tabular-nums text-emerald-600">{counts.accepted}</p><p className="text-xs text-muted-foreground">Accepted</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-semibold tabular-nums text-sky-600">{counts.withQr}</p><p className="text-xs text-muted-foreground">QR Generated</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-semibold tabular-nums text-yellow-600">{counts.pending}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
      </div>

      {/* Allocation tracking */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium mb-3">Invitation Allocations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Speaker invitees ({allocationConfig.speakerInvitees}/speaker)</span>
                <span className="font-medium tabular-nums">{speakerAllocUsed} / {speakerAllocTotal}</span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(speakerAllocUsed / speakerAllocTotal) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Organizer invitees ({allocationConfig.organizerInvitees}/organizer)</span>
                <span className="font-medium tabular-nums">{organizerAllocUsed} / {organizerAllocTotal}</span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(organizerAllocUsed / organizerAllocTotal) * 100}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Type filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button variant={typeFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setTypeFilter("all")}>All</Button>
        {(Object.keys(typeConfig) as InvitationType[]).map((type) => (
          <Button key={type} variant={typeFilter === type ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(type)}>
            {typeConfig[type].label} ({mockInvitations.filter((i) => i.type === type).length})
          </Button>
        ))}
      </div>

      {/* Invitation list */}
      <div className="space-y-2">
        {filtered.map((inv) => (
          <Card key={inv.id} className="hover:border-yellow-500/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{inv.name}</p>
                    <Badge className={typeConfig[inv.type].color}>{typeConfig[inv.type].label}</Badge>
                    <Badge className={statusConfig[inv.status].color}>{statusConfig[inv.status].label}</Badge>
                    {inv.hasQr && <Badge variant="outline" className="text-[10px]">QR Ready</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Invited by {inv.invitedBy}
                    {inv.email && <> &middot; {inv.email}</>}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!inv.hasQr && inv.status !== "declined" && (
                    <Button size="sm" variant="outline">Generate QR</Button>
                  )}
                  {inv.status === "pending" && (
                    <Button size="sm"><Send className="mr-1 h-3 w-3" /> Send</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
