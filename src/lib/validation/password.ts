import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters.")
  .regex(/[A-Z]/, "Password must include one uppercase letter.")
  .regex(/[0-9]/, "Password must include one number.");
