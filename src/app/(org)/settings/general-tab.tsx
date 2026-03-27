"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { toastApiError } from "@/lib/toast-helpers";
import { Loader2 } from "lucide-react";

type Org = {
  id: string;
  name: string;
  contactEmail: string | null;
  website: string | null;
};

export function GeneralTab() {
  const t = useTranslations("OrgSettings");
  const tc = useTranslations("Common");
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState("viewer");

  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");

  const isAdmin = userRole === "owner" || userRole === "admin";

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => { if (d.data?.role) setUserRole(d.data.role); }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/organizations")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          const o = d.data as Org;
          setOrg(o);
          setName(o.name);
          setContactEmail(o.contactEmail || "");
          setWebsite(o.website || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/organizations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, contactEmail: contactEmail || null, website: website || null }),
    });
    if (res.ok) {
      const d = await res.json();
      setOrg(d.data);
      toast.success(t("saved"));
    } else {
      await toastApiError(res, t("saveFailed"));
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-xl">
        {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-md bg-stone-100 animate-pulse" />)}
      </div>
    );
  }

  if (!org) return null;

  return (
    <div className="max-w-xl space-y-6">
      {/* General Info */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>{t("orgName")}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!isAdmin} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("contactEmail")}</Label>
            <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="hello@example.com" disabled={!isAdmin} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("website")}</Label>
            <Input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" disabled={!isAdmin} />
          </div>
        </div>
      </div>

      {/* Save */}
      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {tc("save")}...</> : tc("save")}
          </Button>
        </div>
      )}

    </div>
  );
}
