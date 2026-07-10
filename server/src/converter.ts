import { execFile } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

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
