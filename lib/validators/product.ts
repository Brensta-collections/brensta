import { z } from "zod";

export const slugSchema = z
  .string()
  .trim()
  .min(2, "Slug must be at least 2 characters.")
  .max(80, "Slug is too long.")
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Slug must be lowercase letters, numbers and dashes only.");

export const variantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().trim().min(2).max(60).regex(/^[A-Z0-9][A-Z0-9_-]*$/i, "SKU: letters, digits, dashes, underscores."),
  price: z.number().positive(),
  salePrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  optionValues: z.record(z.string(), z.string()),
  isActive: z.boolean().default(true),
}).refine((v) => v.salePrice === undefined || v.salePrice === null || v.salePrice < v.price, {
  message: "Sale price must be less than regular price.",
  path: ["salePrice"],
});

export const productFormSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: slugSchema,
  shortDescription: z.string().trim().max(300).optional().or(z.literal("")),
  description: z.string().max(10000).optional().or(z.literal("")),
  brand: z.string().trim().max(60).default("BRENSTA"),
  basePrice: z.number().positive(),
  baseSalePrice: z.number().positive().optional().nullable(),
  taxRatePct: z.number().min(0).max(28).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN", "ARCHIVED"]),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  seoTitle: z.string().max(70).optional().or(z.literal("")),
  seoDescription: z.string().max(180).optional().or(z.literal("")),
  categoryIds: z.array(z.string()).min(1, "Pick at least one category."),
  primaryCategoryId: z.string().min(1, "Pick a primary category."),
  attributeValues: z
    .array(
      z.object({
        code: z.string(),
        value: z.string().min(1),
      })
    )
    .default([]),
  variants: z.array(variantSchema).min(1, "Add at least one variant."),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;
