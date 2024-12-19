import type React from 'react';
import { useState } from 'react';

import { head } from 'lodash';
import { FaTerminal } from 'react-icons/fa';
import { MdFiberManualRecord } from 'react-icons/md';
import styled from 'styled-components';
import { baseIcon, roundedBackground } from '../../design/mixins';

interface WrapperProps {
  color?: string;
  bgcolor?: string;
  w?: string;
  h?: string;
  border?: string;
}

interface AvatarProps extends WrapperProps {
  status?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  icon?: string;
  paymail?: string;
  size?: string;
}

const Wrapper = styled.div<WrapperProps>`
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

const GreenDot: React.FC = () => {
  return (
    <GreenDotWrapper color="#3aa55d" bgcolor="var(--background-secondary-alt)">
      <MdFiberManualRecord />
    </GreenDotWrapper>
  );
};

const CodeIcon: React.FC<WrapperProps> = ({ ...delegated }) => {
  return (
    <Wrapper color="white" {...delegated}>
      <FaTerminal />
    </Wrapper>
  );
};

export const bitfsUrl = 'https://x.bitfs.network/';
export const bicoinFilesUrl = 'https://media.bitcoinfiles.org/';

const IdentityIcon: React.FC<WrapperProps & { icon: string }> = ({
  ...delegated
}) => {
  return (
    delegated.icon && (
      <Wrapper color="white" {...delegated}>
        <img
          alt={`User avatar - ${delegated.icon}`}
          src={
            delegated.icon.startsWith('bitfs://')
              ? `${bicoinFilesUrl}${head(
                  delegated.icon.replace('bitfs://', '').split('.'),
                )}`
              : delegated.icon
          }
          {...delegated}
          style={{ borderRadius: '50%' }}
        />
      </Wrapper>
    )
  );
};

interface BitPicIconProps extends WrapperProps {
  paymail?: string;
}

const BitPicIcon: React.FC<BitPicIconProps> = ({ paymail, ...delegated }) => {
  const [imageError, setImageError] = useState(false);

  const imageUrl = paymail?.includes('handcash.io')
    ? `https://cloud.handcash.io/v2/users/profilePicture/${
        paymail.split('@')[0]
      }`
    : paymail?.includes('relayx.io')
      ? `https://a.relayx.com/u/${paymail}`
      : `https://bitpic.network/u/${paymail}`;

  return (
    <Wrapper color="white" {...delegated}>
      {imageError ? (
        <FaTerminal {...delegated} style={{ borderRadius: '50%' }} />
      ) : (
        <img
          src={imageUrl}
          alt={`User avatar for ${paymail}`}
          {...delegated}
          className="rounded-full transition"
          onError={() => setImageError(true)}
        />
      )}
    </Wrapper>
  );
};

const Avatar: React.FC<AvatarProps> = ({ status, onClick, ...delegated }) => {
  return (
    <div style={{ position: 'relative' }}>
      {status ? (
        <Container onClick={onClick}>
          {delegated.icon ? (
            <IdentityIcon
              style={{ width: delegated.w, height: delegated.h }}
              {...delegated}
            />
          ) : delegated.paymail ? (
            <BitPicIcon
              style={{ width: delegated.w, height: delegated.h }}
              {...delegated}
            />
          ) : (
            <CodeIcon {...delegated} />
          )}
          <GreenDot />
        </Container>
      ) : delegated.icon ? (
        <IdentityIcon
          style={{ width: delegated.w, height: delegated.h }}
          {...delegated}
        />
      ) : delegated.paymail ? (
        <BitPicIcon
          style={{ width: delegated.w, height: delegated.h }}
          {...delegated}
        />
      ) : (
        <CodeIcon onClick={onClick} {...delegated} />
      )}
    </div>
  );
};

export default Avatar;
