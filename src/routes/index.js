import React from 'react';

import { Navigate } from 'react-router-dom';
import { useRelay } from '../context/relay';

export const RequireAuth = ({ children }) => {
  const { authenticated } = useRelay();
  return authenticated ? children : <Navigate to="/" />;
};
