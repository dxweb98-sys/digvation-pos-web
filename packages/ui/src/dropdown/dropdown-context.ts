import { createContext, useContext } from 'react';

export interface DropdownContextValue {
  close: () => void;
  open: boolean;
}

export const DropdownContext = createContext<DropdownContextValue | null>(null);

export function useDropdown(): DropdownContextValue {
  const context = useContext(DropdownContext);
  if (!context) throw new Error('useDropdown must be used inside Dropdown');
  return context;
}

export function useDropdownClose(): (() => void) | null {
  return useContext(DropdownContext)?.close ?? null;
}
