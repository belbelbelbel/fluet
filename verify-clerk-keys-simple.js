/**
 * Simple Clerk Keys Verification
 * 
 * This script checks if your Clerk keys are properly formatted.
 * 
 * To use:
 * 1. Make sure your .env.local has:
 *    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
 *    CLERK_SECRET_KEY=sk_test_...
 * 
 * 2. Run: node verify-clerk-keys-simple.js
 * 
 * OR manually check:
 * - Publishable key should start with: pk_test_ or pk_live_
 * - Secret key should start with: sk_test_ or sk_live_
 * - Both should be 50+ characters long
 */

console.log('\n🔍 Clerk Keys Format Verification\n');
console.log('='.repeat(60));
console.log('\n📋 Manual Verification Steps:\n');

console.log('1. Check your .env.local file contains:');
console.log('   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...');
console.log('   CLERK_SECRET_KEY=sk_test_...\n');

console.log('2. Format Requirements:');
console.log('   ✅ Publishable Key: Must start with "pk_test_" or "pk_live_"');
console.log('   ✅ Secret Key: Must start with "sk_test_" or "sk_live_"');
console.log('   ✅ Both keys should be 50+ characters long\n');

console.log('3. Verify keys in Clerk Dashboard:');
console.log('   a) Go to https://dashboard.clerk.com');
console.log('   b) Select your application');
console.log('   c) Go to "API Keys" section');
console.log('   d) Compare the FULL keys with your .env.local\n');
console.log('   ❌ Key truncated → Copy the FULL key from Clerk dashboard');
console.log('   ❌ Wrong environment → Make sure you\'re using test keys for dev');
console.log('   ❌ Missing quotes → Keys should NOT have quotes in .env.local\n');

console.log('='.repeat(60));
console.log('\n💡 If keys are correct but you still get 400 errors:');
console.log('   1. Clear browser cookies');
console.log('   2. Restart dev server (npm run dev)');
console.log('   3. Sign out and sign in again\n');
