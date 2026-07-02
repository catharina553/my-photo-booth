import React, { useState, useEffect, useRef } from 'react';
import { Palette, Layout, Sliders, Type, ArrowLeft, QrCode, Sparkles, Upload } from 'lucide-react';
import type { FrameLayout, PhotoFilter, RenderConfig } from '../utils/canvasRenderer';
import { renderPhotoBoothCanvas } from '../utils/canvasRenderer';

interface PhotoEditorProps {
  photos: string[];
  onBack: () => void;
  onFinish: (canvas: HTMLCanvasElement, config: RenderConfig) => void;
}

const FRAME_COLORS = [
  { name: '퓨어 화이트', value: '#ffffff' },
  { name: '스튜디오 블랙', value: '#18181b' },
  { name: '베이비 핑크', value: '#fbcfe8' },
  { name: '스카이 블루', value: '#bae6fd' },
  { name: '라벤더', value: '#e9d5ff' },
  { name: '민트 글로우', value: '#a7f3d0' },
  { name: '체커보드', value: 'checkerboard' },
  { name: 'Y2K 실버', value: 'y2k-silver' },
];

const FILTERS: { name: string; id: PhotoFilter }[] = [
  { name: '오리지널', id: 'normal' },
  { name: '스튜디오 Crisp', id: 'crisp' },
  { name: '흑백 빈티지', id: 'grayscale' },
  { name: '따뜻한 Sunset', id: 'warm' },
  { name: '시원한 안개', id: 'cool' },
];

