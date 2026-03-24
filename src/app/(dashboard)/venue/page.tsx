"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Star, Check } from "lucide-react";

type VenueStatus = "identified" | "contacted" | "negotiating" | "proposal_received" | "finalized" | "declined";

const statusFlow: { value: VenueStatus; label: string; color: string }[] = [
  { value: "identified", label: "Identified", color: "bg-stone-100 text-stone-600" },
  { value: "contacted", label: "Contacted", color: "bg-sky-50 text-sky-700" },
  { value: "negotiating", label: "Negotiating", color: "bg-yellow-50 text-yellow-700" },
  { value: "proposal_received", label: "Proposal Received", color: "bg-violet-50 text-violet-700" },
  { value: "finalized", label: "Finalized", color: "bg-emerald-50 text-emerald-700" },
  { value: "declined", label: "Declined", color: "bg-red-50 text-red-600" },
];

const mockVenues: Array<{
  id: string;
  name: string;
  address: string;
  contactName: string;
  capacity: number;
  priceQuote: string;
  status: VenueStatus;
  isFinalized: boolean;
  assignedTo: string;
  pros: string;
  cons: string;
}> = [
  { id: "1", name: "Chinggis Khaan Hotel", address: "Tokyo Street 17, Ulaanbaatar", contactName: "Boldbaatar M.", capacity: 500, priceQuote: "$3,500/day — includes AV equipment", status: "finalized", isFinalized: true, assignedTo: "Amarbayar", pros: "Central location, great AV, conference rooms", cons: "Parking limited" },
  { id: "2", name: "Blue Sky Tower Convention Center", address: "Peace Avenue, Ulaanbaatar", contactName: "Oyunaa S.", capacity: 800, priceQuote: "$5,000/day — AV extra", status: "proposal_received", isFinalized: false, assignedTo: "Amarbayar", pros: "Massive space, modern facilities", cons: "Expensive, outside city center" },
  { id: "3", name: "NUM University Main Hall", address: "University Street 1", contactName: "Prof. Batbayar", capacity: 300, priceQuote: "Free (academic partnership)", status: "negotiating", isFinalized: false, assignedTo: "Tuvshin", pros: "Free, close to student audience", cons: "Limited AV, no catering on-site" },
  { id: "4", name: "Shangri-La Ulaanbaatar", address: "Olympic Street 19", contactName: "Events Team", capacity: 400, priceQuote: "Awaiting quote", status: "contacted", isFinalized: false, assignedTo: "Tuvshin", pros: "Premium brand, great catering", cons: "Likely most expensive option" },
];

export default function VenuePage() {
  const finalized = mockVenues.find((v) => v.isFinalized);

  return (
    <div>
      <div className="mb-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Venue</h1>
          <p className="text-sm text-muted-foreground">Find and lock in your event venue</p>
        </div>
        <Button size="sm"><Plus className="mr-2 h-3 w-3" /> Add Candidate</Button>
      </div>

      {/* Finalized venue banner */}
      {finalized && (
        <Card className="mb-6 border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-emerald-100 p-2">
                <Check className="h-5 w-5 text-emerald-700" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-emerald-900">{finalized.name}</p>
                  <Badge className="bg-emerald-100 text-emerald-700">Finalized</Badge>
                </div>
                <p className="text-sm text-emerald-700 mt-0.5">{finalized.address}</p>
                <p className="text-sm text-emerald-700">Capacity: {finalized.capacity} &middot; {finalized.priceQuote}</p>
                <p className="text-xs text-emerald-600 mt-1">Contact: {finalized.contactName} &middot; Managed by {finalized.assignedTo}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline */}
      <div className="flex flex-wrap gap-2 mb-4">
        {statusFlow.map((s) => {
          const count = mockVenues.filter((v) => v.status === s.value).length;
          return (
            <Badge key={s.value} className={`${s.color} cursor-pointer`}>
              {s.label} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Venue cards */}
      <div className="space-y-3">
        {mockVenues.filter((v) => !v.isFinalized).map((venue) => (
          <Card key={venue.id} className="hover:border-yellow-500/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{venue.name}</p>
                    <Badge className={statusFlow.find((s) => s.value === venue.status)?.color}>
                      {statusFlow.find((s) => s.value === venue.status)?.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{venue.address}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Capacity:</span>{" "}
                      <span className="font-medium">{venue.capacity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Contact:</span>{" "}
                      <span className="font-medium">{venue.contactName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Assigned:</span>{" "}
                      <span className="font-medium">{venue.assignedTo}</span>
                    </div>
                  </div>
                  <p className="text-sm mt-1"><span className="text-muted-foreground">Quote:</span> {venue.priceQuote}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs">
                    <div className="text-emerald-600">+ {venue.pros}</div>
                    <div className="text-red-600">- {venue.cons}</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3 sm:justify-end">
                <Button size="sm" variant="outline" className="flex-1 sm:flex-none">Update Status</Button>
                <Button size="sm" className="flex-1 sm:flex-none">
                  <Star className="mr-2 h-3 w-3" /> Finalize
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
