import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CameraBooth } from './components/CameraBooth';
import { PhotoEditor } from './components/PhotoEditor';
import { ShareModal } from './components/ShareModal';
import { SharePage } from './components/SharePage';

export type BoothStep = 'capture' | 'customize' | 'share';

export const App: React.FC = () => {
  const [step, setStep] = useState<BoothStep>('capture');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [finishedCanvas, setFinishedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [shareParamId, setShareParamId] = useState<string | null>(null);

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
    setStep('capture');
  };

  // If mobile user scanned QR code, show clean SharePage
  if (shareParamId) {
    return <SharePage photoId={shareParamId} />;
  }

  return (
    <div className="app-container">
      <Navbar currentStep={step} onReset={handleReset} />

      <main style={{ marginTop: '16px' }}>
        {step === 'capture' && (
          <CameraBooth
            onComplete={(photos) => {
              setCapturedPhotos(photos);
              setStep('customize');
            }}
          />
        )}

        {step === 'customize' && (
          <PhotoEditor
            photos={capturedPhotos}
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