export const PhotoEditor: React.FC<PhotoEditorProps> = ({ photos, onBack, onFinish }) => {
  const [layout, setLayout] = useState<FrameLayout>('2x6-strip-pair');
  const [frameColor, setFrameColor] = useState<string>('#ffffff');
  const [filter, setFilter] = useState<PhotoFilter>('normal');
  const [footerText, setFooterText] = useState<string>('인생네컷 • 스튜디오');
  const [dateStr] = useState<string>(new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }));
  const [customFrameName, setCustomFrameName] = useState<string | null>(null);

  const handleCustomFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFrameColor(event.target.result as string);
        setCustomFrameName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const currentCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(true);

  useEffect(() => {
    updateCanvas();
  }, [layout, frameColor, filter, footerText, photos]);

  const updateCanvas = async () => {
    setIsRendering(true);
    try {
      const config: RenderConfig = {
        photos,
        frameColor,
        layout,
        filter,
        footerText,
        dateStr
      };
      const canvas = await renderPhotoBoothCanvas(config);
      currentCanvasRef.current = canvas;

      if (canvasContainerRef.current) {
        canvasContainerRef.current.innerHTML = '';
        // Set CSS styles so the 1200x1800 high-res canvas scales nicely in view
        canvas.style.maxHeight = '72vh';
        canvas.style.maxWidth = '100%';
        canvas.style.objectFit = 'contain';
        canvas.style.borderRadius = '14px';
        canvas.style.boxShadow = '0 25px 50px -12px rgba(0,0,0,0.8)';
        canvasContainerRef.current.appendChild(canvas);
      }
    } catch (e) {
      console.error('Failed to render preview canvas', e);
    } finally {
      setIsRendering(false);
    }
  };

  const handleProceed = () => {
    if (!currentCanvasRef.current) return;
    onFinish(currentCanvasRef.current, {
      photos,
      frameColor,
      layout,
      filter,
      footerText,
      dateStr
    });
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 28px 40px' }} className="animate-fade-in editor-wrapper">
      <div className="photo-editor-layout">
        {/* Left: High-Res Canvas Preview Area */}
        <div className="glass-card" style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '650px',
          position: 'relative'
        }}>
          {isRendering && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(10,10,12,0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              borderRadius: '20px'
            }}>
              <span className="neon-text" style={{ fontSize: '1.2rem' }}>300 DPI 고해상도 이미지 생성 중...</span>
            </div>
          )}

          <div 
            ref={canvasContainerRef}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%'
            }}
          />

          <div style={{
            marginTop: '16px',
            fontSize: '0.8rem',
            color: 'var(--text-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Sparkles size={14} color="var(--accent-neon-cyan)" />
            <span>300 DPI 고해상도 출력 지원 (1200 × 1800 px) • 정확한 4×6 인쇄 비율</span>
          </div>
        </div>

        {/* Right Sidebar Controls */}
        <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>프레임 설정</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              인쇄용 이미지 및 QR 코드를 만들기 전에 프레임 스타일을 꾸며보세요.
            </p>
          </div>

          {/* 1. Layout Selector */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-muted)' }}>
              <Layout size={18} color="var(--accent-neon-cyan)" /> 프레임 레이아웃
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => setLayout('2x6-strip-pair')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: layout === '2x6-strip-pair' ? '2px solid var(--accent-neon-pink)' : '1px solid var(--border-glass)',
                  background: layout === '2x6-strip-pair' ? 'rgba(244,63,94,0.15)' : 'var(--bg-tertiary)',
                  color: layout === '2x6-strip-pair' ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                2x6인치 2줄
                <div style={{ fontSize: '0.7rem', fontWeight: 400, opacity: 0.7, marginTop: '2px' }}>시그니처 4컷</div>
              </button>

              <button
                onClick={() => setLayout('2x2-grid')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: layout === '2x2-grid' ? '2px solid var(--accent-neon-pink)' : '1px solid var(--border-glass)',
                  background: layout === '2x2-grid' ? 'rgba(244,63,94,0.15)' : 'var(--bg-tertiary)',
                  color: layout === '2x2-grid' ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                2x2 엽서 그리드
                <div style={{ fontSize: '0.7rem', fontWeight: 400, opacity: 0.7, marginTop: '2px' }}>모던 레이아웃</div>
              </button>
            </div>
          </div>

          {/* 2. Frame Color Swatches */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-muted)' }}>
              <Palette size={18} color="var(--accent-neon-pink)" /> 프레임 테마 선택
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {FRAME_COLORS.map(c => {
                const isActive = frameColor === c.value;
                return (
                  <div
                    key={c.value}
                    onClick={() => setFrameColor(c.value)}
                    className={`color-swatch ${isActive ? 'active' : ''} ${c.value === 'checkerboard' ? 'checker-pattern' : c.value === 'y2k-silver' ? 'silver-pattern' : ''}`}
                    style={{
                      backgroundColor: c.value.startsWith('#') ? c.value : undefined
                    }}
                    title={c.name}
                  />
                );
              })}
            </div>
            <div style={{ marginTop: '16px' }}>
              <label className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '12px', border: '1px dashed var(--accent-neon-cyan)', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.05)', width: '100%' }}>
                <Upload size={16} color="var(--accent-neon-cyan)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {customFrameName ? `커스텀: ${customFrameName.substring(0, 16)}...` : '커스텀 PNG 프레임 업로드'}
                </span>
                <input
                  type="file"
                  accept="image/png"
                  onChange={handleCustomFrameUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* 3. Photo Filters */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-muted)' }}>
              <Sliders size={18} color="var(--accent-neon-purple)" /> 사진 필터 선택
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '99px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: filter === f.id ? 'var(--gradient-neon)' : 'var(--bg-tertiary)',
                    color: filter === f.id ? '#ffffff' : 'var(--text-muted)',
                    border: 'none'
                  }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Custom Footer Text */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>
              <Type size={18} /> 하단 문구 입력
            </label>
            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="예: 인생네컷 • 홍대점"
              maxLength={28}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-glass)',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 600,
                textAlign: 'center'
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <button
              onClick={handleProceed}
              className="btn-primary"
              style={{ width: '100%', padding: '16px' }}
            >
              <QrCode size={20} /> 완료 & QR 코드 생성
            </button>
            <button
              onClick={onBack}
              className="btn-secondary"
              style={{ width: '100%' }}
            >
              <ArrowLeft size={16} /> 사진 다시 찍기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
