import { Global } from '@emotion/react';

import tw, { GlobalStyles as BaseStyles } from 'twin.macro';

const customStyles = {
  body: {
    ...tw`antialiased`,
  },
};

export const GlobalStyles = () => (
  <>
    <BaseStyles />
    <Global styles={customStyles} />
  </>
);
