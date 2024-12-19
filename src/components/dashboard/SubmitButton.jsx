import React from 'react';
import { RiArrowRightCircleFill } from 'react-icons/ri';

import styled from 'styled-components';

export const Wrapper = styled.button.attrs((_p) => ({ type: 'submit' }))`
  border-radius: 100%;
`;

const SubmitButton = () => {
  return (
    <Wrapper>
      <RiArrowRightCircleFill className="w-8 h-8" />
    </Wrapper>
  );
};

export default SubmitButton;
