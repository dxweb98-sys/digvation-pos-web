import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '../cn';

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio({ className, ...props }, ref) {
  return <input ref={ref} type="radio" className={cn('size-4 accent-[var(--color-brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/20', className)} {...props} />;
});
