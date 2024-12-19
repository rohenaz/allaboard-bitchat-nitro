import React, { type FC } from 'react';
import { useNavigate } from 'react-router-dom';

export const SignupPage: FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Sign Up</h1>
      {/* Add signup form here */}
    </div>
  );
};
