import { Router, Request, Response } from 'express';
import os from 'os';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { savePhotoRecord, getPhotoRecord, getAllPhotos, UPLOADS_DIR } from './storage';
import { uploadToGoogleDrive } from './googleDrive';

export const router = Router();

router.get('/debug-paths', (req: Request, res: Response) => {
  try {
    const results: any = {};
    results.dirname = __dirname;
    results.cwd = process.cwd();
    results.rootExists = fs.existsSync(path.join(__dirname, '../../'));
    results.clientExists = fs.existsSync(path.join(__dirname, '../../client'));
    if (results.clientExists) {
      results.clientFiles = fs.readdirSync(path.join(__dirname, '../../client'));
    }
    results.distExists = fs.existsSync(path.join(__dirname, '../../client/dist'));
    if (results.distExists) {
      results.distFiles = fs.readdirSync(path.join(__dirname, '../../client/dist'));
    }
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get LAN IP address for QR code generation
router.get('/network', (req: Request, res: Response) => {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  
  const lanIp = addresses[0] || 'localhost';
  const port = process.env.PORT || 3001;
  
  res.json({
    lanIp,
    addresses,
    port,
    baseUrl: `http://${lanIp}:5173` // Default Vite dev port or build port
  });
});

// Upload a new 4-cut photo
router.post('/photos', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title = 'BbotoBooth Session', frameColor = '#ffffff', layout = '2x6-strip-pair', imageDataUrl, videoDataUrl, selectedIndices, shotOffsets } = req.body;
    
    if (!imageDataUrl) {
      res.status(400).json({ error: 'imageDataUrl is required' });
      return;
    }
    
    const id = crypto.randomBytes(6).toString('hex');
    const filename = `photo-${id}.png`;
    const createdAt = new Date().toISOString();
    
    const isMp4 = videoDataUrl && videoDataUrl.startsWith('data:video/mp4');
    const videoExt = isMp4 ? 'mp4' : 'webm';
    const videoFilename = videoDataUrl ? `video-${id}.${videoExt}` : undefined;

    const record = savePhotoRecord({
      id,
      title,
      frameColor,
      layout,
      createdAt,
      filename,
      videoFilename,
      selectedIndices,
      shotOffsets
    }, imageDataUrl, videoDataUrl);

    // Upload photo to Google Drive
    const localFilePath = path.join(UPLOADS_DIR, filename);
    let driveLink: string | null = null;
    try {
      driveLink = await uploadToGoogleDrive(localFilePath, filename);
      if (driveLink) {
        console.log(`🔗 [Google Drive] Photo successfully auto-saved to cloud: ${driveLink}`);
      } else {
        throw new Error('uploadToGoogleDrive returned null (failed internally, check Google Drive logs)');
      }
    } catch (driveErr: any) {
      console.error("====== 구글 드라이브 사진 업로드 에러 ======");
      console.error(driveErr.message || driveErr);
      console.error("=========================================");
    }

    // Upload video to Google Drive (if present)
    let videoDriveLink: string | null = null;
    if (videoDataUrl && videoFilename) {
      const localVideoPath = path.join(UPLOADS_DIR, videoFilename);
      try {
        videoDriveLink = await uploadToGoogleDrive(localVideoPath, videoFilename);
        if (videoDriveLink) {
          // Mutate the local memory record to include drive links
          record.videoDriveLink = videoDriveLink;
          
          // Re-save database to persist the videoDriveLink
          const { getAllPhotos, savePhotoRecord } = require('./storage');
          // Wait, we can just save it. Since getPhotoRecord reads from DB file, we should update the DB file!
          const fs = require('fs');
          const dbPath = path.join(UPLOADS_DIR, 'db.json');
          if (fs.existsSync(dbPath)) {
            const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            const rec = dbData.find((r: any) => r.id === id);
            if (rec) {
              rec.videoDriveLink = videoDriveLink;
              fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
            }
          }
          console.log(`🔗 [Google Drive] Video successfully auto-saved to cloud: ${videoDriveLink}`);
        }
      } catch (driveErr: any) {
        console.error("====== 구글 드라이브 비디오 업로드 에러 ======");
        console.error(driveErr.message || driveErr);
        console.error("=========================================");
      }
    }
    
    res.status(201).json({
      success: true,
      id: record.id,
      record,
      driveLink,
      videoDriveLink
    });
  } catch (error: any) {
    console.error('Upload failed:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Get photo metadata by ID
router.get('/photos/:id', (req: Request, res: Response): void => {
  const idParam = req.params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const record = getPhotoRecord(id || '');
  if (!record) {
    res.status(404).json({ error: 'Photo not found' });
    return;
  }
  res.json(record);
});

// Get all recent booth photos
router.get('/photos', (req: Request, res: Response) => {
  res.json(getAllPhotos());
});
