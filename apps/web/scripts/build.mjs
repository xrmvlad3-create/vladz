import { execSync } from "node:child_process";

const run = (cmd) => {
  console.log(`>>> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

try {
  // Always generate the Prisma client
  run("npx prisma generate");

  const hasDb = !!(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "");
  const shouldPush =
    hasDb &&
    (process.env.PRISMA_DB_PUSH === "1" || `${process.env.PRISMA_DB_PUSH}`.toLowerCase() === "true");

  // Only push schema if explicitly allowed.
  // This avoids failing Vercel builds when the DB is present but extensions/permissions are not.
  if (shouldPush) {
    try {
      run("npx prisma db push");
    } catch (e) {
      console.warn(">>> Warning: 'prisma db push' failed, continuing build.", e?.message || e);
    }
  } else {
    console.log(">>> Skipping 'prisma db push' (set PRISMA_DB_PUSH=1 to enable).");
  }

  // Optionally seed the DB during build if explicitly requested
  // Set RUN_SEED=1 as a one-time env var in Vercel to run seeding on this build.
  if (hasDb && (process.env.RUN_SEED === "1" || `${process.env.RUN_SEED}`.toLowerCase() === "true")) {
    run("npx prisma db seed");
  } else {
    console.log(">>> Skipping 'prisma db seed' (set RUN_SEED=1 to enable).");
  }

  // Next.js build
  run("npx next build");
} catch (err) {
  console.error("Build failed:", err?.message || err);
  process.exit(1);
}