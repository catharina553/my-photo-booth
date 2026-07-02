import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Load credentials from environment variable
const getDriveClient = () => {
  const serviceAccountKeyStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKeyStr) {
    console.warn('⚠️ [Google Drive] GOOGLE_SERVICE_ACCOUNT_KEY is not set. Google Drive auto-save is disabled.');
    return null;
  }

  try {
    const credentials = JSON.parse(serviceAccountKeyStr);
    const auth = new google.auth.JWT(
      credentials.client_email,
      undefined,
      credentials.private_key,
      ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']
    );
    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error('❌ [Google Drive] Failed to parse service account key:', error);
    return null;
  }
};

export async function uploadToGoogleDrive(filePath: string, filename: string): Promise<string | null> {
  const drive = getDriveClient();
  if (!drive) return null;

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    console.warn('⚠️ [Google Drive] GOOGLE_DRIVE_FOLDER_ID is not set. Saving in root folder.');
  }

  try {
    const fileMetadata: any = {
      name: filename,
    };

    if (folderId) {
      fileMetadata.parents = [folderId];
    }
    
    const media = {
      mimeType: 'image/png',
      body: fs.createReadStream(filePath)
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink'
    });

    console.log(`✅ [Google Drive] File uploaded successfully. File ID: ${response.data.id}`);
    return response.data.webViewLink || null;
  } catch (error) {
    console.error('❌ [Google Drive] Upload failed:', error);
    return null;
  }
}
