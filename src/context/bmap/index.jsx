import React, { useContext, useMemo, useCallback } from 'react';
import { API_BASE_URL } from '../../config/env';

const BmapContext = React.createContext(undefined);

const BmapProvider = (props) => {
  const notifyIndexer = useCallback((rawTx) => {
    return new Promise((resolve, reject) => {
      fetch(`${API_BASE_URL}/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rawTx }),
      })
        .then((resp) => {
          const json = resp.json();
          resolve(json);
        })
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

const useBmap = () => {
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
