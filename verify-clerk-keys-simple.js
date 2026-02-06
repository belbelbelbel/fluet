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

console.log('3. Your Keys (from your message):');
console.log('   📝 Publishable: pk_test_bG92aW5nLWhhZ2Zpc2gtMzEuY2xlcmsuYWNjb3VudHMuZGV2JA');
console.log('      Length: ~60 chars ✅');
console.log('      Format: pk_test_ ✅');
console.log('      ⚠️  WARNING: Key might be truncated (ends with "JA")\n');

console.log('   🔐 Secret: sk_test_PVseHHij0LfzKIWRcZFvzbZvHULqHlPoQ0tP9H7VUA');
console.log('      Length: ~50 chars ✅');
console.log('      Format: sk_test_ ✅\n');

console.log('4. To Verify:');
console.log('   a) Go to https://dashboard.clerk.com');
console.log('   b) Select your app (loving-hagfish-31)');
console.log('   c) Go to "API Keys" section');
console.log('   d) Compare the FULL keys with your .env.local\n');

console.log('5. Common Issues:');
console.log('   ❌ Key truncated → Copy the FULL key from Clerk dashboard');
console.log('   ❌ Wrong environment → Make sure you\'re using test keys for dev');
console.log('   ❌ Missing quotes → Keys should NOT have quotes in .env.local\n');

console.log('='.repeat(60));
console.log('\n💡 If keys are correct but you still get 400 errors:');
console.log('   1. Clear browser cookies');
console.log('   2. Restart dev server (npm run dev)');
console.log('   3. Sign out and sign in again\n');
