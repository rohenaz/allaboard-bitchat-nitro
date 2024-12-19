import React, { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";

import { loadChannels } from "../../reducers/channelsReducer";
import Form from "./Form";
import Input from "./Input";
import Label from "./Label";
import Layout from "./Layout";
import SubmitButton from "./SubmitButton";

const SignupPage = () => {
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const dispatch = useDispatch();

  const handleSubmit = (event) => {
    event.preventDefault();
    const username = event.target.username.value;
    const password = event.target.password.value;
    let noValidationError = true;
    setUsernameError("");
    setPasswordError("");
    if (!username) {
      setUsernameError("This field is required");
      noValidationError = false;
    } else if (username.length < 2 || username.length > 32) {
      setUsernameError("Must be between 2 and 32 in length");
      noValidationError = false;
    }
    if (!password) {
      setPasswordError("This field is required");
      noValidationError = false;
    } else if (password.length < 6 || password.length > 72) {
      setPasswordError("Must be between 6 and 72 in length");
      noValidationError = false;
    }
    if (noValidationError) {
      // dispatch(signup({ username, password }));
    }
  };

  const navigate = useNavigate();
  const session = useSelector((state) => state.session);
  useEffect(() => {
    if (session.isAuthenticated) {
      // dispatch(connectSocket(session.user));
      dispatch(loadChannels());
      navigate("/channels/nitro");
    }
  }, [dispatch, navigate, session]);

  return (
    <Layout heading="Create an Account">
      <Form onSubmit={handleSubmit}>
        <span className="errorMessage" style={{ textAlign: "center" }}>
          {session.error}
        </span>
        <Label error={usernameError}>
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
        <Input type="password" name="password" error={passwordError} />
        <SubmitButton>Register</SubmitButton>
        <div>
          Already have an account? <Link to="/login">Login</Link>
        </div>
        <div>
          Want to browse without posting? <Link to="/channels">Skip Login</Link>
        </div>
      </Form>
    </Layout>
  );
};

export default SignupPage;
