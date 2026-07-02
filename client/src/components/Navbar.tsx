import React, { useState } from 'react';
import { Camera, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { sound } from '../utils/sound';

interface NavbarProps {
  currentStep: 'capture' | 'customize' | 'share';
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentStep, onReset }) => {
  const [muted, setMuted] = useState(sound.isMuted());

  const handleToggleSound = () => {
    const newState = sound.toggleMute();
    setMuted(newState);
  };

  return (
    <header className="glass-card no-print" style={{
      margin: '16px auto',
      maxWidth: '1280px',
      padding: '16px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: '16px',
      zIndex: 50
    }}>
      <div 
        onClick={onReset}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
      >
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'var(--gradient-neon)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 4px 15px rgba(244, 63, 94, 0.4)'
        }}>
          <Camera size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, lineHeight: 1.1 }}>
            LIFE <span className="neon-text">4</span> CUTS
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.15em', fontWeight: 600 }}>
            스튜디오 포토부스
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <StepBadge step={1} label="1. 사진 촬영" active={currentStep === 'capture'} done={currentStep !== 'capture'} />
        <div style={{ width: '20px', height: '2px', background: 'var(--border-glass)' }} />
        <StepBadge step={2} label="2. 프레임 꾸미기" active={currentStep === 'customize'} done={currentStep === 'share'} />
        <div style={{ width: '20px', height: '2px', background: 'var(--border-glass)' }} />
        <StepBadge step={3} label="3. 인쇄 & 공유" active={currentStep === 'share'} done={false} />
      </div>

      {/* Sound & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={handleToggleSound}
          className="btn-secondary"
          style={{ padding: '10px 14px', borderRadius: '12px' }}
          title={muted ? '소리 켜기' : '소리 끄기'}
        >
          {muted ? <VolumeX size={18} color="var(--text-muted)" /> : <Volume2 size={18} color="var(--accent-neon-cyan)" />}
        </button>
      </div>
    </header>
  );
};

const StepBadge: React.FC<{ step: number; label: string; active: boolean; done: boolean }> = ({ label, active, done }) => {
  return (
    <div style={{
      padding: '8px 16px',
      borderRadius: '99px',
      fontSize: '0.85rem',
      fontWeight: 700,
      background: active ? 'var(--gradient-neon)' : done ? 'var(--bg-tertiary)' : 'transparent',
      color: active ? '#ffffff' : done ? 'var(--accent-neon-pink)' : 'var(--text-subtle)',
      border: active ? 'none' : `1px solid ${done ? 'rgba(244,63,94,0.3)' : 'var(--border-glass)'}`,
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }}>
      {done && <Sparkles size={14} />}
      {label}
    </div>
  );
};
