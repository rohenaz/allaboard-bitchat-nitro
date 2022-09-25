import React, { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";

import { useRelay } from "../../context/relay";
import { loadChannels } from "../../reducers/channelsReducer";
import Form from "./Form";
import Layout from "./Layout";
import SubmitButton from "./SubmitButton";

const LoginPage = () => {
  const { authenticate, authenticated } = useRelay();
  const dispatch = useDispatch();

  const handleSubmit = async (event) => {
    event.preventDefault();
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
    if (authenticated) {
      // dispatch(connectSocket(session.user));
      dispatch(loadChannels());
      navigate("/channels");
    }
  }, [dispatch, navigate, authenticated]);

  return (
    <Layout heading="Welcome back!">
      <Form onSubmit={handleSubmit}>
        <span className="errorMessage" style={{ textAlign: "center" }}>
          {session.error}
        </span>
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
        <SubmitButton>Login with RelayX</SubmitButton>
        <div>
          Need an account?{" "}
          <Link to="https://relayx.com/sign-up" target="_blank">
            Register
          </Link>
        </div>
      </Form>
    </Layout>
  );
};

export default LoginPage;
