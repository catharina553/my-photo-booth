import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Play, Check, Grid, FlipHorizontal, Clock, Sparkles, ArrowLeft } from 'lucide-react';
import { sound } from '../utils/sound';
import type { FrameLayout } from '../utils/canvasRenderer';

interface CameraBoothProps {
  layout: FrameLayout;
  onBack: () => void;
  onComplete: (photos: string[]) => void;
}

export const CameraBooth: React.FC<CameraBoothProps> = ({ layout, onBack, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);

  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [mirrored, setMirrored] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [timerSeconds, setTimerSeconds] = useState<number>(3); // 3 seconds default

  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isCapturingSession, setIsCapturingSession] = useState<boolean>(false);
  const [currentShotIndex, setCurrentShotIndex] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState<boolean>(false);

  // Initialize camera stream
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreamActive(true);
    } catch (err: any) {
      console.error('Camera access failed:', err);
      setCameraError('카메라에 연결할 수 없습니다. 브라우저 권한을 확인하시거나 웹캠이 연결되어 있는지 확인해 주세요.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setStreamActive(false);
  };

  // Capture single frame from video element
  const takeSingleShot = (): string => {
    if (!videoRef.current || !hiddenCanvasRef.current) return '';
    const video = videoRef.current;
    const canvas = hiddenCanvasRef.current;

    // Determine target aspect ratio based on layout (matches cameraAspectRatio)
    const targetRatio = layout === '2x6-strip-pair' ? (480 / 340) : (510 / 660);

    if (targetRatio > 1) {
      canvas.width = 800;
      canvas.height = Math.round(800 / targetRatio);
    } else {
      canvas.height = 800;
      canvas.width = Math.round(800 * targetRatio);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    if (mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Object-fit cover draw video onto dynamically sized canvas
    const vRatio = video.videoWidth / video.videoHeight;
    const cRatio = canvas.width / canvas.height;
    let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;

    if (vRatio > cRatio) {
      sw = video.videoHeight * cRatio;
      sx = (video.videoWidth - sw) / 2;
    } else {
      sh = video.videoWidth / cRatio;
      sy = (video.videoHeight - sh) / 2;
    }

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  };

  const [selectedPhotoIndices, setSelectedPhotoIndices] = useState<number[]>([]);

  // Run automated 8-shot capture flow
  const startAutomatedSession = () => {
    if (!streamActive || isCapturingSession) return;
    setCapturedPhotos([]);
    setSelectedPhotoIndices([]);
    setIsCapturingSession(true);
    setCurrentShotIndex(1);
    runShotSequence(1, []);
  };

  const runShotSequence = (shotNum: number, currentList: string[]) => {
    if (shotNum > 8) {
      setIsCapturingSession(false);
      setCountdown(null);
      stopCamera();
      return;
    }

    setCurrentShotIndex(shotNum);
    let timeLeft = timerSeconds;
    setCountdown(timeLeft);
    sound.playBeep(false);

    const interval = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft > 0) {
        setCountdown(timeLeft);
        sound.playBeep(timeLeft === 1);
      } else {
        clearInterval(interval);
        setCountdown(0);
        
        // Trigger Flash & Shutter Sound
        setFlash(true);
        sound.playShutter();
        setTimeout(() => setFlash(false), 500);

        const photoData = takeSingleShot();
        const updatedList = [...currentList, photoData];
        setCapturedPhotos(updatedList);

        // Pause 1.2 seconds before next shot countdown starts
        setTimeout(() => {
          if (shotNum < 8) {
            runShotSequence(shotNum + 1, updatedList);
          } else {
            setIsCapturingSession(false);
            setCountdown(null);
            stopCamera(); // Turn off camera to save resources during photo selection
          }
        }, 1200);
      }
    }, 1000);
  };

  const handleRetakeAll = () => {
    setCapturedPhotos([]);
    setSelectedPhotoIndices([]);
    startCamera();
  };

  const cameraAspectRatio = layout === '2x6-strip-pair' ? '480 / 340' : '510 / 660';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 24px' }} className="animate-fade-in camera-booth-wrapper">
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-start' }}>
        <button onClick={onBack} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px' }}>
          <ArrowLeft size={16} /> 규격 다시 선택
        </button>
      </div>

      <div className="camera-booth-layout">
        
        {/* Left Column: Camera Viewport */}
        <div className="glass-card camera-viewport-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: capturedPhotos.length === 8 ? '100%' : (layout === '2x6-strip-pair' ? '100%' : 'calc(60vh * (510 / 660))'),
            aspectRatio: capturedPhotos.length === 8 ? undefined : cameraAspectRatio,
            maxHeight: capturedPhotos.length === 8 ? undefined : '60vh',
            margin: '0 auto',
            background: '#000',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.9)'
          }}>
            {capturedPhotos.length === 8 ? (
              <div style={{
                width: '100%',
                padding: '20px',
                background: 'var(--bg-secondary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px', textAlign: 'center', color: 'var(--text-main)' }}>
                  📸 아래 사진 중 4장을 마음에 드는 순서대로 터치해 주세요!
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', width: '100%' }}>
                  {capturedPhotos.map((photo, index) => {
                    const selIndex = selectedPhotoIndices.indexOf(index);
                    const isSelected = selIndex !== -1;
                    return (
                      <div
                        key={index}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedPhotoIndices(prev => prev.filter(i => i !== index));
                          } else if (selectedPhotoIndices.length < 4) {
                            setSelectedPhotoIndices(prev => [...prev, index]);
                          }
                        }}
                        style={{
                          position: 'relative',
                          aspectRatio: cameraAspectRatio,
                          borderRadius: '12px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: isSelected ? '4px solid var(--accent-neon-pink)' : '2px solid var(--border-glass)',
                          boxShadow: isSelected ? '0 0 15px rgba(255, 77, 128, 0.45)' : 'none',
                          transition: 'all 0.2s ease',
                          transform: isSelected ? 'scale(0.96)' : 'none'
                        }}
                      >
                        <img src={photo} alt={`Photo ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {isSelected ? (
                          <div style={{
                            position: 'absolute',
                            top: '6px',
                            left: '6px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'var(--accent-neon-pink)',
                            color: '#ffffff',
                            fontWeight: 900,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                            border: '1.5px solid #ffffff'
                          }}>
                            {selIndex + 1}
                          </div>
                        ) : (
                          <div style={{
                            position: 'absolute',
                            top: '6px',
                            left: '6px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.5)',
                            color: 'rgba(255,255,255,0.8)',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1.5px solid rgba(255,255,255,0.4)'
                          }}>
                            {index + 1}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {/* Flash screen effect */}
                {flash && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: '#ffffff',
                    zIndex: 40,
                    opacity: 0.95
                  }} className="animate-flash" />
                )}

                {/* Countdown Overlay */}
                {countdown !== null && countdown > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(244, 63, 94, 0.85)',
                    boxShadow: '0 0 20px rgba(244, 63, 94, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 30,
                    border: '2px solid #ffffff'
                  }}>
                    <div className="animate-countdown" style={{
                      fontSize: '2.4rem',
                      fontWeight: 900,
                      color: '#ffffff'
                    }}>
                      {countdown}
                    </div>
                  </div>
                )}

                {/* Video Element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: mirrored ? 'scaleX(-1)' : 'none',
                    display: streamActive ? 'block' : 'none'
                  }}
                />

                {/* Hidden canvas for capturing frame */}
                <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />

                {/* Camera Error Message */}
                {cameraError && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '30px',
                    textAlign: 'center',
                    color: 'var(--accent-neon-pink)'
                  }}>
                    <Camera size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>카메라 연결 끊김</h3>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '20px' }}>{cameraError}</p>
                    <button onClick={startCamera} className="btn-secondary">
                      <RefreshCw size={16} /> 재연결 시도
                    </button>
                  </div>
                )}

                {/* Grid Overlay */}
                {showGrid && streamActive && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gridTemplateRows: '1fr 1fr 1fr'
                  }}>
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.15)', borderBottom: '1px solid rgba(255,255,255,0.15)' }} />
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.15)', borderBottom: '1px solid rgba(255,255,255,0.15)' }} />
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }} />
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.15)', borderBottom: '1px solid rgba(255,255,255,0.15)' }} />
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.15)', borderBottom: '1px solid rgba(255,255,255,0.15)' }} />
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }} />
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.15)' }} />
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.15)' }} />
                    <div />
                  </div>
                )}

                {/* Status Header inside viewport */}
                {streamActive && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    right: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      background: 'rgba(0,0,0,0.65)',
                      backdropFilter: 'blur(8px)',
                      padding: '6px 14px',
                      borderRadius: '99px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      border: '1px solid var(--border-glass)'
                    }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isCapturingSession ? 'var(--accent-neon-pink)' : '#10b981' }} />
                      {isCapturingSession ? `촬영 진행 중 • ${currentShotIndex}/8번째 컷` : '촬영 준비 완료'}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 1. Controls Top Card (Sibling 1) */}
        <div className="glass-card controls-top-card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          {/* Action Button */}
          <div style={{ flex: '1 1 auto', minWidth: '220px' }}>
            {capturedPhotos.length < 8 ? (
              <button
                onClick={startAutomatedSession}
                disabled={!streamActive || isCapturingSession}
                className="btn-primary"
                style={{ width: '100%', padding: '10px 18px', fontSize: '0.95rem', borderRadius: '12px' }}
              >
                <Play size={16} fill="currentColor" />
                {isCapturingSession ? `순차 촬영 진행 중... (${currentShotIndex}/8)` : '📸 8컷 촬영 시작'}
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <button
                  onClick={() => {
                    const orderedPhotos = selectedPhotoIndices.map(i => capturedPhotos[i]);
                    onComplete(orderedPhotos);
                  }}
                  disabled={selectedPhotoIndices.length !== 4}
                  className="btn-primary"
                  style={{ flex: 1.5, padding: '10px 14px', borderRadius: '12px', fontSize: '0.9rem', opacity: selectedPhotoIndices.length === 4 ? 1 : 0.6 }}
                >
                  <Check size={16} /> 꾸미기 ({selectedPhotoIndices.length}/4)
                </button>
                <button
                  onClick={handleRetakeAll}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '12px', fontSize: '0.9rem' }}
                >
                  <RefreshCw size={14} /> 다시 촬영
                </button>
              </div>
            )}
          </div>

          {/* Settings Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setMirrored(!mirrored)}
                className="btn-secondary"
                disabled={isCapturingSession || capturedPhotos.length === 8}
                title="화면 좌우 반전"
                style={{ padding: '8px 12px', borderRadius: '10px', fontSize: '0.85rem' }}
              >
                <FlipHorizontal size={15} /> {mirrored ? '반전' : '기본'}
              </button>
              <button
                onClick={() => setShowGrid(!showGrid)}
                className="btn-secondary"
                disabled={isCapturingSession || capturedPhotos.length === 8}
                title="가이드 격자 토글"
                style={{ padding: '8px 12px', borderRadius: '10px', fontSize: '0.85rem' }}
              >
                <Grid size={15} /> {showGrid ? '격자' : '꺼짐'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                <Clock size={14} />
                <span>⏱️</span>
              </div>
              {[3, 5, 10].map(sec => (
                <button
                  key={sec}
                  onClick={() => setTimerSeconds(sec)}
                  disabled={isCapturingSession || capturedPhotos.length === 8}
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    background: timerSeconds === sec ? 'var(--accent-neon-cyan)' : 'var(--bg-tertiary)',
                    color: timerSeconds === sec ? '#000' : 'var(--text-main)',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Bottom Preview Slots Card (Sibling 3) */}
        <div className="glass-card preview-sidebar-card" style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ fontSize: '0.92rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} className="neon-text" /> 
            {capturedPhotos.length === 8 ? '인화할 4컷 선택 결과' : `실시간 촬영 기록 (${capturedPhotos.length}/8)`}
          </h2>
          
          {capturedPhotos.length === 8 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[0, 1, 2, 3].map((index) => {
                const selIndex = selectedPhotoIndices[index];
                const photo = selIndex !== undefined ? capturedPhotos[selIndex] : null;
                return (
                  <div key={index} style={{ aspectRatio: cameraAspectRatio, borderRadius: '12px', overflow: 'hidden', border: photo ? '2px solid var(--accent-neon-pink)' : '1.5px dashed var(--border-highlight)', background: 'var(--bg-tertiary)', position: 'relative' }}>
                    {photo ? (
                      <>
                        <img src={photo} alt={`Selected ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '6px',
                          background: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {index + 1}번 컷
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)' }}>
                        {index + 1}번
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px' }}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
                const photo = capturedPhotos[index];
                const isCurrent = isCapturingSession && currentShotIndex === index + 1;
                return (
                  <div key={index} style={{ aspectRatio: cameraAspectRatio, borderRadius: '8px', overflow: 'hidden', border: isCurrent ? '2px solid var(--accent-neon-pink)' : '1px solid var(--border-glass)', background: 'var(--bg-tertiary)', position: 'relative' }}>
                    {photo ? (
                      <img src={photo} alt={`Shot ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-subtle)' }}>
                        {isCurrent ? '●' : index + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
