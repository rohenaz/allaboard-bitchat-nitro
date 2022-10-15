import { head } from "lodash";
import React, { useCallback, useContext, useMemo } from "react";
import { useLocalStorage } from "../../utils/storage";
import { useHandcash } from "../handcash";

const BapContext = React.createContext(undefined);

const BapProvider = (props) => {
  const [identity, setIdentity] = useLocalStorage(idStorageKey);
  // const [profile, setProfile] = useLocalStorage(profileStorageKey);

  const { authToken, hcEncrypt } = useHandcash();

  const onFileChange = useCallback(
    async (e) => {
      /*Selected files data can be collected here.*/
      console.log(e.target.files);

      // const encryptedData = localStorage.getItem("bitchat-nitro._bapid");

      const file = head(e.target.files);
      const text = await toText(file);

      console.log({ text, authToken });
      // encrypt the uploaded file and store it locally
      if (authToken) {
        // handcash
        const encryptedData = await hcEncrypt(JSON.parse(text));
        console.log({ encryptedData });
        setIdentity(encryptedData);
      }
    },
    [authToken, hcEncrypt, setIdentity]
  );

  const value = useMemo(
    () => ({
      identity,
      setIdentity,
      // profile,
      // setProfile,
      onFileChange,
    }),
    [identity, setIdentity, onFileChange]
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
// const profileStorageKey = "nitro__BapProvider_profile";

const toText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
