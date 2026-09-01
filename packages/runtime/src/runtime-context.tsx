import { createContext, useContext, useEffect, type ReactNode } from 'react';

import type { RuntimeConfig } from './runtime-config.types';

const RuntimeContext = createContext<RuntimeConfig | null>(null);

interface RuntimeProviderProps {
  config: RuntimeConfig;
  children: ReactNode;
}

export function RuntimeProvider({ config, children }: RuntimeProviderProps) {
  useEffect(() => {
    const root = document.documentElement;
    const previousAccent = root.style.getPropertyValue('--color-brand');

    if (config.branding.accentColor) {
      root.style.setProperty('--color-brand', config.branding.accentColor);
    }

    return () => {
      if (previousAccent) {
        root.style.setProperty('--color-brand', previousAccent);
      } else {
        root.style.removeProperty('--color-brand');
      }
    };
  }, [config.branding.accentColor]);

  return <RuntimeContext.Provider value={config}>{children}</RuntimeContext.Provider>;
}

export function useRuntime(): RuntimeConfig {
  const runtime = useContext(RuntimeContext);

  if (!runtime) {
    throw new Error('RuntimeProvider is missing.');
  }

  return runtime;
}
