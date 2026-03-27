"use client";
import { createContext, useContext } from "react";

type EventContextValue = {
  editionId: string;
  orgId: string;
  slug: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  venue: string | null;
  status: string;
};

const EventContext = createContext<EventContextValue | null>(null);

export function EventProvider({ value, children }: { value: EventContextValue; children: React.ReactNode }) {
  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEventContext(): EventContextValue {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEventContext must be used within an EventProvider — are you inside /events/[slug]/?");
  return ctx;
}
