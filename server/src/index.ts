import express from 'express';
import cors from 'cors';
import path from 'path';
import { router } from './routes';
import { getPhotoRecord } from './storage';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Intercept KakaoTalk and other social bots to serve dynamic Open Graph tags
app.use((req, res, next) => {
  const shareId = req.query.share as string;
  const ua = req.headers['user-agent'] || '';
  
  // Detect search engine & messenger scrapers (KakaoTalk, Slack, Twitter, Facebook etc)
  const isBot = /facebookexternalhit|kakaotalk|kakaotalk-scrap|slackbot|twitterbot|scrap|bot/i.test(ua);
  
  if (shareId && isBot) {
    const record = getPhotoRecord(shareId);
    if (record) {
      const scheme = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const host = req.headers.host;
      const imageUrl = `${scheme}://${host}/uploads/${record.filename}`;
      const pageUrl = `${scheme}://${host}/?share=${shareId}`;

      // Return a minimal HTML page with specific Open Graph tags for KakaoTalk preview!
      return res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>인생네컷(made by catharina)</title>
  <meta name="description" content="인생네컷(made by catharina)에서 촬영한 오늘의 사진이 도착했습니다! 지금 확인해 보세요." />
  
  <meta property="og:type" content="website" />
  <meta property="og:title" content="인생네컷(made by catharina) • 오늘의 네컷 사진 📸" />
  <meta property="og:description" content="인생네컷(made by catharina)에서 촬영한 오늘의 네컷 사진을 확인하세요." />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:site_name" content="인생네컷(made by catharina)" />
  
  <!-- KakaoTalk specific tags -->
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="1800" />
</head>
<body>
  <p>사진 로딩 중...</p>
</body>
</html>`);
    }
  }
  next();
});

// Serve stored photos statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api', router);

// Serve frontend build if available
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

// Fallback to index.html for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Not Found');
    }
  });
});

app.listen(PORT, () => {
  console.log(`📸 Photo Booth Backend Server running on port ${PORT}`);
  console.log(`   Local API: http://localhost:${PORT}/api`);
});
