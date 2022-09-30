import React, { useContext, useMemo } from "react";
import { useLocalStorage } from "../../utils/storage";

const BapContext = React.createContext(undefined);

const BapProvider = (props) => {
  const [identity, setIdentity] = useLocalStorage(idStorageKey);

  const value = useMemo(
    () => ({
      identity,
      setIdentity,
    }),
    [identity, setIdentity]
  );

  return (
    <>
      <BapContext.Provider value={value} {...props} />
    </>
  );
};

const useBap = () => {
  const context = useContext(BapContext);
  if (context === undefined) {
    throw new Error("useBap must be used within an BapProvider");
  }
  return context;
};

export { BapProvider, useBap };

//
// Utils
//

const idStorageKey = "nitro__BapProvider_id";
