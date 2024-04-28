import React from "react";

import { Navigate } from "react-router-dom";
import { useHandcash } from "../context/handcash";
import { usePanda } from "../context/panda";

export const RequireAuth = ({ children }) => {
  const { authToken } = useHandcash();
  const { connected } = usePanda();

  return connected && authToken ? children : <Navigate to="/" />;
};
