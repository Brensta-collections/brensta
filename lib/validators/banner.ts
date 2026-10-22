import { z } from "zod";

export const bannerSchema = z.object({
  section: z.string().trim().min(2).max(40),
  title: z.string().max(120).optional().or(z.literal("")),
  subtitle: z.string().max(200).optional().or(z.literal("")),
  imageUrl: z.string().min(1, "Image URL required.").max(500),
  ctaText: z.string().max(60).optional().or(z.literal("")),
  ctaUrl: z.string().max(500).optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")).nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type BannerInput = z.infer<typeof bannerSchema>;
