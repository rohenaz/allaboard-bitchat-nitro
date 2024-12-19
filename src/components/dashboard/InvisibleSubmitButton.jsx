import React from 'react';

import styled from 'styled-components';

export const Wrapper = styled.button.attrs((_p) => ({ type: 'submit' }))`
  display: none;
`;

const InvisibleSubmitButton = () => {
  return <Wrapper />;
};

export default InvisibleSubmitButton;
