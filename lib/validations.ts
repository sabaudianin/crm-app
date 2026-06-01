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

export const onboardingSchema = z.object({
  name: z
    .string()
    .min(2, "Name must have minimum 2 digits")
    .max(50, "Name can be maximum 50 digits"),
  slug: z
    .string()
    .min(2, "Slug have to be minimum 2 digits")
    .max(50, "Slug have to be maximum 50 digitsw")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain small letters, numbers and commas",
    ),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;

export const contactSchema = z.object({
  firstName: z.string().min(1, "Name is required").max(50),
  lastName: z.string().max(50).optional().or(z.literal("")),
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  company: z.string().max(100).optional().or(z.literal("")),
  position: z.string().max(100).optional().or(z.literal("")),
  website: z
    .string()
    .url("Please enter valid URL")
    .optional()
    .or(z.literal("")),
  status: z.enum(["lead", "prospect", "customer", "churned"]).default("lead"),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
