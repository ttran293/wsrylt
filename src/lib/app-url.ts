function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

export function getAppUrl(): string {
  const isVercel = process.env.VERCEL === "1";

  if (isVercel) {
    const deployed =
      process.env.APP_URL_DEPLOYED ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : undefined) ??
      process.env.APP_URL;

    if (!deployed) {
      throw new Error(
        "APP_URL_DEPLOYED is not configured for production.",
      );
    }

    return normalizeUrl(deployed);
  }

  const local = process.env.APP_URL_LOCAL ?? process.env.APP_URL;
  if (!local) {
    throw new Error("APP_URL_LOCAL is not configured.");
  }

  return normalizeUrl(local);
}
