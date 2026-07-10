import React, { useState, useEffect, useRef } from 'react';
import { Download, Camera, AlertCircle } from 'lucide-react';

interface SharePageProps {
  photoId: string;
}

export interface ShotOffset {
  start: number;
  end: number;
}

const getSlotsCoordinates = (layout: string, frameColor: string = '') => {
  if (layout === '2x6-strip-pair') {
    const ys = [3.333, 23.556, 43.778, 64.000];
    const lefts = [5.833, 57.500]; // left strip, right strip
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
    // 2x2 grid layout
    let photoW = 42.5;
    let photoH = 36.667;
    let col0 = 5.833;
    let col1 = 51.667;
    let row0 = 8.333;
    let row1 = 47.222;
    
    if (frameColor.includes('yallu_')) {
      photoW = 41.833;
      photoH = 36.556;
      col0 = 5.75;
      col1 = 52.5;
      row0 = 8.111;
      row1 = 47.278;
    } else if (frameColor.includes('mt_youth.png') || frameColor.includes('mt_priest')) {
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

const VideoLoopPlayer: React.FC<{ src: string; start: number; end: number }> = ({ src, start, end }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleTimeUpdate = () => {
      if (video.currentTime >= end) {
        video.currentTime = start;
      }
    };
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.currentTime = start;
    
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn("Autoplay was prevented:", error);
      });
    }
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [src, start, end]);
  
  return (
    <video
      ref={videoRef}
      src={src}
      muted
      loop={false}
      playsInline
      autoPlay
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: 'scaleX(-1)' // Mirror to match captured photo perspective
      }}
    />
  );
};

