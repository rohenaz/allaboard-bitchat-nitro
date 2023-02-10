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

export const bitfsUrl = "https://x.bitfs.network/";
export const bicoinFilesUrl = "https://media.bitcoinfiles.org/";

const IdentityIcon = ({ ...delegated }) => {
  return (
    delegated.icon && (
      <Wrapper color="white" {...delegated}>
        <img
          src={
            delegated.icon.startsWith("bitfs://")
              ? `${bicoinFilesUrl}${head(
                  delegated.icon.replace("bitfs://", "").split(".")
                )}`
              : delegated.icon
          }
          {...delegated}
          style={{ borderRadius: "50%" }}
        />
      </Wrapper>
    )
  );
};

const BitPicIcon = ({ ...delegated }) => {
  return (
    <Wrapper color="white" {...delegated}>
      <img
        src={
          delegated.paymail?.includes("handcash.io")
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
          {delegated.icon ? (
            <IdentityIcon
              width={delegated.w}
              height={delegated.h}
              {...delegated}
            />
          ) : delegated.paymail ? (
            <BitPicIcon
              width={delegated.w}
              height={delegated.h}
              {...delegated}
            />
          ) : (
            <CodeIcon {...delegated} />
          )}
          <GreenDot />
        </Container>
      ) : delegated.icon ? (
        <IdentityIcon width={delegated.w} height={delegated.h} {...delegated} />
      ) : delegated.paymail ? (
        <BitPicIcon width={delegated.w} height={delegated.h} {...delegated} />
      ) : (
        <CodeIcon onClick={onClick} {...delegated} />
      )}
    </div>
  );
};

export default Avatar;
