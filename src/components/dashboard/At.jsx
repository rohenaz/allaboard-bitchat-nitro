import React from "react";

import { FaAt } from "react-icons/fa";
import styled from "styled-components";

import { baseIcon, roundedBackground } from "../../design/mixins";

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  ${baseIcon};
  color: ${(p) => p.color || "var(--text-muted)"};
  ${(p) => p.bgColor && roundedBackground};
`;

const At = ({ ...delegated }) => {
  return (
    <Wrapper {...delegated}>
      <FaAt />
    </Wrapper>
  );
};

export default At;
