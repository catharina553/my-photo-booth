export type FrameLayout = '2x6-strip-pair' | '2x2-grid';
export type PhotoFilter = 'normal' | 'crisp' | 'grayscale' | 'warm' | 'cool';

export interface RenderConfig {
  photos: string[]; // data URLs or image URLs
  frameColor: string; // hex color or pattern name
  layout: FrameLayout;
  filter: PhotoFilter;
  footerText: string;
  dateStr: string;
}

// Map filter name to HTML5 Canvas context filter string
export function getCanvasFilterString(filter: PhotoFilter): string {
  switch (filter) {
    case 'crisp':
      return 'contrast(115%) saturate(110%) brightness(102%)';
    case 'grayscale':
      return 'grayscale(100%) contrast(120%) brightness(105%)';
    case 'warm':
      return 'sepia(30%) saturate(130%) hue-rotate(-10deg) contrast(105%)';
    case 'cool':
      return 'saturate(95%) hue-rotate(15deg) brightness(105%)';
    case 'normal':
    default:
      return 'none';
  }
}

// Load an image element from data URL
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

// Draw pattern or background on canvas
function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number, frameColor: string) {
  if (frameColor === 'checkerboard') {
    const size = 60;
    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        ctx.fillStyle = ((x / size + y / size) % 2 === 0) ? '#18181b' : '#27272a';
        ctx.fillRect(x, y, size, size);
      }
    }
  } else if (frameColor === 'y2k-silver') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#e2e8f0');
    grad.addColorStop(0.5, '#94a3b8');
    grad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = frameColor || '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
}

// Helper to determine contrasting text color (black vs white)
function getContrastingTextColor(frameColor: string): string {
  if (frameColor === 'checkerboard' || frameColor === '#000000' || frameColor === '#18181b') {
    return '#ffffff';
  }
  return '#18181b';
}

export async function renderPhotoBoothCanvas(config: RenderConfig): Promise<HTMLCanvasElement> {
  const width = 1200;  // 4 inches at 300 DPI
  const height = 1800; // 6 inches at 300 DPI

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  // 1. Draw frame background
  drawBackground(ctx, width, height, config.frameColor);

  // 2. Load all photo images
  const loadedPhotos = await Promise.all(config.photos.map(loadImage));

  const textColor = getContrastingTextColor(config.frameColor);

  if (config.layout === '2x6-strip-pair') {
    // Draw two vertical strips side by side
    // Strip width: 560px each (leaving 40px left padding, 40px gap, 40px right padding)
    const stripWidth = 540;
    const paddingX = 40;
    const gapX = 40;
    const leftX1 = paddingX;
    const leftX2 = paddingX + stripWidth + gapX;

    // Inside each strip: 4 photos stacked vertically
    // Photo dimensions in strip: width = 480px, height = 340px
    const photoW = 480;
    const photoH = 340;
    const photoGapY = 24;
    const startY = 60;

    const filterStr = getCanvasFilterString(config.filter);

    // Draw both strips
    [leftX1, leftX2].forEach((stripX) => {
      const photoStartX = stripX + (stripWidth - photoW) / 2;

      for (let i = 0; i < 4; i++) {
        const img = loadedPhotos[i] || loadedPhotos[0];
        const py = startY + i * (photoH + photoGapY);

        // Optional photo slot border/shadow
        ctx.fillStyle = '#00000010';
        ctx.fillRect(photoStartX + 4, py + 4, photoW, photoH);

        ctx.save();
        ctx.filter = filterStr;
        // Object-fit cover draw inside slot
        drawCoverImage(ctx, img, photoStartX, py, photoW, photoH);
        ctx.restore();

        // Thin border around photo slot
        ctx.strokeStyle = textColor === '#ffffff' ? '#ffffff30' : '#00000020';
        ctx.lineWidth = 2;
        ctx.strokeRect(photoStartX, py, photoW, photoH);
      }

      // Footer branding in each strip
      const footerY = startY + 4 * (photoH + photoGapY) + 30;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      
      // Brand Title
      ctx.font = 'bold 36px "Inter", "Outfit", sans-serif';
      ctx.fillText(config.footerText || '인생네컷', stripX + stripWidth / 2, footerY);

      // Date & Location stamp
      ctx.font = '500 22px "Inter", sans-serif';
      ctx.globalAlpha = 0.7;
      ctx.fillText(config.dateStr || new Date().toLocaleDateString(), stripX + stripWidth / 2, footerY + 38);
      ctx.globalAlpha = 1.0;
    });

    // Draw center cut line (scissors line)
    ctx.save();
    ctx.strokeStyle = textColor;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 2;
    ctx.setLineDash([15, 15]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 40);
    ctx.lineTo(width / 2, height - 40);
    ctx.stroke();
    ctx.restore();

  } else {
    // 2x2 Grid Layout on 4x6 Postcard
    // Header title at top
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.font = '900 56px "Inter", "Outfit", sans-serif';
    ctx.fillText(config.footerText || '인생네컷 • 스튜디오', width / 2, 100);

    // Grid of 4 cuts: 2 columns x 2 rows
    const gridW = 1060;
    const startX = (width - gridW) / 2;
    const startY = 150;

    const photoW = 510;
    const photoH = 660;
    const gapX = 40;
    const gapY = 40;

    const filterStr = getCanvasFilterString(config.filter);

    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const px = startX + col * (photoW + gapX);
      const py = startY + row * (photoH + gapY);

      const img = loadedPhotos[i] || loadedPhotos[0];

      ctx.save();
      ctx.filter = filterStr;
      drawCoverImage(ctx, img, px, py, photoW, photoH);
      ctx.restore();

      ctx.strokeStyle = textColor === '#ffffff' ? '#ffffff30' : '#00000020';
      ctx.lineWidth = 3;
      ctx.strokeRect(px, py, photoW, photoH);
    }

    // Bottom Date Stamp
    ctx.font = '600 28px "Inter", sans-serif';
    ctx.globalAlpha = 0.75;
    ctx.fillText(`촬영일시: ${config.dateStr || new Date().toLocaleDateString('ko-KR')}`, width / 2, height - 60);
    ctx.globalAlpha = 1.0;
  }

  return canvas;
}

// Draw image preserving aspect ratio (object-fit: cover) inside target box
function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;

  let sx = 0, sy = 0, sw = img.width, sh = img.height;

  if (imgRatio > boxRatio) {
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / boxRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}
