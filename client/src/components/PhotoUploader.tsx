import React, { useState, useRef } from 'react';
import { Upload, X, ArrowLeft, Check } from 'lucide-react';

interface PhotoUploaderProps {
  onBack: () => void;
  onFinish: (photos: string[]) => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onBack, onFinish }) => {
  // Array of 4 slots. Each slot is either a dataUrl string or null.
  const [uploadedPhotos, setUploadedPhotos] = useState<(string | null)[]>([null, null, null, null]);
  const fileInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size or type if necessary, but keep it simple
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedPhotos(prev => {
        const next = [...prev];
        next[index] = dataUrl;
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedPhotos(prev => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    if (fileInputRefs[index].current) {
      fileInputRefs[index].current!.value = '';
    }
  };

  const triggerUpload = (index: number) => {
    fileInputRefs[index].current?.click();
  };

  const allFilled = uploadedPhotos.every(p => p !== null);

  const handleProceed = () => {
    if (!allFilled) return;
    onFinish(uploadedPhotos as string[]);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 40px' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '12px' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>📁 내 사진 업로드</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            컴퓨터나 스마트폰에 저장된 사진 4장을 업로드해 주세요.
          </p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', textAlign: 'center' }}>
        {/* Upload Slots Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          maxWidth: '500px',
          margin: '0 auto 32px'
        }}>
          {uploadedPhotos.map((photo, idx) => (
            <div
              key={idx}
              onClick={() => triggerUpload(idx)}
              style={{
                position: 'relative',
                aspectRatio: '3/4',
                borderRadius: '16px',
                border: photo ? 'none' : '2px dashed var(--border-glass)',
                background: 'var(--bg-tertiary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: photo ? '0 10px 20px rgba(0,0,0,0.06)' : 'none'
              }}
              className={!photo ? 'hover-scale' : ''}
            >
              <input
                type="file"
                ref={fileInputRefs[idx]}
                onChange={(e) => handleFileChange(idx, e)}
                accept="image/*"
                style={{ display: 'none' }}
              />

              {photo ? (
                <>
                  <img
                    src={photo}
                    alt={`Uploaded Slot ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    onClick={(e) => removePhoto(idx, e)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      cursor: 'pointer',
                      zIndex: 5,
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.8)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}
                  >
                    <X size={16} />
                  </button>
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    background: 'rgba(16, 185, 129, 0.95)',
                    color: '#fff',
                    borderRadius: '20px',
                    padding: '3px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Check size={12} /> {idx + 1}번째 컷
                  </div>
                </>
              ) : (
                <div style={{ padding: '20px', pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(255, 77, 128, 0.08)',
                    color: 'var(--accent-neon-pink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Upload size={20} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {idx + 1}번째 사진 선택
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleProceed}
          disabled={!allFilled}
          className="btn-primary"
          style={{
            maxWidth: '320px',
            width: '100%',
            padding: '16px',
            fontSize: '1.1rem',
            borderRadius: '14px',
            margin: '0 auto',
            opacity: allFilled ? 1 : 0.5,
            cursor: allFilled ? 'pointer' : 'not-allowed'
          }}
        >
          🎨 프레임 합성 및 편집하러 가기
        </button>
      </div>
    </div>
  );
};
