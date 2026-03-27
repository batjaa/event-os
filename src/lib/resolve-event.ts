import { db } from "@/db";
import { eventEditions } from "@/db/schema";
import { eq } from "drizzle-orm";

export type ResolvedEvent = {
  editionId: string;
  orgId: string;
  slug: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  venue: string | null;
  status: string;
};

export async function resolveEvent(slug: string): Promise<ResolvedEvent | null> {
  const edition = await db.query.eventEditions.findFirst({
    where: eq(eventEditions.slug, slug),
  });
  if (!edition) return null;
  return {
    editionId: edition.id,
    orgId: edition.organizationId,
    slug: edition.slug,
    name: edition.name,
    startDate: edition.startDate,
    endDate: edition.endDate,
    venue: edition.venue,
    status: edition.status,
  };
}
