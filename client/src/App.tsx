import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CameraBooth } from './components/CameraBooth';
import { PhotoUploader } from './components/PhotoUploader';
import { PhotoEditor } from './components/PhotoEditor';
import { ShareModal } from './components/ShareModal';
import { SharePage } from './components/SharePage';
import { Sparkles, Camera, Upload, ArrowLeft } from 'lucide-react';
import type { FrameLayout } from './utils/canvasRenderer';

export type BoothStep = 'mode' | 'layout' | 'capture' | 'upload' | 'customize' | 'share';

export const App: React.FC = () => {
  const [step, setStep] = useState<BoothStep>('mode');
  const [mode, setMode] = useState<'capture' | 'upload'>('capture');
  const [layout, setLayout] = useState<FrameLayout>('2x6-strip-pair');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [frameColor, setFrameColor] = useState<string>('#ffffff');
  const [finishedCanvas, setFinishedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [shareParamId, setShareParamId] = useState<string | null>(null);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light'; // Default to light mode for clean white/gray look
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    // Check if opened via QR code share link (?share=ID)
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    if (shareId) {
      setShareParamId(shareId);
    }
  }, []);

  const handleReset = () => {
    setCapturedPhotos([]);
    setFrameColor('#ffffff');
    setFinishedCanvas(null);
    setStep('mode');
  };

  // If mobile user scanned QR code, show clean SharePage
  if (shareParamId) {
    return <SharePage photoId={shareParamId} />;
  }

  return (
    <div className="app-container">
      <Navbar currentStep={step} onReset={handleReset} theme={theme} toggleTheme={toggleTheme} />

      <main style={{ marginTop: '16px' }}>
        {step === 'layout' && (
          <div style={{ maxWidth: '800px', margin: '40px auto 40px', padding: '0 24px' }} className="animate-fade-in">
            {/* Back to mode selection */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '24px' }}>
              <button 
                onClick={() => setStep('mode')} 
                className="btn-secondary" 
                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', borderRadius: '12px' }}
              >
                <ArrowLeft size={16} /> 이전 단계로 (모드 선택)
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '99px',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)',
                marginBottom: '16px'
              }}>
                <Sparkles size={16} className="neon-text" />
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-muted)' }}>뽀토부스</span>
              </div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '12px' }}>
                프레임 규격 선택
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                원하는 사진 배치를 선택해 주세요. 비율이 규격에 맞게 자동 최적화됩니다.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {/* Option 1: 4컷 세로 스트립 (2장 세트) */}
              <div 
                onClick={() => {
                  setLayout('2x6-strip-pair');
                  setStep(mode === 'capture' ? 'capture' : 'upload');
                }}
                className="glass-card" 
                style={{ 
                  padding: '36px 28px', 
                  borderRadius: '24px', 
                  cursor: 'pointer', 
                  transition: 'all 0.3s ease',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-neon-pink)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(244, 63, 94, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-glass)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {/* Visual Mockup for 4-Cut Strip */}
                <div style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #fbcfe8, #fda4af)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  marginBottom: '24px',
                  boxShadow: '0 8px 16px rgba(244, 63, 94, 0.15)'
                }}>
                  {/* Left Film Strip */}
                  <div style={{
                    width: '34px',
                    height: '108px',
                    background: '#111115',
                    borderRadius: '4px',
                    padding: '4px 2px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transform: 'rotate(-10deg) translateX(-14px)',
                    position: 'absolute',
                    zIndex: 2
                  }}>
                    {[1, 2, 3, 4].map(idx => (
                      <div key={idx} style={{ width: '28px', height: '20px', background: '#fff', borderRadius: '1.5px', opacity: 0.95 }} />
                    ))}
                    <div style={{ width: '12px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px', marginTop: '1px' }} />
                  </div>
                  {/* Right Film Strip */}
                  <div style={{
                    width: '34px',
                    height: '108px',
                    background: '#111115',
                    borderRadius: '4px',
                    padding: '4px 2px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transform: 'rotate(10deg) translateX(14px)',
                    position: 'absolute',
                    zIndex: 1
                  }}>
                    {[1, 2, 3, 4].map(idx => (
                      <div key={idx} style={{ width: '28px', height: '20px', background: '#fff', borderRadius: '1.5px', opacity: 0.95 }} />
                    ))}
                    <div style={{ width: '12px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px', marginTop: '1px' }} />
                  </div>
                </div>

                <h3 style={{ fontSize: '1.45rem', fontWeight: 900, marginBottom: '10px', color: 'var(--text-main)' }}>4컷 세로 스트립 (2장 세트)</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '24px', minHeight: '66px' }}>
                  포토부스에서 출력되는 길쭉한 4컷 스트립 2장 세트입니다. 가로형 사진에 적합하며, 한 장씩 나눠 가지기 좋습니다.
                </p>
                <div style={{ 
                  display: 'inline-block',
                  padding: '8px 24px', 
                  borderRadius: '99px', 
                  background: 'rgba(244, 63, 94, 0.08)', 
                  fontSize: '0.85rem', 
                  fontWeight: 800,
                  color: 'var(--accent-neon-pink)'
                }}>
                  가로 사진 4매
                </div>
              </div>

              {/* Option 2: 2x2 엽서 프레임 (1장) */}
              <div 
                onClick={() => {
                  setLayout('2x2-grid');
                  setStep(mode === 'capture' ? 'capture' : 'upload');
                }}
                className="glass-card" 
                style={{ 
                  padding: '36px 28px', 
                  borderRadius: '24px', 
                  cursor: 'pointer', 
                  transition: 'all 0.3s ease',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-neon-cyan)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(6, 182, 212, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-glass)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {/* Visual Mockup for Postcard Frame */}
                <div style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #a7f3d0, #22d3ee)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  marginBottom: '24px',
                  boxShadow: '0 8px 16px rgba(6, 182, 212, 0.15)'
                }}>
                  {/* Miniature Postcard Container */}
                  <div style={{
                    width: '78px',
                    height: '110px',
                    background: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
                    padding: '8px 6px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    border: '1px solid rgba(255,255,255,0.8)'
                  }}>
                    {/* 2x2 slots inside mockup */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '4px',
                      height: '76px'
                    }}>
                      {[1, 2, 3, 4].map(idx => (
                        <div key={idx} style={{ background: '#e2e8f0', borderRadius: '2px', opacity: 0.9 }} />
                      ))}
                    </div>
                    {/* Tiny decorative bottom */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fbbf24', opacity: 0.9 }} />
                      <div style={{ width: '42px', height: '5px', background: '#94a3b8', borderRadius: '1px', opacity: 0.8 }} />
                    </div>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.45rem', fontWeight: 900, marginBottom: '10px', color: 'var(--text-main)' }}>2x2 엽서 프레임 (1장)</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '24px', minHeight: '66px' }}>
                  4x6 인치 엽서 크기 프레임에 세로형 사진 4장을 배치합니다. 시원한 크기로 소장에 유리합니다.
                </p>
                <div style={{ 
                  display: 'inline-block',
                  padding: '8px 24px', 
                  borderRadius: '99px', 
                  background: 'rgba(6, 182, 212, 0.08)', 
                  fontSize: '0.85rem', 
                  fontWeight: 800,
                  color: 'var(--accent-neon-cyan)'
                }}>
                  세로 사진 4매
                </div>
              </div>
            </div>
          </div>
        )}
        {step === 'mode' && (
          <div style={{ maxWidth: '800px', margin: '40px auto 0', padding: '0 20px 40px' }} className="animate-fade-in">
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 20px',
                borderRadius: '99px',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)',
                marginBottom: '16px'
              }}>
                <Sparkles size={18} className="neon-text" />
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-muted)' }}>아뉴스 포토부스</span>
              </div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '12px' }}>
                오늘의 소중한 순간을 담아보세요 📸
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto', lineHeight: 1.5 }}>
                부스 카메라를 이용해 즉석에서 촬영하거나, 스마트폰/컴퓨터 안의 사진을 업로드해 인생네컷 프레임과 합성하세요.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '28px',
              marginBottom: '40px'
            }}>
              {/* Option 1: Instant Capture */}
              <div
                onClick={() => {
                  setMode('capture');
                  setStep('layout');
                }}
                className="glass-card hover-scale"
                style={{
                  padding: '40px 32px',
                  borderRadius: '24px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-glass)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #ff4d80 0%, #ff80b3 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
                  boxShadow: '0 10px 20px rgba(255,77,128,0.3)'
                }}>
                  <Camera size={32} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>📸 즉석 카메라 촬영</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                  부스 전면 카메라를 기동하여 6장 중 4장을 촬영하고 실시간 움직이는 타임랩스 영상을 만듭니다.
                </p>
              </div>

              {/* Option 2: Upload Files */}
              <div
                onClick={() => {
                  setMode('upload');
                  setStep('layout');
                }}
                className="glass-card hover-scale"
                style={{
                  padding: '40px 32px',
                  borderRadius: '24px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-glass)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #a855f7 0%, #d8b4fe 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
                  boxShadow: '0 10px 20px rgba(168,85,247,0.3)'
                }}>
                  <Upload size={32} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>📁 내 사진 파일 업로드</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                  이미 찍어둔 소중한 사진 4장을 내 컴퓨터나 스마트폰에서 불러와 인생네컷 템플릿과 정교하게 합성합니다.
                </p>
              </div>
            </div>

            {/* Bottom guide notice */}
            <div className="glass-card" style={{
              padding: '16px 24px',
              borderRadius: '16px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.4)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              border: '1px solid rgba(0,0,0,0.03)'
            }}>
              🚨 <b>촬영 및 합성 시 문제가 발생하면:</b> 즉시 화면 하단 문의처 혹은 관리인에게 안내를 요청해 주시기 바랍니다.
            </div>
          </div>
        )}

        {step === 'capture' && (
          <CameraBooth
            layout={layout}
            onBack={() => setStep('layout')}
            onComplete={(photos) => {
              setCapturedPhotos(photos);
              setStep('customize');
            }}
          />
        )}

        {step === 'upload' && (
          <PhotoUploader
            onBack={() => setStep('layout')}
            onFinish={(photos) => {
              setCapturedPhotos(photos);
              setStep('customize');
            }}
          />
        )}

        {step === 'customize' && (
          <PhotoEditor
            photos={capturedPhotos}
            layout={layout}
            onBack={() => setStep(mode === 'capture' ? 'capture' : 'upload')}
            onFinish={(canvas, color) => {
              setFinishedCanvas(canvas);
              setFrameColor(color);
              setStep('share');
            }}
          />
        )}

        {step === 'share' && finishedCanvas && (
          <ShareModal
            canvas={finishedCanvas}
            layout={layout}
            frameColor={frameColor}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Hidden area used for clean 4x6 printing */}
      <div id="print-area" />
    </div>
  );
};

export default App;
