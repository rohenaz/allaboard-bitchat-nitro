import { head } from "lodash";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useActiveUser } from "../../hooks";
import { FetchStatus } from "../../utils/common";
import { useLocalStorage } from "../../utils/storage";
import { useHandcash } from "../handcash";
const { BAP } = require("bitcoin-bap");

const BapContext = React.createContext(undefined);

const BapProvider = (props) => {
  const [identity, setIdentity] = useLocalStorage(idStorageKey);
  const [decIdentity, setDecIdentity] = useState();
  const [bapProfile, setBapProfile] = useLocalStorage(profileStorageKey);
  const [bapProfileStatus, setBapProfileStatus] = useState(FetchStatus.Loading);
  const { authToken, hcEncrypt, hcDecrypt, decryptStatus } = useHandcash();
  const session = useSelector((state) => state.session);
  const activeUser = useActiveUser();
  const dispatch = useDispatch();

  useEffect(() => {
    const fire = async () => {
      const id = await hcDecrypt(identity);

      let bapId = new BAP(id.xprv);
      // console.log("BAP id", id.xprv);
      if (id.ids) {
        bapId.importIds(id.ids);
      }
      let bid = head(bapId.listIds());
      // console.log({ bid });
      id.bapId = bid;
      setDecIdentity(id);
    };

    if (identity && decryptStatus === FetchStatus.Idle && !decIdentity) {
      // console.log("FIRE");
      fire();
    }
  }, [
    dispatch,
    identity,
    hcDecrypt,
    decryptStatus,
    decIdentity,
    setDecIdentity,
  ]);

  const onFileChange = useCallback(
    async (e) => {
      /*Selected files data can be collected here.*/
      console.log(e.target.files);

      // const encryptedData = localStorage.getItem("bitchat-nitro._bapid");

      const file = head(e.target.files);
      const text = await toText(file);

      // console.log({ text, authToken });
      // encrypt the uploaded file and store it locally
      if (authToken) {
        // handcash
        const encryptedData = await hcEncrypt(JSON.parse(text));
        // console.log({ encryptedData });
        setIdentity(encryptedData);
      }
    },
    [authToken, hcEncrypt, setIdentity]
  );

  const getIdentity = useCallback(async () => {
    if (bapProfile) {
      return bapProfile;
    }
    setBapProfileStatus(FetchStatus.Loading);
    console.log("get identity");

    const payload = {
      idKey: ``,
    };
    const res = await fetch(`https://bap-api.com/v1/getIdentity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const resp = { idKey: "something" };
    setBapProfileStatus(FetchStatus.Success);
    setBapProfile(resp);
    return resp;
  }, [bapProfileStatus, bapProfile]);

  const value = useMemo(
    () => ({
      identity,
      setIdentity,
      decIdentity,
      setDecIdentity,
      getIdentity,
      bapProfileStatus,
      bapProfile,
      onFileChange,
    }),
    [
      identity, // encrypted identity file
      getIdentity,
      decIdentity,
      setDecIdentity,
      bapProfileStatus,
      setIdentity,
      onFileChange,
      bapProfile,
    ]
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
const profileStorageKey = "nitro__BapProvider_profile";

const toText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
