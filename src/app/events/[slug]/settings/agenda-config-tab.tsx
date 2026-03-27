"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEventContext } from "@/lib/event-context";
import { toast } from "sonner";
import { toastApiError } from "@/lib/toast-helpers";

export function AgendaConfigTab() {
  const event = useEventContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gapMinutes, setGapMinutes] = useState(5);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");

  useEffect(() => {
    fetch(`/api/editions/${event.editionId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setGapMinutes(d.data.agendaGapMinutes ?? 5);
          setStartTime(d.data.agendaStartTime ?? "09:00");
          setEndTime(d.data.agendaEndTime ?? "18:00");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [event.editionId]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/editions/${event.editionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agendaGapMinutes: gapMinutes, agendaStartTime: startTime, agendaEndTime: endTime }),
    });
    if (res.ok) toast.success("Agenda configuration saved");
    else await toastApiError(res, "Failed to save agenda configuration");
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-lg">
        {[1, 2].map((i) => <div key={i} className="h-14 rounded-md bg-stone-100 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <p className="text-sm text-muted-foreground">
        Configure the default timing for your event agenda. These settings apply to the agenda builder and validation.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="gap-minutes">Gap Between Sessions (minutes)</Label>
        <p className="text-xs text-muted-foreground">Minimum buffer time between consecutive sessions for speaker transitions.</p>
        <Input
          id="gap-minutes"
          type="number"
          min={0}
          max={60}
          className="max-w-[120px]"
          value={gapMinutes}
          onChange={(e) => setGapMinutes(parseInt(e.target.value) || 0)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="agenda-start">Day Start Time</Label>
          <Input id="agenda-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="agenda-end">Day End Time</Label>
          <Input id="agenda-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>

      <div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save"}
        </Button>
      </div>
    </div>
  );
}
