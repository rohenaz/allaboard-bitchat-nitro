import React, {
  useContext,
  useMemo,
  useCallback,
  type PropsWithChildren,
} from 'react';
import { API_BASE_URL } from '../../config/constants';

interface BmapContextType {
  notifyIndexer: (rawTx: string) => Promise<unknown>;
}

const BmapContext = React.createContext<BmapContextType | undefined>(undefined);

const BmapProvider = (props: PropsWithChildren) => {
  const notifyIndexer = useCallback((rawTx: string) => {
    return new Promise((resolve, reject) => {
      fetch(`${API_BASE_URL}/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rawTx }),
      })
        .then((resp) => resp.json())
        .then((json) => resolve(json))
        .catch((e) => {
          reject(new Error('Failed to notify indexer', e));
        });
    });
  }, []);

  const value = useMemo(
    () => ({
      notifyIndexer,
    }),
    [notifyIndexer],
  );

  return <BmapContext.Provider value={value} {...props} />;
};

const useBmap = (): BmapContextType => {
  const context = useContext(BmapContext);
  if (context === undefined) {
    throw new Error('useBmap must be used within an BmapProvider');
  }
  return context;
};

export { BmapProvider, useBmap };

//
// Utils
//
