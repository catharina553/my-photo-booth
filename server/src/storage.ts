import fs from 'fs';
import path from 'path';
import os from 'os';

export interface PhotoRecord {
  id: string;
  title: string;
  frameColor: string;
  layout: string;
  createdAt: string;
  filename: string;
  selectedIndices?: number[];
}

export const UPLOADS_DIR = path.join(os.tmpdir(), 'bbotobooth_uploads');
const DB_FILE = path.join(UPLOADS_DIR, 'db.json');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function loadDb(): PhotoRecord[] {
  if (!fs.existsSync(DB_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function saveDb(records: PhotoRecord[]) {
  fs.writeFileSync(DB_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

export function savePhotoRecord(
  record: PhotoRecord,
  base64Data: string
): PhotoRecord {
  const records = loadDb();
  
  // Remove data:image/png;base64, prefix if present
  const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Image, 'base64');
  
  const filePath = path.join(UPLOADS_DIR, record.filename);
  fs.writeFileSync(filePath, buffer);

  records.push(record);
  saveDb(records);
  return record;
}

export function getPhotoRecord(id: string): PhotoRecord | undefined {
  const records = loadDb();
  const record = records.find(r => r.id === id);
  if (!record) return undefined;

  // Check if expired (24 hours based on short-term personal data protection guidelines)
  const now = new Date().getTime();
  const EXPIRE_MS = 24 * 60 * 60 * 1000;
  const createdTime = new Date(record.createdAt).getTime();

  if (now - createdTime > EXPIRE_MS) {
    // Silently clean up expired record & files
    const filePath = path.join(UPLOADS_DIR, record.filename);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }
    const updated = records.filter(r => r.id !== id);
    saveDb(updated);
    return undefined;
  }
  return record;
}

export function getAllPhotos(): PhotoRecord[] {
  const records = loadDb();
  const now = new Date().getTime();
  const EXPIRE_MS = 24 * 60 * 60 * 1000;
  // Return only non-expired photos
  return records
    .filter(r => now - new Date(r.createdAt).getTime() <= EXPIRE_MS)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function cleanupExpiredPhotos() {
  try {
    const records = loadDb();
    const now = new Date().getTime();
    const EXPIRE_MS = 24 * 60 * 60 * 1000;
    
    const validRecords: PhotoRecord[] = [];
    let deletedCount = 0;
    
    for (const record of records) {
      const createdTime = new Date(record.createdAt).getTime();
      if (now - createdTime > EXPIRE_MS) {
        const filePath = path.join(UPLOADS_DIR, record.filename);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) {}
        }
        deletedCount++;
      } else {
        validRecords.push(record);
      }
    }
    
    if (deletedCount > 0) {
      saveDb(validRecords);
      console.log(`🧹 [Cleanup] Automatically removed ${deletedCount} expired photos (>24h).`);
    }
  } catch (err) {
    console.error('[Cleanup Error] Failed to run photo expiration cleanup:', err);
  }
}
