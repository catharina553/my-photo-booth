import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';

let ffmpegPath: string | null = null;
try {
  ffmpegPath = require('ffmpeg-static');
} catch (e) {
  console.error('Failed to load ffmpeg-static binary path:', e);
}

export function convertWebmToMp4(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error('FFmpeg binary path not found (ffmpeg-static error)'));
      return;
    }
    
    // Convert to H.264 MP4 with yuv420p pixel format for native iOS Photos/Safari compatibility
    const args = [
      '-i', inputPath,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'fast',
      '-an', // remove audio to speed up and reduce size since booth recordings are silent
      outputPath,
      '-y'
    ];

    execFile(ffmpegPath, args, (error, stdout, stderr) => {
      if (error) {
        console.error('[FFmpeg Conversion Error]', stderr);
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
