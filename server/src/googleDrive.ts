import crypto from 'crypto';
import fs from 'fs';

// Function to sign JWT natively in Node
function signJwt(email: string, privateKey: string): string {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const base64UrlEncode = (str: string) => {
    return Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const input = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(input);
  const signature = signer.sign(privateKey, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${input}.${signature}`;
}

async function getAccessToken(email: string, privateKey: string): Promise<string> {
  const jwt = signJwt(email, privateKey);
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to get OAuth token: ${response.statusText} - ${errText}`);
  }

  const data: any = await response.json();
  return data.access_token;
}

export async function uploadToGoogleDrive(filePath: string, filename: string): Promise<string | null> {
  const serviceAccountKeyStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKeyStr) {
    console.warn('⚠️ [Google Drive] GOOGLE_SERVICE_ACCOUNT_KEY is not set. Google Drive auto-save is disabled.');
    return null;
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    console.warn('⚠️ [Google Drive] GOOGLE_DRIVE_FOLDER_ID is not set. Saving in root folder.');
  }

  try {
    const credentials = JSON.parse(serviceAccountKeyStr);
    const accessToken = await getAccessToken(credentials.client_email, credentials.private_key);

    const boundary = 'xx_bbotobooth_boundary_xx';
    const metadata: any = {
      name: filename
    };
    if (folderId) {
      metadata.parents = [folderId];
    }

    const metadataPart = [
      `--${boundary}\r\n`,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      '\r\n'
    ].join('');

    const mediaHeader = [
      `--${boundary}\r\n`,
      'Content-Type: image/png\r\n\r\n'
    ].join('');

    const mediaFooter = `\r\n--${boundary}--\r\n`;

    const fileBuffer = fs.readFileSync(filePath);
    
    // Concatenate all parts into a single buffer
    const bodyBuffer = Buffer.concat([
      Buffer.from(metadataPart, 'utf8'),
      Buffer.from(mediaHeader, 'utf8'),
      fileBuffer,
      Buffer.from(mediaFooter, 'utf8')
    ]);

    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': String(bodyBuffer.length)
      },
      body: bodyBuffer
    });

    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text();
      throw new Error(`Drive upload failed: ${uploadResponse.statusText} - ${errText}`);
    }

    const resData: any = await uploadResponse.json();
    console.log(`✅ [Google Drive] File uploaded successfully. File ID: ${resData.id}`);
    return resData.webViewLink || null;
  } catch (error) {
    console.error('❌ [Google Drive] Upload failed:', error);
    return null;
  }
}
