import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Original users table kept for reference (unchanged)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Sender details schema
export const emailToneEnum = z.enum([
  "professional", 
  "friendly", 
  "persuasive", 
  "urgent"
]);

export const senderDetailsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company name is required"),
  productDescription: z.string().min(10, "Please provide a detailed description"),
  emailTone: emailToneEnum
});

export type SenderDetails = z.infer<typeof senderDetailsSchema>;

// Lead schema
export const leadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company name is required"),
  product: z.string().optional()
});

export type Lead = z.infer<typeof leadSchema>;

// Email schema
export const generatedEmailSchema = z.object({
  id: z.number().optional(),
  recipientName: z.string(),
  recipientCompany: z.string(),
  recipientProduct: z.string().optional(),
  subject: z.string(),
  body: z.string(),
  isReviewed: z.boolean().default(false),
  isEdited: z.boolean().default(false),
  createdAt: z.date().optional()
});

export type GeneratedEmail = z.infer<typeof generatedEmailSchema>;
export const insertGeneratedEmailSchema = generatedEmailSchema.omit({ id: true });
export type InsertGeneratedEmail = z.infer<typeof insertGeneratedEmailSchema>;

// Generation request schema
export const generateEmailsRequestSchema = z.object({
  senderDetails: senderDetailsSchema,
  leads: z.array(leadSchema)
});

export type GenerateEmailsRequest = z.infer<typeof generateEmailsRequestSchema>;
