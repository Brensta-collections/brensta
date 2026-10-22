import { z } from "zod";

export const feedbackSchema = z.object({
  name: z.string().trim().min(2, "Please share your name.").max(80),
  email: z.string().trim().toLowerCase().email("Please share a valid email."),
  subject: z.string().trim().min(3, "Add a short subject.").max(140),
  body: z.string().trim().min(10, "Share a little more detail.").max(2000),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
