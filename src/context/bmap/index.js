import React, { useCallback, useContext, useMemo } from "react";

const BmapContext = React.createContext(undefined);

const BmapProvider = (props) => {
  const notifyIndexer = useCallback((rawTx) => {
    return new Promise((resolve, reject) => {
      fetch("https://bmap-api-production.up.railway.app/ingest", {
        // `https://b.map.sv/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rawTx }),
      })
        .then((tx) =>
          tx
            .json()
            .then(resolve)
            .catch((e) => reject(e))
        )
        .catch((e) => reject(e));
    });
  }, []);

  const value = useMemo(
    () => ({
      notifyIndexer,
    }),
    [notifyIndexer]
  );

  return (
    <>
      <BmapContext.Provider value={value} {...props} />
    </>
  );
};

const useBmap = () => {
  const context = useContext(BmapContext);
  if (context === undefined) {
    throw new Error("useBmap must be used within an BmapProvider");
  }
  return context;
};

export { BmapProvider, useBmap };

//
// Utils
//
