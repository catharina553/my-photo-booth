import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Play, Check, Grid, FlipHorizontal, Clock, Sparkles } from 'lucide-react';
import { sound } from '../utils/sound';

interface CameraBoothProps {
  onComplete: (photos: string[]) => void;
}

export const CameraBooth: React.FC<CameraBoothProps> = ({ onComplete }) => {
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

    // Use 4:3 aspect ratio crop or native video size
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    if (mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Object-fit cover draw video onto 800x600 canvas
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

  // Run automated 4-shot capture flow
  const startAutomatedSession = () => {
    if (!streamActive || isCapturingSession) return;
    setCapturedPhotos([]);
    setIsCapturingSession(true);
    setCurrentShotIndex(1);
    runShotSequence(1, []);
  };

  const runShotSequence = (shotNum: number, currentList: string[]) => {
    if (shotNum > 4) {
      setIsCapturingSession(false);
      setCountdown(null);
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

        // Pause 1 second before next shot countdown starts
        setTimeout(() => {
          if (shotNum < 4) {
            runShotSequence(shotNum + 1, updatedList);
          } else {
            setIsCapturingSession(false);
            setCountdown(null);
          }
        }, 1200);
      }
    }, 1000);
  };

  const handleRetakeAll = () => {
    setCapturedPhotos([]);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 28px 40px' }} className="animate-fade-in camera-booth-wrapper">
      <div className="camera-booth-layout">
        {/* Main Camera Viewport */}
        <div className="glass-card camera-viewport-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1 / 1',
            background: '#000',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)'
          }}>
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

            {/* Countdown Overlay (Top-Right Neon Pink Circular Badge) */}
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
                  {isCapturingSession ? `촬영 진행 중 • ${currentShotIndex}/4번째 컷` : '촬영 준비 완료'}
                </div>
              </div>
            )}
          </div>

          {/* Camera Controls Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '20px',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setMirrored(!mirrored)}
                className="btn-secondary"
                disabled={isCapturingSession}
                title="화면 좌우 반전"
              >
                <FlipHorizontal size={18} /> {mirrored ? '좌우 반전' : '기본 화면'}
              </button>
              <button
                onClick={() => setShowGrid(!showGrid)}
                className="btn-secondary"
                disabled={isCapturingSession}
                title="가이드 격자 토글"
              >
                <Grid size={18} /> {showGrid ? '격자 켜짐' : '격자 꺼짐'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <Clock size={16} />
                <span>타이머:</span>
              </div>
              {[3, 5, 10].map(sec => (
                <button
                  key={sec}
                  onClick={() => setTimerSeconds(sec)}
                  disabled={isCapturingSession}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: timerSeconds === sec ? 'var(--accent-neon-cyan)' : 'var(--bg-tertiary)',
                    color: timerSeconds === sec ? '#000' : 'var(--text-main)',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: 4-Cut Live Progress Strip */}
        <div className="glass-card preview-sidebar-card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} className="neon-text" /> 4컷 미리보기
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            {capturedPhotos.length === 4
              ? '4장의 사진이 모두 촬영되었습니다! 프레임을 디자인해 보세요.'
              : `자동으로 4컷이 촬영됩니다. (${timerSeconds}초 타이머)`}
          </p>

          {/* 4-Cut Slots */}
          <div className="preview-slots-container">
            {[0, 1, 2, 3].map((index) => {
              const photo = capturedPhotos[index];
              const isCurrent = isCapturingSession && currentShotIndex === index + 1;

              return (
                <div key={index} className={`preview-slot ${isCurrent ? 'current' : ''}`}>
                  {photo ? (
                    <img src={photo} alt={`Shot ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span className="slot-placeholder-text">
                      {isCurrent ? `${index + 1}번째 컷 촬영 중...` : `${index + 1}번째 컷`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          {capturedPhotos.length < 4 ? (
            <button
              onClick={startAutomatedSession}
              disabled={!streamActive || isCapturingSession}
              className="btn-primary"
              style={{ width: '100%', padding: '16px' }}
            >
              <Play size={20} fill="currentColor" />
              {isCapturingSession ? '순차 촬영 진행 중...' : '4컷 촬영 시작'}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => onComplete(capturedPhotos)}
                className="btn-primary"
                style={{ width: '100%', padding: '16px' }}
              >
                <Check size={20} /> 프레임 선택 및 꾸미기
              </button>
              <button
                onClick={handleRetakeAll}
                className="btn-secondary"
                style={{ width: '100%' }}
              >
                <RefreshCw size={16} /> 전체 다시 촬영
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
