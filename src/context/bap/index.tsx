import { Hash, PrivateKey, PublicKey } from '@bsv/sdk';
import { BAP } from 'bsv-bap';
import { head } from 'lodash';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDispatch } from 'react-redux';
import { FetchStatus } from '../../utils/common';
import { useLocalStorage } from '../../utils/storage';
import { useHandcash } from '../handcash';

const BapContext = React.createContext(undefined);

const BapProvider = (props) => {
  const [identity, setIdentity] = useState(
    localStorage.getItem('bitchat-nitro._bapid'),
  );
  const [decIdentity, setDecIdentity] = useState();
  const [bapProfile, setBapProfile] = useLocalStorage(profileStorageKey);
  const [bapProfileStatus, setBapProfileStatus] = useState(FetchStatus.Loading);
  const [loadIdentityStatus, setLoadIdentityStatus] = useState(
    FetchStatus.Idle,
  );
  const { authToken, hcEncrypt, hcDecrypt, decryptStatus } = useHandcash();

  useEffect(() => {
    const fire = async () => {
      let id: { xprv: string; ids?: { idKey: string }[] } | undefined;
      if (authToken) {
        id = await hcDecrypt(identity);
      } else {
        id = identity;
      }
      if (!id) return;

      const bapId = new BAP(id.xprv);
      if (id.ids) {
        bapId.importIds(id.ids);
      }
      const bid = head(bapId.listIds());
      id.bapId = bid;
      setDecIdentity(id);
    };

    if (identity && decryptStatus === FetchStatus.Idle && !decIdentity) {
      fire();
    }
  }, [identity, hcDecrypt, decryptStatus, decIdentity, authToken]);

  const isValidIdentity = useCallback((decryptedIdString: string) => {
    const decIdentity = JSON.parse(decryptedIdString);

    let bapId: BAP | undefined;
    try {
      bapId = new BAP(decIdentity.xprv);
    } catch (e) {
      console.error(e);
      return false;
    }
    if (bapId && decIdentity.ids) {
      bapId.importIds(decIdentity.ids);
    } else {
      return false;
    }

    const ids = bapId.listIds();
    const idy = bapId.getId(ids[0]);

    if (!idy) {
      return false;
    }
    return true;
  }, []);

  const onFileChange = useCallback(
    async (e) => {
      setLoadIdentityStatus(FetchStatus.Loading);
      const file = head(e.target.files);
      const text = await toText(file);

      if (!isValidIdentity(text)) {
        setLoadIdentityStatus(FetchStatus.Error);
        return;
      }

      try {
        if (authToken) {
          const encryptedData = await hcEncrypt(JSON.parse(text));
          setIdentity(encryptedData);
        } else {
          alert('ToDo: Handle encrypt / decrypt with panda');
          return;
        }
        setLoadIdentityStatus(FetchStatus.Success);
      } catch (_e) {
        setLoadIdentityStatus(FetchStatus.Error);
      }
    },
    [isValidIdentity, authToken, hcEncrypt],
  );

  const getIdentity = useCallback(async () => {
    if (bapProfile) {
      return bapProfile;
    }
    setBapProfileStatus(FetchStatus.Loading);

    const payload = {
      idKey: '',
    };
    const _res = await fetch('https://bap-api.com/v1/getIdentity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const resp = { idKey: 'something' };
    setBapProfileStatus(FetchStatus.Success);
    setBapProfile(resp);
    return resp;
  }, [bapProfile, setBapProfile]);

  const value = useMemo(
    () => ({
      identity,
      setIdentity,
      decIdentity,
      getIdentity,
      bapProfileStatus,
      bapProfile,
      onFileChange,
      loadIdentityStatus,
    }),
    [
      identity,
      getIdentity,
      decIdentity,
      bapProfileStatus,
      bapProfile,
      onFileChange,
      loadIdentityStatus,
    ],
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
    throw new Error('useBap must be used within an BapProvider');
  }
  return context;
};

export { BapProvider, useBap };

//
// Utils
//

const profileStorageKey = 'nitro__BapProvider_profile';

const toText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
