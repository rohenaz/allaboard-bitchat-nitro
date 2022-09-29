import React, { useCallback, useContext, useMemo } from "react";
import { lsTest, useLocalStorage } from "../../utils/storage";

const HandcashContext = React.createContext(undefined);

const HandcashProvider = (props) => {
  const [profile, setProfile] = useLocalStorage(profileStorageKey);
  const [authToken, setAuthToken] = useLocalStorage(authTokenStorageKey);

  const getProfile = useCallback(async () => {
    // Test localStorage is accessible
    if (!lsTest()) {
      throw new Error("localStorage is not available");
    }

    // if we dont have the paymail, get it
    if (authToken) {
      try {
        const resp = await fetch(
          `https://us-central1-bitchat-discord.cloudfunctions.net/hcProfile`,
          {
            method: "POST",
            headers: {
              "Content-type": "application/json",
            },
            body: JSON.stringify({ authToken }),
          }
        );
        const { publicProfile } = await resp.json();
        console.log({ publicProfile });
        setProfile(publicProfile);
        return publicProfile;
      } catch (e) {
        console.error(e);
        return;
      }
    }
  }, [authToken, setProfile]);

  const value = useMemo(
    () => ({
      setProfile,
      profile,
      getProfile,
      authToken,
      setAuthToken,
    }),
    [authToken, profile, setProfile, getProfile, setAuthToken]
  );

  return (
    <>
      <HandcashContext.Provider value={value} {...props} />
    </>
  );
};

const useHandcash = () => {
  const context = useContext(HandcashContext);
  if (context === undefined) {
    throw new Error("useHandcash must be used within an HandcashProvider");
  }
  return context;
};

export { HandcashProvider, useHandcash };

//
// Utils
//

const profileStorageKey = "nitro__HandcashProvider_profile";
const authTokenStorageKey = "nitro__HandcashProvider_authToken";

// Full profile
// {
//   publicProfile: {
//      id: "5f15c31c3c177d003028eb97",
//      handle: "BrandonC",
//      paymail: "BrandonC@handcash.io",
//      bitcoinUnit: "BSV",
//      displayName: "DuroMane.",
//      avatarUrl: "https://handcash.io/avatar/7d399a0c-22cf-40cf-b162-f5511a4645db",
//      localCurrencyCode: "USD",
//      createdAt: '2020-11-27T16:02:34.171Z'
//   },
//   privateProfile: {
//      phoneNumber: "+11234567891",
//      email: "Brandon@gmail.com"
//   }
// }
