import React from "react";

import { Navigate } from "react-router-dom";
import { useHandcash } from "../context/handcash";
import { useYours } from "../context/yours";

export const RequireAuth = ({ children }) => {
  const { authToken } = useHandcash();
  const { connected } = useYours();

  return connected && authToken ? children : <Navigate to="/" />;
};
