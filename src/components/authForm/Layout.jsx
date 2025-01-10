import React from 'react';

const Layout = ({ heading, children }) => {
  return (
    <div className="min-h-screen w-full bg-base-200 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-2xl shadow-xl max-w-md w-full p-8 flex flex-col items-center">
        <div className="mb-8 text-center">
          <img 
            src="/images/logo-noBgColor.svg" 
            alt="BitChat Logo" 
            className="w-48 h-auto mx-auto" 
          />
          <h1 className="uppercase text-xs font-semibold text-base-content tracking-[0.2em] text-primary-content/50">{heading}</h1>
        </div>
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
