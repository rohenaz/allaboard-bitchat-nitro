import React from "react";

import { Navigate } from "react-router-dom";
import { useHandcash } from "../context/handcash/index.js";
import { useRelay } from "../context/relay/index.js";

export const RequireAuth = ({ children }) => {
  const { authenticated } = useRelay();
  const { authToken } = useHandcash();

  return authenticated || authToken ? children : <Navigate to="/" />;
};
