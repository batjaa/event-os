"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Check, X, RefreshCw } from "lucide-react";
import { useEventContext } from "@/lib/event-context";
import { toast } from "sonner";

type DeleteItem = { key: string; label: string; count: number };
type ItemStatus = "pending" | "deleting" | "done" | "error";

export function DangerZoneTab() {
  const event = useEventContext();
  const [userRole, setUserRole] = useState("viewer");
  const [loading, setLoading] = useState(true);
  const [editionName, setEditionName] = useState("");

  // Step 1: initial view
  // Step 2: type-to-confirm
  // Step 3: preview (show what will be deleted)
  // Step 4: deleting (progress)
  // Step 5: done
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [confirmName, setConfirmName] = useState("");
  const [items, setItems] = useState<DeleteItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>({});
  const [loadingPreview, setLoadingPreview] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch(`/api/editions/${event.editionId}`).then((r) => r.json()),
    ])
      .then(([me, editionRes]) => {
        if (me.data?.role) setUserRole(me.data.role);
        if (editionRes.data?.name) setEditionName(editionRes.data.name);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [event.editionId]);

  const isOwnerOrAdmin = userRole === "owner" || userRole === "admin";

  const loadPreview = async () => {
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/editions/${event.editionId}/delete-preview`);
      const json = await res.json();
      if (json.data) {
        setItems(json.data.items);
        setTotalCount(json.data.total);
        const initial: Record<string, ItemStatus> = {};
        json.data.items.forEach((item: DeleteItem) => { initial[item.key] = "pending"; });
        initial["event"] = "pending";
        setStatuses(initial);
        setStep(3);
      }
    } catch {
      toast.error("Failed to load deletion preview");
    }
    setLoadingPreview(false);
  };

  const executeDelete = async () => {
    setStep(4);

    // Mark all items as deleting one by one, then call the actual DELETE
    // The cascade handles everything server-side, but we simulate progress
    // by marking items sequentially with a small delay for visual feedback
    const allKeys = [...items.map((i) => i.key), "event"];

    for (const key of allKeys) {
      setStatuses((prev) => ({ ...prev, [key]: "deleting" }));
      await new Promise((r) => setTimeout(r, 200)); // Visual delay

      if (key === "event") {
        // The actual delete call — cascade handles everything
        try {
          const res = await fetch(`/api/editions/${event.editionId}`, { method: "DELETE" });
          if (res.ok) {
            setStatuses((prev) => ({ ...prev, [key]: "done" }));
          } else {
            setStatuses((prev) => ({ ...prev, [key]: "error" }));
            return; // Stop — if the event can't be deleted, nothing else matters
          }
        } catch {
          setStatuses((prev) => ({ ...prev, [key]: "error" }));
          return;
        }
      } else {
        // Mark as done (the cascade already handles the actual deletion)
        setStatuses((prev) => ({ ...prev, [key]: "done" }));
      }
    }

    setStep(5);
    // Redirect after a brief pause so user sees the final state
    setTimeout(() => { window.location.href = "/"; }, 1500);
  };

  const retryDelete = () => {
    // Reset failed items and try again
    setStatuses((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (next[key] === "error") next[key] = "pending";
      }
      return next;
    });
    executeDelete();
  };

  const close = () => {
    setStep(1);
    setConfirmName("");
    setItems([]);
    setStatuses({});
  };

  if (loading) {
    return <div className="h-14 rounded-md bg-stone-100 animate-pulse max-w-xl" />;
  }

  if (!isOwnerOrAdmin) {
    return (
      <div className="max-w-xl text-sm text-muted-foreground">
        Only organization owners and admins can access the danger zone.
      </div>
    );
  }

  const hasErrors = Object.values(statuses).some((s) => s === "error");

  return (
    <>
      <div className="max-w-xl space-y-4">
        <div className="flex items-center gap-2 text-destructive mb-2">
          <AlertTriangle className="h-4 w-4" />
          <p className="text-sm">Actions here are irreversible. Proceed with caution.</p>
        </div>

        <div className="px-4 py-3 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete this event</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete &quot;{editionName}&quot; and all its data.
              </p>
            </div>
            <Button size="sm" variant="destructive" onClick={() => setStep(2)}>
              Delete Event...
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {step >= 2 && (
        <div
          ref={backdropRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === backdropRef.current && step < 4) close(); }}
        >
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg mx-4">

            {/* Step 2: Type to confirm */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <h3 className="text-base font-semibold">Delete &quot;{editionName}&quot;</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete the event and all associated data. This action cannot be undone.
                </p>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Type <span className="font-semibold">{editionName}</span> to continue
                  </Label>
                  <Input
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    placeholder={editionName}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter" && confirmName === editionName) loadPreview(); }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={close}>Cancel</Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={confirmName !== editionName || loadingPreview}
                    onClick={loadPreview}
                  >
                    {loadingPreview ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</> : "Continue"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Preview what will be deleted */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold">The following will be deleted</h3>
                <div className="rounded-md border divide-y max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.key} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>{item.label}</span>
                      <span className="text-muted-foreground tabular-nums">{item.count}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3 py-2 text-sm font-medium bg-red-50">
                    <span>The event itself</span>
                    <span className="text-destructive">1</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Total: {totalCount + 1} items will be permanently deleted.
                </p>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={close}>Cancel</Button>
                  <Button size="sm" variant="destructive" onClick={executeDelete}>
                    Delete Everything
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4 & 5: Deletion progress */}
            {(step === 4 || step === 5) && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold">
                  {step === 5 && !hasErrors ? "Deletion complete" : hasErrors ? "Deletion encountered errors" : "Deleting..."}
                </h3>
                <div className="rounded-md border divide-y max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.key} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={statuses[item.key] || "pending"} />
                        <span className={statuses[item.key] === "done" ? "text-muted-foreground" : ""}>{item.label}</span>
                      </div>
                      <span className="text-muted-foreground tabular-nums text-xs">{item.count}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3 py-2 text-sm font-medium bg-red-50">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={statuses["event"] || "pending"} />
                      <span>The event itself</span>
                    </div>
                  </div>
                </div>
                {step === 5 && !hasErrors && (
                  <p className="text-xs text-muted-foreground">Redirecting to home...</p>
                )}
                {hasErrors && (
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => { window.location.href = "/"; }}>
                      Go Home
                    </Button>
                    <Button size="sm" variant="destructive" onClick={retryDelete}>
                      <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry Failed
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function StatusIcon({ status }: { status: ItemStatus }) {
  switch (status) {
    case "pending":
      return <div className="h-4 w-4 rounded-full border-2 border-stone-200" />;
    case "deleting":
      return <Loader2 className="h-4 w-4 animate-spin text-amber-500" />;
    case "done":
      return <Check className="h-4 w-4 text-emerald-500" />;
    case "error":
      return <X className="h-4 w-4 text-red-500" />;
  }
}
