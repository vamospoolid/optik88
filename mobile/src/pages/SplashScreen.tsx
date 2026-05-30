import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'logo' | 'tagline' | 'exit'>('enter');

  useEffect(() => {
    // Phase sequence: logo appears → tagline → bars fill → exit
    const t1 = setTimeout(() => setPhase('logo'),    200);
    const t2 = setTimeout(() => setPhase('tagline'), 900);
    const t3 = setTimeout(() => setPhase('exit'),   2400);
    const t4 = setTimeout(() => onFinish(),         3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onFinish]);

  return (
    <div className={`splash-root ${phase === 'exit' ? 'splash-exit' : 'splash-visible'}`}>
      {/* Animated background orbs */}
      <div className="splash-orb splash-orb-1" />
      <div className="splash-orb splash-orb-2" />
      <div className="splash-orb splash-orb-3" />

      {/* Grid overlay */}
      <div className="splash-grid" />

      {/* Center content */}
      <div className={`splash-content ${phase === 'logo' || phase === 'tagline' || phase === 'exit' ? 'splash-content-in' : ''}`}>

        {/* Lens ring animation */}
        <div className="splash-lens-wrap">
          <div className="splash-lens-ring splash-lens-ring-1" />
          <div className="splash-lens-ring splash-lens-ring-2" />
          <div className="splash-lens-ring splash-lens-ring-3" />

          {/* Logo box */}
          <div className="splash-logo-box">
            <div className="splash-logo-inner">
              <span className="splash-logo-number">88</span>
            </div>
            <div className="splash-logo-shimmer" />
          </div>
        </div>

        {/* Brand text */}
        <div className={`splash-brand ${phase === 'tagline' || phase === 'exit' ? 'splash-brand-in' : ''}`}>
          <h1 className="splash-brand-name">Optik<span>88</span></h1>
          <p className="splash-brand-tagline">Sistem POS & Rekam Medis Klinis</p>
        </div>

        {/* Loading indicator */}
        <div className={`splash-loader-wrap ${phase === 'tagline' || phase === 'exit' ? 'splash-loader-in' : ''}`}>
          <div className="splash-loader-track">
            <div className={`splash-loader-fill ${phase === 'exit' ? 'splash-loader-complete' : phase === 'tagline' ? 'splash-loader-progress' : ''}`} />
          </div>
          <span className="splash-loader-text">Memuat sistem...</span>
        </div>
      </div>

      {/* Bottom version */}
      <div className={`splash-footer ${phase === 'tagline' || phase === 'exit' ? 'splash-footer-in' : ''}`}>
        <span>v2.0</span>
        <div className="splash-dot" />
        <span>Mobile PWA</span>
        <div className="splash-dot" />
        <span>by Codenusa</span>
      </div>
    </div>
  );
}
