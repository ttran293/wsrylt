import { z } from "zod";

export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 20;
export const USERNAME_LENGTH_MESSAGE = `Username must be ${MIN_USERNAME_LENGTH}-${MAX_USERNAME_LENGTH} characters.`;

export const usernameSchema = z
  .string()
  .trim()
  .min(MIN_USERNAME_LENGTH, USERNAME_LENGTH_MESSAGE)
  .max(MAX_USERNAME_LENGTH, USERNAME_LENGTH_MESSAGE);
