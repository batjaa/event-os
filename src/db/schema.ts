import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
  varchar,
  index,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────

export const speakerStatusEnum = pgEnum("speaker_status", [
  "pending",
  "accepted",
  "rejected",
  "waitlisted",
]);

export const sessionTypeEnum = pgEnum("session_type", [
  "talk",
  "workshop",
  "panel",
  "keynote",
  "break",
  "networking",
]);

export const editionStatusEnum = pgEnum("edition_status", [
  "draft",
  "published",
  "archived",
]);

export const agendaStatusEnum = pgEnum("agenda_status", [
  "draft",
  "published",
]);

export const queueStatusEnum = pgEnum("queue_status", [
  "pending",
  "processing",
  "done",
  "failed",
]);

// ─── Organizations ───────────────────────────────────────

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Event Series ────────────────────────────────────────

export const eventSeries = pgTable("event_series", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Event Editions ──────────────────────────────────────

export const eventEditions = pgTable(
  "event_editions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    seriesId: uuid("series_id")
      .notNull()
      .references(() => eventSeries.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    venue: varchar("venue", { length: 500 }),
    status: editionStatusEnum("status").default("draft").notNull(),
    agendaStatus: agendaStatusEnum("agenda_status")
      .default("draft")
      .notNull(),
    cfpOpen: boolean("cfp_open").default(false).notNull(),
    timezone: varchar("timezone", { length: 50 }).default("Asia/Ulaanbaatar"),
    version: integer("version").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("edition_org_idx").on(table.organizationId),
    index("edition_slug_idx").on(table.slug),
  ]
);

// ─── Tracks ──────────────────────────────────────────────

export const tracks = pgTable("tracks", {
  id: uuid("id").defaultRandom().primaryKey(),
  editionId: uuid("edition_id")
    .notNull()
    .references(() => eventEditions.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 7 }), // hex color for UI tinting
  sortOrder: integer("sort_order").default(0).notNull(),
});

// ─── Speaker Applications ────────────────────────────────

export const speakerApplications = pgTable(
  "speaker_applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    editionId: uuid("edition_id")
      .notNull()
      .references(() => eventEditions.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // Speaker info
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    bio: text("bio"),
    headshotUrl: text("headshot_url"),
    company: varchar("company", { length: 255 }),
    title: varchar("title", { length: 255 }),
    // Talk info
    talkTitle: varchar("talk_title", { length: 500 }).notNull(),
    talkAbstract: text("talk_abstract"),
    talkType: sessionTypeEnum("talk_type").default("talk").notNull(),
    trackPreference: varchar("track_preference", { length: 255 }),
    // Review
    status: speakerStatusEnum("status").default("pending").notNull(),
    reviewScore: integer("review_score"), // average score from reviewers
    reviewNotes: text("review_notes"),
    // Meta
    version: integer("version").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("speaker_edition_status_idx").on(table.editionId, table.status),
    index("speaker_org_idx").on(table.organizationId),
  ]
);

// ─── Sessions ────────────────────────────────────────────

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    editionId: uuid("edition_id")
      .notNull()
      .references(() => eventEditions.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    trackId: uuid("track_id").references(() => tracks.id, {
      onDelete: "set null",
    }),
    speakerId: uuid("speaker_id").references(() => speakerApplications.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    type: sessionTypeEnum("type").default("talk").notNull(),
    startTime: timestamp("start_time"),
    endTime: timestamp("end_time"),
    room: varchar("room", { length: 255 }),
    day: integer("day").default(1).notNull(), // day number of the event
    sortOrder: integer("sort_order").default(0).notNull(),
    version: integer("version").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("session_edition_time_idx").on(table.editionId, table.startTime),
    index("session_edition_speaker_idx").on(table.editionId, table.speakerId),
  ]
);

// ─── Sponsor Applications ────────────────────────────────

export const sponsorApplications = pgTable(
  "sponsor_applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    editionId: uuid("edition_id")
      .notNull()
      .references(() => eventEditions.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    companyName: varchar("company_name", { length: 255 }).notNull(),
    contactName: varchar("contact_name", { length: 255 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }).notNull(),
    packagePreference: varchar("package_preference", { length: 100 }),
    message: text("message"),
    status: varchar("status", { length: 50 }).default("pending").notNull(),
    version: integer("version").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("sponsor_org_idx").on(table.organizationId)]
);

// ─── Attendees ───────────────────────────────────────────

export const attendees = pgTable(
  "attendees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    editionId: uuid("edition_id")
      .notNull()
      .references(() => eventEditions.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    ticketType: varchar("ticket_type", { length: 100 })
      .default("general")
      .notNull(),
    qrHash: varchar("qr_hash", { length: 64 }).notNull(),
    checkedIn: boolean("checked_in").default(false).notNull(),
    checkedInAt: timestamp("checked_in_at"),
    checkedInBy: varchar("checked_in_by", { length: 100 }), // station identifier
    version: integer("version").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("attendee_edition_qr_idx").on(table.editionId, table.qrHash),
    index("attendee_org_idx").on(table.organizationId),
  ]
);

// ─── Event Queue ─────────────────────────────────────────

export const eventQueue = pgTable(
  "event_queue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    payload: jsonb("payload").notNull(),
    status: queueStatusEnum("status").default("pending").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    lastError: text("last_error"),
    processedAt: timestamp("processed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("queue_status_created_idx").on(table.status, table.createdAt),
  ]
);

// ─── Volunteer Applications ──────────────────────────────

