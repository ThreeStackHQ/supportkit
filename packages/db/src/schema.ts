import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";

// Enums
export const ticketStatusEnum = pgEnum("ticket_status", [
  "open",
  "pending",
  "resolved",
]);

export const ticketSourceEnum = pgEnum("ticket_source", ["email", "widget"]);

export const senderTypeEnum = pgEnum("sender_type", ["agent", "contact"]);

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "indie",
  "pro",
]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Workspaces table
export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  emailAddress: text("email_address"),
  widgetKey: text("widget_key").notNull().unique(),
  supportEmail: text("support_email"),
  primaryColor: text("primary_color").notNull().default("#7c3aed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Contacts table (end users who submit tickets)
export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tickets table
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  status: ticketStatusEnum("status").notNull().default("open"),
  source: ticketSourceEnum("source").notNull(),
  assignedToId: uuid("assigned_to_id").references(() => users.id, {
    onDelete: "set null",
  }),
  emailThreadId: text("email_thread_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Messages table
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  senderType: senderTypeEnum("sender_type").notNull(),
  isInternal: boolean("is_internal").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tier: subscriptionTierEnum("tier").notNull().default("free"),
  status: text("status").notNull().default("active"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
