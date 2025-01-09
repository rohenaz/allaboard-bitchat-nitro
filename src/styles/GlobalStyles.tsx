import { Global } from '@emotion/react';

const customStyles = {
  body: {
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
};

export const GlobalStyles = () => (
  <>
    <Global styles={customStyles} />
  </>
);
