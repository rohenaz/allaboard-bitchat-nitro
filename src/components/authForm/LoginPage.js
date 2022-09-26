import React, { useCallback, useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

import { useRelay } from "../../context/relay";
import { loadChannels } from "../../reducers/channelsReducer";
import HandcashIcon from "../icons/HandcashIcon";
import RelayIcon from "../icons/RelayIcon";
import Form from "./Form";
import Label from "./Label";
import Layout from "./Layout";
import SubmitButton from "./SubmitButton";

const LoginPage = () => {
  const { authenticate, authenticated } = useRelay();
  const dispatch = useDispatch();
  const [selectedWallet, setSelectedWallet] = useState("handcash");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has("authToken")) {
      let token = searchParams.get("authToken");
      console.log("auth token set!", token);
      localStorage.setItem("bitchat-nitro.hc-auth-token", token);
      // '056e924727f26304ca920683db9facc378d824d336d3d819fbbf96c490b6c640'
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (event.target.wallet.value === "handcash") {
      window.location.href = "https://bitchatnitro.com/hclogin";
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
    try {
      await authenticate();
      console.log("authenticated");
    } catch (e) {
      console.error("Failed to authenticate", e);
    }
    // dispatch(login({ username, password }));
    // setUsernameError("");
    // setPasswordError("");
    // }
  };

  const navigate = useNavigate();
  const session = useSelector((state) => state.session);
  useEffect(() => {
    let authToken = localStorage.getItem("bitchat-nitro.hc-auth-token");

    if (authenticated || authToken) {
      // dispatch(connectSocket(session.user));
      dispatch(loadChannels());
      navigate("/channels");
    }
  }, [dispatch, navigate, authenticated]);

  const walletChanged = useCallback((e) => {
    setSelectedWallet(e.target.value);
  }, []);

  return (
    <Layout heading="Welcome back!">
      <Form onSubmit={handleSubmit}>
        <span className="errorMessage" style={{ textAlign: "center" }}>
          {session.error}
        </span>
        <Label for="handcash">
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
        <Label for="relayx">
          <input
            type="radio"
            name="wallet"
            id="relayx"
            value="relayx"
            onChange={walletChanged}
            style={{ marginRight: ".5rem" }}
            checked={selectedWallet === "relayx"}
          />
          RelayX
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
            selectedWallet === "handcash" ? "#2fac69" : "rgb(88, 101, 242)"
          }
          bgcolorhover={
            selectedWallet === "handcash" ? "#08a350" : "rgb(71, 82, 196)"
          }
        >
          {selectedWallet === "handcash" ? (
            <HandcashIcon style={{ width: "1rem", marginRight: "1rem" }} />
          ) : (
            <RelayIcon style={{ width: "1rem", marginRight: "1rem" }} />
          )}
          {`Login with ${
            selectedWallet === "handcash" ? "Handcash" : "RelayX"
          }`}
        </SubmitButton>
        <div>
          Need an account?{" "}
          <a
            href={
              selectedWallet === "relayx"
                ? "https://relayx.com/sign-up"
                : "https://app.handcash.io/"
            }
            target="_blank"
          >
            Register
          </a>
        </div>
      </Form>
    </Layout>
  );
};

export default LoginPage;
