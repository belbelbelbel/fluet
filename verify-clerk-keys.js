/**
 * Quick script to verify Clerk keys format
 * Run: node verify-clerk-keys.js
 */

// Load .env.local file
const fs = require('fs');
const path = require('path');

// Try to load .env.local manually
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');
        process.env[key.trim()] = cleanValue;
      }
    }
  });
}

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const secretKey = process.env.CLERK_SECRET_KEY || '';

console.log('\n🔍 Clerk Keys Verification\n');
console.log('='.repeat(50));

// Check Publishable Key
console.log('\n📝 Publishable Key:');
console.log(`   Length: ${publishableKey.length} characters`);
console.log(`   Starts with: ${publishableKey.substring(0, 7)}`);
console.log(`   Format check: ${publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_') ? '✅ Correct' : '❌ Wrong format'}`);
console.log(`   Full key: ${publishableKey.substring(0, 20)}...${publishableKey.substring(publishableKey.length - 10)}`);

// Check Secret Key
console.log('\n🔐 Secret Key:');
console.log(`   Length: ${secretKey.length} characters`);
console.log(`   Starts with: ${secretKey.substring(0, 7)}`);
console.log(`   Format check: ${secretKey.startsWith('sk_test_') || secretKey.startsWith('sk_live_') ? '✅ Correct' : '❌ Wrong format'}`);
console.log(`   Full key: ${secretKey.substring(0, 20)}...${secretKey.substring(secretKey.length - 10)}`);

// Validation
console.log('\n✅ Validation:');
const issues = [];

if (!publishableKey) {
  issues.push('❌ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing');
} else if (publishableKey.length < 50) {
  issues.push('⚠️  Publishable key seems too short (might be truncated)');
}

if (!secretKey) {
  issues.push('❌ CLERK_SECRET_KEY is missing');
} else if (secretKey.length < 50) {
  issues.push('⚠️  Secret key seems too short (might be truncated)');
}

if (issues.length === 0) {
  console.log('✅ Both keys are present and formatted correctly');
  console.log('\n💡 To fully verify, check your Clerk Dashboard:');
  console.log('   1. Go to https://dashboard.clerk.com');
  console.log('   2. Select your application');
  console.log('   3. Go to "API Keys" section');
  console.log('   4. Compare the keys shown there with your .env.local');
} else {
  console.log(issues.join('\n'));
}

console.log('\n' + '='.repeat(50) + '\n');
