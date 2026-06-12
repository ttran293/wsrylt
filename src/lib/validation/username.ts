import { Profanity } from "@2toad/profanity";
import usernameBlacklist from "the-big-username-blacklist";
import { z } from "zod";
import {
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  USERNAME_BLOCKED_MESSAGE,
  USERNAME_LENGTH_MESSAGE,
} from "@/lib/validation/username-constants";

const usernameProfanity = new Profanity({ wholeWord: false });

export {
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  USERNAME_BLOCKED_MESSAGE,
  USERNAME_LENGTH_MESSAGE,
};

export function isUsernameAllowed(username: string): boolean {
  const normalizedUsername = username.trim().toLowerCase();

  return (
    !usernameProfanity.exists(normalizedUsername) &&
    usernameBlacklist.validate(normalizedUsername)
  );
}

export const usernameSchema = z
  .string()
  .trim()
  .min(MIN_USERNAME_LENGTH, USERNAME_LENGTH_MESSAGE)
  .max(MAX_USERNAME_LENGTH, USERNAME_LENGTH_MESSAGE)
  .refine(isUsernameAllowed, USERNAME_BLOCKED_MESSAGE);
