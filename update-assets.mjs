// Script to scan and update asset-manager.ts with new files
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { readFileSync } from 'fs';

async function scanFiles(dir, extensions) {
  const files = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = entry.name.split('.').pop()?.toLowerCase();
        if (extensions.includes(ext)) {
          files.push(entry.name);
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist
  }
  return files;
}

async function updateAssets() {
  try {
    console.log('🔍 Scanning for audio and video files...\n');
    
    const basePath = join(process.cwd(), 'public', 'assets');
    
    // Scan audio files
    const rainAudio = await scanFiles(join(basePath, 'audio', 'background', 'rain'), ['wav', 'mp3', 'flac', 'm4a']);
    const sleepAudio = await scanFiles(join(basePath, 'audio', 'background', 'sleep'), ['wav', 'mp3', 'flac', 'm4a']);
    const ambientAudio = await scanFiles(join(basePath, 'audio', 'background', 'ambient'), ['wav', 'mp3', 'flac', 'm4a']);
    
    // Scan video files
    const rainVideo = await scanFiles(join(basePath, 'visuals', 'backgrounds', 'rain'), ['mp4', 'mov', 'avi', 'webm']);
    const natureVideo = await scanFiles(join(basePath, 'visuals', 'backgrounds', 'nature'), ['mp4', 'mov', 'avi', 'webm']);
    const abstractVideo = await scanFiles(join(basePath, 'visuals', 'backgrounds', 'abstract'), ['mp4', 'mov', 'avi', 'webm']);
    
    const allAudio = [...rainAudio, ...sleepAudio, ...ambientAudio];
    const allVideo = [...rainVideo, ...natureVideo, ...abstractVideo];
    
    console.log(`✅ Found ${allAudio.length} audio files:`);
    if (rainAudio.length > 0) {
      console.log(`   Rain (${rainAudio.length}): ${rainAudio.join(', ')}`);
    }
    if (sleepAudio.length > 0) {
      console.log(`   Sleep (${sleepAudio.length}): ${sleepAudio.join(', ')}`);
    }
    if (ambientAudio.length > 0) {
      console.log(`   Ambient (${ambientAudio.length}): ${ambientAudio.join(', ')}`);
    }
    
    console.log(`\n✅ Found ${allVideo.length} video files:`);
    if (rainVideo.length > 0) {
      console.log(`   Rain (${rainVideo.length}): ${rainVideo.join(', ')}`);
    }
    if (natureVideo.length > 0) {
      console.log(`   Nature (${natureVideo.length}): ${natureVideo.join(', ')}`);
    }
    if (abstractVideo.length > 0) {
      console.log(`   Abstract (${abstractVideo.length}): ${abstractVideo.join(', ')}`);
    }
    
    if (allAudio.length === 0 && allVideo.length === 0) {
      console.log('\n⚠️  No assets found. Make sure files are in:');
      console.log('   - public/assets/audio/background/{rain,sleep,ambient}/');
      console.log('   - public/assets/visuals/backgrounds/{rain,nature,abstract}/');
      return;
    }
    
    // Generate code for audio assets
    const audioCode = [];
    for (const file of rainAudio) {
      const id = file.replace(/[^a-zA-Z0-9]/g, '_').replace(/\.[^.]+$/, '').toLowerCase();
      const name = file.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      audioCode.push(`  {
    id: "${id}",
    name: "${name}",
    path: "/assets/audio/background/rain/${file}",
    type: "rain",
    loopable: true,
  }`);
    }
    for (const file of sleepAudio) {
      const id = file.replace(/[^a-zA-Z0-9]/g, '_').replace(/\.[^.]+$/, '').toLowerCase();
      const name = file.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const type = file.toLowerCase().includes('white') ? 'white_noise' : 'sleep';
      audioCode.push(`  {
    id: "${id}",
    name: "${name}",
    path: "/assets/audio/background/sleep/${file}",
    type: "${type}",
    loopable: true,
  }`);
    }
    for (const file of ambientAudio) {
      const id = file.replace(/[^a-zA-Z0-9]/g, '_').replace(/\.[^.]+$/, '').toLowerCase();
      const name = file.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      audioCode.push(`  {
    id: "${id}",
    name: "${name}",
    path: "/assets/audio/background/ambient/${file}",
    type: "ambient",
    loopable: true,
  }`);
    }
    
    // Generate code for video assets
    const videoCode = [];
    for (const file of rainVideo) {
      const id = file.replace(/[^a-zA-Z0-9]/g, '_').replace(/\.[^.]+$/, '').toLowerCase();
      const name = file.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      videoCode.push(`  {
    id: "${id}",
    name: "${name}",
    path: "/assets/visuals/backgrounds/rain/${file}",
    type: "rain",
    loopable: true,
    resolution: "1080p",
  }`);
    }
    for (const file of natureVideo) {
      const id = file.replace(/[^a-zA-Z0-9]/g, '_').replace(/\.[^.]+$/, '').toLowerCase();
      const name = file.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      videoCode.push(`  {
    id: "${id}",
    name: "${name}",
    path: "/assets/visuals/backgrounds/nature/${file}",
    type: "nature",
    loopable: true,
    resolution: "1080p",
  }`);
    }
    for (const file of abstractVideo) {
      const id = file.replace(/[^a-zA-Z0-9]/g, '_').replace(/\.[^.]+$/, '').toLowerCase();
      const name = file.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      videoCode.push(`  {
    id: "${id}",
    name: "${name}",
    path: "/assets/visuals/backgrounds/abstract/${file}",
    type: "abstract",
    loopable: true,
    resolution: "1080p",
  }`);
    }
    
    console.log('\n📝 Generated code for asset-manager.ts:');
    console.log('\n// Audio Assets:');
    console.log(`export const audioAssets: AudioAsset[] = [\n${audioCode.join(',\n')}\n];`);
    console.log('\n// Video Assets:');
    console.log(`export const visualAssets: VisualAsset[] = [\n${videoCode.join(',\n')}\n];`);
    
    console.log('\n💡 Copy the code above and replace the arrays in utils/youtube/asset-manager.ts');
    
  } catch (error) {
    console.error('❌ Error scanning assets:', error);
  }
}

updateAssets();
