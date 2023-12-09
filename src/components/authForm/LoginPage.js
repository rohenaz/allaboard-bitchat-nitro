import { PandaIcon, usePandaWallet } from "panda-wallet-provider";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { useBap } from "../../context/bap";
import { useHandcash } from "../../context/handcash";
import { loadChannels } from "../../reducers/channelsReducer";
import HandcashIcon from "../icons/HandcashIcon";
import Form from "./Form";
import Label from "./Label";
import Layout from "./Layout";
import SubmitButton from "./SubmitButton";

const LoginPage = () => {
  const { isReady, connect, isConnected } = usePandaWallet();
  const [pandaAuth, setPandaAuth] = useState();

  const { setAuthToken, profile, getProfile } = useHandcash();
  const dispatch = useDispatch();
  const { identity } = useBap();
  const [selectedWallet, setSelectedWallet] = useState("handcash");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has("authToken")) {
      let token = searchParams.get("authToken");
      setAuthToken(token);
      getProfile();
    }
  }, [getProfile, setAuthToken]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      // if (identity) {
      //   dispatch(login({ identity }));
      // }
      if (event.target.wallet.value === "handcash") {
        window.location.href = "https://api.bitchatnitro.com/hcLogin";
        return;
      }

      if (event.target.wallet.value === "panda") {
        if (!isReady) {
          window.open(
            "https://chromewebstore.google.com/detail/panda-wallet/mlbnicldlpdimbjdcncnklfempedeipj",
            "_blank"
          );
          return;
        }
        const connected = await isConnected();
        console.log({ connected });
        if (connected) {
          setPandaAuth(true);
          return;
        }
        const keys = await connect();

        if (keys) {
          // setPubKeys(keys);
          setPandaAuth(true);
          console.log(keys.bsvPubKey);
          console.log(keys.ordPubKey);
        }

        return;
      }
      // const username = event.target.username.value;
      // const password = event.target.password.value;
      // if (!username) {
      //   setUsernameError("This field is required");
      // }
      // if (!password) {
      //   setPasswordError("This field is required");
      // }
      // if (username && password) {

      // setUsernameError("");
      // setPasswordError("");
    },
    [identity, isReady, connect]
  );

  const navigate = useNavigate();
  const session = useSelector((state) => state.session);
  useEffect(() => {
    if (profile || pandaAuth) {
      // dispatch(connectSocket(session.user));

      dispatch(loadChannels());
      navigate("/channels/nitro");
    }
  }, [dispatch, navigate, profile, pandaAuth, isConnected]);

  const walletChanged = useCallback((e) => {
    setSelectedWallet(e.target.value);
  }, []);

  return (
    <Layout heading="Welcome back!">
      <Form onSubmit={handleSubmit}>
        <span className="errorMessage" style={{ textAlign: "center" }}>
          {session.error}
        </span>
        <Label htmlFor="handcash">
          <input
            type="radio"
            name="wallet"
            id="handcash"
            value="handcash"
            style={{ marginRight: ".5rem" }}
            onChange={walletChanged}
            checked={selectedWallet === "handcash"}
          />
          Handcash
        </Label>
        <Label htmlFor="panda">
          <input
            type="radio"
            name="wallet"
            id="panda"
            value="panda"
            onChange={walletChanged}
            style={{ marginRight: ".5rem" }}
            checked={selectedWallet === "panda"}
          />
          Panda
        </Label>

        {/* <Label error={usernameError}>
          Username
          {usernameError && (
            <span className="errorMessage"> - {usernameError}</span>
          )}
        </Label>
        <Input type="text" name="username" error={usernameError} />
        <Label error={passwordError}>
          Password
          {passwordError && (
            <span className="errorMessage"> - {passwordError}</span>
          )}
        </Label>
        <Input type="password" name="password" error={passwordError} /> */}
        <SubmitButton
          bgcolor={
            selectedWallet === "handcash"
              ? "#2fac69"
              : selectedWallet === "panda"
              ? "rgba(154, 224, 133, 0.25)"
              : "rgb(88, 101, 242)"
          }
          bgcolorhover={
            selectedWallet === "handcash"
              ? "#08a350"
              : selectedWallet === "panda"
              ? "rgba(154, 224, 133, 0.1)"
              : "rgb(71, 82, 196)"
          }
        >
          {selectedWallet === "handcash" ? (
            <HandcashIcon style={{ width: "1rem", marginRight: "1rem" }} />
          ) : selectedWallet === "panda" ? (
            <div className="mr-3">
              <PandaIcon size={"1rem"} />
            </div>
          ) : (
            <></>
          )}
          {`Login with ${
            selectedWallet === "handcash"
              ? "Handcash"
              : selectedWallet === "panda"
              ? "Panda"
              : ""
          }`}
        </SubmitButton>
        <div>
          Need an account?{" "}
          <a
            href={
              selectedWallet === "panda"
                ? "https://chromewebstore.google.com/detail/panda-wallet/mlbnicldlpdimbjdcncnklfempedeipj"
                : "https://app.handcash.io/"
            }
            target="_blank"
          >
            Register
          </a>
        </div>
        <div>
          {" "}
          <a href={`/channels`}>Continue as guest (read only)</a>
        </div>
      </Form>
    </Layout>
  );
};

export default LoginPage;
