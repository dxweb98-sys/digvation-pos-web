export type InputSize = 'sm' | 'md' | 'lg';

export const INPUT_SIZE_STYLES: Record<
  InputSize,
  {
    input: string;
    label: string;
    icon: string;
    iconLeft: string;
    iconRight: string;
    clear: string;
  }
> = {
  sm: {
    input: 'h-8 px-2 text-xs',
    label: 'text-xs',
    icon: 'size-3.5',
    iconLeft: 'left-2.5 size-3.5',
    iconRight: 'right-2',
    clear: 'right-1.5',
  },
  md: {
    input: 'h-10 px-3 text-sm',
    label: 'text-sm',
    icon: 'size-4',
    iconLeft: 'left-3 size-4',
    iconRight: 'right-2.5',
    clear: 'right-2',
  },
  lg: {
    input: 'h-12 px-4 text-base',
    label: 'text-base',
    icon: 'size-4',
    iconLeft: 'left-3.5 size-4',
    iconRight: 'right-3',
    clear: 'right-2.5',
  },
};
