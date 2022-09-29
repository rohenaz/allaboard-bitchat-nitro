import React from "react";

import { head } from "lodash";
import { FaTerminal } from "react-icons/fa";
import { MdFiberManualRecord } from "react-icons/md";
import styled from "styled-components";
import { baseIcon, roundedBackground } from "../../design/mixins";

const Wrapper = styled.div`
  ${baseIcon};
  ${roundedBackground};
`;

export const GreenDotWrapper = styled(Wrapper)`
  padding: 0.5px;
  height: 16px;
  width: 16px;
  position: absolute;
  right: -4px;
  bottom: -4px;
`;

const Container = styled.div`
  position: relative;
`;

const GreenDot = () => {
  return (
    <GreenDotWrapper color="#3aa55d" bgColor="var(--background-secondary-alt)">
      <MdFiberManualRecord />
    </GreenDotWrapper>
  );
};

const CodeIcon = ({ ...delegated }) => {
  return (
    <Wrapper color="white" {...delegated}>
      <FaTerminal />
    </Wrapper>
  );
};

const BitPicIcon = ({ ...delegated }) => {
  return (
    <Wrapper color="white" {...delegated}>
      <img
        src={
          delegated.paymail.includes("handcash.io")
            ? `https://cloud.handcash.io/v2/users/profilePicture/${head(
                delegated.paymail.split("@")
              )}`
            : `https://bitpic.network/u/${delegated.paymail}`
        }
        {...delegated}
        style={{ borderRadius: "50%" }}
      />
    </Wrapper>
  );
};

const Avatar = ({ status, onClick, ...delegated }) => {
  return (
    <div style={{ position: "relative" }}>
      {status ? (
        <Container onClick={onClick}>
          {delegated.paymail ? (
            <BitPicIcon width={delegated.w} {...delegated} />
          ) : (
            <CodeIcon {...delegated} />
          )}
          <GreenDot />
        </Container>
      ) : delegated.paymail ? (
        <BitPicIcon width={delegated.w} {...delegated} />
      ) : (
        <CodeIcon onClick={onClick} {...delegated} />
      )}
    </div>
  );
};

export default Avatar;
