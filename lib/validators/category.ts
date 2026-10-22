import { z } from "zod";
import { slugSchema } from "./product";

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: slugSchema,
  parentId: z.string().optional().nullable(),
  description: z.string().max(2000).optional().or(z.literal("")),
  image: z.string().max(500).optional().or(z.literal("")),
  seoTitle: z.string().max(70).optional().or(z.literal("")),
  seoDescription: z.string().max(180).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN", "ARCHIVED"]),
  showInMenu: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
