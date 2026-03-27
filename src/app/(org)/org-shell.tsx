"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Settings, User } from "lucide-react";
import { applyBrandColor } from "@/lib/brand";

type OrgData = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string | null;
};

export function OrgShell({
  org,
  userName,
  children,
}: {
  org: OrgData;
  userName: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (org.brandColor) applyBrandColor(org.brandColor);
    if (org.logoUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = org.logoUrl;
    }
  }, [org.brandColor, org.logoUrl]);

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 lg:px-6">
          {/* Left: Org identity */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {org.logoUrl ? (
              <img
                src={org.logoUrl}
                alt={org.name}
                className="h-8 w-8 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
                {org.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-semibold text-stone-900">{org.name}</span>
          </Link>

          {/* Right: Settings + Avatar */}
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="rounded-md p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-xs font-medium text-stone-600">
              {initials || <User className="h-4 w-4" />}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
        {children}
      </main>
    </div>
  );
}
