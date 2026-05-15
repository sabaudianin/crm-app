import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

//  Timestamps helper
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// Enums
export const memberRoleEnum = pgEnum("member_role", [
  "owner",
  "admin",
  "member",
]);
export const contactStatusEnum = pgEnum("contact_status", [
  "lead",
  "prospect",
  "customer",
  "churned",
]);
export const dealStageEnum = pgEnum("deal_stage", [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
]);
export const activityTypeEnum = pgEnum("activity_type", [
  "contact_created",
  "contact_updated",
  "deal_created",
  "deal_stage_changed",
  "deal_won",
  "deal_lost",
  "note_added",
  "member_joined",
]);

// Better Auth tables (required)
// Better Auth zarządza tymi tabelami — nie modyfikuj nazw kolumn

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  ...timestamps,
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  activeOrganizationId: text("active_organization_id"),
  ...timestamps,
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  ...timestamps,
});

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
});

// Organizations (Better Auth plugin)

export const organizations = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  metadata: text("metadata"),
  ...timestamps,
});

export const members = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: memberRoleEnum("role").notNull().default("member"),
  ...timestamps,
});

export const invitations = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: memberRoleEnum("role").notNull().default("member"),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ...timestamps,
});

// CRM: Contacts

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    assignedToId: text("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),

    // Dane kontaktu
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    email: text("email"),
    phone: text("phone"),
    company: text("company"),
    position: text("position"),
    website: text("website"),
    avatarUrl: text("avatar_url"),

    status: contactStatusEnum("status").notNull().default("lead"),
    notes: text("notes"),

    ...timestamps,
  },
  (t) => ({
    orgIdx: index("contacts_org_idx").on(t.organizationId),
    emailIdx: index("contacts_email_idx").on(t.email),
    assignedIdx: index("contacts_assigned_idx").on(t.assignedToId),
  }),
);

// CRM: Tags

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"),
  ...timestamps,
});

export const contactTags = pgTable("contact_tags", {
  contactId: uuid("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
});

// CRM: Deals / Pipeline

export const deals = pgTable(
  "deals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    assignedToId: text("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),

    title: text("title").notNull(),
    value: integer("value"), // w groszach/centach dla precyzji
    currency: text("currency").notNull().default("PLN"),
    stage: dealStageEnum("stage").notNull().default("new"),

    // Kolejność w kolumnie kanbana
    position: integer("position").notNull().default(0),

    expectedCloseDate: timestamp("expected_close_date", {
      withTimezone: true,
    }),
    closedAt: timestamp("closed_at", { withTimezone: true }),

    notes: text("notes"),

    ...timestamps,
  },
  (t) => ({
    orgIdx: index("deals_org_idx").on(t.organizationId),
    stageIdx: index("deals_stage_idx").on(t.stage),
    contactIdx: index("deals_contact_idx").on(t.contactId),
  }),
);

//CRM: Notes

export const contactNotes = pgTable("contact_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  contactId: uuid("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  ...timestamps,
});

// Activity Feed (real-time)

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorId: text("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    type: activityTypeEnum("type").notNull(),

    // Elastyczne pola  co zostało zmienione
    entityType: text("entity_type"), // "contact" | "deal"
    entityId: text("entity_id"),
    entityName: text("entity_name"), // snapshot nazwy w momencie zdarzenia

    // Opcjonalne metadane (np. poprzedni i nowy stage)
    metadata: text("metadata"), // JSON string

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    orgIdx: index("activities_org_idx").on(t.organizationId),
    createdAtIdx: index("activities_created_at_idx").on(t.createdAt),
  }),
);

//  Relations

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  members: many(members),
  assignedContacts: many(contacts),
  assignedDeals: many(deals),
  activities: many(activities),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(members),
  contacts: many(contacts),
  deals: many(deals),
  activities: many(activities),
  tags: many(tags),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [contacts.organizationId],
    references: [organizations.id],
  }),
  assignedTo: one(users, {
    fields: [contacts.assignedToId],
    references: [users.id],
  }),
  deals: many(deals),
  notes: many(contactNotes),
  contactTags: many(contactTags),
}));

export const dealsRelations = relations(deals, ({ one }) => ({
  organization: one(organizations, {
    fields: [deals.organizationId],
    references: [organizations.id],
  }),
  contact: one(contacts, {
    fields: [deals.contactId],
    references: [contacts.id],
  }),
  assignedTo: one(users, {
    fields: [deals.assignedToId],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  organization: one(organizations, {
    fields: [activities.organizationId],
    references: [organizations.id],
  }),
  actor: one(users, {
    fields: [activities.actorId],
    references: [users.id],
  }),
}));
