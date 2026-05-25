import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must have minimum 8 digits"),
});

export type LoginValues = z.infer<typeof loginSchema>;
