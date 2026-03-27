"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, Loader2 } from "lucide-react";
import { useConfirm } from "@/components/confirm-dialog";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
};

const roleBadgeColors: Record<string, string> = {
  owner: "bg-yellow-100 text-yellow-800 border-yellow-200",
  admin: "bg-stone-100 text-stone-800 border-stone-200",
  organizer: "bg-sky-50 text-sky-700 border-sky-200",
  coordinator: "bg-emerald-50 text-emerald-700 border-emerald-200",
  viewer: "bg-stone-50 text-stone-500 border-stone-200",
};

export function TeamTab() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("organizer");
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);

  const { confirm: confirmDialog } = useConfirm();

  const fetchMembers = () => {
    setLoading(true);
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setMembers(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError("");

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: inviteName || undefined,
        email: inviteEmail,
        role: inviteRole,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setInviteError(data.error || "Failed to invite");
      setInviting(false);
      return;
    }

    setInviteOpen(false);
    setInviteName("");
    setInviteEmail("");
    setInviteRole("organizer");
    setInviting(false);
    fetchMembers();
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    fetchMembers();
  };

  const handleRemove = async (userId: string, userName: string | null) => {
    const confirmed = await confirmDialog({
      title: "Remove team member",
      message: `Remove ${userName || "this user"} from the organization? They will lose access to all event data.`,
      confirmLabel: "Remove",
      variant: "danger",
    });
    if (!confirmed) return;
    await fetch(`/api/users/${userId}`, { method: "DELETE" });
    fetchMembers();
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Header + invite button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">
            Team Members ({members.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage who has access to your event workspace
          </p>
        </div>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>

        {/* Invite modal */}
        {inviteOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setInviteOpen(false)}
            />
            <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">
                Invite Team Member
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g., Tuvshin"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="tuvshin@devsummit.mn"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="organizer">Organizer</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {inviteError && (
                  <p className="text-sm text-red-600">{inviteError}</p>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setInviteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleInvite}
                    disabled={!inviteEmail.trim() || inviting}
                  >
                    {inviting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Inviting...
                      </>
                    ) : (
                      "Invite"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Members list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-md bg-stone-100 animate-pulse"
            />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <p className="text-muted-foreground mb-2">
            No team members yet. Invite your first teammate to get started.
          </p>
          <Button onClick={() => setInviteOpen(true)} size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>
      ) : (
        <div className="space-y-1">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-md border px-4 py-3 hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-200 text-xs font-medium text-stone-600">
                  {initials(m.name || m.email)}
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {m.name || m.email.split("@")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {m.role === "owner" ? (
                  <Badge
                    className={roleBadgeColors.owner}
                    variant="outline"
                  >
                    Owner
                  </Badge>
                ) : (
                  <select
                    value={m.role}
                    onChange={(e) =>
                      handleRoleChange(m.id, e.target.value)
                    }
                    className="rounded border border-input bg-background px-2 py-1 text-xs"
                  >
                    <option value="admin">Admin</option>
                    <option value="organizer">Organizer</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="viewer">Viewer</option>
                  </select>
                )}
                {m.role !== "owner" && (
                  <button
                    onClick={() => handleRemove(m.id, m.name)}
                    className="rounded p-1 text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
