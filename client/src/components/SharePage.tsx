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
    try {
      const res = await fetch(`${apiHost}/api/photos/${photoId}`);
      if (!res.ok) {
        throw new Error('포토 세션을 찾을 수 없거나 이미 만료되었습니다.');
      }
      const data = await res.json();
      setPhotoData(data);
    } catch (err: any) {
      console.error('Failed to load shared photo', err);
      setError(err.message || '사진 상세 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const imageUrl = photoData ? (isLocalhost ? `http://${window.location.hostname}:3001/uploads/${photoData.filename}` : `${window.location.protocol}//${window.location.host}/uploads/${photoData.filename}`) : '';

  const handleDownloadMobile = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `life4cuts-${photoId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      // Fallback direct open
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
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>인생네컷 • 모바일 뷰</span>
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900 }}>오늘의 소중한 인생네컷</h1>
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center', borderRadius: '20px' }}>
          <div className="neon-text" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>고해상도 사진 로딩 중...</div>
        </div>
      ) : error || !photoData ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px', borderRadius: '20px' }}>
          <AlertCircle size={48} color="var(--accent-neon-pink)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>사진을 불러올 수 없습니다</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{error}</p>
        </div>
      ) : (
        <div className="glass-card" style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{
            width: '100%',
            overflow: 'hidden',
            borderRadius: '14px',
            marginBottom: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
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
            style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
          >
            <Download size={22} /> 스마트폰 사진첩에 저장 (고화질)
          </button>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center' }}>
            위 저장 버튼을 탭하거나 이미지를 길게 누르면 고해상도로 저장할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
};