export const volunteerApplications = pgTable(
  "volunteer_applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    editionId: uuid("edition_id")
      .notNull()
      .references(() => eventEditions.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    role: varchar("role", { length: 100 }), // registration, stage, logistics, etc.
    availability: text("availability"), // which days/shifts
    experience: text("experience"),
    tshirtSize: varchar("tshirt_size", { length: 10 }),
    status: varchar("status", { length: 50 }).default("pending").notNull(),
    assignedShift: varchar("assigned_shift", { length: 255 }),
    notes: text("notes"),
    version: integer("version").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("volunteer_edition_idx").on(table.editionId),
    index("volunteer_org_idx").on(table.organizationId),
  ]
);

// ─── Booths ──────────────────────────────────────────────

export const booths = pgTable(
  "booths",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    editionId: uuid("edition_id")
      .notNull()
      .references(() => eventEditions.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(), // e.g., "Booth A1"
    location: varchar("location", { length: 255 }), // e.g., "Hall B, Row 2"
    size: varchar("size", { length: 50 }), // small, medium, large, premium
    price: integer("price"), // in smallest currency unit
    status: varchar("status", { length: 50 }).default("available").notNull(), // available, reserved, confirmed, setup
    sponsorId: uuid("sponsor_id").references(() => sponsorApplications.id, {
      onDelete: "set null",
    }),
    equipment: text("equipment"), // power, wifi, table, chairs, etc.
    notes: text("notes"),
    version: integer("version").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("booth_edition_idx").on(table.editionId),
    index("booth_org_idx").on(table.organizationId),
  ]
);

// ─── Media Partners ──────────────────────────────────────

export const mediaPartners = pgTable(
  "media_partners",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    editionId: uuid("edition_id")
      .notNull()
      .references(() => eventEditions.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    companyName: varchar("company_name", { length: 255 }).notNull(),
    contactName: varchar("contact_name", { length: 255 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }).notNull(),
    type: varchar("type", { length: 100 }), // tv, online, print, podcast, blog
    reach: varchar("reach", { length: 255 }), // audience size / coverage area
    proposal: text("proposal"), // what they offer
    deliverables: text("deliverables"), // what we provide to them
    status: varchar("status", { length: 50 }).default("pending").notNull(),
    logoUrl: text("logo_url"),
    notes: text("notes"),
    version: integer("version").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("media_edition_idx").on(table.editionId),
    index("media_org_idx").on(table.organizationId),
  ]
);

// ─── Marketing Campaigns ─────────────────────────────────

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    editionId: uuid("edition_id")
      .notNull()
      .references(() => eventEditions.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 500 }).notNull(),
    type: varchar("type", { length: 100 }).notNull(), // speaker_announcement, sponsor_promo, event_update, social_post
    platform: varchar("platform", { length: 100 }), // twitter, facebook, instagram, linkedin, telegram
    content: text("content"),
    scheduledDate: timestamp("scheduled_date"),
    publishedDate: timestamp("published_date"),
    status: varchar("status", { length: 50 }).default("draft").notNull(), // draft, scheduled, published, cancelled
    speakerId: uuid("speaker_id").references(() => speakerApplications.id, {
      onDelete: "set null",
    }),
    sponsorId: uuid("sponsor_id").references(() => sponsorApplications.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    version: integer("version").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("campaign_edition_idx").on(table.editionId),
    index("campaign_org_idx").on(table.organizationId),
    index("campaign_scheduled_idx").on(table.scheduledDate),
  ]
);

// ─── Audit Log ───────────────────────────────────────────

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").references(() => organizations.id),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    action: varchar("action", { length: 50 }).notNull(), // create, update, delete
    changes: jsonb("changes"),
    actorId: varchar("actor_id", { length: 255 }), // user email or "service-token"
    source: varchar("source", { length: 20 }).default("web").notNull(), // web, telegram, api
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_entity_idx").on(table.entityType, table.entityId),
  ]
);

// ─── Users (for NextAuth) ────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  passwordHash: text("password_hash"),
  organizationId: uuid("organization_id").references(() => organizations.id),
  role: varchar("role", { length: 50 }).default("organizer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const authSessions = pgTable("auth_sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: varchar("token_type", { length: 255 }),
  scope: varchar("scope", { length: 255 }),
  idToken: text("id_token"),
  sessionState: varchar("session_state", { length: 255 }),
});

// ─── Relations ───────────────────────────────────────────

export const organizationsRelations = relations(organizations, ({ many }) => ({
  series: many(eventSeries),
  editions: many(eventEditions),
  users: many(users),
}));

export const eventSeriesRelations = relations(
  eventSeries,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [eventSeries.organizationId],
      references: [organizations.id],
    }),
    editions: many(eventEditions),
  })
);

export const eventEditionsRelations = relations(
  eventEditions,
  ({ one, many }) => ({
    series: one(eventSeries, {
      fields: [eventEditions.seriesId],
      references: [eventSeries.id],
    }),
    organization: one(organizations, {
      fields: [eventEditions.organizationId],
      references: [organizations.id],
    }),
    tracks: many(tracks),
    sessions: many(sessions),
    speakers: many(speakerApplications),
    attendees: many(attendees),
  })
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  edition: one(eventEditions, {
    fields: [sessions.editionId],
    references: [eventEditions.id],
  }),
  track: one(tracks, {
    fields: [sessions.trackId],
    references: [tracks.id],
  }),
  speaker: one(speakerApplications, {
    fields: [sessions.speakerId],
    references: [speakerApplications.id],
  }),
}));

export const speakerApplicationsRelations = relations(
  speakerApplications,
  ({ one, many }) => ({
    edition: one(eventEditions, {
      fields: [speakerApplications.editionId],
      references: [eventEditions.id],
    }),
    sessions: many(sessions),
  })
);

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
}));
