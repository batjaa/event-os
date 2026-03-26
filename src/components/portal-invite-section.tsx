"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

export function PortalInviteSection({
  entityType,
  entityId,
  entityEmail,
}: {
  entityType: string;
  entityId: string;
  entityEmail: string;
}) {
  const [status, setStatus] = useState<"checking" | "idle" | "loading" | "invited" | "already" | "error">("checking");
  const [showConfirm, setShowConfirm] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => {
    fetch(`/api/portal/status?entityType=${entityType}&entityId=${entityId}`)
      .then((r) => r.json())
      .then((d) => { setStatus(d.data?.invited ? "already" : "idle"); })
      .catch(() => setStatus("idle"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInvite = async () => {
    setStatus("loading");
    const res = await fetch("/api/portal/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, entityId }),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.data.alreadyInvited) {
        setStatus("already");
      } else {
        setInviteInfo({ email: entityEmail, password: data.data.tempPassword });
        setStatus("invited");
      }
    } else {
      setStatus("error");
    }
    setShowConfirm(false);
  };

  return (
    <div className="pt-4 border-t space-y-2">
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Stakeholder Portal</Label>

      {status === "already" && (
        <div className="rounded-md bg-sky-50 px-3 py-2 text-xs text-sky-700">
          Already invited — {entityEmail} has portal access.
          <Button size="sm" variant="outline" className="h-6 text-[10px] ml-2" onClick={() => { setStatus("idle"); setShowConfirm(true); }}>
            Resend invite
          </Button>
        </div>
      )}

      {status === "invited" && inviteInfo && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 space-y-1">
          <p className="text-xs font-medium text-emerald-800">Portal invite created!</p>
          <p className="text-xs text-emerald-700">Email: {inviteInfo.email}</p>
          <p className="text-xs text-emerald-700">Password: {inviteInfo.password}</p>
          <p className="text-xs text-emerald-600">Share these credentials with them.</p>
        </div>
      )}

      {status === "error" && (
        <p className="text-xs text-red-600">Failed to create invite. The email may already be in use.</p>
      )}

      {showConfirm && (
        <div className="rounded-md border p-3 space-y-2">
          <p className="text-xs text-stone-600">
            This will create a portal login for <strong>{entityEmail}</strong> where they can self-service their checklist items and update their profile.
          </p>
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={handleInvite} disabled={status === "loading"}>
              {status === "loading" ? "Inviting..." : "Confirm Invite"}
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {status === "idle" && !showConfirm && (
        <Button size="sm" className="w-full" onClick={() => setShowConfirm(true)}>
          <UserPlus className="mr-2 h-3 w-3" /> Invite to Portal
        </Button>
      )}
    </div>
  );
}
