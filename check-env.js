/**
 * Check env files for common issues
 * Run: node check-env.js
 */

const fs = require("fs");
const path = require("path");

console.log("\n🔍 Checking Environment Configuration\n");
console.log("=".repeat(60));

const envLocalPath = path.join(__dirname, ".env.local");
const envPath = path.join(__dirname, ".env");
const activeEnvPath = fs.existsSync(envLocalPath)
  ? envLocalPath
  : fs.existsSync(envPath)
    ? envPath
    : null;

if (!activeEnvPath) {
  console.log("❌ No .env or .env.local file found!");
  console.log("\nCreate .env.local (recommended) or .env with:");
  console.log("DATABASE_URL=postgresql://user:password@host/database?sslmode=require");
  console.log("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...");
  console.log("CLERK_SECRET_KEY=sk_test_...");
  console.log("\nSee .env.example for the full list of supported variables.");
  process.exit(1);
}

console.log(`✅ Using ${path.basename(activeEnvPath)}\n`);

const envContent = fs.readFileSync(activeEnvPath, "utf8");
const lines = envContent.split("\n");

let hasDatabaseUrl = false;
let hasClerkPublishable = false;
let hasClerkSecret = false;

const issues = [];

lines.forEach((line, index) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;

  if (trimmed.startsWith("DATABASE_URL=")) {
    hasDatabaseUrl = true;
    const value = trimmed.substring("DATABASE_URL=".length);

    if (value.endsWith("'") || value.endsWith('"')) {
      issues.push(`❌ Line ${index + 1}: DATABASE_URL has trailing quote - remove it!`);
    }

    if (!value.startsWith("postgresql://")) {
      issues.push(`⚠️  Line ${index + 1}: DATABASE_URL doesn't start with postgresql://`);
    }

    if (value.includes("-pooler")) {
      console.log(`✅ Line ${index + 1}: DATABASE_URL uses pooler (good for serverless)`);
    }

    console.log(`✅ Line ${index + 1}: DATABASE_URL found`);
    console.log(`   Value: ${value.substring(0, 30)}...`);
  }

  if (trimmed.startsWith("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=")) {
    hasClerkPublishable = true;
    console.log(`✅ Line ${index + 1}: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY found`);
  }

  if (trimmed.startsWith("CLERK_SECRET_KEY=")) {
    hasClerkSecret = true;
    console.log(`✅ Line ${index + 1}: CLERK_SECRET_KEY found`);
  }
});

console.log("\n📋 Summary:");
console.log(`   DATABASE_URL: ${hasDatabaseUrl ? "✅ Found" : "❌ Missing"}`);
console.log(`   CLERK_PUBLISHABLE_KEY: ${hasClerkPublishable ? "✅ Found" : "❌ Missing"}`);
console.log(`   CLERK_SECRET_KEY: ${hasClerkSecret ? "✅ Found" : "❌ Missing"}`);

if (issues.length > 0) {
  console.log("\n⚠️  Issues Found:");
  issues.forEach((issue) => console.log(`   ${issue}`));
}

if (!hasDatabaseUrl) {
  console.log("\n❌ DATABASE_URL is missing!");
  console.log("\nAdd this line to your env file:");
  console.log("DATABASE_URL=postgresql://user:password@host/database?sslmode=require");
}

console.log("\n" + "=".repeat(60));
console.log("\n💡 After fixing, restart your dev server: npm run dev\n");
