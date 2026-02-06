/**
 * Check .env.local file for common issues
 * Run: node check-env.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Checking .env.local Configuration\n');
console.log('='.repeat(60));

const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file does NOT exist!');
  console.log('\nCreate it with:');
  console.log('DATABASE_URL=postgresql://fluet_owner:O0mzILeGUb3x@ep-bold-sun-a52lj3ws-pooler.us-east-2.aws.neon.tech/fluet?sslmode=require&channel_binding=require');
  console.log('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...');
  console.log('CLERK_SECRET_KEY=sk_test_...');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

console.log('✅ .env.local file exists\n');

let hasDatabaseUrl = false;
let hasClerkPublishable = false;
let hasClerkSecret = false;

const issues = [];

lines.forEach((line, index) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;

  if (trimmed.startsWith('DATABASE_URL=')) {
    hasDatabaseUrl = true;
    const value = trimmed.substring('DATABASE_URL='.length);
    
    // Check for trailing quote
    if (value.endsWith("'") || value.endsWith('"')) {
      issues.push(`❌ Line ${index + 1}: DATABASE_URL has trailing quote - remove it!`);
    }
    
    // Check format
    if (!value.startsWith('postgresql://')) {
      issues.push(`⚠️  Line ${index + 1}: DATABASE_URL doesn't start with postgresql://`);
    }
    
    // Check for pooler
    if (value.includes('-pooler')) {
      console.log(`✅ Line ${index + 1}: DATABASE_URL uses pooler (good for serverless)`);
    }
    
    console.log(`✅ Line ${index + 1}: DATABASE_URL found`);
    console.log(`   Value: ${value.substring(0, 50)}...`);
  }
  
  if (trimmed.startsWith('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=')) {
    hasClerkPublishable = true;
    console.log(`✅ Line ${index + 1}: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY found`);
  }
  
  if (trimmed.startsWith('CLERK_SECRET_KEY=')) {
    hasClerkSecret = true;
    console.log(`✅ Line ${index + 1}: CLERK_SECRET_KEY found`);
  }
});

console.log('\n📋 Summary:');
console.log(`   DATABASE_URL: ${hasDatabaseUrl ? '✅ Found' : '❌ Missing'}`);
console.log(`   CLERK_PUBLISHABLE_KEY: ${hasClerkPublishable ? '✅ Found' : '❌ Missing'}`);
console.log(`   CLERK_SECRET_KEY: ${hasClerkSecret ? '✅ Found' : '❌ Missing'}`);

if (issues.length > 0) {
  console.log('\n⚠️  Issues Found:');
  issues.forEach(issue => console.log(`   ${issue}`));
}

if (!hasDatabaseUrl) {
  console.log('\n❌ DATABASE_URL is missing!');
  console.log('\nAdd this line to .env.local:');
  console.log('DATABASE_URL=postgresql://fluet_owner:O0mzILeGUb3x@ep-bold-sun-a52lj3ws-pooler.us-east-2.aws.neon.tech/fluet?sslmode=require&channel_binding=require');
}

console.log('\n' + '='.repeat(60));
console.log('\n💡 After fixing, restart your dev server: npm run dev\n');
