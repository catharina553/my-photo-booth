import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CameraBooth } from './components/CameraBooth';
import { PhotoEditor } from './components/PhotoEditor';
import { ShareModal } from './components/ShareModal';
import { SharePage } from './components/SharePage';
import { Columns, Layout, Sparkles } from 'lucide-react';
import type { FrameLayout } from './utils/canvasRenderer';

export type BoothStep = 'layout' | 'capture' | 'customize' | 'share';

export const App: React.FC = () => {
  const [step, setStep] = useState<BoothStep>('layout');
  const [layout, setLayout] = useState<FrameLayout>('2x6-strip-pair');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [finishedCanvas, setFinishedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [shareParamId, setShareParamId] = useState<string | null>(null);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
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
    setFinishedCanvas(null);
    setStep('layout');
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
          <div style={{ maxWidth: '800px', margin: '60px auto 40px', padding: '0 24px' }} className="animate-fade-in">
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
                원하는 사진 배치를 선택해 주세요. 촬영 비율이 규격에 맞게 자동 최적화됩니다.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {/* Option 1: 2x6 strip pair */}
              <div 
                onClick={() => {
                  setLayout('2x6-strip-pair');
                  setStep('capture');
                }}
                className="glass-card" 
                style={{ 
                  padding: '32px', 
                  borderRadius: '24px', 
                  cursor: 'pointer', 
                  transition: 'all 0.3s ease',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-neon-pink)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(244, 63, 94, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-glass)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '16px', 
                  background: 'rgba(244, 63, 94, 0.1)', 
                  color: 'var(--accent-neon-pink)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <Columns size={32} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>2x6 세로 4컷</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
                  가장 대중적인 세로형 4컷 스트립 규격입니다. 두 줄로 나뉘어 출력하기에 용이합니다. (가로형 사진)
                </p>
                <div style={{ 
                  padding: '8px 16px', 
                  borderRadius: '12px', 
                  background: 'var(--bg-tertiary)', 
                  fontSize: '0.8rem', 
                  fontWeight: 700,
                  color: 'var(--accent-neon-pink)'
                }}>
                  가로 4 : 세로 3 촬영 비율
                </div>
              </div>

              {/* Option 2: 2x2 grid postcard */}
              <div 
                onClick={() => {
                  setLayout('2x2-grid');
                  setStep('capture');
                }}
                className="glass-card" 
                style={{ 
                  padding: '32px', 
                  borderRadius: '24px', 
                  cursor: 'pointer', 
                  transition: 'all 0.3s ease',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-neon-cyan)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(6, 182, 212, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-glass)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '16px', 
                  background: 'rgba(6, 182, 212, 0.1)', 
                  color: 'var(--accent-neon-cyan)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <Layout size={32} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>2x2 엽서 그리드</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
                  4x6 인치 엽서 크기 규격입니다. 시원한 2행 2열 배치로 인쇄 및 소장에 유리합니다. (세로형 사진)
                </p>
                <div style={{ 
                  padding: '8px 16px', 
                  borderRadius: '12px', 
                  background: 'var(--bg-tertiary)', 
                  fontSize: '0.8rem', 
                  fontWeight: 700,
                  color: 'var(--accent-neon-cyan)'
                }}>
                  가로 3 : 세로 4 촬영 비율
                </div>
              </div>
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

        {step === 'customize' && (
          <PhotoEditor
            photos={capturedPhotos}
            layout={layout}
            onBack={() => setStep('capture')}
            onFinish={(canvas) => {
              setFinishedCanvas(canvas);
              setStep('share');
            }}
          />
        )}

        {step === 'share' && finishedCanvas && (
          <ShareModal
            canvas={finishedCanvas}
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
