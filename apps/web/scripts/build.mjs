import { execSync } from "node:child_process";

const run = (cmd) => {
  console.log(`>>> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

try {
  // Always generate the Prisma client
  run("npx prisma generate");

  // Only push schema if DATABASE_URL is present (so builds don't fail without a DB yet)
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "") {
    run("npx prisma db push");
  } else {
    console.log(">>> Skipping 'prisma db push' because DATABASE_URL is not set.");
  }

  // Next.js build
  run("npx next build");
} catch (err) {
  console.error("Build failed:", err?.message || err);
  process.exit(1);
}