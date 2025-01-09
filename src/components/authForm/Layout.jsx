import React from 'react';
import NitroIcon from '../icons/NitroIcon';

const Layout = ({ heading, children }) => {
  return (
    <div className="min-h-screen w-full bg-base-200 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-2xl shadow-xl max-w-md w-full p-8 flex flex-col items-center">
        <div className="mb-8 text-center">
          <NitroIcon className="w-24 h-24 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-semibold text-base-content">{heading}</h1>
        </div>
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
