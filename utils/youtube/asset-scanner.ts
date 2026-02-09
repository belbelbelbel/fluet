/**
 * Asset Scanner
 * Scans the public/assets directory for audio and video files
 * Use this to automatically detect new files you add
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export interface ScannedAsset {
  filename: string;
  path: string;
  type: 'audio' | 'video';
  category: 'rain' | 'sleep' | 'ambient' | 'nature' | 'abstract';
  format: string;
}

/**
 * Scan for audio files in a directory
 */
export async function scanAudioFiles(category: 'rain' | 'sleep' | 'ambient'): Promise<ScannedAsset[]> {
  const assets: ScannedAsset[] = [];
  const basePath = join(process.cwd(), 'public', 'assets', 'audio', 'background', category);
  
  try {
    const files = await readdir(basePath);
    
    for (const file of files) {
      const filePath = join(basePath, file);
      const stats = await stat(filePath);
      
      if (stats.isFile()) {
        const ext = file.split('.').pop()?.toLowerCase();
        if (['wav', 'mp3', 'flac', 'm4a'].includes(ext || '')) {
          assets.push({
            filename: file,
            path: `/assets/audio/background/${category}/${file}`,
            type: 'audio',
            category,
            format: ext || '',
          });
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
    console.warn(`Could not scan audio directory: ${basePath}`, error);
  }
  
  return assets;
}

/**
 * Scan for video files in a directory
 */
export async function scanVideoFiles(category: 'rain' | 'nature' | 'abstract'): Promise<ScannedAsset[]> {
  const assets: ScannedAsset[] = [];
  const basePath = join(process.cwd(), 'public', 'assets', 'visuals', 'backgrounds', category);
  
  try {
    const files = await readdir(basePath);
    
    for (const file of files) {
      const filePath = join(basePath, file);
      const stats = await stat(filePath);
      
      if (stats.isFile()) {
        const ext = file.split('.').pop()?.toLowerCase();
        if (['mp4', 'mov', 'avi', 'webm'].includes(ext || '')) {
          assets.push({
            filename: file,
            path: `/assets/visuals/backgrounds/${category}/${file}`,
            type: 'video',
            category,
            format: ext || '',
          });
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
    console.warn(`Could not scan video directory: ${basePath}`, error);
  }
  
  return assets;
}

/**
 * Scan all assets
 */
export async function scanAllAssets(): Promise<{
  audio: ScannedAsset[];
  video: ScannedAsset[];
}> {
  const [rainAudio, sleepAudio, ambientAudio, rainVideo, natureVideo, abstractVideo] = await Promise.all([
    scanAudioFiles('rain'),
    scanAudioFiles('sleep'),
    scanAudioFiles('ambient'),
    scanVideoFiles('rain'),
    scanVideoFiles('nature'),
    scanVideoFiles('abstract'),
  ]);
  
  return {
    audio: [...rainAudio, ...sleepAudio, ...ambientAudio],
    video: [...rainVideo, ...natureVideo, ...abstractVideo],
  };
}

/**
 * Generate asset manager code from scanned files
 * Use this to update asset-manager.ts when you add new files
 */
export function generateAssetCode(scanned: { audio: ScannedAsset[]; video: ScannedAsset[] }): string {
  const audioAssets = scanned.audio.map((asset, index) => {
    const id = asset.filename.replace(/[^a-zA-Z0-9]/g, '_').replace(/\.[^.]+$/, '').toLowerCase();
    const name = asset.filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const type = asset.category === 'rain' ? 'rain' : 
                 asset.category === 'sleep' ? 'sleep' : 
                 asset.category === 'ambient' ? 'ambient' : 'white_noise';
    
    return `  {
    id: "${id}",
    name: "${name}",
    path: "${asset.path}",
    type: "${type}",
    loopable: true,
  }`;
  }).join(',\n');
  
  const videoAssets = scanned.video.map((asset) => {
    const id = asset.filename.replace(/[^a-zA-Z0-9]/g, '_').replace(/\.[^.]+$/, '').toLowerCase();
    const name = asset.filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const type = asset.category;
    
    return `  {
    id: "${id}",
    name: "${name}",
    path: "${asset.path}",
    type: "${type}",
    loopable: true,
    resolution: "1080p",
  }`;
  }).join(',\n');
  
  return `export const audioAssets: AudioAsset[] = [\n${audioAssets}\n];\n\nexport const visualAssets: VisualAsset[] = [\n${videoAssets}\n];`;
}
