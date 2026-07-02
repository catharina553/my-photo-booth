import { Router, Request, Response } from 'express';
import os from 'os';
import crypto from 'crypto';
import { savePhotoRecord, getPhotoRecord, getAllPhotos } from './storage';

export const router = Router();

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
router.post('/photos', (req: Request, res: Response): void => {
  try {
    const { title = 'Life4Cuts Session', frameColor = '#ffffff', layout = '2x6-strip-pair', imageDataUrl } = req.body;
    
    if (!imageDataUrl) {
      res.status(400).json({ error: 'imageDataUrl is required' });
      return;
    }
    
    const id = crypto.randomBytes(6).toString('hex');
    const filename = `photo-${id}.png`;
    const createdAt = new Date().toISOString();
    
    const record = savePhotoRecord({
      id,
      title,
      frameColor,
      layout,
      createdAt,
      filename
    }, imageDataUrl);
    
    res.status(201).json({
      success: true,
      id: record.id,
      record
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
