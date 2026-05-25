import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must have minimum 8 digits"),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must have minimum 2 digits"),
    email: z.string().email("Invalid email"),
    password: z
      .string()
      .min(8, "Password have to contain min 8 digits")
      .regex(/[A-Z]/, "Password have to contain capital letter")
      .regex(/[0-9]/, "Password have to contain number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Paswword have to be the same",
    path: ["confirmPassword"],
  });

export type RegisterValues = z.infer<typeof registerSchema>;
