import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Smartphone, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';

import type { ShotOffset } from './CameraBooth';

interface ShareModalProps {
  canvas: HTMLCanvasElement;
  videoBlob: Blob | null;
  shotOffsets?: ShotOffset[];
  layout: string;
  frameColor: string;
  onReset: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ canvas, videoBlob, shotOffsets, layout, frameColor, onReset }) => {
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Fire celebration confetti
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }

    uploadCanvasToBackend();
  }, []);



  const getSlotsCoordinates = (layoutStyle: string, colorVal: string = '') => {
    if (layoutStyle === '2x6-strip-pair') {
      const ys = [3.333, 23.556, 43.778, 64.000];
      const lefts = [5.833, 57.500];
      const slots: { left: number; top: number; width: number; height: number; videoIdx: number }[] = [];
      lefts.forEach((leftX) => {
        ys.forEach((y, i) => {
          slots.push({
            left: leftX,
            top: y,
            width: 40.000,
            height: 18.889,
            videoIdx: i
          });
        });
      });
      return slots;
    } else {
      let photoW = 42.5;
      let photoH = 36.667;
      let col0 = 5.833;
      let col1 = 51.667;
      let row0 = 8.333;
      let row1 = 47.222;
      
      if (colorVal.includes('yallu_')) {
        photoW = 41.833;
        photoH = 36.556;
        col0 = 5.75;
        col1 = 52.5;
        row0 = 8.111;
        row1 = 47.278;
      } else if (colorVal.includes('mt_youth.png') || colorVal.includes('mt_priest')) {
        photoW = 42.5;
        photoH = 36.944;
        col0 = 5.417;
        col1 = 51.667;
        row0 = 7.889;
        row1 = 47.278;
      }
      return [
        { left: col0, top: row0, width: photoW, height: photoH, videoIdx: 0 },
        { left: col1, top: row0, width: photoW, height: photoH, videoIdx: 1 },
        { left: col0, top: row1, width: photoW, height: photoH, videoIdx: 2 },
        { left: col1, top: row1, width: photoW, height: photoH, videoIdx: 3 }
      ];
    }
  };

  const compileMovingPhotoVideo = (
    rawVideoBlob: Blob,
    photoCanvas: HTMLCanvasElement,
    layoutStyle: string,
    colorVal: string,
    offsets: ShotOffset[]
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      const videos = [0, 1, 2, 3].map(() => {
        const v = document.createElement('video');
        v.src = URL.createObjectURL(rawVideoBlob);
        v.muted = true;
        v.playsInline = true;
        return v;
      });

      const isImageFrame = colorVal.startsWith('data:image/') ||
                           colorVal.startsWith('http') ||
                           colorVal.includes('.png') ||
                           colorVal.startsWith('/templates/');

      let templateImg: HTMLImageElement | null = null;
      const loadOverlay = async () => {
        if (isImageFrame) {
          try {
            templateImg = new Image();
            templateImg.crossOrigin = 'anonymous';
            await new Promise((res, rej) => {
              templateImg!.onload = res;
              templateImg!.onerror = rej;
              templateImg!.src = colorVal;
            });
          } catch (e) {
            console.error("Failed to load overlay in moving compiler", e);
          }
        }
      };

      let loadedCount = 0;
      const onVideoLoaded = () => {
        loadedCount++;
        if (loadedCount === 4) {
          startCompilation();
        }
      };

      videos.forEach(v => {
        v.onloadedmetadata = onVideoLoaded;
        v.onerror = () => resolve(rawVideoBlob);
      });

      const startCompilation = async () => {
        await loadOverlay();

        const width = photoCanvas.width / 2;
        const height = photoCanvas.height / 2;

        const canvasElement = document.createElement('canvas');
        canvasElement.width = width;
        canvasElement.height = height;
        const ctx = canvasElement.getContext('2d');
        if (!ctx) {
          resolve(rawVideoBlob);
          return;
        }

        const chunks: Blob[] = [];
        let stream: MediaStream;
        try {
          stream = (canvasElement as any).captureStream(30);
        } catch (e) {
          try {
            stream = (canvasElement as any).captureStream();
          } catch (e2) {
            resolve(rawVideoBlob);
            return;
          }
        }

        let options = { mimeType: 'video/webm;codecs=vp9' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'video/webm;codecs=vp8' };
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/webm' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
              options = { mimeType: '' };
            }
          }
        }

        const recorder = new MediaRecorder(stream, options);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: 'video/webm' }));
        };

        videos.forEach((v, idx) => {
          const offset = offsets[idx] || { start: 0, end: 3 };
          v.currentTime = offset.start;
          v.play();
        });

        recorder.start(250);
        const compileStartTime = Date.now();
        const slots = getSlotsCoordinates(layoutStyle, colorVal);

        let animationFrameId: number;
        const draw = () => {
          const elapsed = (Date.now() - compileStartTime) / 1000;
          if (elapsed >= 3.0) {
            cancelAnimationFrame(animationFrameId);
            videos.forEach(v => v.pause());
            if (recorder.state !== 'inactive') {
              recorder.stop();
            }
            return;
          }

          ctx.drawImage(photoCanvas, 0, 0, width, height);

          slots.forEach((slot) => {
            const v = videos[slot.videoIdx];
            const offset = offsets[slot.videoIdx] || { start: 0, end: 3 };
            const duration = Math.max(0.5, offset.end - offset.start);
            const relativeTime = elapsed % duration;
            v.currentTime = offset.start + relativeTime;

            const px = (slot.left / 100) * width;
            const py = (slot.top / 100) * height;
            const pw = (slot.width / 100) * width;
            const ph = (slot.height / 100) * height;

            ctx.save();
            ctx.translate(px + pw, py);
            ctx.scale(-1, 1);
            ctx.drawImage(v, 0, 0, pw, ph);
            ctx.restore();
          });

          if (isImageFrame && templateImg) {
            ctx.drawImage(templateImg, 0, 0, width, height);
          }

          animationFrameId = requestAnimationFrame(draw);
        };

        draw();
      };
    });
  };

  const uploadCanvasToBackend = async (retryCount = 0) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const dataUrl = canvas.toDataURL('image/png');
      
      let movingPhotoDataUrl: string | undefined = undefined;

      if (videoBlob && shotOffsets && shotOffsets.length === 4) {
        // Compile 3s moving photo loop video (downscaled resolution)
        const compiledMovingBlob = await compileMovingPhotoVideo(videoBlob, canvas, layout, frameColor, shotOffsets);
        movingPhotoDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read compiled moving photo video'));
          reader.readAsDataURL(compiledMovingBlob);
        });
      }

      // 1. Get network discovery info
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiHost = isLocalhost ? `http://${window.location.hostname}:3001` : `${window.location.protocol}//${window.location.host}`;

      let lanIp = window.location.hostname;
      if (isLocalhost) {
        try {
          const netRes = await fetch(`${apiHost}/api/network`);
          if (netRes.ok) {
            const netData = await netRes.json();
            if (netData && netData.lanIp) {
              lanIp = netData.lanIp;
            }
          }
        } catch (e) {
          console.warn('Network discovery fallback to current host', e);
        }
      }

      // 2. Upload photo data
      const res = await fetch(`${apiHost}/api/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'BbotoBooth Session',
          imageDataUrl: dataUrl,
          movingPhotoDataUrl: movingPhotoDataUrl,
          shotOffsets: shotOffsets,
          layout: layout,
          frameColor: frameColor
        })
      });

      if (!res.ok) {
        throw new Error('Server returned upload error');
      }

      const data = await res.json();
      if (data && data.id) {
        setPhotoId(data.id);
        
        // If hosted on tunnel/public web, use the hosted URL. Otherwise, fallback to LAN IP.
        const mobileShareLink = isLocalhost
          ? `http://${lanIp}:${window.location.port || 5173}/?share=${data.id}`
          : `${window.location.protocol}//${window.location.host}/?share=${data.id}`;
        
        setShareUrl(mobileShareLink);
        setIsUploading(false);
      }
    } catch (err: any) {
      console.error(`Upload error (attempt ${retryCount + 1}):`, err);
      if (retryCount < 2) {
        console.log(`Auto-retrying upload in 1.5s... (Attempt ${retryCount + 1}/2)`);
        setTimeout(() => {
          uploadCanvasToBackend(retryCount + 1);
        }, 1500);
      } else {
        setUploadError('로컬 백엔드 서버와 연결이 원활하지 않습니다. 하지만 고해상도 직접 다운로드는 아래 버튼을 통해 가능합니다!');
        setIsUploading(false);
      }
    }
  };

  const handleDownloadImage = () => {
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      const file = new File([blob], `photo-${Date.now()}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: '뽀토부스 사진',
            text: '뽀토부스에서 촬영한 사진입니다.'
          });
          return;
        } catch (err) {
          console.log('Share canceled or failed:', err);
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `photo-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };



  const copyShareLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 28px 60px' }} className="animate-fade-in share-wrapper">
      <div className="share-modal-layout">
        {/* Left: Finished Canvas Display */}
        <div className="glass-card" style={{
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '99px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            fontWeight: 700,
            fontSize: '0.9rem',
            marginBottom: '20px',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <Sparkles size={16} /> 멋진 4컷 작품이 완성되었습니다!
          </div>

          <img
            src={canvas.toDataURL('image/png')}
            alt="Completed 4-Cut Photo"
            style={{
              maxHeight: '70vh',
              maxWidth: '100%',
              objectFit: 'contain',
              borderRadius: '16px',
              boxShadow: '0 30px 60px -15px rgba(0,0,0,0.9)'
            }}
          />
        </div>

        {/* Right Sidebar: QR Code & Print/Download */}
        <div className="glass-card no-print" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '6px' }}>공유 및 다운로드</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              스마트폰 카메라로 아래 QR 코드를 스캔하여 네컷 사진과 촬영 비디오(타임랩스)를 즉시 저장하고 확인하실 수 있습니다.
            </p>
          </div>

          {/* QR Code Card */}
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '24px',
            borderRadius: '20px',
            border: '1px solid var(--border-glass)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            {isUploading ? (
              <div style={{ padding: '40px 0' }}>
                <div className="neon-text" style={{ fontSize: '1.1rem', marginBottom: '8px' }}>모바일용 QR 링크 생성 중...</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>로컬 포토부스 서버에 연결하는 중...</p>
              </div>
            ) : uploadError ? (
              <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent-neon-pink)', lineHeight: 1.5 }}>{uploadError}</p>
                <button
                  onClick={() => uploadCanvasToBackend(0)}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem' }}
                >
                  <RefreshCw size={14} /> QR 코드 생성 재시도
                </button>
              </div>
            ) : (
              <>
                <div style={{
                  background: '#ffffff',
                  padding: '16px',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  marginBottom: '16px'
                }}>
                  <QRCodeSVG value={shareUrl} size={180} level="M" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.95rem', color: '#ffffff', marginBottom: '4px' }}>
                  <Smartphone size={18} color="var(--accent-neon-cyan)" /> 스마트폰으로 스캔하기
                </div>
                {photoId && <div style={{ fontSize: '0.75rem', color: 'var(--accent-neon-pink)', fontWeight: 700, marginBottom: '6px' }}>촬영 세션 ID: #{photoId}</div>}
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  아이폰 또는 안드로이드 카메라로 이 QR 코드를 비추면 스마트폰으로 바로 저장하실 수 있습니다.
                </p>
                <div style={{ fontSize: '0.78rem', color: 'var(--accent-neon-pink)', fontWeight: 800, marginBottom: '14px', lineHeight: 1.4 }}>
                  ⚠️ 본 페이지와 파일은 개인정보 보호 및 서버 용량 관리를 위해 즉시 스마트폰 사진첩에 다운로드하여 소장해 주시기 바랍니다. (잠시 후 자동 만료 및 완전히 삭제 처리됩니다.)
                </div>

                {/* Share Link box */}
                <div style={{
                  display: 'flex',
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  padding: '6px',
                  alignItems: 'center',
                  border: '1px solid var(--border-glass)'
                }}>
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      padding: '0 8px',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={copyShareLink}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: copied ? '#10b981' : 'var(--bg-tertiary)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {copied ? '복사 완료!' : '복사'}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <button
              onClick={handleDownloadImage}
              className="btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
            >
              <Download size={22} /> 사진 다운로드
            </button>

            <div style={{ height: '1px', background: 'var(--border-glass)', margin: '6px 0' }} />

            <button
              onClick={onReset}
              className="btn-secondary"
              style={{ width: '100%', padding: '14px', justifyContent: 'center' }}
            >
              <RefreshCw size={18} /> 새로운 포토부스 촬영 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