export const SharePage: React.FC<SharePageProps> = ({ photoId }) => {
  const [photoData, setPhotoData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotoDetails();
  }, [photoId]);

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const apiHost = isLocalhost ? `http://${window.location.hostname}:3001` : `${window.location.protocol}//${window.location.host}`;

  const fetchPhotoDetails = async () => {
    setLoading(true);
    setError(null);
    
    // Set a 45-second timeout since Render free servers take up to 50 seconds to wake up from cold start
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    
    try {
      const res = await fetch(`${apiHost}/api/photos/${photoId}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error('사진 세션을 찾을 수 없거나 이미 만료되었습니다. (최대 72시간 보관)');
      }
      const data = await res.json();
      setPhotoData(data);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Failed to load shared photo:', err);
      if (err.name === 'AbortError') {
        setError('서버 응답 초과: 서버가 휴면 상태에서 깨어나는 데 시간이 더 걸리고 있습니다. 새로고침을 해주시거나 잠시만 기다려 주세요.');
      } else {
        setError(err.message || '사진 상세 정보를 불러올 수 없습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const imageUrl = photoData ? (isLocalhost ? `http://${window.location.hostname}:3001/uploads/${photoData.filename}` : `${window.location.protocol}//${window.location.host}/uploads/${photoData.filename}`) : '';
  const videoUrl = photoData && photoData.videoFilename ? (isLocalhost ? `http://${window.location.hostname}:3001/uploads/${photoData.videoFilename}` : `${window.location.protocol}//${window.location.host}/uploads/${photoData.videoFilename}`) : '';
  const movingPhotoUrl = photoData && photoData.movingPhotoFilename ? (isLocalhost ? `http://${window.location.hostname}:3001/uploads/${photoData.movingPhotoFilename}` : `${window.location.protocol}//${window.location.host}/uploads/${photoData.movingPhotoFilename}`) : '';
  const isImageFrame = photoData && (
    photoData.frameColor.startsWith('data:image/') ||
    photoData.frameColor.startsWith('http') ||
    photoData.frameColor.includes('.png') ||
    photoData.frameColor.startsWith('/templates/')
  );

  const handleDownloadVideo = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    // Extract video extension from filename
    const ext = photoData.videoFilename.split('.').pop() || 'webm';
    a.download = `timelapse-${photoId}.${ext}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadMovingPhoto = () => {
    if (!movingPhotoUrl) return;
    const a = document.createElement('a');
    a.href = movingPhotoUrl;
    const ext = photoData.movingPhotoFilename.split('.').pop() || 'webm';
    a.download = `moving-photo-${photoId}.${ext}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadMobile = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `photo-${photoId}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'BbotoBooth 사진',
            text: '오늘 찍은 4컷 사진입니다.'
          });
          return;
        } catch (err) {
          console.log('Share canceled or failed:', err);
        }
      }

      // Fallback: If Web Share API is not supported or canceled
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo-${photoId}.png`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }} className="animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 20px',
          borderRadius: '99px',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-glass)',
          marginBottom: '12px'
        }}>
          <Camera size={18} className="neon-text" />
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>뽀토부스 • 모바일 뷰</span>
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900 }}>오늘의 소중한 4컷 사진 📸</h1>
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center', borderRadius: '20px', maxWidth: '400px' }}>
          <div className="neon-text" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>고해상도 사진 로딩 중...</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '8px' }}>
            서버가 휴면 상태일 경우 깨어나는 데 최대 1분이 소요될 수 있습니다. 잠시만 기다려 주세요.
          </p>
        </div>
      ) : error || !photoData ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px', borderRadius: '20px' }}>
          <AlertCircle size={48} color="var(--accent-neon-pink)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>사진을 불러올 수 없습니다</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{error}</p>
        </div>
      ) : (
        <div className="glass-card" style={{
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '500px',
          width: '100%'
        }}>
          {/* [Section 1] Static Photo Card */}
          <div style={{ width: '100%', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📸 최종 인화용 사진 (Static)
            </h3>
            <div style={{
              width: '100%',
              overflow: 'hidden',
              borderRadius: '14px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
              background: 'var(--bg-tertiary)',
              marginBottom: '12px'
            }}>
              <img
                src={imageUrl}
                alt="Static 4-Cut Photo"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
            <button
              onClick={handleDownloadMobile}
              className="btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '14px' }}
            >
              <Download size={22} /> 스마트폰 사진첩에 저장 (고화질)
            </button>
          </div>

          {/* [Section 2] Live Moving Photo Card */}
          {videoUrl && photoData.shotOffsets && photoData.shotOffsets.length === 4 && (
            <div style={{ width: '100%', borderTop: '1px solid var(--border-glass)', paddingTop: '32px', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ✨ 움직이는 포토카드 (Live)
              </h3>
              <div style={{
                position: 'relative',
                width: '100%',
                overflow: 'hidden',
                borderRadius: '14px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                background: 'var(--bg-tertiary)',
                marginBottom: '12px'
              }}>
                <img
                  src={imageUrl}
                  alt="Live Photo Background"
                  style={{ width: '100%', height: 'auto', display: 'block', opacity: 1 }}
                />
                {getSlotsCoordinates(photoData.layout, photoData.frameColor).map((slot, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: `${slot.left}%`,
                      top: `${slot.top}%`,
                      width: `${slot.width}%`,
                      height: `${slot.height}%`,
                      overflow: 'hidden',
                      background: '#000',
                      zIndex: 1
                    }}
                  >
                    <VideoLoopPlayer
                      src={videoUrl}
                      start={photoData.shotOffsets[slot.videoIdx].start}
                      end={photoData.shotOffsets[slot.videoIdx].end}
                    />
                  </div>
                ))}
                {isImageFrame && (
                  <img
                    src={photoData.frameColor}
                    alt="Frame Template Overlay"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      zIndex: 10
                    }}
                  />
                )}
              </div>
              {movingPhotoUrl && (
                <button
                  onClick={handleDownloadMovingPhoto}
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem', borderRadius: '14px', justifyContent: 'center', marginTop: '12px' }}
                >
                  <Download size={18} /> 움직이는 포토카드 (동영상) 저장
                </button>
              )}
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4, marginTop: '10px' }}>
                💡 4개의 컷이 각자 움직이는 고유한 루프 포토카드 동영상 파일입니다.
              </p>
            </div>
          )}

          {/* [Section 3] Full Timelapse Video */}
          {videoUrl && (
            <div style={{ width: '100%', borderTop: '1px solid var(--border-glass)', paddingTop: '32px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🎥 촬영 전체 타임랩스 (아웃트로 포함)
              </h3>
              <video
                src={videoUrl}
                controls
                playsInline
                style={{
                  width: '100%',
                  borderRadius: '14px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                  background: '#000',
                  marginBottom: '12px'
                }}
              />
              <button
                onClick={handleDownloadVideo}
                className="btn-secondary"
                style={{ width: '100%', padding: '14px', fontSize: '1rem', borderRadius: '14px', justifyContent: 'center' }}
              >
                <Download size={18} /> 타임랩스 동영상 저장
              </button>
            </div>
          )}

          <div style={{ fontSize: '0.75rem', color: 'var(--accent-neon-pink)', fontWeight: 800, marginTop: '12px', textAlign: 'center', lineHeight: 1.4, borderTop: '1px solid var(--border-glass)', paddingTop: '16px', width: '100%' }}>
            ⚠️ 본 페이지와 파일(사진/영상)은 개인정보 보호를 위해 24시간 뒤 자동으로 완전히 만료 및 삭제 처리됩니다.
          </div>
        </div>
      )}
    </div>
  );
};
