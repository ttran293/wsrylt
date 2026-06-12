import { Profanity } from "@2toad/profanity";
import { z } from "zod";

export const MIN_CHAT_MESSAGE_LENGTH = 1;
export const MAX_CHAT_MESSAGE_LENGTH = 500;
export const CHAT_MESSAGE_LENGTH_MESSAGE = "Message must be 1-500 characters.";

const chatProfanity = new Profanity({ grawlix: "***" });

export const chatMessageBodySchema = z
  .string()
  .trim()
  .min(MIN_CHAT_MESSAGE_LENGTH, CHAT_MESSAGE_LENGTH_MESSAGE)
  .max(MAX_CHAT_MESSAGE_LENGTH, CHAT_MESSAGE_LENGTH_MESSAGE);

export function censorChatMessageBody(body: string): string {
  return chatProfanity.censor(body);
}
