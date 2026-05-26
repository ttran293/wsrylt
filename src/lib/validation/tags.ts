import { z } from "zod";

export const MAX_TAGS = 5;
export const MAX_TAG_LENGTH = 30;

const TAG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeTag(raw: string): string | null {
  let tag = raw.trim().toLowerCase();
  if (!tag) return null;

  if (tag.startsWith("#")) {
    tag = tag.slice(1);
  }

  tag = tag.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  tag = tag.replace(/-+/g, "-").replace(/^-|-$/g, "");

  if (tag.length < 2 || tag.length > MAX_TAG_LENGTH) {
    return null;
  }

  if (!TAG_PATTERN.test(tag)) {
    return null;
  }

  return tag;
}

export function normalizeTags(input: unknown): string[] {
  const rawTags = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(",")
      : [];

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const raw of rawTags) {
    if (typeof raw !== "string") continue;

    const tag = normalizeTag(raw);
    if (!tag || seen.has(tag)) continue;

    seen.add(tag);
    tags.push(tag);

    if (tags.length >= MAX_TAGS) break;
  }

  return tags;
}

export const tagsSchema = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .transform((value) => normalizeTags(value ?? []));

export const tagFilterSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    const tag = normalizeTag(value);
    return tag ?? undefined;
  });
