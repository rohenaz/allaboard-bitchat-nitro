import React from 'react';

import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

const Wrapper = styled((p) => (
  <Tooltip classes={{ popper: p.className }} {...p} />
))`
  & .MuiTooltip-tooltip {
    background-color: var(--popover);
    color: var(--popover-foreground);
    font-size: 14px;
    padding: 10px;
  }

  & .MuiTooltip-arrow {
    color: var(--popover);
  }
`;

const ArrowTooltip = ({ children, ...delegated }) => {
  return (
    <Wrapper {...delegated} arrow>
      <div>{children}</div>
    </Wrapper>
  );
};

export default ArrowTooltip;
