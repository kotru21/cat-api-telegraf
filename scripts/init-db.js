import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";
const PRISMA_DIR = path.join(process.cwd(), "prisma");
const SCHEMA_PATH = path.join(PRISMA_DIR, "schema.prisma");

console.log(`Initializing database for environment: ${NODE_ENV}`);

let sourceSchema;

if (NODE_ENV === "production") {
  sourceSchema = path.join(PRISMA_DIR, "schema.postgres.prisma");
} else {
  sourceSchema = path.join(PRISMA_DIR, "schema.sqlite.prisma");
}

if (!fs.existsSync(sourceSchema)) {
  console.error(`Source schema not found: ${sourceSchema}`);
  process.exit(1);
}

console.log(`Copying ${path.basename(sourceSchema)} to schema.prisma...`);
fs.copyFileSync(sourceSchema, SCHEMA_PATH);

console.log("Running prisma generate...");
try {
  execSync("bunx prisma generate", { stdio: "inherit" });
} catch (error) {
  console.error("Failed to run prisma generate");
  process.exit(1);
}

console.log("Database initialization complete.");
