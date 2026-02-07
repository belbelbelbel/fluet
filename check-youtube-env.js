/**
 * Quick script to check if YouTube credentials are set in .env.local
 * Run: node check-youtube-env.js
 */

require('dotenv').config({ path: '.env.local' });

const clientId = process.env.YOUTUBE_CLIENT_ID;
const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';

console.log('\n📋 YouTube Credentials Check\n');
console.log('='.repeat(50));

if (clientId) {
  console.log('✅ YOUTUBE_CLIENT_ID: Set');
  console.log(`   Value: ${clientId.substring(0, 20)}...${clientId.substring(clientId.length - 10)}`);
} else {
  console.log('❌ YOUTUBE_CLIENT_ID: NOT SET');
  console.log('   Add: YOUTUBE_CLIENT_ID=your_client_id_here');
}

console.log('');

if (clientSecret) {
  console.log('✅ YOUTUBE_CLIENT_SECRET: Set');
  console.log(`   Value: ${clientSecret.substring(0, 10)}...${clientSecret.substring(clientSecret.length - 5)}`);
} else {
  console.log('❌ YOUTUBE_CLIENT_SECRET: NOT SET');
  console.log('   Add: YOUTUBE_CLIENT_SECRET=your_client_secret_here');
}

console.log('');

console.log(`📌 YOUTUBE_REDIRECT_URI: ${redirectUri}`);
console.log('');

if (clientId && clientSecret) {
  console.log('✅ All YouTube credentials are configured!');
  console.log('   Restart your dev server if you just added these.');
} else {
  console.log('❌ Missing YouTube credentials.');
  console.log('\n📝 To add them:');
  console.log('   1. Open .env.local in your project root');
  console.log('   2. Add these lines:');
  console.log('      YOUTUBE_CLIENT_ID=your_client_id_here');
  console.log('      YOUTUBE_CLIENT_SECRET=your_client_secret_here');
  console.log('      YOUTUBE_REDIRECT_URI=http://localhost:3000/oauth2callback');
  console.log('   3. Replace with your actual credentials from Google Cloud Console');
  console.log('   4. Restart your dev server');
}

console.log('\n' + '='.repeat(50) + '\n');
