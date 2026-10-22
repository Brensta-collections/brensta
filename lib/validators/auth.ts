import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Please enter a valid email address.");
export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters.")
  .max(128, "Password is too long.")
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), { message: "Use at least one letter and one number." });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/i, "Enter a 10-digit Indian mobile number.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  password: passwordSchema,
});

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  current: z.string().min(1, "Enter your current password."),
  next: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetInput = z.infer<typeof resetSchema>;
