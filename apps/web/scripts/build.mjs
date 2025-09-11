import { execSync } from "node:child_process";

const run = (cmd) => {
  console.log(`>>> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

try {
  // Always generate the Prisma client
  run("npx prisma generate");

  const hasDb = !!(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "");

  // Only push schema if DATABASE_URL is present (so builds don't fail without a DB yet)
  if (hasDb) {
    run("npx prisma db push");
  } else {
    console.log(">>> Skipping 'prisma db push' because DATABASE_URL is not set.");
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