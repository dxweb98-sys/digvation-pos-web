import { createContext, useContext, type ReactNode } from 'react';

import type { RuntimeConfig } from './runtime-config.types';

const RuntimeContext = createContext<RuntimeConfig | null>(null);

interface RuntimeProviderProps {
  config: RuntimeConfig;
  children: ReactNode;
}

export function RuntimeProvider({ config, children }: RuntimeProviderProps) {
  return <RuntimeContext.Provider value={config}>{children}</RuntimeContext.Provider>;
}

export function useRuntime(): RuntimeConfig {
  const runtime = useContext(RuntimeContext);

  if (!runtime) {
    throw new Error('RuntimeProvider is missing.');
  }

  return runtime;
}
