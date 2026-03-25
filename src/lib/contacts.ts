import { db } from "@/db";
import { contacts } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Find or create a contact by email. Returns the contact ID.
 * If a contact with this email exists, returns it. Otherwise creates one.
 */
export async function findOrCreateContact(data: {
  email: string;
  name: string;
  phone?: string | null;
  bio?: string | null;
  headshotUrl?: string | null;
  company?: string | null;
  title?: string | null;
  linkedin?: string | null;
  website?: string | null;
}): Promise<string> {
  const email = data.email.trim().toLowerCase();

  const existing = await db.query.contacts.findFirst({
    where: eq(contacts.email, email),
  });

  if (existing) {
    return existing.id;
  }

  const [contact] = await db
    .insert(contacts)
    .values({
      name: data.name,
      email,
      phone: data.phone || null,
      bio: data.bio || null,
      headshotUrl: data.headshotUrl || null,
      company: data.company || null,
      title: data.title || null,
      linkedin: data.linkedin || null,
      website: data.website || null,
    })
    .returning();

  return contact.id;
}
