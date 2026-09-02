import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface CashierSessionContextValue {
  selectedLocationId: string | null;
  recentSaleIds: readonly string[];
  selectLocation: (locationId: string | null) => void;
  rememberSale: (saleId: string) => void;
}

const CashierSessionContext = createContext<CashierSessionContextValue | null>(null);
const MAX_RECENT_SALES = 8;

export function CashierSessionProvider({ children }: { children: ReactNode }) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [recentSaleIds, setRecentSaleIds] = useState<readonly string[]>([]);

  const selectLocation = useCallback((locationId: string | null) => {
    setSelectedLocationId(locationId);
  }, []);

  const rememberSale = useCallback((saleId: string) => {
    setRecentSaleIds((current) =>
      [saleId, ...current.filter((currentSaleId) => currentSaleId !== saleId)].slice(
        0,
        MAX_RECENT_SALES,
      ),
    );
  }, []);

  const value = useMemo(
    () => ({ selectedLocationId, recentSaleIds, selectLocation, rememberSale }),
    [recentSaleIds, rememberSale, selectLocation, selectedLocationId],
  );

  return <CashierSessionContext.Provider value={value}>{children}</CashierSessionContext.Provider>;
}

export function useCashierSession(): CashierSessionContextValue {
  const value = useContext(CashierSessionContext);

  if (!value) {
    throw new Error('CashierSessionProvider is missing.');
  }

  return value;
}
