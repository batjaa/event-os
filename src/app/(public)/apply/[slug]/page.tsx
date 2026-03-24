import { db } from "@/db";
import { eventEditions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CFPFormClient } from "./client";

export const dynamic = "force-dynamic";

export default async function CFPPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const edition = await db.query.eventEditions.findFirst({
    where: eq(eventEditions.slug, slug),
    with: { organization: true },
  });

  if (!edition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  if (!edition.cfpOpen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold mb-2">{edition.name}</h1>
          <p className="text-muted-foreground">
            The call for speakers is currently closed. Check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <CFPFormClient
      editionId={edition.id}
      organizationId={edition.organizationId}
      eventName={edition.name}
      startDate={edition.startDate?.toISOString() || null}
      endDate={edition.endDate?.toISOString() || null}
      venue={edition.venue}
    />
  );
}
