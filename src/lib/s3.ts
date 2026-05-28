import crypto from "node:crypto";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export const AVATAR_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AvatarContentType = (typeof AVATAR_CONTENT_TYPES)[number];

const extensionByContentType: Record<AvatarContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for avatar uploads.`);
  }
  return value;
}

function getS3Client() {
  return new S3Client({
    region: requiredEnv("AWS_REGION"),
    credentials: {
      accessKeyId: requiredEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("AWS_SECRET_ACCESS_KEY"),
    },
  });
}

export function isAvatarContentType(value: string): value is AvatarContentType {
  return AVATAR_CONTENT_TYPES.includes(value as AvatarContentType);
}

export function getAvatarPublicUrl(key: string) {
  const publicUrl = requiredEnv("AWS_S3_PUBLIC_URL").replace(/\/$/, "");
  return `${publicUrl}/${key}`;
}

export function createAvatarKey(userId: string, contentType: AvatarContentType) {
  const extension = extensionByContentType[contentType];
  return `avatars/${userId}/${crypto.randomUUID()}.${extension}`;
}

export async function createAvatarUploadPost({
  key,
  contentType,
}: {
  key: string;
  contentType: AvatarContentType;
}) {
  return createPresignedPost(getS3Client(), {
    Bucket: requiredEnv("AWS_S3_BUCKET"),
    Key: key,
    Conditions: [
      ["content-length-range", 1, AVATAR_MAX_BYTES],
      ["eq", "$Content-Type", contentType],
    ],
    Fields: {
      "Content-Type": contentType,
    },
    Expires: 60,
  });
}

export async function deleteS3Object(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: requiredEnv("AWS_S3_BUCKET"),
    Key: key,
  });

  await getS3Client().send(command);
}
