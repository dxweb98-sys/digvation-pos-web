import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '../cn';

export interface SplashScreenProps {
  onFinish?: () => void;
  minDuration?: number;
  title?: ReactNode;
  subtitle?: ReactNode;
  mark?: ReactNode;
}
export function SplashScreen({ onFinish, minDuration = 1800, title = 'DIGVENT.', subtitle = 'Inventory Management System', mark = 'D.' }: SplashScreenProps) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (!onFinish) return;
    const leaveTimer = setTimeout(() => setLeaving(true), minDuration);
    const finishTimer = setTimeout(onFinish, minDuration + 500);
    return () => { clearTimeout(leaveTimer); clearTimeout(finishTimer); };
  }, [minDuration, onFinish]);
  return <div className={cn('fixed inset-0 z-[99999] grid place-items-center bg-[var(--color-background)] transition-opacity duration-500', leaving && 'opacity-0')}><div className={cn('flex flex-col items-center transition-all duration-700 ease-out', leaving && '-translate-y-5 scale-95 opacity-0')}><div className="relative mb-6"><div className="flex size-16 items-center justify-center rounded-2xl bg-[var(--color-brand)] text-2xl font-bold tracking-tight text-white shadow-lg shadow-blue-500/20">{mark}</div><div className="absolute inset-0 animate-ping rounded-2xl bg-[var(--color-brand)]/20 [animation-duration:2s]" /></div><h1 className="mb-2 text-3xl font-bold tracking-tight text-[var(--color-text)]">{title}</h1>{subtitle ? <p className="mb-8 text-sm text-[var(--color-text-muted)]">{subtitle}</p> : null}<div className="flex gap-1.5">{[0,1,2].map((index) => <span key={index} className="size-2 rounded-full bg-[var(--color-brand)]" style={{ animation: 'splash-dot 1.4s ease-in-out infinite', animationDelay: `${index * 0.2}s` }} />)}</div></div></div>;
}

