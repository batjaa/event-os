"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm-dialog";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { toastApiError } from "@/lib/toast-helpers";
import { Loader2, AlertTriangle } from "lucide-react";

type Org = { id: string; name: string };
type OrgUser = { id: string; name: string | null; email: string; role: string };

export function DangerZoneTab() {
  const t = useTranslations("OrgSettings");
  const tc = useTranslations("Common");
  const { confirm } = useConfirm();

  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("viewer");
  const [members, setMembers] = useState<OrgUser[]>([]);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const isOwner = userRole === "owner";

  useEffect(() => {
    Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/organizations").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([me, orgRes, usersRes]) => {
      if (me.data?.role) setUserRole(me.data.role);
      if (orgRes.data) setOrg(orgRes.data);
      if (usersRes.data) setMembers(usersRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleTransfer = async (newOwnerId: string, newOwnerName: string) => {
    const confirmed = await confirm({
      title: t("transferTitle"),
      message: t("transferConfirm", { name: org?.name || "", newOwner: newOwnerName }),
      confirmLabel: t("transferButton"),
      variant: "danger",
    });
    if (!confirmed) return;
    setTransferring(true);
    const res = await fetch("/api/organizations/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newOwnerId }),
    });
    if (res.ok) { toast.success(t("transferDone")); window.location.reload(); }
    else { await toastApiError(res, t("saveFailed")); }
    setTransferring(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch("/api/organizations/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmName: deleteConfirmName }),
    });
    if (res.ok) { window.location.href = "/login"; }
    else { await toastApiError(res, t("deleteFailed")); setDeleting(false); }
  };

  if (loading) {
    return <div className="h-14 rounded-md bg-stone-100 animate-pulse max-w-xl" />;
  }

  if (!org) return null;

  if (!isOwner) {
    return (
      <div className="max-w-xl text-sm text-muted-foreground">
        Only the organization owner can access the danger zone.
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-2 text-destructive mb-2">
        <AlertTriangle className="h-4 w-4" />
        <p className="text-sm">{t("dangerZoneDesc")}</p>
      </div>

      {/* Transfer Ownership */}
      <div className="flex items-center justify-between px-4 py-3 border border-red-200 rounded-lg">
        <div>
          <p className="text-sm font-medium">{t("transferOwnership")}</p>
          <p className="text-xs text-muted-foreground">{t("transferDesc")}</p>
        </div>
        <select
          className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs cursor-pointer"
          defaultValue=""
          disabled={transferring}
          onChange={(e) => {
            const userId = e.target.value;
            const user = members.find((m) => m.id === userId);
            if (user) handleTransfer(userId, user.name || user.email);
            e.target.value = "";
          }}
        >
          <option value="" disabled>{t("transferButton")}</option>
          {members.filter((m) => m.role !== "owner").map((m) => (
            <option key={m.id} value={m.id}>{m.name || m.email} ({m.role})</option>
          ))}
        </select>
      </div>

      {/* Delete Organization */}
      <div className="px-4 py-3 border border-red-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t("deleteOrg")}</p>
            <p className="text-xs text-muted-foreground">{t("deleteDesc")}</p>
          </div>
          {!showDelete && (
            <Button size="sm" variant="destructive" onClick={() => setShowDelete(true)}>
              {t("deleteButton")}
            </Button>
          )}
        </div>
        {showDelete && (
          <div className="mt-3 pt-3 border-t border-red-200 space-y-3">
            <p className="text-xs text-stone-600">{t("deleteMessage")}</p>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("typeToConfirm", { name: org.name })}</Label>
              <Input value={deleteConfirmName} onChange={(e) => setDeleteConfirmName(e.target.value)} placeholder={org.name} autoFocus />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleteConfirmName !== org.name || deleting}>
                {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("deleteButton")}</> : t("deleteButton")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowDelete(false); setDeleteConfirmName(""); }}>
                {tc("cancel")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
