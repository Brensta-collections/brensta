import { z } from "zod";

export const checkoutSchema = z.object({
  addressId: z.string().min(1, "Choose a delivery address."),
  paymentMethod: z.enum(["COD", "ONLINE"]),
  notes: z.string().max(400).optional().or(z.literal("")),
  idempotencyKey: z.string().min(10).max(80),
  expectedTotalPaise: z.number().int().positive(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
