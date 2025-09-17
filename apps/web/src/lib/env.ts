export function hasDatabaseUrl(): boolean {
  const url = process.env.DATABASE_URL;
  return typeof url === "string" && url.trim().length > 0;
}

export function missingDatabaseMessage(): string {
  return "Database not configured. Set DATABASE_URL to enable persistent storage.";
}

export function warnIfNoDatabase(context: string): boolean {
  const ok = hasDatabaseUrl();
  if (!ok) {
    console.warn(`${context}: DATABASE_URL missing`);
  }
  return ok;
}
