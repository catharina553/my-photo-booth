import React, { useState, useEffect } from 'react';
import { Download, Camera, AlertCircle } from 'lucide-react';

interface SharePageProps {
  photoId: string;
}

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
          <div style={{
            background: 'rgba(255, 77, 128, 0.12)',
            color: 'var(--accent-neon-pink)',
            fontWeight: 800,
            fontSize: '0.88rem',
            padding: '10px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            width: '100%',
            textAlign: 'center',
            border: '1px solid rgba(255, 77, 128, 0.25)'
          }}>
            💡 이미지를 꾹 누르면 사진첩에 바로 저장돼요!
          </div>

          <div style={{
            width: '100%',
            overflow: 'hidden',
            borderRadius: '14px',
            marginBottom: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
          }}>
            <img
              src={imageUrl}
              alt="Shared 4-Cut Photo"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>

          <button
            onClick={handleDownloadMobile}
            className="btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '14px', marginBottom: '24px' }}
          >
            <Download size={22} /> 스마트폰 사진첩에 저장 (고화질)
          </button>

          {videoUrl && (
            <div style={{ width: '100%', borderTop: '1px solid var(--border-glass)', paddingTop: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>
                🎥 촬영 과정 타임랩스
              </div>
              <video
                src={videoUrl}
                controls
                playsInline
                style={{
                  width: '100%',
                  borderRadius: '14px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
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

          <div style={{ fontSize: '0.75rem', color: 'var(--accent-neon-pink)', fontWeight: 800, marginTop: '12px', textAlign: 'center', lineHeight: 1.4 }}>
            ⚠️ 본 페이지와 파일(사진/영상)은 개인정보 보호를 위해 24시간 뒤 자동으로 완전히 만료 및 삭제 처리됩니다.
          </div>
        </div>
      )}
    </div>
  );
};
