import fs from 'fs';
import path from 'path';

export interface PhotoRecord {
  id: string;
  title: string;
  frameColor: string;
  layout: string;
  createdAt: string;
  filename: string;
}

const UPLOADS_DIR = path.join(__dirname, '../uploads');
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

export function savePhotoRecord(record: PhotoRecord, base64Data: string): PhotoRecord {
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
  return records.find(r => r.id === id);
}

export function getAllPhotos(): PhotoRecord[] {
  return loadDb().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
