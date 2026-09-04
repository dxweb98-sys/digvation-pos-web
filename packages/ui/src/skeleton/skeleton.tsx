import type { CSSProperties, HTMLAttributes } from 'react';
import { cn } from '../cn';

export type SkeletonRounded = 'sm' | 'md' | 'lg' | 'full';
const roundedClasses: Record<SkeletonRounded, string> = { sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', full: 'rounded-full' };

interface SkeletonBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  width?: string | number;
  height?: string | number;
  rounded?: SkeletonRounded;
}
function SkeletonBlock({ className, width, height, rounded = 'md', style, ...props }: SkeletonBlockProps) {
  const dimensions: CSSProperties = {
    ...style,
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
  };
  return <div className={cn('animate-pulse bg-[var(--color-surface-muted)]', roundedClasses[rounded], className)} style={dimensions} {...props} />;
}

export interface SkeletonProps extends SkeletonBlockProps { count?: number; }
export function Skeleton({ height = 16, count = 1, ...props }: SkeletonProps) {
  return <>{Array.from({ length: count }).map((_, index) => <SkeletonBlock key={index} {...props} height={height} />)}</>;
}
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) { return <div className="space-y-3"><div className="flex gap-4">{Array.from({ length: cols }).map((_, i) => <Skeleton key={i} height={14} width={i === 0 ? '30%' : '20%'} />)}</div>{Array.from({ length: rows }).map((_, r) => <div key={r} className="flex gap-4 border-b border-[var(--color-border)]/50 py-3">{Array.from({ length: cols }).map((_, c) => <Skeleton key={c} height={12} width={c === 0 ? '30%' : '20%'} />)}</div>)}</div>; }
export function CardSkeleton() { return <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"><Skeleton height={12} width="40%"/><Skeleton height={28} width="60%"/><Skeleton height={10} width="80%"/></div>; }
export function FormSkeleton({ fields = 4 }: { fields?: number }) { return <div className="space-y-5">{Array.from({ length: fields }).map((_, i) => <div key={i} className="space-y-2"><Skeleton height={12} width="25%"/><Skeleton height={40} width="100%" rounded="lg"/></div>)}</div>; }

